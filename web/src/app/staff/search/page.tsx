import Link from "next/link";
import { searchBookings } from "@/lib/appointments/queries";
import { formatForStaff, shopDate } from "@/lib/appointments/time";
import type { BookingStatus } from "@/lib/appointments/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query.length >= 2 ? await searchBookings(query) : [];
  const today = shopDate(new Date());

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/staff/day/${today}`}
          className="text-sm text-[#8e8e8e] underline underline-offset-2"
        >
          ‹ Back to the diary
        </Link>
      </div>

      <h1 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">Find a booking</h1>

      {/* A plain GET form: the query lives in the URL, so a result can be
          read out, bookmarked, or reloaded without retyping. */}
      <form action="/staff/search" method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Code, phone, name, or DR-XXXXXX"
          className="min-w-0 flex-1 rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-2.5 text-base outline-none focus:border-[#8a6f4f]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="mt-4 text-sm text-[#8e8e8e]">Type at least two characters.</p>
      )}

      {query.length >= 2 && results.length === 0 && (
        <p className="mt-6 text-sm text-[#8e8e8e]">
          Nothing found for &ldquo;{query}&rdquo;. Try the phone number, or just part of the name.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {results.map((c) => (
          <section key={c.id} className="rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              {c.customerCode && (
                <span className="rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                  {c.customerCode}
                </span>
              )}
              <h2 className="text-base font-semibold">{c.fullName}</h2>
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s/g, "")}`}
                  className="text-sm tabular-nums text-[#5a5a5a] underline underline-offset-2"
                >
                  {c.phone}
                </a>
              )}
              {c.customerType === "walk_in" && (
                <span className="text-[11px] uppercase tracking-wide text-[#8a6f4f]">no course</span>
              )}
            </div>

            {c.notes && <p className="mt-1.5 text-[13px] text-[#8a6f4f]">{c.notes}</p>}

            {c.upcoming.length > 0 && (
              <>
                <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
                  Coming up
                </h3>
                <ul className="mt-1 space-y-1">
                  {c.upcoming.map((b) => (
                    <BookingRow key={b.guestId} booking={b} today={today} />
                  ))}
                </ul>
              </>
            )}

            {c.past.length > 0 && (
              <>
                <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
                  Been before
                </h3>
                <ul className="mt-1 space-y-1">
                  {/* Enough to recognise a regular, not a full history. */}
                  {c.past.slice(0, 5).map((b) => (
                    <BookingRow key={b.guestId} booking={b} today={today} past />
                  ))}
                </ul>
                {c.past.length > 5 && (
                  <p className="mt-1 text-[12px] text-[#8e8e8e]">
                    and {c.past.length - 5} more
                  </p>
                )}
              </>
            )}

            {c.upcoming.length === 0 && c.past.length === 0 && (
              <p className="mt-2 text-sm text-[#8e8e8e]">No bookings on record.</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function BookingRow({
  booking,
  today,
  past,
}: {
  booking: {
    guestId: string;
    startsAt: string;
    status: BookingStatus;
    treatmentName: string | null;
    therapistName: string | null;
    reference: string;
  };
  today: string;
  past?: boolean;
}) {
  const date = shopDate(booking.startsAt);
  const isToday = date === today;
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(booking.startsAt));

  return (
    <li>
      <Link
        href={`/staff/day/${date}`}
        className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-1.5 hover:bg-[#faf6f0] ${
          past ? "opacity-70" : ""
        }`}
      >
        <span className="text-sm font-semibold tabular-nums">
          {label}
          {isToday && <span className="ml-1.5 text-[11px] font-bold uppercase">Today</span>}
        </span>
        <span className="text-sm tabular-nums text-[#5a5a5a]">{formatForStaff(booking.startsAt)}</span>
        {booking.treatmentName && (
          <span className="text-sm text-[#5a5a5a]">{booking.treatmentName}</span>
        )}
        {booking.therapistName ? (
          <span className="text-[13px] text-[#8e8e8e]">{booking.therapistName}</span>
        ) : (
          !past && <span className="text-[13px] text-[#8a6f4f]">by turn</span>
        )}
        <StatusTag status={booking.status} />
        <span className="ml-auto text-[11px] tabular-nums text-[#c4c4c4]">{booking.reference}</span>
      </Link>
    </li>
  );
}

function StatusTag({ status }: { status: BookingStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Booked", cls: "bg-[#f1efe9] text-[#5a5a5a]" },
    confirmed: { label: "Confirmed", cls: "bg-[#fdf0ef] font-semibold text-[#dc2626]" },
    arrived: { label: "Arrived", cls: "bg-[#e6f4f1] text-[#0f766e]" },
    in_progress: { label: "Arrived", cls: "bg-[#e6f4f1] text-[#0f766e]" },
    completed: { label: "Done", cls: "bg-[#f1efe9] text-[#8e8e8e]" },
    no_show: { label: "No show", cls: "bg-[#fdf0ef] text-[#9f1239]" },
    cancelled: { label: "Cancelled", cls: "bg-[#f1efe9] text-[#8e8e8e] line-through" },
  };
  const s = map[status];
  if (!s) return null;
  return <span className={`rounded px-1.5 py-0.5 text-[11px] ${s.cls}`}>{s.label}</span>;
}
