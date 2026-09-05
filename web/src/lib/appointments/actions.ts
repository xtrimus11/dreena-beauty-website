"use server";

// Write actions for the diary.
//
// Every one of these ends in a database call that can be rejected by an
// EXCLUDE constraint (SQLSTATE 23P01) when two tablets act on the same
// therapist at the same moment. findConflicts() runs first for a friendly
// message, but it is advisory — the database is the guarantee, and its
// rejection is translated here rather than leaking a Postgres error to staff.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { describeConstraintViolation } from "./availability";
import { shopDate } from "./time";
import type { BookingSource, BookingStatus } from "./types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Set on success when the caller should navigate somewhere. */
  bookingId?: string;
}

/** Postgres error shape as it arrives through PostgREST. */
interface PgError {
  code?: string;
  message?: string;
  details?: string;
}

/** Turns a database rejection into something a receptionist can act on. */
function toMessage(error: PgError | null, fallback: string): string {
  if (!error) return fallback;

  if (error.code === "23P01") {
    // The constraint name is in the message; find which guard fired.
    const text = `${error.message ?? ""} ${error.details ?? ""}`;
    const match = text.match(/appointment_guests_no_\w+_overlap/);
    return describeConstraintViolation(match?.[0] ?? "");
  }

  // A CHECK we wrote deliberately — surface its own wording.
  if (error.code === "23514" && /customers_code_matches_type/.test(error.message ?? "")) {
    return "A customer code starting with W must be a walk-in; a plain number must be a course customer.";
  }

  if (error.code === "42501" || error.code === "PGRST301") {
    return "You do not have permission for that. Ask a manager.";
  }

  return error.message || fallback;
}

export interface NewGuestPayload {
  /** Existing customer, or blank for an unnamed family member. */
  customerId?: string;
  /** "daughter", "husband" — all that is needed for a family member. */
  relationship?: string;
  /** Optional — the shop often books a name into a slot and nothing more. */
  treatmentId?: string | null;
  /** null = not yet decided. Left blank at booking time and filled on the
   *  day, because the turn order for a future date is unknowable. */
  therapistId: string | null;
  startsAt: string;
  /** Defaults to one 30-minute slot. Never required for a family member. */
  durationMinutes?: number;
  notes?: string;
}

export async function createBooking(input: {
  contactCustomerId: string;
  source: BookingSource;
  notes?: string;
  guests: NewGuestPayload[];
}): Promise<ActionResult> {
  const supabase = await createClient();

  if (input.guests.length === 0) return { ok: false, error: "Add at least one person." };
  if (input.guests.length > 5) return { ok: false, error: "A booking can hold at most five people." };

  // A family member needs no customer record — "Lim + daughter" is how the
  // booking is taken, and inventing a name would invent data. They carry just
  // a relationship, and get a record later if they ever want one.
  for (const g of input.guests) {
    if (!g.customerId && !g.relationship?.trim()) {
      return { ok: false, error: "A family member needs a relationship (daughter, husband…)." };
    }
  }
  const resolved = input.guests;

  const { data, error } = await supabase.rpc("create_booking", {
    p_contact_customer_id: input.contactCustomerId,
    p_source: input.source,
    p_notes: input.notes ?? null,
    p_guests: resolved.map((g, i) => ({
      customer_id: g.customerId ?? "",
      relationship: g.relationship ?? "",
      treatment_id: g.treatmentId ?? "",
      therapist_id: g.therapistId ?? "",
      starts_at: g.startsAt,
      duration_minutes: g.durationMinutes ?? 30,
      notes: g.notes ?? "",
      seq: i + 1,
    })),
  });

  if (error) return { ok: false, error: toMessage(error, "Could not save the booking.") };

  const day = shopDate(input.guests[0].startsAt);
  revalidatePath(`/staff/day/${day}`);
  return { ok: true, bookingId: data as string };
}

/** Arrived / in progress / completed / no show. Completing is what awards the
 *  turn-order point, via the trigger in 0003. */
export async function setGuestStatus(
  guestId: string,
  status: BookingStatus,
  day: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_guests")
    .update({ status })
    .eq("id", guestId);

  if (error) return { ok: false, error: toMessage(error, "Could not update the status.") };

  revalidatePath(`/staff/day/${day}`);
  return { ok: true };
}

/** Assigns a therapist to one guest — the "by turn" decision, made at the
 *  counter. Passing null hands it back to the turn order. */
export async function assignTherapist(
  guestId: string,
  therapistId: string | null,
  day: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_guests")
    .update({ therapist_id: therapistId })
    .eq("id", guestId);

  if (error) return { ok: false, error: toMessage(error, "Could not assign the therapist.") };

  revalidatePath(`/staff/day/${day}`);
  return { ok: true };
}

/** Moves one person to a different time or length. */
export async function rescheduleGuest(
  guestId: string,
  startsAt: string,
  durationMinutes: number,
  day: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const ends = new Date(new Date(startsAt).getTime() + durationMinutes * 60_000);

  const { error } = await supabase
    .from("appointment_guests")
    .update({ starts_at: startsAt, ends_at: ends.toISOString() })
    .eq("id", guestId);

  if (error) return { ok: false, error: toMessage(error, "Could not move the booking.") };

  revalidatePath(`/staff/day/${day}`);
  revalidatePath(`/staff/day/${shopDate(startsAt)}`);
  return { ok: true };
}

