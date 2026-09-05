"use client";

import { formatForStaff, minutesFromMidnight, shopTime } from "@/lib/appointments/time";
import type { AppointmentWithGuests, ResolvedGuest } from "@/lib/appointments/types";

const SLOT_MINUTES = 30;

/** Each 30-minute slot holds eight boxes, laid out two rows by four columns —
 *  the shape of the shop's sheet. Columns 1-3 across both rows are the six
 *  therapists' capacity; the fourth column is the two specialist slots for
 *  Dareena, Shaun and Eunice, who only ever take one booking at a time. */
const THERAPIST_BOXES = 6;
const SPECIALIST_BOXES = 2;
const COLUMNS = 4;
const ROWS = 2;

export interface SlotEntry {
  guest: ResolvedGuest;
  booking: AppointmentWithGuests;
  /** True in the rows a long booking runs through after its first. Those
   *  rows are occupied — they show the name faintly and cannot be booked. */
  continuation?: boolean;
}

export default function SlotGrid({
  bookings,
  opensAt,
  closesAt,
  offCount,
  specialistIds,
  onSelect,
  onAdd,
}: {
  bookings: AppointmentWithGuests[];
  opensAt: string;
  closesAt: string;
  /** How many of the six therapists are off today. That many capacity boxes
   *  grey out, so the day's real capacity is visible at a glance. */
  offCount: number;
  specialistIds: string[];
  onSelect: (entry: SlotEntry) => void;
  onAdd: (time: string) => void;
}) {
  const start = minutesFromMidnight(opensAt);
  const end = minutesFromMidnight(closesAt);
  const specialists = new Set(specialistIds);

  // A two-hour facial starting at 10:00 fills 10:00 through 11:30. Bucketing
  // only by start time left those rows looking free, which is how a customer
  // gets booked on top of one.
  const bySlot = new Map<number, SlotEntry[]>();
  // Column index -> the last slot it is occupied until, so a continuation
  // stays in the same column as the booking it belongs to.
  for (const booking of bookings) {
    for (const guest of booking.guests) {
      if (guest.status === "cancelled") continue;
      const from = minutesFromMidnight(shopTime(guest.startsAt));
      const to = minutesFromMidnight(shopTime(guest.endsAt));
      const firstSlot = Math.floor((from - start) / SLOT_MINUTES) * SLOT_MINUTES + start;
      // Half-open: a booking ending exactly on a boundary does not occupy the
      // slot beginning there.
      const lastSlot = Math.ceil((to - start) / SLOT_MINUTES) * SLOT_MINUTES + start - SLOT_MINUTES;

      for (let m = firstSlot; m <= lastSlot; m += SLOT_MINUTES) {
        const list = bySlot.get(m) ?? [];
        list.push({ guest, booking, continuation: m !== firstSlot });
        bySlot.set(m, list);
      }
    }
  }

  const slots: number[] = [];
  for (let m = start; m < end; m += SLOT_MINUTES) slots.push(m);

  const label = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  // Off therapists take capacity off the end, so the greyed boxes sit
  // together at the bottom right of the therapist block rather than leaving
  // holes in the middle.
  const usableTherapistBoxes = Math.max(0, THERAPIST_BOXES - offCount);

  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(10,10,10,0.1)] bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-[#8e8e8e]">
            <th className="w-14 border-b border-r border-[rgba(10,10,10,0.12)] px-2 py-1.5" />
            <th colSpan={COLUMNS - 1} className="border-b border-r border-[rgba(10,10,10,0.12)] px-2 py-1.5 font-semibold">
              Therapists · {usableTherapistBoxes} of {THERAPIST_BOXES} free
            </th>
            <th className="border-b border-[rgba(10,10,10,0.12)] px-2 py-1.5 font-semibold">
              Dareena · Shaun · Eunice
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((m) => {
            const entries = (bySlot.get(m) ?? []).sort(
              (a, b) => a.guest.startsAt.localeCompare(b.guest.startsAt) || a.guest.id.localeCompare(b.guest.id),
            );

            // Specialist bookings go in the fourth column; everyone else
            // fills the therapist capacity in order.
            const spec = entries.filter((e) => e.guest.therapistId && specialists.has(e.guest.therapistId));
            const main = entries.filter((e) => !spec.includes(e));

            const onTheHour = m % 60 === 0;

            return Array.from({ length: ROWS }, (_, row) => (
              <tr
                key={`${m}-${row}`}
                className={
                  row === 0
                    ? onTheHour
                      ? "border-t-2 border-[rgba(10,10,10,0.18)]"
                      : "border-t border-[rgba(10,10,10,0.12)]"
                    : "border-t border-[rgba(10,10,10,0.04)]"
                }
              >
                {row === 0 && (
                  <th
                    scope="row"
                    rowSpan={ROWS}
                    className={`w-14 border-r border-[rgba(10,10,10,0.12)] bg-[#f5f3ef] px-2 align-top text-right tabular-nums ${
                      onTheHour ? "pt-1 font-semibold" : "pt-1 text-[12px] font-normal text-[#8e8e8e]"
                    }`}
                  >
                    {label(m)}
                  </th>
                )}

                {/* Three therapist-capacity boxes per row. */}
                {Array.from({ length: COLUMNS - 1 }, (_, col) => {
                  const index = row * (COLUMNS - 1) + col;
                  return (
                    <Box
                      key={`t${index}`}
                      entry={main[index]}
                      disabled={index >= usableTherapistBoxes}
                      time={label(m)}
                      lastInGroup={col === COLUMNS - 2}
                      onSelect={onSelect}
                      onAdd={onAdd}
                    />
                  );
                })}

                {/* Specialist column. */}
                <Box
                  key={`s${row}`}
                  entry={spec[row]}
                  disabled={false}
                  time={label(m)}
                  lastInGroup={false}
                  specialist
                  onSelect={onSelect}
                  onAdd={onAdd}
                />
              </tr>
            ));
          })}
        </tbody>
      </table>
      <p className="border-t border-[rgba(10,10,10,0.08)] px-3 py-2 text-[12px] text-[#8e8e8e]">
        {SPECIALIST_BOXES} specialist slots on the right. Greyed boxes are capacity lost to a day off.
      </p>
    </div>
  );
}

