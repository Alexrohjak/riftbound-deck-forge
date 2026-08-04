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
 * `F2` scope: health, the collection, and one deck per id. Editing requires connectivity
 * (D-049) — the app has no offline write path, so this is the only place a deck lives.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { runBackup, type BackupEnv } from "./backup.js";
import {
  appendHistory,
  deleteMatch,
  readEvents,
  readHistory,
  readMatches,
  writeEvents,
  writeMatch,
} from "./log.js";

export interface Env extends BackupEnv {
  DB: D1Database;
}

interface CollectionRow {
  card_id: string;
  quantity: number;
}

interface DeckRow {
  id: string;
  name: string;
  state: string;
  legend_card_id: string | null;
  chosen_champion_card_id: string | null;
}

interface SlotRow {
  card_id: string;
  zone: string;
  quantity: number;
}

/**
 * `decodeURIComponent` throws `URIError` on a malformed escape — `/decks/%/history` is
 * enough. Every id guard in this router ran *after* the decode, so a bad escape produced an
 * unhandled 500 instead of the JSON 400 the guard exists to give.
 */
const decode = (raw: string): string | null => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
};

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

/**
 * Adjust individual printings by a delta — what *entering cards* needs.
 *
 * ⚠️ **`PUT` replaces the whole collection, which is wrong for typing cards in.** Sending
 * nine hundred rows on every keystroke is wasteful, but the real problem is that a stale tab
 * would silently undo everything a phone had just added: last write wins over data it never
 * saw. A delta only ever touches the printing you named.
 *
 * Clamped at zero rather than going negative, and a row that reaches zero is deleted —
 * absence is how "none" is stored (DATA-MODEL §1).
 */
