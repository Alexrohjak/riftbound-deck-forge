import { describe, expect, it } from "vitest";
import {
  canPromote,
  committedByPrinting,
  conflictSentence,
  findConflicts,
  overCommitted,
  staticCardIndex,
  type Deck,
  type Holding,
} from "../src/index.js";

/**
 * Commitment — D-017 and DATA-MODEL §3.
 *
 * The fixture is DATA-MODEL's own worked example: two arts of one card, and a second deck
 * that already holds some of them. The spec's sentence — *"2 of 3 copies of Jinx,
 * Demolitionist are in Jinx Aggro v2"* — is asserted directly, because the location is the
 * feature and a conflict without an address is the dead end D-017 exists to prevent.
 */
const cards = staticCardIndex({
  "ogn-210-298": "Jinx, Demolitionist",
  "ogn-210a-298": "Jinx, Demolitionist",
  "ogn-030-298": "Punching Poro",
  "legend-jinx": "Jinx, the Loose Cannon",
});

const deck = (id: string, slots: Deck["slots"]): Deck => ({
  id,
  name: id,
  state: "DRAFT",
  legendCardId: "legend-jinx",
  chosenChampionCardId: "",
  slots,
});

/** Three copies of the card, spread across two arts — one shelf, one name. */
const OWNED = { "ogn-210-298": 2, "ogn-210a-298": 1, "ogn-030-298": 4 };

const aggro: Holding[] = [
  { deckId: "aggro", deckName: "Jinx Aggro v2", cardId: "ogn-210-298", quantity: 2 },
];

describe("committedByPrinting", () => {
  it("sums holdings per printing", () => {
    expect(committedByPrinting(aggro)).toEqual({ "ogn-210-298": 2 });
  });

  it("ignores the deck being asked about, so a built deck never conflicts with itself", () => {
    expect(committedByPrinting(aggro, "aggro")).toEqual({});
  });
});

describe("findConflicts", () => {
  it("counts availability by name across printings, not by the art in the slot", () => {
    // Asks for 3 with 2 held elsewhere: 3 owned − 2 committed = 1 available.
    const conflicts = findConflicts(
      deck("new", [{ cardId: "ogn-210a-298", zone: "MAIN", quantity: 3 }]),
      cards,
      OWNED,
      aggro,
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      name: "Jinx, Demolitionist",
      want: 3,
      owned: 3,
      committed: 2,
      available: 1,
      short: 2,
    });
  });

  it("carries the address of every holder", () => {
    const conflicts = findConflicts(
      deck("new", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 3 }]),
      cards,
      OWNED,
      aggro,
    );
    expect(conflicts[0]!.holders).toEqual([
      { deckId: "aggro", deckName: "Jinx Aggro v2", quantity: 2 },
    ]);
  });

  it("stays silent when the deck asks for no more than is available", () => {
    expect(
      findConflicts(
        deck("new", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 1 }]),
        cards,
        OWNED,
        aggro,
      ),
    ).toEqual([]);
  });

  it("does not let a deck conflict with its own commitments", () => {
    // The same deck, now BUILT and holding the very cards it asks for.
    const built = deck("aggro", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 2 }]);
    expect(findConflicts(built, cards, OWNED, aggro)).toEqual([]);
  });

  it("counts the sideboard, which is physically sleeved (DATA-MODEL §4)", () => {
    const conflicts = findConflicts(
      deck("new", [
        { cardId: "ogn-210-298", zone: "MAIN", quantity: 1 },
        { cardId: "ogn-210-298", zone: "SIDEBOARD", quantity: 1 },
      ]),
      cards,
      OWNED,
      aggro,
    );
    expect(conflicts[0]).toMatchObject({ want: 2, available: 1, short: 1 });
  });

  it("counts the Chosen Champion, which is a Main Deck card in its own field", () => {
    const withChampion: Deck = {
      ...deck("new", []),
      chosenChampionCardId: "ogn-210-298",
    };
    const heldEntirely: Holding[] = [
      { deckId: "aggro", deckName: "Jinx Aggro v2", cardId: "ogn-210-298", quantity: 3 },
    ];
    expect(findConflicts(withChampion, cards, OWNED, heldEntirely)).toHaveLength(1);
  });

  it("reports a pure shortage with no holders rather than blaming a deck", () => {
    const conflicts = findConflicts(
      deck("new", [{ cardId: "ogn-030-298", zone: "MAIN", quantity: 9 }]),
      cards,
      OWNED,
      [],
    );
    expect(conflicts[0]).toMatchObject({ owned: 4, committed: 0, short: 5, holders: [] });
  });
});

describe("canPromote — the one place a conflict becomes a refusal", () => {
  it("refuses while another deck holds the cards, and says which", () => {
    const verdict = canPromote(
      deck("new", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 3 }]),
      cards,
      OWNED,
      aggro,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.blocking[0]!.holders[0]!.deckName).toBe("Jinx Aggro v2");
  });

  it("allows it once the holding deck is dismantled", () => {
    // Dismantling is modelled as the holding disappearing — commitments are derived.
    expect(
      canPromote(
        deck("new", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 3 }]),
        cards,
        OWNED,
        [],
      ).ok,
    ).toBe(true);
  });
});

describe("overCommitted", () => {
  it("is silent while the boxes cover what is sleeved", () => {
    expect(overCommitted(cards, OWNED, aggro)).toEqual([]);
  });

  it("reports loudly when a sleeved card has left the collection", () => {
    // Traded away two copies; three are still in decks.
    const thinned = { "ogn-210-298": 1 };
    const sleeved: Holding[] = [
      { deckId: "aggro", deckName: "Jinx Aggro v2", cardId: "ogn-210-298", quantity: 2 },
      { deckId: "control", deckName: "Jinx Control", cardId: "ogn-210a-298", quantity: 1 },
    ];
    const over = overCommitted(cards, thinned, sleeved);
    expect(over).toHaveLength(1);
    expect(over[0]).toMatchObject({ owned: 1, committed: 3, short: 2 });
    // Both decks are named — Forge must not decide which one loses the card.
    expect(over[0]!.holders).toHaveLength(2);
  });
});

describe("conflictSentence", () => {
  it("is DATA-MODEL §3's own sentence, address included", () => {
    const [conflict] = findConflicts(
      deck("new", [{ cardId: "ogn-210-298", zone: "MAIN", quantity: 3 }]),
      cards,
      OWNED,
      aggro,
    );
    expect(conflictSentence(conflict!)).toBe(
      "2 of your 3 copies of Jinx, Demolitionist are in Jinx Aggro v2 — 1 available, 3 asked for.",
    );
  });

  it("summarises rather than enumerating when many decks hold a card (D-039)", () => {
    const spread: Holding[] = ["a", "b", "c", "d"].map((id) => ({
      deckId: id,
      deckName: `Deck ${id.toUpperCase()}`,
      cardId: "ogn-030-298",
      quantity: 1,
    }));
    const [conflict] = findConflicts(
      deck("new", [{ cardId: "ogn-030-298", zone: "MAIN", quantity: 3 }]),
      cards,
      OWNED,
      spread,
    );
    expect(conflictSentence(conflict!)).toContain("Deck A and Deck B and 2 more");
  });

  it("blames the boxes, not a deck, when nothing holds the card", () => {
    const [conflict] = findConflicts(
      deck("new", [{ cardId: "ogn-030-298", zone: "MAIN", quantity: 9 }]),
      cards,
      OWNED,
      [],
    );
    expect(conflictSentence(conflict!)).toBe("Punching Poro — you own 4, and this deck asks for 9.");
  });
});
