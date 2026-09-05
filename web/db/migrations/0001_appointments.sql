-- d'reena appointment system — core schema.
--
-- Plain PostgreSQL 14+, hosted on Supabase — the same project as the skin
-- analysis submissions, so one database and one set of logins. Nothing in
-- this file is Supabase-specific except current_staff_id(), which falls back
-- to a session variable, so the schema could be lifted to a self-hosted
-- Postgres later with a dump and a restore.
--
-- Models the paper day-book the shop runs today:
--   one page  = one day
--   one row   = one booking, which may hold several people ("Andy | Datin
--               Sim"), each with their own treatment and therapist
--   staff box = who is working / OFF that day
--
-- All times are timestamptz. The shop operates in Asia/Kuala_Lumpur; the
-- app converts for display (see src/lib/appointments/time.ts).

begin;

-- 1. Extensions ------------------------------------------------------------

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists btree_gist; -- uuid = + range && in one EXCLUDE
create extension if not exists pg_trgm;    -- fuzzy customer name search

-- 2. Enums -----------------------------------------------------------------

create type staff_role as enum ('therapist', 'manager', 'admin');

-- One status vocabulary for both the booking and each person in it, so a
-- 2-person booking can have one guest 'completed' and the other 'no_show'.
create type booking_status as enum (
  'pending',      -- penciled in, not yet confirmed with the customer
  'confirmed',
  'arrived',      -- customer is in the shop
  'in_progress',
  'completed',
  'no_show',
  'cancelled'
);

-- Encoded in the shop's own customer numbers: a bare number ('0666', '5200')
-- is a course customer, a 'W' prefix ('W1187') is a walk-in who has not
-- signed up for a course.
create type customer_type as enum ('course', 'walk_in');

create type booking_source as enum (
  'walk_in', 'phone', 'whatsapp', 'instagram', 'web', 'referral', 'other'
);

-- 3. People ----------------------------------------------------------------

create table staff (
  id                uuid primary key default gen_random_uuid(),
  -- Links to Supabase auth.users. Null until the person is invited, so a
  -- therapist can sit on the roster and be booked before they have a login.
  auth_user_id      uuid unique,
  full_name         text not null,
  -- Short form shown in calendar column headers and on the phone view.
  -- Unique so a calendar column is never ambiguous, and so the seed file
  -- can be re-run without duplicating the roster.
  display_name      text not null unique,
  -- The handwritten initials from the paper book (CT, SLY, ...). Kept
  -- because existing records and staff shorthand use them.
  initials          text,
  role              staff_role not null default 'therapist',
  -- Calendar column accent colour, hex including '#'.
  colour            text not null default '#0F766E'
                      check (colour ~ '^#[0-9A-Fa-f]{6}$'),
  phone             text,
  email             text,
  -- false for reception/admin who never take appointments — they can use
  -- the system but get no column in the day grid.
  is_bookable       boolean not null default true,
  -- Nine people can take a booking but only six work every day, and nine
  -- columns will not fit on a tablet. 'always' = a permanent column (the six
  -- therapists); 'when_booked' = a column appears only on days this person
  -- actually has someone in (the manager, the owner, Eunice).
  column_mode       text not null default 'always'
                      check (column_mode in ('always', 'when_booked')),
  -- Not shop staff. Eunice comes in for eyelash perming; the shop roster does
  -- not govern her hours, so roster checks are skipped for freelancers.
  is_freelancer     boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index staff_active_idx on staff (is_active, sort_order) where is_active;

create table customers (
  id                uuid primary key default gen_random_uuid(),
  -- The shop's existing handwritten customer number, e.g. '0666', '5200',
  -- 'W1187'. Text, not a number: leading zeros and the 'W' prefix are
  -- meaningful. Unique when present, but optional so a walk-in can be
  -- booked in seconds and numbered later.
  customer_code     text unique,
  -- Whether this person is on a course. Kept as its own column rather than
  -- parsed out of customer_code, because a walk-in can be booked before
  -- anyone assigns them a number.
  customer_type     customer_type not null default 'walk_in',
  full_name         text not null,
  phone             text,
  email             text,
  date_of_birth     date,

  -- Family linkage. A daughter booked under her mother's account points at
  -- the mother here, so the shop can still hold her own preferences and
  -- treatment history separately.
  primary_contact_id uuid references customers (id) on delete set null,
  relationship       text,   -- 'daughter', 'husband', 'mother', free text

  -- The saved preference. 'strict' means do not book anyone else without
  -- asking; otherwise it is a hint the booking screen surfaces first.
  preferred_therapist_id     uuid references staff (id) on delete set null,
  preferred_therapist_strict boolean not null default false,

  notes             text,   -- allergies, sensitivities, standing requests
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint customers_not_own_contact check (primary_contact_id is distinct from id),

  -- The shop's numbering convention, enforced so a mistyped code is caught at
  -- entry: 'W1187' must be a walk-in, '0666' must be a course customer. Drop
  -- this constraint if the convention ever gains an exception.
  constraint customers_code_matches_type check (
    customer_code is null
    or (customer_code like 'W%' and customer_type = 'walk_in')
    or (customer_code not like 'W%' and customer_type = 'course')
  )
);

create index customers_phone_idx on customers (phone);
create index customers_name_trgm_idx on customers using gin (full_name gin_trgm_ops);
create index customers_code_idx on customers (customer_code);
create index customers_primary_contact_idx on customers (primary_contact_id);

-- 4. Service menu ----------------------------------------------------------

create table treatments (
  id                    uuid primary key default gen_random_uuid(),
  -- Matches the slug in src/data/allTreatments.ts so the booking screen and
  -- the public site stay in step.
  slug                  text unique not null,
  -- The shorthand written in the book, e.g. '808 A-P'. Optional.
  code                  text,
  name                  text not null,
  category              text,
  -- Default chair time. duration_max_minutes is set only for the menu items
  -- quoted as a range ("90-120 min"); the booking screen defaults to the
  -- minimum and lets staff stretch it.
  duration_minutes      integer not null check (duration_minutes > 0),
  duration_max_minutes  integer check (duration_max_minutes >= duration_minutes),
  -- Clean-down time reserved after the treatment. Blocks the therapist but
  -- is not shown to the customer as part of their appointment.
  buffer_after_minutes  integer not null default 0 check (buffer_after_minutes >= 0),
  -- true where the real length depends on what is being done — waxing an
  -- underarm and waxing a full leg are the same menu item. The booking screen
  -- treats duration_minutes as a starting point and puts the duration field
  -- in front of the therapist instead of quietly defaulting it.
  duration_is_flexible  boolean not null default false,
  is_active             boolean not null default true,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index treatments_active_idx on treatments (is_active, sort_order) where is_active;

-- 5. When the shop and each therapist are available -------------------------

-- weekday follows ISO: 1 = Monday ... 7 = Sunday.
create table business_hours (
  weekday    smallint primary key check (weekday between 1 and 7),
  opens_at   time,
  closes_at  time,
  is_closed  boolean not null default false,
  constraint business_hours_valid
    check (is_closed or (opens_at is not null and closes_at is not null and closes_at > opens_at))
);

-- The habitual facial slots — 10:00 / 12:00 / 14:00 / 16:00 Mon-Sat, and
-- 10:00 / 12:30 / 14:30 on Sunday. These are the one-tap defaults on the
-- booking screen, NOT a restriction: the shop regularly takes customers at
-- odd hours between them, and nothing here prevents that. A booking outside
-- a standard slot is completely normal.
create table standard_slots (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 1 and 7),
  starts_at  time not null,
  sort_order integer not null default 0,
  unique (weekday, starts_at)
);

-- Whole-shop closures: public holidays, CNY, renovation.
create table closures (
  id           uuid primary key default gen_random_uuid(),
  closure_date date not null unique,
  reason       text,
  created_at   timestamptz not null default now()
);

-- A therapist's normal working week. effective_from/to lets a roster change
-- without destroying the history of what the old roster was.
create table staff_shifts (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references staff (id) on delete cascade,
  weekday        smallint not null check (weekday between 1 and 7),
  starts_at      time not null,
  ends_at        time not null,
  effective_from date not null default current_date,
  effective_to   date,
  constraint staff_shifts_valid check (ends_at > starts_at),
  constraint staff_shifts_dates check (effective_to is null or effective_to >= effective_from)
);

create index staff_shifts_lookup_idx on staff_shifts (staff_id, weekday);

-- The "OFF" written next to a name on the paper page: leave, MC, a half day
-- out, or a lunch block. Date-ranged rather than per-day so a week of leave
-- is one row.
create table staff_time_off (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_by  uuid references staff (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint staff_time_off_valid check (ends_at > starts_at)
);

create index staff_time_off_lookup_idx on staff_time_off (staff_id, starts_at, ends_at);

-- Who can perform what.
--
-- Read as: a person with NO rows here can do anything (the six therapists,
-- so the shop is not made to enter six times thirty combinations). A person
-- WITH rows is limited to exactly those treatments — the manager to eyebag,
-- the owner to tattoo, Eunice to eyelash perming. Same convention as
-- staff_shifts, where no shifts on file means "roster not configured, do not
-- block".
create table staff_treatments (
  staff_id     uuid not null references staff (id) on delete cascade,
  treatment_id uuid not null references treatments (id) on delete cascade,
  primary key (staff_id, treatment_id)
);

-- 6. The booking itself ------------------------------------------------------

-- Short human-readable reference, e.g. 'DR-7QK4M2'. Ambiguous characters
-- (0/O, 1/I) are excluded so it can be read aloud over the phone.
create or replace function generate_booking_reference() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate text;
  i integer;
begin
  loop
    candidate := 'DR-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from appointments where reference = candidate);
  end loop;
  return candidate;
end;
$$;

-- One row per booking = one row in the paper book. The party (1 to 5 people)
-- lives in appointment_guests.
create table appointments (
  id                  uuid primary key default gen_random_uuid(),
  reference           text unique not null default generate_booking_reference(),
  -- Who made the booking / who the shop calls. Family members in the party
  -- each get their own customers row, linked back to this one.
  contact_customer_id uuid not null references customers (id) on delete restrict,
  -- Denormalised from the earliest guest by trigger, so the day view is a
  -- single indexed lookup. Stored in shop-local time.
  appointment_date    date not null,
  status              booking_status not null default 'confirmed',
  source              booking_source not null default 'walk_in',
  -- The Remarks column.
  notes               text,
  cancelled_at        timestamptz,
  cancellation_reason text,
  created_by          uuid references staff (id) on delete set null,
  updated_by          uuid references staff (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index appointments_date_idx on appointments (appointment_date, status);
create index appointments_contact_idx on appointments (contact_customer_id);

-- One row per person being treated. This is the unit that occupies a
-- therapist's time, so a family of four is one appointment and four guests,
-- each free to have a different treatment, therapist and start time.
create table appointment_guests (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  customer_id    uuid not null references customers (id) on delete restrict,
  treatment_id   uuid not null references treatments (id) on delete restrict,
  -- Null means "not yet assigned" — a real state at booking time, when the
  -- shop knows the slot but not who will take it.
  therapist_id   uuid references staff (id) on delete set null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         booking_status not null default 'confirmed',
  -- Recorded at booking time so a later menu price change never rewrites
  -- history. Null until priced.
  price_myr      numeric(10, 2) check (price_myr >= 0),
  notes          text,
  -- Display order within the party.
  seq            smallint not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint appointment_guests_valid_time check (ends_at > starts_at),

  -- Generated range used by the overlap guards below. '[)' so a 14:00-15:00
  -- treatment and a 15:00-16:00 treatment do not count as overlapping.
  slot tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored
);

create index appointment_guests_appointment_idx on appointment_guests (appointment_id);
create index appointment_guests_customer_idx on appointment_guests (customer_id);
create index appointment_guests_therapist_day_idx on appointment_guests (therapist_id, starts_at);
create index appointment_guests_slot_idx on appointment_guests using gist (slot);

-- 7. Double-booking guards ---------------------------------------------------
--
-- Enforced by the database, not the UI. Two staff booking the same therapist
-- from two tablets at the same second cannot both succeed — the second one
-- gets a constraint violation the app turns into "Sally is already booked at
-- 3pm". Cancelled and no-show rows are excluded so their time frees up.

alter table appointment_guests
  add constraint appointment_guests_no_therapist_overlap
  exclude using gist (therapist_id with =, slot with &&)
  where (therapist_id is not null and status not in ('cancelled', 'no_show'));

-- The same person cannot be in two chairs at once. Drop this constraint if
-- the shop ever books a customer into two overlapping services on purpose.
alter table appointment_guests
  add constraint appointment_guests_no_customer_overlap
  exclude using gist (customer_id with =, slot with &&)
  where (status not in ('cancelled', 'no_show'));

-- 8. Triggers ----------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger staff_touch          before update on staff          for each row execute function touch_updated_at();
create trigger customers_touch      before update on customers      for each row execute function touch_updated_at();
create trigger treatments_touch     before update on treatments     for each row execute function touch_updated_at();
create trigger appointments_touch   before update on appointments   for each row execute function touch_updated_at();
create trigger guests_touch         before update on appointment_guests for each row execute function touch_updated_at();

-- Keep appointments.appointment_date equal to the earliest guest's local
-- date, so "show me Wednesday" never misses a booking that was moved.
create or replace function sync_appointment_date() returns trigger
language plpgsql as $$
declare
  target uuid := coalesce(new.appointment_id, old.appointment_id);
  earliest date;
begin
  select min(starts_at at time zone 'Asia/Kuala_Lumpur')::date
    into earliest
    from appointment_guests
   where appointment_id = target;

  if earliest is not null then
    update appointments set appointment_date = earliest
     where id = target and appointment_date is distinct from earliest;
  end if;

  return null;
end;
$$;

create trigger guests_sync_appointment_date
  after insert or update of starts_at or delete on appointment_guests
  for each row execute function sync_appointment_date();

-- Identifies the signed-in staff member, on either deployment target.
-- Supabase: resolved from auth.uid(). Self-hosted Postgres: the app sets
-- `SET LOCAL app.staff_id = '<uuid>'` on the transaction. The auth.uid()
-- call goes through EXECUTE so this file still installs on a plain Postgres
-- where the auth schema does not exist.
create or replace function current_staff_id() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  sid uuid;
  uid uuid;
begin
  begin
    sid := nullif(current_setting('app.staff_id', true), '')::uuid;
  exception when others then
    sid := null;
  end;
  if sid is not null then
    return sid;
  end if;

  begin
    execute 'select auth.uid()' into uid;
  exception when others then
    uid := null;
  end;
  if uid is null then
    return null;
  end if;

  return (select id from staff where auth_user_id = uid);
end;
$$;

-- 10. Audit trail --------------------------------------------------------------
--
-- Who moved what, and when. The paper book loses this the moment someone
-- reaches for the correction fluid — visible in the photo of the current page.

create table appointment_audit (
  id             bigserial primary key,
  appointment_id uuid,
  guest_id       uuid,
  action         text not null,  -- created | updated | rescheduled | reassigned | cancelled | deleted
  actor_staff_id uuid references staff (id) on delete set null,
  before         jsonb,
  after          jsonb,
  created_at     timestamptz not null default now()
);

create index appointment_audit_appointment_idx on appointment_audit (appointment_id, created_at desc);

create or replace function log_guest_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  act text;
begin
  if tg_op = 'INSERT' then
    act := 'created';
  elsif tg_op = 'DELETE' then
    act := 'deleted';
  elsif old.starts_at is distinct from new.starts_at then
    act := 'rescheduled';
  elsif old.therapist_id is distinct from new.therapist_id then
    act := 'reassigned';
  elsif old.status is distinct from new.status then
    act := case when new.status = 'cancelled' then 'cancelled' else 'updated' end;
  else
    act := 'updated';
  end if;

  insert into appointment_audit (appointment_id, guest_id, action, actor_staff_id, before, after)
  values (
    coalesce(new.appointment_id, old.appointment_id),
    coalesce(new.id, old.id),
    act,
    current_staff_id(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return null;
end;
$$;

create trigger guests_audit
  after insert or update or delete on appointment_guests
  for each row execute function log_guest_change();

commit;