/** Cancels the whole booking. Deliberately not a delete: the row stays, the
 *  reason is kept, and the therapist's time frees up because both overlap
 *  guards ignore cancelled rows. */
export async function cancelBooking(
  appointmentId: string,
  reason: string,
  day: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) return { ok: false, error: toMessage(error, "Could not cancel the booking.") };

  revalidatePath(`/staff/day/${day}`);
  return { ok: true };
}

/** Customer search, exposed to the booking form's search box. Wraps the
 *  server-only query so a Client Component can call it. */
export async function searchCustomersAction(query: string) {
  const { searchCustomers } = await import("./queries");
  return searchCustomers(query);
}

/** Creates a customer from the booking form's "new customer" fields. */
export async function createCustomerAction(input: {
  fullName: string;
  phone?: string;
  customerCode?: string;
}): Promise<ActionResult & { customerId?: string }> {
  const supabase = await createClient();
  const name = input.fullName.trim();
  if (!name) return { ok: false, error: "A name is required." };

  const code = input.customerCode?.trim() || null;
  // The shop's own convention, enforced by a CHECK in 0001: a 'W' prefix is a
  // walk-in, a bare number is a course customer. Derive it rather than asking
  // reception to state the same thing twice.
  const customerType = code && !code.toUpperCase().startsWith("W") ? "course" : "walk_in";

  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: name,
      phone: input.phone?.trim() || null,
      customer_code: code ? code.toUpperCase() : null,
      customer_type: customerType,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: `Customer code ${code} is already used.` };
    return { ok: false, error: toMessage(error, "Could not save the customer.") };
  }
  return { ok: true, customerId: data.id as string };
}

/** Moves the whole booking to another date, keeping everyone's clock times.
 *  This is the usual answer to "I need to cancel" — the shop asks whether
 *  they want another date before writing the booking off. */
export async function rescheduleBooking(
  appointmentId: string,
  newDate: string,
  newTime: string | null,
  note: string,
  oldDay: string,
): Promise<ActionResult & { newDate?: string }> {
  const supabase = await createClient();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return { ok: false, error: "Pick a valid date." };
  }
  if (newTime && !/^\d{2}:\d{2}$/.test(newTime)) {
    return { ok: false, error: "Pick a valid time." };
  }
  if (newDate === oldDay && !newTime) {
    return { ok: false, error: "Pick a different date, or a new time." };
  }

  const { data, error } = await supabase.rpc("reschedule_booking", {
    p_appointment_id: appointmentId,
    p_new_date: newDate,
    p_new_time: newTime,
    p_note: note,
  });

  if (error) return { ok: false, error: toMessage(error, "Could not move the booking.") };

  revalidatePath(`/staff/day/${oldDay}`);
  revalidatePath(`/staff/day/${newDate}`);
  return { ok: true, newDate: (data as string) ?? newDate };
}

/** Marks a therapist off for a whole day, or clears the mark. Toggling is a
 *  visible act with a confirmation in the UI: an accidental "off" removes a
 *  box from the day's capacity and moves them to the top of tomorrow's turn
 *  order, so it must not happen on a stray tap. */
export async function toggleStaffOffDay(
  staffId: string,
  date: string,
  off: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { shopInstant } = await import("./time");
  const dayStart = shopInstant(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  if (off) {
    const { error } = await supabase.from("staff_time_off").insert({
      staff_id: staffId,
      starts_at: dayStart.toISOString(),
      ends_at: dayEnd.toISOString(),
      reason: "Off day",
    });
    if (error) return { ok: false, error: toMessage(error, "Could not mark the day off.") };
  } else {
    // Clears only this staff member's marks on this one day.
    const { error } = await supabase
      .from("staff_time_off")
      .delete()
      .eq("staff_id", staffId)
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString());
    if (error) return { ok: false, error: toMessage(error, "Could not clear the day off.") };
  }

  revalidatePath(`/staff/day/${date}`);
  return { ok: true };
}

/** Creates a walk-in nobody could find by name or phone, giving them the next
 *  running W number. Reception does not have to think about the number. */
export async function createWalkInAction(input: {
  fullName: string;
  phone?: string;
}): Promise<ActionResult & { customerId?: string; customerCode?: string }> {
  const supabase = await createClient();
  const name = input.fullName.trim();
  if (!name) return { ok: false, error: "A name is required." };

  const { data: code, error: codeError } = await supabase.rpc("next_walkin_code");
  if (codeError) return { ok: false, error: toMessage(codeError, "Could not allocate a number.") };

  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: name,
      phone: input.phone?.trim() || null,
      customer_code: code as string,
      customer_type: "walk_in",
    })
    .select("id, customer_code")
    .single();

  if (error) return { ok: false, error: toMessage(error, "Could not save the customer.") };
  return { ok: true, customerId: data.id as string, customerCode: data.customer_code as string };
}
