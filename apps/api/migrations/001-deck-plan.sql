-- D-064 — a deck records what it was built to do.
--
-- ⚠️ Run ONCE against an existing database. `schema.sql` carries the same column for a
-- fresh one, but `CREATE TABLE IF NOT EXISTS` cannot add a column to a table that already
-- exists, and SQLite has no `ADD COLUMN IF NOT EXISTS` — so re-running this errors with
-- "duplicate column name", which is the safe failure rather than a silent one.
--
--   cd apps/api && npx wrangler d1 execute forge --remote --file=./migrations/001-deck-plan.sql
--
-- Existing decks keep NULL, which means "built without a stated plan" and is a real answer.

ALTER TABLE decks ADD COLUMN plan TEXT;
