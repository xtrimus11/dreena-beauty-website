-- Seed data — safe to re-run (every insert is idempotent).
--
-- 1. The six therapists from the paper day-book's staff box.
-- 2. Shop opening hours.
-- 3. The 24 live treatments, generated from src/data/allTreatments.ts so the
--    booking screen offers exactly what the public site advertises.

begin;

-- Staff ---------------------------------------------------------------------
-- Nine people can take a booking, but only the six therapists work the floor
-- every day. column_mode 'when_booked' keeps the manager, the owner and the
-- freelancer out of the day grid except on days they actually have someone,
-- so a tablet shows six columns rather than nine.
--
-- auth_user_id / credentials are set up separately — see db/README.md.
--
-- Full names come from the STAFF rows in the Dec-2025 customer export, which
-- the old system kept alongside its customers. Joe, Maggie, Venice and Eunice
-- are not in that file — they joined after it was taken — so their full names
-- are still first names only. Correct them here, not in the UI.
--
-- `initials` stays as the shop writes it by hand (CT for Christal, SLY for
-- Sally), which is not always derived from the name.

insert into staff (display_name, full_name, initials, role, colour, is_freelancer, column_mode, performs_all_treatments, sort_order) values
  ('Jodie',    'Jodie Ong',     'JD',  'therapist', '#B45309', false, 'always'     , true,  10),
  ('Joe',      'Joe',           'JOE', 'therapist', '#7C3AED', false, 'always'     , true,  20),
  ('Christal', 'Christal Ling', 'CT',  'therapist', '#4D7C0F', false, 'always'     , true,  30),
  ('Sally',    'Sally Yip',     'SLY', 'therapist', '#0F766E', false, 'always'     , true,  40),
  ('Maggie',   'Maggie',        'MG',  'therapist', '#BE185D', false, 'always'     , true,  50),
  ('Venice',   'Venice',        'VN',  'therapist', '#0369A1', false, 'always'     , true,  60),
  -- Manager. Runs the shop and does eyebag treatment.
  ('Shaun',    'Shaun',         'SH',  'manager',   '#1F2937', false, 'when_booked', false, 70),
  -- Owner. Does tattoo, not often.
  ('Dareena',  'Dareena Tan',   'DR',  'admin',     '#9D174D', false, 'when_booked', false, 80),
  -- Freelancer, comes in for eyelash perming only. Not on the shop roster,
  -- so roster checks are skipped for her.
  ('Eunice',   'Eunice',        'EU',  'therapist', '#A16207', true , 'when_booked', false, 90)
on conflict (display_name) do nothing;

-- Opening hours --------------------------------------------------------------
-- Mon-Sat 10:00-18:30. Sunday 10:00-17:00. The shop is open seven days.
-- 1 = Monday ... 7 = Sunday.

insert into business_hours (weekday, opens_at, closes_at, is_closed) values
  (1, '10:00', '18:30', false),
  (2, '10:00', '18:30', false),
  (3, '10:00', '18:30', false),
  (4, '10:00', '18:30', false),
  (5, '10:00', '18:30', false),
  (6, '10:00', '18:30', false),
  (7, '10:00', '17:00', false)
on conflict (weekday) do update set
  opens_at  = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed;

-- Standard facial slots -------------------------------------------------------
-- The habitual start times: four 2-hour facials Mon-Sat, three on Sunday.
-- One-tap defaults on the booking screen, not a restriction — booking at an
-- odd hour between them is normal and nothing blocks it.

insert into standard_slots (weekday, starts_at, sort_order) values
  (1, '10:00', 1), (1, '12:00', 2), (1, '14:00', 3), (1, '16:00', 4),
  (2, '10:00', 1), (2, '12:00', 2), (2, '14:00', 3), (2, '16:00', 4),
  (3, '10:00', 1), (3, '12:00', 2), (3, '14:00', 3), (3, '16:00', 4),
  (4, '10:00', 1), (4, '12:00', 2), (4, '14:00', 3), (4, '16:00', 4),
  (5, '10:00', 1), (5, '12:00', 2), (5, '14:00', 3), (5, '16:00', 4),
  (6, '10:00', 1), (6, '12:00', 2), (6, '14:00', 3), (6, '16:00', 4),
  (7, '10:00', 1), (7, '12:30', 2), (7, '14:30', 3)
on conflict (weekday, starts_at) do nothing;

-- Treatments ----------------------------------------------------------------
-- Durations come straight from the public menu. Where the menu quotes a range
-- ("90-120 min") the lower bound is the default and the upper is the ceiling
-- the booking screen allows. buffer_after_minutes is 0 everywhere until the
-- real clean-down time per treatment is known.
-- The shop's own shorthand codes ("808 A-P") are not filled in — add them to
-- treatments.code as they are collected.

