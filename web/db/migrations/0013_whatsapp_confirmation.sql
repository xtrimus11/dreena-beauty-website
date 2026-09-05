-- A booking is now "confirmed" only once the customer says so.
--
-- The day before an appointment a therapist sends a WhatsApp; when the
-- customer replies, they tap the booking and mark it Confirmed. That is a
-- real distinction the shop acts on — an unconfirmed booking the day before
-- is one to chase.
--
-- No new enum value is needed: booking_status already carries 'pending', and
-- its original meaning ("penciled in, not yet confirmed with the customer")
-- is exactly this. The states now read:
--
--   pending    -> Booked      (taken, not yet confirmed by the customer)
--   confirmed  -> Confirmed   (customer replied to the WhatsApp)
--   arrived    -> Arrived     (in the shop; this is what earns the turn point)
--   no_show    -> No show
--
-- So the DEFAULT moves from 'confirmed' to 'pending'. Nothing about capacity
-- or double-booking changes: both EXCLUDE guards already treat 'pending' as
-- occupying the slot, and only 'cancelled'/'no_show' release it.

begin;

alter table appointment_guests alter column status set default 'pending';
alter table appointments       alter column status set default 'pending';

-- Existing rows were created when 'confirmed' meant merely "booked". Leaving
-- them would claim every current booking had been confirmed by the customer,
-- which is not true of any of them.
update appointment_guests set status = 'pending' where status = 'confirmed';
update appointments       set status = 'pending' where status = 'confirmed';

-- Moving a booking un-confirms it: the customer agreed to the old slot, not
-- the new one, so it goes back in the queue to be chased.
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
         -- Back to unconfirmed, and any turn point already awarded is
         -- released by the trigger in 0005.
         status    = 'pending'
   where g.appointment_id = p_appointment_id
     and g.status <> 'cancelled';

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
         status              = 'pending',
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
