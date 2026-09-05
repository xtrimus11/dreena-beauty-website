// Reads for the staff diary. Server-side only — every call goes through the
// signed-in staff member's session, so RLS applies.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { shopDate, shopInstant, shopWeekday } from "./time";
import type { TurnStanding } from "./rotation";
import type {
  AppointmentWithGuests,
  BookingStatus,
  BookingSource,
  ResolvedGuest,
  Staff,
  StandardSlot,
  Treatment,
  Weekday,
} from "./types";

/** The signed-in staff member, or null. Drives what the shell shows. */
export async function getCurrentStaff(): Promise<Staff | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  // A signed-in user with no staff row is normal (not yet linked) and returns
  // null. An actual error is not, and must not look the same.
  if (error) throw new Error(`Could not identify the signed-in staff member: ${error.message}`);

  return data ? toStaff(data) : null;
}

/** Therapists who get a column in the day grid: the six permanent ones, plus
 *  anyone on `when_booked` who actually has a booking that day. */
export async function getDayColumns(date: string): Promise<Staff[]> {
  const supabase = await createClient();
  const dayStart = shopInstant(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const [{ data: staffRows, error: staffError }, { data: bookedRows, error: bookedError }] =
    await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("is_active", true)
      .eq("is_bookable", true)
      .order("sort_order"),
    supabase
      .from("appointment_guests")
      .select("therapist_id")
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString())
      .not("therapist_id", "is", null)
      .not("status", "in", "(cancelled)"),
  ]);

  // Surface a failed read rather than rendering an empty, wrong-looking day.
  // A blocked query returns no rows, which is indistinguishable from "nothing
  // booked" unless the error is checked.
  if (staffError) throw new Error(`Could not load the roster: ${staffError.message}`);
  if (bookedError) throw new Error(`Could not load the day: ${bookedError.message}`);

  const bookedToday = new Set((bookedRows ?? []).map((r) => r.therapist_id as string));

  return (staffRows ?? [])
    .map(toStaff)
    .filter((s) => s.columnMode === "always" || bookedToday.has(s.id));
}

/** Everything on one day, grouped into bookings. One query, then assembled
 *  in memory — a day is at most a few dozen rows. */
