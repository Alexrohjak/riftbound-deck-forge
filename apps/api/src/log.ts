/**
 * The log's storage side — matches, deck history, and client diagnostics.
 *
 * The *rules* live in `@forge/engine` (`log/match.ts`): what a valid record is, how a build
 * is addressed, and what the record is allowed to claim. This file only moves rows. That
 * split is D-047 — validation that lived here would be invisible to the CLI, and a log with
 * junk in it is worse than no log, because you go on trusting it.
 *
 * See `docs/spec/LOG.md`.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { deckHash, validate, type MatchRecord } from "@forge/engine";
import type { Deck } from "@forge/engine";

/**
 * Parse a stored JSON column without letting one bad row take the request with it.
 *
 * These columns are written by code in this repo, so malformed content should be
 * impossible — but "should be impossible" is how a single corrupt row turns the entire
 * match history into a 500 with no way to reach the other rows and fix it.
 */
const parseOr = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/** Newest events kept. A client error loop is a thing that happens (LOG §3). */
const EVENT_CAP = 500;
/** Per POST. Bounds a runaway reporter without dropping a legitimate small batch. */
const EVENTS_PER_REQUEST = 20;

// ── deck history ─────────────────────────────────────────────────────────────

interface HistoryRow {
  seq: number;
  hash: string;
  contents: string;
  at: string;
}

/**
 * Record what the deck now looks like — **but only if it actually changed**.
 *
 * Autosave fires on every edit, and a timeline of ten thousand identical rows is not
 * history. The hash comparison against the previous row is the only trimming rule there is,
 * and it runs on write so no cleanup job can ever fall behind.
 *
 * Returns the hash either way, because the caller wants it whether or not a row was written
 * — it is what a match record will name.
 */
export async function appendHistory(db: D1Database, deck: Deck): Promise<string> {
  const hash = deckHash(deck);

  const previous = await db
    .prepare("SELECT hash FROM deck_history WHERE deck_id = ? ORDER BY seq DESC LIMIT 1")
    .bind(deck.id)
    .first<{ hash: string }>();

  if (previous?.hash === hash) return hash;

  const contents = JSON.stringify({
    legendCardId: deck.legendCardId,
    chosenChampionCardId: deck.chosenChampionCardId,
    slots: deck.slots,
  });

  await db
    .prepare(
      `INSERT INTO deck_history (deck_id, seq, hash, contents)
       VALUES (?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM deck_history WHERE deck_id = ?), ?, ?)`,
    )
    .bind(deck.id, deck.id, hash, contents)
    .run();

  return hash;
}

export async function readHistory(db: D1Database, deckId: string) {
  const { results } = await db
    .prepare("SELECT seq, hash, contents, at FROM deck_history WHERE deck_id = ? ORDER BY seq DESC")
    .bind(deckId)
    .all<HistoryRow>();

  return {
    schema: "forge.deckHistory/1",
    deckId,
    versions: results.map((row) => ({
      seq: row.seq,
      hash: row.hash,
      at: row.at,
      // ⚠️ `{}` rather than `null`. Falling back to null moved the failure from the server
      // (where the client's .catch already degraded to "no versions") into the client's
      // render, where `contents.slots` throws and — with no error boundary — unmounts the
      // whole app. Hardening a read path is worthless if it relocates the crash.
      contents: parseOr<{ slots?: unknown[] }>(row.contents, {}),
    })),
  };
}

// ── matches ──────────────────────────────────────────────────────────────────

interface MatchRow {
  id: string;
  deck_id: string | null;
  deck_name: string | null;
  deck_hash: string | null;
  played_at: string;
  opponent_legend: string | null;
  opponent_note: string | null;
  result: string;
  games: string | null;
  symptoms: string | null;
  notes: string | null;
}

const toRecord = (row: MatchRow): MatchRecord => ({
  id: row.id,
  deckId: row.deck_id,
  deckName: row.deck_name,
  deckHash: row.deck_hash,
  playedAt: row.played_at,
  opponentLegend: row.opponent_legend,
  opponentNote: row.opponent_note,
  result: row.result as MatchRecord["result"],
  games: row.games,
  // A row written by an older build may have no symptoms column value at all.
  symptoms: parseOr<NonNullable<MatchRecord["symptoms"]>>(row.symptoms, []),
  notes: row.notes,
});

