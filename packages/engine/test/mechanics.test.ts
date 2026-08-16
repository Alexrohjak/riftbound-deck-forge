import { describe, expect, it } from "vitest";
import {
  MECHANICS,
  hasMechanic,
  levelThresholds,
  mechanicsOf,
  readMechanics,
  staticCardIndex,
  xpGranted,
  xpSpent,
} from "../src/index.js";
import type { CardFacts, Deck } from "../src/types.js";

/**
 * **The printed text, read as data** — `mechanics.ts` and the findings built on it.
 *
 * ⚠️ **What is actually under test is a defence against over-claiming.** These are regexes over
 * prose, and a regex over prose over-matches eventually. The design answer is that every finding
 * quotes the clause that produced it, so a false positive is visible in one glance rather than
 * trusted — which means *the clause* is the load-bearing part and most of these tests are about
 * it rather than about the match.
 *
 * The second thing under test is silence. `readMechanics` returning `[]` on a clean deck is the
 * common case and the correct one (D-042); a module that always has a finding is filling a slot
 * rather than reading the deck.
 */

const facts: Record<string, CardFacts> = {
  "legend-1": { name: "Hold The Line", types: ["legend"], domains: ["order"] },
  "champ-1": { name: "Garen, Might", types: ["unit"], superTypes: ["champion"], energy: 4, might: 5 },

  patron: {
    name: "Cruel Patron",
    types: ["unit"],
    energy: 4,
    might: 6,
    role: "body",
    text: "As an additional cost to play me, kill a friendly unit. When I enter, draw 2.",
  },
  gated: {
    name: "Ascended Form",
    types: ["spell"],
    energy: 3,
    text: "[Level 6] — Deal 6 damage to a unit and score 1 point.",
  },
  hunter: { name: "Trophy Hunter", types: ["unit"], energy: 2, might: 2, text: "[Hunt]" },
  granter: { name: "Field Promotion", types: ["spell"], energy: 1, text: "Gain 2 XP." },
  spender: { name: "Ancient Rite", types: ["spell"], energy: 2, text: "Spend 3 XP: draw 3 cards." },

  empowerer: { name: "Rune Adept", types: ["unit"], energy: 2, might: 2, text: "[Empower]" },
  onceOnly: {
    name: "Overcharge",
    types: ["spell"],
    energy: 1,
    text: "Use only if not [Empowered]. Give a unit +3 Might.",
  },

  ganker: { name: "Shadow Runner", types: ["unit"], energy: 3, might: 3, text: "[Ganking]" },
  knell: { name: "Grave Chorus", types: ["unit"], energy: 3, might: 2, text: "[Deathknell] — draw 1." },
  fast: { name: "Rushing Blade", types: ["unit"], energy: 5, might: 4, text: "[Accelerate]" },
  seer: { name: "Path Reader", types: ["unit"], energy: 2, might: 2, text: "[Predict]" },

  plain: { name: "Plain Body", types: ["unit"], energy: 3, might: 4, role: "body" },
};

const index = staticCardIndex(facts);

const deckOf = (slots: { cardId: string; quantity: number }[]): Deck => ({
  id: "d",
  name: "Test Deck",
  state: "DRAFT",
  legendCardId: "legend-1",
  chosenChampionCardId: "champ-1",
  slots: slots.map((s) => ({ ...s, zone: "MAIN" as const })),
});

