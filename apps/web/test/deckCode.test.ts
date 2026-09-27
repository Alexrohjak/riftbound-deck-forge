import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPool } from "../src/cards.js";
import { exportCode, exportText, importCode, importDeck, importText, looksLikeCode } from "../src/deckCode.js";

/**
 * Against the **real** index, for the reason `shippedIndex.test.ts` gives: the code shapes that
 * break an interchange format (`VEN-R01`, `VEN-SP3`, `SFD-227*`, `UNL-T01`) exist only there.
 */
const here = dirname(fileURLToPath(import.meta.url));
const pool = buildPool(JSON.parse(readFileSync(join(here, "../public/cards.json"), "utf8")));

const idOf = (code: string) => pool.byCode.get(code)!;
const nameOf = (id: string) => pool.byPrinting.get(id)!.name;
const total = (slots: { zone: string; quantity: number }[], zone: string) =>
  slots.filter((s) => s.zone === zone).reduce((n, s) => n + s.quantity, 0);

/** Piltover Archive's golden `v3-large`: their README Kai'Sa deck, sideboard and Chosen Champion OGN-103. */
const KAISA =
  "CMAAAAAAAAAQCAAAA4AACAIAABMQAAILAAAAICIMDMOVOX3AM5UHIAIDAAACO6XYAEAQKAAABX3QDGACUABKIAQAAEBQAAAWDBOQCAQAABMHEAIAABTQ";

describe("deck codes", () => {
  it("reads Piltover Archive's reference code into Forge's zones", () => {
    const deck = importCode(KAISA, pool);
    expect(deck.skipped).toEqual([]);
    expect(pool.byPrinting.get(deck.legendCardId)!.types).toContain("legend");
    expect(deck.chosenChampionCardId).toBe(idOf("OGN-103/298"));
    expect(total(deck.slots, "RUNE")).toBe(12);
    expect(total(deck.slots, "BATTLEFIELD")).toBe(3);
    expect(total(deck.slots, "SIDEBOARD")).toBe(8);
    // ⚠️ The code counts the Champion inside a 40-card main deck; Forge holds it outside and
    // counts 39. Three copies of OGN-103 in the code are the Champion plus two in the slots.
    expect(total(deck.slots, "MAIN")).toBe(39);
    expect(deck.slots.find((s) => s.cardId === idOf("OGN-103/298"))!.quantity).toBe(2);
  });

  it("writes the same code Piltover Archive does, byte for byte", () => {
    expect(exportCode(importCode(KAISA, pool), pool).text).toBe(KAISA);
  });

  it("round-trips: what Forge exports, Forge reads back identically", () => {
    const deck = importCode(KAISA, pool);
    const again = importCode(exportCode(deck, pool).text, pool);
    const key = (d: typeof deck) => ({
      legend: d.legendCardId,
      champion: d.chosenChampionCardId,
      slots: [...d.slots].sort((a, b) => (a.cardId + a.zone).localeCompare(b.cardId + b.zone)),
    });
    expect(key(again)).toEqual(key(deck));
  });

  it("carries the shapes a fixture would never contain: R runes, SP promos, signed stars", () => {
    const deck = {
      legendCardId: idOf("OGN-304*/298"),
      chosenChampionCardId: idOf("VEN-SP3/006"),
      slots: [
        { cardId: idOf("VEN-R04"), zone: "RUNE" as const, quantity: 12 },
        { cardId: idOf("SFD-227*/221"), zone: "MAIN" as const, quantity: 1 },
      ],
    };
    const out = exportCode(deck, pool);
    expect(out.missing).toEqual([]);
    const back = importCode(out.text, pool);
    expect(back.legendCardId).toBe(deck.legendCardId);
    expect(back.chosenChampionCardId).toBe(deck.chosenChampionCardId);
    expect(back.slots).toEqual(expect.arrayContaining(deck.slots));
  });

  it("falls back to another printing when the chosen one has no code, and says so when none does", () => {
    const token = pool.cards.find((c) => c.printings.every((p) => /-T\d/.test(p.code)))!;
    const out = exportCode(
      { legendCardId: "", chosenChampionCardId: "", slots: [{ cardId: token.printings[0]!.id, zone: "BATTLEFIELD", quantity: 1 }] },
      pool,
    );
    expect(out.missing).toEqual([token.name]);
  });

  it("tells a code from a text list", () => {
    expect(looksLikeCode(KAISA)).toBe(true);
    expect(looksLikeCode("3 Stupefy")).toBe(false);
    expect(looksLikeCode("MAINDECK")).toBe(false);
  });
});

