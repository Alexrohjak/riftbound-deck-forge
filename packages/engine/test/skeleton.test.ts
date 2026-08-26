import { describe, expect, it } from "vitest";
import { SKELETONS, feasibilities, feasibility, skeletonById } from "../src/advice/skeleton.js";
import type { PoolSupply } from "../src/advice/skeleton.js";
import type { CardFacts } from "../src/types.js";

/**
 * ⚠️ **These templates are doctrine, and the tests that matter are about honesty rather than
 * arithmetic.** A number here that cannot say who holds it is exactly the failure
 * `DECKBUILDING.md` was written to stop, committed inside the module that carries the
 * attributions.
 */

const owned = (over: Partial<CardFacts> & { name: string }, n = 3): PoolSupply => ({
  facts: { types: ["spell"], energy: 2, ...over },
  owned: n,
});

describe("the templates carry their sources", () => {
  it("every target names who holds it", () => {
    for (const s of SKELETONS) {
      for (const [name, target] of Object.entries(s.packages)) {
        expect(target.attribution, `${s.id}/${name}`).toBeTruthy();
        expect(target.source, `${s.id}/${name}`).toBeTruthy();
      }
    }
  });

  it("⚠️ an interpolated count says so where the reader will see it", () => {
    // The slow builds are shaped from 04's description of control, and nobody states their
    // counts. That is a materially weaker claim than the fast targets and must read as one —
    // if this ever passes silently, the module has started inventing doctrine.
    const slow = skeletonById("slow-hold")!;
    expect(slow.packages.interaction!.attribution).toContain("Interpolated");
    const fast = skeletonById("fast-conquer")!;
    expect(fast.packages.interaction!.attribution).not.toContain("Interpolated");
    expect(fast.packages.interaction!.attribution).toContain("fifth of the deck");
  });

  it("intent is pace × objective and never an archetype name (D-030)", () => {
    const banned = /aggro|control|combo|midrange|tempo/i;
    for (const s of SKELETONS) {
      expect(banned.test(s.label), `${s.id}: ${s.label}`).toBe(false);
      expect(banned.test(s.winCondition), `${s.id}: ${s.winCondition}`).toBe(false);
    }
  });

  it("covers all four pace × objective cells", () => {
    const cells = new Set(SKELETONS.map((s) => `${s.pace}-${s.objective}`));
    expect(cells).toEqual(new Set(["fast-conquer", "fast-hold", "slow-conquer", "slow-hold"]));
  });

  it("🌶️ every skeleton reserves spice and none of them fills it", () => {
    // Its value is entirely in what the opponent does not expect — meta knowledge D-035 says
    // Forge will never have. The slot is reserved; the choice is the builder's.
    for (const s of SKELETONS) expect(s.spice).toBeGreaterThan(0);
  });

  it("⚠️ targets deliberately do NOT sum to 40 — coreUnits absorbs the balance", () => {
    // Riot's "prioritise units" is a floor with no ceiling. A template that summed to exactly
    // 40 would be asserting a precision no source claims.
    const fast = skeletonById("fast-conquer")!;
    const floors = Object.values(fast.packages).reduce((n, t) => n + t.min, 0);
    expect(floors).toBeLessThan(40);
    expect(fast.packages.coreUnits!.max).toBeUndefined();
  });
});