export async function getDay(date: string): Promise<AppointmentWithGuests[]> {
  const supabase = await createClient();
  const dayStart = shopInstant(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const { data, error } = await supabase
    .from("appointment_guests")
    .select(
      `id, appointment_id, customer_id, relationship, treatment_id, therapist_id,
       starts_at, ends_at, status, price_myr, notes, seq,
       appointments!inner ( id, reference, contact_customer_id, appointment_date,
                            status, source, notes, cancelled_at, cancellation_reason,
                            created_by, updated_by, created_at, updated_at,
                            contact:customers!appointments_contact_customer_id_fkey
                              ( id, customer_code, customer_type, full_name, phone ) ),
       customer:customers!appointment_guests_customer_id_fkey
         ( id, customer_code, customer_type, full_name, phone,
           preferred_therapist_strict,
           customer_preferred_therapists ( staff_id, rank ) ),
       treatment:treatments ( id, slug, code, name, duration_minutes, duration_is_flexible ),
       therapist:staff ( id, display_name, initials, colour )`,
    )
    .gte("starts_at", dayStart.toISOString())
    .lt("starts_at", dayEnd.toISOString())
    .order("starts_at");

  if (error) throw new Error(`Could not load ${date}: ${error.message}`);

  // Group guests under their booking, preserving time order.
  const byAppointment = new Map<string, AppointmentWithGuests>();

  for (const row of data ?? []) {
    // PostgREST types embedded rows as arrays; they are single objects here.
    const appt = one(row.appointments);
    if (!appt) continue;

    if (!byAppointment.has(appt.id)) {
      const contact = one(appt.contact);
      byAppointment.set(appt.id, {
        id: appt.id,
        reference: appt.reference,
        contactCustomerId: appt.contact_customer_id,
        appointmentDate: appt.appointment_date,
        status: appt.status as BookingStatus,
        source: appt.source as BookingSource,
        notes: appt.notes,
        cancelledAt: appt.cancelled_at,
        cancellationReason: appt.cancellation_reason,
        createdBy: appt.created_by,
        updatedBy: appt.updated_by,
        createdAt: appt.created_at,
        updatedAt: appt.updated_at,
        contact: {
          id: contact?.id ?? "",
          customerCode: contact?.customer_code ?? null,
          fullName: contact?.full_name ?? "Unknown",
          phone: contact?.phone ?? null,
        },
        guests: [],
      });
    }

    const customer = one(row.customer);
    const treatment = one(row.treatment);
    const therapist = one(row.therapist);

    const guest: ResolvedGuest = {
      id: row.id,
      appointmentId: row.appointment_id,
      customerId: row.customer_id,
      // Added in 0011; the inferred row type does not carry it yet.
      relationship: (row as { relationship?: string | null }).relationship ?? null,
      treatmentId: row.treatment_id,
      therapistId: row.therapist_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status as BookingStatus,
      priceMyr: row.price_myr,
      notes: row.notes,
      seq: row.seq,
      customer: customer
        ? {
            id: customer.id,
            customerCode: customer.customer_code ?? null,
            fullName: customer.full_name,
            phone: customer.phone ?? null,
            preferredTherapistIds: preferenceIds(customer),
            preferredTherapistStrict: customer.preferred_therapist_strict ?? false,
          }
        : null,
      // Left null rather than faked: "no treatment recorded" is a normal
      // state and the sheet shows the row without one.
      treatment: treatment
        ? {
            id: treatment.id,
            slug: treatment.slug,
            code: treatment.code ?? null,
            name: treatment.name,
            durationMinutes: treatment.duration_minutes,
          }
        : null,
      therapist: therapist
        ? {
            id: therapist.id,
            displayName: therapist.display_name,
            initials: therapist.initials,
            colour: therapist.colour,
          }
        : null,
      // Flagged only when preferences exist and none of them was honoured.
      preferenceMismatch:
        preferenceIds(customer).length > 0 &&
        !!row.therapist_id &&
        !preferenceIds(customer).includes(row.therapist_id),
    };

    byAppointment.get(appt.id)!.guests.push(guest);
  }

  return [...byAppointment.values()];
}

/** Opening hours for the day, used to bound the grid. */
export async function getDayHours(date: string) {
  const supabase = await createClient();
  const weekday = shopWeekday(shopInstant(date, "12:00")) as Weekday;

  const [{ data: hours, error: hoursError }, { data: closure, error: closureError }] =
    await Promise.all([
      supabase.from("business_hours").select("*").eq("weekday", weekday).maybeSingle(),
      supabase.from("closures").select("reason").eq("closure_date", date).maybeSingle(),
    ]);

  if (hoursError) throw new Error(`Could not load opening hours: ${hoursError.message}`);
  // Swallowing this would render a public holiday as an ordinary open day and
  // let staff book into it. Fail loudly instead.
  if (closureError) throw new Error(`Could not check closures: ${closureError.message}`);

  return {
    weekday,
    opensAt: (hours?.opens_at as string | undefined)?.slice(0, 5) ?? "10:00",
    closesAt: (hours?.closes_at as string | undefined)?.slice(0, 5) ?? "18:30",
    isClosed: Boolean(hours?.is_closed) || Boolean(closure),
    closureReason: (closure?.reason as string | undefined) ?? null,
  };
}

/** Who is off today — the OFF marks in the paper book's staff box. */
export async function getDayTimeOff(date: string) {
  const supabase = await createClient();
  const dayStart = shopInstant(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const { data, error } = await supabase
    .from("staff_time_off")
    .select("id, staff_id, starts_at, ends_at, reason")
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());

  if (error) throw new Error(`Could not load time off: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    staffId: r.staff_id as string,
    startsAt: r.starts_at as string,
    endsAt: r.ends_at as string,
    reason: (r.reason as string | null) ?? null,
  }));
}

export async function getStandardSlots(weekday: Weekday): Promise<StandardSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("standard_slots")
    .select("*")
    .eq("weekday", weekday)
    .order("sort_order");

  // This one failed silently once: no policy meant no rows, which looked
  // exactly like "this weekday has no standard slots".
  if (error) throw new Error(`Could not load the standard slots: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    weekday: r.weekday as Weekday,
    startsAt: (r.starts_at as string).slice(0, 5),
    sortOrder: r.sort_order as number,
  }));
}

