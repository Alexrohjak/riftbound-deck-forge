import type { CardIndex, Deck, Violation } from "../types.js";

/** The 3-copy limit spans Main Deck + sideboard, and nothing else (L16, TR 601.1.c.3). */
const COUNTED_ZONES = new Set(["MAIN", "SIDEBOARD"]);

export const MAX_COPIES_PER_NAME = 3;

/**
 * Copies of each **name**, across Main Deck and sideboard, with the Chosen Champion
 * included.
 *
 * ⚠️ This is the function DATA-MODEL §2 warns about: *"getting this wrong breaks
 * copy-limit maths silently — the worst failure mode, because the deck looks legal and
 * is not."* Two printings of "Jinx, Rebel" collapse to one name and share one allowance;
 * "Jinx, Demolitionist" is a different name with its own (L15).
 *
 * An unknown printing falls back to its id, which cannot collide with a real name — so
 * missing card data under-counts rather than silently merging two different cards.
 */
export function copiesByName(deck: Deck, cards: CardIndex): Map<string, number> {
  const counts = new Map<string, number>();

  const add = (cardId: string, quantity: number) => {
    const name = cards.nameOf(cardId) ?? cardId;
    counts.set(name, (counts.get(name) ?? 0) + quantity);
  };

  for (const slot of deck.slots) {
    if (COUNTED_ZONES.has(slot.zone)) add(slot.cardId, slot.quantity);
  }

  // L14 — the Chosen Champion counts toward its own name's three.
  add(deck.chosenChampionCardId, 1);

  return counts;
}

/** L13 · L14 · L16 — no name may appear more than three times (CR 103.2.b). */
export function checkCopies(deck: Deck, cards: CardIndex): Violation[] {
  return [...copiesByName(deck, cards)]
    .filter(([, count]) => count > MAX_COPIES_PER_NAME)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      check: "L13",
      citation: "CR 103.2.b",
      message: `"${name}" appears ${count} times across Main Deck and sideboard; the limit is ${MAX_COPIES_PER_NAME}.`,
    }));
}
