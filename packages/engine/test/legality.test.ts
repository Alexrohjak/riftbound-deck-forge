import { describe, expect, it } from "vitest";
import {
  checkLegality,
  copiesByName,
  mainDeckCount,
  staticCardIndex,
  type Deck,
  type DeckSlot,
} from "../src/index.js";

/**
 * Two printings of "Jinx, Rebel" — the case DATA-MODEL §2 uses to explain why legality
 * keys on name and ownership keys on printing.
 */
const NAMES: Record<string, string> = {
  "ogn-202-298": "Jinx, Rebel",
  "ogn-202a-298": "Jinx, Rebel",
  "ogn-210-298": "Jinx, Demolitionist",
  "ogn-030-298": "Punching Poro",
  "ogn-031-298": "Loose Cannon",
  "rune-fury": "Fury Rune",
  "bf-001": "Noxus",
  "bf-002": "Piltover",
  "bf-003": "Ionia",
  "legend-jinx": "Jinx, the Loose Cannon",
};
const cards = staticCardIndex(NAMES);

const slot = (cardId: string, zone: DeckSlot["zone"], quantity: number): DeckSlot => ({
  cardId,
  zone,
  quantity,
});

/**
 * `total` cards spread over distinct names, at most 3 of each.
 *
 * Padding with one card at quantity 30 would itself break L13 — which is how the first
 * draft of these tests failed, and a fair demonstration that the copy limit is easy to
 * trip by accident.
 */
function fillers(total: number, zone: DeckSlot["zone"] = "MAIN"): DeckSlot[] {
  const slots: DeckSlot[] = [];
  for (let remaining = total, i = 0; remaining > 0; i++) {
    const quantity = Math.min(3, remaining);
    slots.push(slot(`fill-${zone}-${i}`, zone, quantity));
    remaining -= quantity;
  }
  return slots;
}

const RUNES_AND_BATTLEFIELDS: DeckSlot[] = [
  slot("rune-fury", "RUNE", 12),
  slot("bf-001", "BATTLEFIELD", 1),
  slot("bf-002", "BATTLEFIELD", 1),
  slot("bf-003", "BATTLEFIELD", 1),
];

/** A deck that satisfies every implemented check. 39 in MAIN + the Champion = 40 (L3). */
function legalDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "d1",
    name: "Test",
    state: "DRAFT",
    legendCardId: "legend-jinx",
    chosenChampionCardId: "ogn-202-298",
    slots: [
      slot("ogn-030-298", "MAIN", 3),
      slot("ogn-031-298", "MAIN", 3),
      slot("ogn-210-298", "MAIN", 3),
      ...fillers(30),
      ...RUNES_AND_BATTLEFIELDS,
    ],
    ...overrides,
  };
}

/** The same deck with a different MAIN zone, keeping it at the legal 39 + Champion. */
function deckWithMain(main: DeckSlot[], overrides: Partial<Deck> = {}): Deck {
  const named = main.reduce((n, s) => n + s.quantity, 0);
  return legalDeck({
    slots: [...main, ...fillers(39 - named), ...RUNES_AND_BATTLEFIELDS],
    ...overrides,
  });
}

const codes = (deck: Deck) => checkLegality(deck, cards).violations.map((v) => v.check);

