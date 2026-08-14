import type { CardIndex, Deck } from "../types.js";
import type { Note } from "./doctrine.js";
import type { Package } from "./packages.js";
import { readPackages, rewardsOf } from "./packages.js";
import type { Objective, Pace, Skeleton, Target } from "./skeleton.js";
import { deckShape } from "./shape.js";

/**
 * **The plan** — what a deck is built to do, and reading a deck against it.
 *
 * `GENERATOR §2` and `§6`, [D-064](../../../../docs/DECISIONS.md#d-064).
 *
 * ⚠️ **A plan is made from what the builder said, not from a menu.** EE's entry point is a
 * sentence — *"a deck for this Legend with this card in it"*, *"I keep losing to this deck,
 * help me beat it"*, *"use this card, good at holding battlefields"* — and in two of those
 * three the intent is already stated. `Plan` is therefore the primary type and
 * [`Skeleton`](./skeleton.ts) is **one way to build one**, offered only when the builder did
 * not say ([`GENERATOR §5.1`](../../../../docs/spec/GENERATOR.md)).
 *
 * Turning that conversation into a wizard would be the same mistake in a new costume: the
 * objective comes from the builder ([D-041](../../../../docs/DECISIONS.md#d-041)), and being
 * asked four questions to restate what you already said is not a conversation.
 *
 * ⚠️ **Nothing here composites into a score** ([D-016](../../../../docs/DECISIONS.md#d-016)).
 * The counts are facts, the targets are doctrine, and the gap between them is a sentence with
 * an attribution — never a grade.
 */

/** Why a battlefield or a sideboard card earned its slot. Free text: a reason, not a code. */
export interface SlotIntent {
  cardId: string;
  because: string;
}

export interface Plan {
  /** How this deck ends the game. `GENERATOR §8` defines the sideboard against it. */
  winCondition: string;
  pace: Pace;
  objective: Objective;
  /**
   * Where this plan came from — a skeleton id, or `stated` when the builder said it in
   * words.
   *
   * ⚠️ Carried so a later reader can tell *"he asked for this"* from *"he picked it off a
   * list"*, which are different kinds of claim on the deck.
   */
  origin: string;
  packages: Partial<Record<Package, Target>>;
  closerFrom: number;
  spice: number;
  battlefields?: SlotIntent[];
  sideboard?: SlotIntent[];
}

/** Build a plan from a skeleton the builder chose off the menu. */
export const planFromSkeleton = (skeleton: Skeleton, winCondition = skeleton.winCondition): Plan => ({
  winCondition,
  pace: skeleton.pace,
  objective: skeleton.objective,
  origin: skeleton.id,
  packages: skeleton.packages,
  closerFrom: skeleton.closerFrom,
  spice: skeleton.spice,
});

export interface PackageDelta {
  package: Package;
  /** Counted from the list. A fact. */
  actual: number;
  /** Doctrine, with its attribution attached. */
  target: Target;
  /** ⚠️ Signed distance from the **range**: `0` inside it, negative below, positive above. */
  delta: number;
  within: boolean;
}

export interface CurveRead {
  /** Energy histogram, dense from 0. Cards with no cost are excluded, never folded into 0. */
  curve: number[];
  /**
   * The biggest single bucket, and its share of the Main Deck.
   *
   * ⚠️ **A fact, and the check that did not exist.** `review()` tested for zero removal, zero
   * draw, zero tricks and a low unit share — and a deck of nineteen two-drops in forty passed
   * every one of them.
   */
  largestBucket: { energy: number; count: number; share: number };
  /** Costs with no cards at all, **below** the deck's own top end. A fact, not a judgement. */
  holes: number[];
}

export interface PlanReview {
  plan: Plan;
  packages: PackageDelta[];
  curve: CurveRead;
  /** ⚠️ Empty when the deck matches its plan. Silence is a valid and common answer. */
  notes: Note[];
  /**
   * ⚠️ Reward tags the synergy graph cannot check. Non-empty means `engine` is a **floor**,
   * and any note about it must say so.
   */
  unmeasurableRewards: string[];
}

/** Distance from a range rather than from a point — the targets are ranges for a reason. */
function distance(actual: number, target: Target): number {
  if (actual < target.min) return actual - target.min;
  if (target.max !== undefined && actual > target.max) return actual - target.max;
  return 0;
}

const band = (t: Target) => (t.max === undefined ? `${t.min}+` : `${t.min}–${t.max}`);

/** The histogram's own top end — the highest cost that actually has a card in it. */
function topEnd(curve: number[]): number {
  for (let i = curve.length - 1; i >= 0; i--) if ((curve[i] ?? 0) > 0) return i;
  return 0;
}

