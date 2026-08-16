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
  field: { name: "A Battlefield", types: ["battlefield"] },
  /** Same name, different printing — one card against the copy limit. */
  sharedAlt: { name: "Shared Card", types: ["spell"], energy: 2 },
};
const index = staticCardIndex(CARDS);

/** Every fixture owns its Champion — otherwise it is a shortfall in every single case. */
const owned = (rows: Array<[string, number]>) => new Map([["A Champion", 3], ...rows]);

/** The Champion is owned 3 and played 1 in every fixture, so it is always a spare. Ignore it. */
const deckCards = (rows: ReturnType<typeof wishlist>) => rows.filter((r) => r.name !== "A Champion");

const deckOf = (id: string, name: string, slots: Array<{ cardId: string; quantity: number; zone?: "MAIN" | "SIDEBOARD" | "RUNE" | "BATTLEFIELD" }>): WishlistDeck => ({
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

  it("⚠️ flags copies sitting in the box that no deck plays", () => {
    // Free improvement — you already own it, so this needs no trade at all.
    const decks = [deckOf("a", "Deck A", [{ cardId: "plenty", quantity: 2 }])];
    const row = wishlist(decks, index, owned([["Plenty", 3]])).find((r) => r.name === "Plenty")!;
    expect(row.kind).toBe("spare");
    expect(row.short).toBe(1); // one idle copy
  });

  it("⚠️ caps the spare at what a deck can legally add, not at how many are idle", () => {
    // Owns eleven, plays two of a legal three. Nine are idle and eight have nowhere to go —
    // reporting "+9" put an unactionable number at the top of the list.
    const decks = [deckOf("a", "Deck A", [{ cardId: "plenty", quantity: 2 }])];
    const row = wishlist(decks, index, owned([["Plenty", 11]])).find((r) => r.name === "Plenty")!;
    expect(row.owned).toBe(11);
    expect(row.short).toBe(1);
  });

  it("⚠️ counts idle copies against the whole shelf, not one deck", () => {
    // Two decks sharing three copies: nothing is idle, even though neither runs three.
    // Saying "Deck A could run one more" would be recommending a swap it never mentioned.
    const decks = [
      deckOf("a", "Deck A", [{ cardId: "plenty", quantity: 2 }]),
      deckOf("b", "Deck B", [{ cardId: "plenty", quantity: 1 }]),
    ];
    expect(wishlist(decks, index, owned([["Plenty", 3]])).find((r) => r.name === "Plenty")).toBeUndefined();
  });

  it("stays quiet when the idle copies have nowhere legal to go", () => {
    // Owns four, the deck already plays the legal three. The spare is real but unusable.
    const decks = [deckOf("a", "Deck A", [{ cardId: "plenty", quantity: 3 }])];
    expect(wishlist(decks, index, owned([["Plenty", 4]])).find((r) => r.name === "Plenty")).toBeUndefined();
  });

  it("stays quiet once you own the legal maximum", () => {
    const decks = [deckOf("a", "Deck A", [{ cardId: "maxed", quantity: 3 }])];
    expect(deckCards(wishlist(decks, index, owned([["Maxed Out", 3]])))).toEqual([]);
  });

  it("⚠️ never counts runes — they are a fixture of the format, not a card you own (D-061)", () => {
    // Counting them would put twelve permanent shortfalls at the top of every list.
    const decks = [deckOf("a", "Deck A", [{ cardId: "rune", quantity: 12, zone: "RUNE" }])];
    expect(deckCards(wishlist(decks, index, owned([])))).toEqual([]);
  });

  it("⚠️ counts battlefields — legal in two decks, and still impossible if you own one", () => {
    // Copy limits do not span the battlefield zone, so `countedEntries` rightly ignores it and
    // is the wrong set here: this asks whether the cards exist on the shelf, not whether the
    // deck is legal. Two decks registering the same battlefield you own once is both.
    const decks = [
      deckOf("a", "Deck A", [{ cardId: "field", quantity: 1, zone: "BATTLEFIELD" }]),
      deckOf("b", "Deck B", [{ cardId: "field", quantity: 1, zone: "BATTLEFIELD" }]),
    ];
    const row = wishlist(decks, index, owned([["A Battlefield", 1]])).find((r) => r.name === "A Battlefield")!;
    expect(row.kind).toBe("blocking");
    expect(row.needed).toBe(2);
    expect(row.short).toBe(1);
  });

  it("⚠️ never says you could play more of a battlefield — L6 caps them at one per deck", () => {
    // Own five, register one, and the answer to "could I play more" is permanently no:
    // battlefield names must be unique (CR 103.4.c / TR 402.1). Five of thirty-two rows made
    // this claim, and `checkLegality` rejected a deck built to follow one of them.
    const decks = [deckOf("a", "Deck A", [{ cardId: "field", quantity: 1, zone: "BATTLEFIELD" }])];
    expect(
      wishlist(decks, index, owned([["A Battlefield", 5]])).find((r) => r.name === "A Battlefield"),
    ).toBeUndefined();
  });

  it("still flags a battlefield a second deck cannot get a copy of", () => {
    // The cap is per deck. Two decks each wanting one, and you own one, is still blocking.
    const decks = [
      deckOf("a", "Deck A", [{ cardId: "field", quantity: 1, zone: "BATTLEFIELD" }]),
      deckOf("b", "Deck B", [{ cardId: "field", quantity: 1, zone: "BATTLEFIELD" }]),
    ];
    const row = wishlist(decks, index, owned([["A Battlefield", 1]])).find((r) => r.name === "A Battlefield")!;
    expect(row.kind).toBe("blocking");
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
    const rows = deckCards(wishlist(decks, index, owned([["Shared Card", 1]])));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.needed).toBe(2);
  });

  it("counts the Chosen Champion, which lives outside the slots", () => {
    const decks = [deckOf("a", "Deck A", [])];
    const row = wishlist(decks, index, new Map([["A Champion", 1]])).find((r) => r.name === "A Champion")!;
    expect(row.kind).toBe("upgrade");
    expect(row.needed).toBe(1);
  });

  it("⚠️ orders blocking, then spare, then upgrade — urgency, then free, then shopping", () => {
    const decks = [
      deckOf("a", "Deck A", [
        { cardId: "maxed", quantity: 1 }, // upgrade: owns 1, plays 1
        { cardId: "plenty", quantity: 1 }, // spare: owns 3, plays 1
        { cardId: "shared", quantity: 2 },
      ]),
      deckOf("b", "Deck B", [{ cardId: "shared", quantity: 2 }]), // blocking
    ];
    const rows = deckCards(wishlist(decks, index, owned([["Shared Card", 2], ["Maxed Out", 1], ["Plenty", 3]])));
    expect(rows.map((r) => r.kind)).toEqual(["blocking", "spare", "upgrade"]);
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
