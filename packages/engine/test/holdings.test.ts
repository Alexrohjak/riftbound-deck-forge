import { describe, expect, it } from "vitest";
import { holdingsOf, type Deck } from "../src/index.js";

/**
 * `holdingsOf` — what a `BUILT` deck takes out of the available pool.
 *
 * ⚠️ **The regression these tests exist for:** a sideboard card read as available while it
 * was physically sleeved. Ownership answers that miss commitment are not merely incomplete,
 * they are confidently wrong in the one direction that costs you a deck at the table — so
 * every zone that holds cardboard is asserted individually rather than as a total.
 */
const built = (over: Partial<Deck> = {}): Deck => ({
  id: "zed",
  name: "Zed — Shadow Flow",
  state: "BUILT",
  legendCardId: "legend-zed",
  chosenChampionCardId: "champ-zed",
  slots: [
    { cardId: "main-a", zone: "MAIN", quantity: 3 },
    { cardId: "side-a", zone: "SIDEBOARD", quantity: 2 },
    { cardId: "bf-a", zone: "BATTLEFIELD", quantity: 1 },
    { cardId: "rune-fury", zone: "RUNE", quantity: 12 },
  ],
  ...over,
});

const held = (decks: Deck[]) =>
  Object.fromEntries(holdingsOf(decks).map((h) => [h.cardId, h.quantity]));

describe("holdingsOf", () => {
  it("counts sideboard cards, which are physically present (DATA-MODEL §4)", () => {
    expect(held([built()])["side-a"]).toBe(2);
  });

  it("counts the Main Deck and battlefields", () => {
    const h = held([built()]);
    expect(h["main-a"]).toBe(3);
    expect(h["bf-a"]).toBe(1);
  });

  it("counts the Legend and Chosen Champion, which live outside slots", () => {
    const h = held([built()]);
    expect(h["legend-zed"]).toBe(1);
    expect(h["champ-zed"]).toBe(1);
  });

  it("exempts runes — Forge treats them as always on hand (D-061)", () => {
    expect(held([built()])["rune-fury"]).toBeUndefined();
  });

  it("holds nothing for a DRAFT deck, because a plan commits no cardboard (D-017)", () => {
    expect(holdingsOf([built({ state: "DRAFT" })])).toEqual([]);
  });

  it("merges a Champion also sleeved as a Main Deck slot into one physical count", () => {
    const slots: Deck["slots"] = [{ cardId: "champ-zed", zone: "MAIN", quantity: 2 }];
    const rows = holdingsOf([built({ slots })]);
    // 2 in the Main Deck plus the Chosen Champion's own copy — one row, not two.
    expect(rows.filter((r) => r.cardId === "champ-zed")).toHaveLength(1);
    expect(held([built({ slots })])["champ-zed"]).toBe(3);
  });

  it("carries the address, so a conflict can say which deck holds the cards", () => {
    const row = holdingsOf([built()]).find((h) => h.cardId === "side-a");
    expect(row).toMatchObject({ deckId: "zed", deckName: "Zed — Shadow Flow" });
  });

  it("skips an unset Champion rather than emitting a nameless phantom", () => {
    expect(held([built({ chosenChampionCardId: "" })])[""]).toBeUndefined();
  });
});
