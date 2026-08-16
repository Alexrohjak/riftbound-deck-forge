import { describe, expect, it } from "vitest";
import {
  SIDEBOARD_SIZE,
  sideboardCounsel,
  staticCardIndex,
  type CardEntry,
  type PoolCard,
} from "../src/index.js";
import { MAX_COPIES_PER_NAME } from "../src/legality/copies.js";
import type { Deck } from "../src/types.js";

/**
 * **Q-SIDEBOARD** — *"what do I swap, against what, and for what?"* (`EVALUATION §6.6`).
 *
 * ⚠️ **The briefing has mandated a sideboard on every deck EE proposes since D-064, and nothing
 * computed one** — the mouth was left to freehand ten cards against a pool it is forbidden to
 * count from memory. That is the exact shape of gap that produced `Cruel Patron`: a rule with no
 * mechanism under it.
 *
 * So the tests here are mostly about **the constraints**, because a sideboard is the most
 * rule-bound object in the game and a suggestion that breaks one is worse than no suggestion.
 * **L16 is the one that catches people**: copies span Main Deck *and* board, so two in the board
 * beside two in the deck is four, and illegal. `headroom` is that arithmetic done in advance.
 */

const CARDS: Record<string, CardEntry> = {
  "legend-mine": { name: "My Legend", types: ["legend"], domains: ["order", "calm"], championTag: "Mine" },
  /** A Signature for my own champion — legal, and must still be offered. */
  mySig: {
    name: "My Own Signature",
    types: ["spell"],
    superTypes: ["signature"],
    tags: ["Mine"],
    domains: ["order"],
    energy: 2,
    role: "counter",
    produces: ["counter"],
  },
  /** ⚠️ A Signature for somebody else's champion — L21 makes registering it illegal. */
  theirSig: {
    name: "Someone Else's Riposte",
    types: ["spell"],
    superTypes: ["signature"],
    tags: ["Fiora"],
    domains: ["order"],
    energy: 1,
    role: "counter",
    produces: ["counter"],
  },
  "legend-theirs": { name: "Their Legend", types: ["legend"], domains: ["chaos"] },
  "champ-1": { name: "My Champion", types: ["unit"], superTypes: ["champion"], domains: ["order"], energy: 4, might: 5 },

  // ── mine: legal to register under order/calm ────────────────────────────────
  deny: {
    name: "Deny",
    types: ["spell"],
    domains: ["calm"],
    energy: 2,
    role: "counter",
    produces: ["counter"],
    text: "Counter a spell.",
  },
  denyToo: {
    name: "Second Thoughts",
    types: ["spell"],
    domains: ["order"],
    energy: 4,
    role: "counter",
    produces: ["counter"],
    text: "Counter a spell.",
  },
  flurry: {
    name: "Flurry of Blades",
    types: ["spell"],
    domains: ["order"],
    energy: 1,
    text: "Deal 1 damage to all units.",
    produces: ["damage"],
  },
  bodyguard: { name: "Bodyguard", types: ["unit"], domains: ["order"], energy: 3, might: 3 },
  /** ⚠️ Two jobs at once — kills a unit *and* replays from the trash. The best kind of board card. */
  twoJobs: {
    name: "Vengeful Return",
    types: ["spell"],
    domains: ["order"],
    energy: 5,
    role: "removal-kill",
    produces: ["kill", "trashplay"],
    text: "Kill target unit, then play a unit from your trash.",
  },

  // ⚠️ Outside my identity — a suggestion here is not a weaker answer, it is an illegal one.
  offColour: {
    name: "Chaos Denial",
    types: ["spell"],
    domains: ["chaos"],
    energy: 1,
    role: "counter",
    produces: ["counter"],
  },
  bannedCounter: {
    name: "Banned Denial",
    types: ["spell"],
    domains: ["calm"],
    energy: 1,
    role: "counter",
    produces: ["counter"],
    banned: true,
  },

  // ── theirs: what a chaos identity can field ─────────────────────────────────
  theirBomb: { name: "Their Bomb", types: ["unit"], domains: ["chaos"], energy: 8, might: 8 },
  theirBody: { name: "Their Body", types: ["unit"], domains: ["chaos"], energy: 3, might: 4 },
  theirBodyToo: { name: "Their Other Body", types: ["unit"], domains: ["chaos"], energy: 4, might: 4 },
  /** Their removal — the threat that go-wide and recursion both answer. */
  theirKiller: {
    name: "Their Removal",
    types: ["spell"],
    domains: ["chaos"],
    energy: 3,
    role: "removal-kill",
    produces: ["kill"],
    text: "Kill target unit.",
  },
};

const index = staticCardIndex(CARDS);
const pool: PoolCard[] = Object.entries(CARDS).map(([cardId, facts]) => ({ cardId, facts }));

const deckOf = (slots: { cardId: string; quantity: number }[]): Deck => ({
  id: "d",
  name: "Test Deck",
  state: "DRAFT",
  legendCardId: "legend-mine",
  chosenChampionCardId: "champ-1",
  slots: slots.map((s) => ({ ...s, zone: "MAIN" as const })),
});

