import Link from "next/link";
import { formatForStaff } from "@/lib/appointments/time";
import type { Departure } from "@/lib/appointments/queries";

/**
 * What left the day. The sheet shows only what is still booked, so a
 * cancellation vanishes and a moved booking reappears on another date with
 * nothing left behind — and staff are left wondering whether the 2pm slot was
 * ever filled. This is the record of both.
 */
export default function Departures({ departures }: { departures: Departure[] }) {
  if (departures.length === 0) return null;

  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${iso}T12:00:00Z`));

  return (
    <section className="mt-4 rounded-xl border border-[rgba(10,10,10,0.1)] bg-[#faf9f6] p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
        Cancelled or moved today ({departures.length})
      </h2>

      <ul className="mt-2 space-y-1.5">
        {departures.map((d) => (
          <li key={`${d.kind}-${d.guestId}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="tabular-nums text-[#8e8e8e]">{formatForStaff(d.originalTime)}</span>

            {d.customerCode && (
              <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {d.customerCode}
              </span>
            )}
            <span className="font-medium">{d.customerName}</span>

            {d.kind === "cancelled" ? (
              <span className="rounded bg-[#fdf0ef] px-1.5 py-0.5 text-[11px] font-semibold text-[#9f1239]">
                Cancelled
              </span>
            ) : (
              <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold text-[#8a6f4f]">
                Moved to {d.movedTo ? dayLabel(d.movedTo) : "another day"}
              </span>
            )}

            {d.reason && <span className="text-[13px] text-[#5a5a5a]">{d.reason}</span>}

            {/* Follow a moved booking to the day it went to. */}
            {d.kind === "moved" && d.movedTo && (
              <Link
                href={`/staff/day/${d.movedTo}`}
                className="text-[13px] text-[#8a6f4f] underline underline-offset-2"
              >
                open
              </Link>
            )}

            {d.actor && <span className="ml-auto text-[11px] text-[#b0b0b0]">{d.actor}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
