// Shop-local time helpers.
//
// Everything in the database is timestamptz (an absolute instant). Everything
// on screen is Kuala Lumpur wall-clock time. This module is the only place
// that converts between the two, so no component has to think about it.
//
// UTC+8 with no daylight saving means the offset is constant, but these go
// through Intl rather than hardcoding +08:00 — a hardcoded offset is the kind
// of thing that silently rots.

export const SHOP_TIMEZONE = "Asia/Kuala_Lumpur";

/** Slot granularity of the day grid. The paper book runs in 15-minute lines. */
export const SLOT_MINUTES = 15;

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** 'YYYY-MM-DD' for the shop's calendar day containing this instant. */
export function shopDate(instant: Date | string): string {
  return dateParts.format(new Date(instant));
}

/** 'HH:MM' wall-clock time at the shop. */
export function shopTime(instant: Date | string): string {
  return timeParts.format(new Date(instant));
}

/** ISO weekday at the shop: 1 = Monday ... 7 = Sunday. Matches the SQL. */
export function shopWeekday(instant: Date | string): number {
  // Build a UTC date from the shop-local Y-M-D so getUTCDay() is not skewed
  // by the runtime's own timezone.
  const [y, m, d] = shopDate(instant).split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Turns a shop-local date and wall-clock time into an absolute instant.
 * Finds the offset by measuring how far a naive UTC reading of the wall
 * clock lands from the true instant, which stays correct if Malaysia ever
 * changes its offset.
 */
export function shopInstant(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm);
  // What wall clock does that instant show at the shop?
  const probe = new Date(naiveUtc);
  const [py, pm, pd] = shopDate(probe).split("-").map(Number);
  const [sh, sm] = shopTime(probe).split(":").map(Number);
  const shownUtc = Date.UTC(py, pm - 1, pd, sh, sm);
  const offset = shownUtc - naiveUtc;
  return new Date(naiveUtc - offset);
}

/** Minutes since midnight, for positioning a booking in the day grid. */
export function minutesFromMidnight(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

export function addMinutes(instant: Date | string, minutes: number): Date {
  return new Date(new Date(instant).getTime() + minutes * 60_000);
}

/** '2:30 pm' — how a time is read out to a customer on the phone. */
export function formatForStaff(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(instant))
    .toLowerCase();
}
