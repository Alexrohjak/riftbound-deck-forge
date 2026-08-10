import { describe, expect, it } from "vitest";
import { deckFacts, energyCurve, staticCardIndex, type CardEntry, type Deck } from "../src/index.js";

/**
 * 🟢 Tier 1 — facts (DECK-STATS §3).
 *
 * The tier is the contract: everything here must be exactly correct, which in practice
 * means every statistic reports what it could *not* see rather than rounding it into a
 * zero. Most of these tests are about that boundary rather than about the arithmetic.
 */
const CARDS: Record<string, CardEntry> = {
  "unit-fury": {
    name: "Fury Body",
    types: ["unit"],
    domains: ["fury"],
    energy: 2,
    power: 1,
    might: 3,
    text: "[Tank] (I must be dealt with first.)",
  },
  "unit-fury-big": {
    name: "Fury Giant",
    types: ["unit"],
    domains: ["fury"],
    energy: 5,
    power: 2,
    might: 6,
    text: "[Assault 2] (+2 while I'm an attacker.)",
  },
  "spell-calm": {
    name: "Calm Spell",
    types: ["spell"],
    domains: ["calm"],
    energy: 1,
    power: 1,
    might: null,
    text: "Draw a card.",
  },
  "gear-colourless": {
    name: "Plain Gear",
    types: ["gear"],
    domains: ["colorless"],
    energy: 3,
    power: 0,
    might: null,
    text: "",
  },
  /** Two domains and a Power cost — the split is genuinely not in the card data. */
  "unit-dual": {
    name: "Dual Body",
    types: ["unit"],
    domains: ["fury", "order"],
    energy: 4,
    power: 2,
    might: 4,
    text: "",
  },
  /** A unit whose Might the pool does not carry. Different from a spell having none. */
  "unit-mystery": { name: "Mystery Body", types: ["unit"], domains: ["fury"], energy: 2, power: 0 },
  "champ-fury": {
    name: "Fury Champion",
    types: ["unit"],
    superTypes: ["champion"],
    domains: ["fury"],
    energy: 3,
    power: 1,
    might: 4,
    text: "",
  },
  "sig-fury": {
    name: "Fury Signature",
    types: ["spell"],
    superTypes: ["signature"],
    domains: ["fury"],
    energy: 1,
    power: 0,
    might: null,
    text: "",
  },
  "rune-fury": { name: "Fury Rune", types: ["rune"], superTypes: ["basic"], domains: ["fury"] },
  "rune-calm": { name: "Calm Rune", types: ["rune"], superTypes: ["basic"], domains: ["calm"] },
  "bf-one": { name: "Somewhere", types: ["battlefield"], domains: ["colorless"] },
  "legend-x": { name: "A Legend", types: ["legend"], domains: ["fury", "calm"] },
};
const cards = staticCardIndex(CARDS);

const deck = (slots: Deck["slots"], champion = "champ-fury"): Deck => ({
  id: "d",
  name: "t",
  state: "DRAFT",
  legendCardId: "legend-x",
  chosenChampionCardId: champion,
  slots,
});

describe("power demand by domain", () => {
  it("sums the coloured cost per domain, copies included", () => {
    const f = deckFacts(
      deck([
        { cardId: "unit-fury", zone: "MAIN", quantity: 3 }, // 1 Power each
        { cardId: "spell-calm", zone: "MAIN", quantity: 2 }, // 1 Power each
      ]),
      cards,
    );
    // Plus the Chosen Champion's own 1 Fury.
    expect(f.power.byDomain).toEqual({ fury: 4, calm: 2 });
    expect(f.power.total).toBe(6);
  });

  it("refuses to split a two-domain card's cost, and says so", () => {
    const f = deckFacts(deck([{ cardId: "unit-dual", zone: "MAIN", quantity: 2 }], ""), cards);
    expect(f.power.ambiguous).toBe(4);
    expect(f.power.byDomain).toEqual({});
    // It still counts toward the total — the demand is real even when its colour is not known.
    expect(f.power.total).toBe(4);
  });

  it("does not attribute a Power cost to colourless", () => {
    const f = deckFacts(deck([{ cardId: "gear-colourless", zone: "MAIN", quantity: 1 }], ""), cards);
    expect(f.power.total).toBe(0);
    expect(f.power.byDomain).toEqual({});
  });

  it("counts cards whose Power the pool does not carry as unknown", () => {
    const thin = staticCardIndex({ "x": "Nameless" });
    const f = deckFacts(
      { ...deck([{ cardId: "x", zone: "MAIN", quantity: 3 }], ""), legendCardId: "" },
      thin,
    );
    expect(f.power.unknown).toBe(3);
  });
});

