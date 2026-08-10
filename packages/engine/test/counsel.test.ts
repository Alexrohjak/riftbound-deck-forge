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
    // ⚠️ There is no "rewards" or "wants" field, on purpose: Legends carry no `consumes`
    // annotations, so any such field would be the tool inventing the answer's best sentence.
    expect(counsel).not.toHaveProperty("rewards");
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
