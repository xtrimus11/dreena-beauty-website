import Link from "next/link";
import { notFound } from "next/navigation";
import DayGrid from "./DayGrid";
import DayBoard from "./DayBoard";
import DateStrip, { BATCH, shiftBatch } from "./DateStrip";
import DayAgenda from "./DayAgenda";
import TurnBoard from "./TurnBoard";
import SignOutButton from "./SignOutButton";
import {
  getCurrentStaff,
  getDay,
  getDayColumns,
  getDayHours,
  getDayTimeOff,
  getBookableStaff,
  getRosteredStaffIds,
  getTurnStandings,
} from "@/lib/appointments/queries";
import { turnOrder } from "@/lib/appointments/rotation";
import { SHOP_TIMEZONE, shopDate } from "@/lib/appointments/time";

export const dynamic = "force-dynamic"; // the diary is never cacheable

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;



export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ t?: string; view?: string }>;
}) {
  const { date } = await params;
  const { t, view } = await searchParams;
  const today = shopDate(new Date());

  // Reject anything that is not a real calendar date before it reaches a
  // query — '2026-13-45' would otherwise become a confusing empty day.
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) notFound();

  const [staff, columns, bookings, hours, offToday, standings, rosteredIds, bookable] = await Promise.all([
    getCurrentStaff(),
    getDayColumns(date),
    getDay(date),
    getDayHours(date),
    getDayTimeOff(date),
    getTurnStandings(date),
    getRosteredStaffIds(date),
    getBookableStaff(),
  ]);

  // "Busy" for the turn board means right now, not at some point today — the
  // board answers "who can take the customer standing here".
  const now = new Date();
  const busyStaffIds = bookings
    .flatMap((b) => b.guests)
    .filter(
      (g) =>
        g.therapistId &&
        g.status !== "cancelled" &&
        g.status !== "no_show" &&
        new Date(g.startsAt) <= now &&
        new Date(g.endsAt) > now,
    )
    .map((g) => g.therapistId as string);

  const order = turnOrder({
    standings,
    offStaffIds: offToday.map((o) => o.staffId),
    busyStaffIds,
    rosteredStaffIds: rosteredIds,
  });

  const showGrid = view === "grid";

  const heading = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));

  const guestCount = bookings
    .flatMap((b) => b.guests)
    .filter((g) => g.status !== "cancelled").length;

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-4 md:px-6 md:py-6">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* A whole batch at a time — any day already on the strip is one
                tap away, so stepping day by day was wasted travel. */}
            <NavLink href={`/staff/day/${shiftBatch(date, -1)}`} label={`Previous ${BATCH} days`}>
              ‹
            </NavLink>
            <NavLink href={`/staff/day/${shiftBatch(date, 1)}`} label={`Next ${BATCH} days`}>
              ›
            </NavLink>
            <Link
              href="/staff/search"
              aria-label="Find a booking"
              className="rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-1.5 text-sm font-medium"
            >
              Search
            </Link>
            <Link
              href={`/staff/month/${date.slice(0, 7)}`}
              className="rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-1.5 text-sm font-medium"
            >
              Month
            </Link>
            {date !== today && (
              <Link
                href={`/staff/day/${today}`}
                className="rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-1.5 text-sm font-medium"
              >
                Today
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-[#8e8e8e]">
            {/* Hidden on phones: the diary is read-only there. */}
            <Link
              href={`/staff/booking/new?date=${date}`}
              className="hidden rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-sm font-semibold text-white md:inline-block"
            >
              New booking
            </Link>
            {staff && <span className="hidden sm:inline">{staff.displayName}</span>}
            <SignOutButton />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{heading}</h1>
          {date === today && (
            <span className="rounded bg-[#0a0a0a] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Today
            </span>
          )}
          <span className="text-sm text-[#8e8e8e]">
            {guestCount} booking{guestCount === 1 ? "" : "s"}
            {!hours.isClosed && ` · ${hours.opensAt}–${hours.closesAt}`}
          </span>
        </div>

        {offToday.length > 0 && (
          <p className="mt-2 text-sm text-[#8a6f4f]">
            Off today:{" "}
            {offToday
              .map((o) => columns.find((c) => c.id === o.staffId)?.displayName)
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
        )}
      </header>

      <DateStrip date={date} />

      {hours.isClosed ? (
        <div className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white px-4 py-10 text-center">
          <p className="font-semibold">Closed</p>
          {hours.closureReason && <p className="mt-1 text-sm text-[#8e8e8e]">{hours.closureReason}</p>}
        </div>
      ) : (
        <>
          {/* Sheet and turn board side by side on desktop. The sheet is the
              primary view: most bookings have no therapist yet, and a
              therapist-column calendar has nowhere to put those. */}
          <div className="hidden gap-5 md:flex md:flex-col xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex gap-1.5">
                <ViewTab href={`/staff/day/${date}`} active={!showGrid} label="Sheet" />
                <ViewTab href={`/staff/day/${date}?view=grid`} active={showGrid} label="By therapist" />
              </div>

              {showGrid ? (
                <DayGrid
                  columns={columns}
                  bookings={bookings}
                  opensAt={hours.opensAt}
                  closesAt={hours.closesAt}
                  offToday={offToday}
                  date={date}
                />
              ) : (
                <DayBoard
                  date={date}
                  bookings={bookings}
                  opensAt={hours.opensAt}
                  closesAt={hours.closesAt}
                  staff={bookable.staff}
                  restrictions={bookable.restrictions}
                  turnOrder={order}
                  offCount={
                    // Only the six rotating therapists take capacity boxes;
                    // a specialist being off does not shrink the main block.
                    offToday.filter((o) =>
                      bookable.staff.some(
                        (s) => s.id === o.staffId && s.columnMode === "always" && !s.isFreelancer,
                      ),
                    ).length
                  }
                  specialistIds={bookable.staff
                    .filter((s) => s.columnMode === "when_booked" || s.isFreelancer)
                    .map((s) => s.id)}
                />
              )}
            </div>

            <div className="w-full shrink-0 xl:w-64">
              <TurnBoard order={order} date={date} />
            </div>
          </div>

          <DayAgenda
            date={date}
            columns={columns}
            bookings={bookings}
            selectedTherapistId={t ?? null}
            offToday={offToday}
          />
        </>
      )}
    </main>
  );
}

function ViewTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm ${
        active
          ? "bg-[#0a0a0a] font-semibold text-white"
          : "border border-[rgba(10,10,10,0.16)] bg-white"
      }`}
    >
      {label}
    </Link>
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
