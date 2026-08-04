import { describe, expect, it } from "vitest";
import {
  CHAMPION_CHECKS,
  COPY_CHECKS,
  DERIVED_TAG_CHECK,
  DOMAIN_IDENTITY_CHECKS,
  FORMAT_CHECKS,
  OWNERSHIP_CHECKS,
  RUNE_CHECKS,
  SHAPE_CHECKS,
  SPECIFIED_CHECK_COUNT,
  UNIQUE_CHECKS,
  checkLegality,
  staticCardIndex,
  type CardEntry,
  type Deck,
  type DeckSlot,
} from "../src/index.js";

/**
 * **T1–T13 — the rulebook's own worked examples.**
 *
 * LEGALITY.md §3: *"The rulebook supplies worked examples. Each becomes a test. This is the
 * cheapest possible defence against misreading the rules."*
 *
 * Two rules in this file — the Signature cap and `[Unique]` — were found only by reading the
 * PDFs directly, after community sources had been wrong about both the sideboard and the ban
 * list. The spec's standing risk note says there are probably more. These tests are what stop
 * a misreading from becoming silent.
 *
 * ⚠️ **Card facts here are copied from Riot's published data, not invented.** Verified at the
 * time of writing: Tibbers really is a Signature unit tagged Annie; Teemo, Scout really carries
 * `Yordle` and not `Kennen`; and the pool really contains exactly three `[Unique]` cards, all
 * Ornn Signature gear. A fixture that lied would make these tests worse than useless.
 */