const baseDeck = deckOf([
  { cardId: "bodyguard", quantity: 3 },
  { cardId: "flurry", quantity: 2 },
]);

describe("the constraints", () => {
  it("states the cap, the exchange rule, and what may never move", () => {
    // TR 601.1.c.1, TR 403.4, TR 403.4.b — and TR 601.1.c.4, the one exception.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    expect(counsel.constraints.sideboardSize).toBe(SIDEBOARD_SIZE);
    expect(SIDEBOARD_SIZE).toBe(10);
    expect(counsel.constraints.exchangesAre).toContain("1-for-1");
    expect(counsel.constraints.locked.join(" ")).toContain("Runes");
    expect(counsel.constraints.locked.join(" ")).toContain("The Legend");
    expect(counsel.constraints.locked.join(" ")).toContain("Battlefields");
    expect(counsel.constraints.swappable.join(" ")).toContain("Chosen Champion");
  });

  it("⚠️ pre-subtracts what is already registered, because copy limits span both zones (L16)", () => {
    // Two in the board beside two in the deck is four, and illegal. This is the arithmetic
    // that makes a suggestion impossible to reject at the gate.
    const withDenies = deckOf([
      { cardId: "bodyguard", quantity: 3 },
      { cardId: "deny", quantity: 2 },
    ]);
    const counsel = sideboardCounsel(withDenies, index, pool, "legend-theirs")!;
    const deny = counsel.bring.flatMap((l) => l.candidates).find((c) => c.name === "Deny");
    expect(deny?.inMain).toBe(2);
    expect(deny?.headroom).toBe(MAX_COPIES_PER_NAME - 2);
  });

  it("⚠️ returns a maxed-out card with headroom 0 rather than hiding it", () => {
    // "You already run the maximum" is a useful answer. Dropping it silently looks like the
    // card does not exist, and sends you looking for it again.
    const maxed = deckOf([
      { cardId: "bodyguard", quantity: 3 },
      { cardId: "deny", quantity: MAX_COPIES_PER_NAME },
    ]);
    const counsel = sideboardCounsel(maxed, index, pool, "legend-theirs")!;
    const deny = counsel.bring.flatMap((l) => l.candidates).find((c) => c.name === "Deny");
    expect(deny).toBeDefined();
    expect(deny?.headroom).toBe(0);
  });

  it("counts the Main Deck it was handed", () => {
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    expect(counsel.constraints.mainDeckSize).toBe(6); // 3 + 2, plus the Chosen Champion
  });
});

describe("what may be suggested", () => {
  it("⚠️ never suggests a card outside my Domain Identity", () => {
    // Not a weaker answer — an illegal one. A sideboard is registered under a Legend already
    // chosen, so this filter is not optional the way it is on `counter`.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const names = counsel.bring.flatMap((l) => l.candidates).map((c) => c.name);
    expect(names).not.toContain("Chaos Denial");
    expect(names).toContain("Deny");
  });

  it("⚠️ never suggests a Signature card belonging to another champion (L21)", () => {
    // Found by boarding a real Ambessa deck: this returned `Riposte` as the headline hard
    // counter, and `checkLegality` rejected the deck the moment it went in. Domain identity
    // is not the only way a card can be illegal.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const names = counsel.bring.flatMap((l) => l.candidates).map((c) => c.name);
    expect(names).not.toContain("Someone Else's Riposte");
    expect(names).toContain("My Own Signature");
  });

  it("never suggests a banned card", () => {
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const names = counsel.bring.flatMap((l) => l.candidates).map((c) => c.name);
    expect(names).not.toContain("Banned Denial");
  });

  it("puts what you own first, then what you can cast cheaply", () => {
    // A card you can sleeve tonight beats one you would have to find; the cheap answer is the
    // one you can hold up alongside a play.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs", { denyToo: 3 })!;
    const counters = counsel.bring.find((l) => l.answersWith === "hard-counter")!;
    expect(counters.candidates[0]?.name).toBe("Second Thoughts"); // owned 3, though it costs 4
    expect(counters.candidates[0]?.owned).toBe(3);
  });

  it("⚠️ reports ownership as a count, never as a filter", () => {
    // "Go and get this one" is a real answer.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const all = counsel.bring.flatMap((l) => l.candidates);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((c) => typeof c.owned === "number")).toBe(true);
  });

  it("grounds each line in how much of their identity can field the threats it answers", () => {
    // ⚠️ Reachability, not likelihood. The number is a count over the legal pool of that
    // identity, and it is what the lines are ordered by.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    for (const line of counsel.bring) {
      expect(line.theirCards).toBeGreaterThan(0);
      expect(line.reasons.length).toBeGreaterThan(0);
      for (const reason of line.reasons) expect(reason.because.length).toBeGreaterThan(0);
    }
    const reach = counsel.bring.map((l) => l.theirCards);
    expect([...reach].sort((a, b) => b - a)).toEqual(reach);
  });

  it("says nothing about a threat their identity cannot field", () => {
    // No go-wide in a pool of three chaos cards, so no sweep line — rather than a sweep line
    // suggested against nothing.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    expect(counsel.bring.flatMap((l) => l.reasons).some((r) => r.threat === "go-wide")).toBe(false);
  });
});

