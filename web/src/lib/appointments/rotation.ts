// The turn order.
//
// About half of customers have no preferred therapist, so the shop does not
// pick one when taking the booking. It runs a rotation: every treatment
// performed counts as 1, and the therapist with the lowest count takes the
// next unassigned customer.
//
// The count RESETS DAILY — turns are run per day, so everyone starts each
// morning on zero. That start-of-day tie is broken by yesterday's count,
// lowest first, which is the shop's rule that "the next day, the therapist
// with the lowest count starts first".
//
// Someone back from a day off lands at the top on their own: they earned
// nothing yesterday, so their previous-day count is zero. No special rule.
//
// Pure functions over data the caller loaded, so they can be unit-tested and
// run on both client and server.

import type { Staff } from "./types";

export interface TurnStanding {
  staffId: string;
  displayName: string;
  initials: string | null;
  colour: string;
  /** Treatments performed on the day being viewed. Resets every morning. */
  turnCountToday: number;
  /** The previous calendar day's count — the start-of-day tiebreak. Zero for
   *  anyone who was off, which is what puts them back at the top. */
  turnCountPrevious: number;
  sortOrder: number;
}

export interface TurnCandidate extends TurnStanding {
  /** Position in the queue, 1 = next up. */
  position: number;
  /** Why this person cannot take the next customer, if they cannot. */
  unavailable: "off" | "not_rostered" | "busy" | null;
}

export interface RotationContext {
  standings: TurnStanding[];
  /** Staff ids marked off for the day. */
  offStaffIds: string[];
  /** Staff ids with a treatment overlapping the moment being filled. */
  busyStaffIds: string[];
  /** Staff ids rostered to work that day. Empty means the roster is not set
   *  up, in which case nobody is excluded for it. */
  rosteredStaffIds: string[];
}

/**
 * The queue, lowest count first. Everyone is returned — including those who
 * cannot take the customer right now — because the shop needs to see the whole
 * standing, not just who is free. `unavailable` says why, and callers filter.
 *
 * Ordered by today's count, then yesterday's, then roster order. The middle
 * term is what makes the morning correct: everyone is on zero at opening, so
 * without it the first customers of the day would be handed out arbitrarily.
 * Roster order is the final tiebreak so the list never shuffles between page
 * loads — an order that moves on its own is one staff stop trusting.
 */
export function turnOrder(context: RotationContext): TurnCandidate[] {
  const off = new Set(context.offStaffIds);
  const busy = new Set(context.busyStaffIds);
  const rostered = new Set(context.rosteredStaffIds);
  const rosterKnown = context.rosteredStaffIds.length > 0;

  return [...context.standings]
    .sort(
      (a, b) =>
        a.turnCountToday - b.turnCountToday ||
        a.turnCountPrevious - b.turnCountPrevious ||
        a.sortOrder - b.sortOrder,
    )
    .map((s, i) => ({
      ...s,
      position: i + 1,
      unavailable: off.has(s.staffId)
        ? ("off" as const)
        : rosterKnown && !rostered.has(s.staffId)
          ? ("not_rostered" as const)
          : busy.has(s.staffId)
            ? ("busy" as const)
            : null,
    }));
}

/** Who should take the next unassigned customer: lowest count, actually
 *  available. Null when nobody is free. */
export function nextUp(context: RotationContext): TurnCandidate | null {
  return turnOrder(context).find((c) => c.unavailable === null) ?? null;
}

/**
 * The therapist to suggest for one booking.
 *
 * A saved preference wins over the rotation — that is the point of saving it.
 * A `strict` preference is never silently overridden; the booking screen makes
 * staff choose rather than quietly assigning someone else.
 */
export interface Suggestion {
  staffId: string | null;
  basis: "preference" | "rotation" | "none";
  /** Set when a preference exists but that person cannot take it. */
  preferenceUnavailable: "off" | "not_rostered" | "busy" | null;
  /** True when the preference is strict and cannot be met — needs a human. */
  needsDecision: boolean;
}

export function suggestTherapist(
  customer: { preferredTherapistId: string | null; preferredTherapistStrict: boolean },
  context: RotationContext,
): Suggestion {
  if (customer.preferredTherapistId) {
    const preferred = turnOrder(context).find((c) => c.staffId === customer.preferredTherapistId);

    if (preferred && preferred.unavailable === null) {
      return {
        staffId: preferred.staffId,
        basis: "preference",
        preferenceUnavailable: null,
        needsDecision: false,
      };
    }

    // Preference exists but is unavailable. A strict preference stops here.
    if (customer.preferredTherapistStrict) {
      return {
        staffId: null,
        basis: "none",
        preferenceUnavailable: preferred?.unavailable ?? "not_rostered",
        needsDecision: true,
      };
    }

    const fallback = nextUp(context);
    return {
      staffId: fallback?.staffId ?? null,
      basis: fallback ? "rotation" : "none",
      preferenceUnavailable: preferred?.unavailable ?? "not_rostered",
      needsDecision: false,
    };
  }

  const next = nextUp(context);
  return {
    staffId: next?.staffId ?? null,
    basis: next ? "rotation" : "none",
    preferenceUnavailable: null,
    needsDecision: false,
  };
}

/** Only the six floor therapists rotate. Specialists (the manager's eyebag,
 *  the owner's tattoo) and freelancers are outside it — they perform one
 *  treatment and taking a "turn" would distort everyone else's count. */
export function isInRotation(staff: Staff): boolean {
  return staff.isActive && staff.isBookable && !staff.isFreelancer && staff.columnMode === "always";
}