async function adjustCollection(env: Env, request: Request) {
  let body: { adjust?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const adjust = body?.adjust;
  if (!adjust || typeof adjust !== "object" || Array.isArray(adjust)) {
    return json({ error: 'Expected { "adjust": { "<card_id>": <delta> } }.' }, 400);
  }

  const deltas = Object.entries(adjust);
  if (deltas.length === 0) return json({ ok: true, changed: 0 });
  if (deltas.length > 200) {
    return json({ error: "At most 200 printings per adjustment." }, 400);
  }
  for (const [cardId, delta] of deltas) {
    if (!Number.isInteger(delta) || Math.abs(delta as number) > 99) {
      return json({ error: `Delta for ${cardId} must be a whole number within ±99.` }, 400);
    }
  }

  // ⚠️ `quantity` has a CHECK (> 0), so nothing may ever *touch* zero — not even
  // transiently inside an upsert. An `INSERT ... VALUES (?, MAX(?, 0)) ON CONFLICT DO
  // UPDATE` looks right and fails the constraint on the proposed row before the conflict
  // clause can rescue it. Subtracting from a printing you do not own crashed the endpoint.
  //
  // So the two directions are separate statements, and the removal comes first: delete the
  // rows this delta would take to zero, then adjust the ones that survive.
  await env.DB.batch(
    deltas.flatMap(([cardId, raw]) => {
      const delta = raw as number;
      if (delta > 0) {
        return [
          env.DB.prepare(
            `INSERT INTO collection (card_id, quantity) VALUES (?, ?)
             ON CONFLICT(card_id) DO UPDATE SET quantity = collection.quantity + ?`,
          ).bind(cardId, delta, delta),
        ];
      }
      if (delta < 0) {
        return [
          env.DB.prepare("DELETE FROM collection WHERE card_id = ? AND quantity + ? <= 0").bind(
            cardId,
            delta,
          ),
          env.DB.prepare(
            "UPDATE collection SET quantity = quantity + ? WHERE card_id = ? AND quantity + ? > 0",
          ).bind(delta, cardId, delta),
        ];
      }
      return [];
    }),
  );

  return readCollection(env).then(json);
}

/**
 * A deck, in the shape `@forge/engine` validates — so the browser can hand what it reads
 * straight to `checkLegality` with no adapter in between. The `Deck` type lives in the
 * engine; duplicating it here would be a second definition of the thing D-047 exists to
 * keep singular, so this returns the shape without re-declaring it.
 *
 * A deck that does not exist is **not an error**: F2 opens on an empty deck and saves it
 * on the first edit. 404 would make the app's first run look broken.
 */
async function readDeck(env: Env, id: string) {
  const deck = await env.DB.prepare(
    "SELECT id, name, state, legend_card_id, chosen_champion_card_id FROM decks WHERE id = ?",
  )
    .bind(id)
    .first<DeckRow>();

  if (!deck) return { deck: null };

  const { results } = await env.DB.prepare(
    "SELECT card_id, zone, quantity FROM deck_slots WHERE deck_id = ? ORDER BY zone, card_id",
  )
    .bind(id)
    .all<SlotRow>();

  return {
    deck: {
      id: deck.id,
      name: deck.name,
      state: deck.state,
      legendCardId: deck.legend_card_id,
      chosenChampionCardId: deck.chosen_champion_card_id,
      slots: results.map((row) => ({
        cardId: row.card_id,
        zone: row.zone,
        quantity: row.quantity,
      })),
    },
  };
}

const ZONES = new Set(["MAIN", "RUNE", "BATTLEFIELD", "SIDEBOARD"]);

async function writeDeck(env: Env, id: string, request: Request) {
  let body: {
    name?: unknown;
    state?: unknown;
    legendCardId?: unknown;
    chosenChampionCardId?: unknown;
    slots?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled";
  const state = body.state === "BUILT" ? "BUILT" : "DRAFT";
  const legend = typeof body.legendCardId === "string" ? body.legendCardId : null;
  const champion =
    typeof body.chosenChampionCardId === "string" ? body.chosenChampionCardId : null;

  if (!Array.isArray(body.slots)) {
    return json({ error: 'Expected { "slots": [ { cardId, zone, quantity } ] }.' }, 400);
  }

  // Merge duplicates rather than rejecting them: (deck_id, card_id, zone) is the primary
  // key, so two slots for one printing in one zone would fail the INSERT mid-batch and
  // leave the deck deleted. Summing is what the caller meant.
  const merged = new Map<string, SlotRow>();
  for (const raw of body.slots) {
    const slot = raw as { cardId?: unknown; zone?: unknown; quantity?: unknown };
    if (typeof slot.cardId !== "string" || !slot.cardId) {
      return json({ error: "Every slot needs a cardId." }, 400);
    }
    if (typeof slot.zone !== "string" || !ZONES.has(slot.zone)) {
      return json({ error: `Zone must be one of ${[...ZONES].join(", ")}.` }, 400);
    }
    if (!Number.isInteger(slot.quantity) || (slot.quantity as number) < 0) {
      return json({ error: `Quantity for ${slot.cardId} must be a non-negative integer.` }, 400);
    }
    if ((slot.quantity as number) === 0) continue; // removing a card is its absence

    const key = `${slot.zone} ${slot.cardId}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += slot.quantity as number;
    else
      merged.set(key, {
        card_id: slot.cardId,
        zone: slot.zone,
        quantity: slot.quantity as number,
      });
  }

  // One batch, so a half-written deck is not reachable. deck_slots cascades on delete,
  // but the row is upserted rather than deleted — deleting the deck would take the bench
  // with it, and the bench is not this endpoint's to discard.
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO decks (id, name, state, legend_card_id, chosen_champion_card_id)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         state = excluded.state,
         legend_card_id = excluded.legend_card_id,
         chosen_champion_card_id = excluded.chosen_champion_card_id,
         updated_at = datetime('now')`,
    ).bind(id, name, state, legend, champion),
    env.DB.prepare("DELETE FROM deck_slots WHERE deck_id = ?").bind(id),
    ...[...merged.values()].map((slot) =>
      env.DB.prepare(
        "INSERT INTO deck_slots (deck_id, card_id, zone, quantity) VALUES (?, ?, ?, ?)",
      ).bind(id, slot.card_id, slot.zone, slot.quantity),
    ),
  ]);

  // The deck's new shape becomes a history row — but only when it actually changed
  // (LOG §1). This is what lets a match name a *build* rather than a mutable deck id.
  //
  // ⚠️ **Best effort, and deliberately after the batch.** The deck is already committed by
  // the time this runs, so letting a history failure throw would answer 500 and the app
  // would report the deck as unsaved *when it saved* — the exact inversion of the save
  // honesty D-049 exists to protect. History is the secondary record; losing a row of it
  // costs a line in a timeline, while lying about a save costs the user their trust in the
  // one thing this app must get right.
  const hash = await appendHistory(env.DB, {
    id,
    name,
    state: state as "DRAFT" | "BUILT",
    legendCardId: legend ?? "",
    chosenChampionCardId: champion ?? "",
    slots: [...merged.values()].map((s) => ({
      cardId: s.card_id,
      zone: s.zone as "MAIN" | "RUNE" | "BATTLEFIELD" | "SIDEBOARD",
      quantity: s.quantity,
    })),
  }).catch((error: unknown) => {
    console.error("deck_history append failed", error);
    return null;
  });

  return json({ ok: true, id, slots: merged.size, hash });
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
      if (request.method === "PATCH") {
        // A storage error here would otherwise reach the client as an unhandled 500 with a
        // stack trace — unreadable, and indistinguishable from being logged out.
        return adjustCollection(env, request).catch((error: unknown) => {
          console.error("collection adjust failed", error);
          return json({ error: "Could not save that change." }, 500);
        });
      }
      return json({ error: "Use GET, PUT or PATCH." }, 405);
    }

    // ── the log ───────────────────────────────────────────────────────────────
    if (pathname === "/matches") {
      if (request.method === "GET") {
        return readMatches(env.DB, new URL(request.url).searchParams.get("deck")).then((r) =>
          json(r),
        );
      }
      if (request.method === "POST") {
        // `new Date()` is legitimate here and not in the engine: the future-date check
        // needs a clock, and the engine has none by design.
        //
        // ⚠️ **Tomorrow, not today.** The browser sends its local date; this is UTC. At
        // UTC+8 a match logged at 01:00 local is still yesterday here, and comparing
        // against today rejected it. One day of slack covers every real timezone and still
        // catches the typo'd year the check exists for.
        const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
        return writeMatch(env.DB, request, tomorrow);
      }
      return json({ error: "Use GET or POST." }, 405);
    }

    if (pathname.startsWith("/matches/")) {
      const id = decode(pathname.slice(9));
      if (id === null || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        return json({ error: "Match id must be 1-64 characters of [A-Za-z0-9_-]." }, 400);
      }
      if (request.method === "DELETE") return deleteMatch(env.DB, id);
      return json({ error: "Use DELETE." }, 405);
    }

    if (pathname === "/events") {
      if (request.method === "POST") return writeEvents(env.DB, request);
      if (request.method === "GET") return readEvents(env.DB).then((r) => json(r));
      return json({ error: "Use GET or POST." }, 405);
    }

    const historyFor = /^\/decks\/([^/]+)\/history$/.exec(pathname);
    if (historyFor) {
      const id = decode(historyFor[1]!);
      if (id === null || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        return json({ error: "Deck id must be 1-64 characters of [A-Za-z0-9_-]." }, 400);
      }
      if (request.method !== "GET") return json({ error: "Use GET." }, 405);
      return readHistory(env.DB, id).then((r) => json(r));
    }

    const deckId = pathname.startsWith("/decks/") ? decode(pathname.slice(7)) : null;
    if (pathname.startsWith("/decks/")) {
      if (deckId === null || !/^[A-Za-z0-9_-]{1,64}$/.test(deckId)) {
        return json({ error: "Deck id must be 1-64 characters of [A-Za-z0-9_-]." }, 400);
      }
      if (request.method === "GET") return readDeck(env, deckId).then(json);
      if (request.method === "PUT") return writeDeck(env, deckId, request);
      return json({ error: "Use GET or PUT." }, 405);
    }

    return json({ error: `No route for ${pathname}.` }, 404);
  },

  /**
   * X8 — the nightly backup (D-051). Runs on the cron in `wrangler.toml`.
   *
   * `new Date()` is legitimate here in a way it is not in request handling: the snapshot
   * genuinely needs the wall-clock moment it was taken.
   */
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(runBackup(env, new Date().toISOString()));
  },
};
