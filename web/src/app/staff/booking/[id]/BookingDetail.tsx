"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignTherapist,
  cancelBooking,
  rescheduleBooking,
  setGuestStatus,
} from "@/lib/appointments/actions";
import { formatForStaff } from "@/lib/appointments/time";
import { canPerform } from "@/lib/appointments/availability";
import type { TurnCandidate } from "@/lib/appointments/rotation";
import type { AppointmentWithGuests, BookingStatus, Staff } from "@/lib/appointments/types";

// The shop tracks only three states. Nobody comes back later to mark a
// treatment finished, so "in progress" and "done" were dead buttons — and
// with them gone, ARRIVAL is what awards the turn point (migration 0005).
const FLOW: { status: BookingStatus; label: string }[] = [
  { status: "pending", label: "Booked" },
  { status: "confirmed", label: "Confirmed" },
  { status: "arrived", label: "Arrived" },
  { status: "no_show", label: "No show" },
];

export default function BookingDetail({
  booking,
  day,
  staff,
  restrictions,
  turnOrder,
  history,
}: {
  booking: AppointmentWithGuests;
  day: string;
  staff: Staff[];
  restrictions: { staffId: string; treatmentId: string }[];
  turnOrder: TurnCandidate[];
  history: { id: number; action: string; createdAt: string; actorName: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<null | "move" | "cancel">(null);
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");

  const nextUp = turnOrder.find((c) => c.unavailable === null);
  const cancelled = booking.status === "cancelled";

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "That didn't work.");
      router.refresh();
    });
  }

  /** Who may perform this treatment. Decided by the explicit flag on each
   *  staff row — never by absence from `restrictions`, which would turn a
   *  failed read into full permission for everyone. */
  /** With no treatment recorded, anyone may be assigned. */
  function allowedStaff(treatmentId: string | null): Staff[] {
    if (!treatmentId) return staff;
    return staff.filter((s) => canPerform(s, treatmentId, restrictions));
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {booking.contact.fullName}
          </h1>
          <p className="mt-1 text-sm text-[#8e8e8e]">
            <span className="tabular-nums">{booking.reference}</span> ·{" "}
            {booking.guests.length} {booking.guests.length === 1 ? "person" : "people"} ·{" "}
            {booking.source.replace("_", " ")}
            {booking.contact.phone && ` · ${booking.contact.phone}`}
          </p>
        </div>
        {cancelled && (
          <span className="rounded bg-[#fdf0ef] px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#9f1239]">
            Cancelled
          </span>
        )}
      </div>

      {booking.notes && (
        <p className="mt-3 rounded-lg bg-[#f1efe9] px-3 py-2.5 text-sm text-[#5a5a5a]">{booking.notes}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-[#fdf0ef] px-3 py-2.5 text-sm text-[#9f1239]">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {booking.guests.map((g) => {
          const options = allowedStaff(g.treatmentId);
          return (
            <div key={g.id} className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  {g.customer?.customerCode && (
                    <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                      {g.customer.customerCode}
                    </span>
                  )}
                  <span className={`font-semibold ${g.customer ? "" : "italic"}`}>
                    {g.customer?.fullName ?? g.relationship ?? "Guest"}
                  </span>
                </div>
                <span className="text-sm tabular-nums text-[#5a5a5a]">
                  {formatForStaff(g.startsAt)} – {formatForStaff(g.endsAt)}
                </span>
              </div>

              {g.treatment && <p className="mt-1 text-sm text-[#5a5a5a]">{g.treatment.name}</p>}
              {g.notes && <p className="mt-1 text-[13px] text-[#8e8e8e]">{g.notes}</p>}

              {/* Therapist ------------------------------------------- */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={g.therapistId ?? ""}
                  disabled={pending || cancelled}
                  onChange={(e) =>
                    act(() => assignTherapist(g.id, e.target.value || null, day))
                  }
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm outline-none disabled:opacity-50"
                >
                  <option value="">By turn — not yet assigned</option>
                  {options.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>

                {/* One tap takes the top of the turn order — the decision
                    made at the counter for a customer with no preference. */}
                {!g.therapistId && nextUp && !cancelled && (
                  <button
                    disabled={pending}
                    onClick={() => act(() => assignTherapist(g.id, nextUp.staffId, day))}
                    className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Assign {nextUp.displayName} (next)
                  </button>
                )}

                {g.preferenceMismatch && (
                  <span className="text-[12px] font-semibold text-[#b45309]">
                    Not their preferred therapist
                  </span>
                )}
              </div>

              {/* Status ---------------------------------------------- */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {FLOW.map((f) => (
                  <button
                    key={f.status}
                    disabled={pending || cancelled || g.status === f.status}
                    onClick={() => act(() => setGuestStatus(g.id, f.status, day))}
                    className={`rounded-lg px-2.5 py-1 text-[13px] ${
                      g.status === f.status
                        ? "bg-[#0a0a0a] font-semibold text-white"
                        : "border border-[rgba(10,10,10,0.16)] disabled:opacity-40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {g.status === "arrived" && g.therapistId && (
                <p className="mt-2 text-[12px] text-[#0f766e]">
                  Counted towards today&rsquo;s turn order.
                </p>
              )}
              {g.status === "arrived" && !g.therapistId && (
                <p className="mt-2 text-[12px] font-medium text-[#b45309]">
                  Arrived with nobody assigned — no turn point yet. Assign a therapist.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Move or cancel ---------------------------------------------
          A customer saying "I can't make it" usually means a different date,
          not a lost booking — so moving is offered first and is the primary
          action. */}
      {!cancelled && (
        <div className="mt-6 rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
          {closing === null && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#5a5a5a]">Customer can&rsquo;t make it?</span>
              <button
                onClick={() => setClosing("move")}
                className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white"
              >
                Change the date
              </button>
              <button
                onClick={() => setClosing("cancel")}
                className="text-sm text-[#9f1239] underline underline-offset-2"
              >
                Cancel instead
              </button>
            </div>
          )}

          {closing === "move" && (
            <div>
              <p className="text-sm font-semibold">Move this booking</p>
              <p className="mt-1 text-[13px] text-[#5a5a5a]">
                All {booking.guests.length}{" "}
                {booking.guests.length === 1 ? "person keeps their" : "people keep their"} time and
                length, just on the new date.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={newDate}
                  min={day}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 text-sm tabular-nums outline-none"
                />
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="min-w-[14rem] flex-1 rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={pending || !newDate}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      const res = await rescheduleBooking(booking.id, newDate, null, reason, day);
                      if (!res.ok) return setError(res.error ?? "Could not move the booking.");
                      router.push(`/staff/day/${res.newDate}`);
                      router.refresh();
                    })
                  }
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Moving…" : "Move booking"}
                </button>
                <button
                  onClick={() => setClosing(null)}
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-4 py-2 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {closing === "cancel" && (
            <div>
              <p className="text-sm font-semibold text-[#9f1239]">
                Cancel this booking for {booking.contact.fullName}?
              </p>
              <p className="mt-1 text-[13px] text-[#5a5a5a]">
                All {booking.guests.length}{" "}
                {booking.guests.length === 1 ? "person" : "people"} will be cancelled and the time
                freed up. The booking stays in the record.
              </p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason"
                className="mt-3 w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-2 text-sm outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  disabled={pending}
                  onClick={() => act(() => cancelBooking(booking.id, reason, day))}
                  className="rounded-lg bg-[#9f1239] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Cancelling…" : "Cancel booking"}
                </button>
                <button
                  onClick={() => setClosing(null)}
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-4 py-2 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes and history ------------------------------------------- */}
      <section className="mt-5 rounded-xl border border-[rgba(10,10,10,0.1)] bg-[#faf9f6] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">Notes</h2>

        {booking.cancellationReason && (
          <p className="mt-2 text-sm text-[#9f1239]">
            <span className="font-semibold">Cancelled:</span> {booking.cancellationReason}
          </p>
        )}

        {booking.notes ? (
          // Moves append a line here ("Moved from 02 Sep to 09 Sep — ...").
          <div className="mt-2 space-y-1">
            {booking.notes.split("\n").map((line, i) => (
              <p key={i} className="text-sm text-[#5a5a5a]">
                {line}
              </p>
            ))}
          </div>
        ) : (
          !booking.cancellationReason && (
            <p className="mt-2 text-sm text-[#8e8e8e]">Nothing recorded.</p>
          )
        )}

        {history.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-[rgba(10,10,10,0.08)] pt-3">
            {history.map((h) => (
              <li key={h.id} className="text-[12px] text-[#8e8e8e]">
                <span className="capitalize">{h.action}</span>
                {h.actorName ? ` by ${h.actorName}` : ""} ·{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: "Asia/Kuala_Lumpur",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(h.createdAt))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
