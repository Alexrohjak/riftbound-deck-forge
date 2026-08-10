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
   * A unit is Mighty at 5+ Might, so it is fed by anything that raises Might and by anything
   * that already arrives there. Added because `mechanic --name mighty` answered `feeds: 0`
   * against a collection holding sixty cards that raise Might.
   */
  mighty: (f) => (f.produces ?? []).includes("pump") || (f.might ?? 0) >= 5,
  /** `[Level N]` reads a running XP total, so XP is what feeds it. */
  level: (f) => (f.produces ?? []).includes("xp"),
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
]);

/** Every tag this module can speak about, in either sense. */
export const isModelled = (tag: string): boolean => tag in SUPPORTS || SELF_SATISFYING.has(tag);

/**
 * The predicate that decides whether a card supplies `tag`, or `undefined` when the graph
 * has nothing to say.
 *
 * ⚠️ **Callers must branch on `undefined` rather than treating it as a predicate that always
 * returns false.** That collapse is the bug this module was extracted to kill.
 */
export const supplyOf = (tag: string): ((facts: CardFacts) => boolean) | undefined =>
  SUPPORTS[tag];
