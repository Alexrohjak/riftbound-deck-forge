import type { CardFacts } from "../types.js";
import type { Package } from "./packages.js";
import { assign } from "./packages.js";
import { supplyKind } from "./synergy.js";
import type { Source } from "./doctrine.js";

/**
 * **Skeletons** — the curve/role templates a deck is built toward.
 *
 * `GENERATOR §5.1`, [D-064](../../../../docs/DECISIONS.md#d-064). This document has named
 * skeleton fill as the primary search strategy since Discovery and it was never built; the
 * deck that followed had no plan to be short of.
 *
 * ⚠️ **The split that keeps [D-016](../../../../docs/DECISIONS.md#d-016) intact.** The
 * templates below are **doctrine** — contested advice, carrying a source and an attribution
 * exactly as `Note` does. The *feasibility* of a template against a real collection is
 * **computed**. Neither is a score, and nothing here ranks one skeleton above another: the
 * builder picks, because the objective is theirs ([D-041](../../../../docs/DECISIONS.md#d-041)).
 *
 * ⚠️ **Intent is `pace × objective`, never an archetype name**
 * ([D-030](../../../../docs/DECISIONS.md#d-030)). Riftbound supports aggressive *and*
 * defensive versions of both conquer and hold, so the usual aggro/control taxonomy does not
 * map onto it — `04` is explicit about that, and `LEGEND-GUIDE` §5 independently calls
 * Hold-vs-Conquer the intent that matters most.
 */

export type Pace = "fast" | "slow";
export type Objective = "conquer" | "hold";

/**
 * A package target.
 *
 * ⚠️ **A range, not a number, because ranges are what the sources actually give.** *"7–9 two
 * drops"*, *"9+ small units"*, *"about eight removal spells"*. Collapsing those to a point
 * would invent a precision nobody claimed, and then measure against it.
 *
 * `max` is optional: some targets are floors. Riot's *"prioritise units"* has no ceiling.
 */
export interface Target {
  min: number;
  max?: number;
  source: Source;
  /** ⚠️ Who says so. Where no source gives a count, this says **that**, in these words. */
  attribution: string;
}

export interface Skeleton {
  id: string;
  /** Mechanical, never an archetype name (D-030). */
  label: string;
  pace: Pace;
  objective: Objective;
  /** How this deck ends the game. The sideboard is defined against it (`GENERATOR §8`). */
  winCondition: string;
  /** ⚠️ Targets do **not** sum to 40 — see `coreUnits`, which absorbs the balance. */
  packages: Partial<Record<Package, Target>>;
  /**
   * Energy at or above which a card is a closer, passed to `assign`.
   *
   * ⚠️ **The same for every skeleton, deliberately.** `03` gives one figure — *"any spell
   * with four or less energy cost as part of our core interaction package"* — and no source
   * varies it by pace. Varying it here would be inventing a number in the one module whose
   * whole job is to carry attributions.
   */
  closerFrom: number;
  /**
   * 🌶️ Slots reserved for `01`'s *"secret spice"* and **deliberately left empty by EE**.
   *
   * Its value comes entirely from what opponents do not expect, which is meta knowledge
   * [D-035](../../../../docs/DECISIONS.md#d-035) says Forge will never have. Naming a card
   * here would be Forge inventing a meta read.
   */
  spice: number;
}

/** Riot's Primer, via `doctrine.ts`. Outranks community heuristics where they conflict. */
const RIOT_UNITS: Target = {
  min: 9,
  source: "official",
  attribution: "Riot's Primer: 9+ small units at 4 energy or less, and prioritise units over spells and gear — you hold battlefields with bodies",
};

/**
 * ⚠️ **Where a count is interpolated, the attribution says so in the field the reader sees.**
 *
 * No source gives package counts for a slow build. `04` describes the *shape* — accept early
 * point losses, develop in base, overwhelm with value, play units the opponent cannot trade
 * into profitably — and Riot gives a 6+ interactive floor. The numbers below follow that
 * shape and **are not stated by anyone**, which is a materially weaker claim than the fast
 * targets and must read as one.
 */
const INTERPOLATED = "⚠️ Interpolated — no source gives package counts for this shape. Follows 04's description of control and Riot's 6+ interactive floor";

