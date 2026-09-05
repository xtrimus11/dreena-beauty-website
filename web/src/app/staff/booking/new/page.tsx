import Link from "next/link";
import BookingForm from "./BookingForm";
import {
  getBookableStaff,
  getStandardSlots,
  getTurnStandings,
  getDayHours,
  getRosteredStaffIds,
  getDayTimeOff,
  getTreatments,
} from "@/lib/appointments/queries";
import { shopDate, shopInstant, shopWeekday } from "@/lib/appointments/time";
import { turnOrder } from "@/lib/appointments/rotation";
import type { Weekday } from "@/lib/appointments/types";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; therapist?: string }>;
}) {
  const { date: dateParam, time, therapist } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : shopDate(new Date());
  const weekday = shopWeekday(shopInstant(date, "12:00")) as Weekday;

  const [{ staff, restrictions }, treatments, slots, hours, standings, rosteredIds, offToday] =
    await Promise.all([
      getBookableStaff(),
      getTreatments(),
      getStandardSlots(weekday),
      getDayHours(date),
      getTurnStandings(date),
      getRosteredStaffIds(date),
      getDayTimeOff(date),
    ]);

  const order = turnOrder({
    standings,
    offStaffIds: offToday.map((o) => o.staffId),
    busyStaffIds: [],
    rosteredStaffIds: rosteredIds,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-6">
      <Link href={`/staff/day/${date}`} className="text-sm text-[#8e8e8e] underline underline-offset-2">
        ‹ Back to the day
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">New booking</h1>

      {/* Editing is tablet and desktop only. On a phone the diary is
          read-only: mis-tapping a booking on a 5-inch screen is how a
          customer loses their slot. */}
      <p className="mt-4 rounded-lg bg-[#f1efe9] px-3 py-2.5 text-[13px] text-[#5a5a5a] md:hidden">
        Bookings can&rsquo;t be taken on a phone. Use a tablet or the PC.
      </p>

      <div className="hidden md:block">
        <BookingForm
          date={date}
          initialTime={time ?? slots[0]?.startsAt ?? hours.opensAt}
          treatments={treatments}
          staff={staff}
          restrictions={restrictions}
          slots={slots}
          turnOrder={order}
          initialTherapistId={therapist ?? ""}
          todayIso={shopDate(new Date())}
          opensAt={hours.opensAt}
          closesAt={hours.closesAt}
        />
      </div>
    </main>
  );
}
