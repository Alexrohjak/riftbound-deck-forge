import { zoneCount, type Deck, type DeckSlot } from "@forge/engine";
import type { Card, CardPool } from "./cards.js";
import type { Filters, Tab } from "./filters.js";

/**
 * The guided build: pick a Legend, then a Champion, then forty cards, then battlefields.
 *
 * **The order is the rules' order, not a preference.** The Legend fixes Domain Identity,
 * which decides what is legal in every later step; the Champion must carry the Legend's
 * champion tag; the Main Deck must sit inside the identity. Asking for them in any other
 * sequence means showing cards that cannot legally be picked.
 *
 * Runes are filled automatically and deliberately left out of the flow. Riot's own Primer
 * advises a **6-6 split across your two domains, tweaked as you play** — so the default is
 * right almost always, and the rune tab stays available for the times it is not.
 */

export type Step = "legend" | "champion" | "main" | "battlefield" | "done";

/** Riot's Primer: "Generally a good start is a 6-6 split across your two domains." */
export const RUNE_SPLIT = 6;

export const STEPS: Array<{ step: Step; label: string; tab: Tab }> = [
  { step: "legend", label: "Legend", tab: "legend" },
  { step: "champion", label: "Champion", tab: "main" },
  { step: "main", label: "Main Deck", tab: "main" },
  { step: "battlefield", label: "Battlefields", tab: "battlefield" },
];

/** Where the deck actually is, read from the deck rather than remembered separately. */
export function stepFor(deck: Deck, pool: CardPool): Step {
  const legend = pool.byPrinting.get(deck.legendCardId);
  if (!legend || !legend.types.includes("legend")) return "legend";

  const champion = pool.byPrinting.get(deck.chosenChampionCardId);
  const championFits =
    champion !== undefined &&
    legend.championTag !== undefined &&
    champion.tags.includes(legend.championTag);
  if (!championFits) return "champion";

  // 39 slots plus the Champion is the legal 40 (L3).
  if (zoneCount(deck, "MAIN") < 39) return "main";
  if (zoneCount(deck, "BATTLEFIELD") < 3) return "battlefield";
  return "done";
}

/** The gallery filter that step implies. */
export function filtersFor(step: Step, deck: Deck, pool: CardPool, base: Filters): Filters {
  const legend = pool.byPrinting.get(deck.legendCardId);
  const identity = legend?.domains;

  switch (step) {
    case "legend":
      return { ...base, tab: "legend", championTag: undefined, identity: undefined };
    case "champion":
      // Only this Legend's champion units — picking Ahri shows Ahri, and nothing else.
      return { ...base, tab: "main", championTag: legend?.championTag, identity: undefined };
    case "main":
      return { ...base, tab: "main", championTag: undefined, identity };
    case "battlefield":
      return { ...base, tab: "battlefield", championTag: undefined, identity: undefined };
    default:
      return { ...base, championTag: undefined, identity };
  }
}

/**
 * The 6-6 rune split for a Legend's two domains.
 *
 * Returns replacement RUNE slots. Basic runes only (L31), one name per domain — there are
 * exactly six distinct rune names in the game, so this is a lookup rather than a choice.
 */
export function runeSlots(legend: Card, pool: CardPool): DeckSlot[] {
  const slots: DeckSlot[] = [];
  for (const domain of legend.domains) {
    if (domain === "colorless") continue;
    const rune = pool.cards.find(
      (c) =>
        c.types.includes("rune") &&
        c.superTypes.includes("basic") &&
        c.domains.includes(domain),
    );
    const printing = rune?.printings[0]?.id;
    if (printing) slots.push({ cardId: printing, zone: "RUNE", quantity: RUNE_SPLIT });
  }
  return slots;
}
