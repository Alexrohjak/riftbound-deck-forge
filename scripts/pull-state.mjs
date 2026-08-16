#!/usr/bin/env node
/**
 * Pull live state out of D1 so EE reasons from ground truth.
 *
 * **Why this exists.** The collection lives in D1 behind Cloudflare Access, and the CLI is a
 * local process with no session. Every EE answer that says *"you own three"* has to come from
 * somewhere, and the alternatives were both bad: a stale file nobody remembers to refresh, or
 * a number the mouth made up. `D-045` forbids the second, so this makes the first cheap.
 *
 *     npm run state          # → state/forge-state.json  (gitignored)
 *
 * ⚠️ **Read-only, and deliberately so.** Nothing here writes to D1. The collection is edited
 * in Forge, where the copy cap and the import validation live; a script that could write to it
 * would be a second door into the one table that describes physical reality.
 *
 * ⚠️ Uses `wrangler d1 execute --remote`, so it needs the same auth `npm run deploy` does.
 * Without it you get a clear failure rather than an empty collection, because an empty
 * collection is a *plausible* answer and would silently make every ownership claim wrong.
 *
 * ⚠️ **The plan comes down with the deck.** `D-064` made the plan the thing a deck is built
 * to, and this script is the first command of every session — a state file that showed the
 * slots but not the plan invited exactly one mistake: reading a deck as a pile again, or
 * passing `--plan` a guess when the deck already records the answer. A deck with no `plan`
 * key was built without a stated one, which is a real answer and not a missing field.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "state", "forge-state.json");

/** `wrangler --json` prefixes its own logging, so the payload is the last top-level array. */
function query(sql) {
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "forge", "--remote", "--command", sql, "--json"],
    { cwd: join(ROOT, "apps", "api"), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const start = raw.indexOf("[\n  {");
  if (start === -1) throw new Error(`Unexpected wrangler output:\n${raw.slice(0, 400)}`);
  return JSON.parse(raw.slice(start))[0].results;
}

const collection = query("SELECT card_id, quantity FROM collection ORDER BY card_id;");
const decks = query(
  "SELECT id, name, state, legend_card_id, chosen_champion_card_id, plan FROM decks ORDER BY updated_at DESC;",
);
const slots = query("SELECT deck_id, card_id, zone, quantity FROM deck_slots;");

// ⚠️ An empty collection is a plausible-looking answer and a catastrophic one — every
// ownership claim downstream would read "you own none of that" and be confidently wrong.
if (collection.length === 0) {
  throw new Error("D1 returned an empty collection. Refusing to write a state file that would make every ownership answer wrong.");
}

/**
 * The plan is stored as JSON text and is opaque to the Worker that wrote it. Parsed here so
 * the state file reads as one document rather than a document with a string of JSON inside it.
 *
 * ⚠️ Unparseable text is kept verbatim under `planRaw` rather than dropped. A plan that cannot
 * be read is a thing to look at; a plan that silently vanished reads as "no plan was stated",
 * which is a different and wrong answer.
 */
function readPlan(text) {
  if (text === null || text === undefined) return {};
  try {
    return { plan: JSON.parse(text) };
  } catch {
    return { planRaw: text };
  }
}

const state = {
  schema: "forge.state/1",
  takenAt: new Date().toISOString(),
  collection: {
    schema: "forge.collection/1",
    totals: {
      printings: collection.length,
      copies: collection.reduce((n, r) => n + r.quantity, 0),
    },
    counts: Object.fromEntries(collection.map((r) => [r.card_id, r.quantity])),
  },
  decks: decks.map((d) => ({
    id: d.id,
    name: d.name,
    state: d.state,
    legendCardId: d.legend_card_id,
    chosenChampionCardId: d.chosen_champion_card_id,
    ...readPlan(d.plan),
    slots: slots
      .filter((s) => s.deck_id === d.id)
      .map((s) => ({ cardId: s.card_id, zone: s.zone, quantity: s.quantity })),
  })),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(state, null, 2)}\n`);
const planned = state.decks.filter((d) => d.plan !== undefined || d.planRaw !== undefined).length;
process.stdout.write(
  `${OUT}\n  ${state.collection.totals.printings} printings · ${state.collection.totals.copies} copies · ` +
    `${state.decks.length} deck(s), ${planned} with a stated plan\n`,
);
