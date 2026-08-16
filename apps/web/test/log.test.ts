import { describe, expect, it } from "vitest";
import type { MatchFormat, MatchRecord } from "@forge/engine";
import { formatsPlayed, openingFormat } from "../src/Log.js";

/**
 * Which record the log opens on (D-066).
 *
 * The engine decides what a reading is allowed to *claim*; this decides what you are shown
 * first, and getting it wrong hides your own games rather than misreporting them — a failure
 * no engine test can see, because every number the engine returned was correct.
 */
const m = (format: MatchFormat | null, id = "x"): MatchRecord => ({
  id,
  playedAt: "2026-08-16",
  result: "WIN",
  ...(format === null ? {} : { format }),
});

describe("which format the log opens on", () => {
  it("opens on 1v1 when there is nothing logged", () => {
    expect(openingFormat([])).toBe("1v1");
  });

  it("opens on the format you actually played, when it is the only one", () => {
    // The regression: two 1v1v1 games opened an empty heads-up record *and* hid the
    // switcher, because there was only one format to switch between. The games were
    // unreachable through the interface that had just recorded them.
    expect(openingFormat([m("1v1v1", "a"), m("1v1v1", "b")])).toBe("1v1v1");
    expect(openingFormat([m("2v2", "a")])).toBe("2v2");
  });

  it("prefers 1v1 whenever there are heads-up games to show", () => {
    expect(openingFormat([m("1v1v1", "a"), m("1v1", "b")])).toBe("1v1");
  });

  it("treats an unlabelled record as heads-up, matching the engine", () => {
    expect(openingFormat([m(null, "a")])).toBe("1v1");
    expect(formatsPlayed([m(null, "a")])).toEqual(["1v1"]);
  });

  it("lists formats in a stable order rather than in the order played", () => {
    expect(formatsPlayed([m("2v2", "a"), m("1v1", "b"), m("1v1v1", "c")])).toEqual([
      "1v1",
      "1v1v1",
      "2v2",
    ]);
  });
});
