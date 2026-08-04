import type { CardFacts, CardIndex, Deck, Domain } from "../types.js";
import { OFFICIAL } from "../advice/doctrine.js";
import { MAIN_DECK_SIZE } from "../advice/shape.js";

/**
 * `S5` — what a deck proposal has to satisfy, assembled as data.
 *
 * **The model proposes; the engine disposes.** A language model is good at reading a
 * Legend's ability text and knowing that two cards want to be in a deck together. It is bad
 * at counting to forty, remembering that the Chosen Champion is inside the 40, and never
 * exceeding three copies of a name. So this file hands over the *constraints and the pool*,
 * and [`validate`](./validate.ts) refuses anything that comes back wrong.
 *
 * ⚠️ **Nothing here is prose about cards.** The brief is a card list and a set of numbers.
 * The engine has no opinion it did not compute, and inventing one to help the model along
 * would put an unsourced claim into the middle of the one component that is supposed to be
 * checkable (D-016, D-043).
 *
 * ⚠️ **It is also not a prompt.** A prompt is the caller's business, because the caller
 * knows which mouth it is talking to — Claude Code locally, an Action, or an API. The engine
 * stays pure and stays out of it (D-047).
 */

export interface BriefCard {
  /** The printing to put in a slot. Names collapse; slots do not. */
  cardId: string;
  name: string;
  types: readonly string[];
  domains: readonly string[];
  energy: number | null;
  might: number | null;
  /** Rules text, verbatim. **This is the thing worth reading** — 1041 of 1062 cards have it. */
  text: string;
  /** Classification tags, where they exist. Absent is absent, never guessed. */
  produces?: readonly string[];
  consumes?: readonly string[];
  /** ⚠️ Copies in your boxes, across arts. `0` means acquiring it, not sleeving it. */
  owned: number;
}

export interface Seed {
  /** The Legend. Fixes Domain Identity, and its ability is the deck's engine. */
  legendCardId: string;
  /** Cards the builder asked to be built around. May be empty. */
  aroundCardIds?: readonly string[];
  /** Names never to propose again — "I don't like this card", remembered. */
  excludeNames?: readonly string[];
  /** Free-text tastes the caller is tracking. Passed through, never interpreted here. */
  avoid?: readonly string[];
}

export interface Targets {
  mainDeck: number;
  runes: number;
  battlefields: number;
  maxCopiesPerName: number;
  /** Riot's Primer, which outranks community heuristics where they conflict. */
  official: typeof OFFICIAL;
}

export interface Brief {
  legend: BriefCard;
  /** The Legend's ability, called out because everything else is chosen to serve it. */
  legendAbility: string;
  identity: readonly Domain[];
  targets: Targets;
  /** Every card legal under this Legend — the whole search space, nothing pre-filtered. */
  pool: BriefCard[];
  /**
   * ⚠️ **Every legal printing id, not just the one shown per name.**
   *
   * `pool` collapses to one entry per name, because a proposal should choose cards rather
   * than pictures. But a *different* printing of a pool card is equally legal — it is the
   * same card — and validating against the collapsed list reported real cards as invented.
   * Fury Rune came back as "not in the supplied pool" because the brief happened to list a
   * different art of it.
   */
  legalCardIds: string[];
  /** The cards the builder asked for, resolved and checked against identity. */
  around: BriefCard[];
  /** ⚠️ Asked for but **not legal** under this Legend. Silence here would be a trap. */
  aroundRejected: Array<{ cardId: string; name: string; because: string }>;
  excludeNames: readonly string[];
  avoid: readonly string[];
  /** Counts, so a caller can say "321 of 935" rather than implying it saw everything. */
  counts: { poolNames: number; owned: number };
}

const RUNES = 12;
const BATTLEFIELDS = 3;
const MAX_COPIES = 3;

/** `colorless` is legal under every identity (L12), so it never excludes a card. */
const insideIdentity = (domains: readonly string[] | undefined, identity: readonly Domain[]) =>
  (domains ?? []).every((d) => d === "colorless" || identity.includes(d as Domain));

/**
 * Assemble the brief.
 *
 * `pool` is the caller's — the engine never reads a file (D-047). Ownership is optional and
 * keyed on printing; copies are summed per name, the same collapse `L26` makes.
 */
