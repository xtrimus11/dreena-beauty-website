// Booking rules, as pure functions over data the caller has already loaded.
//
// Deliberately free of any database import so these can be unit-tested and
// reused on the client (to grey out impossible slots while someone is
// choosing) and on the server (to reject a bad booking).
//
// This layer is advisory. The authoritative guard against double-booking is
// the EXCLUDE constraint in the database — two tablets booking Sally at 3pm
// in the same second both pass these checks and the database still rejects
// the loser. Always handle that error; never rely on this module alone.

import {
  BLOCKING_STATUSES,
  type AppointmentGuest,
  type BusinessHours,
  type StaffShift,
  type StaffTimeOff,
  type Staff,
  type StaffTreatment,
  type Treatment,
} from "./types";
import { minutesFromMidnight, shopDate, shopTime, shopWeekday } from "./time";

export type ConflictReason =
  | "shop_closed"
  | "outside_opening_hours"
  | "therapist_not_rostered"
  | "therapist_time_off"
  | "therapist_double_booked"
  | "customer_double_booked"
  | "therapist_cannot_perform";

export interface Conflict {
  reason: ConflictReason;
  /** Ready to show to staff, in their words rather than the database's. */
  message: string;
  /** The clashing booking, when there is one. */
  guestId?: string;
}

export interface AvailabilityContext {
  businessHours: BusinessHours[];
  closures: string[];            // 'YYYY-MM-DD'
  shifts: StaffShift[];
  timeOff: StaffTimeOff[];
  /** Which restricted staff may perform which treatment. Only meaningful
   *  alongside staffById — capability is decided by the flag on the staff
   *  row, not by absence from this list. */
  staffTreatments: StaffTreatment[];
  /** The staff being checked, keyed by id, so canPerform() can read
   *  performsAllTreatments. Omit and the capability check is skipped. */
  staffById?: Record<string, Pick<Staff, "id" | "performsAllTreatments">>;
  /** Freelancers are not governed by the shop roster, so their shifts are
   *  not checked. Keyed by staff id. */
  freelancerIds?: string[];
  /** Every guest already booked on the day being checked. */
  existingGuests: AppointmentGuest[];
}

export interface SlotRequest {
  therapistId: string | null;
  customerId: string | null;
  /** Needed to check the therapist can actually perform it. */
  treatmentId?: string;
  startsAt: Date;
  endsAt: Date;
  /** Set when editing, so a booking does not clash with its own old self. */
  ignoreGuestId?: string;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  // Half-open [start, end): back-to-back bookings do not overlap.
  return aStart < bEnd && bStart < aEnd;
}

function isBlocking(status: AppointmentGuest["status"]): boolean {
  return BLOCKING_STATUSES.includes(status);
}