describe("deck shape", () => {
  it("accepts a deck that satisfies every implemented check", () => {
    const result = checkLegality(legalDeck(), cards);
    expect(result.violations).toEqual([]);
    expect(result.legal).toBe(true);
  });

  it("counts the Chosen Champion inside the 40 (L3)", () => {
    // 39 slots + the singular Champion field. Off-by-one here would report 39.
    expect(mainDeckCount(legalDeck())).toBe(40);
  });

  it("rejects 40 slots plus a Champion, which is really 41", () => {
    const deck = legalDeck({ slots: [...fillers(40), ...RUNES_AND_BATTLEFIELDS] });
    expect(mainDeckCount(deck)).toBe(41);
    expect(codes(deck)).toContain("L3");
  });

  it("requires exactly 12 runes (L4)", () => {
    const deck = legalDeck({
      slots: legalDeck().slots.map((s) => (s.zone === "RUNE" ? { ...s, quantity: 11 } : s)),
    });
    expect(codes(deck)).toContain("L4");
  });

  it("requires exactly 3 battlefields (L5)", () => {
    const deck = legalDeck({ slots: legalDeck().slots.filter((s) => s.cardId !== "bf-003") });
    expect(codes(deck)).toContain("L5");
  });

  it("rejects three copies of one battlefield even though that is three cards (L6)", () => {
    const deck = legalDeck({
      slots: [
        ...legalDeck().slots.filter((s) => s.zone !== "BATTLEFIELD"),
        slot("bf-001", "BATTLEFIELD", 3),
      ],
    });
    const found = codes(deck);
    expect(found).toContain("L6");
    expect(found).not.toContain("L5"); // the count is right; the names are not
  });

  it("allows a sideboard of 10 and rejects 11 (L7)", () => {
    const withSideboard = (quantity: number) =>
      legalDeck({ slots: [...legalDeck().slots, ...fillers(quantity, "SIDEBOARD")] });
    expect(codes(withSideboard(10))).not.toContain("L7");
    expect(codes(withSideboard(11))).toContain("L7");
  });
});

describe("copy limits — the silent-failure case", () => {
  it("collapses two printings of one name into one allowance (L13)", () => {
    // 2 + 1 of the SAME name across different printings, plus the Champion = 4.
    const deck = deckWithMain([slot("ogn-202-298", "MAIN", 2), slot("ogn-202a-298", "MAIN", 1)], {
      chosenChampionCardId: "ogn-202-298",
    });
    expect(copiesByName(deck, cards).get("Jinx, Rebel")).toBe(4);
    expect(codes(deck)).toContain("L13");
  });

  it("gives a different name of the same character its own allowance (L15)", () => {
    const deck = deckWithMain([
      slot("ogn-202-298", "MAIN", 2), // "Jinx, Rebel" + Champion = 3
      slot("ogn-210-298", "MAIN", 3), // "Jinx, Demolitionist" = 3, a separate allowance
    ]);
    const counts = copiesByName(deck, cards);
    expect(counts.get("Jinx, Rebel")).toBe(3);
    expect(counts.get("Jinx, Demolitionist")).toBe(3);
    expect(codes(deck)).not.toContain("L13");
  });

  it("spans Main Deck and sideboard combined (L16)", () => {
    const legal = deckWithMain([slot("ogn-030-298", "MAIN", 2)], {
      chosenChampionCardId: "ogn-030-298", // 2 + Champion = 3, still fine
    });
    expect(codes(legal)).not.toContain("L13");

    // The fourth copy lives in the sideboard — a different zone, the same allowance.
    const overLimit = legalDeck({
      slots: [...legal.slots, slot("ogn-030-298", "SIDEBOARD", 1)],
      chosenChampionCardId: "ogn-030-298",
    });
    expect(codes(overLimit)).toContain("L13");
  });

  it("does not count runes toward the 3-copy limit", () => {
    // 12 copies of one rune is legal; the limit spans Main + sideboard only (L16).
    expect(copiesByName(legalDeck(), cards).has("Fury Rune")).toBe(false);
    expect(codes(legalDeck())).not.toContain("L13");
  });

  it("falls back to the printing id for unknown cards rather than merging them", () => {
    // Each unknown id stays distinct — under-counting a name is recoverable,
    // silently merging two different cards is not.
    const counts = copiesByName(legalDeck(), staticCardIndex({}));
    expect(counts.get("ogn-030-298")).toBe(3);
    expect(counts.get("ogn-031-298")).toBe(3);
    expect(counts.size).toBeGreaterThan(3);
  });
});

describe("coverage honesty", () => {
  it("never claims to be complete, and says so in the result", () => {
    const result = checkLegality(legalDeck(), cards);
    expect(result.legal).toBe(true);
    expect(result.coverage.complete).toBe(false);
    expect(result.coverage.implemented).toBeLessThan(result.coverage.specified);
    expect(result.coverage.caveat).toMatch(/does NOT mean the deck is tournament-legal/);
  });

  it("reports which checks ran, so a pass can be interpreted", () => {
    expect(checkLegality(legalDeck(), cards).checked).toContain("L13");
  });
});
