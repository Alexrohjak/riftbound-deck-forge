import type { Deck } from "../types.js";

/**
 * A content hash of a deck's card list.
 *
 * **Identical lists must hash identically, whatever route you took to get there.** That is
 * the whole property: it makes a match record name a *build* rather than a mutable deck id,
 * it stops autosave writing ten thousand identical history rows, and it answers "have I
 * tried exactly this list before?" as a lookup instead of a comparison.
 *
 * ⚠️ **Not cryptographic, and not trying to be.** The engine may not import `crypto`
 * (D-047 — it would break the browser or the CLI consumer), and it does not need to: nobody
 * is attacking a personal deck log. What it needs is that unrelated lists do not collide,
 * which 64 bits gives at the scale of a few thousand versions with room to spare.
 *
 * FNV-1a, run twice with different offset bases and concatenated. Written out rather than
 * pulled from a dependency because a hash whose output ends up stored in a database is
 * something you want to be able to read.
 */
const fnv1a = (input: string, seed: number): number => {
  let h = seed;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    // h *= 16777619, in 32-bit arithmetic that survives JS number precision.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

const hex8 = (n: number) => n.toString(16).padStart(8, "0");

/**
 * The canonical string a deck hashes to. Exported because a hash you cannot explain is a
 * hash you cannot debug — when two lists you believe identical hash differently, this is
 * the thing to diff.
 *
 * Sorted, so slot order never affects the result. Zone is included because the same card in
 * the Sideboard is not the same deck. Deck **name and id are excluded**: renaming a deck
 * does not change what you played.
 */
export function canonicalise(deck: Deck): string {
  const slots = deck.slots
    .filter((s) => s.quantity > 0)
    .map((s) => `${s.zone}:${s.cardId}:${s.quantity}`)
    .sort();
  return [`L:${deck.legendCardId}`, `C:${deck.chosenChampionCardId}`, ...slots].join("|");
}

export function deckHash(deck: Deck): string {
  const canon = canonicalise(deck);
  return hex8(fnv1a(canon, 0x811c9dc5)) + hex8(fnv1a(canon, 0x7c9e6865));
}
