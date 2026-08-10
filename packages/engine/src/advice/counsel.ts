import type { CardFacts, CardIndex, Domain } from "../types.js";
import type { PoolCard } from "./feedback.js";
import { hasKeyword } from "../text.js";
import { patternsOf, PATTERNS, type StrategicPattern } from "./patterns.js";
import { SUPPORTS, isModelled, supplyOf, supplyKind, type SupplyKind } from "./synergy.js";

/**
 * **What EE needs in order to answer a deckbuilding question** — EVALUATION §6.
 *
 * ⚠️ **Structured data out, never prose.** Everything here is grounded: counts from the real
 * collection, cards that genuinely match a computable definition, the Legend's own printed
 * text. The judgement — *"this Legend wants gear, and you are running four"* — belongs to the
 * mouth (D-043), which reads this alongside the reference library. **A tool that wrote the
 * sentence would be a tool that could invent it.**
 *
 * ⚠️ **Where doctrine appears it is labelled and reasoned.** `counterCounsel` names which
 * patterns answer which; that is what good players hold, not what the rules say, and it
 * travels with its reasoning so it can be disagreed with (D-045).
 */

/**
 * ⚠️ **The synergy graph lives in one file** — [`synergy.ts`](./synergy.ts). It used to be
 * declared here and again, differently, in `doctrine.ts`.
 */

/**
 * Which patterns answer which — **doctrine, not rules**.
 *
 * Each carries its reasoning so a reader can disagree with the premise rather than only with
 * the conclusion. There is no meta data in this project ([D-035](../../../docs/DECISIONS.md#d-035)),
 * so this is what a card *can* do to another, never what an opponent is likely to be holding.
 */
export const ANSWERS: ReadonlyArray<{
  threat: StrategicPattern;
  answers: StrategicPattern[];
  because: string;
}> = [
  { threat: "bomb", answers: ["spot-removal", "hard-counter", "tempo-denial"], because: "one expensive card carrying the game is the one card worth a hard answer" },
  { threat: "go-wide", answers: ["sweep"], because: "several bodies from one card are answered by one card that hits several bodies" },
  { threat: "recursion", answers: ["hard-counter"], because: "a card you cannot kill twice has to be stopped before it resolves" },
  { threat: "evasion", answers: ["sweep"], because: "a sweep does not choose, so protection from being chosen does not apply" },
  { threat: "ambush-threat", answers: ["hard-counter", "tempo-denial"], because: "you cannot pre-empt a facedown card; you can hold up an answer for it" },
  { threat: "spot-removal", answers: ["go-wide", "recursion"], because: "one-for-one removal loses to more bodies than it has answers, and to threats that come back" },
  { threat: "sweep", answers: ["recursion", "bomb"], because: "rebuild afterwards, or commit one threat big enough to matter alone" },
  { threat: "ramp", answers: ["tempo-denial"], because: "a deck spending early turns on resources is punished for it" },
  { threat: "cheap-might-swing", answers: ["hard-counter"], because: "a trick that flips a showdown is only stopped before it resolves" },
];

const isMainDeckCard = (facts: CardFacts): boolean =>
  !(facts.types ?? []).some((t) => ["legend", "rune", "battlefield", "token"].includes(t));

const insideIdentity = (facts: CardFacts, identity: readonly Domain[]): boolean =>
  (facts.domains ?? []).every((d) => d === "colorless" || identity.includes(d));

export interface CardOption {
  cardId: string;
  name: string;
  /** Copies in the boxes. **Zero is not disqualifying** — it is the difference between a
      suggestion you can sleeve tonight and one you would have to go and find. */
  owned: number;
  energy: number | null;
  power: number | null;
  patterns: StrategicPattern[];
}

/** Cards grouped by what they do, with the ones you own first. */
export interface ByPattern {
  pattern: StrategicPattern;
  label: string;
  definition: string;
  ownedCards: number;
  /** Up to `depth`, owned first, then by cost — the cheap ones are the ones you cast. */
  candidates: CardOption[];
}

const candidateOf = (
  cardId: string,
  facts: CardFacts,
  collection: Readonly<Record<string, number>>,
  byName: Map<string, number>,
): CardOption => ({
  cardId,
  name: facts.name,
  owned: byName.get(facts.name) ?? collection[cardId] ?? 0,
  energy: typeof facts.energy === "number" ? facts.energy : null,
  power: typeof facts.power === "number" ? facts.power : null,
  patterns: patternsOf(facts),
});

