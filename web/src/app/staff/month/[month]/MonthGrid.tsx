"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleStaffOffDay } from "@/lib/appointments/actions";
import type { MonthDay } from "@/lib/appointments/queries";
import type { Staff } from "@/lib/appointments/types";

/**
 * The month at a glance, and the roster planner.
 *
 * Two modes. Read-only it answers "which days are filling up"; in roster mode
 * you pick a therapist and tap days to set their off days for the month —
 * which is how a roster is actually planned, a person at a time across weeks,
 * rather than a day at a time on the day sheet.
 */
export default function MonthGrid({
  month,
  days,
  today,
  staff,
}: {
  month: string;
  days: MonthDay[];
  today: string;
  staff: Staff[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rosterMode, setRosterMode] = useState(false);
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  /** Days changed in this session, so a tap feels instant while the server
   *  catches up rather than waiting a round trip to redraw. */
  const [pendingDays, setPendingDays] = useState<Record<string, boolean>>({});

  const chosen = staff.find((s) => s.id === staffId);
  const firstWeekday = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const busiest = Math.max(1, ...days.map((d) => d.bookings));

  const isOff = (d: MonthDay) =>
    pendingDays[d.date] ?? (chosen ? d.staffOff.includes(chosen.displayName) : false);

  function toggle(d: MonthDay) {
    if (!chosen) return;
    const next = !isOff(d);
    setPendingDays((p) => ({ ...p, [d.date]: next }));
    setError(null);
    startTransition(async () => {
      const res = await toggleStaffOffDay(chosen.id, d.date, next);
      if (!res.ok) {
        // Put the square back the way it was; the change did not stick.
        setPendingDays((p) => ({ ...p, [d.date]: !next }));
        setError(res.error ?? "Could not change that day.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-4 rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setRosterMode((v) => !v);
              setPendingDays({});
              setError(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              rosterMode
                ? "bg-[#8a6f4f] text-white"
                : "border border-[rgba(10,10,10,0.16)]"
            }`}
          >
            {rosterMode ? "Done setting off days" : "Set off days"}
          </button>

          {rosterMode && (
            <>
              <select
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setPendingDays({});
                }}
                className="rounded-lg border border-[rgba(10,10,10,0.16)] px-3 py-1.5 text-sm outline-none"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
              <span className="text-[13px] text-[#8e8e8e]">
                Tap a day to mark {chosen?.displayName} off. Tap again to undo.
              </span>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-[#fdf0ef] px-2.5 py-1.5 text-[13px] text-[#9f1239]">
            {error}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] uppercase tracking-wide text-[#8e8e8e]">
            {d}
          </div>
        ))}

        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`pad${i}`} />
        ))}

        {days.map((d) => {
          const isToday = d.date === today;
          const dayNum = Number(d.date.slice(-2));
          const off = rosterMode && isOff(d);

          const shell = `flex min-h-[4.5rem] w-full flex-col rounded-lg border p-1.5 text-left transition-colors ${
            isToday ? "border-[#0a0a0a] ring-1 ring-[#0a0a0a]" : "border-[rgba(10,10,10,0.12)]"
          } ${
            off
              ? "bg-[#8a6f4f] text-white"
              : d.isClosed
                ? "bg-[#f5f3ef]"
                : "bg-white hover:border-[#8a6f4f]"
          }`;

          const inner = (
            <>
              <span
                className={`text-sm tabular-nums ${isToday ? "font-bold" : "font-medium"} ${
                  d.isClosed && !off ? "text-[#b0b0b0]" : ""
                }`}
              >
                {dayNum}
              </span>

              {off ? (
                <span className="mt-auto text-[10px] font-semibold uppercase tracking-wide">Off</span>
              ) : d.isClosed ? (
                <span className="mt-auto text-[10px] uppercase tracking-wide text-[#b0b0b0]">
                  {d.closureReason ?? "Closed"}
                </span>
              ) : (
                <>
                  {d.bookings > 0 && (
                    <>
                      <span className="mt-0.5 text-[13px] font-semibold tabular-nums">{d.bookings}</span>
                      <div
                        className="mt-0.5 h-1 rounded-full bg-[#0f766e]"
                        style={{ width: `${Math.max(12, (d.bookings / busiest) * 100)}%` }}
                        aria-hidden
                      />
                    </>
                  )}
                  <span className="mt-auto flex flex-wrap gap-1 pt-1">
                    {d.unassigned > 0 && (
                      <span
                        className="rounded bg-[#faf6f0] px-1 text-[10px] font-semibold text-[#8a6f4f]"
                        title={`${d.unassigned} still waiting on the turn order`}
                      >
                        {d.unassigned} by turn
                      </span>
                    )}
                    {d.staffOff.length > 0 && (
                      <span
                        className="rounded bg-[#f1efe9] px-1 text-[10px] text-[#8e8e8e]"
                        title={`Off: ${d.staffOff.join(", ")}`}
                      >
                        &minus;{d.staffOff.length}
                      </span>
                    )}
                  </span>
                </>
              )}
            </>
          );

          // In roster mode the squares set off days; otherwise they open the day.
          return rosterMode ? (
            <button
              key={d.date}
              onClick={() => toggle(d)}
              disabled={pending}
              aria-pressed={off}
              aria-label={`${off ? "Working" : "Off"} — ${chosen?.displayName} on ${d.date}`}
              className={shell}
            >
              {inner}
            </button>
          ) : (
            <Link key={d.date} href={`/staff/day/${d.date}`} className={shell}>
              {inner}
            </Link>
          );
        })}
      </div>
    </>
  );
}
