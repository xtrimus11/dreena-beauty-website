-- Booking writes, as database functions.
--
-- A booking is an appointment plus one row per person, and those inserts must
-- be all-or-nothing: if the second guest collides with an existing booking,
-- the EXCLUDE constraint rejects it and the appointment must not survive as an
-- empty shell. The Supabase client cannot open a transaction across several
-- statements, so the transaction lives here instead.
--
-- SECURITY INVOKER throughout: these run as the signed-in staff member, so RLS
-- and the audit trail's current_staff_id() both behave normally.

begin;

-- Creates the appointment and every guest in one transaction.
--
-- p_guests is a JSON array of:
--   { customer_id, treatment_id, therapist_id | null, starts_at,
--     duration_minutes, notes, seq }
--
-- therapist_id is normally null — about half of customers have no preferred
-- therapist and the person is picked later from the turn order.
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
begin
  if jsonb_array_length(p_guests) = 0 then
    raise exception 'A booking needs at least one person';
  end if;
  if jsonb_array_length(p_guests) > 5 then
    raise exception 'A booking can hold at most 5 people';
  end if;

  -- The day the booking belongs to, in shop time. The trigger in 0001 keeps
  -- this in step afterwards; it is set here so the NOT NULL column is filled.
  select min((e->>'starts_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date
    into v_date
    from jsonb_array_elements(p_guests) e;

  insert into appointments (contact_customer_id, appointment_date, source, notes, created_by, updated_by)
  values (p_contact_customer_id, v_date, p_source, nullif(btrim(p_notes), ''),
          current_staff_id(), current_staff_id())
  returning id into v_appointment_id;

  for g in select * from jsonb_array_elements(p_guests) loop
    insert into appointment_guests (
      appointment_id, customer_id, treatment_id, therapist_id,
      starts_at, ends_at, notes, seq
    ) values (
      v_appointment_id,
      (g->>'customer_id')::uuid,
      (g->>'treatment_id')::uuid,
      nullif(g->>'therapist_id', '')::uuid,
      (g->>'starts_at')::timestamptz,
      (g->>'starts_at')::timestamptz
        + make_interval(mins => (g->>'duration_minutes')::integer),
      nullif(btrim(coalesce(g->>'notes', '')), ''),
      coalesce((g->>'seq')::smallint, 1)
    );
  end loop;

  return v_appointment_id;
end;
$$;

-- Cancels the whole booking: the appointment and every guest in it, together.
-- Cancelling rather than deleting keeps the history and frees the therapist's
-- time, because both EXCLUDE constraints ignore cancelled rows.
create or replace function cancel_booking(
  p_appointment_id uuid,
  p_reason         text
) returns void
language plpgsql security invoker as $$
begin
  update appointment_guests
     set status = 'cancelled'
   where appointment_id = p_appointment_id
     and status <> 'cancelled';

  update appointments
     set status              = 'cancelled',
         cancelled_at        = now(),
         cancellation_reason = nullif(btrim(p_reason), ''),
         updated_by          = current_staff_id()
   where id = p_appointment_id;
end;
$$;

commit;
