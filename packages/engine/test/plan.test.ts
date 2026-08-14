import { describe, expect, it } from "vitest";
import { planFromSkeleton, reviewAgainstPlan, type Plan } from "../src/advice/plan.js";
import { skeletonById } from "../src/advice/skeleton.js";
import { staticCardIndex } from "../src/cardIndex.js";
import type { CardFacts, Deck } from "../src/types.js";

/**
 * ⚠️ **The plan is made from what the builder said**, so these tests treat a hand-written
 * plan as the normal case and a skeleton as one convenience constructor. EE's entry point is
 * a sentence, not a menu — two of its three opening questions already carry the intent.
 */

const facts: Record<string, CardFacts> = {
  "legend-1": { name: "Grand Duelist", types: ["legend"], consumes: ["becomes_mighty"] },
  "champ-1": { name: "Fiora, Worthy", types: ["unit"], energy: 3, role: "body" },
  pump: { name: "Pit Rookie", types: ["unit"], energy: 2, produces: ["pump"] },
  kill: { name: "Hidden Blade", types: ["spell"], energy: 2, role: "removal-kill" },
  body: { name: "Kinkou Initiate", types: ["unit"], energy: 3, role: "body" },
  bomb: { name: "Grand Strategem", types: ["spell"], energy: 6, role: "utility" },
};
const index = staticCardIndex(facts);

const deckOf = (slots: { cardId: string; quantity: number }[]): Deck => ({
  id: "d",
  name: "d",
  state: "DRAFT",
  legendCardId: "legend-1",
  chosenChampionCardId: "champ-1",
  slots: slots.map((s) => ({ ...s, zone: "MAIN" as const })),
});

/** A plan stated in words, which is how most of them will arrive. */
const stated: Plan = {
  winCondition: "Take points early and hold them",
  pace: "fast",
  objective: "conquer",
  origin: "stated",
  closerFrom: 5,
  spice: 1,
  packages: {
    engine: { min: 8, max: 10, source: "community", attribution: "04's worked aggro example" },
    interaction: { min: 6, max: 8, source: "community", attribution: "04: about a fifth of the deck" },
  },
};

describe("a plan can come from words, not only from a menu", () => {
  it("reviews against a hand-written plan with no skeleton anywhere", () => {
    const review = reviewAgainstPlan(deckOf([{ cardId: "pump", quantity: 3 }]), stated, index);
    expect(review.plan.origin).toBe("stated");
    expect(review.packages.find((p) => p.package === "engine")?.actual).toBe(3);
  });

  it("a skeleton is one constructor, and says which one it was", () => {
    const plan = planFromSkeleton(skeletonById("fast-conquer")!);
    expect(plan.origin).toBe("fast-conquer");
    // ⚠️ Carried so a reader can tell "he asked for this" from "he picked it off a list".
    expect(plan.origin).not.toBe("stated");
  });

  it("keeps the builder's own win condition when they gave one", () => {
    const plan = planFromSkeleton(skeletonById("fast-conquer")!, "Kill them with Fiora triggers");
    expect(plan.winCondition).toBe("Kill them with Fiora triggers");
  });
});

describe("package deltas measure distance from a range, not a point", () => {
  it("says nothing at all when the deck matches its plan", () => {
    // Silence is a valid answer and a common one. A tool that always has advice is not
    // reading the deck (D-042).
    const deck = deckOf([
      { cardId: "pump", quantity: 8 },
      { cardId: "kill", quantity: 6 },
    ]);
    const review = reviewAgainstPlan(deck, stated, index);
    expect(review.packages.every((p) => p.within)).toBe(true);
    expect(review.notes).toEqual([]);
  });

  it("anywhere inside the band is zero, not 'off by the midpoint'", () => {
    const deck = deckOf([
      { cardId: "pump", quantity: 9 },
      { cardId: "kill", quantity: 6 },
    ]);
    const review = reviewAgainstPlan(deck, stated, index);
    expect(review.packages.find((p) => p.package === "engine")?.delta).toBe(0);
  });

  it("reports over and under with the sign that says which", () => {
    const deck = deckOf([
      { cardId: "pump", quantity: 3 }, // engine 3, floor is 8 → −5
      { cardId: "kill", quantity: 12 }, // interaction 12, ceiling is 8 → +4
    ]);
    const review = reviewAgainstPlan(deck, stated, index);
    expect(review.packages.find((p) => p.package === "engine")?.delta).toBe(-5);
    expect(review.packages.find((p) => p.package === "interaction")?.delta).toBe(4);
  });

  it("⚠️ every note carries who holds the target, so the opinion can be discarded", () => {
    const review = reviewAgainstPlan(deckOf([{ cardId: "pump", quantity: 3 }]), stated, index);
    const note = review.notes.find((n) => n.claim.includes("engine"))!;
    expect(note.attribution).toContain("04");
    // The count is a fact; comparing it to a contested target is doctrine.
    expect(note.confidence).toBe("doctrine");
  });

  it("⚠️ says when `engine` is a floor rather than a count", () => {
    // A Legend whose reward the synergy graph cannot check. Reporting the shortfall without
    // saying so would be the silent zero this project keeps catching.
    const withUnmeasurable = staticCardIndex({
      ...facts,
      "legend-1": { name: "Odd One", types: ["legend"], consumes: ["sings_loudly"] },
    });
    const review = reviewAgainstPlan(deckOf([{ cardId: "pump", quantity: 1 }]), stated, withUnmeasurable);
    expect(review.unmeasurableRewards).toEqual(["sings_loudly"]);
    expect(review.notes.find((n) => n.claim.includes("engine"))?.because).toContain("floor");
  });
});

