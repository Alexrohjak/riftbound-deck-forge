-- D-067 — a deck's game plan: how to pilot it once the forty is fixed.
--
-- Safe to re-run: unlike 001 and 002 this adds a table, not a column, and
-- `CREATE TABLE IF NOT EXISTS` does the right thing against an existing database.
--
--   cd apps/api && npx wrangler d1 execute forge --remote --file=./migrations/003-gameplans.sql

CREATE TABLE IF NOT EXISTS gameplans (
  deck_id     TEXT PRIMARY KEY REFERENCES decks(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