const CARDS: Record<string, CardEntry> = {
  // ── Legends. `championTag` is derived from Signature cards (L32), never from `tags`. ──
  "legend-ornn": { name: "Fire Below the Mountain", types: ["legend"], superTypes: [], tags: ["Ornn"], domains: ["calm", "mind"], championTag: "Ornn", energy: null, text: "" },
  "legend-annie": { name: "Dark Child", types: ["legend"], superTypes: [], tags: ["Annie"], domains: ["fury", "chaos"], championTag: "Annie", energy: null, text: "" },
  "legend-jinx": { name: "Loose Cannon", types: ["legend"], superTypes: [], tags: ["Jinx"], domains: ["fury", "chaos"], championTag: "Jinx", energy: null, text: "" },
  "legend-volibear": { name: "Relentless Storm", types: ["legend"], superTypes: [], tags: ["Volibear"], domains: ["fury", "body"], championTag: "Volibear", energy: null, text: "" },
  "legend-yasuo": { name: "Unforgiven", types: ["legend"], superTypes: [], tags: ["Yasuo"], domains: ["calm", "chaos"], championTag: "Yasuo", energy: null, text: "" },
  "legend-akali": { name: "Rogue Assassin", types: ["legend"], superTypes: [], tags: ["Akali"], domains: ["fury", "calm"], championTag: "Akali", energy: null, text: "" },
  // Heart of the Tempest carries TWO tags. Its champion tag is Kennen — the trap in T13.
  "legend-kennen": { name: "Heart of the Tempest", types: ["legend"], superTypes: [], tags: ["Yordle", "Kennen"], domains: ["order", "chaos"], championTag: "Kennen", energy: null, text: "" },

  // ── Champion units ──────────────────────────────────────────────────────────
  "volibear-furious": { name: "Volibear, Furious", types: ["unit"], superTypes: ["champion"], tags: ["Volibear", "Freljord"], domains: ["colorless"], energy: 10, text: "" },
  "jinx-rebel": { name: "Jinx, Rebel", types: ["unit"], superTypes: ["champion"], tags: ["Jinx", "Zaun"], domains: ["chaos"], energy: 5, text: "" },
  "jinx-rebel-alt": { name: "Jinx, Rebel", types: ["unit"], superTypes: ["champion"], tags: ["Jinx", "Zaun"], domains: ["chaos"], energy: 5, text: "" },
  "jinx-rebel-third": { name: "Jinx, Rebel", types: ["unit"], superTypes: ["champion"], tags: ["Jinx", "Zaun"], domains: ["chaos"], energy: 5, text: "" },
  "yasuo-remorseful": { name: "Yasuo, Remorseful", types: ["unit"], superTypes: ["champion"], tags: ["Yasuo", "Ionia"], domains: ["colorless"], energy: 6, text: "" },
  "yasuo-windrider": { name: "Yasuo, Windrider", types: ["unit"], superTypes: ["champion"], tags: ["Yasuo", "Ionia"], domains: ["colorless"], energy: 5, text: "" },
  "teemo-scout": { name: "Teemo, Scout", types: ["unit"], superTypes: ["champion"], tags: ["Yordle", "Teemo", "Bandle City"], domains: ["colorless"], energy: 2, text: "" },
  "ornn-champion": { name: "Ornn, Forgemaster", types: ["unit"], superTypes: ["champion"], tags: ["Ornn"], domains: ["colorless"], energy: 5, text: "" },
  "annie-champion": { name: "Annie, Stubborn", types: ["unit"], superTypes: ["champion"], tags: ["Annie"], domains: ["colorless"], energy: 4, text: "" },
  "akali-champion": { name: "Akali, Deadly Weapon", types: ["unit"], superTypes: ["champion"], tags: ["Akali"], domains: ["colorless"], energy: 3, text: "" },

  // ── Signature cards. All three [Unique] cards in the game are Ornn gear. ────
  "tibbers": { name: "Tibbers", types: ["unit"], superTypes: ["signature"], tags: ["Annie"], domains: ["colorless"], energy: 8, text: "" },
  "forgefire-cape": { name: "Forgefire Cape", types: ["gear"], superTypes: ["signature"], tags: ["Ornn", "Equipment"], domains: ["colorless"], energy: 4, text: "[Unique] Equipped unit gets +2." },
  "rabadons": { name: "Rabadon's Deathcrown", types: ["gear"], superTypes: ["signature"], tags: ["Ornn", "Equipment"], domains: ["colorless"], energy: 4, text: "[Unique] Equipped unit gets +2." },
  "shurelyas": { name: "Shurelya's Requiem", types: ["gear"], superTypes: ["signature"], tags: ["Ornn", "Equipment"], domains: ["colorless"], energy: 4, text: "[Unique] Equipped unit gets +2." },

  // ── Plain cards ─────────────────────────────────────────────────────────────
  "fury-mind-card": { name: "Two Domain Card", types: ["spell"], superTypes: [], tags: [], domains: ["fury", "mind"], energy: 3, text: "" },
  "rune-basic": { name: "Fury Rune", types: ["rune"], superTypes: ["basic"], tags: [], domains: ["colorless"], energy: null, text: "" },
  "not-a-rune": { name: "Punching Poro", types: ["unit"], superTypes: [], tags: [], domains: ["colorless"], energy: 1, text: "" },
  "bf-1": { name: "Noxus", types: ["battlefield"], superTypes: [], tags: [], domains: ["colorless"], energy: null, text: "" },
  "bf-2": { name: "Piltover", types: ["battlefield"], superTypes: [], tags: [], domains: ["colorless"], energy: null, text: "" },
  "bf-3": { name: "Ionia", types: ["battlefield"], superTypes: [], tags: [], domains: ["colorless"], energy: null, text: "" },
};

// Thirteen colourless filler names × 3 = 39, so the baseline is legal under any identity and
// only the rule under test can fail.
for (let i = 0; i < 20; i++) {
  CARDS[`filler-${i}`] = {
    name: `Filler ${i}`,
    types: ["unit"],
    superTypes: [],
    tags: [],
    domains: ["colorless"],
    energy: 2,
    text: "",
  };
}

// Every fixture must state its ban status. Absent reads as "unknown", which correctly
// disables the format checks — so leaving it out would silently shrink the coverage.
for (const facts of Object.values(CARDS)) {
  if (typeof facts !== "string" && facts.banned === undefined) facts.banned = false;
}

const cards = staticCardIndex(CARDS);
const slot = (cardId: string, zone: DeckSlot["zone"], quantity: number): DeckSlot => ({ cardId, zone, quantity });

