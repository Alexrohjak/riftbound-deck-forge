import { describe, expect, it } from "vitest";
import { buildPool, isDeckable, search, thumb, zoneFor, type Card } from "../src/cards.js";

/**
 * The collapse is the part that can be silently wrong: merge two cards that share a name
 * and the copy limits go quietly wrong, which DATA-MODEL §2 calls the worst failure shape
 * available. These tests pin the behaviour the real index relies on.
 */

const card = (over: Partial<Card> & { name: string }): Card => ({
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

const DEMOLITIONIST = card({
  name: "Jinx, Demolitionist",
  energy: 3,
  might: 4,
  domains: ["fury"],
  superTypes: ["champion"],
  tags: ["Jinx"],
  printings: [
    { id: "ogn-030-298", code: "OGN-030/298", set: "OGN", n: 30, img: "https://i/a?t=1" },
    { id: "ven-168-166", code: "VEN-168/166", set: "VEN", n: 168, img: "https://i/b?t=1" },
    { id: "ogn-030a-298", code: "OGN-030a/298", set: "OGN", n: 30, img: "https://i/c?t=1", alt: true },
  ],
});
const REBEL = card({
  name: "Jinx, Rebel",
  energy: 5,
  might: 5,
  domains: ["chaos"],
  tags: ["Jinx"],
  printings: [{ id: "ogn-202-298", code: "OGN-202/298", set: "OGN", n: 202, img: "https://i/d?t=1" }],
});
const ROCKET = card({
  name: "Super Mega Death Rocket!",
  types: ["spell"],
  tags: ["Jinx"],
  text: "Deal 4 damage.",
});
const RUNE = card({ name: "Fury Rune", types: ["rune"], energy: null, might: null });
const TOKEN = card({ name: "Bird", superTypes: ["token"] });
const LEGEND = card({ name: "Loose Cannon", types: ["legend"], energy: null, might: null });

const pool = buildPool({
  schema: "forge.cards/1",
  counts: { names: 6, printings: 8, legends: 1, banned: 0 },
  cards: [DEMOLITIONIST, REBEL, ROCKET, RUNE, TOKEN, LEGEND],
});

describe("collapsing printings onto cards", () => {
  it("resolves every alternate art to the same card", () => {
    for (const id of ["ogn-030-298", "ven-168-166", "ogn-030a-298"]) {
      expect(pool.byPrinting.get(id)?.name).toBe("Jinx, Demolitionist");
    }
  });

  it("keeps two different cards apart even though both are Jinx", () => {
    // The distinguishing part is IN the name. Merging these would be the silent bug.
    expect(pool.byPrinting.get("ogn-030-298")?.energy).toBe(3);
    expect(pool.byPrinting.get("ogn-202-298")?.energy).toBe(5);
    expect(pool.byName.size).toBe(6);
  });

  it("gives the engine identical facts for every printing of a name", () => {
    // This is what makes the 3-copy limit count correctly across alternate arts.
    expect(pool.index.nameOf("ven-168-166")).toBe(pool.index.nameOf("ogn-030a-298"));
    expect(pool.index.domainsOf?.("ven-168-166")).toEqual(["fury"]);
    expect(pool.index.energyOf?.("ogn-030a-298")).toBe(3);
  });
});

describe("what belongs in a deck", () => {
  it("routes cards to the zone their type demands", () => {
    expect(zoneFor(DEMOLITIONIST)).toBe("MAIN");
    expect(zoneFor(RUNE)).toBe("RUNE");
    expect(zoneFor(card({ name: "Noxus", types: ["battlefield"] }))).toBe("BATTLEFIELD");
  });

  it("excludes tokens and Legends from the buildable list", () => {
    // Tokens are created in play and never registered; the Legend has its own picker.
    expect(isDeckable(TOKEN)).toBe(false);
    expect(isDeckable(LEGEND)).toBe(false);
    expect(isDeckable(DEMOLITIONIST)).toBe(true);
  });
});

describe("search over 935 cards", () => {
  const all = [DEMOLITIONIST, REBEL, ROCKET, RUNE, TOKEN, LEGEND];

  it("ranks name matches above text and tag matches", () => {
    // "jinx" must not bury the Jinx cards under everything tagged Jinx.
    const hits = search(all, "jinx").map((c) => c.name);
    expect(hits.slice(0, 2)).toEqual(["Jinx, Demolitionist", "Jinx, Rebel"]);
    expect(hits).toContain("Super Mega Death Rocket!");
  });

  it("finds cards by what they do, not just what they are called", () => {
    expect(search(all, "damage").map((c) => c.name)).toEqual(["Super Mega Death Rocket!"]);
  });

  it("requires every term, so extra words narrow rather than widen", () => {
    expect(search(all, "jinx rebel").map((c) => c.name)).toEqual(["Jinx, Rebel"]);
  });

  it("returns everything for an empty query", () => {
    expect(search(all, "   ")).toHaveLength(all.length);
  });
});

describe("thumbnails", () => {
  it("always requests a sized image", () => {
    // Full-size scans are ~1 MB each. A list of 40 unsized images is ~40 MB and locks the
    // renderer — which is exactly what happened before this existed.
    const printing = DEMOLITIONIST.printings[0];
    if (!printing) throw new Error("fixture has no printing");
    const url = thumb(printing, 96);
    expect(url).toContain("w=96");
    expect(url).toContain("fm=webp");
    expect(url.startsWith(printing.img)).toBe(true);
  });
});
