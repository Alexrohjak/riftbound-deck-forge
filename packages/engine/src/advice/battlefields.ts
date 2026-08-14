import type { CardFacts, CardIndex, Deck } from "../types.js";
import { deckEntries } from "../legality/entries.js";

/**
 * **Battlefields** — the only card you bring that your opponent also gets to use.
 *
 * `GENERATOR §7`, resolving `G4`. You register 3 and present 1, and **both players'
 * battlefields are on the board** (CR 485.4, TR 402.1). Riot's own primer says to pick partly
 * by *"which would harm you in an opponent's hands"*.
 *
 * ⚠️ **A class, not a score.** Which is why this fits
 * [D-016](../../../../docs/DECISIONS.md#d-016): the classification says *who the text pays*,
 * which is read off the card, and the judgement stays with the builder.
 */

/**
 * ⚠️ **`oneSided` describes SCOPE, not VALENCE.**
 *
 * It means the text's *"you"* is the controller — nobody else can benefit from it. It does
 * **not** mean the effect is good for you. `Vaults of Helia` reads *"When you hold here, your
 * non-token units cost 1 more to play this turn"*: one-sided, and a drawback. Treating this
 * class as automatically safe would recreate the exact mistake it exists to prevent, on a
 * smaller number of cards.
 */
export type BattlefieldClass = "oneSided" | "symmetric" | "restriction" | "unclear";

/**
 * What has to happen for the ability to pay out.
 *
 * ⚠️ **Only 1 of your 3 is used per game** (you choose in bo3, random in bo1), so the guide's
 * instruction is to *"register 3 different answers, not 3 copies of a plan"*. Three
 * battlefields that all trigger on `hold` only pay you when you are already ahead, which is
 * a checkable property rather than a matter of taste.
 */
export type Trigger = "hold" | "conquer" | "defend" | "passive" | "unclear";

export interface BattlefieldRead {
  cardId: string;
  name: string;
  class: BattlefieldClass;
  trigger: Trigger;
  /** ⚠️ Per card, so a classification can be argued with rather than trusted. */
  because: string;
}

/** A prohibition or a tax. */
const RESTRICTION = /\bcan't\b|\bcannot\b|\bignore\b|increase the points needed|cost[^.]*\bmore\b/i;

/**
 * **Naming another player is the strongest signal there is**, and it outranks a `you` trigger.
 *
 * ⚠️ `The Papertree` reads *"When **you** hold here, **each player** channels 1 rune
 * exhausted"* — you pull the lever and both sides are paid. Reading only the trigger would
 * file that as one-sided, which is the precise error this class exists to prevent.
 */
const NAMES_ANOTHER_PLAYER = /\beach player\b|\ba player\b|\bplayers\b|\bany player\b|\bits controller\b|\bthat player\b|\bthe attacker\b|\bthey\b/i;

/** The text scopes its effect to the controller. */
const SELF_SCOPED = /\bwhen you\b|\bwhile you control\b|\byou may\b|\byour\b|\byou control\b/i;

/**
 * Units in general, with nobody's name on them — weaker evidence than naming a player, and
 * checked **after** self-scoping so *"when you hold here, … units here"* stays one-sided.
 *
 * ⚠️ **`friendly` is deliberately not a self-scoping word.** It was, and it put
 * `Forbidding Waste` and `The Dreaming Tree` in the one-sided class — both symmetric, and one
 * of them the guide's own flagship example. *"No other **friendly** units here"* sits inside
 * reminder text and is relative to whoever is reading it, not to you.
 */
const GENERIC_UNITS = /\bunits here\b|\ba unit\b|\bunits? can\b/i;

const TRIGGERS: [Trigger, RegExp][] = [
  ["hold", /when you hold here/i],
  ["conquer", /when you (conquer|score) here/i],
  ["defend", /when you defend here/i],
];

