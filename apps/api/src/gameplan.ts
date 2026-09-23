/**
 * A deck's game plan — storage only (D-067).
 *
 * What a valid plan *is* lives in `@forge/engine` (`validateGamePlan`), for the same reason
 * the match rules do (D-047): `push-gameplan` must refuse exactly what this route refuses, and
 * two validators are how they eventually disagree.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { emptyGamePlan, validateGamePlan, type GamePlan } from "@forge/engine";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/**
 * ⚠️ **A deck with no plan reads as an empty one, not a 404.** The page opens on every deck,
 * and "nothing decided yet" is the normal state of a new deck rather than an error to handle.
 * `updatedAt: null` is what says it has never been written.
 */
export async function readGamePlan(db: D1Database, deckId: string) {
  const row = await db
    .prepare("SELECT body, updated_at FROM gameplans WHERE deck_id = ?")
    .bind(deckId)
    .first<{ body: string; updated_at: string }>();

  let plan: GamePlan = emptyGamePlan();
  if (row) {
    try {
      plan = JSON.parse(row.body) as GamePlan;
    } catch {
      // Written by this repo, so unreachable in principle — but one corrupt row must not
      // make the page unopenable, because then it could never be rewritten either.
    }
  }
  return { schema: "forge.gameplanResponse/1", deckId, updatedAt: row?.updated_at ?? null, plan };
}

export async function writeGamePlan(db: D1Database, deckId: string, request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const problems = validateGamePlan(body);
  if (problems.length > 0) return json({ error: problems.join(" "), problems }, 400);

  // The foreign key would refuse this too, but as a 500 with a constraint message.
  const deck = await db.prepare("SELECT id FROM decks WHERE id = ?").bind(deckId).first();
  if (!deck) return json({ error: `No deck ${deckId}.` }, 404);

  await db
    .prepare(
      `INSERT INTO gameplans (deck_id, body, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(deck_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    )
    .bind(deckId, JSON.stringify(body))
    .run();

  return json({ ok: true, deckId });
}