function readCurve(curve: number[], size: number): CurveRead {
  let largest = { energy: 0, count: 0, share: 0 };
  for (let energy = 0; energy < curve.length; energy++) {
    const count = curve[energy] ?? 0;
    if (count > largest.count) {
      largest = { energy, count, share: size > 0 ? count / size : 0 };
    }
  }
  const top = topEnd(curve);
  const holes: number[] = [];
  // ⚠️ Only *inside* the deck's own range. A deck that tops out at 4 has no hole at 5 — it
  // has a decision, and reporting it as a gap would invent a top end nobody chose.
  //
  // ⚠️ **And from 2, not from 1.** Every source treats the two-drop as the first real play —
  // *"the best number of playable two drops on your first turn is 7, 8 or 9"* — and most decks
  // run no 1-cost cards at all. Scanning from 1 reported a hole at 1 on almost every deck,
  // which is a permanent false positive rather than a finding.
  for (let energy = 2; energy < top; energy++) if ((curve[energy] ?? 0) === 0) holes.push(energy);
  return { curve, largestBucket: largest, holes };
}

/**
 * ⚠️ **The share at which one bucket is worth mentioning as a fact.**
 *
 * A third of the deck at one cost is not a rule anybody wrote down, and it is not presented as
 * one: the note states the **share**, which is counted, and leaves the judgement to the
 * reader. The threshold only decides when to speak — [D-042](../../../../docs/DECISIONS.md#d-042),
 * advice is pull rather than push, and a tool that always has something to say is not reading
 * the deck.
 */
const SPIKE_SHARE = 1 / 3;

/**
 * ⚠️ **The curve of a half-built deck is not information.**
 *
 * Twelve cards in, every deck is spiky and full of holes, and saying so during the build is
 * noise at exactly the moment the builder is least able to act on it. `review()` already
 * guards its combat-trick note the same way and for the same reason. **The `CurveRead` itself
 * is always returned** — it is counted, and suppressing a fact would be worse; only the
 * *notes* wait.
 */
const CURVE_READABLE_FROM = 20;

/**
 * Read a deck against its plan.
 *
 * ⚠️ **Facts and doctrine are kept apart in the `Note`s, not blurred into a verdict.** A
 * package count is `computed`/`fact`; the *target* it is compared against is `doctrine` and
 * carries whoever holds it, so the reader can discard the opinion and keep the number.
 */
export function reviewAgainstPlan(deck: Deck, plan: Plan, cards: CardIndex): PlanReview {
  const rewards = rewardsOf(deck.legendCardId, cards);
  const read = readPackages(deck, cards, { closerFrom: plan.closerFrom, rewards });
  const shape = deckShape(deck, cards);
  const curve = readCurve(shape.curve, shape.size);
  const notes: Note[] = [];

  const deltas: PackageDelta[] = [];
  for (const [name, target] of Object.entries(plan.packages) as [Package, Target][]) {
    const actual = read.counts[name] ?? 0;
    const delta = distance(actual, target);
    deltas.push({ package: name, actual, target, delta, within: delta === 0 });
    if (delta === 0) continue;

    const floor = delta < 0;
    const engineIsFloor = name === "engine" && read.unmeasurableRewards.length > 0;
    notes.push({
      claim: `${actual} ${name}, and the plan asks for ${band(target)}.`,
      because:
        (floor
          ? `Short of the plan's own target. `
          : `More than the plan needs, and every extra one is a slot the other packages did not get. `) +
        (engineIsFloor
          ? `⚠️ This count is a floor — ${read.unmeasurableRewards.join(", ")} could not be measured, so the real figure is higher. `
          : "") +
        target.attribution,
      source: target.source,
      // The count is a fact; comparing it to a contested target is doctrine.
      confidence: "doctrine",
      attribution: target.attribution,
    });
  }

  // ── curve, as facts ─────────────────────────────────────────────────────────
  const curveReadable = shape.size >= CURVE_READABLE_FROM;
  if (curveReadable && curve.largestBucket.share >= SPIKE_SHARE) {
    notes.push({
      claim: `${curve.largestBucket.count} of ${shape.size} cards cost ${curve.largestBucket.energy} — ${Math.round(curve.largestBucket.share * 100)}% of the deck at one price.`,
      because:
        "Counted, not judged: a deliberate skew looks exactly like this, and so does a deck " +
        "that never chose a top end. Read it against what the plan says the curve should be.",
      source: "computed",
      confidence: "fact",
      attribution: "Energy histogram over the Main Deck; cards with no cost data are excluded rather than counted as zero",
    });
  }
  if (curveReadable && curve.holes.length > 0) {
    notes.push({
      claim: `Nothing at ${curve.holes.join(", ")} energy, in a deck that goes up to ${topEnd(curve.curve)}.`,
      because:
        "A gap below your own top end is a turn with no play at that price. Stated as a fact " +
        "rather than a fault — the plan decides whether the gap is a hole or a choice.",
      source: "computed",
      confidence: "fact",
      attribution: "Energy histogram; only costs below the deck's own highest are considered",
    });
  }

  return { plan, packages: deltas, curve, notes, unmeasurableRewards: read.unmeasurableRewards };
}
