// Types mirroring web/db/migrations/0001_appointments.sql.
//
// Hand-written rather than generated, because the schema is meant to be
// readable alongside these. If the SQL changes, change this file in the same
// commit. (`supabase gen types typescript` can replace this later — see
// web/db/README.md.)

export type StaffRole = "therapist" | "manager" | "admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

/** The shop's customer numbering encodes this: a bare number ('0666') is a
 *  course customer, a 'W' prefix ('W1187') is a walk-in with no course. */
export type CustomerType = "course" | "walk_in";

export type BookingSource =
  | "walk_in"
  | "phone"
  | "whatsapp"
  | "instagram"
  | "web"
  | "referral"
  | "other";

/** Statuses that still occupy a therapist's time. Anything outside this set
 *  frees the slot — matches the EXCLUDE constraint predicates in the SQL. */
export const BLOCKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "arrived",
  "in_progress",
  "completed",
];

/** ISO weekday, 1 = Monday ... 7 = Sunday. Matches business_hours.weekday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Staff {
  id: string;
  authUserId: string | null;
  fullName: string;
  displayName: string;
  initials: string | null;
  role: StaffRole;
  colour: string;
  phone: string | null;
  email: string | null;
  isBookable: boolean;
  /** 'always' = a permanent column in the day grid (the six therapists).
   *  'when_booked' = a column only on days this person has someone in
   *  (the manager, the owner, Eunice). Nine columns will not fit a tablet. */
  columnMode: "always" | "when_booked";
  /** Eunice. Not on the shop roster, so roster checks are skipped. */
  isFreelancer: boolean;
  /** true = can perform any treatment (the six therapists). false = ONLY the
   *  treatments listed in staff_treatments, and an empty list means none.
   *  Never infer capability from the absence of rows — that fails open. */
  performsAllTreatments: boolean;
  isActive: boolean;
  sortOrder: number;
}

/** Restricted performers only. A staff member with NO entries can do
 *  anything — the six therapists are deliberately absent from this table. */
export interface StaffTreatment {
  staffId: string;
  treatmentId: string;
}

/** A habitual facial start time: 10:00 / 12:00 / 14:00 / 16:00 Mon-Sat,
 *  10:00 / 12:30 / 14:30 Sunday. A one-tap default on the booking screen,
 *  never a restriction — odd-hour bookings are normal. */
export interface StandardSlot {
  id: string;
  weekday: Weekday;
  startsAt: string;  // 'HH:MM'
  sortOrder: number;
}

export interface Customer {
  id: string;
  /** The shop's handwritten number — '0666', 'W1187'. Text, not a number. */
  customerCode: string | null;
  customerType: CustomerType;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  /** Set on a family member; points at the account holder. */
  primaryContactId: string | null;
  relationship: string | null;
  preferredTherapistId: string | null;
  /** true = do not book anyone else without asking the customer first. */
  preferredTherapistStrict: boolean;
  notes: string | null;
  isActive: boolean;
}

export interface Treatment {
  id: string;
  slug: string;
  /** Shop shorthand from the book, e.g. '808 A-P'. */
  code: string | null;
  name: string;
  category: string | null;
  durationMinutes: number;
  durationMaxMinutes: number | null;
  bufferAfterMinutes: number;
  /** true where the length depends on the area being treated (waxing, 808).
   *  The booking screen prompts for a duration instead of defaulting it. */
  durationIsFlexible: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface BusinessHours {
  weekday: Weekday;
  opensAt: string | null;   // 'HH:MM'
  closesAt: string | null;  // 'HH:MM'
  isClosed: boolean;
}

export interface StaffShift {
  id: string;
  staffId: string;
  weekday: Weekday;
  startsAt: string;  // 'HH:MM'
  endsAt: string;    // 'HH:MM'
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface StaffTimeOff {
  id: string;
  staffId: string;
  startsAt: string;  // ISO timestamp
  endsAt: string;
  reason: string | null;
}

/** One booking = one row in the paper book. The people are in `guests`. */
export interface Appointment {
  id: string;
  reference: string;
  contactCustomerId: string;
  /** Shop-local date, 'YYYY-MM-DD'. Kept in sync with the earliest guest. */
  appointmentDate: string;
  status: BookingStatus;
  source: BookingSource;
  /** The Remarks column. */
  notes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One person being treated. A family of four is one Appointment and four of
 *  these, each free to have its own treatment, therapist and start time. */
export interface AppointmentGuest {
  id: string;
  appointmentId: string;
  /** Null for an unnamed family member — read `relationship` instead. */
  customerId: string | null;
  /** "daughter", "husband". Only set when there is no customer record. */
  relationship: string | null;
  /** Optional — often not recorded for a plain facial. */
  treatmentId: string | null;
  /** null = slot booked, therapist not yet assigned. */
  therapistId: string | null;
  startsAt: string;  // ISO timestamp
  endsAt: string;
  status: BookingStatus;
  priceMyr: number | null;
  notes: string | null;
  seq: number;
}

/** What the day view renders: the booking plus everyone in it, resolved. */
export interface AppointmentWithGuests extends Appointment {
  contact: Pick<Customer, "id" | "customerCode" | "fullName" | "phone">;
  guests: ResolvedGuest[];
}

export interface ResolvedGuest extends AppointmentGuest {
  /** Null for an unnamed family member. */
  customer: Pick<
    Customer,
    "id" | "customerCode" | "fullName" | "phone" | "preferredTherapistId" | "preferredTherapistStrict"
  > | null;
  /** null when the treatment was not recorded. */
  treatment: Pick<Treatment, "id" | "slug" | "code" | "name" | "durationMinutes"> | null;
  therapist: Pick<Staff, "id" | "displayName" | "initials" | "colour"> | null;
  /** true when the assigned therapist is not this customer's saved
   *  preference — the booking screen flags it before saving. */
  preferenceMismatch: boolean;
}

/** Payload the booking form submits. The server assigns times, checks the
 *  roster and writes the appointment + guests in one transaction. */
export interface NewBookingInput {
  contactCustomerId: string;
  source: BookingSource;
  notes?: string;
  guests: NewGuestInput[];
}

export interface NewGuestInput {
  /** Existing customer, or a new one to create (a family member usually). */
  customerId?: string;
  newCustomer?: {
    fullName: string;
    phone?: string;
    relationship?: string;
    /** Links the new person to the account holder. */
    primaryContactId?: string;
  };
  treatmentId?: string | null;
  therapistId: string | null;
  startsAt: string;
  /** Defaults to one 30-minute slot when no treatment is chosen. */
  durationMinutes?: number;
  notes?: string;
}
