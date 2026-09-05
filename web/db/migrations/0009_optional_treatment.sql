-- Treatment becomes optional.
--
-- The shop books a name into a time slot. What the treatment is often is not
-- known when the phone call happens, and for most facials it does not need
-- recording at all — the paper sheet only notes it for the short services
-- ("Cheah (waxing)") because those change how many people fit in the day.
--
-- Requiring it forced reception to invent an answer, so it is now nullable.
-- A guest with no treatment occupies one 30-minute slot by default, which is
-- the granularity the sheet is ruled at.

begin;

alter table appointment_guests
  alter column treatment_id drop not null;

comment on column appointment_guests.treatment_id is
  'Optional. Null means the treatment was not recorded — normal for a plain facial booking. Set for the short services, where the length decides how many more people fit.';

-- create_booking already passes null through; this makes the default length
-- explicit rather than relying on the caller always sending one.
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
    -- One 30-minute slot unless a length was given.
    v_minutes := coalesce(nullif(g->>'duration_minutes', '')::integer, 30);

    insert into appointment_guests (
      appointment_id, customer_id, treatment_id, therapist_id,
      starts_at, ends_at, notes, seq
    ) values (
      v_appointment_id,
      (g->>'customer_id')::uuid,
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
