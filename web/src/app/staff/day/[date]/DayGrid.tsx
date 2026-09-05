import Link from "next/link";
import { minutesFromMidnight, shopTime } from "@/lib/appointments/time";
import type { AppointmentWithGuests, ResolvedGuest, Staff } from "@/lib/appointments/types";

const PIXELS_PER_MINUTE = 1.25; // a 2-hour facial is 150px tall — readable, and a full day fits
const HOUR_LINE_EVERY = 60;

interface Props {
  columns: Staff[];
  bookings: AppointmentWithGuests[];
  opensAt: string;
  closesAt: string;
  offToday: { staffId: string; reason: string | null }[];
  date: string;
}

/**
 * The day grid: one column per therapist, time running down. This is the
 * tablet and desktop view — hidden below 768px, where the phone gets the
 * read-only agenda instead.
 */
export default function DayGrid({ columns, bookings, opensAt, closesAt, offToday, date }: Props) {
  const dayStart = minutesFromMidnight(opensAt);
  const dayEnd = minutesFromMidnight(closesAt);
  const height = (dayEnd - dayStart) * PIXELS_PER_MINUTE;

  // Hour labels down the left edge.
  const hourMarks: number[] = [];
  for (let m = Math.ceil(dayStart / HOUR_LINE_EVERY) * HOUR_LINE_EVERY; m <= dayEnd; m += HOUR_LINE_EVERY) {
    hourMarks.push(m);
  }

  const offBy = new Map(offToday.map((o) => [o.staffId, o.reason]));

  // Guests keyed by therapist. Unassigned ones get their own column at the
  // end — a real state, not an error: the shop books the time, then decides
  // who takes it.
  const byTherapist = new Map<string, ResolvedGuest[]>();
  const unassigned: ResolvedGuest[] = [];
  for (const booking of bookings) {
    for (const guest of booking.guests) {
      if (guest.status === "cancelled") continue;
      if (!guest.therapistId) {
        unassigned.push(guest);
        continue;
      }
      const list = byTherapist.get(guest.therapistId) ?? [];
      list.push(guest);
      byTherapist.set(guest.therapistId, list);
    }
  }

  const trackCount = columns.length + (unassigned.length ? 1 : 0);

  return (
    <div className="hidden overflow-x-auto md:block">
      <div
        className="grid min-w-max"
        style={{ gridTemplateColumns: `4rem repeat(${trackCount}, minmax(11rem, 1fr))` }}
      >
        {/* Header row */}
        <div className="sticky left-0 z-20 border-b border-r border-[rgba(10,10,10,0.1)] bg-[#fbfaf7]" />
        {columns.map((s) => {
          const isOff = offBy.has(s.id);
          return (
            <div
              key={s.id}
              className="border-b border-r border-[rgba(10,10,10,0.1)] px-3 py-2.5"
              style={{ borderTop: `3px solid ${s.colour}` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-sm font-semibold ${isOff ? "text-[#8e8e8e] line-through" : ""}`}>
                  {s.displayName}
                </span>
                {isOff && (
                  <span className="shrink-0 rounded bg-[#f1efe9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6f4f]">
                    Off
                  </span>
                )}
              </div>
              {s.isFreelancer && <span className="text-[11px] text-[#8e8e8e]">freelancer</span>}
            </div>
          );
        })}
        {unassigned.length > 0 && (
          <div className="border-b border-r border-dashed border-[rgba(10,10,10,0.1)] px-3 py-2.5">
            <span className="text-sm font-semibold text-[#8a6f4f]">Unassigned</span>
          </div>
        )}

        {/* Time gutter */}
        <div
          className="sticky left-0 z-10 border-r border-[rgba(10,10,10,0.1)] bg-[#fbfaf7]"
          style={{ height }}
        >
          <div className="relative h-full">
            {hourMarks.map((m) => (
              <div
                key={m}
                // The first label sits at top 0; centring it would clip half
                // of it above the grid.
                className={`absolute pr-2 text-right text-xs tabular-nums text-[#8e8e8e] ${
                  m === dayStart ? "" : "-translate-y-1/2"
                }`}
                style={{ top: (m - dayStart) * PIXELS_PER_MINUTE, width: "4rem" }}
              >
                {String(Math.floor(m / 60)).padStart(2, "0")}:{String(m % 60).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        {/* Therapist columns */}
        {columns.map((s) => (
          <Column
            key={s.id}
            height={height}
            dayStart={dayStart}
            hourMarks={hourMarks}
            guests={byTherapist.get(s.id) ?? []}
            dimmed={offBy.has(s.id)}
            date={date}
            therapistId={s.id}
          />
        ))}
        {unassigned.length > 0 && (
          <Column
            height={height}
            dayStart={dayStart}
            hourMarks={hourMarks}
            guests={unassigned}
            dashed
            date={date}
          />
        )}
      </div>
    </div>
  );
}

function Column({
  height,
  dayStart,
  hourMarks,
  guests,
  dimmed,
  dashed,
  date,
  therapistId,
}: {
  height: number;
  dayStart: number;
  hourMarks: number[];
  guests: ResolvedGuest[];
  dimmed?: boolean;
  dashed?: boolean;
  date: string;
  therapistId?: string;
}) {
  return (
    <div
      className={`relative border-r ${dashed ? "border-dashed" : ""} border-[rgba(10,10,10,0.1)] ${
        dimmed ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(10,10,10,0.03)_6px,rgba(10,10,10,0.03)_12px)]" : ""
      }`}
      style={{ height }}
    >
      {/* Each hour is a tappable target that opens the booking form with the
          time and therapist already set. Sits underneath the booking blocks,
          so tapping an existing booking still opens it. */}
      {hourMarks.slice(0, -1).map((m) => (
        <Link
          key={`slot-${m}`}
          href={`/staff/booking/new?date=${date}&time=${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}${therapistId ? `&therapist=${therapistId}` : ""}`}
          aria-label={`Add a booking at ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`}
          className="group absolute inset-x-0 border-t border-[rgba(10,10,10,0.07)] hover:bg-[#faf6f0]"
          style={{ top: (m - dayStart) * PIXELS_PER_MINUTE, height: HOUR_LINE_EVERY * PIXELS_PER_MINUTE }}
        >
          <span className="pointer-events-none absolute inset-x-1 top-1 hidden text-[11px] text-[#8a6f4f] group-hover:block">
            + add
          </span>
        </Link>
      ))}
      {guests.map((g) => (
        <GuestBlock key={g.id} guest={g} dayStart={dayStart} />
      ))}
    </div>
  );
}

function GuestBlock({ guest, dayStart }: { guest: ResolvedGuest; dayStart: number }) {
  const start = minutesFromMidnight(shopTime(guest.startsAt));
  const end = minutesFromMidnight(shopTime(guest.endsAt));
  const top = (start - dayStart) * PIXELS_PER_MINUTE;
  const height = Math.max((end - start) * PIXELS_PER_MINUTE, 26);
  const short = height < 52;

  return (
    <Link
      href={`/staff/booking/${guest.appointmentId}`}
      className={`absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left transition-shadow hover:shadow-md ${statusClass(
        guest.status,
      )}`}
      style={{ top, height }}
    >
      <div className="flex items-baseline gap-1.5">
        {guest.customer?.customerCode && (
          <span className="shrink-0 rounded bg-black/5 px-1 text-[10px] font-semibold tabular-nums">
            {guest.customer.customerCode}
          </span>
        )}
        <span className="truncate text-[13px] font-semibold leading-tight">
          {guest.customer?.fullName ?? (guest.relationship ? `+ ${guest.relationship}` : "Guest")}
        </span>
      </div>
      {/* The short treatments are precisely the ones the shop writes down —
          hair removal, waxing, pico — so the name stays visible even when the
          block is too shallow for a second line. It goes inline instead. */}
      <div
        className={
          short
            ? "truncate text-[10px] leading-tight opacity-70"
            : "mt-0.5 truncate text-[11px] leading-tight opacity-75"
        }
      >
        {guest.treatment?.name ?? ""}
      </div>
      {(guest.status === "confirmed" || guest.status === "arrived") && (
        <span
          className="absolute right-1 top-0 text-[11px] font-bold leading-none text-[#dc2626]"
          title="Confirmed by WhatsApp"
        >
          C
        </span>
      )}
      {!short && guest.preferenceMismatch && (
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b45309]">
          Not preferred
        </div>
      )}
    </Link>
  );
}

/** Colour carries the state a receptionist scans for: who has arrived, who
 *  never showed. Never colour alone — every state is also spelled out in the
 *  agenda view, for anyone who cannot separate these hues. */
function statusClass(status: ResolvedGuest["status"]): string {
  switch (status) {
    case "arrived":
    case "in_progress":
      return "border-[#0f766e] bg-[#e6f4f1] text-[#0f766e]";
    case "completed":
      return "border-[rgba(10,10,10,0.12)] bg-[#f1efe9] text-[#5a5a5a]";
    case "no_show":
      return "border-[#9f1239] bg-[#fdf0ef] text-[#9f1239] line-through";
    case "confirmed":
      // Customer replied to the day-before WhatsApp.
      return "border-[#dc2626] bg-white text-[#0a0a0a]";
    case "pending":
    default:
      // The ordinary state of a fresh booking, not a provisional one.
      return "border-[rgba(10,10,10,0.14)] bg-white text-[#0a0a0a]";
  }
}
