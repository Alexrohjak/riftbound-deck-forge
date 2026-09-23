import { describe, expect, it } from "vitest";
import { linesToNotes } from "../src/GamePlan.js";

/**
 * The voice rule (D-067): a line you did not touch keeps who said it, and anything you typed is
 * yours. Getting this wrong either launders a draft into `ours` or strips your own words of it.
 */
describe("linesToNotes", () => {
  const before = [
    { text: "Hold Thermo Beam for two pieces of gear", voice: "draft" as const },
    { text: "His Legend needs an Equipment each turn", voice: "guide" as const },
  ];

  it("keeps the voice of an untouched line", () => {
    const text = "Hold Thermo Beam for two pieces of gear\nHis Legend needs an Equipment each turn";
    expect(linesToNotes(text, before)).toEqual(before);
  });

  it("makes an edited or new line yours", () => {
    const notes = linesToNotes("Hold Thermo Beam for three pieces of gear\nNew thought", before);
    expect(notes.map((n) => n.voice)).toEqual(["ours", "ours"]);
  });

  it("drops blank lines rather than saving empty notes", () => {
    expect(linesToNotes("\n  \nOne\n\n", [])).toEqual([{ text: "One", voice: "ours" }]);
  });
});
