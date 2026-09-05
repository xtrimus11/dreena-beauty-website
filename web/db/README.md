# Appointment database

PostgreSQL on Supabase — the same project as the skin analysis submissions,
so one database and one set of logins.

Apply in order:

| File | What it does |
|---|---|
| `migrations/0001_appointments.sql` | Tables, constraints, triggers, audit |
| `migrations/0002_rls.sql` | Row Level Security policies |
| `seed/0001_reference_data.sql` | 9 staff, opening hours, standard slots, 31 treatments |

The seed is idempotent. The migrations are **not** — they are forward
migrations meant to run once. If one fails halfway and you need to start over,
run `reset.sql` first:

```bash
psql "$SUPABASE_DB_URL" -f web/db/reset.sql
```

That drops only this system's objects, named one by one. It does not touch
`skin_analysis_submissions`, the photo bucket, or `auth.*`. It is destructive:
safe before the shop enters real bookings, and never after.

A `type "staff_role" already exists` error means a previous attempt got part
of the way in — run `reset.sql`, then apply the three migrations again.

```bash
for f in migrations/0001_appointments.sql migrations/0002_rls.sql seed/0001_reference_data.sql; do
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

## Creating the logins

Invite each person through Supabase Auth (Dashboard → Authentication → Users),
then link the login to their roster row:

```sql
update staff set auth_user_id = '<auth.users.id>' where display_name = 'Sally';
```

A staff row with `auth_user_id` still null can be booked into the diary but
cannot sign in — which is what you want for Eunice, or for someone on the
roster before their account exists.

## What the database guarantees, and what it does not

**Guaranteed by the database**, not by the UI:

- A therapist cannot hold two overlapping bookings
  (`appointment_guests_no_therapist_overlap`).
- A customer cannot be in two chairs at once
  (`appointment_guests_no_customer_overlap`).
- Every change to a booking lands in `appointment_audit` with who and when.

Both overlap guards are PostgreSQL `EXCLUDE` constraints, so two tablets
booking the same therapist for the same time in the same second cannot both
succeed. **The app must handle SQLSTATE 23P01** and show the message from
`describeConstraintViolation()` in `src/lib/appointments/availability.ts`.

The audit trail resolves the actor from the signed-in user automatically via
`current_staff_id()`, so nothing extra is needed on a normal write. A
server-side job connecting as `service_role` has no `auth.uid()` and should
set the actor explicitly:

```sql
set local app.staff_id = '<staff.id>';
```

**Not guaranteed by the database:**

- *Phone is view-only.* That is a UI rule. Nothing in the database can see
  screen size. It is a guardrail against mis-tapping the diary on a 5-inch
  screen, not a permission.
- Opening hours and roster checks are advisory (`findConflicts`), so staff can
  deliberately squeeze in a regular.

## Backups

### The dump — for losing data

A `pg_dump` pulled to the NAS nightly. It protects against Supabase losing
data, or someone deleting a month of bookings by accident. Synology **Control
Panel → Task Scheduler → User-defined script**:

```bash
#!/bin/sh
set -eu
DEST=/volume1/backups/dreena-appointments
mkdir -p "$DEST"
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges --format=custom \
  > "$DEST/appointments-$(date +%Y%m%d-%H%M).dump"
find "$DEST" -name 'appointments-*.dump' -mtime +30 -delete
```

Put `SUPABASE_DB_URL` in the task's environment, not in the script — it
contains the database password.

Restore test, at least once, so the backup is known to be real:

```bash
pg_restore --clean --if-exists -d "$TARGET_DB_URL" appointments-YYYYMMDD-HHMM.dump
```

A backup that has never been restored is not a backup.

### 2. Outage cover: 4G failover

A dump cannot be read during an outage — it needs a running Postgres, and the
DS220j cannot run one. Outage cover is therefore the 4G router (or a phone
hotspot), not the NAS. Both fibre and mobile failing at once is the accepted
risk.

## If everything is down

Cheapest first:

- **Print tomorrow's sheet each evening.** One page in the drawer, and it
  survives a power cut too, which nothing electronic does.
- **A 4G router as internet failover**, or a staff phone hotspot. This is the
  only option that keeps the system fully working — everything else just lets
  you read it.
- **A UPS on the router, switch and access point** as well as the NAS. The day
  sheets are no use if the tablets cannot reach the share.
