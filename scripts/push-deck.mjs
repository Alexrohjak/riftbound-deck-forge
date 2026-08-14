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
 *     npm run deck -- <proposal.json> --name "…" --plan fast-conquer   # or a plan.json
 *     npm run deck -- <proposal.json> --name "…" --dry-run             # check, write nothing
 *     npm run deck -- <proposal.json> --name "…" --replace          # overwrite that deck
 *     npm run deck -- <proposal.json> --name "…" --id fiora-v2      # pick the id yourself
 *
 * ⚠️ **Adding never overwrites.** The id is slugged from the name, so asking twice for "a
 * Fiora deck" would have written both to `fiora-deck` and silently destroyed the first —
 * including any edits made on the Workbench in between. A name already in use now takes the
 * next free suffix and says so. `--replace` is the only way to overwrite, and it is a
 * deliberate word rather than a side effect of repeating yourself.
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
 * ⚠️ **It measures the deck and says so, every time** (D-064). This is where "the loop forces
 * the measurement" actually happens: the briefing used to *ask* the mouth to run `review`, and
 * an instruction is not a mechanism — the deck that started all of this shipped with every
 * gate green because nobody ran it. The check now happens here, where the deck is written,
 * and cannot be skipped.
 *
 * ⚠️ **It never refuses an ugly deck.** Thresholds like "needs 6 removal" are contested
 * doctrine, and refusing on them would put opinion in the engine and edge toward the grading
 * D-016 forbids. It refuses **illegal** decks and discloses everything else — including, and
 * especially, that a deck arrived with no plan at all.
 *
 * ⚠️ Uses `wrangler d1 execute --remote`, so it needs the same auth `npm run deploy` does.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkLegality,
  staticCardIndex,
  cardFactsFrom,
  planFromSkeleton,
  reviewAgainstPlan,
  reviewBattlefields,
  review,
  simulateMulligans,
  skeletonById,
  SKELETONS,
} from "../packages/engine/dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * One statement batch against the live database. Mirrors `pull-state.mjs`'s reader —
 * `wrangler --json` prefixes its own logging, so the payload is the last top-level array.
 */
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

/**
 * D-064 — what this deck was built to do.
 *
 * ⚠️ A **plan file is the normal case**, a skeleton id the convenience. EE's entry point is a
 * sentence and usually carries the intent already, so most plans are written from what was
 * asked for rather than picked off a menu (`GENERATOR §2`).
 */
const planArg = flag("--plan") ?? (proposal.plan ? "inline" : undefined);
let plan;
if (planArg === "inline") plan = proposal.plan;
else if (planArg) {
  const skeleton = skeletonById(planArg);
  if (skeleton) plan = planFromSkeleton(skeleton);
  else {
    plan = JSON.parse(readFileSync(planArg, "utf8"));
    if (!plan?.packages || typeof plan.closerFrom !== "number") {
      process.stderr.write(
        `"${planArg}" is neither a skeleton id (${SKELETONS.map((s) => s.id).join(", ")}) ` +
          `nor a plan file with "packages" and "closerFrom" — see docs/spec/GENERATOR.md §2.\n`,
      );
      process.exit(2);
    }
  }
}
const replace = argv.includes("--replace");
/**
 * ⚠️ **`--dry-run` exists because this writes to the only database there is.**
 *
 * Everything up to the write runs — the 33 checks, the plan read, the mulligan number — and
 * then nothing is sent. A script aimed at production that cannot be exercised without
 * touching production is a script that gets tested in production.
 */
const dryRun = argv.includes("--dry-run");
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** ⚠️ Read before writing, so a new deck can never land on top of an existing one. */
const existing = new Set(
  d1(`SELECT id FROM decks;`).map((r) => r.id),
);

let id = flag("--id") ?? slug(name);
if (existing.has(id) && !replace) {
  const base = id;
  for (let n = 2; existing.has(id); n++) id = `${base}-${n}`.slice(0, 40);
}
const overwriting = replace && existing.has(id);

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

// ── the measurement (D-064) ─────────────────────────────────────────────────
/**
 * ⚠️ **This runs whether or not it is wanted, and it never blocks the write.**
 *
 * The briefing already told the mouth to run `review` on any deck it proposed. It shipped a
 * deck of nineteen two-drops anyway, because an instruction is not a mechanism. Putting the
 * measurement where the deck is *written* is the whole of the fix.
 */
const pct = (n) => `${Math.round(n * 100)}%`;
const out = (line) => process.stdout.write(`${line}\n`);

