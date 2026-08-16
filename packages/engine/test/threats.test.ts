import { describe, expect, it } from "vitest";
import { readThreats, staticCardIndex, type CardEntry, type PoolCard } from "../src/index.js";
import type { Deck } from "../src/types.js";

/**
 * **Q-THREAT** — *"what should I fear, and how do I handle it?"* (`EVALUATION §6.5`).
 *
 * ⚠️ **This runs the opposite way to `counter`.** `counterCounsel` starts from *their* Legend
 * and asks what beats it; this starts from **your deck** and asks what beats *you*.
 *
 * The tests that matter here are the ones about **not over-claiming**. Two of them cover a false
 * alarm this module actually produced against a real deck — *"623 of the format's 626 units
 * cannot be removed"*, said of a deck that could remove things perfectly well — because a
 * removal ceiling counted from printed numbers reads `0` on a deck whose removal says *"kill
 * target unit"*. A zero that means *"unmeasurable"* had been rendered as a zero that meant
 * *"helpless"*.
 */

const CARDS: Record<string, CardEntry> = {
  "legend-1": { name: "A Legend", types: ["legend"], domains: ["order"] },
  "champ-1": { name: "A Champion", types: ["unit"], superTypes: ["champion"], energy: 4, might: 5 },

  small: { name: "Small Body", types: ["unit"], domains: ["order"], energy: 1, might: 2 },
  big: { name: "Big Body", types: ["unit"], domains: ["order"], energy: 5, might: 5 },
  /** Above `SWEEP_SIZES` — beyond 5, a symmetric sweep is rare enough to be a bomb. */
  huge: { name: "Huge Body", types: ["unit"], domains: ["order"], energy: 7, might: 7 },

  burn: { name: "Burn", types: ["spell"], domains: ["fury"], energy: 2, text: "Deal 3 damage to a unit." },
  /** ⚠️ Kills, and prints no number — the card that produced the false alarm. */
  assassinate: {
    name: "Assassinate",
    types: ["spell"],
    domains: ["order"],
    energy: 4,
    role: "removal-kill",
    produces: ["kill"],
    text: "Kill target unit.",
  },
  counterspell: {
    name: "Deny",
    types: ["spell"],
    domains: ["calm"],
    energy: 2,
    role: "counter",
    produces: ["counter"],
    text: "Counter a spell.",
  },

  poolSmall: { name: "Pool Small", types: ["unit"], domains: ["order"], energy: 1, might: 1 },
  poolBig: { name: "Pool Big", types: ["unit"], domains: ["order"], energy: 6, might: 8 },
  poolBanned: { name: "Pool Banned", types: ["unit"], domains: ["order"], energy: 6, might: 9, banned: true },
};

const index = staticCardIndex(CARDS);
const pool: PoolCard[] = Object.entries(CARDS).map(([cardId, facts]) => ({ cardId, facts }));

const deckOf = (slots: { cardId: string; quantity: number }[]): Deck => ({
  id: "d",
  name: "Test Deck",
  state: "DRAFT",
  legendCardId: "legend-1",
  chosenChampionCardId: "champ-1",
  slots: slots.map((s) => ({ ...s, zone: "MAIN" as const })),
});

describe("sweep exposure", () => {
  it("names the smallest sweep that already takes half the board", () => {
    // The spec's own worked example. A "deal 5 to all" clearing everything is true of most
    // decks and tells you nothing — the smallest one that bites is the finding.
    const deck = deckOf([
      { cardId: "small", quantity: 6 },
      { cardId: "big", quantity: 4 },
    ]);
    const threat = readThreats(deck, index).threats.find((t) => t.class === "must-answer");
    expect(threat?.claim).toContain('"deal 2 to all"');
    // Six small bodies, plus the Chosen Champion counted back in as an eleventh card (Might 5).
    expect(threat?.claim).toContain("6 of your 11 bodies");
    expect(threat?.grounding.join(" ")).toContain("printed Might");
  });

  it("stays quiet when no small sweep reaches half the board", () => {
    // Every body above the largest sweep this module will name, so there is nothing to say.
    const deck = deckOf([{ cardId: "huge", quantity: 12 }]);
    expect(readThreats(deck, index).threats.some((t) => t.class === "must-answer")).toBe(false);
  });
});