export function buildBrief(
  seed: Seed,
  cards: CardIndex,
  pool: readonly { cardId: string; facts: CardFacts }[],
  collection: Readonly<Record<string, number>> = {},
): Brief {
  const ownedByName = new Map<string, number>();
  for (const [cardId, n] of Object.entries(collection)) {
    const name = cards.nameOf(cardId);
    if (name) ownedByName.set(name, (ownedByName.get(name) ?? 0) + n);
  }

  const identity = (cards.domainsOf?.(seed.legendCardId) ?? []) as Domain[];
  const legendFacts = cards.factsOf?.(seed.legendCardId);

  const describe = (cardId: string, facts: CardFacts): BriefCard => ({
    cardId,
    name: facts.name,
    types: facts.types ?? [],
    domains: facts.domains ?? [],
    energy: facts.energy ?? null,
    might: facts.might ?? null,
    text: facts.text ?? "",
    ...(facts.produces ? { produces: facts.produces } : {}),
    ...(facts.consumes ? { consumes: facts.consumes } : {}),
    owned: ownedByName.get(facts.name) ?? 0,
  });

  const excludeNames = seed.excludeNames ?? [];
  const excluded = new Set(excludeNames);

  const seen = new Set<string>();
  const legal: BriefCard[] = [];
  const legalCardIds: string[] = [];
  for (const { cardId, facts } of pool) {
    if (excluded.has(facts.name)) continue;
    if (facts.banned) continue;
    if (facts.types?.includes("legend")) continue;
    if (facts.superTypes?.includes("token")) continue;
    // L9/L10 — a card outside the Legend's identity cannot be registered, so offering it
    // would be offering an illegal deck.
    if (identity.length > 0 && !insideIdentity(facts.domains, identity)) continue;
    // Every legal printing is acceptable in a slot; only the *listing* collapses by name.
    legalCardIds.push(cardId);
    if (seen.has(facts.name)) continue;
    seen.add(facts.name);
    legal.push(describe(cardId, facts));
  }

  const around: BriefCard[] = [];
  const aroundRejected: Brief["aroundRejected"] = [];
  for (const cardId of seed.aroundCardIds ?? []) {
    const facts = cards.factsOf?.(cardId);
    if (!facts) {
      aroundRejected.push({ cardId, name: cardId, because: "Not a card this index knows." });
      continue;
    }
    // ⚠️ Said out loud rather than dropped. "Build around this" and then quietly not doing
    // so is the single most annoying way a generator can fail.
    if (identity.length > 0 && !insideIdentity(facts.domains, identity)) {
      aroundRejected.push({
        cardId,
        name: facts.name,
        because: `${(facts.domains ?? []).join(" + ")} is outside ${identity.join(" + ")} — L9.`,
      });
      continue;
    }
    if (facts.banned) {
      aroundRejected.push({ cardId, name: facts.name, because: "Banned in Constructed 1v1." });
      continue;
    }
    around.push(describe(cardId, facts));
  }

  return {
    legend: legendFacts
      ? describe(seed.legendCardId, legendFacts)
      : {
          cardId: seed.legendCardId,
          name: seed.legendCardId,
          types: ["legend"],
          domains: identity,
          energy: null,
          might: null,
          text: "",
          owned: 0,
        },
    legendAbility: legendFacts?.text ?? "",
    identity,
    targets: {
      mainDeck: MAIN_DECK_SIZE,
      runes: RUNES,
      battlefields: BATTLEFIELDS,
      maxCopiesPerName: MAX_COPIES,
      official: OFFICIAL,
    },
    pool: legal,
    legalCardIds,
    around,
    aroundRejected,
    excludeNames,
    avoid: seed.avoid ?? [],
    counts: { poolNames: legal.length, owned: ownedByName.size },
  };
}

/** A proposal, in the shape a caller returns it. Deliberately loose — `validate` is the gate. */
export interface Proposal {
  legendCardId: string;
  chosenChampionCardId: string;
  main: Array<{ cardId: string; quantity: number }>;
  runes: Array<{ cardId: string; quantity: number }>;
  battlefields: Array<{ cardId: string; quantity: number }>;
  /** Why this deck. Shown to the builder; never parsed. */
  reasoning?: string;
}

/** Turn a proposal into the `Deck` every check in the engine already understands. */
export function toDeck(proposal: Proposal, id = "proposal", name = "Proposed"): Deck {
  return {
    id,
    name,
    state: "DRAFT",
    legendCardId: proposal.legendCardId,
    chosenChampionCardId: proposal.chosenChampionCardId,
    slots: [
      ...proposal.main.map((s) => ({ ...s, zone: "MAIN" as const })),
      ...proposal.runes.map((s) => ({ ...s, zone: "RUNE" as const })),
      ...proposal.battlefields.map((s) => ({ ...s, zone: "BATTLEFIELD" as const })),
    ].filter((s) => s.quantity > 0),
  };
}
