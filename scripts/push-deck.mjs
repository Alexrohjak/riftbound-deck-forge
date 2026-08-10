#!/usr/bin/env node
/**
 * Put a deck EE proposed onto the Workbench, where it can be looked at and changed.
 *
 * **Why this exists.** A decklist in a chat transcript is a decklist you retype. The
 * Workbench already draws the printings, tracks commitment and validates live — a proposal
 * is worth far more inside it than beside it. `pull-state.mjs` brought D1 out; this puts one
 * deck back.
 *
 *     npm run deck -- <proposal.json> --name "Grand Duelist vs Ivern"
 *     npm run deck -- <proposal.json> --name "…" --id fiora-ivern   # overwrite in place
 *
 * ⚠️ **`decks` and `deck_slots` only. Never `collection`.** `pull-state.mjs` is read-only
 * because the collection describes physical reality and a second door into it is a way to
 * make Forge wrong about your boxes. That argument binds this file too: a deck is authored
 * in the app all day long and is safe to write, the collection is not. There is no code path
 * here that touches it.
 *
 * ⚠️ **Refuses to write an illegal deck.** It runs the same 33 checks the app does before
 * emitting a single statement, so nothing lands on the Workbench that could not be
 * registered. **Ownership is a warning, not a bar** — a sideboard is allowed to name cards
 * you do not own yet, because "go and get this one" is a real answer.
 *
 * ⚠️ Uses `wrangler d1 execute --remote`, so it needs the same auth `npm run deploy` does.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkLegality, staticCardIndex, cardFactsFrom } from "../packages/engine/dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
/** The one positional: skip every `--flag` and the value that follows it. */
let proposalPath;
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) i++;
  else if (!proposalPath) proposalPath = argv[i];
}

if (!proposalPath) {
  process.stderr.write(
    'Usage: npm run deck -- <proposal.json> --name "Deck name" [--id <deck-id>]\n',
  );
  process.exit(2);
}

const proposal = JSON.parse(readFileSync(proposalPath, "utf8"));
const name = flag("--name") ?? proposal.name ?? "EE proposal";
/** Slugged from the name so re-running with the same name overwrites rather than piling up. */
const id =
  flag("--id") ??
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

// ── shape ───────────────────────────────────────────────────────────────────
const zoneOf = { main: "MAIN", runes: "RUNE", battlefields: "BATTLEFIELD", sideboard: "SIDEBOARD" };
const slots = [];
for (const [field, zone] of Object.entries(zoneOf)) {
  for (const s of proposal[field] ?? []) {
    if (!s?.cardId || !(s.quantity > 0)) throw new Error(`Bad slot in "${field}": ${JSON.stringify(s)}`);
    slots.push({ cardId: s.cardId, zone, quantity: s.quantity });
  }
}
if (!proposal.legendCardId || !proposal.chosenChampionCardId) {
  throw new Error("A proposal needs legendCardId and chosenChampionCardId.");
}

// ── the gate ────────────────────────────────────────────────────────────────
const pool = JSON.parse(readFileSync(join(ROOT, "apps/web/public/cards.json"), "utf8")).cards;
const facts = {};
for (const card of pool) for (const p of card.printings ?? []) facts[p.id] = cardFactsFrom(card);
const index = staticCardIndex(facts);

const deck = {
  id,
  name,
  state: "DRAFT",
  legendCardId: proposal.legendCardId,
  chosenChampionCardId: proposal.chosenChampionCardId,
  slots,
};

const verdict = checkLegality(deck, index);
if (!verdict.legal) {
  process.stderr.write(`Refusing to write an illegal deck — ${verdict.violations.length} violation(s):\n`);
  for (const v of verdict.violations) process.stderr.write(`  ${v.check} · ${v.citation} — ${v.message}\n`);
  process.exit(1);
}
for (const w of verdict.warnings ?? []) process.stdout.write(`  ⚠️  ${w.check} — ${w.message}\n`);

// ── the write ───────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const statements = [
  `DELETE FROM deck_slots WHERE deck_id = ${q(id)};`,
  `INSERT INTO decks (id, name, state, legend_card_id, chosen_champion_card_id, updated_at)
     VALUES (${q(id)}, ${q(name)}, 'DRAFT', ${q(deck.legendCardId)}, ${q(deck.chosenChampionCardId)}, datetime('now'))
   ON CONFLICT(id) DO UPDATE SET
     name = excluded.name,
     state = 'DRAFT',
     legend_card_id = excluded.legend_card_id,
     chosen_champion_card_id = excluded.chosen_champion_card_id,
     updated_at = datetime('now');`,
  ...slots.map(
    (s) =>
      `INSERT INTO deck_slots (deck_id, card_id, zone, quantity) VALUES (${q(id)}, ${q(s.cardId)}, ${q(s.zone)}, ${s.quantity});`,
  ),
];

execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "forge", "--remote", "--command", statements.join("\n"), "--json"],
  { cwd: join(ROOT, "apps", "api"), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const count = (zone) => slots.filter((s) => s.zone === zone).reduce((n, s) => n + s.quantity, 0);
process.stdout.write(
  `✓ "${name}" (${id}) on the Workbench — ${count("MAIN") + 1} main incl. champion · ` +
    `${count("RUNE")} runes · ${count("BATTLEFIELD")} battlefields · ${count("SIDEBOARD")} sideboard\n` +
    `  https://forge.alexander-rohde-jakobsen.workers.dev\n`,
);