export const SKELETONS: readonly Skeleton[] = [
  {
    id: "fast-conquer",
    label: "Cheap bodies, early points, fight at 2–4 energy",
    pace: "fast",
    objective: "conquer",
    winCondition: "Take points from turn two and end it before they stabilise",
    closerFrom: 5,
    spice: 1,
    packages: {
      engine: {
        min: 8,
        max: 10,
        source: "community",
        attribution: "04 builds nine cards dedicated to the Legend's plan in a worked aggro example",
      },
      interaction: {
        min: 6,
        max: 8,
        source: "community",
        attribution: "04: about eight removal spells, roughly a fifth of the deck — 'I'm happy with about this much'. Floor is Riot's 6+ interactive spells",
      },
      closers: {
        min: 2,
        max: 4,
        source: "community",
        attribution: "04 closes the aggro example on three copies of one card; 03's Rumble breakdown has a comparable closer package",
      },
      coreUnits: RIOT_UNITS,
    },
  },
  {
    id: "fast-hold",
    label: "Take fields early and make them expensive to dislodge",
    pace: "fast",
    objective: "hold",
    winCondition: "Hold what you take, and tax every attempt to move you",
    closerFrom: 5,
    spice: 1,
    packages: {
      engine: {
        min: 8,
        max: 10,
        source: "community",
        attribution: "04's aggro worked example, applied to the hold objective — 04 is explicit that aggressive hold builds exist and are not aggro",
      },
      interaction: {
        min: 6,
        max: 8,
        source: "community",
        attribution: "04: about a fifth of the deck. Floor is Riot's 6+ interactive spells",
      },
      closers: { min: 2, max: 4, source: "community", attribution: INTERPOLATED },
      coreUnits: RIOT_UNITS,
    },
  },
  {
    id: "slow-hold",
    label: "Survive early, out-resource, hold late and never leave",
    pace: "slow",
    objective: "hold",
    winCondition: "Stabilise, then hold points the opponent cannot profitably contest",
    closerFrom: 5,
    spice: 1,
    packages: {
      engine: { min: 6, max: 9, source: "community", attribution: INTERPOLATED },
      interaction: {
        min: 8,
        max: 12,
        source: "community",
        attribution: `${INTERPOLATED}. 04: control 'removes aggro units or slows down your pace of play until they overwhelm you with resources'`,
      },
      closers: {
        min: 4,
        max: 6,
        source: "community",
        attribution: `${INTERPOLATED}. 04: control wins on units that 'take two to three cards from your opponent to interact with'`,
      },
      coreUnits: RIOT_UNITS,
    },
  },
  {
    id: "slow-conquer",
    label: "Grind for value, convert late in one push",
    pace: "slow",
    objective: "conquer",
    winCondition: "Out-resource them, then take the points you need in a short window",
    closerFrom: 5,
    spice: 1,
    packages: {
      engine: { min: 6, max: 9, source: "community", attribution: INTERPOLATED },
      interaction: { min: 8, max: 12, source: "community", attribution: INTERPOLATED },
      closers: {
        min: 4,
        max: 6,
        source: "community",
        attribution: `${INTERPOLATED}. 04's combo shape — 'a very precise moment to score more points than you would normally be able to' — lives here rather than as a fifth axis value`,
      },
      coreUnits: RIOT_UNITS,
    },
  },
];

export const skeletonById = (id: string): Skeleton | undefined =>
  SKELETONS.find((s) => s.id === id);

/** One name in the pool, with how many copies the boxes hold. */
export interface PoolSupply {
  facts: CardFacts;
  /** ⚠️ Copies owned across arts. `0` is a real answer and excludes the card from supply. */
  owned: number;
}

export interface PackageSupply {
  target: Target;
  /** Copies owned that would land in this package, capped at the 3-copy limit (L13). */
  owned: number;
  /** How far short of `target.min` the collection is. `0` when it can be filled. */
  short: number;
  /**
   * ⚠️ **Is `owned` a count at all?** `false` when the Legend's reward is one the synergy
   * graph cannot check — then nothing can be assigned to this package, `owned` reads `0`
   * and `short` reads the whole floor, and **both are artefacts of Forge rather than facts
   * about the boxes.** Read `owned` as a floor and `short` as a ceiling, and never let
   * either decide anything on its own.
   */
  measured: boolean;
}

