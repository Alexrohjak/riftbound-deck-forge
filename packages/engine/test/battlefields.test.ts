import { describe, expect, it } from "vitest";
import { classify, reviewBattlefields } from "../src/advice/battlefields.js";
import { staticCardIndex } from "../src/cardIndex.js";
import type { CardFacts, Deck } from "../src/types.js";

/**
 * ⚠️ **The texts below are the real printed ones**, because this is a text classifier and a
 * fixture written to suit the regex proves only that the regex matches itself. Every card
 * named here is one the classifier got wrong at some point, or one
 * [`BATTLEFIELD-GUIDE`](../../../docs/reference/BATTLEFIELD-GUIDE.md) uses to make its case.
 */

const bf = (name: string, text: string): CardFacts => ({ name, types: ["battlefield"], text });

describe("who the text pays", () => {
  it("one-sided when only the controller is named", () => {
    expect(classify(bf("Altar to Unity", "When you hold here, play a 1 :rb_might: Recruit unit token in your base.")).class)
      .toBe("oneSided");
  });

  it("symmetric when units are spoken of in general", () => {
    // The guide's own magnitude example: +1 to everything flips 0.0% of combats.
    expect(classify(bf("Trifarian War Camp", "Units here have +1 :rb_might:. (This includes attackers.)")).class)
      .toBe("symmetric");
  });

  it("⚠️ naming another player beats a `you` trigger", () => {
    // "When YOU hold here, EACH PLAYER channels" — you pull the lever, both sides are paid.
    // Reading only the trigger files this as one-sided, which is the error the class exists
    // to prevent.
    expect(classify(bf("The Papertree", "When you hold here, each player channels 1 rune exhausted.")).class)
      .toBe("symmetric");
  });

  it("⚠️ `friendly` in reminder text is not self-scoping", () => {
    // This put the guide's own flagship ASYMMETRIC example in the one-sided class: a -2 to a
    // lone defender flips 40.8% of combats, and it does it to whoever is defending alone.
    expect(
      classify(
        bf(
          "Forbidding Waste",
          "While a unit here is defending alone, it has -2 :rb_might:. (It's alone if there are no other friendly units here.)",
        ),
      ).class,
    ).toBe("symmetric");
    expect(
      classify(
        bf(
          "The Dreaming Tree",
          "When a player chooses a friendly unit here with a spell for the first time each turn, they draw 1.",
        ),
      ).class,
    ).toBe("symmetric");
  });

  it("restriction when it constrains or taxes the board", () => {
    expect(classify(bf("Rockfall Path", "Units can't be played here.")).class).toBe("restriction");
    expect(classify(bf("Forgotten Monument", "Players can't score here until their third turn.")).class)
      .toBe("restriction");
  });

  it("⚠️ a tax on YOU is one-sided, not a restriction on the board", () => {
    // Filing this as a restriction would imply it taxes the opponent. It does the opposite.
    const helia = classify(bf("Vaults of Helia", "When you hold here, your non-token units cost :rb_energy_1: more to play this turn."));
    expect(helia.class).toBe("oneSided");
    // And the class must not be read as "safe" — this is the counterexample that proves it.
    expect(helia.because).toContain("valence");
  });

  it("says it cannot read a text rather than guessing", () => {
    expect(classify(bf("Blank", "")).class).toBe("unclear");
    expect(classify(bf("Odd", "Something nobody has modelled.")).class).toBe("unclear");
  });
});

describe("what has to happen for it to pay", () => {
  it("reads the trigger off the text", () => {
    expect(classify(bf("A", "When you hold here, draw 1.")).trigger).toBe("hold");
    expect(classify(bf("B", "When you conquer here, draw 1.")).trigger).toBe("conquer");
    expect(classify(bf("C", "When you defend here, choose a unit.")).trigger).toBe("defend");
    expect(classify(bf("D", "Units here have [Ganking].")).trigger).toBe("passive");
  });
});

describe("the three you register", () => {
  const facts: Record<string, CardFacts> = {
    hold1: bf("Grove of the God-Willow", "When you hold here, draw 1."),
    hold2: bf("Startipped Peak", "When you hold here, you may channel 1 rune exhausted."),
    hold3: bf("Navori Fighting Pit", "When you hold here, buff a unit here."),
    conquer1: bf("Sigil of the Storm", "When you conquer here, recycle one of your runes."),
    sym: bf("Trifarian War Camp", "Units here have +1 :rb_might:."),
    legend: { name: "L", types: ["legend"] },
  };
  const index = staticCardIndex(facts);
  const deck = (ids: string[]): Deck => ({
    id: "d",
    name: "d",
    state: "DRAFT",
    legendCardId: "legend",
    chosenChampionCardId: "",
    slots: ids.map((cardId) => ({ cardId, zone: "BATTLEFIELD" as const, quantity: 1 })),
  });

  it("⚠️ three that all pay on the same trigger is a checkable fault", () => {
    // Only 1 of your 3 is used per game, so the guide asks for three different answers. Three
    // `hold` battlefields only pay you when you are already ahead.
    const r = reviewBattlefields(deck(["hold1", "hold2", "hold3"]), index);
    expect(r.varied).toBe(false);
    expect(r.sharedTrigger).toBe("hold");
  });

  it("a mixed set is varied", () => {
    const r = reviewBattlefields(deck(["hold1", "conquer1", "sym"]), index);
    expect(r.varied).toBe(true);
    expect(r.sharedTrigger).toBeUndefined();
  });

  it("⚠️ a symmetric pick with no stated reason is refused, not defaulted", () => {
    // Alexander's floor: one-sided meets it by its class; symmetric has to earn it, and
    // silence is a refusal rather than a default.
    const r = reviewBattlefields(deck(["hold1", "conquer1", "sym"]), index);
    expect(r.unjustified.map((b) => b.name)).toEqual(["Trifarian War Camp"]);
  });

  it("a stated reason clears it — the engine checks one exists, never whether it is good", () => {
    const r = reviewBattlefields(deck(["hold1", "conquer1", "sym"]), index, new Set(["sym"]));
    expect(r.unjustified).toEqual([]);
  });

  it("a one-sided pick never needs justifying", () => {
    const r = reviewBattlefields(deck(["hold1", "hold2", "conquer1"]), index);
    expect(r.unjustified).toEqual([]);
  });
});