// Helpers ---------------------------------------------------------------------

/** Preference ids in the customer's own rank order — first choice first.
 *  A to-many embed always arrives as an array, empty when there are none. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function preferenceIds(customer: any): string[] {
  const rows = (customer?.customer_preferred_therapists ?? []) as { staff_id: string; rank: number }[];
  return [...rows].sort((a, b) => a.rank - b.rank).map((r) => r.staff_id);
}

/** PostgREST types a to-one embed as an array in some versions. Normalise. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function one<T>(value: T | T[] | null | undefined): any {
  return Array.isArray(value) ? value[0] : value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStaff(r: any): Staff {
  return {
    id: r.id,
    authUserId: r.auth_user_id,
    fullName: r.full_name,
    displayName: r.display_name,
    initials: r.initials,
    role: r.role,
    colour: r.colour,
    phone: r.phone,
    email: r.email,
    isBookable: r.is_bookable,
    columnMode: r.column_mode,
    isFreelancer: r.is_freelancer,
    performsAllTreatments: r.performs_all_treatments,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  };
}

/** Turn standings for one day: that day's counts plus the previous day's,
 *  which breaks the start-of-morning tie when everyone is still on zero.
 *  Calls turn_standings_for() (db/migrations/0003_turn_rotation.sql). */
export async function getTurnStandings(date: string): Promise<TurnStanding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("turn_standings_for", { target_date: date });
  if (error) throw new Error(`Could not load the turn order: ${error.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    staffId: r.staff_id as string,
    displayName: r.display_name as string,
    initials: (r.initials as string | null) ?? null,
    colour: r.colour as string,
    turnCountToday: (r.turn_count_today as number) ?? 0,
    turnCountPrevious: (r.turn_count_previous as number) ?? 0,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

/** Therapists rostered on a given weekday, for the rotation's availability
 *  check. Empty means the roster has not been set up — callers treat that as
 *  "do not exclude anyone" rather than "nobody works". */
export async function getRosteredStaffIds(date: string): Promise<string[]> {
  const supabase = await createClient();
  const weekday = shopWeekday(shopInstant(date, "12:00"));

  const { data, error } = await supabase
    .from("staff_shifts")
    .select("staff_id, effective_from, effective_to")
    .eq("weekday", weekday)
    .lte("effective_from", date);

  if (error) throw new Error(`Could not load the roster: ${error.message}`);

  return [...new Set(
    (data ?? [])
      .filter((r) => !r.effective_to || (r.effective_to as string) >= date)
      .map((r) => r.staff_id as string),
  )];
}

/** Customer lookup for the booking form. Matches the three things staff have
 *  in front of them: the code from the book, a phone number, or a name. */
export async function searchCustomers(query: string, limit = 12) {
  const supabase = await createClient();
  const q = query.trim();
  if (q.length < 2) return [];

  // Escape PostgREST's or() delimiters so a comma or paren in the query
  // cannot break out of the filter expression.
  const safe = q.replace(/[,()]/g, " ");

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, customer_code, customer_type, full_name, phone, preferred_therapist_strict, primary_contact_id, notes, customer_preferred_therapists ( staff_id, rank )",
    )
    .eq("is_active", true)
    .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,customer_code.ilike.%${safe}%`)
    .order("full_name")
    .limit(limit);

  if (error) throw new Error(`Customer search failed: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    customerCode: (r.customer_code as string | null) ?? null,
    customerType: r.customer_type as "course" | "walk_in",
    fullName: r.full_name as string,
    phone: (r.phone as string | null) ?? null,
    preferredTherapistIds: preferenceIds(r),
    preferredTherapistStrict: Boolean(r.preferred_therapist_strict),
    primaryContactId: (r.primary_contact_id as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
  }));
}

/** The bookable menu, for the treatment picker. */
export async function getTreatments(): Promise<Treatment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`Could not load treatments: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    code: (r.code as string | null) ?? null,
    name: r.name as string,
    category: (r.category as string | null) ?? null,
    durationMinutes: r.duration_minutes as number,
    durationMaxMinutes: (r.duration_max_minutes as number | null) ?? null,
    bufferAfterMinutes: (r.buffer_after_minutes as number) ?? 0,
    durationIsFlexible: Boolean(r.duration_is_flexible),
    isActive: Boolean(r.is_active),
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

/** Everyone who can be assigned to a treatment, plus who is restricted to
 *  what. `restrictions` follows the staff_treatments convention: a staff id
 *  absent from it can perform anything. */
export async function getBookableStaff() {
  const supabase = await createClient();
  const [{ data: staffRows, error: staffError }, { data: restrictionRows, error: restrictionError }] =
    await Promise.all([
      supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .eq("is_bookable", true)
        .order("sort_order"),
      supabase.from("staff_treatments").select("staff_id, treatment_id"),
    ]);

  if (staffError) throw new Error(`Could not load the roster: ${staffError.message}`);
  // Critical: a silently-empty restriction list used to read as "everyone can
  // do everything". It no longer can (capability is a flag on the staff row),
  // but a failed read must still be loud rather than quietly permissive.
  if (restrictionError) {
    throw new Error(`Could not load treatment permissions: ${restrictionError.message}`);
  }

  return {
    staff: (staffRows ?? []).map(toStaff),
    restrictions: (restrictionRows ?? []).map((r) => ({
      staffId: r.staff_id as string,
      treatmentId: r.treatment_id as string,
    })),
  };
}

/** One booking with everyone in it, for the detail screen. */
export async function getBooking(id: string): Promise<AppointmentWithGuests | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load the booking: ${error.message}`);
  if (!data) return null;

  // Reuse getDay's assembly rather than duplicating the embed — a booking
  // always sits inside one day, and a day is a handful of rows.
  const day = await getDay(data.appointment_date as string);
  return day.find((b) => b.id === id) ?? null;
}

/** What has happened to this booking — moved, cancelled, reassigned — read
 *  from the audit trail so the detail screen can show a history without the
 *  shop having to keep one by hand. */
export async function getBookingHistory(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_audit")
    .select("id, action, created_at, actor_staff_id, before, after")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw new Error(`Could not load the booking history: ${error.message}`);

  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .select("id, display_name");

  if (staffError) throw new Error(`Could not load the roster: ${staffError.message}`);
  const names = new Map((staffRows ?? []).map((s) => [s.id as string, s.display_name as string]));

  return (data ?? []).map((r) => ({
    id: r.id as number,
    action: r.action as string,
    createdAt: r.created_at as string,
    actorName: r.actor_staff_id ? (names.get(r.actor_staff_id as string) ?? null) : null,
  }));
}

export interface MonthDay {
  date: string;          // 'YYYY-MM-DD'
  bookings: number;      // people, not parties — that is what fills the day
  unassigned: number;    // still waiting on the turn order
  isClosed: boolean;
  closureReason: string | null;
  staffOff: string[];    // display names
}

/** A month at a glance: how full each day is, what is closed, who is off.
 *  One pass over the month's rows — a month is a few hundred at most, so it
 *  is cheaper to bucket in memory than to make the database group. */
export async function getMonthOverview(month: string): Promise<MonthDay[]> {
  const supabase = await createClient();
  const [y, m] = month.split("-").map(Number);

  const first = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const rangeStart = shopInstant(first, "00:00");
  const rangeEnd = new Date(shopInstant(last, "00:00").getTime() + 86_400_000);

  const [
    { data: guests, error: guestError },
    { data: hours, error: hoursError },
    { data: closures, error: closuresError },
    { data: timeOff, error: timeOffError },
    { data: staffRows, error: staffError },
  ] = await Promise.all([
      supabase
        .from("appointment_guests")
        .select("starts_at, status, therapist_id")
        .gte("starts_at", rangeStart.toISOString())
        .lt("starts_at", rangeEnd.toISOString()),
      supabase.from("business_hours").select("weekday, is_closed"),
      supabase.from("closures").select("closure_date, reason").gte("closure_date", first).lte("closure_date", last),
      // No embed: staff_time_off has two foreign keys to staff (staff_id and
      // created_by), so `staff ( … )` is ambiguous and PostgREST rejects it.
      // Names are joined in memory from a separate read instead.
      supabase
        .from("staff_time_off")
        .select("staff_id, starts_at, ends_at")
        .lt("starts_at", rangeEnd.toISOString())
        .gt("ends_at", rangeStart.toISOString()),
      supabase.from("staff").select("id, display_name"),
    ]);

  if (guestError) throw new Error(`Could not load the month: ${guestError.message}`);
  if (timeOffError) throw new Error(`Could not load time off: ${timeOffError.message}`);
  if (hoursError) throw new Error(`Could not load opening hours: ${hoursError.message}`);
  // Same trap as the day view: a failed read would paint every closed day open.
  if (closuresError) throw new Error(`Could not load closures: ${closuresError.message}`);
  if (staffError) throw new Error(`Could not load the roster: ${staffError.message}`);

  const closedWeekdays = new Set(
    (hours ?? []).filter((h) => h.is_closed).map((h) => h.weekday as number),
  );
  const closureByDate = new Map(
    (closures ?? []).map((c) => [c.closure_date as string, (c.reason as string | null) ?? null]),
  );

  const counts = new Map<string, { bookings: number; unassigned: number }>();
  for (const g of guests ?? []) {
    if (g.status === "cancelled") continue;
    const d = shopDate(g.starts_at as string);
    const c = counts.get(d) ?? { bookings: 0, unassigned: 0 };
    c.bookings += 1;
    if (!g.therapist_id) c.unassigned += 1;
    counts.set(d, c);
  }

  const staffNames = new Map(
    (staffRows ?? []).map((s) => [s.id as string, s.display_name as string]),
  );

  const offByDate = new Map<string, string[]>();
  for (const t of timeOff ?? []) {
    const name = staffNames.get(t.staff_id as string);
    if (!name) continue;
    // Time off can span days; mark every shop day it touches.
    for (
      let t0 = new Date(t.starts_at as string);
      t0 < new Date(t.ends_at as string);
      t0 = new Date(t0.getTime() + 86_400_000)
    ) {
      const d = shopDate(t0);
      offByDate.set(d, [...(offByDate.get(d) ?? []), name]);
    }
  }

  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    const weekday = shopWeekday(shopInstant(date, "12:00"));
    const c = counts.get(date) ?? { bookings: 0, unassigned: 0 };
    return {
      date,
      bookings: c.bookings,
      unassigned: c.unassigned,
      isClosed: closedWeekdays.has(weekday) || closureByDate.has(date),
      closureReason: closureByDate.get(date) ?? null,
      staffOff: [...new Set(offByDate.get(date) ?? [])],
    };
  });
}

export interface FoundBooking {
  guestId: string;
  appointmentId: string;
  reference: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  treatmentName: string | null;
  therapistName: string | null;
  notes: string | null;
}

export interface FoundCustomer {
  id: string;
  customerCode: string | null;
  customerType: "course" | "walk_in";
  fullName: string;
  phone: string | null;
  notes: string | null;
  upcoming: FoundBooking[];
  past: FoundBooking[];
}

/** Finds customers and their bookings. Staff search for one of three things
 *  they have to hand — the code from the book, a phone number, or a name —
 *  or a booking reference read off a message. */
export async function searchBookings(query: string): Promise<FoundCustomer[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const today = shopDate(new Date());
  const todayStart = shopInstant(today, "00:00").toISOString();

  // A reference is unambiguous, so it short-circuits the name search.
  const byReference = /^DR-[0-9A-Z]{4,8}$/i.test(q);
  let customerIds: string[] = [];
  let matched: Awaited<ReturnType<typeof searchCustomers>> = [];

  if (byReference) {
    const { data, error } = await supabase
      .from("appointments")
      .select("contact_customer_id")
      .ilike("reference", q);
    if (error) throw new Error(`Search failed: ${error.message}`);
    customerIds = (data ?? []).map((r) => r.contact_customer_id as string);
  } else {
    matched = await searchCustomers(q, 25);
    customerIds = matched.map((m) => m.id);
  }
  if (customerIds.length === 0) return [];

  const { data, error } = await supabase
    .from("appointment_guests")
    .select(
      `id, appointment_id, customer_id, starts_at, ends_at, status, notes,
       appointments!inner ( reference ),
       customer:customers!appointment_guests_customer_id_fkey
         ( id, customer_code, customer_type, full_name, phone, notes ),
       treatment:treatments ( name ),
       therapist:staff ( display_name )`,
    )
    .in("customer_id", customerIds)
    .order("starts_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Search failed: ${error.message}`);

  const byCustomer = new Map<string, FoundCustomer>();

  // Seed with everyone who matched, before looking at bookings at all. Building
  // the map only from booking rows meant a customer with none never appeared —
  // and most of the 3,500 imported customers have none yet, so searching for a
  // real regular answered "nothing found".
  for (const m of matched) {
    byCustomer.set(m.id, {
      id: m.id,
      customerCode: m.customerCode,
      customerType: m.customerType,
      fullName: m.fullName,
      phone: m.phone,
      notes: m.notes,
      upcoming: [],
      past: [],
    });
  }

  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = one<any>(row.customer);
    if (!c) continue;

    if (!byCustomer.has(c.id)) {
      byCustomer.set(c.id, {
        id: c.id,
        customerCode: c.customer_code ?? null,
        customerType: c.customer_type,
        fullName: c.full_name,
        phone: c.phone ?? null,
        notes: c.notes ?? null,
        upcoming: [],
        past: [],
      });
    }

    const booking: FoundBooking = {
      guestId: row.id as string,
      appointmentId: row.appointment_id as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reference: one<any>(row.appointments)?.reference ?? "",
      startsAt: row.starts_at as string,
      endsAt: row.ends_at as string,
      status: row.status as BookingStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      treatmentName: one<any>(row.treatment)?.name ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      therapistName: one<any>(row.therapist)?.display_name ?? null,
      notes: (row.notes as string | null) ?? null,
    };

    const entry = byCustomer.get(c.id)!;
    if (booking.startsAt >= todayStart) entry.upcoming.push(booking);
    else entry.past.push(booking);
  }

  // Soonest first for what is coming; most recent first for what has been.
  for (const entry of byCustomer.values()) {
    entry.upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  // Customers with something upcoming are what staff are usually after.
  return [...byCustomer.values()].sort(
    (a, b) => (b.upcoming.length > 0 ? 1 : 0) - (a.upcoming.length > 0 ? 1 : 0),
  );
}

export interface Departure {
  guestId: string;
  appointmentId: string;
  customerName: string;
  customerCode: string | null;
  kind: "cancelled" | "moved";
  originalTime: string;
  movedTo: string | null;
  reason: string | null;
  actor: string | null;
  happenedAt: string | null;
}

/** What left this day — cancelled, or moved to another date. The sheet cannot
 *  show either: a cancelled booking is hidden, and a moved one now belongs to
 *  a different day. Reads day_departures() (0015). */
export async function getDayDepartures(date: string): Promise<Departure[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("day_departures", { target_date: date });
  if (error) throw new Error(`Could not load the day's changes: ${error.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    guestId: r.guest_id as string,
    appointmentId: r.appointment_id as string,
    customerName: (r.customer_name as string) ?? "Guest",
    customerCode: (r.customer_code as string | null) ?? null,
    kind: r.kind as "cancelled" | "moved",
    originalTime: r.original_time as string,
    movedTo: (r.moved_to as string | null) ?? null,
    reason: (r.reason as string | null) ?? null,
    actor: (r.actor as string | null) ?? null,
    happenedAt: (r.happened_at as string | null) ?? null,
  }));
}
