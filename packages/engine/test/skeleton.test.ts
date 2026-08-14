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

  it("⚠️ returns every skeleton unranked, including the ones that do not fit", () => {
    // Ordering them would be the composite score D-016 forbids, and dropping the misfits
    // would hide the gap analysis that is often the more useful answer.
    const all = feasibilities(rewards, []);
    expect(all).toHaveLength(SKELETONS.length);
    expect(all.every((f) => !f.supportable)).toBe(true);
  });
});
