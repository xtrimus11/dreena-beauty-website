# Appointment system — framework

Staff-only booking for d'reena. No customer-facing booking; the shop takes
bookings by phone, WhatsApp and walk-in, and staff record them here.

Replaces the paper day-book: one page per day, one row per booking, a row
holding one to five people, and a staff box marking who is OFF.

## Where it runs

**Supabase**, in the same project as the skin analysis submissions — one
database, one set of logins, and it fits the free tier comfortably at this
size. Staff sign in through Supabase Auth.

This was chosen over self-hosting on the shop's NAS because that NAS is a
DS220j: 512MB of RAM, soldered, which is not enough to run Postgres and
Next.js. A mini PC would have made local hosting viable and remains an option
(see [`../deploy/README.md`](../deploy/README.md)) — the schema is plain
PostgreSQL, so moving is a dump and a restore.

### What this costs, and the two things that answer it

The failure this accepts is that **no internet means no diary**. Both the
database and the app are reachable only over the internet. Two separate
mitigations, because they cover different failures:

| | Covers | Does not cover |
|---|---|---|
| Nightly `pg_dump` to the NAS | Data loss — a deleted month, a Supabase failure | Outages. It is a binary file needing a Postgres to read. |
| 4G router / phone hotspot | Outages — everything keeps working | Power cuts |

Setup for both is in [`../db/README.md`](../db/README.md). Fibre and mobile
failing simultaneously is the accepted risk; an offline read-only copy was
considered and deliberately dropped as not worth the machinery.

The DS220j's job here is the nightly dump, which it is properly sized for.

## Where it lives in the codebase

Inside the existing Next.js app at `/staff`, not a separate project. Same
repo, same brand CSS. The public site is untouched, and still deploys
wherever it deploys today — only the `/staff` routes need the NAS.

`src/middleware.ts` is scoped to six public paths, so `/staff` falls through
it today — the auth gate has to be composed into that middleware, not added
as a second one. Next only runs a single middleware file.

```
/staff/login              sign in
/staff                    today's diary (redirects by device tier)
/staff/day/[date]         one day, all therapists      — tablet + desktop
/staff/agenda/[date]      one day, one therapist, read-only — phone
/staff/booking/new        create a booking (1-5 people)
/staff/booking/[id]       view / edit / cancel
/staff/customers          search, merge, edit preferences
/staff/customers/[id]     history, family links, preferred therapist
/staff/roster             shifts, OFF days, closures     — manager only
/staff/treatments         durations, buffers, codes      — manager only
```

## Device tiers

One codebase, three behaviours, decided by viewport width:

| Width | Device | Behaviour |
|---|---|---|
| `< 768px` | Phone | Agenda view — pick one therapist, read their day — **plus taking and editing bookings**. Only the slot grid is withheld: six columns of half-hour boxes cannot be tapped accurately at this width. |
| `768–1279px` | Tablet | Full editing. Day sheet plus the turn board stacked. |
| `>= 1280px` | Desktop | Full editing. Sheet and turn board side by side. |

Phones were originally read-only, on the reasoning that mis-tapping a booking
on a 5-inch screen loses a customer's slot. The shop overruled that: therapists
carry phones, not tablets, and a booking they cannot take is a booking that
goes back on paper. Only the slot grid stays desktop-only now, because that is
a genuine precision problem rather than a caution.

## Data model

Two tables carry the booking, and the split is the important decision:

- **`appointments`** — one row in the paper book. Who to call, the date, the
  remarks, the status.
- **`appointment_guests`** — one row per *person being treated*. This is what
  occupies a therapist's time.

A mother booking herself and two daughters is **one appointment, three
guests**. Each guest has its own treatment, its own therapist, and its own
start time, so the three can run in parallel with three therapists, or
back-to-back with one — the model does not care, which is why it survives
the way the shop actually books.

Family members each get their own `customers` row, linked back to the account
holder by `primary_contact_id`. That is what lets a daughter hold her own
preferred therapist and her own treatment history rather than disappearing
into her mother's record.

