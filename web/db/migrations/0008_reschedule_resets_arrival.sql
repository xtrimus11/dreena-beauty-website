-- Moving a booking must reset it to "booked".
--
-- Found by testing: a guest marked Arrived (which awards a turn point) and
-- then moved to another date kept both the arrived status and the point.
-- Two things went wrong:
--
--   * the point stayed on the ORIGINAL date, so a day with no bookings left
--     still showed a therapist on 1;
--   * the guest sat as 'arrived' on a future date, so when that day came it
--     would never award a point — the trigger only fires on a change.
--
-- Nobody has arrived for an appointment that has not happened yet, so moving
-- a booking now resets every guest to 'confirmed'. The turn-ledger trigger
-- fires on that status change and removes the stale point by itself.

begin;

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
                        at time zone 'Asia/Kuala_Lumpur') + (g.ends_at - g.starts_at),
         -- Back to simply booked. This also releases any turn point already
         -- awarded, via the trigger in 0005.
         status    = 'confirmed'
   where g.appointment_id = p_appointment_id
     and g.status <> 'cancelled';

  update appointments
     set appointment_date = p_new_date,
         status              = 'confirmed',
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

-- Clear points already stranded by the old behaviour: a ledger row whose
-- guest is no longer in a state that earns one, or has moved to another date.
delete from turn_ledger l
 using appointment_guests g
 where l.guest_id = g.id
   and (g.status not in ('arrived', 'in_progress', 'completed')
        or g.therapist_id is null
        or (g.starts_at at time zone 'Asia/Kuala_Lumpur')::date <> l.effective_date);

commit;