export interface Feasibility {
  skeleton: Skeleton;
  supply: Partial<Record<Package, PackageSupply>>;
  /**
   * True when every package Forge **can measure** has its floor met from the boxes.
   *
   * ⚠️ **Read it with `unmeasurable`.** `true` alongside a non-empty `unmeasurable` means
   * *"nothing I could check rules this out"*, which is weaker than *"you can build it"* —
   * an unmeasurable package is not evidence in either direction. What it must never do is
   * what it used to: report `false` because a package Forge cannot count came back empty.
   */
  supportable: boolean;
  /**
   * ⚠️ Stated in the imperative, and **never hidden**. `GENERATOR §6`'s designed failure
   * mode: a collection that cannot support a skeleton produces gap analysis, not "no results".
   *
   * ⚠️ **Shortfalls in the boxes only.** A package Forge cannot measure produces no gap,
   * because "you own none of these" and "I cannot tell which of these you own" are different
   * sentences and only the first one is a shopping list. The second lives in `unmeasurable`.
   */
  gaps: string[];
  /**
   * Reward tags the synergy graph cannot check, exactly as `PackageRead.unmeasurableRewards`
   * reports them for a built deck.
   *
   * **Why this exists.** `Glorious Executioner` rewards `combat_win`, which nothing in
   * `synergy.ts` supplies. Every card in a 312-name legal pool therefore failed the `engine`
   * test, and all four skeletons came back `supportable: false` with *"engine: 0 owned, 6
   * needed — 6 short"* — a claim about the collection, produced entirely by a hole in Forge.
   * `review()` had always been honest about this ([`plan.ts`](./plan.ts)); this path was not,
   * and it told a Legend's whole set of plans was unbuildable when none of them had been
   * tested.
   *
   * ⚠️ [`synergy.ts`](./synergy.js) states the contract this path had broken: *"a count of
   * `0` is only meaningful for `counted` … callers must emit `null` for anything that is not
   * `counted`."* Both non-counted kinds are collected here, as `readPackages` collects them,
   * so the two paths keep one vocabulary — though they differ underneath, and usefully:
   * `unmodelled` means Forge cannot tell, while `self-satisfying` — `combat_win`, `conquer`,
   * `hold` — means the reward wants a board and a fight rather than a package of cards, so
   * there may be nothing to be short *of*.
   */
  unmeasurable: string[];
}

/** L13 — a fourth copy is unplayable, so it is not supply. */
const MAX_COPIES = 3;

/**
 * Can this collection actually build this skeleton?
 *
 * ⚠️ **The pool is the caller's, already filtered to what is legal under the Legend.** The
 * engine reads no files and re-deriving Domain Identity here would be a second implementation
 * of the checks `buildBrief` already runs ([D-047](../../../../docs/DECISIONS.md#d-047)).
 */
export function feasibility(
  skeleton: Skeleton,
  rewards: readonly string[],
  pool: readonly PoolSupply[],
): Feasibility {
  const counted: Partial<Record<Package, number>> = {};

  for (const { facts, owned } of pool) {
    if (owned <= 0) continue;
    const { slot } = assign(facts, { closerFrom: skeleton.closerFrom, rewards });
    // `unassigned` and `unmodelled` are not packages and cannot fill one.
    if (slot === "unassigned" || slot === "unmodelled") continue;
    counted[slot] = (counted[slot] ?? 0) + Math.min(owned, MAX_COPIES);
  }

  /**
   * ⚠️ **The same filter `readPackages` applies, and for the same reason.** `assign` only
   * consults `rewards` on the `engine` branch, so a reward the graph cannot supply makes
   * every card in the pool fail that test — and `engine` comes back `0` whatever the boxes
   * hold. One unmeasurable tag is enough: a count that is a floor cannot establish a
   * shortfall, however many of the Legend's other rewards were measured.
   */
  const unmeasurable = rewards.filter((tag) => supplyKind(tag) !== "counted");

  const supply: Partial<Record<Package, PackageSupply>> = {};
  const gaps: string[] = [];

  for (const [name, target] of Object.entries(skeleton.packages) as [Package, Target][]) {
    const have = counted[name] ?? 0;
    const short = Math.max(0, target.min - have);
    const measured = name !== "engine" || unmeasurable.length === 0;
    supply[name] = { target, owned: have, short, measured };
    // An unmeasured package cannot be short of anything — see `Feasibility.gaps`.
    if (short > 0 && measured) {
      gaps.push(
        `${name}: ${have} owned, ${target.min} needed — ${short} short. ${target.attribution}`,
      );
    }
  }

  return { skeleton, supply, supportable: gaps.length === 0, gaps, unmeasurable };
}

/**
 * Every skeleton, with how well the collection supports each.
 *
 * ⚠️ **Returned unranked, and unsupportable ones are returned too.** Ordering them would be
 * the composite score [D-016](../../../../docs/DECISIONS.md#d-016) forbids, and dropping the
 * ones that do not fit would hide the gap analysis that is often the more useful answer —
 * *"you are four closers short of the slow build"* is a shopping list.
 */
export const feasibilities = (
  rewards: readonly string[],
  pool: readonly PoolSupply[],
): Feasibility[] => SKELETONS.map((s) => feasibility(s, rewards, pool));
