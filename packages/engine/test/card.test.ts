import { describe, expect, it } from "vitest";
import { cardCounsel, staticCardIndex, type CardEntry, type PoolCard } from "../src/index.js";

/**
 * **Q-CARD** — *"what is this card good at? Bad at? When do I play it?"* (`EVALUATION §6.1`).
 *
 * ⚠️ **The thing under test is that `text` comes back at all.**
 *
 * `EE-BRIEFING §3` carries *"read the card, do not build from the tag"* twice, and there was no
 * tool that returned a card's printed text. The mouth was told to read the card and given no way
 * to read it, so it read the tag — and three copies of a unit that kills a friendly unit to play
 * shipped in a deck built to hold battlefields with bodies. Everything else here is arranged
 * around that one field.
 *
 * The second thing under test is the refusal: role-conditional Might is **arithmetic either side
 * of a fight**, never the fight's outcome. There is no rules core, and a Might figure that reads
 * as a verdict is exactly how one would be faked.
 */

const CARDS: Record<string, CardEntry> = {
  patron: {
    name: "Cruel Patron",
    types: ["unit"],
    domains: ["chaos"],
    energy: 4,
    might: 6,
    role: "body",
    text: "As an additional cost to play me, kill a friendly unit.",
  },
  attacker: {
    name: "Vanguard Charger",
    types: ["unit"],
    domains: ["fury"],
    energy: 3,
    might: 3,
    text: "[Assault 2]",
  },
  defender: {
    name: "Wall Of Spears",
    types: ["unit"],
    domains: ["order"],
    energy: 3,
    might: 3,
    text: "[Shield 2] [Tank]",
  },
  even: { name: "Plain Body", types: ["unit"], domains: ["order"], energy: 3, might: 4 },
  bare: { name: "Bare Keyword", types: ["unit"], domains: ["fury"], energy: 2, might: 2, text: "[Assault]" },
  spell: { name: "Quick Burn", types: ["spell"], domains: ["fury"], energy: 1, text: "Deal 2 damage to a unit." },
  peerA: { name: "Peer A", types: ["unit"], domains: ["order"], energy: 3, might: 2 },
  peerB: { name: "Peer B", types: ["unit"], domains: ["order"], energy: 3, might: 6 },
  bannedPeer: { name: "Banned Peer", types: ["unit"], domains: ["order"], energy: 3, might: 99, banned: true },
  legend: { name: "A Legend", types: ["legend"], domains: ["order"] },
};

const index = staticCardIndex(CARDS);
const pool: PoolCard[] = Object.entries(CARDS).map(([cardId, facts]) => ({ cardId, facts }));

describe("cardCounsel", () => {
  it("⚠️ returns the printed text first, and that is the point of the tool", () => {
    const read = cardCounsel("patron", index)!;
    expect(read.text).toBe("As an additional cost to play me, kill a friendly unit.");
  });

  it("⚠️ surfaces the additional cost the tag hides, quoting the clause", () => {
    // The whole defect in one assertion: the tag says "4-cost 6-Might body, fills the curve",
    // and the tag is true. The cost is only in the text.
    const read = cardCounsel("patron", index)!;
    const cost = read.mechanics.find((m) => m.id === "additional-cost");
    expect(cost).toBeDefined();
    expect(cost?.clause).toContain("kill a friendly unit");
    expect(cost?.why.length).toBeGreaterThan(0);
  });

  it("reads Might in both orientations — [Assault] attacking, [Shield] defending", () => {
    // CR 807 / CR 814. Arithmetic, not adjudication.
    const attacking = cardCounsel("attacker", index)!;
    expect(attacking.combat).toMatchObject({ might: 3, attacking: 5, defending: 3, orientation: "proactive" });

    const defending = cardCounsel("defender", index)!;
    expect(defending.combat).toMatchObject({ might: 3, attacking: 3, defending: 5, orientation: "defensive" });

    expect(cardCounsel("even", index)!.combat.orientation).toBe("symmetric");
  });

  it("gives a non-unit no combat profile rather than a zero", () => {
    // ⚠️ A spell with `might: 0` would sort alongside a real body and read as the worst unit in
    // the format. Absent and zero are different answers.
    expect(cardCounsel("spell", index)!.combat).toMatchObject({
      might: null,
      attacking: null,
      defending: null,
      orientation: null,
    });
  });

  it("treats a numberless [Assault] as adding nothing", () => {
    const read = cardCounsel("bare", index)!;
    expect(read.combat.attacking).toBe(2);
    expect(read.combat.orientation).toBe("symmetric");
  });

  it("measures cost efficiency as the format median at that energy, excluding banned cards", () => {
    // Median rather than mean — one Baron Nashor should not move the yardstick — and the
    // banned 99-Might peer must not be in the denominator at all.
    const read = cardCounsel("even", index, pool)!;
    // Unbanned 3-cost units: Vanguard 3, Wall 3, Plain 4, Peer A 2, Peer B 6 → median 3.
    expect(read.formatMedianMight).toBe(3);
  });

  it("returns no median when no pool was supplied, rather than a guess", () => {
    expect(cardCounsel("even", index).formatMedianMight ?? null).toBeNull();
  });

  it("reports ownership as a count, never as a filter", () => {
    // "Go and get this one" is a real answer. Zero owned is information, not a disqualification.
    expect(cardCounsel("patron", index, pool, { patron: 2 })!.owned).toBe(2);
    expect(cardCounsel("patron", index, pool)!.owned).toBe(0);
  });

  it("⚠️ distinguishes an unknown printing from an unowned one", () => {
    // `null` means "the index has never heard of this". A caller that blurred the two would
    // report a typo as a card nobody owns.
    expect(cardCounsel("no-such-card", index)).toBeNull();
    expect(cardCounsel("patron", index)).not.toBeNull();
  });

  it("⚠️ always says what it cannot tell you, and combat is first on that list", () => {
    // Without this, a statistics sheet reads as an evaluation. There is no S1a; the Might
    // figures are printed statistics either side of a fight, not its outcome.
    const read = cardCounsel("attacker", index, pool)!;
    expect(read.unmodelled.length).toBeGreaterThan(0);
    expect(read.unmodelled[0]).toContain("no rules core");
    expect(read.unmodelled.join(" ")).toContain("beats in a fight");
  });

  it("never returns a grade, a score or a rating", () => {
    // D-016. This feeds a language model, and a numeric field named like a verdict would be
    // read as one however it was documented.
    const read = cardCounsel("patron", index, pool, { patron: 3 })!;
    const keys = Object.keys(read);
    for (const forbidden of ["grade", "score", "rating", "tier", "rank", "verdict"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
