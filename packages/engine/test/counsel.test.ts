import { describe, expect, it } from "vitest";
import {
  ANSWERS,
  aroundCounsel,
  counterCounsel,
  legendCounsel,
  mechanicCounsel,
  staticCardIndex,
  type CardEntry,
  type PoolCard,
} from "../src/index.js";

/**
 * `S6` — the deckbuilding surface (EVALUATION §6).
 *
 * ⚠️ The thing under test is mostly **what these refuse to say**. Every one of them feeds a
 * language model, and the failure that matters is not a wrong sort order — it is a tool
 * handing back something the mouth will read as fact when it is a guess.
 */
const CARDS: Record<string, CardEntry> = {
  "legend-jinx": {
    name: "Loose Cannon",
    types: ["legend"],
    domains: ["fury", "chaos"],
    championTag: "Jinx",
    text: "At start of your Beginning Phase, draw 1 if you have one or fewer cards in hand.",
  },
  "legend-calm": { name: "Calm Legend", types: ["legend"], domains: ["calm", "order"] },
  "champ-jinx": {
    name: "Jinx, Demolitionist",
    types: ["unit"],
    superTypes: ["champion"],
    tags: ["Jinx"],
    domains: ["chaos"],
    energy: 3,
    might: 4,
    produces: ["discard"],
  },
  "champ-jinx2": {
    name: "Jinx, Rebel",
    types: ["unit"],
    superTypes: ["champion"],
    tags: ["Jinx"],
    domains: ["fury"],
    energy: 4,
    might: 5,
    consumes: ["discard_matters"],
  },
  killer: {
    name: "Fury Killer",
    types: ["spell"],
    domains: ["fury"],
    energy: 2,
    role: "removal-kill",
    produces: ["kill"],
    text: "Kill a unit.",
  },
  tokens: {
    name: "Chaos Swarm",
    types: ["spell"],
    domains: ["chaos"],
    energy: 3,
    role: "token-maker",
    produces: ["token"],
  },
  tokenPayoff: {
    name: "Swarm Lord",
    types: ["unit"],
    domains: ["chaos"],
    energy: 4,
    might: 3,
    consumes: ["token_matters"],
  },
  offColour: { name: "Calm Thing", types: ["spell"], domains: ["calm"], energy: 1 },
  banned: {
    name: "Banned Bomb",
    types: ["spell"],
    domains: ["fury"],
    energy: 9,
    banned: true,
    produces: ["kill"],
  },
};
const cards = staticCardIndex(CARDS);
const pool: PoolCard[] = Object.entries(CARDS).map(([cardId, entry]) => ({
  cardId,
  facts: typeof entry === "string" ? { name: entry } : entry,
}));
const owned = { "champ-jinx": 1, killer: 3, tokens: 2, offColour: 4 };

describe("legendCounsel — what goes in this Legend", () => {
  const counsel = legendCounsel("legend-jinx", cards, pool, owned);

  it("returns the Legend's own text rather than an interpretation of it", () => {
    expect(counsel?.legend.text).toContain("one or fewer cards in hand");
  });

  /**
   * ⚠️ This assertion used to be `expect(counsel).not.toHaveProperty("rewards")`, on the
   * reasoning that Legends carry no `consumes` annotations so any such field would be
   * invented. They carried none because the classification pass covered the 814 main-deck
   * cards and a Legend is not one — a scoping gap, not a limit on what can be known. All 49
   * are annotated from their printed text now, and this fixture Legend deliberately has none
   * so the honest-empty case stays covered.
   */
  it("reports an unannotated Legend as unconditional rather than inventing a reward", () => {
    expect(counsel?.rewards).toEqual([]);
    expect(counsel?.unconditional).toBe(true);
  });

  it("offers every Champion carrying the tag, owned first, including ones you lack", () => {
    expect(counsel?.champions.map((c) => [c.name, c.owned])).toEqual([
      ["Jinx, Demolitionist", 1],
      ["Jinx, Rebel", 0],
    ]);
  });

  it("counts only what is legal under the identity", () => {
    // Fury + Chaos: the killer, the tokens, the champion. Not the Calm card.
    expect(counsel?.ownedInIdentity).toBe(3);
    const names = counsel?.byPattern.flatMap((g) => g.candidates.map((c) => c.name)) ?? [];
    expect(names).not.toContain("Calm Thing");
  });

  it("names the patterns you own nothing for, which is the actionable half", () => {
    const missing = counsel?.missing.map((m) => m.pattern) ?? [];
    expect(missing).toContain("hard-counter");
    expect(missing).not.toContain("spot-removal");
  });

  it("is null for a card id that is not in the pool, rather than an empty answer", () => {
    expect(legendCounsel("nope", cards, pool, owned)).toBeNull();
  });
});

