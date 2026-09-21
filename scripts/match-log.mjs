#!/usr/bin/env node
/**
 * The games actually played, in the shape `ee log` reads.
 *
 * **Why this exists.** `matches` is the only table holding *longitudinal* evidence. "You lost
 * to this once" is an anecdote a single deck read can produce; *"four of your five losses were
 * `cannot-remove`"* is not, and it is the more useful sentence by a distance. `G7` had been
 * sitting behind a plumbing gap rather than a design one — `pull-state.mjs` selected the
 * collection, the decks and the slots and never this, so every session began blind to the
 * record and `ee log` had no document to read.
 *
 * ⚠️ **A flat array, in a file of its own.** `ee log` takes the record as its input document,
 * so what is written is the shape it parses — nesting it inside `forge-state.json` would mean
 * every session pulling it back out with `jq` before EE could read a single game. It is
 * deliberately not *also* folded in there: `SYMPTOMS` has one home for the same reason, and
 * two copies of the record is how the two eventually disagree.
 *
 * ⚠️ **The column names become the engine's here**, so the file is `MatchRecord[]` and needs
 * no translation downstream. `apps/api/src/log.ts` does the same mapping for the Worker; the
 * two are the only readers of this table and they must not differ.
 */

/**
 * `symptoms` is a JSON array stored as text, exactly as a deck's plan is.
 *
 * ⚠️ **Unparseable text reads as none — and says so.** Both alternatives are worse: throwing
 * costs the session the other ten games over one malformed row, and passing the raw string
 * through builds a record `ee log` rejects wholesale at validation, which reads as "your log
 * is broken" rather than "one row is". `log.ts` takes the same fallback for the same reason.
 * The warning is what stops it being silent — a symptom that vanished reads as a game that
 * had nothing wrong with it, which is a different and wrong answer.
 *
 * @param {string | null | undefined} text
 * @param {string} id
 * @param {(message: string) => void} warn
 */
function readSymptoms(text, id, warn) {
  if (text === null || text === undefined || text === "") return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Falls through to the same warning an unexpected shape gets.
  }
  warn(`⚠️  match ${id}: symptoms is not a JSON array (${JSON.stringify(text)}) — read as none.\n`);
  return [];
}

/**
 * Map `matches` rows onto `MatchRecord[]`.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {(message: string) => void} [warn]
 */
export function readMatchLog(rows, warn = (message) => process.stderr.write(message)) {
  return rows.map((m) => ({
    id: m.id,
    deckId: m.deck_id,
    deckName: m.deck_name,
    deckHash: m.deck_hash,
    playedAt: m.played_at,
    /**
     * ⚠️ Null stays null. The engine owns what an absent format means (`DEFAULT_FORMAT`), and
     * resolving it in a second place here is how the two answers eventually differ — the
     * same reason `log.ts` leaves it alone.
     */
    format: m.format,
    opponentLegend: m.opponent_legend,
    opponentNote: m.opponent_note,
    result: m.result,
    games: m.games,
    symptoms: readSymptoms(m.symptoms, m.id, warn),
    notes: m.notes,
  }));
}

/** W–L–D and how many losses carry a symptom, for the one line `npm run state` prints. */
export function tallyMatchLog(log) {
  const tally = { WIN: 0, LOSS: 0, DRAW: 0 };
  for (const m of log) tally[m.result] = (tally[m.result] ?? 0) + 1;
  return { ...tally, carrying: log.filter((m) => m.symptoms.length > 0).length };
}
