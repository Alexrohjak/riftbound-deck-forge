/**
 * `@forge/engine` — the rules, as a pure library.
 *
 * **Two consumers, one implementation** (D-047): `apps/web` imports this for live
 * on-screen legality, and `apps/cli` imports it so Claude Code can ask headlessly.
 * Implementing the checks twice would mean two bodies for `W1`, the component
 * everything downstream trusts.
 *
 * ⚠️ **Nothing in this package may touch I/O** — no `fetch`, no `node:*`, no DOM.
 * A single such import breaks one of the two consumers, and it will be the one nobody
 * ran. `scripts/check-engine-purity.mjs` enforces this in CI.
 */
export * from "./types.js";
export * from "./legality/index.js";

/** Statistics. Tier 1 only so far — facts about the list, with no assumptions in them. */
export { energyCurve, type EnergyCurve } from "./stats/energyCurve.js";
export {
  atLeast,
  championAccess,
  playableOptions,
  runeFeasibility,
  simulateOpenings,
  simulateMulligans,
  OPENING_HAND,
  OPENING_HORIZON,
  RUNES_PER_TURN,
  TURNS,
  type Mulligans,
  type Access,
  type FeasibilityRow,
  type Flexibility,
  type Openings,
  type RuneFeasibility,
} from "./stats/probabilities.js";
export {
  deckFacts,
  COUNTED_KEYWORDS,
  type DeckFacts,
  type MightSpread,
  type Tally,
  type TypeSplit,
} from "./stats/facts.js";

/**
 * EE's analytical surface — what a deck *is*, and what good players would say about it.
 * Every judgement carries its source and confidence; nothing composites into a score.
 */
export {
  deckShape,
  atLeastOne,
  CARDS_SEEN_BY_TURN_ONE,
  MAIN_DECK_SIZE,
  type DeckShape,
} from "./advice/shape.js";
export {
  review,
  capabilities,
  COMMUNITY,
  OFFICIAL,
  type Capabilities,
  type Confidence,
  type Note,
  type Source,
} from "./advice/doctrine.js";

export {
  diagnose,
  match,
  suggest,
  symptomReading,
  SYMPTOMS,
  type Candidate,
  type Diagnosis,
  type PoolCard,
  type Symptom,
} from "./advice/feedback.js";
export { readArchetype, type Archetype, type ArchetypeRead } from "./advice/archetype.js";
export {
  classify,
  reviewBattlefields,
  type BattlefieldClass,
  type BattlefieldRead,
  type BattlefieldReview,
  type Trigger,
} from "./advice/battlefields.js";
export {
  planFromSkeleton,
  reviewAgainstPlan,
  type CurveRead,
  type PackageDelta,
  type Plan,
  type PlanReview,
  type Reference,
  type SlotIntent,
} from "./advice/plan.js";
/**
 * ⚠️ **The printed text, as data.** `MECHANICS` is the single source of truth for what a
 * card's own words say — `scripts/audit-knowledge.mjs` imports this table rather than keeping
 * a second copy, because two copies of a mapping is the drift D-047 exists to prevent.
 */
export {
  MECHANICS,
  hasMechanic,
  levelThresholds,
  mechanicRule,
  mechanicsOf,
  xpGranted,
  xpSpent,
  type MechanicHit,
  type MechanicKind,
  type MechanicRule,
} from "./mechanics.js";
export {
  readMechanics,
  type MechanicCard,
  type MechanicFinding,
} from "./advice/mechanics.js";
/**
 * The three deckbuilding questions `EVALUATION §6` specifies and nothing answered — Q-CARD,
 * Q-THREAT and Q-SIDEBOARD. None needs the rules core; all three refuse combat explicitly.
 */
export { cardCounsel, type CardCounsel, type CombatProfile } from "./advice/card.js";
export { readThreats, type Threat, type ThreatClass, type ThreatRead } from "./advice/threats.js";
export {
  sideboardCounsel,
  SIDEBOARD_SIZE,
  type SideboardCandidate,
  type SideboardCounsel,
  type SideboardCut,
  type SideboardLine,
  type SideboardReason,
} from "./advice/sideboard.js";
export {
  SKELETONS,
  feasibilities,
  feasibility,
  skeletonById,
  type Feasibility,
  type Objective,
  type Pace,
  type PackageSupply,
  type PoolSupply,
  type Skeleton,
  type Target,
} from "./advice/skeleton.js";
export {
  assign,
  readPackages,
  rewardsOf,
  type Assigned,
  type Package,
  type PackageCounts,
  type PackageRead,
  type PackageRules,
  type Slot,
} from "./advice/packages.js";
export {
  patternCensus,
  patternsOf,
  PATTERNS,
  type PatternCount,
  type PatternSpec,
  type StrategicPattern,
} from "./advice/patterns.js";
export { hasKeyword, leadingKeywords, withoutReminders } from "./text.js";
export {
  aroundCounsel,
  counterCounsel,
  legendCounsel,
  mechanicCounsel,
  ANSWERS,
  type AroundCounsel,
  type ByPattern,
  type CardOption,
  type CounterCounsel,
  type LegendCounsel,
} from "./advice/counsel.js";

/** In-memory `CardIndex`, sufficient for tests and for the static `F2` pool. */
export { staticCardIndex, cardFactsFrom, type CardEntry } from "./cardIndex.js";

/**
 * The log — what you actually played, and what the record is allowed to claim about it.
 * The thresholds are the feature: a win rate from four games describes the dice.
 */
export {
  read,
  validate,
  MIN_FOR_MATCHUP,
  MIN_FOR_RATE,
  MIN_LOSSES_FOR_PATTERN,
  type LogReading,
  type MatchRecord,
  type MatchResult,
  type Matchup,
  type Pattern,
  type Standing,
} from "./log/match.js";
export { canonicalise, deckHash } from "./log/deckHash.js";

/**
 * `S5` — deck generation. The engine assembles the constraints and refuses a bad answer;
 * choosing the cards is the caller's job, whichever mouth it is using (D-043).
 */
export {
  buildBrief,
  toDeck,
  type Brief,
  type BriefCard,
  type Proposal,
  type Seed,
  type Targets,
} from "./generate/brief.js";
export { validateProposal, type Repair, type Verdict } from "./generate/validate.js";

/**
 * What to bring in the box beside the deck. Tokens are never registered, so the decklist
 * is complete while the pile is not — and only the pile loses you a game.
 */
export {
  deckTokens,
  creationsIn,
  BRING_CAP,
  type DeckTokens,
  type MarkerNeed,
  type TokenNeed,
  type TokenSource,
} from "./advice/tokens.js";