/** Copies owned per card *name* — ownership is stored per printing, judged per name. */
function ownedByName(pool: readonly PoolCard[], collection: Readonly<Record<string, number>>) {
  const counts = new Map<string, number>();
  for (const { cardId, facts } of pool) {
    const n = collection[cardId] ?? 0;
    if (n > 0) counts.set(facts.name, (counts.get(facts.name) ?? 0) + n);
  }
  return counts;
}

function groupByPattern(
  cards: Array<{ cardId: string; facts: CardFacts }>,
  collection: Readonly<Record<string, number>>,
  byName: Map<string, number>,
  depth: number,
): ByPattern[] {
  const groups = new Map<StrategicPattern, CardOption[]>();
  const seen = new Set<string>();
  for (const { cardId, facts } of cards) {
    // One entry per name: alternate arts are the same card to a deckbuilder.
    if (seen.has(facts.name)) continue;
    seen.add(facts.name);
    const candidate = candidateOf(cardId, facts, collection, byName);
    for (const pattern of candidate.patterns) {
      groups.set(pattern, [...(groups.get(pattern) ?? []), candidate]);
    }
  }

  return PATTERNS.filter((spec) => groups.has(spec.pattern)).map((spec) => {
    const all = groups.get(spec.pattern) as CardOption[];
    const sorted = [...all].sort(
      (a, b) => b.owned - a.owned || (a.energy ?? 99) - (b.energy ?? 99) || a.name.localeCompare(b.name),
    );
    return {
      pattern: spec.pattern,
      label: spec.label,
      definition: spec.definition,
      ownedCards: all.filter((c) => c.owned > 0).length,
      candidates: sorted.slice(0, depth),
    };
  });
}

export interface LegendCounsel {
  legend: { cardId: string; name: string; domains: readonly Domain[]; championTag?: string; text?: string };
  /** The Champion units this Legend may choose (L18), owned first. */
  champions: CardOption[];
  /** What you own that is legal under this identity, grouped by what it does. */
  byPattern: ByPattern[];
  /** Patterns you own **nothing** for inside this identity — the actionable gap. */
  missing: Array<{ pattern: StrategicPattern; label: string }>;
  ownedInIdentity: number;
  /**
   * **What the Legend rewards, and whether your collection can feed it.**
   *
   * One entry per `consumes` tag on the Legend. `ownedFeeders` counts cards you own, legal in
   * this identity, that supply it — through the same synergy graph every other tool uses.
   *
   * ⚠️ **`ownedFeeders` is `null` unless `supply` is `"counted"`.** A `self-satisfying` tag
   * (`conquer`, `hold`, `attack`) is fed by having a board and taking a normal turn, not by a
   * particular card, and an `unmodelled` one was never measured. Printing `0` for either
   * beside a real count is how "you own nothing for this" gets said about something nobody
   * counted.
   */
  rewards: Array<{ tag: string; ownedFeeders: number | null; supply: SupplyKind }>;
  /** The Legend's ability with no condition attached — nothing for a deck to supply. */
  unconditional: boolean;
}

/**
 * *"I like this Legend — what sort of cards go in it?"*
 *
 * ⚠️ **`rewards` is read off the card, never inferred from its name.** For a long time this
 * returned no such field, on the reasoning that Legends carried no `consumes` annotations and
 * a tool that claimed to know would be inventing the answer's most important sentence. The
 * first half was true and the second did not follow: the field was empty because the
 * classification pass covered the 814 **main-deck** cards and a Legend is not one of them.
 * All 49 are now annotated from their printed text, so this is read rather than guessed.
 *
 * ⚠️ **It is still not the whole answer.** A tag says *what* the Legend wants, not how to
 * pilot it or what fights it; [`LEGEND-GUIDE.md`](../../../docs/reference/LEGEND-GUIDE.md)
 * covers all 49 and the mouth is still required to read it.
 */
