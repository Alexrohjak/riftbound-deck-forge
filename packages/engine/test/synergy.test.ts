import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SELF_SATISFYING, SUPPORTS, isModelled } from "../src/advice/synergy.js";
import { capabilities } from "../src/advice/doctrine.js";
import { mechanicCounsel } from "../src/advice/counsel.js";
import { staticCardIndex } from "../src/cardIndex.js";
import type { CardEntry, Deck, DeckSlot } from "../src/types.js";

/**
 * **The synergy graph must cover the vocabulary the cards actually use.**
 *
 * ⚠️ This test exists because the gap it closes shipped, and shipped wearing a fact's
 * clothes. `doctrine.ts` resolved supply by matching a `consumes` tag against `produces`
 * names — a match that can never occur for seventeen of the twenty tags in the pool — so any
 * deck with three cards wanting one of them was told *"N cards care about X, and only 0
 * supply it"* at `confidence: "fact"`. A twenty-unit deck was told nothing supplied
 * `unit_played`.
 *
 * The rule the fix encodes, and this test defends: **an unmodelled tag is silent, never
 * zero.** Same asymmetry the briefing puts on the mouth — a negative claim is a claim.
 */

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Every `consumes` tag carried by a real card, read from the generated index. */
const poolTags = (): string[] => {
  const raw = JSON.parse(readFileSync(here("../../../apps/web/public/cards.json"), "utf8")) as {
    cards: Array<{ consumes?: string[] }>;
  };
  const tags = new Set<string>();
  for (const card of raw.cards) for (const tag of card.consumes ?? []) tags.add(tag);
  return [...tags].sort();
};

describe("the synergy graph covers the pool's vocabulary", () => {
  it("models every consumes tag a card actually carries", () => {
    const unmodelled = poolTags().filter((tag) => !isModelled(tag));
    // A new tag in the card data is not a failure of the data — it is a prompt to decide
    // whether it pairs with an enabler (SUPPORTS) or stands alone (SELF_SATISFYING).
    expect(unmodelled).toEqual([]);
  });

  it("keeps the two senses disjoint — a tag is paired or self-contained, never both", () => {
    const both = Object.keys(SUPPORTS).filter((tag) => SELF_SATISFYING.has(tag));
    expect(both).toEqual([]);
  });
});

const card = (over: Partial<CardEntry & { name: string }> & { name: string }): CardEntry => ({
  types: ["unit"],
  superTypes: [],
  tags: [],
  domains: ["colorless"],
  text: "",
  banned: false,
  energy: 3,
  ...over,
});

const slot = (cardId: string, quantity: number): DeckSlot => ({ cardId, quantity, zone: "MAIN" });

const deckOf = (slots: DeckSlot[]): Deck => ({
  id: "d",
  name: "Under test",
  state: "DRAFT",
  legendCardId: "legend",
  chosenChampionCardId: "champ",
  slots,
});

describe("an unmodelled tag is silent rather than zero", () => {
  const index = staticCardIndex({
    payoff: card({ name: "Payoff", consumes: ["not_a_real_mechanic"] }),
    body: card({ name: "Body" }),
  });

  it("reports no dangling synergy for a tag the graph cannot measure", () => {
    const caps = capabilities(deckOf([slot("payoff", 3), slot("body", 3)]), index);
    expect(caps.danglingSynergies.find((s) => s.needs === "not_a_real_mechanic")).toBeUndefined();
  });
});

describe("units supply unit_played (the false fact that shipped)", () => {
  const index = staticCardIndex({
    payoff: card({ name: "Payoff", types: ["spell"], consumes: ["unit_played"] }),
    body: card({ name: "Body" }),
  });

  it("counts twenty units as supply, not zero", () => {
    // 6 want it, 20 supply it — nowhere near thin enough to be worth a note.
    const caps = capabilities(deckOf([slot("payoff", 6), slot("body", 20)]), index);
    expect(caps.danglingSynergies.find((s) => s.needs === "unit_played")).toBeUndefined();
  });

  it("still reports a genuinely thin enabler", () => {
    const thin = staticCardIndex({
      payoff: card({ name: "Gear Lover", consumes: ["gear_matters"] }),
      gear: card({ name: "A Gear", types: ["gear"] }),
    });
    const caps = capabilities(deckOf([slot("payoff", 9), slot("gear", 2)]), thin);
    expect(caps.danglingSynergies.find((s) => s.needs === "gear_matters")).toEqual({
      needs: "gear_matters",
      wants: 9,
      supplies: 2,
    });
  });
});

describe("mechanic says whether it measured anything", () => {
  const pool = [
    { cardId: "a", facts: card({ name: "Wants Mighty", consumes: ["mighty"] }) },
    { cardId: "b", facts: card({ name: "Pumper", types: ["spell"], produces: ["pump"] }) },
  ];

  it("finds Might raisers as what feeds mighty", () => {
    const out = mechanicCounsel("mighty", pool);
    expect(out.feedsMeasured).toBe(true);
    expect(out.feeds.map((c) => c.name)).toContain("Pumper");
  });

  it("flags an unmodelled tag rather than answering an empty feeds list", () => {
    const out = mechanicCounsel("not_a_real_mechanic", pool);
    expect(out.feedsMeasured).toBe(false);
  });
});
