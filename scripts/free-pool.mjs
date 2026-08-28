#!/usr/bin/env node
/**
 * What is actually **available** — the collection minus everything in sleeves.
 *
 *     npm run free            # → state/forge-free.json  (also written by `npm run state`)
 *
 * **Why this exists.** `state/forge-state.json` records the collection and the decks, but
 * "what can I still build with" is a *derivation* over the two, and every session was
 * re-deriving it by hand. On 2026-08-28 one of those derivations put `Rengar, Unseen` into a
 * new Draven list while the single copy owned was already sleeved as Rengar — Pridestalker's
 * Chosen Champion. The deck validated, because the file it validated against said the card
 * was free. It was caught by a human reading the deck, which is the one check that does not
 * scale.
 *
 * ⚠️ **The three things `deck_slots` does not tell you.** A BUILT deck holds its slots *and*
 * its Chosen Champion *and* its Legend, and the last two live in their own `decks` columns.
 * Both are singular by construction, which makes them precisely the copies most likely to be
 * the only one owned — so the failure mode is not a rounding error, it is "the deck you just
 * designed cannot be sleeved". `apps/api/src/commitments.ts` has always been right about
 * this; nothing outside the Worker was.
 *
 * ⚠️ **Runes are excluded (D-061)**, matching `commitments.ts` — Forge treats runes as always
 * on hand, so a sleeved rune is not a claim on anything.
 *
 * ⚠️ **Only `BUILT` decks hold cardboard (D-017).** A DRAFT deck is a list, not a pile.
 *
 * The output is shaped so the CLI takes it directly:
 *
 *     node apps/cli/dist/index.js review deck.json --collection state/forge-free.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "state", "forge-state.json");
const OUT = join(ROOT, "state", "forge-free.json");

/**
 * Derive the free pool from a `forge.state/1` document.
 *
 * Returns `{ counts, committed, totals }` — `counts` is printing → copies still available,
 * with exhausted printings dropped rather than left at zero, because a `0` and an absent key
 * mean the same thing to every consumer and one of them is noise.
 *
 * @param {{ collection: { counts: Record<string, number> }, decks: Array<object> }} state
 */
export function freePool(state) {
  const counts = { ...state.collection.counts };
  /** printing → copies committed, for the report. */
  const committed = {};

  const take = (cardId, n) => {
    if (!cardId || n <= 0) return;
    committed[cardId] = (committed[cardId] ?? 0) + n;
    if (counts[cardId] === undefined) return;
    counts[cardId] -= n;
    if (counts[cardId] <= 0) delete counts[cardId];
  };

  for (const deck of state.decks ?? []) {
    if (deck.state !== "BUILT") continue;
    const slots = deck.slots ?? [];
    for (const slot of slots) {
      if (slot.zone === "RUNE") continue;
      take(slot.cardId, slot.quantity);
    }
    // ⚠️ **Merged, not added blindly.** A Champion that is *also* written as a Main Deck slot
    // — Ambessa is the one deck that does this — is one physical card, and counting it twice
    // would invent a shortage. Same for a Legend that appears as a slot.
    for (const cardId of [deck.chosenChampionCardId, deck.legendCardId]) {
      if (!cardId) continue;
      if (slots.some((s) => s.cardId === cardId)) continue;
      take(cardId, 1);
    }
  }

  return {
    counts,
    committed,
    totals: {
      printings: Object.keys(counts).length,
      copies: Object.values(counts).reduce((n, q) => n + q, 0),
      committedCopies: Object.values(committed).reduce((n, q) => n + q, 0),
    },
  };
}

/** Build the document `npm run free` writes. */
export function freePoolDocument(state) {
  const { counts, totals } = freePool(state);
  return {
    schema: "forge.collection/1",
    note: "Available to build with: the collection minus every BUILT deck's slots, Chosen Champion and Legend. Runes excluded (D-061).",
    takenAt: state.takenAt,
    totals,
    counts,
  };
}

/** Write it, and say what it found. Shared with `pull-state.mjs` so both stay in step. */
export function writeFreePool(state, out = OUT) {
  // ⚠️ An empty collection is a plausible-looking answer and a catastrophic one — the same
  // reasoning `pull-state.mjs` gives for refusing to write one.
  if (Object.keys(state.collection?.counts ?? {}).length === 0) {
    throw new Error(
      "The state file holds an empty collection. Refusing to write a free pool that would make every ownership answer wrong.",
    );
  }
  const doc = freePoolDocument(state);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  return doc;
}

// Run directly: read the state file `npm run state` wrote.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const doc = writeFreePool(state);
  process.stdout.write(
    `${OUT}\n  ${doc.totals.printings} printings · ${doc.totals.copies} copies free · ` +
      `${doc.totals.committedCopies} in sleeves\n`,
  );
}
