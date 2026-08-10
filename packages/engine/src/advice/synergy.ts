import type { CardFacts } from "../types.js";
import { hasKeyword } from "../text.js";

/**
 * **The synergy graph — one definition, every consumer.**
 *
 * A `consumes` tag says a card wants something. This module is the only place that answers
 * *"and what supplies it?"*. It exists because there were two answers, and they disagreed:
 * `counsel.ts` carried a `SUPPORTS` map covering 13 tags, `doctrine.ts` carried a
 * `SATISFIED_BY` map covering 3 and fell back to matching the tag name against `produces`.
 * That fallback can never match — no card produces `unit_played` — so a deck of twenty units
 * was told *"6 cards care about unit_played, and only 0 supply it"* at `confidence: "fact"`.
 *
 * ⚠️ **A tag with no resolver is unmeasured, never unsupplied.** The two are opposites and
 * only one of them is safe to say out loud. Everything here is built so that the absence of
 * an answer reads as silence rather than as a zero — the same rule the briefing puts on the
 * mouth ([EE-BRIEFING §3](../../../../docs/EE-BRIEFING.md)), applied to the engine that feeds it.
 */

/**
 * What supplies a `consumes` tag, where the pairing is a real payoff/enabler relationship
 * that a deck can get wrong.
 */
export const SUPPORTS: Record<string, (facts: CardFacts) => boolean> = {
  token_matters: (f) => (f.produces ?? []).includes("token"),
  trash_matters: (f) => (f.produces ?? []).some((p) => ["trashplay", "discard", "banish"].includes(p)),
  gear_matters: (f) => (f.types ?? []).includes("gear"),
  empowered: (f) => (f.produces ?? []).includes("empower"),
  discard_matters: (f) => (f.produces ?? []).includes("discard"),
  xp_spend: (f) => (f.produces ?? []).includes("xp"),
  buff_spend: (f) => (f.produces ?? []).includes("buff"),
  hidden: (f) => hasKeyword(f.text, "Hidden"),
  flow: (f) => (f.produces ?? []).includes("trashplay"),
  move_trigger: (f) => (f.produces ?? []).includes("move"),
  death: (f) => (f.produces ?? []).some((p) => ["kill", "damage"].includes(p)),
  spell_played: (f) => (f.types ?? []).includes("spell"),
  unit_played: (f) => (f.types ?? []).includes("unit"),
  /**
   * A unit is Mighty at 5+ Might, so **being** Mighty is fed both by raising Might and by
   * arriving there. Added because `mechanic --name mighty` answered `feeds: 0` against a
   * collection holding sixty cards that raise Might.
   */
  mighty: (f) => (f.produces ?? []).includes("pump") || (f.might ?? 0) >= 5,
  /**
   * ⚠️ **The two Mighty triggers are not the same tag, and conflating them would invert the
   * deck.** `Grand Duelist` fires when a unit *becomes* Mighty — CR 709, so a printed
   * 5-Might unit arrives there and never triggers it. `Relentless Storm` fires when you
   * *play* a printed Mighty unit, and a pump does nothing for it. Same stat, opposite
   * shopping lists; LEGEND-GUIDE.md calls it out explicitly.
   */
  becomes_mighty: (f) => (f.produces ?? []).includes("pump"),
  plays_mighty: (f) => (f.might ?? 0) >= 5,
  /** `[Level N]` reads a running XP total, so XP is what feeds it. */
  level: (f) => (f.produces ?? []).includes("xp"),
  temporary: (f) => (f.produces ?? []).includes("temporary"),
  stun: (f) => (f.produces ?? []).includes("stun"),
  banish: (f) => (f.produces ?? []).includes("banish"),
  /** Emptying your hand is what discard outlets and cheap cards do. */
  empty_hand: (f) => (f.produces ?? []).includes("discard") || (f.energy ?? 99) <= 1,
  /** Payoffs that read a high Energy cost need cards that actually cost that much. */
  expensive: (f) => (f.energy ?? 0) >= 5,
  mech: (f) => (f.tags ?? []).includes("Mech"),
  recycle: (f) => /recycle/i.test(f.text ?? ""),
};

/**
 * Tags whose trigger needs a board and a normal turn rather than a partner card.
 *
 * *"When I attack…"* is not a payoff waiting on an enabler — it is a self-contained ability,
 * and counting supply for it is a category error rather than a missing entry. They are named
 * here so that "no resolver" keeps meaning "we do not know", which is the case that has to
 * stay silent.
 */
export const SELF_SATISFYING: ReadonlySet<string> = new Set([
  "attack",
  "conquer",
  "hold",
  "defend",
  /** `[Legion]` asks only that you played another card this turn — any second card serves. */
  "legion",
  /** Winning a combat needs a board and a fight, not a particular partner card. */
  "combat_win",
  /** "When you choose a friendly unit" — any spell or ability that targets your own side. */
  "choose_friendly",
]);

/** Every tag this module can speak about, in either sense. */
export const isModelled = (tag: string): boolean => tag in SUPPORTS || SELF_SATISFYING.has(tag);

/**
 * **How a tag's supply may be reported — three states, because two is not enough.**
 *
 * A count of `0` is only meaningful for `counted`. For the other two it is an artefact of
 * asking a question the graph does not answer, and printing it next to a real count is how a
 * "nothing enables this" appears where the truth is "this needs a board, not a card". Callers
 * must emit `null` for anything that is not `counted`.
 */
export type SupplyKind = "counted" | "self-satisfying" | "unmodelled";

export const supplyKind = (tag: string): SupplyKind =>
  tag in SUPPORTS ? "counted" : SELF_SATISFYING.has(tag) ? "self-satisfying" : "unmodelled";

/**
 * The predicate that decides whether a card supplies `tag`, or `undefined` when the graph
 * has nothing to say.
 *
 * ⚠️ **Callers must branch on `undefined` rather than treating it as a predicate that always
 * returns false.** That collapse is the bug this module was extracted to kill.
 */
export const supplyOf = (tag: string): ((facts: CardFacts) => boolean) | undefined =>
  SUPPORTS[tag];
