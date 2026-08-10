import { describe, expect, it } from "vitest";
import {
  atLeast,
  atLeastOne,
  championAccess,
  playableOptions,
  runeFeasibility,
  simulateOpenings,
  staticCardIndex,
  type CardEntry,
  type Deck,
} from "../src/index.js";

/**
 * 🟡 Tier 2 — probabilities (DECK-STATS §4).
 *
 * ⚠️ The reference values below were computed independently with exact binomial
 * coefficients, not read off this implementation. A probability test that asserts whatever
 * the code already returns proves only that the code is deterministic.
 */
const CARDS: Record<string, CardEntry> = {
  "rune-fury": { name: "Fury Rune", types: ["rune"], superTypes: ["basic"], domains: ["fury"] },
  "rune-calm": { name: "Calm Rune", types: ["rune"], superTypes: ["basic"], domains: ["calm"] },
  /** Costs 2 Fury Power — the card the flagship example is about. */
  "fury-2p": {
    name: "Fury Two Power",
    types: ["unit"],
    domains: ["fury"],
    energy: 2,
    power: 2,
    might: 3,
  },
  "calm-2p": {
    name: "Calm Two Power",
    types: ["unit"],
    domains: ["calm"],
    energy: 3,
    power: 2,
    might: 4,
  },
  "cheap-unit": {
    name: "Cheap Unit",
    types: ["unit"],
    domains: ["fury"],
    energy: 1,
    power: 0,
    might: 1,
  },
  "big-unit": {
    name: "Big Unit",
    types: ["unit"],
    domains: ["fury"],
    energy: 6,
    power: 0,
    might: 8,
  },
  "champ": {
    name: "The Champion",
    types: ["unit"],
    superTypes: ["champion"],
    domains: ["fury"],
    energy: 3,
    power: 0,
    might: 4,
  },
  "legend-x": { name: "A Legend", types: ["legend"], domains: ["fury", "calm"] },
};
const cards = staticCardIndex(CARDS);

/** A 7 Fury / 5 Calm rune deck — the split DECK-STATS §2 uses to explain the tension. */
const split = (fury: number) => [
  { cardId: "rune-fury", zone: "RUNE" as const, quantity: fury },
  { cardId: "rune-calm", zone: "RUNE" as const, quantity: 12 - fury },
];

const deck = (slots: Deck["slots"], champion = "champ"): Deck => ({
  id: "d",
  name: "t",
  state: "DRAFT",
  legendCardId: "legend-x",
  chosenChampionCardId: champion,
  slots,
});

describe("atLeast — exact hypergeometric", () => {
  it("agrees with atLeastOne when k is 1", () => {
    for (const [K, N, c] of [
      [7, 12, 6],
      [3, 40, 7],
      [1, 40, 12],
    ] as const) {
      expect(atLeast(K, N, c, 1)).toBeCloseTo(atLeastOne(K, N, c), 12);
    }
  });

  it("matches values computed independently with binomial coefficients", () => {
    // 12-rune deck, 7 Fury, 6 channelled: P(>=2) = 1 - [C(7,1)C(5,5)] / C(12,6) = 917/924.
    expect(atLeast(7, 12, 6, 2)).toBeCloseTo(0.99242, 5);
    expect(atLeast(7, 12, 2, 2)).toBeCloseTo(0.31818, 5);
    expect(atLeast(7, 12, 4, 2)).toBeCloseTo(0.84848, 5);
    expect(atLeast(5, 12, 4, 2)).toBeCloseTo(0.57576, 5);
    expect(atLeast(8, 12, 4, 2)).toBeCloseTo(0.93333, 5);
    expect(atLeast(4, 12, 4, 2)).toBeCloseTo(0.40606, 5);
  });

  it("is 1 for a cost of nothing and 0 when the deck cannot supply it", () => {
    expect(atLeast(0, 12, 6, 0)).toBe(1);
    expect(atLeast(1, 12, 6, 2)).toBe(0);
    expect(atLeast(7, 12, 1, 2)).toBe(0);
  });
});

