import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BRING_CAP, creationsIn, deckTokens, staticCardIndex, type CardEntry, type Deck, type DeckSlot } from "../src/index.js";

/**
 * What to bring in the box beside the deck.
 *
 * ⚠️ **Every text below is copied verbatim from `data/cards.json`.** The reading is a
 * sentence parser, so a paraphrase would be testing a string this module will never see.
 * The two failures worth guarding are opposite: missing a token the deck genuinely needs
 * (you turn up to a game without it) and inventing one it does not (you learn to ignore the
 * panel). The tribal cases below are the second kind and there are more of them.
 */
const CARDS: Record<string, CardEntry> = {
  /** The headline case — and there is **no Shadow Clone token card in the pool**. */
  zed: {
    name: "Zed, From the Shadows",
    types: ["unit"],
    superTypes: ["champion"],
    domains: ["fury"],
    text: "You may discard 1 as an additional cost to play me. When you play me, if you paid the additional cost, play a 0 :rb_might: Shadow Clone unit token.",
  },
  "zed-chaos": {
    name: "Zed, Without a Sound",
    types: ["unit"],
    superTypes: ["champion"],
    domains: ["chaos"],
    text: "When I conquer, play a 0 :rb_might: Shadow Clone unit token to your base. [Action][>] :rb_energy_1::rb_rune_chaos:: Move me and a Shadow Clone you control to each other's locations.",
  },
  /** Four at once, and the `1` in front of the name is Might rather than a count. */
  flurry: {
    name: "Flurry of Feathers",
    types: ["spell"],
    domains: ["calm"],
    text: "Play four 1 :rb_might: Bird unit tokens with [Deflect].",
  },
  /** A tribal cost reduction. Mentions Bird four ways and creates nothing. */
  daisy: {
    name: "Daisy!",
    types: ["unit"],
    domains: ["calm"],
    text: "Reduce my cost by :rb_energy_1: for each of the following tags among your units — Bird, Cat, Dog, and Poro.",
  },
  /** A lord. Also creates nothing. */
  greenFather: {
    name: "Green Father",
    types: ["unit"],
    domains: ["calm"],
    text: "When you conquer or hold, you may exhaust me to replace that battlefield with a Brush battlefield token. (Bird, Cat, Dog, Poro, and Ivern units have +1 :rb_might: in Brush.)",
  },
  /** The Legend that is the entire Sand Soldier plan, and it is not a slot. */
  azir: {
    name: "Emperor of the Sands",
    types: ["legend"],
    domains: ["order"],
    text: "Your Sand Soldiers have [Weaponmaster]. :rb_energy_1:, :rb_exhaust:: Play a 2 :rb_might: Sand Soldier unit token to your base. Use only on your turn.",
  },
  /** A board-decided count. */
  arise: {
    name: "Arise!",
    types: ["spell"],
    domains: ["order"],
    text: "Play a 2 :rb_might: Sand Soldier unit token for each Equipment you control. Then ready two of them.",
  },
  /** The card says only one can ever be on the board. */
  baron: {
    name: "Baron Nashor",
    types: ["unit"],
    domains: ["chaos"],
    text: "As you play me, add the Baron Pit battlefield token to the board if it's not there already.",
  },
  /** `[Temporary]` — it dies each turn, so the same card is reused. */
  spriteCall: {
    name: "Sprite Call",
    types: ["spell"],
    domains: ["calm"],
    text: "Play a ready 3 :rb_might: Sprite unit token with [Temporary].",
  },
  /** Ambessa: a keyword state, not a token, and no printed card for it. */
  ambessa: {
    name: "Ambessa, Respected and Feared",
    types: ["unit"],
    superTypes: ["champion"],
    domains: ["order"],
    text: "[Empower] :rb_energy_1::rb_rune_order::rb_rune_order: [Empowered][>] I have [Assault 2]. [Empowered][>] When I attack, kill an enemy unit here with less Might than me.",
  },
  xp: {
    name: "Voidreaver",
    types: ["unit"],
    domains: ["chaos"],
    text: "Spend 1 XP, :rb_exhaust:: [Buff] a unit.",
  },
  /** No text at all — the case that must not read as "needs nothing". */
  mute: { name: "Nameless Printing", types: ["unit"], domains: ["fury"] },
  legendPlain: { name: "Plain Legend", types: ["legend"], domains: ["fury"], text: "Your units have +0 :rb_might:." },
  gold: {
    name: "Trove Golem",
    types: ["unit"],
    domains: ["chaos"],
    text: "When you play me, play four Gold gear tokens exhausted.",
  },
};

