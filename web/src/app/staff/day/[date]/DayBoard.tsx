"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SlotGrid, { type SlotEntry } from "./SlotGrid";
import BookingModal from "./BookingModal";
import type { TurnCandidate } from "@/lib/appointments/rotation";
import type { AppointmentWithGuests, Staff } from "@/lib/appointments/types";

/** Owns the popup. The sheet stays on screen behind it — reception is
 *  usually looking at the day while talking to the customer. */
export default function DayBoard({
  date,
  bookings,
  opensAt,
  closesAt,
  staff,
  restrictions,
  turnOrder,
  offCount,
  specialistIds,
}: {
  date: string;
  bookings: AppointmentWithGuests[];
  opensAt: string;
  closesAt: string;
  staff: Staff[];
  restrictions: { staffId: string; treatmentId: string }[];
  turnOrder: TurnCandidate[];
  offCount: number;
  specialistIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<SlotEntry | null>(null);

  // Keep the open popup pointing at fresh data after an action refreshes the
  // page — otherwise it would show the state from before the change.
  const live =
    selected &&
    (bookings
      .flatMap((b) => b.guests.map((g) => ({ guest: g, booking: b })))
      .find((e) => e.guest.id === selected.guest.id) ?? null);

  return (
    <>
      <SlotGrid
        bookings={bookings}
        opensAt={opensAt}
        closesAt={closesAt}
        offCount={offCount}
        specialistIds={specialistIds}
        onSelect={setSelected}
        onAdd={(time) => router.push(`/staff/booking/new?date=${date}&time=${time}`)}
      />

      {live && (
        <BookingModal
          entry={live}
          day={date}
          staff={staff}
          restrictions={restrictions}
          turnOrder={turnOrder}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