describe("the removal ceiling", () => {
  it("reports what a printed damage ceiling cannot kill", () => {
    const deck = deckOf([
      { cardId: "burn", quantity: 3 },
      { cardId: "small", quantity: 6 },
    ]);
    const threat = readThreats(deck, index, pool).threats.find((t) => t.class === "board-dominant");
    expect(threat?.claim).toContain("tops out at 3 damage");
    // ⚠️ The banned 9-Might card must not be in the denominator.
    expect(threat?.grounding.join(" ")).toContain("unbanned units");
  });

  it("⚠️ does not call a deck helpless because its removal prints no number", () => {
    // The false alarm, fixed. `Assassinate` kills anything; `damagePrinted` reads 0 on it, and
    // the old code turned that into "every unit in the format is beyond your removal".
    const deck = deckOf([
      { cardId: "assassinate", quantity: 3 },
      { cardId: "small", quantity: 6 },
    ]);
    const read = readThreats(deck, index, pool);
    expect(read.threats.some((t) => t.class === "board-dominant")).toBe(false);
    // ⚠️ And it says why it went quiet, rather than just going quiet — an absent finding and an
    // unmeasurable one look identical to a caller otherwise.
    expect(read.unmodelled.join(" ")).toContain("without printing a damage number");
  });

  it("speaks about damage-based removal explicitly when there is genuinely none", () => {
    // A deck with no removal of any kind. The claim is now scoped to damage rather than
    // implying the deck cannot interact at all.
    const deck = deckOf([{ cardId: "small", quantity: 12 }]);
    const threat = readThreats(deck, index, pool).threats.find((t) => t.class === "board-dominant");
    expect(threat?.claim).toContain("damage-based removal");
    expect(threat?.grounding.join(" ")).toContain("spot-removal or sweep pattern");
  });

  it("skips the read entirely when no pool was supplied, rather than guessing a denominator", () => {
    const deck = deckOf([{ cardId: "burn", quantity: 3 }]);
    expect(readThreats(deck, index).threats.some((t) => t.class === "board-dominant")).toBe(false);
  });
});

describe("what the deck structurally cannot answer", () => {
  it("⚠️ writes a list as a list — commas, and one final 'and'", () => {
    // Grammar, and it is not cosmetic: "bomb and recursion and ambush threat and cheap Might
    // swing" reads as machine output, and a reader who notices the seam stops trusting the
    // number in front of it.
    const deck = deckOf([{ cardId: "small", quantity: 12 }]);
    const threat = readThreats(deck, index, pool).threats.find((t) => t.class === "answer-asymmetric");
    expect(threat?.claim).toContain("hard counter");
    expect(threat?.claim).toMatch(/bomb, recursion, ambush threat and cheap Might swing/);
    expect(threat?.claim).not.toContain("and recursion and");
  });

  it("stops naming a blind spot the deck has actually covered", () => {
    const deck = deckOf([
      { cardId: "counterspell", quantity: 3 },
      { cardId: "small", quantity: 9 },
    ]);
    const threat = readThreats(deck, index, pool).threats.find((t) => t.class === "answer-asymmetric");
    expect(threat?.claim).not.toContain("no hard counter");
  });

  it("grounds the blind spot in doctrine, and says the doctrine is contested", () => {
    // D-045 — the grounding line is assembled here, not authored by the mouth. And the ANSWERS
    // table is what good players advise, not what a rules engine proved.
    const deck = deckOf([{ cardId: "small", quantity: 12 }]);
    const threat = readThreats(deck, index, pool).threats.find((t) => t.class === "answer-asymmetric");
    expect(threat?.grounding.join(" ")).toContain("contested");
    expect(threat?.lever).toContain("not that you must carry one");
  });
});

describe("what it refuses", () => {
  it("⚠️ always reports what it cannot see, starting with the rules it does not have", () => {
    const read = readThreats(deckOf([{ cardId: "small", quantity: 12 }]), index, pool);
    const said = read.unmodelled.join(" ");
    expect(said).toContain("Rule-warping");
    expect(said).toContain("no rules core");
    // D-035 — no meta data exists, so the denominator is the legal pool and it says so.
    expect(said).toContain("no meta data exists");
  });

  it("never claims what an opponent will play, only what the format can field", () => {
    const read = readThreats(deckOf([{ cardId: "small", quantity: 12 }]), index, pool);
    for (const threat of read.threats) {
      expect(threat.claim).not.toMatch(/most decks|usually plays|likely to|the meta/i);
      expect(threat.grounding.length).toBeGreaterThan(0);
    }
  });

  it("counts the deck it was given", () => {
    const read = readThreats(deckOf([{ cardId: "small", quantity: 6 }]), index, pool);
    expect(read.deck).toMatchObject({ id: "d", name: "Test Deck" });
    expect(read.deck.bodies).toBe(7); // six bodies plus the Chosen Champion
  });
});
