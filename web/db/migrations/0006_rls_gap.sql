-- Closes an RLS gap.
--
-- standard_slots and staff_treatments were added to 0001 after 0002 was
-- written, so they never got policies. Two consequences, both silent:
--
--   * the day sheet showed no standard slot rows, because the read returned
--     nothing rather than failing loudly;
--   * staff_treatments read as empty, and an empty restrictions list means
--     "no restrictions" by design — so Eunice would have appeared bookable
--     for a facial and the manager for anything.
--
-- Both are reference data: every active staff member reads them, managers
-- maintain them. Same shape as the reference tables in 0002.

begin;

alter table standard_slots   enable row level security;
alter table staff_treatments enable row level security;

drop policy if exists standard_slots_staff_read    on standard_slots;
drop policy if exists standard_slots_manager_write on standard_slots;
drop policy if exists staff_treatments_staff_read    on staff_treatments;
drop policy if exists staff_treatments_manager_write on staff_treatments;

create policy standard_slots_staff_read on standard_slots
  for select using (is_active_staff());
create policy standard_slots_manager_write on standard_slots
  for all using (is_manager()) with check (is_manager());

create policy staff_treatments_staff_read on staff_treatments
  for select using (is_active_staff());
create policy staff_treatments_manager_write on staff_treatments
  for all using (is_manager()) with check (is_manager());

commit;
