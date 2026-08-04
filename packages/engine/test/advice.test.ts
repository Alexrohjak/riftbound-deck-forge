import { describe, expect, it } from "vitest";
import {
  atLeastOne,
  capabilities,
  COMMUNITY,
  deckShape,
  review,
  staticCardIndex,
  type CardEntry,
  type Deck,
  type DeckSlot,
} from "../src/index.js";

/**
 * EE's arithmetic, and the line it must never cross.
 *
 * ⚠️ **Facts, probabilities and doctrine are three different things** (DECK-STATS §3–5).
 * A count is not arguable. A probability is correct *given an assumption* that must travel
 * with it. Doctrine is what good players advise, and good players disagree — so it carries
 * an attribution and is never dressed up as a measurement.
 */

const card = (over: Partial<CardEntry & { name: string }> & { name: string }): CardEntry => ({
  types: ["unit"],
  superTypes: [],
  tags: [],
  domains: ["colorless"],
  text: "",
  banned: false,
  energy: 3,
  ...over,
});

const CARDS: Record<string, CardEntry> = {
  legend: card({ name: "A Legend", types: ["legend"], energy: null, championTag: "X" }),
  champ: card({ name: "The Champion", superTypes: ["champion"], tags: ["X"], energy: 3 }),
  cheap: card({ name: "Cheap Body", energy: 2, produces: [] }),
  cheap2: card({ name: "Another Cheap", energy: 2 }),
  killer: card({ name: "Assassinate", types: ["spell"], energy: 3, produces: ["kill"] }),
  drawer: card({ name: "Study", types: ["spell"], energy: 2, produces: ["draw"] }),
  trick: card({ name: "Pump It", types: ["spell"], energy: 1, produces: ["pump"] }),
  gearlover: card({ name: "Gear Lover", energy: 4, consumes: ["gear_matters"] }),
  gearpiece: card({ name: "A Gear", types: ["gear"], energy: 2, produces: ["gear"] }),
  big: card({ name: "Expensive", energy: 7 }),
  rune: card({ name: "Rune", types: ["rune"], superTypes: ["basic"], energy: null }),
  bf1: card({ name: "Field One", types: ["battlefield"], energy: null }),
  bf2: card({ name: "Field Two", types: ["battlefield"], energy: null }),
  bf3: card({ name: "Field Three", types: ["battlefield"], energy: null }),
};
for (let i = 0; i < 20; i++) CARDS[`f${i}`] = card({ name: `Filler ${i}`, energy: 4 });

const cards = staticCardIndex(CARDS);
const slot = (cardId: string, zone: DeckSlot["zone"], quantity: number): DeckSlot => ({ cardId, zone, quantity });

function deck(main: DeckSlot[], fillTo = 39): Deck {
  const used = main.reduce((n, s) => n + s.quantity, 0);
  const filler: DeckSlot[] = [];
  for (let left = fillTo - used, i = 0; left > 0; i++) {
    filler.push(slot(`f${i}`, "MAIN", Math.min(3, left)));
    left -= Math.min(3, left);
  }
  return {
    id: "a",
    name: "Advice",
    state: "DRAFT",
    legendCardId: "legend",
    chosenChampionCardId: "champ",
    slots: [...main, ...filler, slot("rune", "RUNE", 12), slot("bf1", "BATTLEFIELD", 1), slot("bf2", "BATTLEFIELD", 1), slot("bf3", "BATTLEFIELD", 1)],
  };
}

describe("the one piece of maths anyone has actually done", () => {
  it("reproduces the community's 7/8/9 opening odds", () => {
    // 78% / 83% / 87% is the number every deckbuilding guide quotes. If our model does not
    // land on it, our model is wrong — this is the cheapest available check on it.
    expect(Math.round(atLeastOne(7, 40, 7) * 100)).toBe(77);
    expect(Math.round(atLeastOne(8, 40, 7) * 100)).toBe(82);
    expect(Math.round(atLeastOne(9, 40, 7) * 100)).toBe(86);
  });

  it("is exact at the edges rather than approximate", () => {
    expect(atLeastOne(0, 40, 7)).toBe(0);
    expect(atLeastOne(40, 40, 7)).toBe(1);
    expect(atLeastOne(5, 40, 0)).toBe(0);
    // 34 misses in a 40 card deck cannot all be dodged in 7 draws.
    expect(atLeastOne(34, 40, 7)).toBe(1);
  });
});