/** `total` Main Deck cards across distinct names, never more than 3 of one. */
function fillers(total: number, zone: DeckSlot["zone"] = "MAIN"): DeckSlot[] {
  const slots: DeckSlot[] = [];
  for (let remaining = total, i = 0; remaining > 0; i++) {
    const quantity = Math.min(3, remaining);
    slots.push(slot(`filler-${i}`, zone, quantity));
    remaining -= quantity;
  }
  return slots;
}

/**
 * A deck that passes all 33 checks. `main` replaces part of the Main Deck; the rest is
 * padded with colourless filler so the total stays at 39 + Champion = 40.
 */
function deck({
  legend = "legend-jinx",
  champion = "jinx-rebel",
  main = [] as DeckSlot[],
  extra = [] as DeckSlot[],
  mainTotal = 39,
}: Partial<{
  legend: string;
  champion: string;
  main: DeckSlot[];
  extra: DeckSlot[];
  mainTotal: number;
}> = {}): Deck {
  const used = main.reduce((n, s) => n + s.quantity, 0);
  return {
    id: "t",
    name: "Rulebook",
    state: "DRAFT",
    legendCardId: legend,
    chosenChampionCardId: champion,
    slots: [
      ...main,
      ...fillers(mainTotal - used),
      slot("rune-basic", "RUNE", 12),
      slot("bf-1", "BATTLEFIELD", 1),
      slot("bf-2", "BATTLEFIELD", 1),
      slot("bf-3", "BATTLEFIELD", 1),
      ...extra,
    ],
  };
}

const codes = (d: Deck) => checkLegality(d, cards).violations.map((v) => v.check);
const legal = (d: Deck) => checkLegality(d, cards).legal;

describe("the baseline is genuinely legal", () => {
  it("passes every rule check, so any failure below is the rule under test", () => {
    const result = checkLegality(deck(), cards);
    expect(result.violations).toEqual([]);
    // 31 of the 33 are rules. The last two are ownership, which needs a collection to
    // judge — and cannot make a deck illegal even then.
    expect(result.coverage.implemented).toBe(31);
    expect(result.warnings).toEqual([]);
  });

  it("runs all 33 once a collection is supplied", () => {
    const result = checkLegality(deck(), cards, { ownership: { collection: {} } });
    expect(result.coverage.implemented).toBe(33);
    expect(result.coverage.complete).toBe(true);
    expect(result.coverage.caveat).toMatch(/All 33 specified checks ran/);
  });

  it("keeps ownership out of the verdict entirely (L26, L27)", () => {
    // Owning none of it changes nothing about whether the deck is legal. This is the
    // distinction LEGALITY.md calls "the point of the whole tool".
    const result = checkLegality(deck(), cards, { ownership: { collection: {} } });
    expect(result.legal).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.warnings.map((w) => w.check)).toContain("L26");
  });

  it("separates 'you do not own it' from 'it is already in another deck' (L26 vs L27)", () => {
    const owned = Object.fromEntries(Object.keys(CARDS).map((id) => [id, 12]));
    const result = checkLegality(deck(), cards, {
      ownership: { collection: owned, committed: { "filler-0": 12 } },
    });
    const checks = result.warnings.map((w) => w.check);
    expect(checks).toContain("L27");
    expect(checks).not.toContain("L26"); // you own them; they are just spoken for
  });
});

