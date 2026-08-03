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
