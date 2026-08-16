import { describe, expect, it } from "vitest";
import { wishlist, staticCardIndex, type CardEntry, type WishlistDeck } from "../src/index.js";
import type { Deck } from "../src/types.js";

/**
 * **The shopping list** — every deck read at once.
 *
 * ⚠️ The case this exists for is invisible to every other check: two decks each running two
 * copies of a card you own two of are **both legal**, pass all 33 checks, and cannot be
 * sleeved at the same time. The rules are per deck; the shelf is not.
 */
const CARDS: Record<string, CardEntry> = {
  "legend-1": { name: "A Legend", types: ["legend"] },
  "champ-1": { name: "A Champion", types: ["unit"], superTypes: ["champion"], energy: 4, might: 4 },
  shared: { name: "Shared Card", types: ["spell"], energy: 2 },
  plenty: { name: "Plenty", types: ["unit"], energy: 2, might: 2 },
  maxed: { name: "Maxed Out", types: ["unit"], energy: 3, might: 3 },
  rune: { name: "Body Rune", types: ["rune"] },
  /** Same name, different printing — one card against the copy limit. */
  sharedAlt: { name: "Shared Card", types: ["spell"], energy: 2 },
};
const index = staticCardIndex(CARDS);

/** Every fixture owns its Champion — otherwise it is a shortfall in every single case. */
const owned = (rows: Array<[string, number]>) => new Map([["A Champion", 3], ...rows]);

const deckOf = (id: string, name: string, slots: Array<{ cardId: string; quantity: number; zone?: "MAIN" | "SIDEBOARD" | "RUNE" }>): WishlistDeck => ({
  id,
  name,
  deck: {
    id,
    name,
    state: "DRAFT",
    legendCardId: "legend-1",
    chosenChampionCardId: "champ-1",
    slots: slots.map((s) => ({ cardId: s.cardId, quantity: s.quantity, zone: s.zone ?? "MAIN" })),
  } satisfies Deck,
});

describe("wishlist", () => {
  it("⚠️ finds the shortfall that no single deck can see", () => {
    // Two decks, two copies each, two copies owned. Both legal. Only one can exist.
    const decks = [
      deckOf("a", "Deck A", [{ cardId: "shared", quantity: 2 }]),
      deckOf("b", "Deck B", [{ cardId: "shared", quantity: 2 }]),
    ];
    const rows = wishlist(decks, index, owned([["Shared Card", 2]]));
    const row = rows.find((r) => r.name === "Shared Card")!;
    expect(row.kind).toBe("blocking");
    expect(row.needed).toBe(4);
    expect(row.owned).toBe(2);
    expect(row.short).toBe(2);
  });

  it("names which decks want it, and how many each asks for", () => {
    const decks = [
      deckOf("a", "Deck A", [{ cardId: "shared", quantity: 3 }]),
      deckOf("b", "Deck B", [{ cardId: "shared", quantity: 1 }]),
    ];
    const row = wishlist(decks, index, owned([["Shared Card", 1]])).find((r) => r.name === "Shared Card")!;
    // Sorted by copies desc, so the deck leaning hardest on it reads first.
    expect(row.decks.map((d) => `${d.name}×${d.copies}`)).toEqual(["Deck A×3", "Deck B×1"]);
  });

  it("calls it an upgrade when a deck plays every copy there is", () => {
    const decks = [deckOf("a", "Deck A", [{ cardId: "maxed", quantity: 1 }])];
    const row = wishlist(decks, index, owned([["Maxed Out", 1]])).find((r) => r.name === "Maxed Out")!;
    expect(row.kind).toBe("upgrade");
    expect(row.short).toBe(2); // up to the legal three
  });

  it("⚠️ stays quiet about a deck that chose to run fewer than it owns", () => {
    // Two of a card you own three of is a decision, not a wall.
    const decks = [deckOf("a", "Deck A", [{ cardId: "plenty", quantity: 2 }])];
    expect(wishlist(decks, index, owned([["Plenty", 3]]))).toEqual([]);
  });

  it("stays quiet once you own the legal maximum", () => {
    const decks = [deckOf("a", "Deck A", [{ cardId: "maxed", quantity: 3 }])];
    expect(wishlist(decks, index, owned([["Maxed Out", 3]]))).toEqual([]);
  });

  it("⚠️ never counts runes — they are a fixture of the format, not a card you own (D-061)", () => {
    // Counting them would put twelve permanent shortfalls at the top of every list.
    const decks = [deckOf("a", "Deck A", [{ cardId: "rune", quantity: 12, zone: "RUNE" }])];
    expect(wishlist(decks, index, owned([]))).toEqual([]);
  });

  it("counts the sideboard, because copy limits span both zones (L16)", () => {
    const decks = [
      deckOf("a", "Deck A", [
        { cardId: "shared", quantity: 2 },
        { cardId: "shared", quantity: 1, zone: "SIDEBOARD" },
      ]),
    ];
    const row = wishlist(decks, index, owned([["Shared Card", 1]])).find((r) => r.name === "Shared Card")!;
    expect(row.needed).toBe(3);
    expect(row.kind).toBe("blocking");
  });

  it("⚠️ treats two printings of one name as one card", () => {
    // The limit is per name, so an alternate art is a second copy — not a second card.
    const decks = [
      deckOf("a", "Deck A", [
        { cardId: "shared", quantity: 1 },
        { cardId: "sharedAlt", quantity: 1 },
      ]),
    ];
    const rows = wishlist(decks, index, owned([["Shared Card", 1]]));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.needed).toBe(2);
  });

  it("counts the Chosen Champion, which lives outside the slots", () => {
    const decks = [deckOf("a", "Deck A", [])];
    const row = wishlist(decks, index, new Map([["A Champion", 1]])).find((r) => r.name === "A Champion")!;
    expect(row.kind).toBe("upgrade");
    expect(row.needed).toBe(1);
  });

  it("⚠️ puts blocking shortfalls above upgrades — one stops a deck existing", () => {
    const decks = [
      deckOf("a", "Deck A", [
        { cardId: "maxed", quantity: 1 },
        { cardId: "shared", quantity: 2 },
      ]),
      deckOf("b", "Deck B", [{ cardId: "shared", quantity: 2 }]),
    ];
    const rows = wishlist(decks, index, owned([["Shared Card", 2], ["Maxed Out", 1]]));
    expect(rows[0]!.kind).toBe("blocking");
    expect(rows[0]!.name).toBe("Shared Card");
  });
});