describe("type split", () => {
  it("counts units, spells and gear separately, Champion included", () => {
    const f = deckFacts(
      deck([
        { cardId: "unit-fury", zone: "MAIN", quantity: 2 },
        { cardId: "spell-calm", zone: "MAIN", quantity: 3 },
        { cardId: "gear-colourless", zone: "MAIN", quantity: 1 },
      ]),
      cards,
    );
    expect(f.types).toMatchObject({ unit: 3, spell: 3, gear: 1, counted: 7, unknown: 0 });
  });

  it("excludes runes and battlefields, which are registered rather than drawn", () => {
    const f = deckFacts(
      deck(
        [
          { cardId: "unit-fury", zone: "MAIN", quantity: 1 },
          { cardId: "rune-fury", zone: "RUNE", quantity: 12 },
          { cardId: "bf-one", zone: "BATTLEFIELD", quantity: 3 },
        ],
        "",
      ),
      cards,
    );
    expect(f.types.counted).toBe(1);
  });
});

describe("might", () => {
  it("is a spread over units, and a spell is not a unit with no Might", () => {
    const f = deckFacts(
      deck(
        [
          { cardId: "unit-fury", zone: "MAIN", quantity: 2 }, // Might 3
          { cardId: "unit-fury-big", zone: "MAIN", quantity: 1 }, // Might 6
          { cardId: "spell-calm", zone: "MAIN", quantity: 4 },
        ],
        "",
      ),
      cards,
    );
    expect(f.might.counts[3]).toBe(2);
    expect(f.might.counts[6]).toBe(1);
    expect(f.might.units).toBe(3);
    expect(f.might.unknown).toBe(0);
  });

  it("keeps a unit with no Might data out of bucket 0", () => {
    const f = deckFacts(deck([{ cardId: "unit-mystery", zone: "MAIN", quantity: 2 }], ""), cards);
    expect(f.might.unknown).toBe(2);
    expect(f.might.counts[0] ?? 0).toBe(0);
  });
});

describe("keywords", () => {
  it("counts copies carrying each keyword, and matches [Assault 2] as Assault", () => {
    const f = deckFacts(
      deck(
        [
          { cardId: "unit-fury", zone: "MAIN", quantity: 3 },
          { cardId: "unit-fury-big", zone: "MAIN", quantity: 2 },
        ],
        "",
      ),
      cards,
    );
    expect(f.keywords).toEqual({ Tank: 3, Assault: 2 });
  });

  it("ignores a keyword that only appears inside reminder text", () => {
    const reminder = staticCardIndex({
      r: { name: "Explainer", types: ["spell"], domains: ["fury"], text: "Do a thing. (Ignore [Tank].)" },
    });
    const f = deckFacts(
      { ...deck([{ cardId: "r", zone: "MAIN", quantity: 1 }], ""), legendCardId: "" },
      reminder,
    );
    expect(f.keywords.Tank ?? 0).toBe(0);
  });

  it("says when it never had text to read, so zero does not read as none", () => {
    const noText = staticCardIndex({ x: "Nameless" });
    const f = deckFacts(
      { ...deck([{ cardId: "x", zone: "MAIN", quantity: 1 }], ""), legendCardId: "" },
      noText,
    );
    expect(f.keywordsRead).toBe(false);
    expect(f.keywords).toEqual({});
  });
});

describe("rune split and signatures", () => {
  it("reports the Rune Deck by domain", () => {
    const f = deckFacts(
      deck(
        [
          { cardId: "rune-fury", zone: "RUNE", quantity: 7 },
          { cardId: "rune-calm", zone: "RUNE", quantity: 5 },
        ],
        "",
      ),
      cards,
    );
    expect(f.runes).toEqual({ byDomain: { fury: 7, calm: 5 }, total: 12 });
  });

  it("counts Signature cards, which are capped at 3 across the deck", () => {
    const f = deckFacts(deck([{ cardId: "sig-fury", zone: "MAIN", quantity: 3 }], ""), cards);
    expect(f.signatures).toBe(3);
  });
});

describe("the unchosen Champion is not a card", () => {
  it("does not put a phantom into the energy curve", () => {
    const empty = energyCurve(deck([], ""), cards);
    expect(empty.unknown).toBe(0);
    expect(empty.mainDeckSize).toBe(0);
  });

  it("still counts the Champion once it exists", () => {
    const curve = energyCurve(deck([]), cards);
    expect(curve.mainDeckSize).toBe(1);
    expect(curve.counts[3]).toBe(1);
  });
});
