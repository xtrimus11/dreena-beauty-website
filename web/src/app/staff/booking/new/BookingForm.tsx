"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBooking,
  createWalkInAction,
  searchCustomersAction,
  type NewGuestPayload,
} from "@/lib/appointments/actions";
import { shopInstant } from "@/lib/appointments/time";
import { canPerform } from "@/lib/appointments/availability";
import type { TurnCandidate } from "@/lib/appointments/rotation";
import type { BookingSource, StandardSlot, Staff, Treatment } from "@/lib/appointments/types";

type Customer = Awaited<ReturnType<typeof searchCustomersAction>>[number];

interface PartyMember {
  key: string;
  /** Set for the person the booking is under. Null for a family member, who
   *  is identified by relationship alone — "Lim + daughter" is how the shop
   *  takes it, and inventing a name would invent data. */
  customer: Customer | null;
  relationship: string;
  treatmentId: string;
  durationMinutes: number;
  /** "" = not yet decided; filled in on the day from the turn order. */
  therapistId: string;
  notes: string;
}

const SOURCES: { value: BookingSource; label: string }[] = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referral" },
];

let seq = 0;
const newMember = (therapistId = ""): PartyMember => ({
  key: `m${seq++}`,
  customer: null,
  relationship: "",
  treatmentId: "",
  durationMinutes: 30,
  therapistId,
  notes: "",
});