const cards = staticCardIndex(CARDS);

const deck = (slots: DeckSlot[], legend = "legendPlain", champion = ""): Deck => ({
  id: "d",
  name: "Test",
  state: "DRAFT",
  legendCardId: legend,
  chosenChampionCardId: champion,
  slots,
});

const need = (d: Deck, name: string) => deckTokens(d, cards).tokens.find((t) => t.name === name);

describe("reading a creation off printed text", () => {
  it("finds a token that has no token card in the pool", () => {
    const t = need(deck([{ cardId: "zed", zone: "MAIN", quantity: 3 }]), "Shadow Clone");
    expect(t).toBeDefined();
    expect(t!.type).toBe("unit");
    expect(t!.copies).toBe(3);
  });

  it("takes the count word and not the Might printed in front of the name", () => {
    const c = creationsIn(CARDS["flurry"]!.text);
    expect(c).toHaveLength(1);
    expect(c[0]!.name).toBe("Bird");
    expect(c[0]!.atOnce).toBe(4);
  });

  it("reads a multi-word token name whole", () => {
    expect(creationsIn(CARDS["azir"]!.text)[0]!.name).toBe("Sand Soldier");
    expect(creationsIn(CARDS["baron"]!.text)[0]!.name).toBe("Baron Pit");
  });
});

describe("mentioning a token is not making one", () => {
  it("ignores a tribal list", () => {
    expect(creationsIn(CARDS["daisy"]!.text)).toEqual([]);
  });

  it("ignores a lord's reminder text and still sees the creation beside it", () => {
    const c = creationsIn(CARDS["greenFather"]!.text);
    expect(c.map((x) => x.name)).toEqual(["Brush"]);
  });

  it("does not invent a token for a deck that makes none", () => {
    expect(deckTokens(deck([{ cardId: "daisy", zone: "MAIN", quantity: 3 }]), cards).tokens).toEqual([]);
  });
});

describe("the Legend is a source, and it is not a slot", () => {
  it("counts a token the Legend alone creates", () => {
    const t = need(deck([{ cardId: "daisy", zone: "MAIN", quantity: 1 }], "azir"), "Sand Soldier");
    expect(t).toBeDefined();
    expect(t!.sources.map((s) => s.name)).toEqual(["Emperor of the Sands"]);
  });

  it("counts the Chosen Champion, which is also not a slot", () => {
    const t = need(deck([], "legendPlain", "zed"), "Shadow Clone");
    expect(t!.copies).toBe(1);
  });
});

describe("how many to bring", () => {
  it("is the largest burst or the number of copies, whichever is larger", () => {
    const d = deck([
      { cardId: "flurry", zone: "MAIN", quantity: 2 }, // 4 at once
      { cardId: "daisy", zone: "MAIN", quantity: 3 },
    ]);
    expect(need(d, "Bird")!.atOnce).toBe(4);
    expect(need(d, "Bird")!.bring).toBe(4);
  });

  it("caps at the practical ceiling rather than the arithmetic one", () => {
    const t = need(deck([{ cardId: "zed", zone: "MAIN", quantity: 30 }]), "Shadow Clone");
    expect(t!.copies).toBe(30);
    expect(t!.bring).toBe(BRING_CAP);
  });

  it("brings exactly one where the card says only one can exist", () => {
    const t = need(deck([{ cardId: "baron", zone: "MAIN", quantity: 3 }]), "Baron Pit");
    expect(t!.unique).toBe(true);
    expect(t!.bring).toBe(1);
  });

  it("marks a repeatable source, whose true ceiling is open", () => {
    expect(need(deck([{ cardId: "azir", zone: "MAIN", quantity: 1 }], "azir"), "Sand Soldier")!.repeatable).toBe(true);
  });

  it("does not read `when you play me` as repeatable", () => {
    expect(need(deck([{ cardId: "gold", zone: "MAIN", quantity: 2 }]), "Gold")!.repeatable).toBe(false);
  });

  it("marks a board-decided count rather than guessing a number", () => {
    expect(need(deck([{ cardId: "arise", zone: "MAIN", quantity: 2 }]), "Sand Soldier")!.variable).toBe(true);
  });

  it("marks a token made with [Temporary]", () => {
    expect(need(deck([{ cardId: "spriteCall", zone: "MAIN", quantity: 3 }]), "Sprite")!.temporary).toBe(true);
  });

  it("merges two cards making the same token", () => {
    const t = need(
      deck([
        { cardId: "zed", zone: "MAIN", quantity: 3 },
        { cardId: "zed-chaos", zone: "MAIN", quantity: 2 },
      ]),
      "Shadow Clone",
    );
    expect(t!.copies).toBe(5);
    expect(t!.sources).toHaveLength(2);
    expect(t!.repeatable).toBe(true);
  });
});