export function legendCounsel(
  legendCardId: string,
  cards: CardIndex,
  pool: readonly PoolCard[],
  collection: Readonly<Record<string, number>> = {},
  depth = 6,
): LegendCounsel | null {
  const legend = cards.factsOf?.(legendCardId);
  if (!legend) return null;
  const identity = (legend.domains ?? []) as readonly Domain[];
  const byName = ownedByName(pool, collection);

  const legal = pool.filter(
    ({ facts }) => isMainDeckCard(facts) && facts.banned !== true && insideIdentity(facts, identity),
  );
  const owned = legal.filter(({ facts }) => (byName.get(facts.name) ?? 0) > 0);

  const champions = legend.championTag
    ? pool
        .filter(
          ({ facts }) =>
            (facts.superTypes ?? []).some((s) => s.toLowerCase() === "champion") &&
            (facts.tags ?? []).includes(legend.championTag as string),
        )
        .map(({ cardId, facts }) => candidateOf(cardId, facts, collection, byName))
        .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)
        .sort((a, b) => b.owned - a.owned || a.name.localeCompare(b.name))
    : [];

  const byPattern = groupByPattern(owned, collection, byName, depth);
  const present = new Set(byPattern.map((g) => g.pattern));

  return {
    legend: {
      cardId: legendCardId,
      name: legend.name,
      domains: identity,
      ...(legend.championTag ? { championTag: legend.championTag } : {}),
      ...(legend.text ? { text: legend.text } : {}),
    },
    champions,
    byPattern,
    missing: PATTERNS.filter((spec) => !present.has(spec.pattern)).map((spec) => ({
      pattern: spec.pattern,
      label: spec.label,
    })),
    ownedInIdentity: owned.length,
    rewards: (legend.consumes ?? []).map((tag) => {
      const test = supplyOf(tag);
      return {
        tag,
        ownedFeeders: test ? owned.filter(({ facts }) => test(facts)).length : null,
        supply: supplyKind(tag),
      };
    }),
    unconditional: (legend.consumes ?? []).length === 0,
  };
}

export interface AroundCounsel {
  card: CardOption & { domains: readonly Domain[]; text?: string; consumes: readonly string[]; produces: readonly string[] };
  /** Legends whose identity admits this card, owned first — where the deck could live. */
  legends: CardOption[];
  /** Cards that satisfy what this card asks for, or ask for what it makes. */
  partners: Array<{ link: string; because: string; candidates: CardOption[] }>;
}

/**
 * *"I have one copy of this card and I want a deck built around it."*
 *
 * The synergy graph, walked in both directions: cards that **satisfy** what this one asks for
 * (`consumes`), and cards that **want** what this one makes (`produces`).
 */
export function aroundCounsel(
  cardId: string,
  cards: CardIndex,
  pool: readonly PoolCard[],
  collection: Readonly<Record<string, number>> = {},
  depth = 8,
): AroundCounsel | null {
  const facts = cards.factsOf?.(cardId);
  if (!facts) return null;
  const byName = ownedByName(pool, collection);
  const base = candidateOf(cardId, facts, collection, byName);

  const legends = pool
    .filter(
      ({ facts: f }) =>
        (f.types ?? []).includes("legend") && insideIdentity(facts, (f.domains ?? []) as Domain[]),
    )
    .map(({ cardId: id, facts: f }) => candidateOf(id, f, collection, byName))
    .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)
    .sort((a, b) => b.owned - a.owned || a.name.localeCompare(b.name));

  const partners: AroundCounsel["partners"] = [];
  const pick = (test: (f: CardFacts) => boolean) =>
    pool
      .filter(({ facts: f }) => isMainDeckCard(f) && f.name !== facts.name && f.banned !== true && test(f))
      .map(({ cardId: id, facts: f }) => candidateOf(id, f, collection, byName))
      .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)
      .sort((a, b) => b.owned - a.owned || (a.energy ?? 99) - (b.energy ?? 99))
      .slice(0, depth);

  // What this card asks for.
  for (const tag of facts.consumes ?? []) {
    const supports = SUPPORTS[tag];
    if (!supports) continue;
    const candidates = pick(supports);
    if (candidates.length > 0) {
      partners.push({ link: tag, because: `${facts.name} pays off ${tag.replace(/_/g, " ")}`, candidates });
    }
  }
  // What wants what this card makes.
  for (const [tag, supports] of Object.entries(SUPPORTS)) {
    if (!supports(facts)) continue;
    const candidates = pick((f) => (f.consumes ?? []).includes(tag));
    if (candidates.length > 0) {
      partners.push({
        link: tag,
        because: `${facts.name} supplies what ${tag.replace(/_/g, " ")} cards want`,
        candidates,
      });
    }
  }

  return {
    card: {
      ...base,
      domains: (facts.domains ?? []) as readonly Domain[],
      ...(facts.text ? { text: facts.text } : {}),
      consumes: facts.consumes ?? [],
      produces: facts.produces ?? [],
    },
    legends,
    partners,
  };
}

