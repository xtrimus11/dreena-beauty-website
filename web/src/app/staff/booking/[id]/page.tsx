import Link from "next/link";
import { notFound } from "next/navigation";
import BookingDetail from "./BookingDetail";
import {
  getBooking,
  getBookableStaff,
  getDay,
  getDayTimeOff,
  getRosteredStaffIds,
  getTurnStandings,
  getBookingHistory,
} from "@/lib/appointments/queries";
import { turnOrder } from "@/lib/appointments/rotation";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const day = booking.appointmentDate;
  const [{ staff, restrictions }, standings, rosteredIds, offToday, dayBookings, history] =
    await Promise.all([
      getBookableStaff(),
      getTurnStandings(day),
      getRosteredStaffIds(day),
      getDayTimeOff(day),
      getDay(day),
      getBookingHistory(id),
    ]);

  // Anyone already occupied at this booking's time cannot take it, so the
  // turn board here reflects that slot rather than "right now".
  //
  // The window comes from the booking's own guests — no clock reading. A
  // booking always has at least one guest (create_booking enforces it), but
  // if it somehow had none there is no window to compare against and nobody
  // is busy, which is what the empty array says.
  const first = booking.guests[0];
  const last = booking.guests[booking.guests.length - 1];

  const busyStaffIds =
    first && last
      ? dayBookings
          .flatMap((b) => b.guests)
          .filter(
            (g) =>
              g.appointmentId !== booking.id &&
              g.therapistId &&
              g.status !== "cancelled" &&
              g.status !== "no_show" &&
              g.startsAt < last.endsAt &&
              first.startsAt < g.endsAt,
          )
          .map((g) => g.therapistId as string)
      : [];

  const order = turnOrder({
    standings,
    offStaffIds: offToday.map((o) => o.staffId),
    busyStaffIds,
    rosteredStaffIds: rosteredIds,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-6">
      <Link href={`/staff/day/${day}`} className="text-sm text-[#8e8e8e] underline underline-offset-2">
        ‹ Back to the day
      </Link>
      <BookingDetail
        booking={booking}
        day={day}
        staff={staff}
        restrictions={restrictions}
        turnOrder={order}
        history={history}
      />
    </main>
  );
}