### Preferred therapist

`customers.preferred_therapist_id`, plus `preferred_therapist_strict`:

- **not strict** — a hint. The booking screen offers that therapist first and
  flags it if someone else is chosen.
- **strict** — do not book anyone else without asking the customer.

`ResolvedGuest.preferenceMismatch` is what the booking screen reads to decide
whether to warn.

### Customer codes

`customers.customer_code` holds the shop's existing handwritten numbers.
Stored as text, not a number, because the format carries meaning:

| Code | Means |
|---|---|
| `0666`, `5200`, `1909` | A regular customer **on a course** |
| `W1187`, `W1678` | A **walk-in** who has not signed up for a course |

`customers.customer_type` stores that explicitly rather than re-parsing the
prefix, and a CHECK constraint keeps the two in step so a mistyped code is
caught at entry. The code is optional, so a new walk-in can be booked in
seconds and numbered afterwards.

**Courses themselves are deliberately out of scope.** The `W` convention
implies prepaid packages with a balance — sessions bought, sessions left,
expiry. That stays wherever the shop tracks it today; this system records only
*whether* someone is on a course, never the balance. Decided so the diary can
replace the paper book sooner. Revisit once it is running.

### The roster is nine people, not six

Six therapists work the floor — Jodie, Joe, Christal, Sally, Maggie, Venice.
Three more take bookings occasionally: the manager (eyebag treatment), Dareena
the owner (tattoo, rarely), and Eunice, a freelancer who comes in for eyelash
perming.

Nine columns will not fit on a tablet, so `staff.column_mode` decides: the six
therapists are `always` (a permanent column), the other three are
`when_booked` (a column appears only on days they actually have someone in).

Who can perform what is decided by **`staff.performs_all_treatments`**, an
explicit flag — `true` for the six therapists, `false` for Shaun, Dareena and
Eunice, who are then limited to the rows in `staff_treatments`.

It was originally the other way round: no rows meant no restriction, which
kept the six therapists out of the table entirely. That failed open. A missing
RLS policy made `staff_treatments` unreadable, the list came back empty, and
an empty list read as *everyone can do everything* — Eunice bookable for a
facial. Absence of data must never be a grant, so capability is now stated on
the staff row and an unreadable restriction list can only ever narrow
permissions. Use `canPerform()` from `availability.ts`; never test for
absence from `staff_treatments`.

Eunice is also flagged `is_freelancer`, which skips the roster check — the
shop's shifts do not govern her hours.

### The turn order — why this is not a calendar

**About half of customers have no preferred therapist.** The shop does not
decide who performs a treatment when the booking is taken; it runs a rotation.
Every treatment counts as 1, and the therapist with the lowest count takes the
next unassigned customer.

**The count resets daily.** Turns are run per day, so everyone starts each
morning on zero. The order is therefore:

1. today's count, lowest first
2. then **yesterday's** count, lowest first — this is what makes the morning
   correct, since at opening everyone is level and without it the first
   customers would be handed out arbitrarily
3. then roster order, so the list never reshuffles between page loads

Someone back from a day off comes back at the top with no special rule: they
earned nothing yesterday, so their previous-day count is zero. It falls out of
the arithmetic.

Because it resets daily there are **no opening balances to migrate** from the
paper tally — the system is correct from its first morning.

This is why the **day sheet, not a therapist-column calendar, is the primary
view**. A calendar assumes the therapist is known at booking time. For half
the bookings it is not, and a column grid has nowhere to write those down —
the same reason the paper page is a time-ordered list with the Therapist
column filled in later. The grid survives as a secondary view (`?view=grid`)
for reading one therapist's day; it is not where bookings are taken.

`appointment_guests.therapist_id` being null is therefore the **normal state**
of a fresh booking, not an error. The sheet shows those as "by turn".

The count lives in `turn_ledger` as one row per point, not as a running total
on `staff`, because a total cannot be audited or corrected. A point is awarded
when a treatment reaches `completed` — a no-show earns nothing, since the
therapist did no work and should not lose their turn. A treatment for a
customer who *did* request a therapist still counts; it is work done either
way. Reassigning a completed treatment moves the point.

