import { describe, expect, it } from "vitest";
import {
  checkLegality,
  copiesByName,
  domainIdentity,
  energyCurve,
  mainDeckCount,
  staticCardIndex,
  type CardEntry,
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

/**
 * The same printings, plus what the static pool knows about them. A Fury + Chaos Legend,
 * so `legalDeck()` is legal under this index too — which is what lets one deck fixture
 * serve both the name-only and the domain-aware cases.
 */
const FACTS: Record<string, CardEntry> = {
  "legend-jinx": { name: "Jinx, the Loose Cannon", domains: ["fury", "chaos"], energy: null },
  "ogn-202-298": { name: "Jinx, Rebel", domains: ["fury"], energy: 4 },
  "ogn-202a-298": { name: "Jinx, Rebel", domains: ["fury"], energy: 4 },
  "ogn-210-298": { name: "Jinx, Demolitionist", domains: ["chaos"], energy: 2 },
  "ogn-030-298": { name: "Punching Poro", domains: ["colorless"], energy: 1 },
  "ogn-031-298": { name: "Loose Cannon", domains: ["fury", "chaos"], energy: 3 },
  "rune-fury": { name: "Fury Rune", domains: ["fury"], energy: null },
  "rune-mind": { name: "Mind Rune", domains: ["mind"], energy: null },
  "bf-001": { name: "Noxus", domains: ["colorless"], energy: null },
  "bf-002": { name: "Piltover", domains: ["colorless"], energy: null },
  "bf-003": { name: "Ionia", domains: ["colorless"], energy: null },
  // Off-identity, one of each shape the spec distinguishes.
  "off-mono": { name: "Mind Card", domains: ["mind"], energy: 2 },
  "off-multi": { name: "Fury Order Card", domains: ["fury", "order"], energy: 5 },
  "legend-tri": { name: "Impossible Legend", domains: ["fury", "chaos", "mind"], energy: null },
};
const withDomains = staticCardIndex(FACTS);

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

/** `legalDeck` read through the domain-aware index — a Fury + Chaos deck that complies. */
const furyChaosDeck = () => legalDeck();
const domainCodes = (deck: Deck) =>
  checkLegality(deck, withDomains).violations.map((v) => v.check);

describe("domain identity", () => {
  it("takes the identity from the Legend, and accepts a deck inside it", () => {
    expect(domainIdentity(furyChaosDeck(), withDomains)).toEqual(["fury", "chaos"]);
    expect(checkLegality(furyChaosDeck(), withDomains).violations).toEqual([]);
  });

  it("rejects a single-domain card outside the identity (L9)", () => {
    expect(domainCodes(deckWithMain([slot("off-mono", "MAIN", 3)]))).toContain("L9");
  });

  it("rejects a card whose SECOND domain is outside the identity (L10)", () => {
    // Fury is in the identity and Order is not. Requiring only *one* domain to match is
    // the way this check is usually got backwards, so it is worth its own test.
    const found = domainCodes(deckWithMain([slot("off-multi", "MAIN", 3)]));
    expect(found).toContain("L10");
    expect(found).not.toContain("L9");
  });

  it("permits colorless under any identity (L12)", () => {
    // Punching Poro is colorless, and every battlefield in the game is too — without
    // L12 the whole battlefield zone would report illegal.
    expect(domainCodes(furyChaosDeck())).not.toContain("L9");
    expect(FACTS["bf-001"]).toMatchObject({ domains: ["colorless"] });
  });

  it("holds the Rune Deck to the identity as well (L11)", () => {
    const deck = legalDeck({
      slots: [
        ...legalDeck().slots.filter((s) => s.zone !== "RUNE"),
        slot("rune-fury", "RUNE", 6),
        slot("rune-mind", "RUNE", 6),
      ],
    });
    const found = domainCodes(deck);
    expect(found).toContain("L11");
    expect(found).not.toContain("L9"); // a rune, not a Main Deck card
  });

  it("catches an off-identity Chosen Champion, which lives outside the slots (L9)", () => {
    const deck = deckWithMain([slot("ogn-030-298", "MAIN", 3)], {
      chosenChampionCardId: "off-mono",
    });
    expect(domainCodes(deck)).toContain("L9");
  });

  it("reports a Legend that is not a pair, rather than trusting the data (L8)", () => {
    const deck = legalDeck({ legendCardId: "legend-tri" });
    expect(domainCodes(deck)).toContain("L8");
  });

  it("skips unknown printings instead of inventing a verdict", () => {
    // The fillers carry no domains. Under-reporting is recoverable; a fabricated
    // violation on a card we know nothing about is not.
    expect(domainCodes(furyChaosDeck())).toEqual([]);
  });
});

describe("energy curve", () => {
  it("is a histogram over the Main Deck, Chosen Champion included", () => {
    const deck = deckWithMain([
      slot("ogn-030-298", "MAIN", 3), // 1 Energy
      slot("ogn-210-298", "MAIN", 2), // 2 Energy
    ]);
    const curve = energyCurve(deck, withDomains);
    expect(curve.counts[1]).toBe(3);
    expect(curve.counts[2]).toBe(2);
    expect(curve.counts[4]).toBe(1); // the Champion, Jinx Rebel at 4
    expect(curve.mainDeckSize).toBe(40);
  });

  it("keeps unknown costs out of the buckets rather than folding them into 0", () => {
    // 34 fillers have no energy data. Counting them as free would drag the curve left
    // and make the deck look far cheaper than it is.
    const curve = energyCurve(deckWithMain([slot("ogn-030-298", "MAIN", 3)]), withDomains);
    expect(curve.unknown).toBe(36);
    expect(curve.counts[0] ?? 0).toBe(0);
    expect(curve.counted + curve.unknown).toBe(curve.mainDeckSize);
  });

  it("excludes runes and battlefields, which are never drawn and have no cost", () => {
    const curve = energyCurve(furyChaosDeck(), withDomains);
    expect(curve.counted + curve.unknown).toBe(40);
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

  it("does not claim Domain Identity when the index has no domains", () => {
    // `cards` is name-only. Claiming L8-L12 here would be the exact silent wrongness
    // the coverage field exists to prevent.
    const result = checkLegality(legalDeck(), cards);
    expect(result.checked).not.toContain("L9");
    expect(result.coverage.implemented).toBe(9); // shape 5 + copies 4
  });

  it("claims Domain Identity once domains are supplied", () => {
    const result = checkLegality(furyChaosDeck(), withDomains);
    expect(result.checked).toContain("L9");
    expect(result.coverage.implemented).toBe(14); // + the 5 Domain Identity checks
  });
});

describe("counting the Main Deck", () => {
  it("counts the Chosen Champion inside the 40 (L3)", () => {
    const d = legalDeck();
    expect(mainDeckCount(d)).toBe(40);
  });

  it("does not count a Champion that has not been chosen", () => {
    // An empty deck read as 1/40 until `W3` made empty decks creatable and it showed.
    expect(
      mainDeckCount({
        id: "d",
        name: "empty",
        state: "DRAFT",
        legendCardId: "",
        chosenChampionCardId: "",
        slots: [],
      }),
    ).toBe(0);
  });
});
