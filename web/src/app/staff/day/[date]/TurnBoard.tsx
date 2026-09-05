"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStaffOffDay } from "@/lib/appointments/actions";
import type { TurnCandidate } from "@/lib/appointments/rotation";

/**
 * Whose turn it is, and who is off.
 *
 * About half of customers have no preferred therapist, so the next one goes
 * to whoever has performed the fewest treatments TODAY — the count resets
 * every morning. Counts are shown, not just the order: staff kept this tally
 * by hand, and a board that says "Maggie next" without showing why is one
 * nobody trusts.
 */
export default function TurnBoard({ order, date }: { order: TurnCandidate[]; date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = order.find((c) => c.unavailable === null);
  const allLevelToday = order.every((c) => c.turnCountToday === order[0]?.turnCountToday);

  function toggle(staffId: string, off: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await toggleStaffOffDay(staffId, date, off);
      if (!res.ok) setError(res.error ?? "Could not change the day off.");
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <aside className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8e8e8e]">
          Turn order <span className="normal-case tracking-normal">&middot; today</span>
        </h2>
        {next && (
          <span className="text-sm">
            Next: <strong>{next.displayName}</strong>
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-[#fdf0ef] px-2.5 py-1.5 text-[13px] text-[#9f1239]">
          {error}
        </p>
      )}

      <ol className="space-y-1">
        {order.map((c) => {
          const isNext = c.staffId === next?.staffId;
          const isOff = c.unavailable === "off";
          const asking = confirming === c.staffId;

          return (
            <li key={c.staffId} className={`rounded-lg ${isNext ? "bg-[#e6f4f1]" : ""}`}>
              <div className={`flex items-center gap-2 px-2 py-1.5 ${c.unavailable ? "opacity-60" : ""}`}>
                <span className="w-4 shrink-0 text-right text-xs tabular-nums text-[#8e8e8e]">
                  {c.position}
                </span>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.colour }} aria-hidden />
                <span className={`flex-1 truncate text-sm ${isNext ? "font-semibold" : ""} ${isOff ? "line-through" : ""}`}>
                  {c.displayName}
                </span>

                {/* Off-day toggle. Confirmed rather than immediate: an
                    accidental tap removes a capacity box from the day and
                    sends them to the top of tomorrow's order. */}
                <button
                  onClick={() => setConfirming(asking ? null : c.staffId)}
                  disabled={pending}
                  aria-pressed={isOff}
                  aria-label={`${isOff ? "Working" : "Off"} — ${c.displayName}`}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    isOff
                      ? "bg-[#8a6f4f] text-white"
                      : "border border-[rgba(10,10,10,0.16)] text-[#8e8e8e] hover:border-[#8a6f4f] hover:text-[#8a6f4f]"
                  }`}
                >
                  {isOff ? "Off" : "Off?"}
                </button>

                {allLevelToday && !c.unavailable && (
                  <span className="shrink-0 text-[11px] tabular-nums text-[#b0b0b0]">
                    {c.turnCountPrevious} yst
                  </span>
                )}
                <span className="w-5 shrink-0 text-right text-sm font-medium tabular-nums text-[#5a5a5a]">
                  {c.turnCountToday}
                </span>
              </div>

              {asking && (
                <div className="mx-2 mb-2 rounded-lg bg-[#faf6f0] px-2.5 py-2">
                  <p className="text-[13px]">
                    {isOff
                      ? `Mark ${c.displayName} as working today?`
                      : `Mark ${c.displayName} off for the whole day?`}
                  </p>
                  {!isOff && (
                    <p className="mt-0.5 text-[12px] text-[#8e8e8e]">
                      One capacity box greys out, and they start tomorrow at the top.
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={pending}
                      onClick={() => toggle(c.staffId, !isOff)}
                      className="rounded-lg bg-[#0a0a0a] px-3 py-1 text-[13px] font-semibold text-white disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-2 text-[13px] underline underline-offset-2"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[12px] leading-relaxed text-[#8e8e8e]">
        One point per treatment performed today; the count resets every
        morning. Lowest takes the next customer who has no preferred therapist.
        A no-show earns no point. While everyone is still level,
        yesterday&rsquo;s count decides — so anyone back from a day off starts
        at the top.
      </p>
    </aside>
  );
}
