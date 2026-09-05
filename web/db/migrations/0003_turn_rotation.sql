-- Therapist rotation — the turn system.
--
-- About half of customers have no preferred therapist, so who performs a
-- treatment is NOT decided when the booking is taken. The shop runs a turn
-- order: every treatment a therapist performs counts as 1, and the therapist
-- with the lowest count takes the next unassigned customer.
--
-- THE COUNT RESETS DAILY. Turns are run per day, so everyone starts each
-- morning on zero. That start-of-day tie is broken by YESTERDAY's count,
-- lowest first — which is the shop's rule that "the next day, the therapist
-- with the lowest count starts first".
--
-- Someone back from a day off lands at the top on their own: they earned
-- nothing yesterday, so their previous-day count is zero. No special rule.
--
-- Because it resets daily there are no opening balances to carry over from
-- the paper tally — the system is correct from its first morning.
--
-- The count is kept as a LEDGER rather than a running total, because a total
-- cannot be audited or corrected. Every point has a row saying which
-- treatment earned it, and the standing is a sum over one date.

begin;

create table turn_ledger (
  id             bigserial primary key,
  staff_id       uuid not null references staff (id) on delete cascade,
  -- The treatment that earned the point. Null for an opening balance carried
  -- over from the paper tally, or a manual correction.
  guest_id       uuid references appointment_guests (id) on delete set null,
  delta          integer not null default 1,
  -- 'treatment' | 'opening_balance' | 'adjustment'
  reason         text not null default 'treatment',
  -- Shop-local date the point belongs to. Lets the standings be read for a
  -- period (this month, since a reset) rather than all time.
  effective_date date not null default ((now() at time zone 'Asia/Kuala_Lumpur')::date),
  note           text,
  created_by     uuid references staff (id) on delete set null,
  created_at     timestamptz not null default now(),

  -- One point per treatment. Marking a booking completed, undoing it, and
  -- completing it again must not award two points. NULL guest_id repeats
  -- freely, so manual adjustments are unaffected.
  unique (guest_id)
);

create index turn_ledger_staff_idx on turn_ledger (staff_id, effective_date);

-- A point is earned when a treatment is actually performed — status
-- 'completed' — not when it is booked. A no-show earns nothing, which is the
-- fair reading: the therapist did no work and should not lose their turn.
create or replace function sync_turn_ledger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from turn_ledger where guest_id = old.id;
    return null;
  end if;

  if new.status = 'completed' and new.therapist_id is not null then
    insert into turn_ledger (staff_id, guest_id, reason, effective_date)
    values (
      new.therapist_id,
      new.id,
      'treatment',
      (new.starts_at at time zone 'Asia/Kuala_Lumpur')::date
    )
    -- Reassigning a completed treatment moves the point to the new therapist.
    on conflict (guest_id) do update set staff_id = excluded.staff_id;
  else
    -- Moved back out of 'completed' (or unassigned): take the point away.
    delete from turn_ledger where guest_id = new.id;
  end if;

  return null;
end;
$$;

create trigger guests_sync_turn_ledger
  after insert or update of status, therapist_id or delete on appointment_guests
  for each row execute function sync_turn_ledger();

-- Standings for one day: today's count, plus yesterday's as the tiebreak.
--
-- A function rather than a view because the diary can be opened on any date,
-- and the board must show that day's rotation, not always the current one.
-- Freelancers and specialists are excluded: they perform one treatment each,
-- so giving them turns would distort everyone else's count.
create or replace function turn_standings_for(target_date date)
returns table (
  staff_id            uuid,
  display_name        text,
  initials            text,
  colour              text,
  sort_order          integer,
  turn_count_today    integer,
  turn_count_previous integer
)
language sql stable security invoker as $$
  select
    s.id,
    s.display_name,
    s.initials,
    s.colour,
    s.sort_order,
    coalesce((
      select sum(l.delta)::integer from turn_ledger l
       where l.staff_id = s.id and l.effective_date = target_date
    ), 0),
    -- The previous calendar day. Absent means zero, which is exactly what
    -- should happen for someone who was off — it puts them at the top.
    coalesce((
      select sum(l.delta)::integer from turn_ledger l
       where l.staff_id = s.id and l.effective_date = target_date - 1
    ), 0)
  from staff s
  where s.is_active
    and s.is_bookable
    and not s.is_freelancer
    and s.column_mode = 'always'
  order by 6, 7, 5;
$$;

-- RLS for the new table. The view inherits it via security_invoker.
alter table turn_ledger enable row level security;

create policy turn_ledger_staff_read on turn_ledger
  for select using (is_active_staff());
-- Points are awarded by the trigger, which is SECURITY DEFINER and bypasses
-- RLS. Manual corrections and opening balances are a manager action.
create policy turn_ledger_manager_write on turn_ledger
  for all using (is_manager()) with check (is_manager());

commit;
