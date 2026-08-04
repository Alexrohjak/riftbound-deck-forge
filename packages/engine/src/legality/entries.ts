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