/** Read one battlefield's text. */
export function classify(facts: CardFacts): { class: BattlefieldClass; trigger: Trigger; because: string } {
  const text = facts.text ?? "";
  if (!text.trim()) {
    return { class: "unclear", trigger: "unclear", because: "no rules text to read" };
  }

  let trigger: Trigger = "passive";
  for (const [name, pattern] of TRIGGERS) {
    if (pattern.test(text)) {
      trigger = name;
      break;
    }
  }

  const namesOther = NAMES_ANOTHER_PLAYER.test(text);
  const selfScoped = SELF_SCOPED.test(text);

  // Naming another player beats everything: the effect reaches both sides whatever pulls it.
  if (namesOther) {
    if (RESTRICTION.test(text)) {
      return { class: "restriction", trigger, because: "constrains or taxes both players — name whose plan it taxes" };
    }
    return {
      class: "symmetric",
      trigger,
      because: "names another player, so the payout reaches both sides — register it only if this deck exploits it harder",
    };
  }

  // ⚠️ A tax the card puts on **you** is not a restriction on the board — `Vaults of Helia`
  // reads "when you hold here, YOUR non-token units cost 1 more". It is one-sided and a
  // drawback, and filing it as a restriction would imply it taxes the opponent.
  if (RESTRICTION.test(text) && !selfScoped) {
    return { class: "restriction", trigger, because: "constrains play here for whoever is at it — name whose plan it taxes" };
  }

  if (selfScoped) {
    return {
      class: "oneSided",
      trigger,
      because: "the text pays its controller and nobody else — ⚠️ scope, not valence: check it is a benefit",
    };
  }
  if (GENERIC_UNITS.test(text)) {
    return {
      class: "symmetric",
      trigger,
      because: "speaks about units in general, so it helps whoever exploits it harder",
    };
  }
  // ⚠️ Never guessed. An unreadable text is reported as unread.
  return { class: "unclear", trigger, because: "the text matches no pattern this module knows" };
}

export interface BattlefieldReview {
  registered: BattlefieldRead[];
  /**
   * ⚠️ Symmetric battlefields with no stated reason.
   *
   * `GENERATOR §7`'s floor, and Alexander's rule: *"there may not be amazing battlefields for
   * every deck — then EE should consider ones the deck may not benefit massively from, but
   * most certainly won't be hurt by."* A one-sided card meets that floor by its class. A
   * symmetric one has to earn it, and **silence is a refusal rather than a default.**
   */
  unjustified: BattlefieldRead[];
  /** True when the three registered do not all pay out on the same trigger. */
  varied: boolean;
  /** The single trigger they all share, when they do. */
  sharedTrigger?: Trigger;
}

/**
 * Read a deck's registered battlefields.
 *
 * `justified` is the set of card ids the plan gives a stated reason for — `plan.battlefields`.
 * A reason is free text on purpose: the engine checks that one **exists**, never whether it
 * is any good, which is not a judgement it can make.
 */
export function reviewBattlefields(
  deck: Deck,
  cards: CardIndex,
  justified: ReadonlySet<string> = new Set(),
): BattlefieldReview {
  const registered: BattlefieldRead[] = [];
  // ⚠️ `deckEntries`, not `countedEntries` — the latter keeps only MAIN and SIDEBOARD,
  // because it exists to count copies against the 3-limit. Battlefields never reached it,
  // and this returned an empty review for every deck ever built.
  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "BATTLEFIELD" || !entry.facts) continue;
    const read = classify(entry.facts);
    registered.push({ cardId: entry.cardId, name: entry.facts.name, ...read });
  }

  const unjustified = registered.filter(
    (b) => b.class === "symmetric" && !justified.has(b.cardId),
  );

  const triggers = new Set(registered.map((b) => b.trigger));
  const varied = registered.length < 2 || triggers.size > 1;

  return {
    registered,
    unjustified,
    varied,
    ...(varied ? {} : { sharedTrigger: [...triggers][0] as Trigger }),
  };
}
