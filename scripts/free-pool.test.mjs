import { describe, expect, it } from "vitest";
import { freePool } from "./free-pool.mjs";

/**
 * The bug these cover: a free pool derived from `deck_slots` alone reports every BUILT deck
 * two cards short, because the Chosen Champion and the Legend live in their own columns. Both
 * are singletons, so the copy it wrongly frees is usually the only one owned.
 */
const state = (decks, counts) => ({ collection: { counts }, decks });

describe("freePool", () => {
  it("subtracts a Chosen Champion that is not written as a slot", () => {
    const { counts } = freePool(
      state(
        [
          {
            state: "BUILT",
            legendCardId: "legend-1",
            chosenChampionCardId: "champ-1",
            slots: [{ cardId: "body-1", zone: "MAIN", quantity: 3 }],
          },
        ],
        { "champ-1": 1, "body-1": 4, "legend-1": 1 },
      ),
    );
    // The single copy is in sleeves, so it is gone rather than left at zero.
    expect(counts["champ-1"]).toBeUndefined();
    expect(counts["legend-1"]).toBeUndefined();
    expect(counts["body-1"]).toBe(1);
  });

  it("does not double-count a Champion that is also a slot row", () => {
    // Ambessa is the one deck shaped this way, and counting it twice would invent a shortage.
    const { counts } = freePool(
      state(
        [
          {
            state: "BUILT",
            legendCardId: "legend-1",
            chosenChampionCardId: "champ-1",
            slots: [{ cardId: "champ-1", zone: "MAIN", quantity: 1 }],
          },
        ],
        { "champ-1": 2, "legend-1": 1 },
      ),
    );
    expect(counts["champ-1"]).toBe(1);
  });

  it("ignores runes, which are never a claim on anything (D-061)", () => {
    const { counts } = freePool(
      state(
        [{ state: "BUILT", slots: [{ cardId: "rune-1", zone: "RUNE", quantity: 12 }] }],
        { "rune-1": 6 },
      ),
    );
    expect(counts["rune-1"]).toBe(6);
  });

  it("holds nothing for a DRAFT deck (D-017)", () => {
    const { counts, totals } = freePool(
      state(
        [
          {
            state: "DRAFT",
            legendCardId: "legend-1",
            chosenChampionCardId: "champ-1",
            slots: [{ cardId: "body-1", zone: "MAIN", quantity: 3 }],
          },
        ],
        { "champ-1": 1, "body-1": 4, "legend-1": 1 },
      ),
    );
    expect(counts).toEqual({ "champ-1": 1, "body-1": 4, "legend-1": 1 });
    expect(totals.committedCopies).toBe(0);
  });

  it("counts a card sleeved across two decks against the same pool", () => {
    const twoDecks = [
      { state: "BUILT", slots: [{ cardId: "body-1", zone: "MAIN", quantity: 2 }] },
      { state: "BUILT", slots: [{ cardId: "body-1", zone: "MAIN", quantity: 2 }] },
    ];
    const { counts } = freePool(state(twoDecks, { "body-1": 5 }));
    expect(counts["body-1"]).toBe(1);
  });

  it("still reports a card as committed when more is sleeved than owned", () => {
    // An over-commitment must not read as "plenty free" — the count is dropped, and the
    // committed tally keeps the evidence that something is wrong.
    const { counts, committed } = freePool(
      state([{ state: "BUILT", slots: [{ cardId: "body-1", zone: "MAIN", quantity: 3 }] }], {
        "body-1": 1,
      }),
    );
    expect(counts["body-1"]).toBeUndefined();
    expect(committed["body-1"]).toBe(3);
  });

  it("counts a sideboard slot, which is physically present when a deck is built", () => {
    const { counts } = freePool(
      state([{ state: "BUILT", slots: [{ cardId: "body-1", zone: "SIDEBOARD", quantity: 2 }] }], {
        "body-1": 3,
      }),
    );
    expect(counts["body-1"]).toBe(1);
  });
});