describe("T1–T13 — the rulebook's worked examples", () => {
  it("T1 — Chosen Champion plus two more copies is three, and legal (CR 103.2.b.1)", () => {
    // The Champion counts toward its own name's three (L14). Two in the Main Deck is the limit.
    const d = deck({
      legend: "legend-volibear",
      champion: "volibear-furious",
      main: [slot("volibear-furious", "MAIN", 2)],
    });
    expect(legal(d)).toBe(true);
  });

  it("T2 — two different Yasuo names, three each, is legal (CR 103.2.b.2)", () => {
    // Different names have separate allowances (L15). Six Yasuo cards, no violation.
    const d = deck({
      legend: "legend-yasuo",
      champion: "yasuo-remorseful",
      main: [slot("yasuo-remorseful", "MAIN", 2), slot("yasuo-windrider", "MAIN", 3)],
    });
    expect(legal(d)).toBe(true);
  });

  it("T3 — Tibbers cannot be the Chosen Champion, being a Signature unit (CR 103.2.a.2)", () => {
    // The trap: Tibbers carries the right tag and looks eligible. L19 is why it is not.
    const found = codes(deck({ legend: "legend-annie", champion: "tibbers" }));
    expect(found).toContain("L19");
  });

  it("T4 — Jinx, Rebel under a Jinx Legend is legal (CR 103.2.a.2)", () => {
    expect(legal(deck({ legend: "legend-jinx", champion: "jinx-rebel" }))).toBe(true);
  });

  it("T5 — four copies of one name across Main Deck and sideboard is illegal (TR 601.1.c.3)", () => {
    const d = deck({
      main: [slot("not-a-rune", "MAIN", 3)],
      extra: [slot("not-a-rune", "SIDEBOARD", 1)],
    });
    expect(codes(d)).toContain("L13");
  });

  it("T6 — a fourth Signature card is illegal even across four names (CR 103.2.d.1)", () => {
    // The cap is three TOTAL, not three of each — the rule found only in the PDF.
    const d = deck({
      legend: "legend-ornn",
      champion: "ornn-champion",
      main: [
        slot("forgefire-cape", "MAIN", 1),
        slot("rabadons", "MAIN", 1),
        slot("shurelyas", "MAIN", 1),
        slot("tibbers", "MAIN", 1),
      ],
    });
    const found = codes(d);
    expect(found).toContain("L20");
  });

  it("T7 — a Fury+Mind card under a Fury/Calm Legend is illegal (CR 103.1.b.4)", () => {
    // BOTH domains must be inside the identity. Fury matches; Mind does not.
    const d = deck({
      legend: "legend-akali",
      champion: "akali-champion",
      main: [slot("fury-mind-card", "MAIN", 1)],
    });
    const found = codes(d);
    expect(found).toContain("L10");
    expect(found).not.toContain("L9"); // it is the multi-domain rule, not the single one
  });

  it("T8 — a 43-card Main Deck is illegal (TR 601.1.b)", () => {
    const d = deck({ mainTotal: 42 }); // 42 slots + Champion = 43
    expect(codes(d)).toContain("L3");
  });

  it("T9 — two Battlefields sharing a name is illegal (CR 103.4.c)", () => {
    const d: Deck = {
      ...deck(),
      slots: [
        ...deck().slots.filter((s) => s.zone !== "BATTLEFIELD"),
        slot("bf-1", "BATTLEFIELD", 2),
        slot("bf-2", "BATTLEFIELD", 1),
      ],
    };
    const found = codes(d);
    expect(found).toContain("L6");
    expect(found).not.toContain("L5"); // three battlefields registered; the names are the problem
  });

  it("T10 — three printings of one name is legal; a fourth is not (CR 103.2.b)", () => {
    // Ownership is per printing, legality is per name. Three different arts are three copies.
    const three = deck({
      champion: "jinx-rebel",
      main: [slot("jinx-rebel-alt", "MAIN", 1), slot("jinx-rebel-third", "MAIN", 1)],
    });
    expect(legal(three)).toBe(true);

    const four = deck({
      champion: "jinx-rebel",
      main: [
        slot("jinx-rebel-alt", "MAIN", 1),
        slot("jinx-rebel-third", "MAIN", 1),
        slot("jinx-rebel", "MAIN", 1),
      ],
    });
    expect(codes(four)).toContain("L13");
  });

  it("T11 — two copies of a [Unique] card is illegal, overriding the 3-copy limit (CR 825.3.a)", () => {
    // Two copies passes L13 comfortably. Only L28 catches it.
    const d = deck({
      legend: "legend-ornn",
      champion: "ornn-champion",
      main: [slot("forgefire-cape", "MAIN", 2)],
    });
    const found = codes(d);
    expect(found).toContain("L28");
    expect(found).not.toContain("L13");
  });

  it("T12 — all three Ornn Uniques, one copy each, is legal (CR 825.3.b)", () => {
    // The interaction: three Signatures is the cap exactly, and each Unique name is at 1.
    // No special case is needed — this test exists to prove none was wrongly added.
    const d = deck({
      legend: "legend-ornn",
      champion: "ornn-champion",
      main: [
        slot("forgefire-cape", "MAIN", 1),
        slot("rabadons", "MAIN", 1),
        slot("shurelyas", "MAIN", 1),
      ],
    });
    expect(checkLegality(d, cards).violations).toEqual([]);
  });

  it("T13 — Teemo under Heart of the Tempest is illegal: Yordle is not the champion tag (CR 133.8.b)", () => {
    // The Legend carries `Yordle` AND `Kennen`. Matching any tag would admit 13 Yordles;
    // the champion tag is derived from the Legend's Signature cards, and it is Kennen (L32).
    const d = deck({ legend: "legend-kennen", champion: "teemo-scout" });
    const found = codes(d);
    expect(found).toContain("L18");
    expect(CARDS["legend-kennen"]).toMatchObject({ tags: ["Yordle", "Kennen"], championTag: "Kennen" });
  });
});

