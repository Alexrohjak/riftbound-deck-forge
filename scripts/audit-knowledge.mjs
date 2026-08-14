#!/usr/bin/env node
/**
 * **What the cards say, against what Forge models.**
 *
 * ⚠️ **This exists because a calibration harness could not be built.** The plan was to measure
 * our doctrine against decks known to be good — the transcripts contain a Vancouver Regionals
 * list and three decks built card by card. They are auto-captioned: **6 of 19 spoken card
 * names resolve exactly**, eight would need guessing, and the transcript with the tournament
 * list yields no counts at all. Building it would have meant inventing the evidence.
 *
 * So this calibrates the other axis, where the data is ours and complete: **every card's
 * printed text, against the classification we derived from it.** Every card-level mistake in
 * the Ambessa build was an unmodelled property — `Cruel Patron`'s additional cost, `[Empower]`
 * being once per unit, the `[Level]` thresholds — and none of them were visible in
 * `produces`/`consumes`/`role`.
 *
 * ⚠️ **It reports; it never edits.** A gap here is a question for a human, not a licence to
 * generate classification data — [D-034](../docs/DECISIONS.md): card data is Riot's and we
 * never author it.
 *
 *     node scripts/audit-knowledge.mjs          # the summary
 *     node scripts/audit-knowledge.mjs --cards  # name every card behind each gap
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(join(ROOT, "apps/web/public/cards.json"), "utf8"));
const verbose = process.argv.includes("--cards");

/**
 * Mechanics a card's printed text can carry.
 *
 * ⚠️ **`modelled` is the honest half of this file.** It says whether anything in Forge can
 * *act* on the mechanic — a `SUPPORTS` entry, a `produces`/`consumes` tag, or a dedicated
 * check. A mechanic that is merely *mentioned* in a doc is not modelled, and saying otherwise
 * would make this audit congratulate us for prose.
 */
const MECHANICS = [
  // ── things a deck is built around, where a gap changes what gets built ──
  { id: "empower", re: /\[Empower\]/i, modelled: "empowered / becomes_mighty in SUPPORTS" },
  { id: "empower-once-only", re: /use only if not \[?Empowered/i, modelled: null,
    why: "Every Empower is one charge per body. An empower engine needs far more sources than a card count suggests — this drove a whole rebuild and nothing in the data says it" },
  { id: "level-threshold", re: /\[Level \d+\]/i, modelled: null,
    why: "Payoffs switch on at 3, 6 and 11 XP. A deck can be built to cross a threshold, and Forge cannot see the threshold" },
  { id: "xp-gain", re: /gain \d+ XP|\[Hunt/i, modelled: "counted in the `scoring` package" },
  { id: "xp-spend", re: /spend \d+ XP/i, modelled: null,
    why: "The sink half of the XP economy. Sources without sinks is a dangling synergy nobody can detect" },
  { id: "additional-cost", re: /as an additional cost/i, modelled: null,
    why: "Cruel Patron reads 'kill a friendly unit' to play it. Three copies shipped in a deck whose plan was holding battlefields with bodies" },
  { id: "buff", re: /\[Buff\]|spend my buff|spend a buff/i, modelled: "buff_spend in SUPPORTS" },
  { id: "scores-a-point", re: /score \d+ point|win the game/i, modelled: "counted in the `scoring` package" },

  // ── combat keywords, where a gap changes what a deck can answer ──
  { id: "deflect", re: /\[Deflect/i, modelled: "hasKeyword, and a pattern in advice/patterns" },
  { id: "shield", re: /\[Shield/i, modelled: null, why: "A defensive keyword with no representation — invisible to any 'can this deck hold' read" },
  { id: "ganking", re: /\[Ganking\]/i, modelled: null, why: "Free movement between battlefields, which is how a hold plan repositions" },
  { id: "assault", re: /\[Assault/i, modelled: "hasKeyword" },
  { id: "tank", re: /\[Tank\]/i, modelled: null, why: "Named in GENERATOR's intent table as a defensive target, and not detectable" },
  { id: "hidden", re: /\[Hidden\]/i, modelled: "hidden in SUPPORTS" },
  { id: "temporary", re: /\[Temporary\]/i, modelled: "temporary in SUPPORTS" },
  { id: "accelerate", re: /\[Accelerate\]/i, modelled: null, why: "Enters ready for an extra cost — the same verb the Ambessa deck was built on" },

  // ── resources ──
  { id: "flow", re: /\[Flow\]/i, modelled: "flow in SUPPORTS" },
  { id: "repeat", re: /\[Repeat\]/i, modelled: null, why: "Pay again to repeat a spell. A cost reducer changes which repeats are affordable" },
  { id: "predict", re: /\[Predict\]/i, modelled: null, why: "Deck manipulation, invisible to the opening-hand simulation" },
  { id: "recycle", re: /recycle/i, modelled: "recycle in SUPPORTS" },
  { id: "deathknell", re: /\[Deathknell\]/i, modelled: null, why: "A payoff for your own unit dying — the enabler half of several archetypes" },
  { id: "equip", re: /\[Equip\]/i, modelled: "gear_matters in SUPPORTS" },
];

const cards = index.cards.filter((c) => (c.text ?? "").trim());
const rows = MECHANICS.map((m) => {
  const hits = cards.filter((c) => m.re.test(c.text));
  return { ...m, count: hits.length, names: hits.map((c) => c.name) };
}).sort((a, b) => b.count - a.count);

const gaps = rows.filter((r) => !r.modelled && r.count > 0);
const covered = rows.filter((r) => r.modelled && r.count > 0);

const pad = (s, n) => String(s).padEnd(n);
console.log(`Read ${cards.length} cards with printed text, out of ${index.cards.length}.\n`);

console.log(`⚠️  UNMODELLED — printed on cards, invisible to every check (${gaps.length}):\n`);
for (const g of gaps) {
  console.log(`  ${pad(g.count, 4)} ${pad(g.id, 20)} ${g.why}`);
  if (verbose) console.log(`       ${g.names.slice(0, 14).join(", ")}${g.names.length > 14 ? ` … +${g.names.length - 14}` : ""}\n`);
}

console.log(`\n✓  MODELLED (${covered.length}):\n`);
for (const c of covered) console.log(`  ${pad(c.count, 4)} ${pad(c.id, 20)} ${c.modelled}`);

const unmodelledCards = new Set(gaps.flatMap((g) => g.names));
console.log(
  `\n${unmodelledCards.size} of ${cards.length} cards carry at least one mechanic nothing in Forge can act on ` +
    `(${Math.round((unmodelledCards.size / cards.length) * 100)}%).`,
);
