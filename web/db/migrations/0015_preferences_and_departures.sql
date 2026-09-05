-- Two additions.
--
-- 1. UP TO THREE PREFERRED THERAPISTS PER CUSTOMER.
--    One was never enough: a regular usually has a first choice and someone
--    they are equally happy with, and the shop needs to know the whole list
--    before falling back to the turn order.
--
-- 2. WHAT LEFT THE DAY. The day sheet shows what is booked; it cannot show
--    what was cancelled or moved away, because a moved booking now belongs to
--    another date. day_departures() reads that back out of the audit trail.

begin;

-- 1. Preferred therapists ----------------------------------------------------
--
-- The cap is structural rather than a trigger: rank is 1-3 and unique per
-- customer, so a fourth preference has no rank left to take.
create table customer_preferred_therapists (
  customer_id uuid not null references customers (id) on delete cascade,
  staff_id    uuid not null references staff (id) on delete cascade,
  rank        smallint not null check (rank between 1 and 3),
  created_at  timestamptz not null default now(),
  primary key (customer_id, staff_id),
  unique (customer_id, rank)
);

create index customer_preferred_therapists_staff_idx
  on customer_preferred_therapists (staff_id);

-- Carry the single existing preference over as first choice.
insert into customer_preferred_therapists (customer_id, staff_id, rank)
select id, preferred_therapist_id, 1
  from customers
 where preferred_therapist_id is not null
on conflict do nothing;

-- The old column would otherwise sit there looking authoritative while the
-- app reads the new table — the same trap as inferring capability from an
-- absent row. Dropped now that the data is copied.
alter table customers drop column preferred_therapist_id;

comment on table customer_preferred_therapists is
  'Up to three therapists a customer is happy with, rank 1 = first choice. Empty means no preference, which is about half of customers.';

alter table customer_preferred_therapists enable row level security;

create policy cpt_staff_read on customer_preferred_therapists
  for select using (is_active_staff());
create policy cpt_staff_write on customer_preferred_therapists
  for all using (is_active_staff()) with check (is_active_staff());

-- 2. What left the day -------------------------------------------------------
--
-- Cancellations still carry the original date, so they are a plain query.
-- Moves are not: the row's date has already changed, and only the audit trail
-- remembers it was ever here. SECURITY INVOKER so RLS still applies.
create or replace function day_departures(target_date date)
returns table (
  guest_id       uuid,
  appointment_id uuid,
  customer_name  text,
  customer_code  text,
  kind           text,   -- 'cancelled' | 'moved'
  original_time  timestamptz,
  moved_to       date,
  reason         text,
  actor          text,
  happened_at    timestamptz
)
language sql stable security invoker as $$
  -- Cancelled, and still sitting on this date.
  select
    g.id,
    g.appointment_id,
    coalesce(c.full_name, '+ ' || g.relationship, 'Guest'),
    c.customer_code,
    'cancelled',
    g.starts_at,
    null::date,
    a.cancellation_reason,
    s.display_name,
    a.cancelled_at
  from appointment_guests g
  join appointments a on a.id = g.appointment_id
  left join customers c on c.id = g.customer_id
  left join staff s on s.id = a.updated_by
  where g.status = 'cancelled'
    and (g.starts_at at time zone 'Asia/Kuala_Lumpur')::date = target_date

  union all

  -- Moved away: the audit row's "before" was this date, its "after" is not.
  select
    (l.after->>'id')::uuid,
    (l.after->>'appointment_id')::uuid,
    coalesce(c.full_name, '+ ' || (l.after->>'relationship'), 'Guest'),
    c.customer_code,
    'moved',
    (l.before->>'starts_at')::timestamptz,
    ((l.after->>'starts_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date,
    null,
    s.display_name,
    l.created_at
  from appointment_audit l
  left join customers c on c.id = (l.after->>'customer_id')::uuid
  left join staff s on s.id = l.actor_staff_id
  where l.action = 'rescheduled'
    and ((l.before->>'starts_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date = target_date
    and ((l.after->>'starts_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date <> target_date

  order by 6;
$$;

commit;