export default function BookingForm({
  date,
  initialTime,
  initialTherapistId,
  treatments,
  staff,
  restrictions,
  slots,
  turnOrder,
  opensAt,
  closesAt,
  todayIso,
}: {
  date: string;
  initialTime: string;
  /** Set when the booking was started by tapping a therapist's column in the
   *  grid — otherwise blank, meaning "by turn". */
  initialTherapistId: string;
  treatments: Treatment[];
  staff: Staff[];
  restrictions: { staffId: string; treatmentId: string }[];
  slots: StandardSlot[];
  turnOrder: TurnCandidate[];
  opensAt: string;
  closesAt: string;
  todayIso: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [contact, setContact] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({ fullName: "", phone: "" });
  const [creating, setCreating] = useState(false);

  const [time, setTime] = useState(initialTime);
  const [source, setSource] = useState<BookingSource>("walk_in");
  const [notes, setNotes] = useState("");
  const [party, setParty] = useState<PartyMember[]>([newMember(initialTherapistId)]);
  const [error, setError] = useState<string | null>(null);

  const nextUp = turnOrder.find((c) => c.unavailable === null);
  // Only today's turn order means anything; a week out it is guesswork.
  const isToday = date === todayIso;

  async function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchCustomersAction(value));
    } finally {
      setSearching(false);
    }
  }

  function pickContact(c: Customer) {
    setContact(c);
    setResults([]);
    setQuery("");
    // The person who booked is the first person being treated, unless staff
    // change it — the common case is one customer booking for themselves.
    setParty((p) => (p.length ? [{ ...p[0], customer: c }, ...p.slice(1)] : [{ ...newMember(), customer: c }]));
  }

  /** Nobody found by name or phone means a walk-in with no course, which is
   *  exactly what a W number is for — so it is allocated automatically rather
   *  than asked for. */
  /** `name` is passed in rather than read from state: the field falls back to
   *  the search text for display, and setState has not flushed by the time
   *  the click handler runs — so reading state here saw an empty name. */
  async function createWalkIn(name: string, phone: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("A name is required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await createWalkInAction({ fullName: trimmed, phone });
      if (!res.ok || !res.customerId) {
        setError(res.error ?? "Could not save the customer.");
        return;
      }
      pickContact({
        id: res.customerId,
        customerCode: res.customerCode ?? null,
        customerType: "walk_in",
        fullName: trimmed,
        phone: phone.trim() || null,
        preferredTherapistId: null,
        preferredTherapistStrict: false,
        primaryContactId: null,
        notes: null,
      });
      setNewWalkIn({ fullName: "", phone: "" });
    } finally {
      setCreating(false);
    }
  }

  function update(key: string, patch: Partial<PartyMember>) {
    setParty((p) => p.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function pickTreatment(key: string, treatmentId: string) {
    const t = treatments.find((x) => x.id === treatmentId);
    // No treatment chosen is normal — the shop books a name into a slot and
    // often nothing more. One 30-minute slot is the default length.
    update(key, { treatmentId, durationMinutes: t?.durationMinutes ?? 30 });
  }

  /** Who may perform this treatment. Decided by the explicit flag on each
   *  staff row — never by absence from `restrictions`, which would turn a
   *  failed read into full permission for everyone. */
  function allowedStaff(treatmentId: string): Staff[] {
    if (!treatmentId) return staff;
    return staff.filter((s) => canPerform(s, treatmentId, restrictions));
  }

  function submit() {
    setError(null);
    if (!contact) return setError("Choose who the booking is for.");

    const guests: NewGuestPayload[] = [];
    for (const m of party) {
      // Treatment, duration and name are all optional for a family member.
      // Only the relationship identifies them.
      if (!m.customer && !m.relationship.trim()) {
        return setError("A family member needs a relationship — daughter, husband, and so on.");
      }

      guests.push({
        customerId: m.customer?.id,
        relationship: m.customer ? undefined : m.relationship.trim(),
        treatmentId: m.treatmentId || null,
        therapistId: m.therapistId || null,
        startsAt: shopInstant(date, time).toISOString(),
        durationMinutes: m.durationMinutes || 30,
        notes: m.notes.trim() || undefined,
      });
    }

    startTransition(async () => {
      const res = await createBooking({
        contactCustomerId: contact.id,
        source,
        notes: notes.trim() || undefined,
        guests,
      });
      if (!res.ok) return setError(res.error ?? "Could not save the booking.");
      router.push(`/staff/day/${date}`);
      router.refresh();
    });
  }

  return (
    <div className="mt-5 space-y-5">
      {/* Who it's for ------------------------------------------------- */}
      <section className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">Customer</h2>

        {contact ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              {contact.customerCode && (
                <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                  {contact.customerCode}
                </span>
              )}
              <span className="font-semibold">{contact.fullName}</span>
              {contact.phone && <span className="text-sm text-[#8e8e8e]">{contact.phone}</span>}
              {contact.customerType === "walk_in" && (
                <span className="text-[11px] uppercase tracking-wide text-[#8a6f4f]">no course</span>
              )}
            </div>
            <button onClick={() => setContact(null)} className="text-sm underline underline-offset-2">
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search by code, phone or name — e.g. 0666, W1187, 012…"
              className="w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2.5 outline-none focus:border-[#8a6f4f]"
            />
            {searching && <p className="mt-2 text-sm text-[#8e8e8e]">Searching…</p>}

            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-[rgba(10,10,10,0.07)] rounded-lg border border-[rgba(10,10,10,0.1)]">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => pickContact(c)}
                      className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-[#faf9f6]"
                    >
                      {c.customerCode && (
                        <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                          {c.customerCode}
                        </span>
                      )}
                      <span className="font-medium">{c.fullName}</span>
                      <span className="text-sm text-[#8e8e8e]">{c.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Not found means a walk-in with no course. Reception types the
                name and phone; the W number is allocated for them. */}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="mt-3 rounded-lg bg-[#faf9f6] p-3">
                <p className="text-sm font-medium">
                  Nobody found — add them as a walk-in?
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={newWalkIn.fullName || query}
                    onChange={(e) => setNewWalkIn({ ...newWalkIn, fullName: e.target.value })}
                    placeholder="Name"
                    className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
                  />
                  <input
                    value={newWalkIn.phone}
                    onChange={(e) => setNewWalkIn({ ...newWalkIn, phone: e.target.value })}
                    placeholder="Phone"
                    className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
                  />
                </div>
                <button
                  disabled={creating}
                  onClick={() => createWalkIn(newWalkIn.fullName || query, newWalkIn.phone)}
                  className="mt-2 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {creating ? "Adding…" : "Add walk-in"}
                </button>
                <p className="mt-1.5 text-[12px] text-[#8e8e8e]">
                  Gets the next W number automatically.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* When --------------------------------------------------------- */}
      <section className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">Time</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Standard slots are one-tap defaults, never a restriction — odd
              hours are normal and the free-text field always accepts them. */}
          {slots.map((s) => (
            <button
              key={s.id}
              onClick={() => setTime(s.startsAt)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                time === s.startsAt
                  ? "bg-[#0a0a0a] font-semibold text-white"
                  : "border border-[rgba(10,10,10,0.16)]"
              }`}
            >
              {s.startsAt}
            </button>
          ))}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 tabular-nums outline-none"
          />
          <span className="text-[13px] text-[#8e8e8e]">
            open {opensAt}–{closesAt}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={`rounded-full px-3 py-1 text-[13px] ${
                source === s.value
                  ? "bg-[#f1efe9] font-semibold"
                  : "border border-[rgba(10,10,10,0.14)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Who's being treated ------------------------------------------ */}
      <section className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">
            People ({party.length})
          </h2>
          {party.length < 5 && (
            <button
              onClick={() => setParty((p) => [...p, newMember()])}
              className="text-sm underline underline-offset-2"
            >
              + Add family member
            </button>
          )}
        </div>

        <div className="space-y-4">
          {party.map((m, i) => {
            const treatment = treatments.find((t) => t.id === m.treatmentId);
            const options = m.treatmentId ? allowedStaff(m.treatmentId) : staff;

            return (
              <div key={m.key} className="rounded-lg border border-[rgba(10,10,10,0.1)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#8e8e8e]">
                    {i === 0 ? "Person 1" : `Person ${i + 1}`}
                  </span>
                  {i > 0 && (
                    <button
                      onClick={() => setParty((p) => p.filter((x) => x.key !== m.key))}
                      className="text-[13px] text-[#9f1239] underline underline-offset-2"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {m.customer ? (
                  <p className="mb-2 font-medium">{m.customer.fullName}</p>
                ) : (
                  <div className="mb-2">
                    <input
                      value={m.relationship}
                      onChange={(e) => update(m.key, { relationship: e.target.value })}
                      placeholder="Relationship — daughter, husband…"
                      className="w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
                    />
                    <p className="mt-1 text-[12px] text-[#8e8e8e]">
                      No name needed. Treatment and length are optional too.
                    </p>
                  </div>
                )}

                {/* A family member needs only a relationship, a therapist and
                    remarks. The treatment and length are for the named
                    customer, where they affect how the day is filled. */}
                <div className={`grid grid-cols-1 gap-2 sm:grid-cols-3 ${m.customer ? "" : "hidden"}`}>
                  <select
                    value={m.treatmentId}
                    onChange={(e) => pickTreatment(m.key, e.target.value)}
                    className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none sm:col-span-2"
                  >
                    <option value="">No treatment recorded</option>
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.code ? ` (${t.code})` : ""}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={m.durationMinutes || ""}
                      onChange={(e) => update(m.key, { durationMinutes: Number(e.target.value) })}
                      className={`w-full rounded-lg border px-3 py-2 tabular-nums outline-none ${
                        treatment?.durationIsFlexible
                          ? "border-[#b45309] bg-[#fff8ee]"
                          : "border-[rgba(10,10,10,0.16)]"
                      }`}
                    />
                    <span className="shrink-0 text-sm text-[#8e8e8e]">min</span>
                  </label>
                </div>

                {/* Waxing, 808 and Cauteliser depend on the area treated, so
                    the length is asked for rather than assumed. */}
                {treatment?.durationIsFlexible && (
                  <p className="mt-1.5 text-[12px] font-medium text-[#b45309]">
                    Length varies by area — check this before saving.
                  </p>
                )}

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={m.therapistId}
                    onChange={(e) => update(m.key, { therapistId: e.target.value })}
                    className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
                  >
                    {/* Left blank on purpose. The turn order for a future
                        date is unknowable, so the therapist is filled in on
                        the day rather than guessed now. */}
                    <option value="">
                      {isToday && nextUp ? `Not assigned — ${nextUp.displayName} is next` : "Not assigned"}
                    </option>
                    {options.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    value={m.notes}
                    onChange={(e) => update(m.key, { notes: e.target.value })}
                    placeholder="Remarks"
                    className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
                  />
                </div>

                {m.customer?.preferredTherapistId && !m.therapistId && (
                  <p className="mt-1.5 text-[12px] text-[#8a6f4f]">
                    This customer has a preferred therapist
                    {m.customer.preferredTherapistStrict ? " (strict)" : ""} — pick them rather than
                    leaving it to the turn order.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
        <label htmlFor="notes" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">
          Remarks
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 outline-none"
        />
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-[#fdf0ef] px-3 py-2.5 text-sm text-[#9f1239]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || !contact}
          className="rounded-lg bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save booking"}
        </button>
        <span className="text-[13px] text-[#8e8e8e]">
          Leave the therapist blank unless the customer asked for someone — it
          gets filled in on the day.
        </span>
      </div>
    </div>
  );
}