describe("aroundCounsel — build around one card", () => {
  const counsel = aroundCounsel("champ-jinx", cards, pool, owned);

  it("reports how many you actually have, because one copy is a real constraint", () => {
    expect(counsel?.card.owned).toBe(1);
  });

  it("walks the synergy graph toward cards that want what it makes", () => {
    const discard = counsel?.partners.find((p) => p.link === "discard_matters");
    expect(discard?.candidates.map((c) => c.name)).toContain("Jinx, Rebel");
  });

  it("lists every Legend whose identity admits the card", () => {
    const legends = counsel?.legends.map((l) => l.name) ?? [];
    expect(legends).toContain("Loose Cannon");
    expect(legends).not.toContain("Calm Legend");
  });

  it("never offers the card itself as its own partner", () => {
    const all = counsel?.partners.flatMap((p) => p.candidates.map((c) => c.name)) ?? [];
    expect(all).not.toContain("Jinx, Demolitionist");
  });
});

describe("counterCounsel — what beats this Legend", () => {
  const counsel = counterCounsel("legend-jinx", cards, pool, owned);

  it("reports what the identity CAN do, never what an opponent will play", () => {
    const labels = counsel?.theirPatterns.map((p) => p.pattern) ?? [];
    expect(labels).toContain("go-wide");
    // No field anywhere claims likelihood — there is no meta data in this project.
    expect(JSON.stringify(counsel)).not.toMatch(/likely|popular|meta|winrate/i);
  });

  it("carries the reasoning with every answer, so the doctrine can be argued with", () => {
    for (const answer of counsel?.yourAnswers ?? []) {
      expect(answer.because.length).toBeGreaterThan(20);
    }
  });

  it("suggests only cards you own, from any identity — you pick your own Legend", () => {
    const suggested = counsel?.yourAnswers.flatMap((a) =>
      a.with.flatMap((g) => g.candidates.map((c) => c.name)),
    );
    expect(suggested?.every((n) => n !== "Banned Bomb")).toBe(true);
    for (const answer of counsel?.yourAnswers ?? []) {
      for (const group of answer.with) {
        expect(group.candidates.every((c) => c.owned > 0)).toBe(true);
      }
    }
  });

  it("has an answer for every threat it names, or does not name it", () => {
    const threats = new Set(ANSWERS.map((a) => a.threat));
    for (const answer of counsel?.yourAnswers ?? []) expect(threats.has(answer.threat)).toBe(true);
  });

  it("says the read is domain-level, because the pattern half is", () => {
    expect(counsel?.scope).toBe("domain-identity");
  });
});

/**
 * **The Legend's engine — the half that made four Body+Order Legends identical.**
 *
 * `theirPatterns` is derived from domains, so it cannot tell Grand Duelist from Relentless
 * Storm. `theirEngine` is derived from the Legend's own `consumes`, so it must.
 */
describe("counterCounsel — reading the opponent's engine", () => {
  const CARDS3: Record<string, CardEntry> = {
    becomes: {
      name: "Becomes Mighty Legend",
      types: ["legend"],
      domains: ["body", "order"],
      championTag: "A",
      consumes: ["becomes_mighty"],
    },
    plays: {
      name: "Plays Mighty Legend",
      types: ["legend"],
      domains: ["body", "order"],
      championTag: "B",
      consumes: ["plays_mighty"],
    },
    pumper: { name: "Pumper", types: ["spell"], domains: ["body"], energy: 2, produces: ["pump"] },
    fatty: { name: "Printed Fatty", types: ["unit"], domains: ["order"], energy: 6, might: 7 },
  };
  const idx = staticCardIndex(CARDS3);
  const pool3: PoolCard[] = Object.entries(CARDS3).map(([cardId, entry]) => ({ cardId, facts: entry }));

  const becomes = counterCounsel("becomes", idx, pool3, {});
  const plays = counterCounsel("plays", idx, pool3, {});

  it("distinguishes two Legends that share both domains", () => {
    expect(becomes?.theirEngine).not.toEqual(plays?.theirEngine);
    expect(becomes?.theirEngine[0]?.tag).toBe("becomes_mighty");
    expect(plays?.theirEngine[0]?.tag).toBe("plays_mighty");
  });

  it("counts the pump as the becoming-Mighty enabler and the printed body as the playing one", () => {
    // CR 709 — a printed 7-Might unit arrives Mighty and never *becomes* it.
    expect(becomes?.theirEngine[0]?.enablers).toBe(1);
    expect(plays?.theirEngine[0]?.enablers).toBe(1);
    expect(becomes?.theirEngine[0]?.supply).toBe("counted");
  });

  it("still reports the domain-level pattern read as domain-level", () => {
    expect(becomes?.theirPatterns).toEqual(plays?.theirPatterns);
    expect(becomes?.scope).toBe("domain-identity");
  });
});

