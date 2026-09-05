# Not in use

These files describe running the diary on your own hardware — Postgres and
Next.js in Docker. **That is not the current setup.** The database is on
Supabase; see [`../db/README.md`](../db/README.md).

They are kept because self-hosting stays a live option: the schema is plain
PostgreSQL, so moving is a `pg_dump` and a `pg_restore`, not a rewrite. If you
ever do move, you will also need to swap Supabase Auth for local sign-in,
which these files assume but no longer provide.

They will NOT work as-is on the DS220j — 512MB of RAM, soldered, is not enough
to run Postgres and Next.js. They target a mini PC or a spare desktop.
