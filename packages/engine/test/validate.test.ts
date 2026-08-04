import { describe, expect, it } from "vitest";
import { buildBrief, staticCardIndex, validateProposal, type CardFacts } from "../src/index.js";

/**
 * The gate a generated deck passes through.
 *
 * ⚠️ The test that matters most is **invented card ids**. A hand-built deck cannot contain a
 * card that does not exist — the gallery only offers real ones. A generated one can, and
 * `checkLegality` cannot see it: an unknown printing falls back to its own id as a name, so
 * forty invented cards pass every count and every copy limit and look like a deck nobody
 * owns. That is the one failure mode unique to this path, and it has to be caught here.
 */

const FACTS: Record<string, CardFacts> = {
  legend: {
    name: "Nine-Tailed Fox",
    types: ["legend"],
    domains: ["calm", "mind"],
    championTag: "Ahri",
  },
  champ: {
    name: "Ahri, Alluring",
    types: ["unit"],
    superTypes: ["champion"],
    tags: ["Ahri"],
    domains: ["calm"],
    energy: 3,
  },
  filler: { name: "Calm Body", types: ["unit"], domains: ["calm"], energy: 2 },
  filler2: { name: "Mind Body", types: ["unit"], domains: ["mind"], energy: 3 },
  rune: { name: "Calm Rune", types: ["rune"], domains: ["calm"] },
  field: { name: "A Field", types: ["battlefield"], domains: ["colorless"] },
  outsider: { name: "Fury Body", types: ["unit"], domains: ["fury"], energy: 2 },
};

const cards = staticCardIndex(FACTS);
const pool = Object.entries(FACTS).map(([cardId, facts]) => ({ cardId, facts }));
const brief = (over = {}) => buildBrief({ legendCardId: "legend", ...over }, cards, pool);

/** A legal-by-construction proposal: 40 main (champion + 39), 12 runes, 3 battlefields. */
const legalProposal = (over = {}) => ({
  legendCardId: "legend",
  chosenChampionCardId: "champ",
  main: [
    { cardId: "filler", quantity: 3 },
    { cardId: "filler2", quantity: 3 },
    // 33 more from a repeated pair would break copy limits, so the fixture keeps it simple
    // and accepts the L3 shortfall in tests that are not about L3.
  ],
  runes: [{ cardId: "rune", quantity: 12 }],
  battlefields: [{ cardId: "field", quantity: 3 }],
  ...over,
});

describe("cards that do not exist", () => {
  it("catches an invented id, which no legality check can", () => {
    const v = validateProposal(
      legalProposal({ main: [{ cardId: "not-a-real-card", quantity: 3 }] }),
      brief(),
      cards,
    );
    expect(v.unknownCardIds).toEqual(["not-a-real-card"]);
    expect(v.usable).toBe(false);
    expect(v.repairs.find((r) => r.check === "pool")?.fix).toContain("not in the supplied pool");
  });

  it("checks the singular fields too, not just the slots", () => {
    const v = validateProposal(
      legalProposal({ chosenChampionCardId: "invented-champion" }),
      brief(),
      cards,
    );
    expect(v.unknownCardIds).toContain("invented-champion");
  });

  it("⚠️ accepts a different printing of a pool card — it is the same card", () => {
    // Fury Rune was reported as "not in the supplied pool" because the brief listed a
    // different art of it. The listing collapses by name; the slot does not have to.
    const twoArts = staticCardIndex({
      ...FACTS,
      "rune-alt": { name: "Calm Rune", types: ["rune"], domains: ["calm"] },
    });
    const both = [
      ...pool,
      { cardId: "rune-alt", facts: { name: "Calm Rune", types: ["rune"], domains: ["calm"] } },
    ];
    const b = buildBrief({ legendCardId: "legend" }, twoArts, both);
    expect(b.pool.filter((c) => c.name === "Calm Rune")).toHaveLength(1);
    expect(b.legalCardIds).toContain("rune-alt");

    const v = validateProposal(
      legalProposal({ runes: [{ cardId: "rune-alt", quantity: 12 }] }),
      b,
      twoArts,
    );
    expect(v.unknownCardIds).toEqual([]);
  });

  it("reports each invented id once however often it was used", () => {
    const v = validateProposal(
      legalProposal({
        main: [
          { cardId: "ghost", quantity: 2 },
          { cardId: "ghost", quantity: 1 },
        ],
      }),
      brief(),
      cards,
    );
    expect(v.unknownCardIds).toEqual(["ghost"]);
  });
});

describe("turning a failure into an instruction", () => {
  it("says how many cards to add rather than what the count is", () => {
    const v = validateProposal(legalProposal(), brief(), cards);
    const l3 = v.repairs.find((r) => r.check === "L3");
    expect(l3?.fix).toMatch(/^Add \d+ more Main Deck cards/);
    expect(l3?.fix).toContain("Chosen Champion counts inside the 40");
  });

  it("says to remove when there are too many", () => {
    const v = validateProposal(
      legalProposal({ runes: [{ cardId: "rune", quantity: 15 }] }),
      brief(),
      cards,
    );
    expect(v.repairs.find((r) => r.check === "L4")?.fix).toBe("Remove 3 runes.");
  });

  it("names the identity when a card falls outside it", () => {
    const v = validateProposal(
      legalProposal({ main: [{ cardId: "outsider", quantity: 1 }] }),
      brief(),
      cards,
    );
    const l9 = v.repairs.find((r) => r.check === "L9");
    expect(l9?.fix).toContain("calm + mind");
  });

  it("counts each zone against its own target", () => {
    const v = validateProposal(
      legalProposal({ battlefields: [{ cardId: "field", quantity: 1 }] }),
      brief(),
      cards,
    );
    expect(v.repairs.find((r) => r.check === "L5")?.fix).toBe("Add 2 more battlefields.");
    expect(v.counts.battlefields).toBe(1);
  });
});

describe("the cards you asked to build around", () => {
  it("⚠️ objects when the proposal quietly dropped one", () => {
    const v = validateProposal(
      legalProposal(),
      brief({ aroundCardIds: ["filler2"] }),
      cards,
    );
    // filler2 IS in this proposal, so ask for one that is not.
    const missing = validateProposal(
      legalProposal({ main: [{ cardId: "filler", quantity: 3 }] }),
      brief({ aroundCardIds: ["filler2"] }),
      cards,
    );
    expect(v.repairs.some((r) => r.check === "seed")).toBe(false);
    expect(missing.repairs.find((r) => r.check === "seed")?.fix).toContain("Mind Body");
    expect(missing.usable).toBe(false);
  });
});

describe("what usable means", () => {
  it("is never true for an illegal deck", () => {
    expect(validateProposal(legalProposal(), brief(), cards).usable).toBe(false);
  });

  it("keeps ownership out of the verdict — a deck you cannot build is still legal", () => {
    const v = validateProposal(legalProposal(), brief(), cards, {});
    expect(v.warnings.some((w) => w.check === "L26")).toBe(true);
    // The warning exists, and it is not what made `legal` false.
    expect(v.legality.violations.some((x) => x.check === "L26")).toBe(false);
  });
});
