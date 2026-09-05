-- Rescheduling can now change the time, not just the date.
--
-- "Can I come at 4 instead?" is a more common call than "can I come next
-- week", and the old function could only move a booking to the same clock
-- time on another day. It now takes an optional time:
--
--   date only          -> same times, new day
--   time only          -> same day, shifted
--   both               -> new day and new time
--
-- A party keeps its internal spacing: the whole booking shifts by the
-- difference between its earliest start and the requested time, so a mother
-- at 12:00 and a daughter at 12:30 stay half an hour apart.

begin;

-- The 3-argument version would otherwise linger as an overload and callers
-- could bind to either.
drop function if exists reschedule_booking(uuid, date, text);

create or replace function reschedule_booking(
  p_appointment_id uuid,
  p_new_date       date,
  p_new_time       time,
  p_note           text
) returns date
language plpgsql security invoker as $$
declare
  v_old_date  date;
  v_old_first time;
  v_delta     interval := interval '0';
  v_moved     text;
begin
  select appointment_date into v_old_date from appointments where id = p_appointment_id;
  if v_old_date is null then
    raise exception 'No such booking';
  end if;

  select min((g.starts_at at time zone 'Asia/Kuala_Lumpur')::time)
    into v_old_first
    from appointment_guests g
   where g.appointment_id = p_appointment_id
     and g.status <> 'cancelled';

  if p_new_time is not null and v_old_first is not null then
    v_delta := p_new_time - v_old_first;
  end if;

  update appointment_guests g
     set starts_at = ((p_new_date
                        + (g.starts_at at time zone 'Asia/Kuala_Lumpur')::time
                        + v_delta) at time zone 'Asia/Kuala_Lumpur'),
         ends_at   = ((p_new_date
                        + (g.starts_at at time zone 'Asia/Kuala_Lumpur')::time
                        + v_delta) at time zone 'Asia/Kuala_Lumpur')
                     + (g.ends_at - g.starts_at),
         -- Nobody has arrived for an appointment that has not happened yet;
         -- this also releases any turn point already awarded (0005).
         status    = 'confirmed'
   where g.appointment_id = p_appointment_id
     and g.status <> 'cancelled';

  -- Describe only what actually changed, so the note reads naturally.
  v_moved := case
    when p_new_date <> v_old_date and p_new_time is not null then
      'Moved to ' || to_char(p_new_date, 'DD Mon') || ' at ' || to_char(p_new_time, 'HH24:MI')
    when p_new_date <> v_old_date then
      'Moved from ' || to_char(v_old_date, 'DD Mon') || ' to ' || to_char(p_new_date, 'DD Mon')
    when p_new_time is not null then
      'Moved to ' || to_char(p_new_time, 'HH24:MI') || ' on ' || to_char(p_new_date, 'DD Mon')
    else
      'Rebooked'
  end;

  update appointments
     set appointment_date    = p_new_date,
         status              = 'confirmed',
         cancelled_at        = null,
         cancellation_reason = null,
         notes = trim(both e'\n' from
                   coalesce(notes || e'\n', '')
                   || v_moved
                   || coalesce(' — ' || nullif(btrim(p_note), ''), '')),
         updated_by = current_staff_id()
   where id = p_appointment_id;

  return p_new_date;
end;
$$;

commit;
