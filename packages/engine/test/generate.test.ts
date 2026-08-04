import { describe, expect, it } from "vitest";
import { buildBrief, toDeck, staticCardIndex, type CardFacts } from "../src/index.js";

/**
 * The brief is what a proposal is judged against, so the things worth pinning are the ones
 * that would let an *illegal or dishonest* proposal look reasonable:
 *
 * - a pool containing cards outside the Legend's identity would invite an illegal deck
 * - a "build around this" card silently dropped is the most annoying failure a generator has
 * - ownership counted per printing rather than per name would misreport what you can sleeve
 */

const FACTS: Record<string, CardFacts> = {
  "legend-ahri": {
    name: "Nine-Tailed Fox",
    types: ["legend"],
    domains: ["calm", "mind"],
    text: "Exhaust: draw a card.",
    championTag: "Ahri",
  },
  "calm-unit": { name: "Calm Body", types: ["unit"], domains: ["calm"], energy: 2, might: 3 },
  "mind-spell": { name: "Mind Trick", types: ["spell"], domains: ["mind"], energy: 1 },
  "colorless": { name: "Anyone's Gear", types: ["gear"], domains: ["colorless"], energy: 1 },
  "fury-unit": { name: "Fury Body", types: ["unit"], domains: ["fury"], energy: 2, might: 4 },
  "banned-card": { name: "Aspirant's Climb", types: ["spell"], domains: ["calm"], banned: true },
  "a-token": { name: "Sprite", types: ["unit"], superTypes: ["token"], domains: ["calm"] },
  // The same card in two arts — one physical playset spread across printings.
  "art-a": { name: "Split Card", types: ["unit"], domains: ["mind"], energy: 3, might: 2 },
  "art-b": { name: "Split Card", types: ["unit"], domains: ["mind"], energy: 3, might: 2 },
};

const index = staticCardIndex(FACTS);
const pool = Object.entries(FACTS).map(([cardId, facts]) => ({ cardId, facts }));
const brief = (over: Partial<Parameters<typeof buildBrief>[0]> = {}, collection = {}) =>
  buildBrief({ legendCardId: "legend-ahri", ...over }, index, pool, collection);

describe("the pool a proposal may choose from", () => {
  it("is only what is legal under the Legend", () => {
    const names = brief().pool.map((c) => c.name);
    expect(names).toContain("Calm Body");
    expect(names).toContain("Mind Trick");
    expect(names).toContain("Anyone's Gear"); // colorless is legal everywhere (L12)
    expect(names).not.toContain("Fury Body"); // outside calm + mind (L9)
  });

  it("excludes banned cards, tokens and Legends", () => {
    const names = brief().pool.map((c) => c.name);
    expect(names).not.toContain("Aspirant's Climb");
    expect(names).not.toContain("Sprite");
    expect(names).not.toContain("Nine-Tailed Fox");
  });

  it("collapses printings to one entry per name", () => {
    expect(brief().pool.filter((c) => c.name === "Split Card")).toHaveLength(1);
  });

  it("carries rules text, which is the part worth reading", () => {
    expect(brief().legendAbility).toBe("Exhaust: draw a card.");
  });

  it("drops names you have said you never want to see again", () => {
    const names = brief({ excludeNames: ["Mind Trick"] }).pool.map((c) => c.name);
    expect(names).not.toContain("Mind Trick");
    expect(names).toContain("Calm Body");
  });

  it("reports the pool size, so a caller cannot imply it saw everything", () => {
    expect(brief().counts.poolNames).toBe(brief().pool.length);
  });
});

describe("building around cards you named", () => {
  it("resolves them", () => {
    expect(brief({ aroundCardIds: ["calm-unit"] }).around.map((c) => c.name)).toEqual([
      "Calm Body",
    ]);
  });

  it("⚠️ says when one is illegal rather than quietly ignoring it", () => {
    const b = brief({ aroundCardIds: ["fury-unit"] });
    expect(b.around).toEqual([]);
    expect(b.aroundRejected[0]?.name).toBe("Fury Body");
    expect(b.aroundRejected[0]?.because).toContain("L9");
  });

  it("says when one is banned", () => {
    expect(brief({ aroundCardIds: ["banned-card"] }).aroundRejected[0]?.because).toContain(
      "Banned",
    );
  });

  it("says when it does not know the card at all", () => {
    expect(brief({ aroundCardIds: ["nonsense"] }).aroundRejected[0]?.because).toContain("Not a card");
  });
});

describe("what you own", () => {
  it("counts copies across arts, as ownership does everywhere else", () => {
    const b = brief({}, { "art-a": 1, "art-b": 2 });
    expect(b.pool.find((c) => c.name === "Split Card")?.owned).toBe(3);
  });

  it("reports zero rather than omitting a card you do not own", () => {
    // Omitting it would hide a legal option; the label is what distinguishes them.
    expect(brief({}, {}).pool.find((c) => c.name === "Calm Body")?.owned).toBe(0);
  });
});

describe("the targets a proposal must hit", () => {
  it("states them as numbers rather than leaving them to be remembered", () => {
    const t = brief().targets;
    expect(t.mainDeck).toBe(40);
    expect(t.runes).toBe(12);
    expect(t.battlefields).toBe(3);
    expect(t.maxCopiesPerName).toBe(3);
    expect(t.official.signatureSlots).toBe(3);
  });
});

describe("turning a proposal into a deck the checks understand", () => {
  it("maps each list into its zone and drops empty slots", () => {
    const deck = toDeck({
      legendCardId: "legend-ahri",
      chosenChampionCardId: "calm-unit",
      main: [{ cardId: "mind-spell", quantity: 3 }, { cardId: "colorless", quantity: 0 }],
      runes: [{ cardId: "art-a", quantity: 12 }],
      battlefields: [{ cardId: "art-b", quantity: 3 }],
    });
    expect(deck.slots).toHaveLength(3);
    expect(deck.slots.find((s) => s.zone === "RUNE")?.quantity).toBe(12);
    expect(deck.slots.some((s) => s.cardId === "colorless")).toBe(false);
    expect(deck.chosenChampionCardId).toBe("calm-unit");
  });
});
