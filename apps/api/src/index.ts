/**
 * Forge's state API — one Worker over D1 (D-048).
 *
 * **There is no auth code here on purpose.** Cloudflare Access sits in front of this
 * Worker and the app, so a request that arrives has already been authenticated. Forge
 * never sees a password and has no session logic to get wrong — hand-rolled auth on a
 * personal project is pure downside risk.
 *
 * **D1 rather than KV** because KV is eventually consistent, up to 60 seconds. The core
 * journey is *edit on the phone at a shop, open the desktop at home*, and a minute-old
 * collection would make "where did that card go?" a real bug on the one axis the whole
 * product is organised around (D-015).
 *
 * `F1` scope: health, and reading/writing the collection. Decks arrive at `F2`.
 */
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

interface CollectionRow {
  card_id: string;
  quantity: number;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/**
 * The shape the collection tool already exports (`forge.collection/1`). Keeping the wire
 * format identical means importing an export is a load rather than a migration — and the
 * tool that produced it is deliberately disposable, while this contract is not.
 */
async function readCollection(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT card_id, quantity FROM collection ORDER BY card_id",
  ).all<CollectionRow>();

  const counts: Record<string, number> = {};
  let copies = 0;
  for (const row of results) {
    counts[row.card_id] = row.quantity;
    copies += row.quantity;
  }

  // NOTE: no `byName` here. Names belong to the static card index, and denormalising
  // them into the database would create a second source of truth that goes stale on the
  // next set (D-034 — we never author card data).
  return { schema: "forge.collection/1", totals: { printings: results.length, copies }, counts };
}

async function writeCollection(env: Env, request: Request) {
  let body: { counts?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const counts = body?.counts;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return json({ error: 'Expected { "counts": { "<card_id>": <quantity> } }.' }, 400);
  }

  const rows: CollectionRow[] = [];
  for (const [cardId, quantity] of Object.entries(counts)) {
    if (!Number.isInteger(quantity) || (quantity as number) < 0) {
      return json({ error: `Quantity for ${cardId} must be a non-negative integer.` }, 400);
    }
    if ((quantity as number) > 0) rows.push({ card_id: cardId, quantity: quantity as number });
  }

  // Replace wholesale, in one batch so a partial write cannot leave a half-collection.
  const statements = [
    env.DB.prepare("DELETE FROM collection"),
    ...rows.map((row) =>
      env.DB.prepare("INSERT INTO collection (card_id, quantity) VALUES (?, ?)").bind(
        row.card_id,
        row.quantity,
      ),
    ),
  ];
  await env.DB.batch(statements);

  return json({ ok: true, printings: rows.length });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/health") {
      return json({ ok: true, service: "forge-api" });
    }

    if (pathname === "/collection") {
      if (request.method === "GET") return readCollection(env).then(json);
      if (request.method === "PUT") return writeCollection(env, request);
      return json({ error: "Use GET or PUT." }, 405);
    }

    return json({ error: `No route for ${pathname}.` }, 404);
  },
};
