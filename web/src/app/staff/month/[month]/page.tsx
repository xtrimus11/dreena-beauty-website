import Link from "next/link";
import { notFound } from "next/navigation";
import MonthGrid from "./MonthGrid";
import { getBookableStaff, getMonthOverview } from "@/lib/appointments/queries";
import { isInRotation } from "@/lib/appointments/rotation";
import { shopDate } from "@/lib/appointments/time";

export const dynamic = "force-dynamic";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DAY = 86_400_000;

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A month at a glance — how full each day is, what is closed, who is off.
 *  Read-only on purpose: this is for spotting a quiet week or a day that is
 *  filling up, then jumping to it. Bookings are still taken on the day sheet. */
export default async function MonthPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!MONTH_PATTERN.test(month)) notFound();

  const [days, bookable] = await Promise.all([getMonthOverview(month), getBookableStaff()]);
  if (days.length === 0) notFound();

  // Off days are a rotation concept: the six therapists are the ones whose
  // absence takes a capacity box off the day.
  const rosterStaff = bookable.staff.filter(isInRotation);

  const today = shopDate(new Date());
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00Z`));

  const total = days.reduce((n, d) => n + d.bookings, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NavLink href={`/staff/month/${shiftMonth(month, -1)}`} label="Previous month">
            ‹
          </NavLink>
          <NavLink href={`/staff/month/${shiftMonth(month, 1)}`} label="Next month">
            ›
          </NavLink>
          <Link
            href={`/staff/day/${today}`}
            className="rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-1.5 text-sm font-medium"
          >
            Back to today
          </Link>
        </div>
        <span className="text-sm text-[#8e8e8e]">
          {total} booking{total === 1 ? "" : "s"} this month
        </span>
      </div>

      <h1 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">{label}</h1>

      <MonthGrid month={month} days={days} today={today} staff={rosterStaff} />

      <p className="mt-4 text-[12px] text-[#8e8e8e]">
        Bar shows how full a day is against the busiest in the month.
        &ldquo;by turn&rdquo; counts bookings with no therapist assigned yet.
        &minus;1 means one therapist is off. Tap a day to open it, or use
        &ldquo;Set off days&rdquo; to plan a therapist&rsquo;s month.
      </p>
    </main>
  );
}

function NavLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg border border-[rgba(10,10,10,0.16)] bg-white text-lg leading-none"
    >
      {children}
    </Link>
  );
}