describe("markers, which are not cards you can go and find", () => {
  it("asks for an Empowered marker and says none is printed", () => {
    const m = deckTokens(deck([{ cardId: "ambessa", zone: "MAIN", quantity: 3 }]), cards).markers;
    const empowered = m.find((x) => x.name === "Empowered");
    expect(empowered).toBeDefined();
    expect(empowered!.printed).toBe(false);
  });

  it("asks for one XP Tracker however many cards want it", () => {
    const m = deckTokens(deck([{ cardId: "xp", zone: "MAIN", quantity: 3 }]), cards).markers;
    expect(m.find((x) => x.name === "XP Tracker")!.bring).toBe(1);
    expect(m.find((x) => x.name === "Buff")).toBeDefined();
  });

  it("does not ask for markers a deck never mentions", () => {
    expect(deckTokens(deck([{ cardId: "flurry", zone: "MAIN", quantity: 3 }]), cards).markers).toEqual([]);
  });
});

describe("an empty answer must say which kind of empty it is", () => {
  it("reports that nothing was read when the index carries no text", () => {
    const r = deckTokens(deck([{ cardId: "mute", zone: "MAIN", quantity: 3 }], "mute"), cards);
    expect(r.read).toBe(false);
    expect(r.tokens).toEqual([]);
  });

  it("reports that text was read when a deck genuinely needs nothing", () => {
    expect(deckTokens(deck([{ cardId: "daisy", zone: "MAIN", quantity: 3 }]), cards).read).toBe(true);
  });
});

/**
 * **The reading, run against every card in the game.**
 *
 * ⚠️ This is the test that matters. The unit cases above prove the parser does what it was
 * written to do; only the real pool proves it does not *also* do something else. The
 * assertion is an exact set rather than a floor, so a new set that prints a twelfth token
 * fails here — which is the correct failure, because it is the moment the panel would
 * otherwise start quietly omitting one.
 */
const POOL: Array<{ name: string; superTypes: string[]; text: string | null }> = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../../data/cards.json", import.meta.url)), "utf8"),
);

/** Every token the pool's printed text says can be created. */
const TOKENS_IN_THE_GAME = [
  "Baron Pit",
  "Bird",
  "Brush",
  "Gold",
  "Mech",
  "Recruit",
  "Reflection",
  "Sand Soldier",
  "Shadow Clone",
  "Sprite",
  "Tentacle",
];

/**
 * The four with **no token card printed for them** — the reason this module reads text and
 * not a registry. If one of these ever gains a card, that is good news and this list should
 * shrink; if the list ever *grows*, a set shipped tokens nobody catalogued.
 */
const UNCATALOGUED = ["Mech", "Sand Soldier", "Shadow Clone", "Tentacle"];

describe("the whole pool", () => {
  const creators = POOL.filter((c) => !c.superTypes.includes("token"));

  it("finds every token the game creates, and invents none", () => {
    const found = new Set(creators.flatMap((c) => creationsIn(c.text ?? undefined)).map((t) => t.name));
    expect([...found].sort()).toEqual(TOKENS_IN_THE_GAME);
  });

  it("still finds the tokens that have no token card to match against", () => {
    const printed = new Set(POOL.filter((c) => c.superTypes.includes("token")).map((c) => c.name.replace(/\s*\(.*\)/, "")));
    expect(UNCATALOGUED.filter((n) => printed.has(n))).toEqual([]);
    const found = new Set(creators.flatMap((c) => creationsIn(c.text ?? undefined)).map((t) => t.name));
    for (const n of UNCATALOGUED) expect(found.has(n)).toBe(true);
  });

  it("reads no creation off a card whose text only names a tribe", () => {
    // Every card mentioning Bird, and the seven that actually make one.
    const mentions = creators.filter((c) => /\bBird\b/.test(c.text ?? ""));
    const makers = mentions.filter((c) => creationsIn(c.text ?? undefined).some((t) => t.name === "Bird"));
    expect(mentions.length).toBe(17);
    expect(makers.length).toBe(7);
  });
});