describe("the checks the rulebook examples do not cover", () => {
  it("rejects a Rune Deck holding something that is not a Basic Rune (L31)", () => {
    const d: Deck = {
      ...deck(),
      slots: [
        ...deck().slots.filter((s) => s.zone !== "RUNE"),
        slot("rune-basic", "RUNE", 11),
        slot("not-a-rune", "RUNE", 1),
      ],
    };
    expect(codes(d)).toContain("L31");
  });

  it("rejects a Legend that is not a Legend (L1)", () => {
    expect(codes(deck({ legend: "not-a-rune" }))).toContain("L1");
  });

  it("rejects a Chosen Champion that is not a champion unit (L17)", () => {
    expect(codes(deck({ champion: "not-a-rune" }))).toContain("L17");
  });

  it("reports a printing missing from the pool rather than assuming it is legal (L22)", () => {
    const d = deck({ main: [slot("no-such-card", "MAIN", 1)] });
    expect(codes(d)).toContain("L22");
  });
});

describe("the 33 are exactly accounted for", () => {
  it("covers L1 to L33 with no gaps and no duplicates", () => {
    // The spec numbers 33 checks. If a group is renamed, split or forgotten, this fails —
    // which is cheaper than discovering the gap from a deck that was illegal all along.
    const all = [
      ...SHAPE_CHECKS,
      ...COPY_CHECKS,
      ...DOMAIN_IDENTITY_CHECKS,
      ...CHAMPION_CHECKS,
      ...DERIVED_TAG_CHECK,
      ...UNIQUE_CHECKS,
      ...FORMAT_CHECKS,
      ...RUNE_CHECKS,
      ...OWNERSHIP_CHECKS,
    ];

    expect(new Set(all).size, "a check is claimed by two groups").toBe(all.length);
    expect(all).toHaveLength(SPECIFIED_CHECK_COUNT);

    const expected = Array.from({ length: 33 }, (_, i) => `L${i + 1}`);
    expect([...all].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))).toEqual(expected);
  });
});

describe("ownership warnings synthesise (D-039)", () => {
  it("states the count and names a few, rather than listing every card", () => {
    // A full deck you own none of once produced a paragraph naming all 18 names. True,
    // unreadable, and the exact failure "synthesise, never enumerate" exists to prevent.
    // 55 = 39 Main + Champion + 12 Runes + 3 Battlefields.
    const result = checkLegality(deck(), cards, { ownership: { collection: {} } });
    const l26 = result.warnings.find((w) => w.check === "L26");

    expect(l26?.message).toMatch(/^55 copies short across 18 names — /);
    expect(l26?.message).toMatch(/and 15 more\.$/);
    // Three names is grounding; fourteen is a wall.
    expect(l26?.message.split(",").length).toBeLessThanOrEqual(3);
  });

  it("does not say 'and 0 more' when everything fits in the sample", () => {
    const owned = Object.fromEntries(Object.keys(CARDS).map((id) => [id, 12]));
    const result = checkLegality(deck(), cards, {
      ownership: { collection: { ...owned, "filler-0": 0 } },
    });
    const l26 = result.warnings.find((w) => w.check === "L26");
    expect(l26?.message).toBe("3 copies short across 1 name — Filler 0.");
  });
});
