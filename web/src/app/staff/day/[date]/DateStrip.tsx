import Link from "next/link";
import { shopDate } from "@/lib/appointments/time";

/** Days shown at once. The strip always begins at the day you are looking at,
 *  so the selected date is the leftmost square and the next eight follow it.
 *  The arrows move a whole batch, not a single day — any day already on the
 *  strip is one tap away, so stepping through it was wasted travel. */
export const BATCH = 9;

const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86_400_000;

export default function DateStrip({ date }: { date: string }) {
  const today = shopDate(new Date());
  const start = date;

  const days = Array.from({ length: BATCH }, (_, i) => {
    const ms = utc(start) + i * DAY;
    const dt = new Date(ms);
    return {
      iso: iso(ms),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(dt),
      day: dt.getUTCDate(),
      month: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(dt),
    };
  });

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex gap-1.5 pb-1">
        {days.map((dd) => {
          const active = dd.iso === date;
          const isToday = dd.iso === today;
          return (
            <Link
              key={dd.iso}
              href={`/staff/day/${dd.iso}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[3.5rem] shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 ${
                active
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                  : "border-[rgba(10,10,10,0.14)] bg-white hover:bg-[#faf6f0]"
              }`}
            >
              <span className={`text-[11px] uppercase tracking-wide ${active ? "opacity-70" : "text-[#8e8e8e]"}`}>
                {isToday ? "Today" : dd.weekday}
              </span>
              <span className="text-base font-semibold tabular-nums leading-tight">{dd.day}</span>
              <span className={`text-[10px] ${active ? "opacity-70" : "text-[#8e8e8e]"}`}>{dd.month}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Where the arrows go: nine days either side of the day in view, which is
 *  also the new start of the strip. */
export function shiftBatch(date: string, direction: -1 | 1): string {
  return iso(utc(date) + direction * BATCH * DAY);
}