describe("feasibility against a real collection", () => {
  const rewards = ["becomes_mighty"];

  it("counts what the boxes can actually fill, capped at three copies (L13)", () => {
    const pool: PoolSupply[] = [
      owned({ name: "Pumper", types: ["unit"], produces: ["pump"] }, 9), // capped to 3
      owned({ name: "Killer", role: "removal-kill" }, 3),
    ];
    const f = feasibility(skeletonById("fast-conquer")!, rewards, pool);
    expect(f.supply.engine!.owned).toBe(3);
    expect(f.supply.interaction!.owned).toBe(3);
  });

  it("a card you own none of is not supply", () => {
    const pool: PoolSupply[] = [owned({ name: "Wanted", role: "removal-kill" }, 0)];
    const f = feasibility(skeletonById("fast-conquer")!, rewards, pool);
    expect(f.supply.interaction!.owned).toBe(0);
  });

  it("⚠️ a collection that cannot support a skeleton produces a shopping list, not silence", () => {
    // GENERATOR §6's designed failure mode. "No results" is the one answer that helps nobody.
    const f = feasibility(skeletonById("fast-conquer")!, rewards, []);
    expect(f.supportable).toBe(false);
    expect(f.gaps.length).toBeGreaterThan(0);
    expect(f.gaps.join(" ")).toContain("short");
    // And the gap carries the attribution, so the target can be argued with rather than obeyed.
    expect(f.gaps.join(" ")).toContain("Riot's Primer");
  });

  it("unassigned and unmodelled cards cannot fill a package", () => {
    const pool: PoolSupply[] = [
      owned({ name: "Stray", role: "tempo", produces: ["stun"] }, 3), // unassigned
      owned({ name: "Unknown" }, 3), // unmodelled
    ];
    const f = feasibility(skeletonById("fast-conquer")!, rewards, pool);
    for (const s of Object.values(f.supply)) expect(s.owned).toBe(0);
  });

  it("a measured package still reports its shortfall, and says the count was real", () => {
    const f = feasibility(skeletonById("fast-conquer")!, rewards, []);
    expect(f.unmeasurable).toEqual([]);
    expect(f.supply.engine!.measured).toBe(true);
    expect(f.supply.engine!.short).toBeGreaterThan(0);
  });

  it("⚠️ returns every skeleton unranked, including the ones that do not fit", () => {
    // Ordering them would be the composite score D-016 forbids, and dropping the misfits
    // would hide the gap analysis that is often the more useful answer.
    const all = feasibilities(rewards, []);
    expect(all).toHaveLength(SKELETONS.length);
    expect(all.every((f) => !f.supportable)).toBe(true);
  });
});

/**
 * **The bug:** `Glorious Executioner` rewards `combat_win`, which `synergy.ts` lists as
 * `self-satisfying` — *"winning a combat needs a board and a fight, not a particular partner
 * card"*. `assign` only consults the rewards on its `engine` branch, so every one of the 312
 * legal names failed that test and `engine` counted `0`. All four skeletons then came back
 * `supportable: false`, each carrying *"engine: 0 owned, 6 needed — 6 short"* — a shopping
 * list for cards that were never missing, and the reason a whole Legend read as unbuildable.
 *
 * `synergy.ts` had already written the rule down: *"callers must emit `null` for anything
 * that is not `counted`."*
 */
describe("⚠️ a reward the graph cannot supply is not a gap in the collection", () => {
  const unmeasurable = ["combat_win"];
  /**
   * Deep enough that every package Forge CAN measure clears its floor — so if a plan still
   * comes back unsupportable, `engine` is the only thing that could have done it. `assign`
   * is exclusive here (unlike `readPackages`, where `coreUnits` overlays), so the bodies and
   * the removal have to be separate names.
   */
  const realPool: PoolSupply[] = [
    ...["Kill A", "Kill B", "Kill C", "Kill D"].map((name) => owned({ name, role: "removal-kill" })),
    ...["Body A", "Body B", "Body C"].map((name) => owned({ name, types: ["unit"], energy: 2 })),
    ...["Closer A", "Closer B"].map((name) => owned({ name, types: ["unit"], energy: 6 })),
  ];

  it("does not report a shortfall it cannot measure", () => {
    const f = feasibility(skeletonById("slow-conquer")!, unmeasurable, realPool);
    expect(f.unmeasurable).toEqual(["combat_win"]);
    expect(f.supply.engine!.measured).toBe(false);
    expect(f.gaps.join(" ")).not.toContain("engine");
  });

  it("⚠️ and never lets it decide the plan is unbuildable", () => {
    // The whole point. Four plans died on this, none of them on their merits.
    const all = feasibilities(unmeasurable, realPool);
    expect(all.some((f) => f.supportable)).toBe(true);
  });

  it("a package it CAN measure is still allowed to be short", () => {
    // The fix must not silence real gap analysis — GENERATOR §6's designed failure mode.
    const f = feasibility(skeletonById("slow-conquer")!, unmeasurable, []);
    expect(f.supply.interaction!.measured).toBe(true);
    expect(f.gaps.join(" ")).toContain("interaction");
    expect(f.supportable).toBe(false);
  });

  it("a measurable reward is unaffected", () => {
    const f = feasibility(skeletonById("slow-conquer")!, ["becomes_mighty"], realPool);
    expect(f.unmeasurable).toEqual([]);
    expect(f.supply.engine!.measured).toBe(true);
  });
});
