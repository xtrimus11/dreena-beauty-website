-- Deleting a booking must delete its turn point.
--
-- turn_ledger.guest_id was ON DELETE SET NULL, to protect the rows that have
-- no guest at all — manual adjustments and opening balances. But it also
-- orphaned genuine treatment points: delete a booking and its point survived
-- with a null guest_id, so a day with nothing in the diary still credited a
-- therapist. Found exactly that way, clearing test data.
--
-- CASCADE is the right rule and does not endanger what SET NULL was
-- protecting: adjustments and opening balances have guest_id NULL already, so
-- no cascade can ever reach them.
--
-- Cancelling a booking is unaffected — that is a status change, and the
-- trigger in 0005 already removes the point.

begin;

alter table turn_ledger
  drop constraint turn_ledger_guest_id_fkey;

alter table turn_ledger
  add constraint turn_ledger_guest_id_fkey
  foreign key (guest_id) references appointment_guests (id) on delete cascade;

-- Sweep up points already orphaned this way. A treatment point with no guest
-- describes a treatment that no longer exists; a real adjustment carries
-- reason 'adjustment' or 'opening_balance' and is left alone.
delete from turn_ledger
 where guest_id is null
   and reason = 'treatment';

commit;
