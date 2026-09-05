-- Two changes from how the shop actually works.
--
-- 1. ARRIVAL, NOT COMPLETION, EARNS THE TURN POINT.
--    The shop does not track "in progress" or "done": once a customer walks
--    in, reception taps Arrived and assigns a therapist, and that is the end
--    of the interaction. Nobody goes back later to mark it finished.
--
--    So the turn point has to be awarded on arrival. Left on 'completed' the
--    counts would stay at zero forever and the whole rotation would silently
--    stop working. 'completed' still awards a point, so any booking closed
--    that way is not lost, but nothing in the UI depends on it.
--
--    A no-show still earns nothing: the customer never arrived.
--
-- 2. A CANCELLED BOOKING IS USUALLY A MOVED BOOKING.
--    When a customer cancels, the shop's first question is whether they want
--    another date. reschedule_booking moves the whole party in one
--    transaction, keeping their clock times.

begin;

create or replace function sync_turn_ledger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from turn_ledger where guest_id = old.id;
    return null;
  end if;

  -- 'arrived' is the moment the shop records; 'completed' is kept so a
  -- booking closed that way still counts.
  if new.status in ('arrived', 'in_progress', 'completed') and new.therapist_id is not null then
    insert into turn_ledger (staff_id, guest_id, reason, effective_date)
    values (
      new.therapist_id,
      new.id,
      'treatment',
      (new.starts_at at time zone 'Asia/Kuala_Lumpur')::date
    )
    on conflict (guest_id) do update set staff_id = excluded.staff_id;
  else
    -- Back to booked, cancelled, no-show, or unassigned: take the point away.
    delete from turn_ledger where guest_id = new.id;
  end if;

  return null;
end;
$$;

-- Moves an entire booking to another date, keeping each person's clock time
-- and length. One transaction: a family of three moves together or not at all.
--
-- Returns the new date so the caller can navigate there.
create or replace function reschedule_booking(
  p_appointment_id uuid,
  p_new_date       date,
  p_note           text
) returns date
language plpgsql security invoker as $$
declare
  v_old_date date;
begin
  select appointment_date into v_old_date from appointments where id = p_appointment_id;
  if v_old_date is null then
    raise exception 'No such booking';
  end if;

  update appointment_guests g
     set starts_at = ((p_new_date + (g.starts_at at time zone 'Asia/Kuala_Lumpur')::time)
                        at time zone 'Asia/Kuala_Lumpur'),
         ends_at   = ((p_new_date + (g.starts_at at time zone 'Asia/Kuala_Lumpur')::time)
                        at time zone 'Asia/Kuala_Lumpur') + (g.ends_at - g.starts_at)
   where g.appointment_id = p_appointment_id
     and g.status <> 'cancelled';

  update appointments
     set appointment_date = p_new_date,
         -- Moving a booking un-cancels it: this is the "actually, can I come
         -- next Tuesday" path, not a fresh booking.
         status              = case when status = 'cancelled' then 'confirmed' else status end,
         cancelled_at        = null,
         cancellation_reason = null,
         notes = trim(both e'\n' from
                   coalesce(notes || e'\n', '')
                   || 'Moved from ' || to_char(v_old_date, 'DD Mon')
                   || ' to ' || to_char(p_new_date, 'DD Mon')
                   || coalesce(' — ' || nullif(btrim(p_note), ''), '')),
         updated_by = current_staff_id()
   where id = p_appointment_id;

  return p_new_date;
end;
$$;

commit;