export async function readMatches(db: D1Database, deckId?: string | null) {
  const sql = deckId
    ? "SELECT * FROM matches WHERE deck_id = ? ORDER BY played_at DESC, logged_at DESC"
    : "SELECT * FROM matches ORDER BY played_at DESC, logged_at DESC";
  const statement = deckId ? db.prepare(sql).bind(deckId) : db.prepare(sql);
  const { results } = await statement.all<MatchRow>();
  return { schema: "forge.matches/1", matches: results.map(toRecord) };
}

/**
 * Store one match. `today` is passed in rather than read here so the future-date check is
 * the engine's, testable without a clock.
 */
export async function writeMatch(db: D1Database, request: Request, today: string) {
  let body: Partial<MatchRecord>;
  try {
    body = (await request.json()) as Partial<MatchRecord>;
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const record = { ...body, symptoms: body.symptoms ?? [] } as MatchRecord;
  const problems = validate(record, today);
  if (problems.length > 0) return json({ error: problems.join(" "), problems }, 400);

  await db
    .prepare(
      `INSERT INTO matches
         (id, deck_id, deck_name, deck_hash, played_at, opponent_legend,
          opponent_note, result, games, symptoms, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         deck_id = excluded.deck_id,
         deck_name = excluded.deck_name,
         deck_hash = excluded.deck_hash,
         played_at = excluded.played_at,
         opponent_legend = excluded.opponent_legend,
         opponent_note = excluded.opponent_note,
         result = excluded.result,
         games = excluded.games,
         symptoms = excluded.symptoms,
         notes = excluded.notes`,
    )
    .bind(
      record.id,
      record.deckId ?? null,
      record.deckName ?? null,
      record.deckHash ?? null,
      record.playedAt,
      record.opponentLegend ?? null,
      record.opponentNote ?? null,
      record.result,
      record.games || null,
      JSON.stringify(record.symptoms ?? []),
      record.notes ?? null,
    )
    .run();

  return json({ ok: true, id: record.id });
}

export async function deleteMatch(db: D1Database, id: string) {
  const { meta } = await db.prepare("DELETE FROM matches WHERE id = ?").bind(id).run();
  return json({ ok: true, deleted: meta.changes ?? 0 });
}

// ── diagnostics ──────────────────────────────────────────────────────────────

/**
 * Client-side failures. Cloudflare already logs the Worker; what it cannot see is the
 * browser, which is where every interface bug so far has lived.
 *
 * ⚠️ **This endpoint always succeeds.** A malformed report is dropped rather than rejected:
 * the caller is an error handler, and an error handler that gets an error back is how a
 * page ends up in a loop. It reports how many it kept so a developer can still tell.
 */
export async function writeEvents(db: D1Database, request: Request) {
  let body: { events?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: true, stored: 0, dropped: "unparseable body" });
  }

  const raw = Array.isArray(body?.events) ? body.events : [];
  const usable = raw.slice(0, EVENTS_PER_REQUEST).flatMap((item) => {
    const e = item as { level?: unknown; code?: unknown; message?: unknown; context?: unknown };
    const level = e.level === "error" || e.level === "warn" || e.level === "info" ? e.level : "error";
    if (typeof e.code !== "string" || !e.code) return [];
    return [
      {
        level,
        code: e.code.slice(0, 64),
        message: typeof e.message === "string" ? e.message.slice(0, 500) : null,
        // Bounded, and never carrying deck or card data — it is already in the database,
        // and copying it here makes the noise big without making it informative.
        context: e.context ? JSON.stringify(e.context).slice(0, 1000) : null,
      },
    ];
  });

  if (usable.length === 0) return json({ ok: true, stored: 0 });

  await db.batch([
    ...usable.map((e) =>
      db
        .prepare("INSERT INTO events (level, code, message, context) VALUES (?, ?, ?, ?)")
        .bind(e.level, e.code, e.message, e.context),
    ),
    // Trim here rather than on a schedule: the table must be bounded at the moment it grows,
    // not eventually.
    db
      .prepare(
        `DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY id DESC LIMIT ${EVENT_CAP})`,
      )
      .bind(),
  ]);

  return json({ ok: true, stored: usable.length, dropped: raw.length - usable.length });
}

export async function readEvents(db: D1Database) {
  const { results } = await db
    .prepare("SELECT id, at, level, code, message, context FROM events ORDER BY id DESC LIMIT 100")
    .all();
  return { schema: "forge.events/1", events: results };
}