describe("the mechanic table", () => {
  it("is one mapping, with no duplicate ids", () => {
    // ⚠️ D-047 in miniature. `scripts/audit-knowledge.mjs` imports this table rather than
    // keeping its own copy, so a duplicate id here silently shadows a rule in both consumers.
    const ids = MECHANICS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("says of every mechanic whether anything acts on it, and why it matters", () => {
    // The `modelled` field is what the audit reports as a knowledge gap. A rule with an empty
    // `why` would show up in that report as a blank line, which reads as "no gap".
    for (const rule of MECHANICS) {
      expect(rule.why.length, `${rule.id} has no 'why'`).toBeGreaterThan(0);
      expect(["cost", "threshold", "capability", "keyword"]).toContain(rule.kind);
    }
  });

  it("⚠️ quotes the clause that matched, not the whole card", () => {
    // This is the false-positive defence. A hit that returned only an id would make an
    // over-matching regex indistinguishable from a real finding.
    const hits = mechanicsOf(facts.patron?.text);
    const cost = hits.find((h) => h.id === "additional-cost");
    expect(cost?.clause).toContain("kill a friendly unit");
    expect(cost?.clause).not.toContain("When I enter, draw 2");
  });

  it("finds nothing in text that says nothing", () => {
    expect(mechanicsOf(facts.plain?.text)).toEqual([]);
    expect(mechanicsOf(undefined)).toEqual([]);
    expect(hasMechanic(undefined, "additional-cost")).toBe(false);
  });
});

describe("the XP economy, counted from printed text", () => {
  it("reads every [Level N] threshold on a card", () => {
    expect(levelThresholds("[Level 3] — draw. [Level 6] — draw 2.")).toEqual([3, 6]);
    expect(levelThresholds("no levels here")).toEqual([]);
  });

  it("⚠️ counts XP gained and XP spent separately, and never nets them", () => {
    // A card that reads "Spend 3 XP" is not a source of 3 XP. Netting the two would credit a
    // deck with an economy it does not have — and the §6.8 finding is entirely about the gap
    // between what a deck spends and what it can produce.
    expect(xpGranted("Gain 2 XP.")).toBe(2);
    expect(xpGranted("Spend 3 XP: draw 3 cards.")).toBe(0);
    expect(xpSpent("Spend 3 XP: draw 3 cards.")).toBe(3);
    expect(xpSpent("Gain 2 XP.")).toBe(0);
  });

  it("⚠️ does not count [Hunt] as printed XP", () => {
    // [Hunt] grants XP only when you conquer. Counting it here would credit the deck in
    // advance with XP it has to go and earn — inventing the game that produced it.
    expect(xpGranted("[Hunt]")).toBe(0);
    expect(hasMechanic("[Hunt]", "xp-gain")).toBe(true);
  });
});

describe("readMechanics — the findings", () => {
  it("⚠️ says nothing about a deck with nothing to say", () => {
    // D-042. The common case, and a module that always speaks is not reading the deck.
    expect(readMechanics(deckOf([{ cardId: "plain", quantity: 12 }]), "conquer", index)).toEqual([]);
  });

  it("⚠️ catches the Cruel Patron class, naming the card and quoting the cost", () => {
    // The defect this whole module exists for: three copies of a unit that kills a friendly
    // unit to play, shipped in a deck whose plan was holding battlefields with bodies.
    const findings = readMechanics(deckOf([{ cardId: "patron", quantity: 3 }]), "hold", index);
    const cost = findings.find((f) => f.mechanic === "additional-cost");
    expect(cost?.severity).toBe("high");
    expect(cost?.copies).toBe(3);
    expect(cost?.note.claim).toContain("Cruel Patron");
    expect(cost?.cards[0]?.clause).toContain("kill a friendly unit");
  });

  it("tells a hold plan why the cost works against it, and stays quiet about that on other plans", () => {
    // ⚠️ Same card, opposite conclusions. Only the plan knows which deck this is, and the
    // finding names rather than vetoes either way (D-016).
    const holding = readMechanics(deckOf([{ cardId: "patron", quantity: 3 }]), "hold", index);
    const conquering = readMechanics(deckOf([{ cardId: "patron", quantity: 3 }]), "conquer", index);
    expect(holding[0]?.note.because).toContain("hold");
    expect(conquering[0]?.note.because).not.toContain("the objective here is to hold");
    // Never a veto, on either plan.
    expect(holding[0]?.note.because).toContain("never vetoed");
  });

  it("⚠️ reports EVALUATION §6.8 word for word — thresholds against the deck's own XP", () => {
    // The spec: "3 cards have [Level 6] abilities; your deck produces 2 XP maximum. Those
    // abilities can never activate. (This one is a hard fact.)" It stayed unbuilt for months
    // because nothing in Forge could see a threshold.
    const findings = readMechanics(deckOf([{ cardId: "gated", quantity: 3 }]), "conquer", index);
    const level = findings.find((f) => f.mechanic === "level-threshold");
    expect(level?.severity).toBe("high"); // no XP source anywhere in the deck
    expect(level?.note.claim).toContain("[Level 6]");
    expect(level?.note.claim).toContain("prints 0 XP");
  });

  it("softens the threshold finding once the deck can actually produce XP", () => {
    const findings = readMechanics(
      deckOf([
        { cardId: "gated", quantity: 3 },
        { cardId: "granter", quantity: 2 },
      ]),
      "conquer",
      index,
    );
    expect(findings.find((f) => f.mechanic === "level-threshold")?.severity).toBe("medium");
  });

  it("⚠️ counts [Hunt] cards beside printed XP rather than adding them in", () => {
    const findings = readMechanics(
      deckOf([
        { cardId: "gated", quantity: 1 },
        { cardId: "hunter", quantity: 4 },
      ]),
      "conquer",
      index,
    );
    const level = findings.find((f) => f.mechanic === "level-threshold");
    // Zero printed XP, four cards that could earn some — stated as two numbers, not one sum.
    expect(level?.note.claim).toContain("prints 0 XP");
    expect(level?.note.claim).toContain("4 XP-gaining cards");
    expect(level?.note.because).toContain("not addable");
  });

  it("flags an XP sink with no source, and goes quiet once a source exists", () => {
    const dangling = readMechanics(deckOf([{ cardId: "spender", quantity: 2 }]), "conquer", index);
    expect(dangling.find((f) => f.mechanic === "xp-spend")?.severity).toBe("high");

    const fed = readMechanics(
      deckOf([
        { cardId: "spender", quantity: 2 },
        { cardId: "granter", quantity: 2 },
      ]),
      "conquer",
      index,
    );
    expect(fed.find((f) => f.mechanic === "xp-spend")).toBeUndefined();
  });

  it("⚠️ reads the empower charge economy as bodies, not as cards", () => {
    // The finding that drove a whole rebuild and could not be seen: [Empower] is once per
    // unit, so the ceiling is the units you expect on board, not the empower cards you run.
    const findings = readMechanics(
      deckOf([
        { cardId: "onceOnly", quantity: 3 },
        { cardId: "empowerer", quantity: 4 },
      ]),
      "conquer",
      index,
    );
    const empower = findings.find((f) => f.mechanic === "empower-once-only");
    expect(empower?.note.claim).toContain("one charge per body");
    expect(empower?.note.because).toContain("bodies to charge");
  });

  it("says nothing about once-only text in a deck that is not built on empower", () => {
    const findings = readMechanics(deckOf([{ cardId: "onceOnly", quantity: 1 }]), "conquer", index);
    expect(findings.find((f) => f.mechanic === "empower-once-only")).toBeUndefined();
  });

  it("mentions [Ganking] only when the objective is to hold", () => {
    // Free repositioning is *how* a hold plan holds. On a conquer plan it is just a keyword.
    expect(
      readMechanics(deckOf([{ cardId: "ganker", quantity: 3 }]), "hold", index).some(
        (f) => f.mechanic === "ganking",
      ),
    ).toBe(true);
    expect(
      readMechanics(deckOf([{ cardId: "ganker", quantity: 3 }]), "conquer", index).some(
        (f) => f.mechanic === "ganking",
      ),
    ).toBe(false);
  });

  it("⚠️ reads a death payoff together with the sacrifice costs, not against them", () => {
    // The pairing that makes the Cruel Patron finding a judgement rather than a verdict:
    // "kill a friendly unit" is a price in one deck and a trigger in another.
    const findings = readMechanics(
      deckOf([
        { cardId: "knell", quantity: 3 },
        { cardId: "patron", quantity: 3 },
      ]),
      "conquer",
      index,
    );
    const knell = findings.find((f) => f.mechanic === "deathknell");
    // Both halves counted in copies — three payoffs alongside three costs, not "3 … alongside 1".
    expect(knell?.note.claim).toContain("3 copies that kill a friendly unit as a cost");
    expect(knell?.note.because).toContain("same engine");
  });

  it("caveats optional extra costs against the curve that already printed", () => {
    const findings = readMechanics(deckOf([{ cardId: "fast", quantity: 2 }]), "conquer", index);
    const optional = findings.find((f) => f.mechanic === "accelerate");
    expect(optional?.note.because).toContain("heavier than the one above");
  });

  it("warns that [Predict] makes the simulated opening a floor", () => {
    const findings = readMechanics(deckOf([{ cardId: "seer", quantity: 3 }]), "conquer", index);
    expect(findings.find((f) => f.mechanic === "predict")?.note.because).toContain("floor");
  });

  it("⚠️ orders by consequence, not by count", () => {
    // Twelve [Predict] outrank nothing. An additional cost that kills your own units comes
    // first however few copies there are — §2's answer budget spends itself top-down.
    const findings = readMechanics(
      deckOf([
        { cardId: "seer", quantity: 12 },
        { cardId: "patron", quantity: 1 },
      ]),
      "conquer",
      index,
    );
    expect(findings[0]?.mechanic).toBe("additional-cost");
    expect(findings.at(-1)?.mechanic).toBe("predict");
  });

  it("every finding is a fact with its source, and none of them is a score", () => {
    // D-016. These feed a language model; a finding carrying a grade would be read as one.
    const findings = readMechanics(
      deckOf([
        { cardId: "patron", quantity: 3 },
        { cardId: "gated", quantity: 2 },
      ]),
      "hold",
      index,
    );
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.note.source).toBe("computed");
      expect(f.note.confidence).toBe("fact");
      expect(f.note.attribution.length).toBeGreaterThan(0);
      expect(f.cards.length).toBeGreaterThan(0);
    }
  });
});
