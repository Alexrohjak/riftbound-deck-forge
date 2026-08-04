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
const JINX = card({
  name: "Jinx, Demolitionist",
  printings: [{ id: "ogn-030-298", code: "OGN-030/298", set: "OGN", n: 30, img: "https://i/e?t=1" }],
});

const pool = buildPool({
  schema: "forge.cards/1",
  counts: { names: 4, printings: 5, legends: 0, banned: 0 },
  cards: [SCORCHER, HOPEFUL, VEN_CARD, JINX],
});

const parse = (raw: string, set = "OGN") => parseEntry(raw, pool, set);

describe("typing a collector number", () => {
  it("finds the card in the set you are working through", () => {
    expect(parse("12")?.cands[0]?.name).toBe("Noxus Hopeful");
  });

  it("keeps the sets apart — the same number is a different card in each", () => {
    expect(parse("12", "VEN")?.cands[0]?.name).toBe("Venture Forth");
  });

  it("takes a suffix for alternate art", () => {
    const hit = parse("1a");
    expect(hit?.cands[0]?.name).toBe("Blazing Scorcher");
  });

  it("says which number missed rather than silently matching something else", () => {
    expect(parse("999")?.miss).toBe("OGN 999");
    expect(parse("999")?.cands).toEqual([]);
  });

  it("jumps set inline, so you can enter one stray card without leaving the row", () => {
    expect(parse("ven 12")?.cands[0]?.name).toBe("Venture Forth");
  });

  it("ignores a set prefix that is not a set, treating it as a name", () => {
    // "jin x" must not be read as set "jin" — it is someone typing a name.
    expect(parse("jinx")?.cands[0]?.name).toBe("Jinx, Demolitionist");
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
    expect(back?.cands[0]?.name).toBe("Noxus Hopeful");
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
    expect(parse("noxus hopeful")?.cands[0]?.name).toBe("Noxus Hopeful");
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
