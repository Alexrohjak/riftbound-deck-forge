import type { CardFacts, CardIndex, Deck, Zone } from "../types.js";

/**
 * One printing in the deck, with whatever the caller knows about it.
 *
 * ⚠️ **The Chosen Champion is a Main Deck card that lives in its own field** (DATA-MODEL
 * §1). Every check that counts Main Deck cards has to add it back, and forgetting to is
 * the off-by-one that makes a legal deck report as one short — or lets an illegal Champion
 * through the very check meant to catch it.
 */
export interface Entry {
  cardId: string;
  zone: Zone;
  quantity: number;
  name: string;
  facts: CardFacts | undefined;
}

const entry = (cards: CardIndex, cardId: string, zone: Zone, quantity: number): Entry => ({
  cardId,
  zone,
  quantity,
  // An unknown printing falls back to its id, which cannot collide with a real name — so
  // missing data under-counts rather than silently merging two different cards.
  name: cards.nameOf(cardId) ?? cardId,
  facts: cards.factsOf?.(cardId),
});

/**
 * Every registered card, the Chosen Champion included.
 *
 * ⚠️ **An unchosen Champion is not a card.** The field is an empty string before you pick
 * one, and emitting an entry for it produced a nameless phantom that counted toward the 40
 * and reported as a card you were short of — `"3 copies short across 2 names — , Fury Rune"`.
 */
export function deckEntries(deck: Deck, cards: CardIndex): Entry[] {
  return [
    ...deck.slots.map((slot) => entry(cards, slot.cardId, slot.zone, slot.quantity)),
    ...(deck.chosenChampionCardId ? [entry(cards, deck.chosenChampionCardId, "MAIN", 1)] : []),
  ];
}

/**
 * Whether an entry is a card the collection is expected to account for — **D-061**.
 *
 * Runes are not collected. Every deck registers exactly twelve (L4) and there are only six
 * names in the game, so a rune is a fixture of the format rather than a card you go and
 * find. Counting them made every deck ever built report twelve copies short of cards nobody
 * tracks, and made a deck impossible to mark as built.
 *
 * ⚠️ **Keyed on the zone, not on the card's type.** The zone is structural and always known;
 * `types` depends on what the caller's `CardIndex` happens to carry, so a name-only index
 * would silently start counting runes again. L8–L12 already guarantee only runes reach the
 * Rune Deck, which is what makes the zone a safe proxy.
 */
export const isCollected = (entry: Entry): boolean => entry.zone !== "RUNE";

/**
 * The zones copy limits span: Main Deck + sideboard, and nothing else (L16, TR 601.1.c.3).
 * Runes and battlefields are registered separately and counted by their own rules.
 */
export const countedEntries = (deck: Deck, cards: CardIndex): Entry[] =>
  deckEntries(deck, cards).filter((e) => e.zone === "MAIN" || e.zone === "SIDEBOARD");

/** Sum a quantity per card *name*, which is the unit every copy rule is written in. */
export function totalByName(entries: Entry[], keep: (e: Entry) => boolean): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!keep(e)) continue;
    counts.set(e.name, (counts.get(e.name) ?? 0) + e.quantity);
  }
  return counts;
}

export const has = (facts: CardFacts | undefined, superType: string): boolean =>
  facts?.superTypes?.includes(superType) ?? false;

export const isType = (facts: CardFacts | undefined, type: string): boolean =>
  facts?.types?.includes(type) ?? false;
