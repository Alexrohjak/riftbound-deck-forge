/**
 * Put a game plan onto a deck (D-067) — the way a plan drafted in conversation reaches the app.
 *
 *     npm run gameplan -- <gameplan.json> --deck <deck-id>
 *     npm run gameplan -- <gameplan.json> --deck <deck-id> --dry-run
 *
 * **Why this exists.** A sideboard plan worked out in a session used to live in the transcript
 * and nowhere else. `push-deck` puts the forty back; this puts back what to *do* with it.
 *
 * ⚠️ **Replaces the whole plan.** It is one document per deck, and a merge would have to guess
 * which of two edits to a matchup wins. Read it first — `npm run state` puts it under
 * `decks[].gamePlan` — and edit that, so an edit made in the app is not silently discarded.
 *
 * ⚠️ **Refuses a malformed plan; never refuses a stale one.** Shape is `validateGamePlan`, the
 * same function the Worker runs. Fit to the current list is `checkGamePlan`, printed as a
 * warning, because the app shows it the same way and a plan that cannot be saved cannot be
 * fixed.
 *
 * ⚠️ Uses `wrangler d1 execute --remote`, so it needs the same auth `npm run deploy` does.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cardFactsFrom,
  checkGamePlan,
  staticCardIndex,
  validateGamePlan,
} from "../packages/engine/dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Mirrors `push-deck.mjs` — `wrangler --json` prefixes its own logging. */
function d1(sql) {
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "forge", "--remote", "--command", sql, "--json"],
    { cwd: join(ROOT, "apps", "api"), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const start = raw.indexOf("[\n  {");
  if (start === -1) return [];
  return JSON.parse(raw.slice(start))[0]?.results ?? [];
}

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
const planPath = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--deck"));
const deckId = flag("--deck");
const dryRun = argv.includes("--dry-run");

if (!planPath || !deckId) {
  process.stderr.write("Usage: npm run gameplan -- <gameplan.json> --deck <deck-id> [--dry-run]\n");
  process.exit(2);
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));
const problems = validateGamePlan(plan);
if (problems.length > 0) {
  process.stderr.write(`Refusing a malformed game plan — ${problems.length} problem(s):\n`);
  for (const p of problems) process.stderr.write(`  ${p}\n`);
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const [row] = d1(
  `SELECT id, name, state, legend_card_id, chosen_champion_card_id FROM decks WHERE id = ${q(deckId)};`,
);
if (!row) {
  process.stderr.write(`No deck "${deckId}".\n`);
  process.exit(1);
}
const deck = {
  id: row.id,
  name: row.name,
  state: row.state,
  legendCardId: row.legend_card_id,
  chosenChampionCardId: row.chosen_champion_card_id,
  slots: d1(`SELECT card_id, zone, quantity FROM deck_slots WHERE deck_id = ${q(deckId)};`).map((s) => ({
    cardId: s.card_id,
    zone: s.zone,
    quantity: s.quantity,
  })),
};

const pool = JSON.parse(readFileSync(join(ROOT, "apps/web/public/cards.json"), "utf8")).cards;
const facts = {};
for (const card of pool) for (const p of card.printings ?? []) facts[p.id] = cardFactsFrom(card);
const index = staticCardIndex(facts);

const out = (line) => process.stdout.write(`${line}\n`);
const issues = checkGamePlan(plan, deck, index);
const labelOf = (id) => {
  const m = plan.matchups.find((x) => x.id === id);
  if (!m) return "general";
  return m.legendCardId ? (index.nameOf(m.legendCardId) ?? m.legendCardId) : m.archetype;
};
out(`  game plan · ${deck.name}`);
out(
  `    ${plan.winPlan.length} win-plan · ${plan.mulligan.length} mulligan · ` +
    `${plan.battlefields.length} battlefield(s) · ${plan.matchups.length} matchup(s) · ` +
    `${plan.weaknesses.length} weakness(es)`,
);
for (const i of issues) out(`    ⚠️  ${labelOf(i.matchupId)} — ${i.message}`);
if (issues.length === 0) out("    ✓ every swap and battlefield fits the current list");

if (dryRun) {
  out("  ✓ dry run — nothing written.");
  process.exit(0);
}

d1(
  `INSERT INTO gameplans (deck_id, body, updated_at) VALUES (${q(deckId)}, ${q(JSON.stringify(plan))}, datetime('now'))
   ON CONFLICT(deck_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at;`,
);
const [written] = d1(`SELECT length(body) AS n FROM gameplans WHERE deck_id = ${q(deckId)};`);
out(
  written
    ? `✓ game plan written to "${deck.name}" (${deckId}) · https://forge.alexander-rohde-jakobsen.workers.dev`
    : `⚠️  the write did not land — nothing is stored for ${deckId}`,
);
if (!written) process.exitCode = 1;
