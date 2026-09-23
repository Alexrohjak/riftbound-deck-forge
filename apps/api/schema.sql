-- Forge state — Cloudflare D1 (SQLite).
--
-- Mirrors docs/spec/DATA-MODEL.md §1. Two rules drive every table here:
--
--   1. OWNERSHIP is keyed on PRINTING; LEGALITY is keyed on NAME (DATA-MODEL §2).
--      So collection rows store card_id and nothing else — names are resolved from the
--      static card index at read time, never denormalised into this database. Card data
--      is Riot's and we never author it (D-034); copying names in here would create a
--      second source of truth that goes stale on the next set.
--
--   2. The collection tool's export (`forge.collection/1`) is the import path, so
--      `collection` is deliberately shaped as that file's `counts` object: card_id -> qty.
--      Importing an export is a load, not a migration.
--
-- Single user by design — no accounts table. Cloudflare Access is the auth boundary
-- (D-048), so this database never sees a credential.

PRAGMA foreign_keys = ON;

-- What is physically in the box.
CREATE TABLE IF NOT EXISTS collection (
  card_id    TEXT PRIMARY KEY,           -- a printing, e.g. "ogn-202a-298"
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  finish     TEXT CHECK (finish IN ('normal', 'foil')),  -- irrelevant to legality
  added_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decks (
  id                       TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  -- D-017/D-026: only BUILT decks commit cards out of the available pool.
  state                    TEXT NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT', 'BUILT')),
  -- Singular fields, not slots — exactly one of each, and they behave differently.
  legend_card_id           TEXT,
  chosen_champion_card_id  TEXT,
  -- D-064: what this deck was BUILT TO DO, as JSON — win condition, pace, objective,
  -- package targets, battlefield and sideboard rationale.
  --
  -- ⚠️ Nullable, and every deck that predates the plan has NULL here. That is a real
  -- answer meaning "built without a stated plan", not a default to be filled in: a plan
  -- invented after the fact would be a rationalisation, and `reviewAgainstPlan` would then
  -- be marking the deck's own homework.
  --
  -- Stored as an opaque blob because the engine owns its shape (D-047). This database
  -- never parses it, so a new field costs no migration.
  plan                     TEXT,
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deck_slots (
  deck_id   TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_id   TEXT NOT NULL,
  zone      TEXT NOT NULL CHECK (zone IN ('MAIN', 'RUNE', 'BATTLEFIELD', 'SIDEBOARD')),
  quantity  INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (deck_id, card_id, zone)
);

-- The tinkering surface. Never committed, never validated — validating it would defeat
-- its purpose (DATA-MODEL §1).
CREATE TABLE IF NOT EXISTS bench (
  deck_id  TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_id  TEXT NOT NULL,
  note     TEXT,
  PRIMARY KEY (deck_id, card_id)
);

CREATE INDEX IF NOT EXISTS deck_slots_by_deck ON deck_slots(deck_id);
CREATE INDEX IF NOT EXISTS decks_by_state ON decks(state);

-- ── the log ─────────────────────────────────────────────────────────────────
-- Three tables rather than one with a `kind` column: retention, backup and privacy rules
-- differ per row type, and one table would have to take the strictest of each — permanent
-- retention for crash noise, or expiry for match records. See docs/spec/LOG.md.

-- A deck's contents at a moment. Append-only, and written ONLY when the content hash
-- differs from the previous row — autosave fires constantly and ten thousand identical
-- rows is not history.
CREATE TABLE IF NOT EXISTS deck_history (
  deck_id   TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  seq       INTEGER NOT NULL,
  hash      TEXT NOT NULL,            -- content hash; identical lists hash identically
  contents  TEXT NOT NULL,            -- JSON: legend, champion, slots
  at        TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (deck_id, seq)
);

-- D-067 — how to pilot a deck: battlefield picks, sideboard swaps per matchup, play-arounds.
-- One document per deck, validated for SHAPE by the engine (`validateGamePlan`) and never for
-- fit — a plan naming a card you have since cut must still save, or it could not be fixed.
-- Cascades with the deck, like the bench: it describes that forty and no other.
CREATE TABLE IF NOT EXISTS gameplans (
  deck_id     TEXT PRIMARY KEY REFERENCES decks(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,          -- JSON: forge.gameplan/1
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Games you actually played.
--
-- ⚠️ deck_id carries NO foreign key, and deck_name is stored on the row. Delete a deck and
-- the games you played with it are still games you played; a cascade would destroy the most
-- irreplaceable data here to preserve referential tidiness. The denormalised name is not a
-- DATA-MODEL §2 violation — that rule forbids copying Riot's card data, which goes stale.
-- A deck name is the user's own, and the name it had when played is the correct answer.
CREATE TABLE IF NOT EXISTS matches (
  id               TEXT PRIMARY KEY,
  deck_id          TEXT,
  deck_name        TEXT,
  deck_hash        TEXT,              -- which version was played — joins to deck_history
  played_at        TEXT NOT NULL,     -- the date played, not the date typed in
  -- The shape of the table (D-066). NULL means 1v1 — every row written before the column
  -- existed was heads-up, and the reading resolves it in one place.
  format           TEXT CHECK (format IS NULL OR format IN ('1v1', '1v1v1', '2v2')),
  opponent_legend  TEXT,              -- their Legend's card_id; null is a real answer
  opponent_note    TEXT,
  result           TEXT NOT NULL CHECK (result IN ('WIN', 'LOSS', 'DRAW')),
  games            TEXT,              -- "2-1" when it was several; null when it was one
  symptoms         TEXT,              -- JSON array of EE Symptom codes
  notes            TEXT,
  logged_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client-side failures. Cloudflare already logs the Worker; what it cannot see is the
-- browser, which is where every interface bug so far has lived. Trimmed to the newest 500
-- on write, and deliberately excluded from the nightly backup — expendable by design.
CREATE TABLE IF NOT EXISTS events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  at       TEXT NOT NULL DEFAULT (datetime('now')),
  level    TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  code     TEXT NOT NULL,             -- a stable identifier, not a sentence
  message  TEXT,
  context  TEXT
);

CREATE INDEX IF NOT EXISTS matches_by_deck ON matches(deck_id, played_at);
CREATE INDEX IF NOT EXISTS matches_by_hash ON matches(deck_hash);
CREATE INDEX IF NOT EXISTS deck_history_by_hash ON deck_history(hash);
CREATE INDEX IF NOT EXISTS events_recent ON events(at DESC);
