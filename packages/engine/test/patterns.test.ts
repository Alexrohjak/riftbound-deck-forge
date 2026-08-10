import { describe, expect, it } from "vitest";
import {
  deckFacts,
  hasKeyword,
  leadingKeywords,
  patternCensus,
  patternsOf,
  PATTERNS,
  staticCardIndex,
  type CardEntry,
  type CardFacts,
  type Deck,
} from "../src/index.js";

/**
 * The pattern vocabulary (EVALUATION §5.1) and the text reading it depends on.
 *
 * ⚠️ The fixtures are shaped from **real cards in the pool**, because every definition here
 * was calibrated against it and two of them were wrong until it was checked.
 */

describe("leadingKeywords — mentioning is not having", () => {
  it("reads the keywords a card opens with, reminder text and all", () => {
    expect(leadingKeywords("[Tank] (I must be dealt with first.)")).toEqual(["Tank"]);
    expect(leadingKeywords("[Assault 2] (+2 while I'm an attacker.)")).toEqual(["Assault"]);
    expect(leadingKeywords("[Deathknell] — Deal 4 to all units at my battlefield.")).toEqual([
      "Deathknell",
    ]);
  });

  it("reads a run of several", () => {
    expect(
      leadingKeywords("[Hidden] (Hide now to react later.) [Action] (Play on your turn.) Buff it."),
    ).toEqual(["Hidden", "Action"]);
  });

  /**
   * The regression this module exists for. Every card below was counted as *carrying* a
   * keyword by a substring search, and none of them does — 48 of 814 in the real pool, in a
   * panel labelled "fact".
   */
  it.each([
    ["Cleave grants it", "[Action] (Play on your turn.) Give a unit [Assault 3] this turn.", "Assault"],
    ["Captain Farron gives it away", "Other friendly units here have [Assault].", "Assault"],
    ["Noxus Saboteur talks about the opponent's", "Your opponents' [Hidden] cards can't be revealed here.", "Hidden"],
    ["Sun Disc uses it as a cost", ":rb_exhaust:: [Legion] — The next unit enters ready.", "Legion"],
    ["Raging Soul only conditionally has it", "If you've discarded a card this turn, I have [Assault].", "Assault"],
  ])("does not credit a card that only mentions a keyword — %s", (_why, text, keyword) => {
    expect(hasKeyword(text, keyword)).toBe(false);
  });

  it("still credits the card that genuinely leads with it", () => {
    expect(hasKeyword("[Assault 3] (+3 while I'm an attacker.) I enter ready.", "Assault")).toBe(true);
  });
});

const facts = (over: Partial<CardFacts>): CardFacts => ({ name: "X", ...over });

describe("patterns are earned, not asserted", () => {
  it("gives every pattern in the spec a computable definition", () => {
    expect(PATTERNS).toHaveLength(12);
    for (const spec of PATTERNS) {
      expect(spec.definition.length).toBeGreaterThan(10);
      expect(typeof spec.matches).toBe("function");
    }
  });

  it("cheap Might swing needs all three of: timing, cost and a Might change", () => {
    const swing = facts({ timing: "Action", energy: 1, power: 1, produces: ["pump"] });
    expect(patternsOf(swing)).toContain("cheap-might-swing");
    // Too expensive.
    expect(patternsOf({ ...swing, energy: 3 })).not.toContain("cheap-might-swing");
    // Right cost, but does nothing to Might.
    expect(patternsOf({ ...swing, produces: ["draw"] })).not.toContain("cheap-might-swing");
    // ⚠️ Power counts toward the cost: 2 Energy + 1 Power is a 3-cost card.
    expect(patternsOf({ ...swing, energy: 2, power: 1 })).not.toContain("cheap-might-swing");
  });

  it("counts a hidden trick, which is annotated as an Action", () => {
    // Stand United's real shape: timing "Action", text leading with [Hidden].
    const hiddenTrick = facts({
      timing: "Action",
      energy: 0,
      power: 0,
      produces: ["pump", "buff"],
      text: "[Hidden] (Hide now to react later.)",
    });
    expect(patternsOf(hiddenTrick)).toContain("cheap-might-swing");
    expect(patternsOf(hiddenTrick)).toContain("ambush-threat");
  });

  it("does not call a body an ambush threat for talking about hiding", () => {
    // Noxus Saboteur. It is annotated `timing: "Hidden"`, which is why the timing field is
    // deliberately not consulted here.
    const saboteur = facts({
      timing: "Hidden",
      role: "body",
      energy: 2,
      text: "Your opponents' [Hidden] cards can't be revealed here.",
    });
    expect(patternsOf(saboteur)).not.toContain("ambush-threat");
  });

  it("separates a sweep from spot removal, because they answer different problems", () => {
    const sweep = facts({
      produces: ["damage"],
      role: "removal-damage",
      text: "Deal 1 to all units at battlefields.",
    });
    const spot = facts({ produces: ["kill"], role: "removal-kill", text: "Kill a unit." });
    expect(patternsOf(sweep)).toContain("sweep");
    expect(patternsOf(sweep)).not.toContain("spot-removal");
    expect(patternsOf(spot)).toContain("spot-removal");
    expect(patternsOf(spot)).not.toContain("sweep");
  });

  it("counts total cost for a bomb, not Energy alone", () => {
    expect(patternsOf(facts({ energy: 7, power: 1 }))).toContain("bomb");
    expect(patternsOf(facts({ energy: 7, power: 0 }))).not.toContain("bomb");
  });

  it("lets one card match several patterns, because cards do", () => {
    const both = facts({ produces: ["kill", "token"], role: "body+removal" });
    expect(patternsOf(both)).toEqual(expect.arrayContaining(["spot-removal", "go-wide"]));
  });
});