out("");
if (plan) {
  const read = reviewAgainstPlan(deck, plan, index);
  out(`  plan · ${plan.origin} — "${plan.winCondition}"`);
  for (const d of read.packages) {
    const band = d.target.max === undefined ? `${d.target.min}+` : `${d.target.min}–${d.target.max}`;
    const mark = d.within ? "✓" : d.delta > 0 ? `+${d.delta}` : `${d.delta}`;
    out(`    ${d.package.padEnd(12)} ${String(d.actual).padStart(3)}  target ${band.padEnd(6)} ${mark}`);
  }
  const big = read.curve.largestBucket;
  out(`    curve        ${big.count} of ${read.curve.curve.reduce((a, b) => a + b, 0)} at cost ${big.energy} (${pct(big.share)})${read.curve.holes.length ? ` · nothing at ${read.curve.holes.join(", ")}` : ""}`);
  if (read.unmeasurableRewards.length > 0) {
    out(`    ⚠️  engine is a FLOOR — ${read.unmeasurableRewards.join(", ")} could not be measured`);
  }
  if (read.reference) {
    const r = read.reference;
    out(`  ⚖️  against ${r.skeletonId}, which was not written for this deck:`);
    for (const d of r.packages) {
      const b2 = d.target.max === undefined ? `${d.target.min}+` : `${d.target.min}–${d.target.max}`;
      const mark = d.within ? "✓" : d.delta > 0 ? `+${d.delta}` : `${d.delta}`;
      const flag = r.disagreements.includes(d.package) ? " ⚠️ the two plans disagree" : "";
      out(`    ${d.package.padEnd(12)} ${String(d.actual).padStart(3)}  target ${b2.padEnd(6)} ${mark}${flag}`);
    }
  }
  for (const n of read.notes) out(`    · ${n.claim}`);
} else {
  /**
   * ⚠️ **A missing plan is disclosed, not defaulted.** Inventing one to measure against would
   * be marking the deck's own homework, and D-041 puts the objective with the builder — so
   * the honest output is that nothing checked whether this deck does what it was meant to.
   */
  out(`  ⚠️  NO PLAN — nothing checked whether this deck does what it was meant to.`);
  out(`      Pass --plan <${SKELETONS.map((s) => s.id).join("|")}> or a plan.json.`);
  for (const n of review(deck, index).notes) out(`    · ${n.claim}`);
}

const mull = simulateMulligans(deck, index);
if (mull.hands > 0) {
  out(`    openings     ${pct(mull.atMostOnePlayable)} with at most one card castable by turn 3`);
}

const bf = reviewBattlefields(deck, index, new Set((plan?.battlefields ?? []).map((b) => b.cardId)));
out(`    battlefields ${bf.registered.map((b) => `${b.name} (${b.class})`).join(" · ") || "none"}`);
if (!bf.varied) out(`    ⚠️  all three pay out on "${bf.sharedTrigger}" — only one is used per game`);
for (const b of bf.unjustified) {
  out(`    ⚠️  ${b.name} is symmetric with no stated reason — it helps whoever exploits it harder`);
}
out("");

// ── the write ───────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const statements = [
  `DELETE FROM deck_slots WHERE deck_id = ${q(id)};`,
  // ⚠️ `plan` is written only when one was given, and the UPDATE branch leaves it alone
  // otherwise — the same rule the API's PUT follows. Re-pushing a deck without naming its
  // plan must not silently discard the plan it already had.
  `INSERT INTO decks (id, name, state, legend_card_id, chosen_champion_card_id, plan, updated_at)
     VALUES (${q(id)}, ${q(name)}, 'DRAFT', ${q(deck.legendCardId)}, ${q(deck.chosenChampionCardId)}, ${plan ? q(JSON.stringify(plan)) : "NULL"}, datetime('now'))
   ON CONFLICT(id) DO UPDATE SET
     name = excluded.name,
     state = 'DRAFT',
     legend_card_id = excluded.legend_card_id,
     chosen_champion_card_id = excluded.chosen_champion_card_id,
     ${plan ? "plan = excluded.plan," : ""}
     updated_at = datetime('now');`,
  ...slots.map(
    (s) =>
      `INSERT INTO deck_slots (deck_id, card_id, zone, quantity) VALUES (${q(id)}, ${q(s.cardId)}, ${q(s.zone)}, ${s.quantity});`,
  ),
];

/**
 * ⚠️ **Prove the other decks were untouched.** Nothing here targets another deck's id, but
 * "nothing should have" is not evidence, and a writer aimed at the database that holds every
 * deck you own is exactly where a silent clobber would live. Counting rows either side costs
 * one query and turns a belief into a check.
 */
if (dryRun) {
  process.stdout.write(
    `  ✓ dry run — nothing written. Would ${overwriting ? "replace" : "add"} "${name}" (${id}).\n`,
  );
  process.exit(0);
}

const before = Object.fromEntries(
  d1(`SELECT deck_id, COUNT(*) AS n FROM deck_slots GROUP BY deck_id;`).map((r) => [r.deck_id, r.n]),
);

d1(statements.join("\n"));

const after = Object.fromEntries(
  d1(`SELECT deck_id, COUNT(*) AS n FROM deck_slots GROUP BY deck_id;`).map((r) => [r.deck_id, r.n]),
);
const collateral = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter((d) => d !== id)
  .filter((d) => (before[d] ?? 0) !== (after[d] ?? 0));
if (collateral.length > 0) {
  process.stderr.write(
    `\n⚠️  OTHER DECKS CHANGED — this should be impossible, please report it:\n` +
      collateral.map((d) => `     ${d}: ${before[d] ?? 0} → ${after[d] ?? 0} slots\n`).join("") +
      `   deck_history holds prior contents; restore from there.\n`,
  );
  process.exitCode = 1;
}

const count = (zone) => slots.filter((s) => s.zone === zone).reduce((n, s) => n + s.quantity, 0);
process.stdout.write(
  `${overwriting ? "↻ replaced" : "✓ added"} "${name}" (${id}) — ` +
    `${count("MAIN") + 1} main incl. champion · ${count("RUNE")} runes · ` +
    `${count("BATTLEFIELD")} battlefields · ${count("SIDEBOARD")} sideboard\n` +
    `  ${existing.size + (overwriting ? 0 : 1)} deck(s) on the Workbench · ` +
    `https://forge.alexander-rohde-jakobsen.workers.dev\n`,
);
if (id !== (flag("--id") ?? slug(name))) {
  process.stdout.write(`  note: "${slug(name)}" was taken, so this became "${id}". Nothing was overwritten.\n`);
}
