import type { CardFacts, CardIndex, Deck } from "../types.js";
import { countedEntries } from "../legality/entries.js";
import { supplyKind, supplyOf } from "./synergy.js";

/**
 * **Packages** — what each card in a deck is *for*.
 *
 * `GENERATOR §3`, [D-064](../../../../docs/DECISIONS.md). This is the layer the first build of
 * `S5` had no concept of, and its absence is why a deck came back as nineteen of forty cards
 * at cost 2: with no bucket to be short of, nothing was short.
 *
 * All three deckbuilding transcripts arrive at packages independently
 * ([`reference/transcripts/`](../../../../docs/reference/transcripts/)), which is better
 * evidence than any one of them. The clearest statement is `03`'s: *"play style refers to the
 * overall game plan and victory condition, while packages refer to the collection of cards
 * being brought in to support your intended play style."*
 *
 * ⚠️ **This module decides nothing about quality.** It answers *"what is this card for"* and
 * nothing else. Whether a count is right for a deck is the plan's business, and whether the
 * plan is any good is the builder's — [D-016](../../../../docs/DECISIONS.md#d-016) still
 * forbids anything compositing into a score.
 */

/** The default set. ⚠️ `03` says split into "as many packages as we need" — this is not a law. */
export type Package = "engine" | "interaction" | "closers" | "scoring" | "coreUnits";

/**
 * Where a card landed.
 *
 * ⚠️ **`unassigned` and `unmodelled` are different answers and must never be merged.**
 * `unassigned` means *"classified, and it serves none of the named packages"* — a real finding,
 * and often the interesting one. `unmodelled` means *"nothing was ever measured about this
 * card"*, which licenses no finding at all.
 *
 * This distinction is the one `feedsMeasured` exists to enforce elsewhere, learned when
 * `mechanic --name mighty` answered `feeds: 0` against a collection holding sixty cards that
 * raise Might. A zero that means "not measured" is the most dangerous number this project can
 * emit, because it reads as a finding.
 */
export type Slot = Package | "unassigned" | "unmodelled";

export interface Assigned {
  cardId: string;
  name: string;
  quantity: number;
  slot: Slot;
  /** ⚠️ Why this card is here, per card. An unexplainable bucket is an unarguable one. */
  because: string;
}

export type PackageCounts = Record<Slot, number>;

export interface PackageRules {
  /**
   * Energy at or above which a card is a **closer**, whatever else it does.
   *
   * `03`'s heuristic: *"we can take any spell with four or less energy cost as part of our
   * core interaction package… and everything else in closer"*. So the default is 5.
   *
   * ⚠️ Cost is checked **before** purpose, because cost is the hard constraint. A ten-energy
   * card that also feeds the engine still cannot be played on turn three, and pretending
   * otherwise is how a deck ends up unable to act — which is exactly what the mulligan
   * measurement is for.
   */
  closerFrom: number;
  /**
   * What this deck's Legend rewards — its `consumes` tags. A card supplying one of these is
   * `engine`.
   *
   * ⚠️ **Deck-relative, not a property of the card.** The same card is engine in one deck and
   * an unassigned body in another, which is the entire point: "engine" is a job, not a type.
   */
  rewards: readonly string[];
}

/**
 * Roles that are interaction *and nothing else*.
 *
 * ⚠️ **`body+removal` is deliberately absent.** A unit that also removes is a body first — it
 * holds a battlefield, which a spell cannot do — and counting it as interaction would let a
 * deck of fifty-five such units report itself as richly interactive with no answers it can
 * cast on the opponent's turn. `review()` counts removal as a **capability**, cross-cutting
 * and separate; that is the number to read for "can this deck kill things".
 */
const INTERACTION_ROLES: ReadonlySet<string> = new Set([
  "removal-kill",
  "removal-damage",
  "combat-trick",
  "counter",
]);

/**
 * **How this deck turns a board into points.**
 *
 * ⚠️ **Added because a deck passed every other check with no route to winning.** An Ambessa
 * build came back with all four original packages inside their targets and **zero** cards that
 * score, gain XP, or win outright — fifteen of its sixteen names were Might-and-combat
 * manipulation. It was excellent at winning fights and had no idea how to win a game.
 * `engine`, `interaction`, `closers` and `coreUnits` are all about the **board**; Riftbound is
 * won at eight points, and nothing was asking where those came from.
 *
 * Matches two things, both read from printed text:
 *
 * - **Points directly** — *"you score 1 point"*, *"you win the game"*.
 * - **Being paid for the act that scores** — `[Hunt]`, and *"when I conquer / when you hold"*
 *   triggers. A card that rewards taking and keeping a battlefield is a card that makes the
 *   winning move worth making.
 */
