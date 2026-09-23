import { describe, expect, it } from "vitest";
import {
  checkGamePlan,
  emptyGamePlan,
  planRecord,
  validateGamePlan,
  type GamePlan,
  type MatchRecord,
} from "../src/index.js";
import type { CardIndex, Deck } from "../src/types.js";

/**
 * Three promises, each one a way the page could lie:
 *
 * 1. **A stale plan still saves.** Shape is validated on write; fit to the deck is not, or the
 *    page would refuse edits exactly when the deck has moved on.
 * 2. **Staleness is shown, by name.** A swap naming the alt-art printing still matches the
 *    copy in the sideboard.
 * 3. **The record keeps the log's thresholds.** A 2-0 is two games, never "100%".
 */

const NAMES: Record<string, string> = {
  "leg-azir": "Emperor of the Sands",
  "leg-azir-alt": "Emperor of the Sands",
  "leg-ornn": "Fire Below the Mountain",
  champ: "Kai'Sa, Survivor",
  thermo: "Thermo Beam",
  "thermo-alt": "Thermo Beam",
  eclipse: "Eclipse",
  fortress: "Frozen Fortress",
  rockfall: "Rockfall Path",
  nowhere: "Treasure Hoard",
};
const index: CardIndex = { nameOf: (id) => NAMES[id] };

const deck: Deck = {
  id: "kaisa",
  name: "Kai'Sa",
  state: "BUILT",
  legendCardId: "leg-kaisa",
  chosenChampionCardId: "champ",
  slots: [
    { cardId: "eclipse", zone: "MAIN", quantity: 2 },
    { cardId: "thermo", zone: "SIDEBOARD", quantity: 2 },
    { cardId: "fortress", zone: "BATTLEFIELD", quantity: 1 },
    { cardId: "rockfall", zone: "BATTLEFIELD", quantity: 1 },
  ],
};

const plan = (over: Partial<GamePlan> = {}): GamePlan => ({
  ...emptyGamePlan(),
  battlefields: [{ cardId: "fortress", why: "Kills 1-Might tokens" }],
  matchups: [
    {
      id: "azir",
      legendCardId: "leg-azir",
      battlefield: { cardId: "fortress", why: "Plus Bellows Breath kills a Sand Soldier" },
      bringIn: [{ cardId: "thermo-alt", quantity: 2 }],
      takeOut: [{ cardId: "eclipse", quantity: 2 }],
      watchFor: [{ text: "Equipment on Sand Soldiers", voice: "ours" }],
      playAround: [],
    },
  ],
  ...over,
});

describe("validateGamePlan", () => {
  it("accepts a well-formed plan", () => {
    expect(validateGamePlan(plan())).toEqual([]);
  });

  it("does not ask whether the swaps fit the deck — a stale plan must still save", () => {
    const stale = plan();
    stale.matchups[0]!.bringIn = [{ cardId: "not-in-any-deck", quantity: 3 }];
    expect(validateGamePlan(stale)).toEqual([]);
  });

  it("refuses a matchup against nobody", () => {
    const p = plan();
    p.matchups[0]!.legendCardId = null;
    expect(validateGamePlan(p).join(" ")).toMatch(/legendCardId or an archetype/);
  });

  it("refuses a sentence with no voice", () => {
    const p = plan({ winPlan: [{ text: "Out-grind them", voice: "vibes" as never }] });
    expect(validateGamePlan(p).join(" ")).toMatch(/voice/);
  });

  it("refuses two matchups sharing an id, so an edit cannot hit the wrong one", () => {
    const p = plan();
    p.matchups.push({ ...p.matchups[0]! });
    expect(validateGamePlan(p).join(" ")).toMatch(/used twice/);
  });
});

describe("checkGamePlan", () => {
  it("finds nothing wrong with a plan that fits, matching printings by name", () => {
    expect(checkGamePlan(plan(), deck, index)).toEqual([]);
  });

  it("says when a swap is no longer one for one", () => {
    const p = plan();
    p.matchups[0]!.takeOut = [{ cardId: "eclipse", quantity: 1 }];
    expect(checkGamePlan(p, deck, index).map((i) => i.message).join(" ")).toMatch(
      /2 in and 1 out/,
    );
  });

  it("says when the sideboard no longer holds what a matchup brings in", () => {
    const cut: Deck = { ...deck, slots: deck.slots.filter((s) => s.zone !== "SIDEBOARD") };
    const issues = checkGamePlan(plan(), cut, index);
    expect(issues[0]).toEqual({
      matchupId: "azir",
      message: "Brings in 2 Thermo Beam, and the sideboard has 0.",
    });
  });

  it("counts the Chosen Champion as a Main Deck card that can be sided out", () => {
    const p = plan();
    p.matchups[0]!.takeOut = [
      { cardId: "eclipse", quantity: 1 },
      { cardId: "champ", quantity: 1 },
    ];
    expect(checkGamePlan(p, deck, index)).toEqual([]);
  });

  it("flags a battlefield the deck does not register", () => {
    const p = plan({ battlefields: [{ cardId: "nowhere", why: "" }] });
    expect(checkGamePlan(p, deck, index)[0]!.matchupId).toBeNull();
  });
});

describe("planRecord", () => {
  const match = (over: Partial<MatchRecord>): MatchRecord => ({
    id: Math.random().toString(36),
    deckId: "kaisa",
    playedAt: "2026-09-22",
    result: "LOSS",
    format: "1v1",
    ...over,
  });

  it("puts the games on the matchup, by Legend name, with no rate below the threshold", () => {
    const record = planRecord(
      plan(),
      [match({ opponentLegend: "leg-azir-alt" }), match({ opponentLegend: "leg-azir-alt" })],
      index.nameOf,
    );
    const s = record.byMatchup.get("azir")!;
    expect(s.losses).toBe(2);
    expect(s.rate).toBeNull();
    expect(s.withheld).toBeTruthy();
  });

  it("names the Legends you have faced and have no plan for", () => {
    const record = planRecord(plan(), [match({ opponentLegend: "leg-ornn", result: "WIN" })], index.nameOf);
    expect(record.unplanned.map((u) => u.legendCardId)).toEqual(["leg-ornn"]);
  });

  it("does not count a three-way pod as a matchup", () => {
    const record = planRecord(
      plan(),
      [match({ opponentLegend: "leg-azir", format: "1v1v1" })],
      index.nameOf,
    );
    expect(record.byMatchup.size).toBe(0);
  });
});
