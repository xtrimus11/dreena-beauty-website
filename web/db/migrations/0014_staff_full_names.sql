-- Real full names for the staff who appear in the Dec-2025 export.
--
-- The old system kept its therapists in the same table as its customers, as
-- STAFF-prefixed rows. Those were excluded from the customer import (they are
-- not customers) but they carry the full names the roster was missing.
--
-- Joe, Maggie, Venice and Eunice are not in that file — they joined after it
-- was taken — so they keep first names until someone fills them in.
--
-- `initials` is deliberately untouched: it is what staff write by hand in the
-- book (CT for Christal, SLY for Sally) and is not derived from the name.

begin;

update staff set full_name = 'Jodie Ong'     where display_name = 'Jodie'    and full_name = 'Jodie';
update staff set full_name = 'Christal Ling' where display_name = 'Christal' and full_name = 'Christal';
update staff set full_name = 'Sally Yip'     where display_name = 'Sally'    and full_name = 'Sally';
update staff set full_name = 'Dareena Tan'   where display_name = 'Dareena'  and full_name = 'Dareena';

commit;

-- Check:
--   select display_name, full_name, initials, role from staff order by sort_order;