/**
 * ⚠️ **`--mine`, and the answer that was the opponent's own card.**
 *
 * Unfiltered, `counter` recommended 32 cards spanning all six domains — 10 of which could
 * share a deck — and its top answer to Grand Duelist was `Riposte`, a Fiora Signature card
 * that L21 makes illegal under any other Legend. In other words: to beat the deck, play the
 * deck. Naming your own Legend applies the two checks that bind.
 */
describe("counterCounsel — answers you can actually register", () => {
  const CARDS2: Record<string, CardEntry> = {
    theirs: {
      name: "Their Legend",
      types: ["legend"],
      domains: ["fury", "chaos"],
      championTag: "Jinx",
      text: "…",
    },
    mine: { name: "My Legend", types: ["legend"], domains: ["calm", "order"], championTag: "Poppy" },
    bomb: { name: "Big Bomb", types: ["unit"], domains: ["fury"], energy: 8, might: 8 },
    fury: {
      name: "Fury Answer",
      types: ["spell"],
      domains: ["fury"],
      energy: 2,
      role: "removal-kill",
      produces: ["kill"],
      text: "Kill a unit.",
    },
    calm: {
      name: "Calm Answer",
      types: ["spell"],
      domains: ["calm"],
      energy: 2,
      role: "removal-kill",
      produces: ["kill"],
      text: "Kill a unit.",
    },
    sig: {
      name: "Their Signature",
      types: ["spell"],
      superTypes: ["signature"],
      tags: ["Jinx"],
      domains: ["calm"],
      energy: 2,
      role: "removal-kill",
      produces: ["kill"],
      text: "Kill a unit.",
    },
  };
  const idx = staticCardIndex(CARDS2);
  const pool2: PoolCard[] = Object.entries(CARDS2).map(([cardId, entry]) => ({ cardId, facts: entry }));
  const own2 = { fury: 2, calm: 2, sig: 2 };
  const named = (c: ReturnType<typeof counterCounsel>) =>
    c?.yourAnswers.flatMap((a) => a.with.flatMap((g) => g.candidates.map((x) => x.name))) ?? [];

  it("without --mine, keeps every domain — and cannot be a deck", () => {
    const all = named(counterCounsel("theirs", idx, pool2, own2));
    expect(all).toContain("Fury Answer");
    expect(all).toContain("Calm Answer");
    expect(counterCounsel("theirs", idx, pool2, own2)?.playableUnder).toBeUndefined();
  });

  it("with --mine, drops what falls outside your Domain Identity", () => {
    const all = named(counterCounsel("theirs", idx, pool2, own2, 5, "mine"));
    expect(all).toContain("Calm Answer");
    expect(all).not.toContain("Fury Answer");
  });

  it("with --mine, drops their Signature card — L21 makes it illegal in your deck", () => {
    // In identity (Calm) and owned, so only the champion tag can exclude it. It must.
    expect(named(counterCounsel("theirs", idx, pool2, own2, 5, "mine"))).not.toContain(
      "Their Signature",
    );
  });

  it("names the Legend it filtered to, so the constraint is visible in the answer", () => {
    expect(counterCounsel("theirs", idx, pool2, own2, 5, "mine")?.playableUnder?.name).toBe(
      "My Legend",
    );
  });

  it("is null for a --mine id that is not in the pool, rather than silently unfiltered", () => {
    expect(counterCounsel("theirs", idx, pool2, own2, 5, "nope")).toBeNull();
  });
});

describe("mechanicCounsel — playing around a mechanic", () => {
  it("returns both halves: what pays it off and what feeds it", () => {
    const counsel = mechanicCounsel("token_matters", pool, owned);
    expect(counsel.wants.map((c) => c.name)).toContain("Swarm Lord");
    expect(counsel.feeds.map((c) => c.name)).toContain("Chaos Swarm");
  });

  it("says plainly when nothing in the pool engages it", () => {
    expect(mechanicCounsel("not_a_mechanic", pool, owned).known).toBe(false);
  });

  it("never suggests a banned card", () => {
    const counsel = mechanicCounsel("spot-removal", pool, owned);
    expect([...counsel.wants, ...counsel.feeds].map((c) => c.name)).not.toContain("Banned Bomb");
  });
});
