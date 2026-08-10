import type { CardFacts, CardIndex, Domain, IndexCapabilities } from "./types.js";

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

/**
 * One card from the generated index (`apps/web/public/cards.json`) as `CardFacts`.
 *
 * ⚠️ **This exists because there were two of it and they drifted.** The browser and the CLI
 * each built their own mapping, and the CLI's silently omitted `power`, `role` and `timing` —
 * so 374 of 814 cards read at the wrong cost, every `timing`-dependent pattern was blind, and
 * every `role`-dependent one was working from half the data. Nothing failed; the answers were
 * just quietly worse. That is precisely the second implementation [D-047](../../../docs/DECISIONS.md#d-047)
 * exists to prevent, and it appeared in the seam within a day of the seam being built.
 *
 * **Loading is still the caller's job** — this takes an already-parsed object, so the package
 * stays pure. It is the *mapping* that is shared, because the mapping is where the drift was.
 */
export function cardFactsFrom(raw: Record<string, unknown>): CardFacts {
  const num = (key: string): number | null => {
    const value = raw[key];
    return typeof value === "number" ? value : null;
  };
  const str = (key: string): string | undefined =>
    typeof raw[key] === "string" ? (raw[key] as string) : undefined;
  const list = (key: string): string[] | undefined =>
    Array.isArray(raw[key]) ? (raw[key] as string[]) : undefined;

  const role = str("role");
  const timing = str("timing");
  const produces = list("produces");
  const consumes = list("consumes");
  const championTag = str("championTag");

  const facts: CardFacts = {
    name: String(raw.name ?? ""),
    types: list("types") ?? [],
    superTypes: list("superTypes") ?? [],
    tags: list("tags") ?? [],
    text: str("text") ?? "",
    domains: (list("domains") ?? []) as Domain[],
    energy: num("energy"),
    power: num("power"),
    might: num("might"),
    // Always present, never conditional: absent reads as "unknown" and would switch the
    // format checks off for a pool with nothing banned in it.
    banned: raw.banned === true,
  };
  // Assigned rather than spread: under `exactOptionalPropertyTypes` an optional key and a key
  // holding `undefined` are different types, and the spread form loses that distinction.
  if (role !== undefined) facts.role = role;
  if (timing !== undefined) facts.timing = timing;
  if (produces !== undefined) facts.produces = produces;
  if (consumes !== undefined) facts.consumes = consumes;
  if (championTag !== undefined) facts.championTag = championTag;
  return facts;
}