`turn_standings_for(date)` is what the board reads — a function rather than a
view because the diary opens on any date and must show that day's rotation.

Specialists sit outside the rotation: the manager (eyebag), Dareena (tattoo)
and Eunice (lash perming) each perform one treatment, so giving them turns
would distort everyone else's count.

### Standard slots vs odd hours

Facials run two hours, and the habitual starts are 10:00 / 12:00 / 14:00 /
16:00 Mon-Sat, and 10:00 / 12:30 / 14:30 on Sunday. `standard_slots` holds
these as **one-tap defaults on the booking screen, not as a restriction** —
the shop regularly takes customers at odd hours between them, and nothing in
the schema or `findConflicts` prevents it.

The non-facial services (hair removal, waxing, cauteliser, eyebrow tattoo,
lash extensions, lash perming, eyebag) exist precisely because they are
shorter than a facial slot and let another customer be squeezed in. Getting
their durations right is what makes that work — see the TODO in the seed.

Waxing, 808 and Cauteliser are marked `duration_is_flexible`: one menu entry
each, with the therapist setting the real length at booking time, because an
underarm and a full leg are the same menu item. For those, the booking screen
must put the duration field **in front of** the therapist rather than
defaulting it silently — the seeded figure is only a starting point, and
capacity depends on staff getting it right.

## Every Supabase read must check `error`

Not a style preference — a bug class that bit this project four times.

PostgREST returns `{ data: null, error: {...} }` on failure, and destructuring
only `data` yields an empty array. **An empty array is indistinguishable from
"nothing here"**, so a blocked or malformed query renders as a plausible,
wrong answer instead of a failure. What that actually produced here:

- a missing RLS policy made `staff_treatments` read empty, and an empty
  restriction list meant *everyone can do everything* — Eunice bookable for a
  facial;
- the day sheet silently lost its standard-slot rows;
- an ambiguous embed on `staff_time_off` (two foreign keys to `staff`) made
  off-days vanish from the month view while showing correctly on the day;
- `getDayHours` ignoring the closures read would have painted a public holiday
  as an ordinary open day and let staff book into it.

So: every read destructures `error` and throws. `maybeSingle()` returning
`data: null` with no error is a legitimate "not found" and stays null — an
error is a different thing and must not look the same.

To check nothing has crept back in:

```bash
grep -nE 'const \{[^}]*\bdata\b[^}]*\} = await supabase' src/lib/appointments/*.ts | grep -v error
```

## Layers

```
  UI (React, /staff)              tablet + desktop edit, phone reads
        |
  Server Actions                  Supabase Auth session, then one transaction
        |
  findConflicts()                 advisory: hours, roster, capability, clashes
        |
  PostgreSQL EXCLUDE              the actual guarantee against double-booking
        |
  Supabase + RLS                  second line of defence behind the app
        |
  NAS                             nightly pg_dump (data loss cover only)
```

`findConflicts()` runs on the client too, to grey out impossible slots while
someone is choosing. It is never the last word — two tablets can pass it
simultaneously and the database rejects the loser with SQLSTATE 23P01.

## Build order

1. **Schema + auth** — migrations applied to Supabase, nine staff rows, logins
   invited and linked, `/staff/login` working.
   *(schema done; sign-in flow not started)*
2. **Read the day** — desktop day grid and phone agenda, read-only. Enter one
   real day by hand and check it against the paper page.
3. **Write** — create, edit, cancel, no-show. This is when the paper book can
   be retired, and when running both in parallel for a week matters.
4. **Customers** — search by code, phone or name; family links; preferences.
5. **Roster** — shifts, OFF days, closures, replacing the handwritten staff box.
6. **Later, if wanted** — WhatsApp reminders, daily summary, treatment history
   on the customer record, revenue reporting, and courses (see above —
   currently out of scope by decision, not by oversight).
