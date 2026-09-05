-- Two changes to how people get into a booking.
--
-- 1. A NEW FACE GETS A W NUMBER AUTOMATICALLY.
--    If reception cannot find someone by name or phone, they are a walk-in
--    who has not signed up for a course — which is exactly what the 'W'
--    prefix means. Making reception invent the number is a step that gets
--    skipped, so the sequence issues the next one.
--
--    PLACEHOLDER START VALUE: the sequence begins at 2000, which is NOT the
--    shop's real running number. Set it once, from the paper book:
--        select setval('walkin_code_seq', <last W number used>);
--
-- 2. A FAMILY MEMBER NEEDS NO NAME.
--    "Lim + daughter" is how the booking is taken. Forcing a name invents
--    data, so a guest may have no customer at all and carry just a
--    relationship. They get a customer record later, if they ever want one.

begin;

create sequence if not exists walkin_code_seq start 2000;

-- 'W2000', 'W2001', ... Unique by construction; the unique index on
-- customers.customer_code is the backstop if the sequence is ever reset low.
create or replace function next_walkin_code() returns text
language sql volatile as $$
  select 'W' || nextval('walkin_code_seq')::text;
$$;

-- A guest with no customer row: the unnamed family member.
alter table appointment_guests
  alter column customer_id drop not null;

alter table appointment_guests
  add column if not exists relationship text;

comment on column appointment_guests.customer_id is
  'Null for an unnamed family member — "Lim + daughter". Read relationship instead when this is null.';
comment on column appointment_guests.relationship is
  'For a guest with no customer row: "daughter", "husband". Ignored when customer_id is set.';

-- A guest must be identifiable one way or the other.
alter table appointment_guests
  add constraint appointment_guests_identified
  check (customer_id is not null or nullif(btrim(relationship), '') is not null);

-- The customer-overlap guard only applies to guests who ARE a customer.
-- Unnamed guests have no id to collide on, and two daughters in one booking
-- must not be treated as the same person.
alter table appointment_guests
  drop constraint appointment_guests_no_customer_overlap;

alter table appointment_guests
  add constraint appointment_guests_no_customer_overlap
  exclude using gist (customer_id with =, slot with &&)
  where (customer_id is not null and status not in ('cancelled', 'no_show'));

-- create_booking: accept a guest with only a relationship.
create or replace function create_booking(
  p_contact_customer_id uuid,
  p_source              booking_source,
  p_notes               text,
  p_guests              jsonb
) returns uuid
language plpgsql security invoker as $$
declare
  v_appointment_id uuid;
  v_date           date;
  g                jsonb;
  v_minutes        integer;
begin
  if jsonb_array_length(p_guests) = 0 then
    raise exception 'A booking needs at least one person';
  end if;
  if jsonb_array_length(p_guests) > 5 then
    raise exception 'A booking can hold at most 5 people';
  end if;

  select min((e->>'starts_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date
    into v_date
    from jsonb_array_elements(p_guests) e;

  insert into appointments (contact_customer_id, appointment_date, source, notes, created_by, updated_by)
  values (p_contact_customer_id, v_date, p_source, nullif(btrim(p_notes), ''),
          current_staff_id(), current_staff_id())
  returning id into v_appointment_id;

  for g in select * from jsonb_array_elements(p_guests) loop
    v_minutes := coalesce(nullif(g->>'duration_minutes', '')::integer, 30);

    insert into appointment_guests (
      appointment_id, customer_id, relationship, treatment_id, therapist_id,
      starts_at, ends_at, notes, seq
    ) values (
      v_appointment_id,
      nullif(g->>'customer_id', '')::uuid,
      nullif(btrim(coalesce(g->>'relationship', '')), ''),
      nullif(g->>'treatment_id', '')::uuid,
      nullif(g->>'therapist_id', '')::uuid,
      (g->>'starts_at')::timestamptz,
      (g->>'starts_at')::timestamptz + make_interval(mins => v_minutes),
      nullif(btrim(coalesce(g->>'notes', '')), ''),
      coalesce((g->>'seq')::smallint, 1)
    );
  end loop;

  return v_appointment_id;
end;
$$;

commit;