insert into treatments (slug, name, category, duration_minutes, duration_max_minutes, sort_order) values
  ('teenskin', 'TeenSkin Treatment', 'All Skin Types', 45, null, 10),
  ('skin-boost', 'SkinBoost Treatment', 'All Skin Types', 90, null, 20),
  ('multivitamin-restore-rf', 'Multivitamin Restore with RF', 'All Skin Types', 90, 120, 30),
  ('revive-glow', 'Revive Glow Treatment', 'All Skin Types', 75, null, 40),
  ('exosome-mts', 'Exosome Treatment with MTS', 'All Skin Types', 120, null, 50),
  ('dermashot', 'Dermashot Treatment', 'All Skin Types', 120, null, 60),
  ('acr-treatment', 'ACR Treatment', 'All Skin Types', 90, null, 70),
  ('clear-matt', 'Clear-Matt Treatment', 'Acne-Prone Skin', 60, null, 80),
  ('pico-plus', 'Pico Plus - Laser & Light Treatment', 'Acne-Prone Skin', 30, 50, 90),
  ('bio-cell', 'Bio Cell Treatment', 'Acne-Prone Skin', 90, null, 100),
  ('proclear', 'ProClear Skin Treatment', 'Acne-Prone Skin', 90, null, 110),
  ('caviar-restore', 'Caviar Restore Treatment', 'Aging Skin', 90, null, 120),
  ('ionto-stem-cell', 'IONTO Stem Cell Treatment', 'Aging Skin', 120, null, 130),
  ('hifu', 'HIFU - Ultratherapy', 'Aging Skin', 60, 90, 140),
  ('lumilift-elite', 'LumiLift Elite', 'Aging Skin', 120, null, 150),
  ('pro-lumin-fusion', 'PRO Lumin Fusion', 'Aging Skin', 120, null, 160),
  ('environmental', 'Environmental Treatment', 'Sensitive Skin', 120, null, 170),
  ('oxygen', 'Oxygen Treatment', 'Sensitive Skin', 120, null, 180),
  ('pro-calm', 'PRO Calm Treatment', 'Sensitive Skin', 120, null, 190),
  ('glo2-facial', 'Glo2 Facial Treatment', 'Sensitive Skin', 120, null, 200),
  ('whiteglow', 'WhiteGlow Treatment', 'Pigmentation & Uneven Tone', 120, null, 210),
  ('probright', 'ProBright Skin Treatment with ProRestore', 'Pigmentation & Uneven Tone', 60, null, 220),
  ('hollywood-peel', 'Hollywood Peel Treatment', 'Pigmentation & Uneven Tone', 120, null, 230),
  ('pico-laser', 'Pico Laser with ProRestore', 'Pigmentation & Uneven Tone', 45, null, 240)
on conflict (slug) do update set
  name                 = excluded.name,
  category             = excluded.category,
  duration_minutes     = excluded.duration_minutes,
  duration_max_minutes = excluded.duration_max_minutes,
  sort_order           = excluded.sort_order;

-- Non-facial services ---------------------------------------------------------
-- The treatments the shop writes into the Therapist column by hand, because
-- they do not fill a 2-hour facial slot and a second customer can be squeezed
-- in around them. Pico Laser is already in the facial menu above.
--
-- Waxing, 808 and Cauteliser are flexible: one menu entry each, with the
-- therapist setting the real length at booking time, because it depends on
-- the area. Their duration_minutes is only the starting figure in the form.
--
-- The four fixed durations (Eyebrow Tattoo, Eyelash Extensions, Eyelash
-- Perming, Eyebag) are confirmed correct. '808' is the diode hair-removal
-- machine; the code is the book's shorthand.

insert into treatments (slug, code, name, category, duration_minutes, duration_is_flexible, sort_order) values
  ('hair-removal-808',   '808', 'Hair Removal (808)',  'Beauty Services',  30, true,  300),
  ('waxing',             null,  'Waxing',              'Beauty Services',  30, true,  310),
  ('cauteliser',         null,  'Cauteliser',          'Beauty Services',  30, true,  320),
  ('eyebrow-tattoo',     null,  'Eyebrow Tattoo',      'Beauty Services',  90, false, 330),
  ('eyelash-extensions', null,  'Eyelash Extensions',  'Beauty Services',  90, false, 340),
  ('eyelash-perming',    null,  'Eyelash Perming',     'Beauty Services',  60, false, 350),
  ('eyebag-treatment',   null,  'Eyebag Treatment',    'Beauty Services',  60, false, 360)
on conflict (slug) do update set
  code                 = excluded.code,
  name                 = excluded.name,
  category             = excluded.category,
  duration_is_flexible = excluded.duration_is_flexible,
  sort_order           = excluded.sort_order;
  -- duration_minutes deliberately NOT overwritten on re-run, so a corrected
  -- duration is not reset by re-seeding.

-- Who can do what -------------------------------------------------------------
-- Only for the people who are restricted. The six therapists get no rows,
-- which means "can do anything" — see the comment on staff_treatments.
--
-- TODO: confirm that "Dareena does tattoo" means eyebrow tattoo. It is mapped
-- that way here; if she does body tattoo too, that is a separate treatment.

insert into staff_treatments (staff_id, treatment_id)
select s.id, t.id
  from (values
    ('Shaun',    'eyebag-treatment'),
    ('Dareena',  'eyebrow-tattoo'),
    ('Eunice',   'eyelash-perming')
  ) as v(display_name, slug)
  join staff      s on s.display_name = v.display_name
  join treatments t on t.slug         = v.slug
on conflict do nothing;

commit;
