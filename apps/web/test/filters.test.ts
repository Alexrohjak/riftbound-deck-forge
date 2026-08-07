import { describe, expect, it } from "vitest";
import {
  apply,
  copyLimit,
  MAX_COPIES,
  NO_FILTERS,
  orderShelf,
  ownedCount,
  type Filters,
  type ShelfRow,
  type Tab,
} from "../src/filters.js";
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

/**
 * **All is the cards you build with**, not every printing that exists. Three kinds are shown
 * elsewhere or nowhere: battlefields are landscape and break the grid wherever one lands,
 * runes are 6 names a Legend fills for you, and tokens can never be registered at all.
 */
describe("what the All tab shows", () => {
  const FIELD = card({ name: "Ionian Coast", types: ["battlefield"] });
  const RUNE = card({ name: "Fury Rune", types: ["rune"], superTypes: ["basic"] });
  const LEGEND = card({ name: "Jinx, Loose Cannon", types: ["legend"] });
  const TOKEN = card({ name: "Sprite", superTypes: ["token"] });
  const mixed = buildPool({
    schema: "forge.cards/1",
    counts: { names: 5, printings: 5, legends: 1, banned: 0 },
    cards: [ONE, FIELD, RUNE, LEGEND, TOKEN],
  });
  const inTab = (tab: Tab) => apply(mixed.cards, { ...NO_FILTERS, tab }).map((c) => c.name);

  it("is the Main Deck pool and the Legends, and nothing else", () => {
    expect(inTab("all")).toEqual(["Yordle Squad", "Jinx, Loose Cannon"]);
  });

  it("still shows battlefields and runes in their own tabs, which are now the only route", () => {
    expect(inTab("battlefield")).toEqual(["Ionian Coast"]);
    expect(inTab("rune")).toEqual(["Fury Rune"]);
  });

  it("shows a token in no tab at all — it is created in play, never registered", () => {
    for (const tab of ["all", "legend", "main", "battlefield", "rune"] as Tab[]) {
      expect(inTab(tab)).not.toContain("Sprite");
    }
  });

  it("keeps Main Deck to what goes in the forty", () => {
    expect(inTab("main")).toEqual(["Yordle Squad"]);
  });
});

/**
 * **The boxes cap a deck as hard as the rulebook.** Counting to three on a card you own one
 * of builds a deck that cannot be sleeved — the exact confusion this tool exists to remove.
 */
describe("how many copies the workshop will take", () => {
  const limit = (c: Card, tracked = true) => copyLimit(c, COLLECTION, tracked);

  it("stops at the copies you hold rather than at three", () => {
    expect(limit(ONE)).toBe(1);
  });

  it("counts a name across its arts, so two printings are one pool of copies", () => {
    // One base + two alt = three, and three is where L13 lands anyway.
    expect(limit(SPLIT)).toBe(3);
  });

  it("never lets a deep holding raise the cap above L13's three", () => {
    // Four copies of the spell are in the boxes. The fourth is still unplayable.
    expect(limit(SPELL)).toBe(MAX_COPIES);
  });

  it("takes none of a card you own none of", () => {
    expect(limit(NONE)).toBe(0);
  });

  it("falls back to the rulebook when no collection has been entered", () => {
    // ⚠️ The whole gallery would black out otherwise — in the moment before D1 answers, and
    // permanently for anyone who has not imported a collection yet.
    expect(copyLimit(NONE, {}, false)).toBe(MAX_COPIES);
    expect(copyLimit(ONE, {}, false)).toBe(MAX_COPIES);
  });

  it("exempts runes and Legends, which the collection does not count", () => {
    // A Legend fills twelve runes by identity, and is itself the deck's identity rather than
    // a copy in it. Capping either would block the first step of a build.
    expect(limit(card({ name: "Fury Rune", types: ["rune"] }))).toBe(Infinity);
    expect(limit(card({ name: "Jinx, Loose Cannon", types: ["legend"] }))).toBe(Infinity);
  });
});

