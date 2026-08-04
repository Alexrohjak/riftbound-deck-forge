import type { CardFacts, CardIndex, IndexCapabilities } from "./types.js";

/** What a caller may hand us per printing: just a name, or a name plus what we know. */
export type CardEntry = string | CardFacts;

/**
 * A `CardIndex` over an already-loaded printing → facts map.
 *
 * **Loading is the caller's job, deliberately.** The browser imports the static card
 * index; the CLI reads it from disk; tests pass a literal. Keeping the read outside this
 * package is what keeps the package pure (D-047).
 *
 * A bare string stays valid and means *name only* — so an index built before domains
 * existed keeps working, and the checks that need domains simply do not run.
 */
export function staticCardIndex(cards: Readonly<Record<string, CardEntry>>): CardIndex {
  const factsOf = (cardId: string): CardFacts | undefined => {
    const entry = cards[cardId];
    if (entry === undefined) return undefined;
    return typeof entry === "string" ? { name: entry } : entry;
  };

  // Derived, not declared. A caller cannot accidentally claim to know the ban list by
  // passing a flag — the index knows only what every one of its entries carries.
  const entries = Object.values(cards).map((e) => (typeof e === "string" ? { name: e } : e));
  const every = (has: (f: CardFacts) => boolean) => entries.length > 0 && entries.every(has);
  const capabilities: IndexCapabilities = {
    types: every((f) => f.types !== undefined && f.superTypes !== undefined),
    text: every((f) => f.text !== undefined),
    bans: every((f) => f.banned !== undefined),
  };

  return {
    capabilities,
    nameOf: (cardId) => factsOf(cardId)?.name,
    domainsOf: (cardId) => factsOf(cardId)?.domains,
    energyOf: (cardId) => factsOf(cardId)?.energy,
    factsOf,
  };
}
