import { describe, expect, it } from "vitest";
import { buildPool, hd, isDeckable, nativeWidth, printingOf, search, srcSet, thumb, zoneFor, type Card } from "../src/cards.js";

/**
 * The collapse is the part that can be silently wrong: merge two cards that share a name
 * and the copy limits go quietly wrong, which DATA-MODEL §2 calls the worst failure shape
 * available. These tests pin the behaviour the real index relies on.
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
  // The classification tags EE filters candidates on. Present here because the plumbing
  // that carries them from the index to `suggest()` is what these tests cover.
  produces: ["damage", "kill"],
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

/**
 * **A deck stores printings; the gallery collapses them.** Drawing a slot from
 * `printings[0]` because the `Card` was already to hand is why picking an alternate art
 * looked like it did nothing — the choice reached the deck and D1, and the tray kept
 * drawing the base art of every card in it.
 */
describe("which art a deck slot draws", () => {
  it("draws the printing the slot holds, not the card's default", () => {
    expect(printingOf(DEMOLITIONIST, "ogn-030a-298")?.code).toBe("OGN-030a/298");
    expect(printingOf(DEMOLITIONIST, "ven-168-166")?.code).toBe("VEN-168/166");
  });

  it("falls back to the default rather than to an empty slot", () => {
    // A deck saved with a printing this pool no longer carries still shows you the card.
    expect(printingOf(DEMOLITIONIST, "sfd-999-221")?.code).toBe("OGN-030/298");
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

describe("the pool EE suggests from", () => {
  it("is the same facts legality ran against, not a second assembly", () => {
    // If these ever diverge, EE recommends cards the checks reject — and the two would
    // disagree in a way neither could report.
    expect(pool.pool.length).toBeGreaterThan(0);
    for (const entry of pool.pool) {
      expect(pool.byPrinting.get(entry.cardId)?.name).toBe(entry.facts.name);
    }
  });

  it("carries the tags suggest() filters on, or it would return nothing", () => {
    const withProduces = pool.pool.filter((p) => (p.facts.produces ?? []).length > 0);
    expect(withProduces.length).toBeGreaterThan(0);
  });

  it("keeps the banned flag, so a suggestion is never illegal", () => {
    expect(pool.pool.every((p) => typeof p.facts.banned === "boolean")).toBe(true);
  });
});

/**
 * The set chips drive the entry field, which is worked one set at a time against a physical
 * pile. Listing them out of order is not cosmetic there — it is the order you sort boxes in.
 */
describe("the order of the sets", () => {
  const setsOf = (cards: Card[]): string[] =>
    buildPool({
      schema: "forge.cards/1",
      counts: { names: cards.length, printings: cards.length, legends: 0, banned: 0 },
      cards,
    }).sets;

  const at = (name: string, release: number, printings: Card["printings"]): Card =>
    card({ name, release, printings });

  it("ranks a set by the cards it introduced, never by the reprints it carries", () => {
    // Pouty Poro is an OGN card reprinted as UNL-220. When every printing voted, its OGN
    // rank was cast for UNL too and put the whole set ahead of SFD.
    const poro = at("Pouty Poro", 13, [
      { id: "ogn-013-298", code: "OGN-013/298", set: "OGN", n: 13, img: "https://i/a" },
      { id: "unl-220-219", code: "UNL-220/219", set: "UNL", n: 220, img: "https://i/b" },
    ]);
    const sfd = at("Chem-Baroness", 200_001, [
      { id: "sfd-001-221", code: "SFD-001/221", set: "SFD", n: 1, img: "https://i/c" },
    ]);
    const unl = at("Green Father", 300_001, [
      { id: "unl-001-219", code: "UNL-001/219", set: "UNL", n: 1, img: "https://i/d" },
    ]);
    expect(setsOf([poro, sfd, unl])).toEqual(["OGN", "SFD", "UNL"]);
  });

  it("still lists a set that exists only as reprints, rather than dropping it", () => {
    // Dropping it would make its cards unenterable, which is worse than listing it late.
    const only = at("Vi, Destructive", 36, [
      { id: "ogn-036-298", code: "OGN-036/298", set: "OGN", n: 36, img: "https://i/e" },
      { id: "ven-167-166", code: "VEN-167/166", set: "VEN", n: 167, img: "https://i/f" },
    ]);
    expect(setsOf([only])).toEqual(["OGN", "VEN"]);
  });
});

/**
 * Image widths are a correctness problem, not a polish one. Ask for less than the box you
 * are about to draw and the picture is soft; ask for more than the scan Riot holds and the
 * CDN upscales — 118 KB instead of 91 KB for a battlefield with no more detail in it.
 */
describe("how big an image to ask for", () => {
  const portrait = {
    id: "ogn-001-298", code: "OGN-001/298", set: "OGN", n: 1,
    img: "https://cms/img/15ed971e-744x1039.png?accountingTag=RB",
  };
  const battlefield = {
    id: "ogn-275-298", code: "OGN-275/298", set: "OGN", n: 275,
    img: "https://cms/img/9a71bc02-1038x744.png?accountingTag=RB",
  };
  const widths = (p: typeof portrait): number[] =>
    srcSet(p).split(", ").map((rung) => Number(rung.split(" ")[1]?.replace("w", "")));

  it("reaches the battlefield's full 1038, which the old flat ceiling of 820 could not", () => {
    // Every battlefield is 1038 wide and every one of them was capped at 820 — a 79% scan,
    // drawn across two grid columns. That is what made them look soft beside the portraits.
    expect(widths(battlefield).at(-1)).toBe(1038);
  });

  it("stops at 744 for a portrait, because there is nothing above it to fetch", () => {
    expect(widths(portrait).at(-1)).toBe(744);
    expect(widths(portrait).some((w) => w > 744)).toBe(false);
  });

  it("keeps the ladder ascending, or the browser cannot choose a rung", () => {
    for (const card of [portrait, battlefield]) {
      const rungs = widths(card);
      expect([...rungs].sort((a, b) => a - b)).toEqual(rungs);
    }
  });

  it("never asks the CDN to upscale, however large the box", () => {
    expect(hd(battlefield, 4000)).toContain("w=1038");
    expect(hd(portrait, 4000)).toContain("w=744");
  });

  it("assumes a portrait when the URL carries no dimensions, rather than guessing big", () => {
    expect(nativeWidth({ ...portrait, img: "https://cms/img/nothing.png" })).toBe(744);
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
