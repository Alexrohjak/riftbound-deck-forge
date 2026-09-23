import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FIELD_MIN_FOR_RATE,
  pressure,
  readField,
  validateField,
  type FieldSnapshot,
} from "../src/index.js";

/**
 * Three promises, each one a way the field could mislead:
 *
 * 1. **Under 20 games is a record, never a rate** — BoundRift's own threshold.
 * 2. **One stored direction reads both ways**, by Legend *name*, so an alt-art Legend in the
 *    deck still finds its row.
 * 3. **An unmeasured matchup never ranks as safe.** It sits below every measured one, but it
 *    is still listed — unknown is not good.
 */

const NAMES: Record<string, string> = {
  kaisa: "Daughter of the Void",
  "kaisa-alt": "Daughter of the Void",
  azir: "Emperor of the Sands",
  rengar: "Pridestalker",
  ahri: "Nine-Tailed Fox",
  jayce: "Defender of Tomorrow",
};
const nameOf = (id: string) => NAMES[id];

const snapshot: FieldSnapshot = {
  schema: "forge.field/1",
  window: { id: "w", label: "Test window", from: "2026-09-18" },
  sources: [{ id: "t", name: "Test", url: "https://example.test", retrieved: "2026-09-23", covers: "" }],
  unpublishedBelow: 5,
  legends: [
    { legendCardId: "kaisa", name: "Kai'Sa, Daughter of the Void", wins: 40, losses: 60 },
    { legendCardId: "azir", name: "Azir, Emperor of the Sands", wins: 300, losses: 300 },
    { legendCardId: "rengar", name: "Rengar, Pridestalker", wins: 250, losses: 150 },
    { legendCardId: "ahri", name: "Ahri, Nine-Tailed Fox", wins: 4, losses: 6 },
    { legendCardId: "jayce", name: "Jayce, Defender of Tomorrow", wins: null, losses: null },
  ],
  pairings: [
    { a: "azir", b: "kaisa", wins: 13, losses: 18 },
    { a: "kaisa", b: "rengar", wins: 8, losses: 16 },
    { a: "kaisa", b: "ahri", wins: 3, losses: 2 },
  ],
};

describe("readField", () => {
  const field = readField(snapshot, nameOf);

  it("reads a stored pairing from the other side, and by name", () => {
    const s = field.pairing("kaisa-alt", "azir")!;
    expect([s.wins, s.losses]).toEqual([18, 13]);
    expect(s.rate).toBeCloseTo(18 / 31);
  });

  it(`withholds the rate under ${FIELD_MIN_FOR_RATE} games`, () => {
    const s = field.pairing("kaisa", "ahri")!;
    expect(s.rate).toBeNull();
    expect(s.withheld).toMatch(/5 field games/);
  });

  it("says nothing, rather than zero, for an unpublished pairing", () => {
    expect(field.pairing("azir", "rengar")).toBeNull();
  });

  it("gives a share of seats and no share to a Legend with no games", () => {
    expect(field.share("azir")).toBeCloseTo(600 / 1110);
    expect(field.share("jayce")).toBeNull();
    expect(field.overall("jayce")).toBeNull();
  });
});

describe("pressure", () => {
  const field = readField(snapshot, nameOf);

  it("ranks by losses weighted by how often you meet them, unmeasured last", () => {
    const p = pressure(field, "kaisa", new Set(["Emperor of the Sands"]), nameOf);
    // Rengar: met 36% of the time, lost 67% → 0.24. Azir: met 54%, lost 42% → 0.23.
    expect(p.map((x) => x.legendCardId)).toEqual(["rengar", "azir", "ahri"]);
    expect(p[0]!.expectedLossShare).toBeCloseTo((400 / 1110) * (16 / 24));
    expect(p[1]!.planned).toBe(true);
    expect(p[2]!.expectedLossShare).toBeNull();
  });

  it("never lists the deck's own Legend", () => {
    expect(pressure(field, "kaisa-alt", new Set(), nameOf).some((x) => x.legendCardId === "kaisa")).toBe(false);
  });
});

describe("the committed snapshot", () => {
  const raw = JSON.parse(readFileSync(join(__dirname, "../../../data/field.json"), "utf8"));

  it("is well-formed", () => {
    expect(validateField(raw)).toEqual([]);
  });

  it("holds the pairing D-068 was written about", () => {
    // Kai'Sa beats Azir 58% across 31 games — the figure that contradicted his 0-2.
    const f = readField(raw as FieldSnapshot, (id) => id);
    const kaisa = raw.legends.find((l: { name: string }) => l.name.startsWith("Kai'Sa")).legendCardId;
    const azir = raw.legends.find((l: { name: string }) => l.name.startsWith("Azir")).legendCardId;
    const s = f.pairing(kaisa, azir)!;
    expect(s.played).toBe(31);
    expect(Math.round(s.rate! * 100)).toBe(58);
  });
});
