import { describe, expect, it } from "vitest";
import { apply, NO_FILTERS, ownedCount, type Filters } from "../src/filters.js";
import { buildPool, type Card } from "../src/cards.js";

/**
 * The Owned view exists so the gallery can show *your* cards. The thing that can be quietly
 * wrong is the collapse: **ownership is keyed on printing, the gallery is keyed on name**
 * (DATA-MODEL §2). Two copies of the same card in two different arts is two copies of that
 * card, and a filter that missed that would hide cards you own.
 */

const card = (over: Partial<Card> & { name: string }): Card => ({
  release: 1,
  energy: 3,
  power: null,
  might: 4,
  types: ["unit"],
  superTypes: [],
  domains: ["fury"],
  tags: [],
  text: "",
  printings: [{ id: `${over.name}-1`, code: "X-1/1", set: "OGN", n: 1, img: "https://i/x?a=1" }],
  ...over,
});

/** Owned three times over, but across two different printings. */
const SPLIT = card({
  name: "Jinx, Demolitionist",
  printings: [
    { id: "ogn-030-298", code: "OGN-030/298", set: "OGN", n: 30, img: "https://i/a?t=1" },
    { id: "ogn-030a-298", code: "OGN-030a/298", set: "OGN", n: 30, img: "https://i/c?t=1", alt: true },
  ],
});
const ONE = card({ name: "Yordle Squad", energy: 2 });
const NONE = card({ name: "Unowned Thing", energy: 4 });
const SPELL = card({ name: "Super Mega Death Rocket!", types: ["spell"] });

const pool = buildPool({
  schema: "forge.cards/1",
  counts: { names: 4, printings: 5, legends: 0, banned: 0 },
  cards: [SPLIT, ONE, NONE, SPELL],
});

const COLLECTION = {
  "ogn-030-298": 1,
  "ogn-030a-298": 2,
  "Yordle Squad-1": 1,
  "Super Mega Death Rocket!-1": 4,
};

const owned: Filters = { ...NO_FILTERS, owned: true };
const names = (f: Filters) => apply(pool.cards, f, COLLECTION).map((c) => c.name);

describe("counting what you own", () => {
  it("sums a name across its printings, so alt art is not a different card", () => {
    expect(ownedCount(SPLIT, COLLECTION)).toBe(3);
  });

  it("reports nothing rather than guessing when a printing is absent", () => {
    expect(ownedCount(NONE, COLLECTION)).toBe(0);
  });
});

describe("the Owned view", () => {
  it("shows only cards with at least one copy", () => {
    expect(names(owned)).not.toContain("Unowned Thing");
    expect(names(owned)).toContain("Jinx, Demolitionist");
  });

  it("is empty when nothing is registered, rather than falling back to everything", () => {
    expect(apply(pool.cards, owned, {})).toHaveLength(0);
  });

  it("narrows the other filters instead of replacing them", () => {
    expect(names({ ...owned, types: ["spell"] })).toEqual(["Super Mega Death Rocket!"]);
  });

  it("still searches, so a big collection stays navigable", () => {
    expect(names({ ...owned, query: "rocket" })).toEqual(["Super Mega Death Rocket!"]);
  });

  it("sorts by copies held, deepest first", () => {
    expect(names({ ...owned, sort: { key: "copies", desc: false } })).toEqual([
      "Super Mega Death Rocket!",
      "Jinx, Demolitionist",
      "Yordle Squad",
    ]);
  });

  it("leaves the full pool alone when it is off", () => {
    expect(names(NO_FILTERS)).toHaveLength(4);
  });
});
