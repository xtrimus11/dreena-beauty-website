-- DESTRUCTIVE. Drops every object the appointment system owns, so the
-- migrations can be applied cleanly from scratch.
--
-- Safe to run ONLY before the shop has entered real bookings. After that it
-- deletes the diary.
--
-- It does NOT touch skin_analysis_submissions, the skin-analysis photo
-- bucket, or anything in auth.* — those belong to the public website and hold
-- real customer data. Every object below is named explicitly, deliberately,
-- so nothing else can be caught by accident. There is no `drop schema`.

begin;

-- Tables. CASCADE clears their triggers, indexes, constraints and the
-- turn_standings view if an older version of 0003 created one.
drop table if exists turn_ledger         cascade;
drop table if exists appointment_audit   cascade;
drop table if exists appointment_guests  cascade;
drop table if exists appointments        cascade;
drop table if exists staff_treatments    cascade;
drop table if exists staff_time_off      cascade;
drop table if exists staff_shifts        cascade;
drop table if exists closures            cascade;
drop table if exists standard_slots      cascade;
drop table if exists business_hours      cascade;
drop table if exists treatments          cascade;
drop table if exists customers           cascade;
drop table if exists staff               cascade;

-- Left over from the earlier self-hosted design, in case it was ever applied.
drop table if exists staff_sessions      cascade;
drop table if exists staff_credentials   cascade;

drop view if exists turn_standings cascade;

-- Functions.
drop function if exists turn_standings_for(date)      cascade;
drop function if exists sync_turn_ledger()            cascade;
drop function if exists log_guest_change()            cascade;
drop function if exists sync_appointment_date()       cascade;
drop function if exists touch_updated_at()            cascade;
drop function if exists generate_booking_reference()  cascade;
drop function if exists current_staff_id()            cascade;
drop function if exists is_active_staff()             cascade;
drop function if exists is_manager()                  cascade;
drop function if exists purge_expired_sessions()      cascade;

-- Types last: the tables that used them are gone by now.
drop type if exists booking_status cascade;
drop type if exists booking_source cascade;
drop type if exists customer_type  cascade;
drop type if exists staff_role     cascade;

commit;