describe("⚠️ the answer budget — synthesise, never enumerate", () => {
  /**
   * D-039, and this is not a style note. Keyed on the *threat*, a real matchup produced
   * **fourteen lines and forty-five candidates for a board of ten**, with `Riposte` listed four
   * separate times — a hard counter answers four different threats, so it appeared under each.
   * A board is built from cards, so the line is keyed on the card's job instead.
   */
  it("lists each answer once, however many threats it answers", () => {
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const answers = counsel.bring.map((l) => l.answersWith);
    expect(new Set(answers).size).toBe(answers.length);
  });

  it("never repeats a card under the same job", () => {
    // The symptom the grouping was written to remove: `Riposte` four times over, once per
    // threat a hard counter happens to answer.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    for (const line of counsel.bring) {
      const ids = line.candidates.map((c) => c.cardId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("⚠️ still offers a card under each job it genuinely does", () => {
    // Not the same failure. A card carrying two answer patterns appears under both because it
    // answers both — and in a board of ten, a card doing double duty is the one to sleeve.
    // Suppressing the second mention would hide the reason it is the best card here.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const twoJobs = pool.find(({ facts }) => facts.name === "Vengeful Return")!;
    const lines = counsel.bring.filter((l) => l.candidates.some((c) => c.cardId === twoJobs.cardId));
    expect(lines.map((l) => l.answersWith).sort()).toEqual(["recursion", "spot-removal"]);
  });

  it("carries every threat an answer covers, rather than dropping the ones it merged", () => {
    // ⚠️ Grouping must not lose information — a hard counter that answers four things has to
    // still say four things, or the collapse would be a summary rather than a regrouping.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const counters = counsel.bring.find((l) => l.answersWith === "hard-counter")!;
    // Their identity fields a bomb, so at minimum the bomb reason survives the merge.
    expect(counters.reasons.map((r) => r.threat)).toContain("bomb");
    expect(counters.reasons.every((r) => r.threatLabel.length > 0)).toBe(true);
  });

  it("⚠️ counts their cards as a union, never as a sum", () => {
    // A card carrying two of the threats a line answers must not be counted twice — otherwise
    // a broad answer looks more urgent than the card count can support.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const theirCards = pool.filter(({ facts }) =>
      (facts.domains ?? []).every((d) => d === "colorless" || ["chaos"].includes(d)),
    ).length;
    for (const line of counsel.bring) {
      expect(line.theirCards).toBeLessThanOrEqual(theirCards);
    }
  });
});

describe("what comes out", () => {
  it("⚠️ cuts a damage spell that does not kill what this matchup fields", () => {
    // The spec's own worked example: "Cut 2× Flurry of Blades — their board is Might 4+, so 1
    // damage to all does nothing." Their median Might is counted from their identity's actual
    // pool, not assumed.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    const flurry = counsel.cut.find((c) => c.name === "Flurry of Blades");
    expect(flurry?.copies).toBe(2);
    expect(flurry?.because).toContain("Deals 1");
    expect(flurry?.because).toContain("Might 4");
  });

  it("⚠️ cuts nothing when there is nothing this analysis can call dead", () => {
    // Empty is common and correct. A cut list that always has something in it is padding.
    const noDamage = deckOf([{ cardId: "bodyguard", quantity: 3 }]);
    expect(sideboardCounsel(noDamage, index, pool, "legend-theirs")!.cut).toEqual([]);
  });

  it("never says a card is bad — only that it is dead in this matchup", () => {
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    for (const cut of counsel.cut) {
      expect(cut.because).toMatch(/this matchup|does not kill|in front of it/);
      expect(cut.because).not.toMatch(/\bbad\b|\bweak card\b|\bnever play\b/i);
    }
  });
});

describe("what it refuses", () => {
  it("⚠️ returns null against a Legend it cannot identify", () => {
    // A sideboard built against a Legend we cannot name would be advice about nothing.
    expect(sideboardCounsel(baseDeck, index, pool, "no-such-legend")).toBeNull();
  });

  it("⚠️ always carries its caveats, and the meta one is first", () => {
    // D-035 — what their identity CAN field, never what an opponent WILL play.
    const counsel = sideboardCounsel(baseDeck, index, pool, "legend-theirs")!;
    expect(counsel.caveats.length).toBeGreaterThan(0);
    expect(counsel.caveats[0]).toContain("never what an opponent WILL play");
    const said = counsel.caveats.join(" ");
    expect(said).toContain("contested");
    expect(said).toContain("No combat is simulated");
    expect(said).toContain("L16");
  });

  it("reports the deck's own win condition when given one, and omits it otherwise", () => {
    // It shapes nothing — it is reported so the answer can be read against it.
    const stated = sideboardCounsel(baseDeck, index, pool, "legend-theirs", {}, "Hold two battlefields")!;
    expect(stated.winCondition).toBe("Hold two battlefields");
    expect(sideboardCounsel(baseDeck, index, pool, "legend-theirs")!.winCondition).toBeUndefined();
  });
});