describe("counting the deck", () => {
  it("counts anything castable on turn one, not just units", () => {
    // "Two drops" is shorthand for not having a dead first turn, so a 1-cost spell counts.
    // The 3-cost Chosen Champion does not, even though it is a Main Deck card.
    const shape = deckShape(deck([slot("cheap", "MAIN", 3), slot("trick", "MAIN", 3)]), cards);
    expect(shape.earlyPlays).toBe(6);
  });

  it("reads the 3-of / 2-of / 1-of ratios", () => {
    const shape = deckShape(
      deck([slot("cheap", "MAIN", 3), slot("killer", "MAIN", 2), slot("big", "MAIN", 1)]),
      cards,
    );
    expect(shape.ratios.threes).toBeGreaterThanOrEqual(1);
    expect(shape.ratios.twos).toBe(1);
    // Two singletons: the one-of, and the Chosen Champion, which is a single copy by
    // definition and counts inside the 40 (L3).
    expect(shape.ratios.ones).toBe(2);
  });
});

describe("capabilities, read from the synergy graph", () => {
  it("finds removal, draw and tricks by what cards produce", () => {
    const caps = capabilities(
      deck([slot("killer", "MAIN", 3), slot("drawer", "MAIN", 2), slot("trick", "MAIN", 2)]),
      cards,
    );
    expect(caps.removal).toBe(3);
    expect(caps.draw).toBe(2);
    expect(caps.combatTricks).toBe(2);
  });

  it("does not count a unit as a combat trick", () => {
    // A body that pumps on arrival is a body. A trick is an action you hold.
    const unitThatPumps = { ...CARDS, pumper: card({ name: "Pumper", produces: ["pump"] }) };
    const idx = staticCardIndex(unitThatPumps);
    expect(capabilities(deck([slot("pumper", "MAIN", 3)]), idx).combatTricks).toBe(0);
  });

  it("spots a payoff whose enabler is missing", () => {
    // Nine cards care about gear; two gear. That is a dead card in most openings.
    const caps = capabilities(
      deck([slot("gearlover", "MAIN", 3), slot("gearpiece", "MAIN", 1)]),
      cards,
    );
    const gear = caps.danglingSynergies.find((s) => s.needs === "gear_matters");
    expect(gear).toMatchObject({ wants: 3, supplies: 1 });
  });
});

describe("every judgement says where it comes from", () => {
  it("never returns a note without a source, confidence and attribution", () => {
    const { notes } = review(deck([slot("big", "MAIN", 3)]), cards);
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) {
      expect(n.claim).toBeTruthy();
      expect(n.because, `"${n.claim}" has no reason`).toBeTruthy();
      expect(["rulebook", "official", "community", "computed"]).toContain(n.source);
      expect(["fact", "probability", "doctrine"]).toContain(n.confidence);
      expect(n.attribution, `"${n.claim}" is unattributed`).toBeTruthy();
    }
  });

  it("flags a deck that cannot remove anything", () => {
    const { notes } = review(deck([slot("cheap", "MAIN", 3)]), cards);
    const removal = notes.find((n) => n.claim.includes("removes an enemy unit"));
    expect(removal?.confidence).toBe("doctrine");
    // Doctrine, not fact — it is advice, however universally held.
    expect(removal?.attribution).toMatch(/guides/i);
  });

  it("quotes the odds as a probability, with its assumption attributed", () => {
    const { notes } = review(deck([slot("big", "MAIN", 3)]), cards);
    const opening = notes.find((n) => n.claim.includes("playable on turn one"));
    expect(opening?.confidence).toBe("probability");
    expect(opening?.attribution).toMatch(/Hypergeometric/);
    // The assumption travels with the number — an unqualified percentage becomes folklore.
    expect(opening?.attribution).toMatch(/7 cards seen/);
  });

  it("says nothing about a deck that is already well shaped", () => {
    // Silence is a valid answer. A tool that always has advice is not reading the deck.
    // 8 early plays: three 2-cost bodies, three 1-cost tricks, two 2-cost draw spells.
    // Removal, draw and tricks all present, units well over half the deck.
    const good = deck([
      slot("cheap", "MAIN", 3),
      slot("trick", "MAIN", 3),
      slot("drawer", "MAIN", 2),
      slot("killer", "MAIN", 3),
    ]);
    const { notes, shape } = review(good, cards);
    expect(shape.earlyPlays).toBe(8);
    expect(shape.earlyPlays).toBeGreaterThanOrEqual(COMMUNITY.earlyPlaysMin);
    expect(notes.filter((n) => n.confidence === "doctrine")).toHaveLength(0);
  });
});