describe("the census speaks in patterns, not lists", () => {
  const CARDS: Record<string, CardEntry> = {
    kill: { name: "Kill It", types: ["spell"], role: "removal-kill", produces: ["kill"], energy: 2 },
    kill2: { name: "Kill It Twice", types: ["spell"], role: "removal-kill", produces: ["kill"], energy: 3 },
    kill3: { name: "Kill It Again", types: ["spell"], role: "removal-kill", produces: ["kill"], energy: 4 },
    kill4: { name: "Kill It More", types: ["spell"], role: "removal-kill", produces: ["kill"], energy: 5 },
    wide: { name: "Make Two", types: ["spell"], role: "token-maker", produces: ["token"], energy: 3 },
    plain: { name: "Just A Body", types: ["unit"], role: "body", energy: 2, might: 3 },
    legend: { name: "A Legend", types: ["legend"] },
  };
  const cards = staticCardIndex(CARDS);
  const deck: Deck = {
    id: "d",
    name: "t",
    state: "DRAFT",
    legendCardId: "legend",
    chosenChampionCardId: "",
    slots: [
      { cardId: "kill", zone: "MAIN", quantity: 3 },
      { cardId: "kill2", zone: "MAIN", quantity: 3 },
      { cardId: "kill3", zone: "MAIN", quantity: 2 },
      { cardId: "kill4", zone: "MAIN", quantity: 1 },
      { cardId: "wide", zone: "MAIN", quantity: 2 },
      { cardId: "plain", zone: "MAIN", quantity: 3 },
    ],
  };

  it("counts copies and distinct cards separately", () => {
    const removal = patternCensus(deck, cards).find((p) => p.pattern === "spot-removal");
    expect(removal).toMatchObject({ copies: 9, cards: 4 });
  });

  it("names at most three cards, however many qualify (D-039)", () => {
    const removal = patternCensus(deck, cards).find((p) => p.pattern === "spot-removal");
    expect(removal?.examples).toHaveLength(3);
  });

  it("leads with what the deck does most of", () => {
    const census = patternCensus(deck, cards);
    expect(census[0]?.pattern).toBe("spot-removal");
  });

  it("says nothing about a pattern the deck has none of", () => {
    expect(patternCensus(deck, cards).map((p) => p.pattern)).not.toContain("hard-counter");
  });
});

describe("Tier 1 keyword counts use the same reading", () => {
  it("no longer credits a card that merely grants a keyword", () => {
    const cards = staticCardIndex({
      cleave: {
        name: "Cleave",
        types: ["spell"],
        energy: 1,
        text: "[Action] (Play on your turn.) Give a unit [Assault 3] this turn.",
      },
      tanky: { name: "Tanky", types: ["unit"], energy: 2, text: "[Tank] (Dealt damage first.)" },
      legend: { name: "L", types: ["legend"] },
    });
    const f = deckFacts(
      {
        id: "d",
        name: "t",
        state: "DRAFT",
        legendCardId: "legend",
        chosenChampionCardId: "",
        slots: [
          { cardId: "cleave", zone: "MAIN", quantity: 3 },
          { cardId: "tanky", zone: "MAIN", quantity: 2 },
        ],
      },
      cards,
    );
    expect(f.keywords.Assault ?? 0).toBe(0);
    expect(f.keywords.Tank).toBe(2);
  });
});

describe("spot removal means a unit", () => {
  it("does not count gear removal, however it is annotated", () => {
    // Brittle Steel's real shape: role removal-kill, produces kill — and it kills a gear.
    const gear = {
      name: "Brittle Steel",
      role: "removal-kill",
      produces: ["banish", "kill", "trashplay"],
      text: "Kill a gear. [Flow] (You may play this from your trash.)",
    };
    expect(patternsOf(gear)).not.toContain("spot-removal");
    // It is still recursion — the [Flow] half of the card is real.
    expect(patternsOf(gear)).toContain("recursion");
  });

  it("still counts a card that kills a unit and happens to mention gear", () => {
    const unit = {
      name: "Both",
      role: "removal-kill",
      produces: ["kill"],
      text: "Kill a unit or kill a gear.",
    };
    expect(patternsOf(unit)).toContain("spot-removal");
  });
});
