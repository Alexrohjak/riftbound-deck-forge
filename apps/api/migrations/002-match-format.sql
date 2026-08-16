-- D-066 — a match records the shape of the table it was played at.
--
-- ⚠️ Run ONCE against an existing database. `schema.sql` carries the same column for a
-- fresh one, but `CREATE TABLE IF NOT EXISTS` cannot add a column to a table that already
-- exists, and SQLite has no `ADD COLUMN IF NOT EXISTS` — so re-running this errors with
-- "duplicate column name", which is the safe failure rather than a silent one.
--
--   cd apps/api && npx wrangler d1 execute forge --remote --file=./migrations/002-match-format.sql
--
-- Existing rows keep NULL, which reads as `1v1` — true of every match logged before this
-- column existed, because heads-up was the only game the log could describe.
--
-- ⚠️ No CHECK constraint here, unlike `schema.sql`. SQLite's `ALTER TABLE ADD COLUMN` cannot
-- add one to an existing table, and rebuilding the table to attach it would put the most
-- irreplaceable data in the system through a copy for a guard the engine already enforces
-- on every write (`validate()`). A fresh database gets the constraint; this one gets the
-- validation, and both reject the same values.

ALTER TABLE matches ADD COLUMN format TEXT;