export interface CounterCounsel {
  against: { cardId: string; name: string; domains: readonly Domain[]; championTag?: string; text?: string };
  /**
   * ⚠️ **Read at the level this was computed.** `theirPatterns` is derived from the Legend's
   * **domain identity**, not from its ability — so every Legend sharing those two domains
   * produces the same list. Four Body + Order Legends that ramp off Mighty, chain Empower,
   * grind XP and rebuy buffed units are indistinguishable here, and they are not the same
   * matchup. What a Legend *rewards* is in [`LEGEND-GUIDE.md`](../../../../docs/reference/LEGEND-GUIDE.md),
   * which covers all 49; the mouth is required to read it before speaking about a matchup.
   */
  scope: "domain-identity";
  /**
   * **The Legend's own engine** — what its ability asks the deck to supply, and how much of
   * that its identity can actually field.
   *
   * This is the half that used to be missing entirely, which made all four Body + Order
   * Legends return identical advice. `enablers` counts cards in *their* identity that feed
   * the trigger — a rough measure of how reliably the engine turns on, and the difference
   * between "deny the trigger" and "race it".
   *
   * ⚠️ **`enablers` is `null` unless `supply` is `"counted"`** — see `LegendCounsel.rewards`.
   * A Legend that triggers on `conquer` is not one with zero enablers.
   */
  theirEngine: Array<{ tag: string; enablers: number | null; supply: SupplyKind }>;
  /** What that identity **can** do — never what an opponent is likely to hold (§7). */
  theirPatterns: Array<{ pattern: StrategicPattern; label: string; cards: number }>;
  /** Doctrine: what answers those, why, and what you own that does it. */
  yourAnswers: Array<{
    threat: StrategicPattern;
    threatLabel: string;
    because: string;
    with: ByPattern[];
  }>;
  /**
   * The Legend the answers were filtered to be legal under, when one was named.
   *
   * ⚠️ **Absent means the answers are not a deck.** Unfiltered, they span all six domains and
   * no Legend can play them — a Legend carries exactly two. Worse, they can include the
   * opponent's own Signature cards: the top answer to Grand Duelist was `Riposte`, playable
   * only under a Fiora Legend (L21), which is the deck being countered.
   */
  playableUnder?: { cardId: string; name: string; domains: readonly Domain[] };
}

/**
 * *"I hate playing into this Legend — what deck works against it?"*
 *
 * ⚠️ **What they *can* do, never what they *will*.** There is no meta data in this project,
 * so this reads the whole legal pool of that Legend's identity. A claim about what an
 * opponent is likely to be playing would be an estimate wearing a fact's clothes (§7).
 */
