import { describe, expect, it } from "vitest";
import { parseEntry } from "../src/AddCards.js";
import { buildPool, type Card } from "../src/cards.js";

/**
 * The entry parser is the whole ergonomics of `W2`: hundreds of cards typed as
 * number → Enter → number → Enter. Every rule here exists because a real collector number
 * needed it, and getting one wrong means registering a card you do not own — which is worse
 * than registering nothing, because the shortfall warnings then lie in the reassuring
 * direction.
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
  printings: [{ id: `${over.name}-1`, code: "OGN-001/298", set: "OGN", n: 1, img: "https://i/x?a=1" }],
  ...over,
});

const SCORCHER = card({
  name: "Blazing Scorcher",
  printings: [
    { id: "ogn-001-298", code: "OGN-001/298", set: "OGN", n: 1, img: "https://i/a?t=1" },
    { id: "ogn-001a-298", code: "OGN-001a/298", set: "OGN", n: 1, img: "https://i/b?t=1", alt: true },
  ],
});
const HOPEFUL = card({
  name: "Noxus Hopeful",
  printings: [{ id: "ogn-012-298", code: "OGN-012/298", set: "OGN", n: 12, img: "https://i/c?t=1" }],
});
const VEN_CARD = card({
  name: "Venture Forth",
  release: 2,
  printings: [{ id: "ven-012-166", code: "VEN-012/166", set: "VEN", n: 12, img: "https://i/d?t=1" }],
});
/**
 * A reprint whose newest printing is a Vendetta promo. This is the real shape of the six
 * `VEN-SP` Champions: the card's base printing is in an older set, so the promo lives behind
 * it as an alternate — reachable only by typing its own designator.
 */
const JINX = card({
  name: "Jinx, Demolitionist",
  printings: [
    { id: "ogn-030-298", code: "OGN-030/298", set: "OGN", n: 30, img: "https://i/e?t=1" },
    { id: "ven-sp1-006", code: "VEN-SP1/006", set: "VEN", n: 1, img: "https://i/f?t=1" },
  ],
});
/** A promo code with no set total after it, which the old prefix match could not reach. */
const RUNE = card({
  name: "Fury Rune",
  release: 2,
  printings: [{ id: "ven-r01", code: "VEN-R01", set: "VEN", n: 1, img: "https://i/g?t=1" }],
});

const pool = buildPool({
  schema: "forge.cards/1",
  counts: { names: 5, printings: 7, legends: 0, banned: 0 },
  cards: [SCORCHER, HOPEFUL, VEN_CARD, JINX, RUNE],
});

const parse = (raw: string, set = "OGN") => parseEntry(raw, pool, set);

describe("typing a collector number", () => {
  it("finds the card in the set you are working through", () => {
    expect(parse("12")?.cands[0]?.card.name).toBe("Noxus Hopeful");
  });

  it("keeps the sets apart — the same number is a different card in each", () => {
    expect(parse("12", "VEN")?.cands[0]?.card.name).toBe("Venture Forth");
  });

  it("⚠️ takes a suffix for alternate art — and returns THAT printing", () => {
    // `197a` used to find Teemo and then register OGN-197, the base art, because the
    // caller re-derived a printing and took the first in the set. Typing the suffix and
    // getting the other card is the exact mistake the suffix exists to prevent, and it is
    // invisible: both are perfectly real entries.
    const base = parse("1");
    expect(base?.cands[0]?.printing.code).toBe("OGN-001/298");

    const alt = parse("1a");
    expect(alt?.cands[0]?.card.name).toBe("Blazing Scorcher");
    expect(alt?.cands[0]?.printing.code).toBe("OGN-001a/298");
    expect(alt?.cands[0]?.printing.id).toBe("ogn-001a-298");
  });

  it("a name match takes the set's base printing — a name cannot name an art", () => {
    expect(parse("blazing")?.cands[0]?.printing.code).toBe("OGN-001/298");
  });

  it("says which number missed rather than silently matching something else", () => {
    expect(parse("999")?.miss).toBe("OGN 999");
    expect(parse("999")?.cands).toEqual([]);
  });

  it("⚠️ reaches a lettered designator — the six VEN-SP promos had no input at all", () => {
    // `SP3` did not parse, and plain `3` was padded into `VEN-003` — a different card,
    // registered silently. Both halves are asserted: the promo is found, and it is found
    // as ITS printing rather than the base art in the older set.
    const promo = parse("sp1", "VEN");
    expect(promo?.cands[0]?.card.name).toBe("Jinx, Demolitionist");
    expect(promo?.cands[0]?.printing.code).toBe("VEN-SP1/006");
  });

  it("takes a designator with no set total after it", () => {
    expect(parse("r01", "VEN")?.cands[0]?.printing.code).toBe("VEN-R01");
  });

  it("reads leading zeros and case as noise, because a shelf does", () => {
    expect(parse("012")?.cands[0]?.card.name).toBe("Noxus Hopeful");
    expect(parse("SP1", "VEN")?.cands[0]?.printing.code).toBe("VEN-SP1/006");
    expect(parse("r1", "VEN")?.cands[0]?.printing.code).toBe("VEN-R01");
  });

  it("⚠️ a number still never reaches a designator that merely contains it", () => {
    // The guard the old trailing slash provided: VEN 1 is Vendetta's card 1, and must not
    // fall through to `VEN-SP1` or `VEN-R01` just because they carry the digit.
    expect(parse("1", "VEN")?.cands).toEqual([]);
    expect(parse("1", "VEN")?.miss).toBe("VEN 1");
  });

  it("jumps set inline, so you can enter one stray card without leaving the row", () => {
    expect(parse("ven 12")?.cands[0]?.card.name).toBe("Venture Forth");
  });

  it("ignores a set prefix that is not a set, treating it as a name", () => {
    // "jin x" must not be read as set "jin" — it is someone typing a name.
    expect(parse("jinx")?.cands[0]?.card.name).toBe("Jinx, Demolitionist");
  });
});

describe("quantities", () => {
  it("multiplies with x, because playsets arrive four at a time", () => {
    expect(parse("12 x3")?.mult).toBe(3);
    expect(parse("12x3")?.mult).toBe(3);
    expect(parse("12 *4")?.mult).toBe(4);
  });

  it("subtracts on a trailing minus — miscounting is constant", () => {
    const back = parse("12-");
    expect(back?.sign).toBe(-1);
    expect(back?.cands[0]?.card.name).toBe("Noxus Hopeful");
  });

  it("combines a multiplier with a subtraction", () => {
    const undo = parse("12 x2-");
    expect(undo?.mult).toBe(2);
    expect(undo?.sign).toBe(-1);
  });

  it("clamps a silly multiplier rather than trusting it", () => {
    expect(parse("12 x999")?.mult).toBe(99);
  });
});

describe("typing a name", () => {
  it("waits for two characters before guessing", () => {
    expect(parse("j")?.typing).toBe(true);
    expect(parse("j")?.cands).toEqual([]);
  });

  it("ranks an exact name above a partial one", () => {
    expect(parse("noxus hopeful")?.cands[0]?.card.name).toBe("Noxus Hopeful");
  });

  it("reports how many matched, so 'keep typing' is a fact rather than a nag", () => {
    const many = parse("e");
    expect(many?.typing).toBe(true);
    const some = parse("no");
    expect((some?.total ?? 0) >= 1).toBe(true);
  });

  it("returns nothing for an empty field", () => {
    expect(parse("")).toBeNull();
    expect(parse("   ")).toBeNull();
  });
});
