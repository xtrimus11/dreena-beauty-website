"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignTherapist,
  cancelBooking,
  rescheduleBooking,
  setGuestStatus,
} from "@/lib/appointments/actions";
import { canPerform } from "@/lib/appointments/availability";
import { formatForStaff } from "@/lib/appointments/time";
import type { TurnCandidate } from "@/lib/appointments/rotation";
import type { BookingStatus, Staff } from "@/lib/appointments/types";
import type { SlotEntry } from "./SlotGrid";

// The day before, a therapist WhatsApps the customer; when they reply it is
// marked Confirmed. An unconfirmed booking the day before is one to chase,
// so the two states have to be distinguishable at a glance.
const FLOW: { status: BookingStatus; label: string }[] = [
  { status: "pending", label: "Booked" },
  { status: "confirmed", label: "Confirmed" },
  { status: "arrived", label: "Arrived" },
  { status: "no_show", label: "No show" },
];

/** Opens over the sheet rather than navigating away, so the diary stays on
 *  screen — reception is usually looking at the day while on the phone. */
export default function BookingModal({
  entry,
  day,
  staff,
  restrictions,
  turnOrder,
  onClose,
}: {
  entry: SlotEntry;
  day: string;
  staff: Staff[];
  restrictions: { staffId: string; treatmentId: string }[];
  turnOrder: TurnCandidate[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "move" | "cancel">(null);
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState(day);
  const [newTime, setNewTime] = useState("");

  const { guest, booking } = entry;
  // An unnamed family member has no customer record — "Lim + daughter".
  const who = guest.customer?.fullName ?? (guest.relationship ? `${guest.relationship}` : "Guest");
  const nextUp = turnOrder.find((c) => c.unavailable === null);
  const cancelled = booking.status === "cancelled";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, close = false) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "That didn't work.");
      router.refresh();
      if (close) onClose();
    });
  }

  // Capability comes from the flag on the staff row, never from absence of
  // restriction rows. With no treatment recorded, anyone may be assigned.
  const options = guest.treatmentId
    ? staff.filter((s) => canPerform(s, guest.treatmentId as string, restrictions))
    : staff;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Booking for ${who}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              {guest.customer?.customerCode && (
                <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                  {guest.customer.customerCode}
                </span>
              )}
              <h2 className={`text-lg font-semibold ${guest.customer ? "" : "italic"}`}>{who}</h2>
            </div>
            <p className="mt-0.5 text-sm text-[#8e8e8e]">
              <span className="tabular-nums">
                {formatForStaff(guest.startsAt)} – {formatForStaff(guest.endsAt)}
              </span>
              {guest.treatment && ` · ${guest.treatment.name}`}
              {guest.customer?.phone && ` · ${guest.customer.phone}`}
            </p>
            {booking.guests.length > 1 && (
              <p className="mt-0.5 text-[12px] text-[#8a6f4f]">
                One of {booking.guests.length} in {booking.contact.fullName}&rsquo;s booking
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg px-2 py-1 text-xl leading-none text-[#8e8e8e] hover:bg-[#f1efe9]"
          >
            ×
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-[#fdf0ef] px-3 py-2 text-sm text-[#9f1239]">
            {error}
          </p>
        )}

        {!cancelled && (
          <>
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
                Therapist
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={guest.therapistId ?? ""}
                  disabled={pending}
                  onChange={(e) => act(() => assignTherapist(guest.id, e.target.value || null, day))}
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm outline-none disabled:opacity-50"
                >
                  <option value="">Not yet assigned</option>
                  {options.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
                {!guest.therapistId && nextUp && (
                  <button
                    disabled={pending}
                    onClick={() => act(() => assignTherapist(guest.id, nextUp.staffId, day))}
                    className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {nextUp.displayName} is next
                  </button>
                )}
              </div>
              {guest.preferenceMismatch && (
                <p className="mt-1.5 text-[12px] font-semibold text-[#b45309]">
                  Not their preferred therapist
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FLOW.map((f) => (
                  <button
                    key={f.status}
                    disabled={pending || guest.status === f.status}
                    onClick={() => act(() => setGuestStatus(guest.id, f.status, day))}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      guest.status === f.status
                        ? "bg-[#0a0a0a] font-semibold text-white"
                        : "border border-[rgba(10,10,10,0.16)] disabled:opacity-40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {guest.status === "confirmed" && (
                <p className="mt-1.5 text-[12px] text-[#9f1239]">
                  Customer confirmed by WhatsApp.
                </p>
              )}
              {guest.status === "arrived" && !guest.therapistId && (
                <p className="mt-1.5 text-[12px] font-medium text-[#b45309]">
                  Arrived with nobody assigned — no turn point yet.
                </p>
              )}
              {guest.status === "arrived" && guest.therapistId && (
                <p className="mt-1.5 text-[12px] text-[#0f766e]">Counted towards today&rsquo;s turn order.</p>
              )}
            </div>
          </>
        )}

        {/* Notes ---------------------------------------------------- */}
        {(booking.notes || guest.notes || booking.cancellationReason) && (
          <div className="mt-4 rounded-lg bg-[#faf9f6] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">Notes</p>
            {booking.cancellationReason && (
              <p className="mt-1 text-sm text-[#9f1239]">Cancelled: {booking.cancellationReason}</p>
            )}
            {guest.notes && <p className="mt-1 text-sm text-[#5a5a5a]">{guest.notes}</p>}
            {booking.notes?.split("\n").map((line, i) => (
              <p key={i} className="mt-1 text-sm text-[#5a5a5a]">
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Move or cancel ------------------------------------------- */}
        {!cancelled && (
          <div className="mt-4 border-t border-[rgba(10,10,10,0.08)] pt-4">
            {mode === null && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setMode("move")}
                  className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm font-medium"
                >
                  Change the date
                </button>
                <button
                  onClick={() => setMode("cancel")}
                  className="text-sm text-[#9f1239] underline underline-offset-2"
                >
                  Cancel booking
                </button>
              </div>
            )}

            {mode === "move" && (
              <div>
                <p className="text-sm font-semibold">
                  Move {booking.guests.length > 1 ? `all ${booking.guests.length} people` : "this booking"}
                </p>
                <p className="mt-0.5 text-[12px] text-[#8e8e8e]">
                  Change the day, the time, or both. Leave the time blank to keep{" "}
                  {formatForStaff(guest.startsAt)}.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[11px] uppercase tracking-wide text-[#8e8e8e]">
                    Day
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm tabular-nums normal-case tracking-normal text-[#0a0a0a] outline-none"
                    />
                  </label>
                  <label className="text-[11px] uppercase tracking-wide text-[#8e8e8e]">
                    Time (optional)
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm tabular-nums normal-case tracking-normal text-[#0a0a0a] outline-none"
                    />
                  </label>
                </div>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="mt-2 w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={pending || !newDate}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const res = await rescheduleBooking(
                          booking.id,
                          newDate,
                          newTime || null,
                          reason,
                          day,
                        );
                        if (!res.ok) return setError(res.error ?? "Could not move it.");
                        onClose();
                        router.push(`/staff/day/${res.newDate}`);
                        router.refresh();
                      })
                    }
                    className="rounded-lg bg-[#0a0a0a] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {pending ? "Moving…" : "Move"}
                  </button>
                  <button onClick={() => setMode(null)} className="px-2 text-sm underline underline-offset-2">
                    Back
                  </button>
                </div>
              </div>
            )}

            {mode === "cancel" && (
              <div>
                <p className="text-sm font-semibold text-[#9f1239]">
                  Cancel {booking.guests.length > 1 ? `all ${booking.guests.length} people?` : "this booking?"}
                </p>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason"
                  className="mt-2 w-full rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={pending}
                    onClick={() => act(() => cancelBooking(booking.id, reason, day), true)}
                    className="rounded-lg bg-[#9f1239] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? "Cancelling…" : "Cancel booking"}
                  </button>
                  <button onClick={() => setMode(null)} className="px-2 text-sm underline underline-offset-2">
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