/** Every reason this slot cannot be booked. Empty array means it is free. */
export function findConflicts(
  request: SlotRequest,
  context: AvailabilityContext,
): Conflict[] {
  const conflicts: Conflict[] = [];
  const date = shopDate(request.startsAt);

  // 1. Is the shop open at all?
  if (context.closures.includes(date)) {
    conflicts.push({ reason: "shop_closed", message: "The shop is closed on this date." });
  }

  const weekday = shopWeekday(request.startsAt);
  const hours = context.businessHours.find((h) => h.weekday === weekday);
  if (hours?.isClosed) {
    conflicts.push({ reason: "shop_closed", message: "The shop is closed on this day of the week." });
  } else if (hours?.opensAt && hours.closesAt) {
    const start = minutesFromMidnight(shopTime(request.startsAt));
    const end = minutesFromMidnight(shopTime(request.endsAt));
    if (start < minutesFromMidnight(hours.opensAt) || end > minutesFromMidnight(hours.closesAt)) {
      conflicts.push({
        reason: "outside_opening_hours",
        message: `This runs outside opening hours (${hours.opensAt}-${hours.closesAt}).`,
      });
    }
  }

  // Everything below is about a specific therapist. An unassigned slot is
  // legal — the shop books the time first and picks the person later.
  if (request.therapistId) {
    const therapistId = request.therapistId;

    // 2. Can this person perform this treatment at all? Eunice does eyelash
    // perming and nothing else; the manager does eyebag; the owner does
    // tattoo. Decided by the explicit flag, so a restriction list that failed
    // to load cannot silently grant permission.
    const performer = context.staffById?.[therapistId];
    if (request.treatmentId && performer) {
      if (!canPerform(performer, request.treatmentId, context.staffTreatments)) {
        conflicts.push({
          reason: "therapist_cannot_perform",
          message: "This person does not do that treatment.",
        });
      }
    }

    // 3. Is the therapist rostered for this weekday?
    const rostered = context.shifts.some((shift) => {
      if (shift.staffId !== therapistId || shift.weekday !== weekday) return false;
      if (shift.effectiveFrom > date) return false;
      if (shift.effectiveTo && shift.effectiveTo < date) return false;
      const start = minutesFromMidnight(shopTime(request.startsAt));
      const end = minutesFromMidnight(shopTime(request.endsAt));
      return start >= minutesFromMidnight(shift.startsAt) && end <= minutesFromMidnight(shift.endsAt);
    });

    // No shifts on file for this person at all means the roster has not been
    // set up yet — do not block the booking over missing configuration.
    // Freelancers are never rostered by definition.
    const hasAnyShift = context.shifts.some((s) => s.staffId === therapistId);
    const isFreelancer = context.freelancerIds?.includes(therapistId) ?? false;
    if (hasAnyShift && !rostered && !isFreelancer) {
      conflicts.push({
        reason: "therapist_not_rostered",
        message: "This therapist is not working at that time.",
      });
    }

    // 4. Leave, MC, or the OFF mark on the day page.
    const off = context.timeOff.find(
      (t) =>
        t.staffId === therapistId &&
        overlaps(request.startsAt, request.endsAt, new Date(t.startsAt), new Date(t.endsAt)),
    );
    if (off) {
      conflicts.push({
        reason: "therapist_time_off",
        message: off.reason ? `Therapist is off: ${off.reason}.` : "Therapist is off at that time.",
      });
    }

    // 5. Already with another customer.
    const clash = context.existingGuests.find(
      (g) =>
        g.id !== request.ignoreGuestId &&
        g.therapistId === therapistId &&
        isBlocking(g.status) &&
        overlaps(request.startsAt, request.endsAt, new Date(g.startsAt), new Date(g.endsAt)),
    );
    if (clash) {
      conflicts.push({
        reason: "therapist_double_booked",
        message: "This therapist already has a customer at that time.",
        guestId: clash.id,
      });
    }
  }

  // 6. The customer cannot be in two chairs at once. Matters most for family
  // bookings, where it is easy to put a mother in two overlapping slots.
  if (request.customerId) {
    const clash = context.existingGuests.find(
      (g) =>
        g.id !== request.ignoreGuestId &&
        g.customerId === request.customerId &&
        isBlocking(g.status) &&
        overlaps(request.startsAt, request.endsAt, new Date(g.startsAt), new Date(g.endsAt)),
    );
    if (clash) {
      conflicts.push({
        reason: "customer_double_booked",
        message: "This customer is already booked at that time.",
        guestId: clash.id,
      });
    }
  }

  return conflicts;
}

/**
 * Can this person perform this treatment?
 *
 * Reads the explicit flag on the staff row, never the absence of rows in
 * `staffTreatments`. A restriction list that failed to load must not widen
 * anyone's permissions — a specialist with no listed treatments can perform
 * none, not all.
 */
export function canPerform(
  staff: Pick<Staff, "id" | "performsAllTreatments">,
  treatmentId: string,
  staffTreatments: StaffTreatment[],
): boolean {
  if (staff.performsAllTreatments) return true;
  return staffTreatments.some((st) => st.staffId === staff.id && st.treatmentId === treatmentId);
}

/** Chair time plus clean-down. What actually gets blocked out. */
export function blockedMinutes(treatment: Treatment, overrideMinutes?: number): number {
  return (overrideMinutes ?? treatment.durationMinutes) + treatment.bufferAfterMinutes;
}

/**
 * Turns the database's EXCLUDE-constraint violation into staff-readable text.
 * Postgres raises 23P01 (exclusion_violation) with the constraint name, which
 * is the only way to tell the two guards apart.
 */
export function describeConstraintViolation(constraintName: string): string {
  switch (constraintName) {
    case "appointment_guests_no_therapist_overlap":
      return "That therapist was just booked for the same time by someone else. Pick another slot or therapist.";
    case "appointment_guests_no_customer_overlap":
      return "This customer already has an overlapping booking.";
    default:
      return "That slot is no longer available. Refresh the day and try again.";
  }
}
