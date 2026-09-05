-- Makes "who can perform what" fail closed.
--
-- The old convention was: a staff member with no rows in staff_treatments can
-- perform anything. Convenient — the six therapists needed no rows at all —
-- but it turns an ABSENCE of data into FULL permission. A blocked read, a
-- botched delete, or a missing RLS policy (which is exactly what happened)
-- all look identical to "unrestricted", so the system fails open in the one
-- place it should fail closed.
--
-- Now the staff row states it outright:
--   performs_all_treatments = true   -> any treatment (the six therapists)
--   performs_all_treatments = false  -> ONLY what staff_treatments lists,
--                                       and an empty list means nothing
--
-- An unreadable restriction list can no longer widen anyone's permissions.

begin;

alter table staff
  add column if not exists performs_all_treatments boolean not null default true;

comment on column staff.performs_all_treatments is
  'true = can perform any treatment. false = restricted to the rows in staff_treatments; an empty list means none. Never infer capability from the absence of staff_treatments rows.';

-- The three specialists: the manager does eyebag, Dareena does eyebrow
-- tattoo, Eunice does eyelash perming. Everyone else keeps the default.
update staff
   set performs_all_treatments = false
 where display_name in ('Shaun', 'Dareena', 'Eunice');

commit;