describe("the curve check that did not exist", () => {
  it("⚠️ catches a spike that every existing check passed", () => {
    // Nineteen of forty at one cost passed `review()` entirely: it tests for zero removal,
    // zero draw, zero tricks and a low unit share, and a wall of two-drops trips none of them.
    const deck = deckOf([
      { cardId: "pump", quantity: 19 },
      { cardId: "body", quantity: 5 },
    ]);
    const review = reviewAgainstPlan(deck, stated, index);
    expect(review.curve.largestBucket).toMatchObject({ energy: 2, count: 19 });
    expect(review.notes.some((n) => n.claim.includes("at one price"))).toBe(true);
  });

  it("states the share as a fact and leaves the judgement alone", () => {
    const deck = deckOf([{ cardId: "pump", quantity: 20 }]);
    const note = reviewAgainstPlan(deck, stated, index).notes.find((n) => n.claim.includes("one price"))!;
    expect(note.confidence).toBe("fact");
    expect(note.source).toBe("computed");
  });

  it("reports holes below the deck's own top end", () => {
    // Cost 2 has the pumps, 3 has the Chosen Champion (L3 puts it inside the 40), 6 has the
    // bomb — so 4 and 5 are the gaps *inside* the range this deck chose.
    const deck = deckOf([
      { cardId: "pump", quantity: 4 },
      { cardId: "bomb", quantity: 2 },
    ]);
    const review = reviewAgainstPlan(deck, stated, index);
    expect(review.curve.holes).toEqual([4, 5]);
  });

  it("⚠️ never calls an empty 1-cost slot a hole", () => {
    // Most decks run no 1-drops at all; every source treats the two-drop as the first real
    // play. Scanning from 1 made this a permanent false positive rather than a finding.
    const deck = deckOf([
      { cardId: "pump", quantity: 4 },
      { cardId: "bomb", quantity: 2 },
    ]);
    expect(reviewAgainstPlan(deck, stated, index).curve.holes).not.toContain(1);
  });

  it("⚠️ stays quiet about the curve of a half-built deck", () => {
    // Twelve cards in, every deck is spiky and full of holes. Saying so mid-build is noise at
    // the moment the builder can least act on it — but the READ is still returned, because it
    // is counted and suppressing a fact would be worse.
    const half = deckOf([{ cardId: "pump", quantity: 11 }]);
    const review = reviewAgainstPlan(half, stated, index);
    expect(review.curve.largestBucket.count).toBe(11);
    expect(review.notes.some((n) => n.source === "computed")).toBe(false);
  });

  it("⚠️ a deck that tops out early has no hole above it — that is a decision, not a gap", () => {
    // Reporting 5 and 6 as missing would invent a top end nobody chose.
    const deck = deckOf([
      { cardId: "pump", quantity: 4 },
      { cardId: "body", quantity: 4 },
    ]);
    expect(reviewAgainstPlan(deck, stated, index).curve.holes).toEqual([]);
  });
});

describe("⚠️ the second yardstick", () => {
  /**
   * A plan written by whoever built the deck cannot falsify it. The Ambessa build passed
   * every package against its own hand-written plan and read `engine +6` against a skeleton
   * nobody had tuned for it.
   */
  const generous: Plan = {
    ...stated,
    packages: { engine: { min: 12, max: 18, source: "community", attribution: "written to fit the deck" } },
  };
  const deck = deckOf([{ cardId: "pump", quantity: 16 }]);

  it("reports the nearest skeleton beside a stated plan", () => {
    const review = reviewAgainstPlan(deck, generous, index);
    expect(review.packages.find((p) => p.package === "engine")?.within).toBe(true);
    expect(review.reference?.skeletonId).toBe("fast-conquer");
    const ref = review.reference!.packages.find((p) => p.package === "engine")!;
    expect(ref.within).toBe(false);
    expect(ref.delta).toBeGreaterThan(0);
  });

  it("names the packages where the two yardsticks disagree", () => {
    const review = reviewAgainstPlan(deck, generous, index);
    expect(review.reference?.disagreements).toContain("engine");
    expect(review.notes.some((n) => n.claim.includes("inside this deck's own plan"))).toBe(true);
  });

  it("⚠️ a skeleton-derived plan is not compared with itself", () => {
    // Same circularity in a different costume, so it is skipped rather than reported as
    // agreement — which would read as independent confirmation.
    const fromSkeleton = planFromSkeleton(skeletonById("fast-conquer")!);
    expect(reviewAgainstPlan(deck, fromSkeleton, index).reference).toBeUndefined();
  });
});
