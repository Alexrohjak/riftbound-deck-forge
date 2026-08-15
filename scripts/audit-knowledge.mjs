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
import { MECHANICS } from "../packages/engine/dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(join(ROOT, "apps/web/public/cards.json"), "utf8"));
const verbose = process.argv.includes("--cards");

/**
 * ⚠️ **The table lives in the engine now, and this script consumes it.**
 *
 * It used to be defined here, and that was the bug: this file could *detect* `Cruel Patron`'s
 * additional cost while `packages/engine` could not, so the audit reported a gap that no check
 * could ever act on. Two copies of a mapping is exactly the drift
 * [D-047](../docs/DECISIONS.md#d-047) exists to prevent — and it had already happened once in
 * this seam, in `cardFactsFrom`.
 *
 * `MECHANICS[].modelled` is still the honest half: it names what in Forge *acts* on the
 * mechanic, or `null`. A mechanic merely mentioned in a document is not modelled, and saying
 * otherwise would make this audit congratulate us for prose.
 */

const cards = index.cards.filter((c) => (c.text ?? "").trim());
const rows = MECHANICS.map((m) => {
  const hits = cards.filter((c) => m.pattern.test(c.text));
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