describe("rune feasibility — the flagship", () => {
  it("reads the cost off the deck and rises with the turn", () => {
    const f = runeFeasibility(
      deck([...split(7), { cardId: "fury-2p", zone: "MAIN", quantity: 3 }], ""),
      cards,
    );
    expect(f.runeDeckSize).toBe(12);
    const row = f.rows.find((r) => r.domain === "fury" && r.cost === 2);
    expect(row?.cards).toBe(3);
    expect(row?.p[0]).toBeCloseTo(0.31818, 5); // turn 1, 2 channelled
    expect(row?.p[1]).toBeCloseTo(0.84848, 5); // turn 2, 4 channelled
    expect(row?.p[2]).toBeCloseTo(0.99242, 5); // turn 3, 6 channelled
  });

  it("shows the trade-off the spec is about: more Fury costs Calm", () => {
    const at = (fury: number, domain: string) =>
      runeFeasibility(
        deck(
          [
            ...split(fury),
            { cardId: "fury-2p", zone: "MAIN", quantity: 1 },
            { cardId: "calm-2p", zone: "MAIN", quantity: 1 },
          ],
          "",
        ),
        cards,
      ).rows.find((r) => r.domain === domain)?.p[1];

    expect(at(7, "fury")).toBeCloseTo(0.84848, 5);
    expect(at(8, "fury")).toBeCloseTo(0.93333, 5);
    // ...and the same move drops Calm on the same turn. Two numbers, never composited.
    expect(at(7, "calm")).toBeCloseTo(0.57576, 5);
    expect(at(8, "calm")).toBeCloseTo(0.40606, 5);
  });

  it("never guesses a two-domain card's colour", () => {
    const dual = staticCardIndex({
      ...CARDS,
      "dual-2p": { name: "Dual", types: ["unit"], domains: ["fury", "calm"], energy: 2, power: 2 },
    });
    const f = runeFeasibility(
      deck([...split(7), { cardId: "dual-2p", zone: "MAIN", quantity: 3 }], ""),
      dual,
    );
    expect(f.rows).toEqual([]);
  });

  it("always states its assumptions, because a bare percentage becomes folklore", () => {
    const f = runeFeasibility(deck([...split(7)], ""), cards);
    expect(f.assumptions.join(" ")).toMatch(/no recycling/);
    expect(f.assumptions.join(" ")).toMatch(/exhausted for Energy and then recycled/);
  });
});

describe("chosen champion access", () => {
  it("counts the Champion slot and any copies of the same name together", () => {
    const a = championAccess(
      deck([
        { cardId: "champ", zone: "MAIN", quantity: 2 },
        { cardId: "cheap-unit", zone: "MAIN", quantity: 37 },
      ]),
      cards,
    );
    expect(a.copies).toBe(3);
    // Rising, and never above 1.
    expect(a.p[0]).toBeGreaterThan(0.3);
    expect(a.p[5]).toBeGreaterThan(a.p[0] as number);
    expect(Math.max(...a.p)).toBeLessThanOrEqual(1);
  });

  it("is zero when no Champion is chosen", () => {
    const a = championAccess(deck([{ cardId: "cheap-unit", zone: "MAIN", quantity: 39 }], ""), cards);
    expect(a.copies).toBe(0);
    expect(a.p.every((p) => p === 0)).toBe(true);
  });
});

describe("playable options — flexibility, defined", () => {
  it("counts distinct cards, not copies", () => {
    const f = playableOptions(
      deck(
        [
          ...split(7),
          { cardId: "cheap-unit", zone: "MAIN", quantity: 3 },
          { cardId: "big-unit", zone: "MAIN", quantity: 3 },
        ],
        "",
      ),
      cards,
    );
    expect(f.distinct).toBe(2);
    expect(f.options[0]).toBe(1); // turn 1: only the 1-drop
    expect(f.options[2]).toBe(2); // turn 3: 6 Energy reaches the 6-drop
  });

  it("will not call a card castable when the deck runs none of its colour", () => {
    const noCalm = playableOptions(
      deck([...split(12), { cardId: "calm-2p", zone: "MAIN", quantity: 3 }], ""),
      cards,
    );
    expect(noCalm.options.every((n) => n === 0)).toBe(true);
  });
});

describe("simulated openings", () => {
  const full = deck([
    ...split(7),
    { cardId: "cheap-unit", zone: "MAIN", quantity: 20 },
    { cardId: "big-unit", zone: "MAIN", quantity: 19 },
  ]);

  it("is seeded, so the same deck always reports the same numbers", () => {
    const a = simulateOpenings(full, cards, 2_000);
    const b = simulateOpenings(full, cards, 2_000);
    expect(a.turnOne).toBe(b.turnOne);
    expect(a.might).toEqual(b.might);
  });

  it("finds a turn-one line in a deck of 1-drops, and Might accumulates", () => {
    const o = simulateOpenings(full, cards, 5_000);
    expect(o.turnOne).toBeGreaterThan(0.95);
    expect(o.turnTwo).toBeGreaterThanOrEqual(o.turnOne);
    expect(o.might[5]).toBeGreaterThan(o.might[0] as number);
  });

  it("reports a deck it can never cast from as unplayable rather than crashing", () => {
    const unplayable = deck([{ cardId: "calm-2p", zone: "MAIN", quantity: 39 }], "");
    const o = simulateOpenings(unplayable, cards, 500);
    expect(o.turnOne).toBe(0);
    expect(o.might.every((m) => m === 0)).toBe(true);
  });

  it("stays inside the responsiveness target at the real iteration count", () => {
    const started = performance.now();
    simulateOpenings(full, cards, 10_000);
    // DECK-STATS S4 / DISCOVERY §9 target the whole panel at under 2 s; the simulation is
    // the only part that could plausibly threaten it.
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});
