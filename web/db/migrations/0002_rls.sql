-- Row Level Security. Required — apply this straight after 0001.
--
-- Staff sign in through Supabase Auth, so every request carries a JWT and
-- auth.uid() identifies the person. These policies are the second line of
-- defence behind the app: even a bug that sends the wrong query cannot read
-- or write anything a signed-out visitor should not see.
--
-- Policy in one line: any active staff member can read and write the whole
-- diary; only managers and admins can hard-delete or edit the roster.
-- Six people who all cover the front desk need to see each other's columns,
-- so per-therapist read restrictions would only get in the way.
--
-- NOTE: "phone is view-only" is a UI rule, not a security rule. It is a
-- guardrail against fat-fingering the diary on a 5-inch screen, and RLS
-- cannot see screen size. Anyone determined enough could edit from a phone.
-- Treat it as ergonomics, not as a permission.

begin;

alter table staff              enable row level security;
alter table customers          enable row level security;
alter table treatments         enable row level security;
alter table business_hours     enable row level security;
alter table closures           enable row level security;
alter table staff_shifts       enable row level security;
alter table staff_time_off     enable row level security;
alter table appointments       enable row level security;
alter table appointment_guests enable row level security;
alter table appointment_audit  enable row level security;

-- Helpers -------------------------------------------------------------------

create or replace function is_active_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff
     where auth_user_id = auth.uid()
       and is_active
  );
$$;

create or replace function is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff
     where auth_user_id = auth.uid()
       and is_active
       and role in ('manager', 'admin')
  );
$$;

-- Diary: every active staff member reads and writes ---------------------------

create policy customers_staff_read on customers
  for select using (is_active_staff());
create policy customers_staff_insert on customers
  for insert with check (is_active_staff());
create policy customers_staff_update on customers
  for update using (is_active_staff()) with check (is_active_staff());
-- Deleting a booking outright is a manager action; everyone else cancels,
-- which keeps the row and the reason.
create policy customers_manager_delete on customers
  for delete using (is_manager());

create policy appointments_staff_read on appointments
  for select using (is_active_staff());
create policy appointments_staff_insert on appointments
  for insert with check (is_active_staff());
create policy appointments_staff_update on appointments
  for update using (is_active_staff()) with check (is_active_staff());
-- Deleting a booking outright is a manager action; everyone else cancels,
-- which keeps the row and the reason.
create policy appointments_manager_delete on appointments
  for delete using (is_manager());

create policy appointment_guests_staff_read on appointment_guests
  for select using (is_active_staff());
create policy appointment_guests_staff_insert on appointment_guests
  for insert with check (is_active_staff());
create policy appointment_guests_staff_update on appointment_guests
  for update using (is_active_staff()) with check (is_active_staff());
-- Deleting a booking outright is a manager action; everyone else cancels,
-- which keeps the row and the reason.
create policy appointment_guests_manager_delete on appointment_guests
  for delete using (is_manager());

create policy staff_time_off_staff_read on staff_time_off
  for select using (is_active_staff());
create policy staff_time_off_staff_insert on staff_time_off
  for insert with check (is_active_staff());
create policy staff_time_off_staff_update on staff_time_off
  for update using (is_active_staff()) with check (is_active_staff());
-- Deleting a booking outright is a manager action; everyone else cancels,
-- which keeps the row and the reason.
create policy staff_time_off_manager_delete on staff_time_off
  for delete using (is_manager());

-- Reference data: everyone reads, managers maintain ---------------------------

create policy staff_staff_read on staff
  for select using (is_active_staff());
create policy staff_manager_write on staff
  for all using (is_manager()) with check (is_manager());

create policy treatments_staff_read on treatments
  for select using (is_active_staff());
create policy treatments_manager_write on treatments
  for all using (is_manager()) with check (is_manager());

create policy business_hours_staff_read on business_hours
  for select using (is_active_staff());
create policy business_hours_manager_write on business_hours
  for all using (is_manager()) with check (is_manager());

create policy closures_staff_read on closures
  for select using (is_active_staff());
create policy closures_manager_write on closures
  for all using (is_manager()) with check (is_manager());

create policy staff_shifts_staff_read on staff_shifts
  for select using (is_active_staff());
create policy staff_shifts_manager_write on staff_shifts
  for all using (is_manager()) with check (is_manager());

-- Audit trail: readable, never editable from the client -----------------------
-- Rows arrive only via the SECURITY DEFINER trigger in 0001, which bypasses
-- RLS. No insert/update/delete policy exists, so nothing else can touch it.

create policy audit_staff_read on appointment_audit
  for select using (is_active_staff());

commit;