function Box({
  entry,
  disabled,
  time,
  lastInGroup,
  specialist,
  onSelect,
  onAdd,
}: {
  entry: SlotEntry | undefined;
  disabled: boolean;
  time: string;
  lastInGroup: boolean;
  specialist?: boolean;
  onSelect: (e: SlotEntry) => void;
  onAdd: (time: string) => void;
}) {
  const border = `border-r ${lastInGroup ? "border-[rgba(10,10,10,0.12)]" : "border-[rgba(10,10,10,0.06)]"}`;

  if (disabled) {
    return (
      <td
        className={`${border} bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(10,10,10,0.05)_5px,rgba(10,10,10,0.05)_10px)] p-0`}
        aria-label="Capacity lost to a day off"
      >
        <div className="h-9 min-w-[8rem]" />
      </td>
    );
  }

  if (!entry) {
    return (
      <td className={`${border} p-0`}>
        <button
          onClick={() => onAdd(time)}
          aria-label={`Add a booking at ${time}`}
          className="h-9 w-full min-w-[8rem] px-2 text-left text-[13px] text-transparent hover:bg-[#faf6f0] hover:text-[#b9a88f]"
        >
          +
        </button>
      </td>
    );
  }

  const { guest } = entry;
  const tint = guest.therapist ? `${guest.therapist.colour}1f` : undefined;
  const noShow = guest.status === "no_show";
  const arrived = guest.status === "arrived" || guest.status === "in_progress";
  // The customer replied to the day-before WhatsApp. Everything past
  // 'confirmed' in the flow implies it too — someone who has arrived plainly
  // confirmed — so the mark stays on rather than disappearing at check-in.
  const confirmed = guest.status === "confirmed";
  // An unnamed family member is shown by their relationship.
  const who = guest.customer?.fullName ?? (guest.relationship ? `+ ${guest.relationship}` : "Guest");

  if (entry.continuation) {
    // Occupied by a booking that began earlier. Still tappable — it is the
    // same booking — but visibly not a fresh slot.
    return (
      <td className={`${border} p-0 align-top`}>
        <button
          onClick={() => onSelect(entry)}
          style={{ background: tint }}
          className="h-9 w-full min-w-[8rem] truncate px-2 text-left text-[11px] italic leading-9 text-[#8e8e8e] hover:brightness-95"
          title={`${who} — continues from ${formatForStaff(guest.startsAt)}`}
        >
          ↑ {who}
        </button>
      </td>
    );
  }

  return (
    <td className={`${border} p-0 align-top`}>
      <button
        onClick={() => onSelect(entry)}
        style={{ background: tint }}
        className={`relative h-9 w-full min-w-[8rem] overflow-hidden px-2 py-0.5 text-left leading-tight hover:brightness-95 ${
          noShow ? "text-[#9f1239] line-through" : ""
        }`}
        title={[who, guest.treatment?.name, guest.therapist?.displayName, guest.notes]
          .filter(Boolean)
          .join(" · ")}
      >
        {/* C while it is only confirmed; once they walk in the badge says so,
          because "arrived" is the more useful fact at that point. */}
      {arrived ? (
        <span
          className="pointer-events-none absolute right-1 top-0.5 rounded bg-[#0f766e] px-1 text-[9px] font-bold uppercase leading-[1.4] tracking-wide text-white"
          aria-label="Arrived"
        >
          Arrived
        </span>
      ) : confirmed ? (
        <span
          className="pointer-events-none absolute right-1 top-0.5 text-[11px] font-bold leading-none text-[#dc2626]"
          title="Confirmed by WhatsApp"
          aria-label="Confirmed"
        >
          C
        </span>
      ) : null}
      <span className={`flex items-baseline gap-1 truncate text-[13px] ${arrived ? "pr-12" : "pr-3"}`}>
          <span className={`truncate ${guest.customer ? "font-medium" : "italic text-[#5a5a5a]"}`}>{who}</span>
          {guest.treatment && (
            <span className="shrink-0 truncate text-[11px] text-[#5a5a5a]">({guest.treatment.name})</span>
          )}
        </span>
        {/* The therapist sits under the name rather than in its own column —
            one glance gives both, and the sheet stays half as wide. */}
        <span className={`block truncate text-[11px] ${guest.therapist ? "text-[#5a5a5a]" : "text-[#c4c4c4]"}`}>
          {guest.therapist?.displayName ?? (specialist ? "unassigned" : "—")}
        </span>
      </button>
    </td>
  );
}