/**
 * **The shelf is objects, the gallery is names.** A card's `release` is where its *name*
 * first appeared, so ordering printings by their card put every reprint back beside the
 * original — the SFD printing of Yasuo filed inside the OGN block. 42 cards are reprinted,
 * so it was wrong in 42 places, and each one contradicted the box it describes.
 */
describe("the order of the shelf", () => {
  const SETS = ["OGN", "OGS", "SFD", "UNL", "VEN"];

  const YASUO = card({
    name: "Yasuo, Windrider",
    release: 205,
    printings: [
      { id: "ogn-205-298", code: "OGN-205/298", set: "OGN", n: 205, img: "https://i/y1" },
      { id: "ogn-205a-298", code: "OGN-205a/298", set: "OGN", n: 205, img: "https://i/y2", alt: true },
      { id: "sfd-235-221", code: "SFD-235/221", set: "SFD", n: 235, img: "https://i/y3" },
      { id: "sfd-235s-221", code: "SFD-235*/221", set: "SFD", n: 235, img: "https://i/y4", star: true },
    ],
  });
  const LATE_OGN = card({
    name: "Zaun Alley",
    release: 280,
    printings: [{ id: "ogn-280-298", code: "OGN-280/298", set: "OGN", n: 280, img: "https://i/z" }],
  });
  const EARLY_SFD = card({
    name: "Chem-Baroness",
    release: 200_001,
    printings: [{ id: "sfd-001-221", code: "SFD-001/221", set: "SFD", n: 1, img: "https://i/c" }],
  });

  /** One row per printing, handed over in card order — the shape `App` builds. */
  const rows: ShelfRow[] = [YASUO, LATE_OGN, EARLY_SFD].flatMap((c) =>
    c.printings.map((printing) => ({ card: c, printing, owned: printing.set === "SFD" ? 3 : 1 })),
  );
  const ids = (sort: Filters["sort"]): string[] =>
    orderShelf(rows, sort, SETS).map((r) => r.printing.id);

  it("files a reprint under the set it came out of, not beside the original", () => {
    expect(ids({ key: "release", desc: false })).toEqual([
      "ogn-205-298",
      "ogn-205a-298",
      "ogn-280-298",
      "sfd-001-221",
      "sfd-235-221",
      "sfd-235s-221",
    ]);
  });

  it("keeps alternate arts behind the base printing they share a number with", () => {
    const order = ids({ key: "release", desc: false });
    expect(order.indexOf("ogn-205-298")).toBeLessThan(order.indexOf("ogn-205a-298"));
    expect(order.indexOf("sfd-235-221")).toBeLessThan(order.indexOf("sfd-235s-221"));
  });

  it("reverses the whole shelf, printings included, when the direction flips", () => {
    expect(ids({ key: "release", desc: true })).toEqual(
      [...ids({ key: "release", desc: false })].reverse(),
    );
  });

  it("sorts by copies held, deepest first", () => {
    // The three SFD printings are held 3 deep, everything else 1.
    expect(ids({ key: "copies", desc: false }).slice(0, 2)).toEqual([
      "sfd-001-221",
      "sfd-235-221",
    ]);
  });

  it("honours the direction toggle on copies held, which used to do nothing", () => {
    // The Owned view hardcoded descending, so a second press moved the arrow and not the
    // cards. Shallowest first is the useful half: it is where the singletons are.
    expect(ids({ key: "copies", desc: true }).slice(0, 2)).toEqual([
      "ogn-205-298",
      "ogn-205a-298",
    ]);
  });

  it("falls back to set order whenever the key ties, so the shelf never shuffles itself", () => {
    // Every one of these cards costs 3. Without the fallback the order would be whatever
    // the rows arrived in, and would change as you enter more cards.
    expect(ids({ key: "cost", desc: false })).toEqual(ids({ key: "release", desc: false }));
  });
});