const SCORES =
  /\bscore \d+ point|\bwin the game\b|\[Hunt|\bwhen (?:i|you) (?:conquer|hold)\b/i;

/** Nothing was ever classified about this card, so no bucket can be argued from it. */
const nothingKnown = (f: CardFacts): boolean =>
  !f.role && !f.produces?.length && !f.consumes?.length;

/**
 * Which reward tags this card actually supplies, and which could not be checked.
 *
 * ⚠️ Goes through the shared synergy graph rather than matching tag names against `produces`.
 * That fallback used to exist and could not match: no card *produces* `unit_played`, so
 * seventeen of twenty tags resolved to zero however good the deck was.
 */
function feeds(facts: CardFacts, rewards: readonly string[]): { tag: string; measured: boolean }[] {
  return rewards.map((tag) => {
    const kind = supplyKind(tag);
    if (kind !== "counted") return { tag, measured: false };
    const test = supplyOf(tag);
    return { tag, measured: Boolean(test?.(facts)) };
  });
}

/**
 * Put one card in one package.
 *
 * **The precedence, and why it is this order.** Every step is justified by what it reads:
 *
 * 1. **`closers`** — energy at or above `closerFrom`. A *printed fact*, needing no
 *    classification, and a hard constraint no synergy overrides.
 * 2. **`interaction`** — a pure interaction role. Above `engine` on purpose: a removal spell
 *    that happens to feed the Legend is still the deck's answer to a threat, and letting
 *    `engine` claim it would report `interaction: 0` for a deck full of removal — an alarm
 *    that is both false and alarming.
 * 3. **`scoring`** — it makes points, or pays you for taking and holding. **Above `engine`
 *    deliberately**: the failure this package was added to catch is a deck whose route to
 *    points was swallowed by the Legend's reward tag, and putting it after `engine` would
 *    let exactly that happen again.
 * 4. **`engine`** — supplies something the Legend rewards. Deck-relative.
 * 5. **`coreUnits`** — it is a unit. A body holds battlefields whatever else it does, and
 *    `types` is printed, so this needs no classification either.
 * 6. **`unmodelled`** — nothing was classified and it is not a unit. Say so.
 * 7. **`unassigned`** — classified, and it serves none of the above. A real finding.
 */
export function assign(facts: CardFacts, rules: PackageRules): { slot: Slot; because: string } {
  const energy = facts.energy ?? null;

  if (energy !== null && energy >= rules.closerFrom) {
    return { slot: "closers", because: `${energy} energy — too expensive for turn-to-turn use` };
  }

  if (facts.role && INTERACTION_ROLES.has(facts.role)) {
    return { slot: "interaction", because: `${facts.role}` };
  }

  // ⚠️ **Before `engine`, deliberately.** The failure this package exists to catch is a deck
  // whose route to points was absorbed by the Legend's reward tag — which is exactly what the
  // reward tag's gravity does. Counting the route to points FIRST means it can never be
  // hidden inside the engine count.
  if (SCORES.test(facts.text ?? "")) {
    return { slot: "scoring", because: "pays you for taking or holding a battlefield, or makes points outright" };
  }

  const supplied = feeds(facts, rules.rewards).filter((f) => f.measured);
  if (supplied.length > 0) {
    return { slot: "engine", because: `supplies ${supplied.map((s) => s.tag).join(", ")}` };
  }

  if (facts.types?.includes("unit")) {
    return { slot: "coreUnits", because: "a body, and bodies hold battlefields" };
  }

  if (nothingKnown(facts)) {
    return { slot: "unmodelled", because: "no classification — nothing measured about this card" };
  }

  return {
    slot: "unassigned",
    because: `${facts.role ?? "no role"} — serves none of this deck's packages`,
  };
}

export interface PackageRead {
  counts: PackageCounts;
  cards: Assigned[];
  /**
   * ⚠️ Reward tags the synergy graph cannot check. When this is non-empty, `engine` is a
   * **floor rather than a count** — say so, and never report it as if it were complete.
   */
  unmeasurableRewards: string[];
}

const EMPTY: PackageCounts = {
  engine: 0,
  interaction: 0,
  closers: 0,
  scoring: 0,
  coreUnits: 0,
  unassigned: 0,
  unmodelled: 0,
};

/**
 * Read a deck's Main Deck into packages.
 *
 * The Chosen Champion is included, because L3 counts it inside the forty and a plan that
 * ignored it would be measuring thirty-nine.
 */
export function readPackages(deck: Deck, cards: CardIndex, rules: PackageRules): PackageRead {
  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");
  const counts: PackageCounts = { ...EMPTY };
  const assigned: Assigned[] = [];

  for (const entry of main) {
    const facts = entry.facts;
    if (!facts) {
      counts.unmodelled += entry.quantity;
      assigned.push({
        cardId: entry.cardId,
        name: entry.cardId,
        quantity: entry.quantity,
        slot: "unmodelled",
        because: "not a card this index knows",
      });
      continue;
    }
    const { slot, because } = assign(facts, rules);
    counts[slot] += entry.quantity;
    assigned.push({ cardId: entry.cardId, name: facts.name, quantity: entry.quantity, slot, because });
  }

  return {
    counts,
    cards: assigned,
    unmeasurableRewards: rules.rewards.filter((tag) => supplyKind(tag) !== "counted"),
  };
}

/**
 * What a Legend rewards — the tags a deck built for it should supply.
 *
 * ⚠️ **All 49 Legends carry these now**, and the reason they once did not is worth keeping:
 * the classification pass covered the 814 *main-deck* cards, and a Legend is not in the 40.
 * A scoping gap was mistaken for a limit, and `legendCounsel` said the reward "could not be
 * computed" for a year's worth of sessions.
 */
export const rewardsOf = (legendCardId: string, cards: CardIndex): readonly string[] =>
  cards.factsOf?.(legendCardId)?.consumes ?? [];
