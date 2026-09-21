import { describe, expect, it } from "vitest";
import { readMatchLog, tallyMatchLog } from "./match-log.mjs";

/**
 * The bug these cover: `pull-state.mjs` never selected `matches`, so every session began
 * blind to the only longitudinal evidence in the project (`G7`). Now that it does, the row
 * mapping is the seam where the record could quietly become a different record — a dropped
 * symptom reads as a game that had nothing wrong with it.
 */
const row = (over = {}) => ({
  id: "m1",
  deck_id: "d1",
  deck_name: "Fiora — Grand Duelist",
  deck_hash: "abc123",
  played_at: "2026-09-14",
  format: null,
  opponent_legend: "ven-147-166",
  opponent_note: null,
  result: "LOSS",
  games: null,
  symptoms: '["cannot-remove","clunky-draws"]',
  notes: null,
  ...over,
});

const silent = () => {};

describe("readMatchLog", () => {
  it("maps columns onto the engine's field names", () => {
    const [m] = readMatchLog([row()], silent);
    expect(m).toEqual({
      id: "m1",
      deckId: "d1",
      deckName: "Fiora — Grand Duelist",
      deckHash: "abc123",
      playedAt: "2026-09-14",
      format: null,
      opponentLegend: "ven-147-166",
      opponentNote: null,
      result: "LOSS",
      games: null,
      symptoms: ["cannot-remove", "clunky-draws"],
      notes: null,
    });
  });

  it("leaves an absent format null rather than widening it to 1v1", () => {
    // The engine owns what an absent format means; resolving it here too is how the two
    // answers eventually differ.
    expect(readMatchLog([row({ format: null })], silent)[0].format).toBeNull();
    expect(readMatchLog([row({ format: "1v1v1" })], silent)[0].format).toBe("1v1v1");
  });

  it("reads a null or empty symptoms column as none, without warning", () => {
    const warnings = [];
    const log = readMatchLog(
      [row({ id: "a", symptoms: null }), row({ id: "b", symptoms: "" })],
      (m) => warnings.push(m),
    );
    expect(log.map((m) => m.symptoms)).toEqual([[], []]);
    // A row that never had symptoms is not a defect, so it must stay quiet.
    expect(warnings).toEqual([]);
  });

  it("warns, names the row, and keeps going when symptoms is unparseable", () => {
    const warnings = [];
    const log = readMatchLog(
      [row({ id: "bad", symptoms: "{not json" }), row({ id: "good" })],
      (m) => warnings.push(m),
    );
    // ⚠️ One malformed row must not cost the session the other games.
    expect(log).toHaveLength(2);
    expect(log[0].symptoms).toEqual([]);
    expect(log[1].symptoms).toEqual(["cannot-remove", "clunky-draws"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("bad");
  });

  it("warns when symptoms parses to something that is not an array", () => {
    const warnings = [];
    // `"cannot-remove"` is valid JSON and would otherwise be spread into seven characters.
    const log = readMatchLog([row({ symptoms: '"cannot-remove"' })], (m) => warnings.push(m));
    expect(log[0].symptoms).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe("tallyMatchLog", () => {
  it("counts each result and the losses carrying a symptom", () => {
    const log = readMatchLog(
      [
        row({ id: "1", result: "WIN", symptoms: "[]" }),
        row({ id: "2", result: "LOSS" }),
        row({ id: "3", result: "LOSS", symptoms: '["too-slow"]' }),
        row({ id: "4", result: "DRAW", symptoms: null }),
      ],
      silent,
    );
    expect(tallyMatchLog(log)).toEqual({ WIN: 1, LOSS: 2, DRAW: 1, carrying: 2 });
  });

  it("reads an empty record as zeroes rather than throwing", () => {
    // "Nothing played yet" is a true answer and the state every new deck starts in.
    expect(tallyMatchLog([])).toEqual({ WIN: 0, LOSS: 0, DRAW: 0, carrying: 0 });
  });
});