export function counterCounsel(
  legendCardId: string,
  cards: CardIndex,
  pool: readonly PoolCard[],
  collection: Readonly<Record<string, number>> = {},
  depth = 5,
  /** Your own Legend, when you have chosen one — see `playableUnder`. */
  mineLegendCardId?: string,
): CounterCounsel | null {
  const legend = cards.factsOf?.(legendCardId);
  if (!legend) return null;
  const identity = (legend.domains ?? []) as readonly Domain[];
  const byName = ownedByName(pool, collection);
  const mineLegend = mineLegendCardId ? cards.factsOf?.(mineLegendCardId) : undefined;
  if (mineLegendCardId && !mineLegend) return null;

  const theirs = pool.filter(
    ({ facts }) => isMainDeckCard(facts) && facts.banned !== true && insideIdentity(facts, identity),
  );
  const theirCounts = new Map<StrategicPattern, Set<string>>();
  for (const { facts } of theirs) {
    for (const pattern of patternsOf(facts)) {
      theirCounts.set(pattern, (theirCounts.get(pattern) ?? new Set<string>()).add(facts.name));
    }
  }

  /**
   * Yours: everything you own — narrowed to what you could actually register, once you say
   * what you are playing.
   *
   * ⚠️ **Without `--mine` this is every domain at once.** That was deliberate ("you are
   * choosing your own Legend") and it produced advice no one can follow: 32 cards across all
   * six domains, of which 10 could share a deck. Naming your Legend applies the two checks
   * that actually bind — Domain Identity, and the Signature tag (L21) that made the
   * opponent's own signature spell the headline answer to their deck.
   */
  const mineIdentity = (mineLegend?.domains ?? []) as readonly Domain[];
  const registerableByMe = ({ facts }: PoolCard): boolean => {
    if (!mineLegend) return true;
    if (!insideIdentity(facts, mineIdentity)) return false;
    if (!(facts.superTypes ?? []).includes("signature")) return true;
    // L21 — a Signature card is legal only under the Legend whose champion tag it carries.
    return (facts.tags ?? []).includes(mineLegend.championTag ?? " ");
  };
  const mine = pool.filter(
    (entry) =>
      isMainDeckCard(entry.facts) &&
      entry.facts.banned !== true &&
      (byName.get(entry.facts.name) ?? 0) > 0 &&
      registerableByMe(entry),
  );

  const theirPatterns = PATTERNS.filter((s) => theirCounts.has(s.pattern))
    .map((s) => ({
      pattern: s.pattern,
      label: s.label,
      cards: (theirCounts.get(s.pattern) as Set<string>).size,
    }))
    .sort((a, b) => b.cards - a.cards);

  const yourAnswers = ANSWERS.filter((entry) => theirCounts.has(entry.threat)).map((entry) => {
    const wanted = new Set(entry.answers);
    const matching = mine.filter(({ facts }) => patternsOf(facts).some((p) => wanted.has(p)));
    return {
      threat: entry.threat,
      threatLabel: PATTERNS.find((s) => s.pattern === entry.threat)?.label ?? entry.threat,
      because: entry.because,
      with: groupByPattern(matching, collection, byName, depth).filter((g) => wanted.has(g.pattern)),
    };
  });

  return {
    against: {
      cardId: legendCardId,
      name: legend.name,
      domains: identity,
      ...(legend.championTag ? { championTag: legend.championTag } : {}),
      ...(legend.text ? { text: legend.text } : {}),
    },
    scope: "domain-identity",
    theirEngine: (legend.consumes ?? []).map((tag) => {
      const test = supplyOf(tag);
      return {
        tag,
        enablers: test ? theirs.filter(({ facts }) => test(facts)).length : null,
        supply: supplyKind(tag),
      };
    }),
    theirPatterns,
    yourAnswers,
    ...(mineLegend && mineLegendCardId
      ? {
          playableUnder: {
            cardId: mineLegendCardId,
            name: mineLegend.name,
            domains: mineIdentity,
          },
        }
      : {}),
  };
}

/**
 * *"I want a deck that plays around this mechanic."*
 *
 * Takes a `consumes` tag (`gear_matters`, `flow`, `token_matters`…), a `produces` tag, or a
 * pattern name, and returns both halves: what **engages** the mechanic and what **feeds** it.
 */
export function mechanicCounsel(
  mechanic: string,
  pool: readonly PoolCard[],
  collection: Readonly<Record<string, number>> = {},
  depth = 12,
) {
  const byName = ownedByName(pool, collection);
  const uniq = (list: Array<{ cardId: string; facts: CardFacts }>) =>
    list
      .map(({ cardId, facts }) => candidateOf(cardId, facts, collection, byName))
      .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)
      .sort((a, b) => b.owned - a.owned || (a.energy ?? 99) - (b.energy ?? 99))
      .slice(0, depth);

  const main = pool.filter(({ facts }) => isMainDeckCard(facts) && facts.banned !== true);
  const wants = uniq(main.filter(({ facts }) => (facts.consumes ?? []).includes(mechanic)));
  const supports = SUPPORTS[mechanic];
  const feeds = uniq(
    main.filter(
      ({ facts }) =>
        (supports ? supports(facts) : false) ||
        (facts.produces ?? []).includes(mechanic) ||
        patternsOf(facts).includes(mechanic as StrategicPattern),
    ),
  );

  return {
    mechanic,
    known: wants.length > 0 || feeds.length > 0,
    /**
     * ⚠️ **How to read `feeds`, in the same three states the rest of the graph uses.**
     *
     * - `counted` — the list is a measurement; empty means empty.
     * - `self-satisfying` — the mechanic needs a board and a normal turn (`conquer`, `hold`),
     *   not a partner card. An empty `feeds` is correct and means *"nothing to build for"*.
     * - `unmodelled` — never measured. An empty `feeds` means nothing at all.
     *
     * Only the first licenses the sentence *"nothing in your collection supplies it"*.
     */
    feedsSupply: supplyKind(mechanic),
    /** Cards that pay off the mechanic. */
    wants,
    /** Cards that supply it. */
    feeds,
  };
}
