import { describe, expect, it } from "vitest";
import { assign, readPackages, rewardsOf } from "../src/advice/packages.js";
import { staticCardIndex } from "../src/cardIndex.js";
import type { CardFacts, Deck } from "../src/types.js";

/**
 * ⚠️ **Everything in `GENERATOR §6` rests on these assignments being right.** Mis-bucket the
 * cards and every package delta is confidently wrong — which is the failure mode this project
 * keeps finding in itself, so the precedence is pinned here rather than left to reading.
 */

const card = (over: Partial<CardFacts> & { name: string }): CardFacts => ({
  types: ["spell"],
  energy: 2,
  ...over,
});

const rules = (rewards: readonly string[] = [], closerFrom = 5) => ({ closerFrom, rewards });

describe("the precedence, one step at a time", () => {
  it("cost beats everything — a closer is a closer however well it synergises", () => {
    // A ten-energy card that feeds the engine still cannot be cast on turn three, and
    // pretending otherwise is how a deck ends up unable to act.
    const bomb = card({ name: "Time Warp", energy: 10, produces: ["pump"], role: "combat-trick" });
    expect(assign(bomb, rules(["becomes_mighty"])).slot).toBe("closers");
  });

  it("⚠️ interaction beats engine, so a removal-heavy deck never reports zero answers", () => {
    // If `engine` claimed removal that happens to feed the Legend, a deck full of answers
    // would report `interaction: 0` — an alarm that is both false and alarming.
    const removal = card({ name: "Hidden Blade", role: "removal-kill", produces: ["kill", "pump"] });
    expect(assign(removal, rules(["becomes_mighty"])).slot).toBe("interaction");
  });

  it("engine beats coreUnits — a body doing the Legend's job is doing the Legend's job", () => {
    const pumper = card({ name: "Pit Rookie", types: ["unit"], produces: ["pump"] });
    expect(assign(pumper, rules(["becomes_mighty"])).slot).toBe("engine");
  });

  it("a unit with no job is still a body", () => {
    const vanilla = card({ name: "Kinkou Initiate", types: ["unit"], role: "body" });
    expect(assign(vanilla, rules(["becomes_mighty"])).slot).toBe("coreUnits");
  });
});

describe("⚠️ unassigned and unmodelled are different answers", () => {
  it("classified but serving nothing is a real finding", () => {
    const stray = card({ name: "Stare Down", role: "tempo", produces: ["stun"] });
    const got = assign(stray, rules(["becomes_mighty"]));
    expect(got.slot).toBe("unassigned");
    expect(got.because).toContain("tempo");
  });

  it("never measured licenses no finding at all", () => {
    // A zero that means "not measured" reads as a finding and is the most dangerous number
    // this project can emit — the mistake `feedsMeasured` exists to prevent.
    const unknown = card({ name: "Something New" });
    expect(assign(unknown, rules(["becomes_mighty"])).slot).toBe("unmodelled");
  });

  it("a unit is a body even with no classification — `types` is printed, not derived", () => {
    const unknownUnit = card({ name: "Unclassified Body", types: ["unit"] });
    expect(assign(unknownUnit, rules([])).slot).toBe("coreUnits");
  });
});

describe("engine is a job, not a card type", () => {
  it("⚠️ the same card lands differently in two decks, which is the entire point", () => {
    const pumper = card({ name: "Pit Rookie", types: ["unit"], produces: ["pump"] });
    expect(assign(pumper, rules(["becomes_mighty"])).slot).toBe("engine");
    // Same card, a Legend that wants something else entirely.
    expect(assign(pumper, rules(["gear_matters"])).slot).toBe("coreUnits");
  });

  it("says which reward it supplies, so the bucket can be argued with", () => {
    const pumper = card({ name: "Pit Rookie", types: ["unit"], produces: ["pump"] });
    expect(assign(pumper, rules(["becomes_mighty"])).because).toContain("becomes_mighty");
  });
});

describe("⚠️ body+removal is a body", () => {
  it("does not count as interaction, however much removal it carries", () => {
    // Fifty-five cards carry this role. Counting them as interaction would let a deck of
    // units report itself richly interactive with nothing castable on the opponent's turn.
    const brute = card({ name: "Brute", types: ["unit"], role: "body+removal", produces: ["kill"] });
    expect(assign(brute, rules([])).slot).toBe("coreUnits");
  });
});

describe("reading a whole deck", () => {
  const facts: Record<string, CardFacts> = {
    "legend-1": { name: "Grand Duelist", types: ["legend"], consumes: ["becomes_mighty"] },
    "champ-1": { name: "Fiora, Worthy", types: ["unit"], energy: 3, role: "body" },
    "pump-1": { name: "Pit Rookie", types: ["unit"], energy: 2, produces: ["pump"] },
    "kill-1": { name: "Hidden Blade", types: ["spell"], energy: 2, role: "removal-kill" },
    "big-1": { name: "Grand Strategem", types: ["spell"], energy: 6, role: "utility" },
  };
  const index = staticCardIndex(facts);
  const deck: Deck = {
    id: "d",
    name: "d",
    state: "DRAFT",
    legendCardId: "legend-1",
    chosenChampionCardId: "champ-1",
    slots: [
      { cardId: "pump-1", zone: "MAIN", quantity: 3 },
      { cardId: "kill-1", zone: "MAIN", quantity: 2 },
      { cardId: "big-1", zone: "MAIN", quantity: 1 },
      // Runes must never reach the packages — they are not Main Deck cards.
      { cardId: "pump-1", zone: "RUNE", quantity: 12 },
    ],
  };

  it("reads the Legend's rewards off the Legend, not off a guess", () => {
    expect(rewardsOf("legend-1", index)).toEqual(["becomes_mighty"]);
  });

  it("counts by quantity and includes the Chosen Champion, which L3 puts inside the 40", () => {
    const read = readPackages(deck, index, rules(rewardsOf("legend-1", index)));
    expect(read.counts.engine).toBe(3);
    expect(read.counts.interaction).toBe(2);
    expect(read.counts.closers).toBe(1);
    expect(read.counts.coreUnits).toBe(1); // the champion
    const total = Object.values(read.counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(7);
  });

  it("⚠️ says which rewards it could not check, so `engine` is never read as complete", () => {
    // Two different reasons a reward cannot be counted, and neither may be reported as zero:
    // `conquer` is self-satisfying — it needs a board and a normal turn, not a partner card,
    // so counting supply for it is a category error. `sings_loudly` is simply not modelled.
    // An engine count computed without either is a FLOOR, and saying so is the difference
    // between a measurement and a claim.
    const read = readPackages(deck, index, rules(["becomes_mighty", "conquer", "sings_loudly"]));
    expect(read.unmeasurableRewards).toEqual(["conquer", "sings_loudly"]);
    // The measurable one still counts normally — an unmeasurable sibling does not poison it.
    expect(read.counts.engine).toBe(3);
  });

  it("explains every card it placed", () => {
    const read = readPackages(deck, index, rules(rewardsOf("legend-1", index)));
    expect(read.cards.every((c) => c.because.length > 0)).toBe(true);
  });
});
