import type { CardIndex, Deck } from "../types.js";
import { mainDeckCount } from "../legality/shape.js";

/**
 * The energy curve — **a histogram, never a mean** (DECK-STATS §6).
 *
 * A deck of all 3-drops and a deck split between 1-drops and 6-drops share a mean of 3
 * and play nothing alike, so the average was dropped rather than shown. This is a Tier 1
 * statistic: a fact about the deck list, with no assumptions in it.
 */
export interface EnergyCurve {
  /**
   * `counts[n]` = Main Deck cards costing `n` Energy, copies included. Dense from 0 to
   * the highest cost actually present — no invented "7+" bucket.
   */
  counts: number[];
  /**
   * Main Deck cards whose Energy the caller did not supply. **Kept separate rather than
   * folded into bucket 0**, which would silently pull the curve left (D-022).
   */
  unknown: number;
  /** Cards represented in the histogram, `unknown` excluded. */
  counted: number;
  /** Main Deck size the curve was drawn from, Chosen Champion included — 40 in a legal deck. */
  mainDeckSize: number;
}

/**
 * Build the curve over the Main Deck, **Chosen Champion included** — it is a Main Deck
 * card that happens to live in its own field (DATA-MODEL §1), and it is usually one of
 * the most-cast cards in the deck.
 *
 * Runes and battlefields are excluded: they have no Energy cost and are not drawn.
 */
export function energyCurve(deck: Deck, cards: CardIndex): EnergyCurve {
  const counts: number[] = [];
  let unknown = 0;
  let counted = 0;

  const add = (cardId: string, quantity: number) => {
    const energy = cards.energyOf?.(cardId);
    if (energy === undefined || energy === null || !Number.isFinite(energy) || energy < 0) {
      unknown += quantity;
      return;
    }
    const bucket = Math.trunc(energy);
    while (counts.length <= bucket) counts.push(0);
    counts[bucket] = (counts[bucket] ?? 0) + quantity;
    counted += quantity;
  };

  for (const slot of deck.slots) {
    if (slot.zone === "MAIN") add(slot.cardId, slot.quantity);
  }
  // ⚠️ **An unchosen Champion is not a card.** The field is `""` until you pick one, and
  // adding it regardless put a phantom into `unknown` and a phantom into `mainDeckSize` —
  // the same off-by-one D-060 found in `mainDeckCount`, which is why this now defers to it.
  if (deck.chosenChampionCardId) add(deck.chosenChampionCardId, 1);

  return { counts, unknown, counted, mainDeckSize: mainDeckCount(deck) };
}
