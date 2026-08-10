import { describe, expect, it } from "vitest";
import { cardFactsFrom, patternsOf } from "../src/index.js";

/**
 * One mapping, shared by both consumers (D-047).
 *
 * ⚠️ This test exists because there were two mappings and they drifted: the CLI's silently
 * omitted `power`, `role` and `timing`, so 374 of 814 cards read at the wrong cost and every
 * pattern keyed on timing or role was working blind. Nothing threw — the answers were just
 * quietly worse, which is the failure mode a shared mapping removes rather than detects.
 */
const VOID_SEEKER = {
  name: "Void Seeker",
  types: ["spell"],
  superTypes: [],
  tags: [],
  domains: ["mind"],
  energy: 3,
  power: 1,
  might: null,
  text: "[Action] (Play on your turn or in showdowns.) Deal 4 to a unit at a battlefield.",
  role: "removal-damage",
  timing: "Action",
  produces: ["damage"],
  consumes: [],
  banned: false,
};

describe("cardFactsFrom", () => {
  it("carries every field the engine actually consumes", () => {
    const facts = cardFactsFrom(VOID_SEEKER);
    // The three that went missing, named individually so a regression says which.
    expect(facts.power).toBe(1);
    expect(facts.role).toBe("removal-damage");
    expect(facts.timing).toBe("Action");
    expect(facts.energy).toBe(3);
    expect(facts.produces).toEqual(["damage"]);
  });

  it("keeps `banned` present even when false, so format checks stay on", () => {
    expect(cardFactsFrom({ name: "X" }).banned).toBe(false);
  });

  it("distinguishes a missing number from zero", () => {
    const facts = cardFactsFrom({ name: "Battlefield", types: ["battlefield"] });
    expect(facts.energy).toBeNull();
    expect(facts.power).toBeNull();
  });

  it("feeds the pattern vocabulary the data it needs to be right", () => {
    // Cost 3 + 1 Power = 4 total. Dropping `power` made this read as a 3-drop.
    const facts = cardFactsFrom({ ...VOID_SEEKER, energy: 7, power: 1 });
    expect(patternsOf(facts)).toContain("bomb");
    expect(patternsOf(cardFactsFrom({ ...VOID_SEEKER, energy: 7, power: 0 }))).not.toContain("bomb");
  });
});