describe("text lists", () => {
  it("reads Piltover Archive's shape, Champion on its own", () => {
    const deck = importText(
      [
        "Legend:",
        "1 Kai'Sa, Daughter of the Void",
        "",
        "Champion:",
        "1 Kai'Sa, Survivor",
        "",
        "MainDeck:",
        "3 Stupefy",
        "2 Falling Star",
        "",
        "Battlefields:",
        "1 Void Gate",
        "",
        "Runes:",
        "6 Fury Rune",
        "6 Mind Rune",
        "",
        "Sideboard:",
        "3 Smoke Screen",
      ].join("\n"),
      pool,
    );
    expect(deck.skipped).toEqual([]);
    expect(nameOf(deck.legendCardId)).toBe("Daughter of the Void");
    expect(nameOf(deck.chosenChampionCardId)).toBe("Kai'Sa, Survivor");
    expect(total(deck.slots, "MAIN")).toBe(5);
    expect(total(deck.slots, "RUNE")).toBe(12);
    expect(total(deck.slots, "BATTLEFIELD")).toBe(1);
    expect(total(deck.slots, "SIDEBOARD")).toBe(3);
  });

  it("reads the loose shapes other sites write", () => {
    const deck = importText(
      [
        "Legend: Daughter of the Void",
        "Runes: 5 Fury Rune, 7 Mind Rune",
        "Main Deck",
        "3x Stupefy",
        "Falling Star x2",
        "1 Kai'Sa Survivor",
        "Rockfall Path (216)",
        "Side deck",
        "2 smoke screen",
      ].join("\n"),
      pool,
    );
    expect(deck.skipped).toEqual([]);
    expect(nameOf(deck.legendCardId)).toBe("Daughter of the Void");
    expect(total(deck.slots, "RUNE")).toBe(12);
    expect(total(deck.slots, "MAIN")).toBe(6);
    expect(total(deck.slots, "BATTLEFIELD")).toBe(1);
    expect(total(deck.slots, "SIDEBOARD")).toBe(2);
  });

  it("takes the Champion's copy out of a main deck that counts it, and only then", () => {
    const main = (n: number) => `${n} Stupefy`;
    // 40 in main with the Champion listed there too: the list counted it in the 40.
    const counted = importText(
      ["Champion:", "1 Kai'Sa, Survivor", "MainDeck:", "1 Kai'Sa, Survivor", ...Array(13).fill(main(3))].join("\n"),
      pool,
    );
    expect(total(counted.slots, "MAIN")).toBe(39);
    // 39 already: Piltover Archive's shape. Nothing to take.
    const apart = importText(["Champion:", "1 Kai'Sa, Survivor", "MainDeck:", ...Array(13).fill(main(3))].join("\n"), pool);
    expect(total(apart.slots, "MAIN")).toBe(39);
  });

  it("names what it could not read instead of dropping it", () => {
    const deck = importText("3 Stupefy\n2 Not A Real Card", pool);
    expect(deck.skipped).toEqual(["2 Not A Real Card"]);
  });

  it("round-trips through its own export", () => {
    const deck = importCode(KAISA, pool);
    const back = importDeck(exportText(deck, pool), pool);
    expect(back.skipped).toEqual([]);
    for (const zone of ["MAIN", "RUNE", "BATTLEFIELD", "SIDEBOARD"]) {
      expect(total(back.slots, zone)).toBe(total(deck.slots, zone));
    }
    expect(nameOf(back.legendCardId)).toBe(nameOf(deck.legendCardId));
    expect(nameOf(back.chosenChampionCardId)).toBe(nameOf(deck.chosenChampionCardId));
  });
});
