import { describe, expect, it } from "vitest";
import {
  canonicalise,
  deckHash,
  read,
  validate,
  MIN_FOR_RATE,
  type MatchRecord,
} from "../src/index.js";
import type { Deck } from "../src/types.js";

/**
 * Two things are worth testing here and they are not "does it count wins".
 *
 * 1. **The hash is stable and order-independent** — a match record names a build through it,
 *    so an unstable hash silently detaches every game you ever logged from what you played.
 * 2. **The thresholds hold.** Reporting a win rate from four games is the failure mode this
 *    module exists to prevent, and it is the one that would look fine in a screenshot.
 */

const deck = (over: Partial<Deck> = {}): Deck => ({
  id: "d1",
  name: "Ahri Calm-Mind",
  state: "DRAFT",
  legendCardId: "ogn-001-298",
  chosenChampionCardId: "ogn-050-298",
  slots: [
    { cardId: "ogn-100-298", zone: "MAIN", quantity: 3 },
    { cardId: "ogn-101-298", zone: "MAIN", quantity: 2 },
    { cardId: "ven-r01-012", zone: "RUNE", quantity: 6 },
  ],
  ...over,
});

const m = (over: Partial<MatchRecord> & { id: string }): MatchRecord => ({
  playedAt: "2026-08-01",
  result: "WIN",
  ...over,
});

/** n wins then n losses, all against the same Legend, on the same build. */
const series = (wins: number, losses: number, over: Partial<MatchRecord> = {}): MatchRecord[] => [
  ...Array.from({ length: wins }, (_, i) => m({ id: `w${i}`, result: "WIN", ...over })),
  ...Array.from({ length: losses }, (_, i) => m({ id: `l${i}`, result: "LOSS", ...over })),
];

describe("addressing a build by its contents", () => {
  it("ignores slot order — the same list typed in a different order is the same list", () => {
    const a = deck();
    const b = deck({ slots: [...deck().slots].reverse() });
    expect(deckHash(a)).toBe(deckHash(b));
  });

  it("ignores the deck's name and id — renaming is not rebuilding", () => {
    expect(deckHash(deck())).toBe(deckHash(deck({ id: "other", name: "Renamed" })));
  });

  it("changes when a quantity changes, which is the whole point", () => {
    const bumped = deck().slots.map((s) =>
      s.cardId === "ogn-100-298" ? { ...s, quantity: 2 } : s,
    );
    expect(deckHash(deck({ slots: bumped }))).not.toBe(deckHash(deck()));
  });

  it("distinguishes the same card in a different zone", () => {
    const sideboarded = deck().slots.map((s) =>
      s.cardId === "ogn-101-298" ? { ...s, zone: "SIDEBOARD" as const } : s,
    );
    expect(deckHash(deck({ slots: sideboarded }))).not.toBe(deckHash(deck()));
  });

  it("drops empty slots, so removing the last copy matches never having added it", () => {
    const zeroed = [...deck().slots, { cardId: "ogn-999-298", zone: "MAIN" as const, quantity: 0 }];
    expect(deckHash(deck({ slots: zeroed }))).toBe(deckHash(deck()));
  });

  it("is a fixed width, so a column of them lines up", () => {
    expect(deckHash(deck())).toMatch(/^[0-9a-f]{16}$/);
  });

  it("explains itself — the canonical string is readable when two lists disagree", () => {
    expect(canonicalise(deck())).toContain("MAIN:ogn-100-298:3");
  });
});

describe("what the record refuses to claim", () => {
  it("withholds a rate below the threshold, and says why", () => {
    const r = read(series(3, 1));
    expect(r.overall.rate).toBeNull();
    expect(r.overall.withheld).toContain(String(MIN_FOR_RATE));
    expect(r.overall.wins).toBe(3);
  });

  it("reports a rate once there are enough games", () => {
    const r = read(series(6, 4));
    expect(r.overall.played).toBe(10);
    expect(r.overall.rate).toBeCloseTo(0.6);
    expect(r.overall.withheld).toBeUndefined();
  });

  it("keeps draws out of the denominator rather than counting them as half", () => {
    const r = read([...series(6, 4), m({ id: "d", result: "DRAW" })]);
    expect(r.overall.draws).toBe(1);
    expect(r.overall.rate).toBeCloseTo(0.6); // 6/10, not 6.5/11
  });

  it("withholds when nothing decisive has happened", () => {
    const r = read(Array.from({ length: 12 }, (_, i) => m({ id: `d${i}`, result: "DRAW" })));
    expect(r.overall.rate).toBeNull();
    expect(r.overall.withheld).toBe("No decisive games yet.");
  });

  it("says nothing about a pattern from three losses", () => {
    const r = read(series(0, 3, { symptoms: ["cannot-hold"] }));
    expect(r.recurring).toEqual([]);
  });

  it("names a pattern once it is a pattern, not a bad night", () => {
    const r = read([
      ...series(0, 5, { symptoms: ["cannot-hold"] }),
      ...series(4, 0),
    ]);
    expect(r.recurring[0]?.symptom).toBe("cannot-hold");
    expect(r.recurring[0]?.losses).toBe(5);
    expect(r.notes.join(" ")).toContain("build problem");
  });

  it("counts a symptom once per match however often it was written down", () => {
    const repeated = series(0, 4).map((x) => ({
      ...x,
      symptoms: ["cannot-hold", "cannot-hold"] as const,
    }));
    expect(read(repeated).recurring[0]?.losses).toBe(4);
  });
});

describe("reading the log", () => {
  it("groups matchups and keeps unrecorded opponents as their own bucket", () => {
    const r = read([
      ...series(3, 2, { opponentLegend: "ogn-002-298" }),
      ...series(1, 1),
    ]);
    expect(r.matchups.map((x) => x.legendCardId)).toContain("ogn-002-298");
    expect(r.matchups.map((x) => x.legendCardId)).toContain(null);
  });

  it("sorts unrecorded opponents last — a gap in the record is not a tested matchup", () => {
    const r = read([...series(1, 1, { opponentLegend: "ogn-002-298" }), ...series(5, 0)]);
    expect(r.matchups[0]?.legendCardId).toBe("ogn-002-298");
    expect(r.matchups[r.matchups.length - 1]?.legendCardId).toBeNull();
  });

  it("splits the record by build, so 'which version went 4-1' is answerable", () => {
    const r = read([
      ...series(4, 1, { deckHash: "aaaaaaaaaaaaaaaa" }),
      ...series(1, 4, { deckHash: "bbbbbbbbbbbbbbbb" }),
    ]);
    expect(r.versions).toHaveLength(2);
    expect(r.versions.every((v) => v.standing.played === 5)).toBe(true);
  });

  it("ignores matches with no build recorded rather than lumping them together", () => {
    const r = read(series(5, 0));
    expect(r.versions).toEqual([]);
  });

  it("stays inside its statement budget however much is logged", () => {
    const noisy = [
      ...series(0, 6, { symptoms: ["cannot-hold"], deckHash: "a".repeat(16) }),
      ...series(9, 1, { deckHash: "b".repeat(16) }),
      ...series(0, 5, { opponentLegend: "ogn-002-298" }),
    ];
    expect(read(noisy).notes.length).toBeLessThanOrEqual(3);
  });

  it("counts one match as a match — the plural read as broken in the panel", () => {
    expect(read([m({ id: "a" })]).notes[0]).toContain("1 match is");
    expect(read(series(1, 1)).notes[0]).toContain("2 matches is");
  });

  it("does not repeat the count either side of the reason", () => {
    // "1 logged. 1 matches is too few…" — the reason already states the count.
    expect(read([m({ id: "a" })]).notes[0]).toBe(read([m({ id: "a" })]).overall.withheld);
  });

  it("names the opponent through the caller's index rather than printing a card id", () => {
    const matches = series(1, 5, { opponentLegend: "ogn-302-298" });
    expect(read(matches).notes.join(" ")).toContain("ogn-302-298");
    expect(read(matches, () => "Hand of Noxus").notes.join(" ")).toContain("Hand of Noxus");
  });

  it("writes a symptom as words, not as its code", () => {
    const r = read(series(0, 5, { symptoms: ["cannot-hold"] }));
    expect(r.notes[0]).toContain("cannot hold");
    expect(r.notes[0]).not.toContain("cannot-hold");
  });

  it("says so plainly when there is nothing to say", () => {
    expect(read([]).notes).toEqual(["Nothing logged yet."]);
  });
});

describe("rejecting a record before it is stored", () => {
  it("accepts a complete one", () => {
    expect(validate(m({ id: "abc", symptoms: ["cannot-hold"] }))).toEqual([]);
  });

  it("rejects an unknown symptom rather than storing a code nothing reads", () => {
    const bad = { ...m({ id: "abc" }), symptoms: ["mana-screw"] } as unknown as MatchRecord;
    expect(validate(bad)[0]).toContain("Unknown symptom");
  });

  it("rejects a date that is not a date", () => {
    expect(validate(m({ id: "abc", playedAt: "4th August" }))[0]).toContain("YYYY-MM-DD");
  });

  it("catches a typo'd year, which would otherwise sort to the end forever", () => {
    expect(validate(m({ id: "abc", playedAt: "2062-08-01" }), "2026-08-04")[0]).toContain("future");
  });

  it("accepts a local date that is still 'tomorrow' in UTC", () => {
    // The browser sends its LOCAL date; a server computes UTC. At UTC+8, 01:00 on the 5th
    // is 17:00 on the 4th in UTC — and comparing against today rejected a real entry.
    // The caller passes tomorrow-in-UTC, which is wide enough for any timezone.
    expect(validate(m({ id: "abc", playedAt: "2026-08-05" }), "2026-08-05")).toEqual([]);
    expect(validate(m({ id: "abc", playedAt: "2026-08-06" }), "2026-08-05")[0]).toContain(
      "future",
    );
  });

  it("reports a non-array symptoms field instead of throwing out of the endpoint", () => {
    const bad = { ...m({ id: "abc" }), symptoms: { a: 1 } } as unknown as MatchRecord;
    expect(() => validate(bad)).not.toThrow();
    expect(validate(bad)[0]).toContain("array");
  });

  it("bounds free text, because every row lands in a backup committed to git", () => {
    expect(validate(m({ id: "abc", notes: "x".repeat(2001) }))[0]).toContain("notes is longer");
    expect(validate(m({ id: "abc", notes: "x".repeat(2000) }))).toEqual([]);
    expect(validate(m({ id: "abc", opponentNote: "y".repeat(201) }))[0]).toContain("opponentNote");
  });

  it("bounds every free-form string on the row, not just the obvious ones", () => {
    // The stated reason is "every row lands in a backup committed to git" — which was not
    // true while deckId and opponentLegend were unbounded.
    expect(validate(m({ id: "abc", deckId: "d".repeat(65) }))[0]).toContain("deckId");
    expect(validate(m({ id: "abc", opponentLegend: "o".repeat(65) }))[0]).toContain(
      "opponentLegend",
    );
  });

  it("accepts a game score and rejects a mangled one", () => {
    expect(validate(m({ id: "abc", games: "2-1" }))).toEqual([]);
    expect(validate(m({ id: "abc", games: "two to one" }))[0]).toContain("2-1");
  });
});

/**
 * D-066 — the shape of the table.
 *
 * The failure worth testing for is not "does it filter". It is that a reading which quietly
 * pooled formats would report a *larger* sample and therefore look **more** trustworthy while
 * describing no game anyone played — the same laundering every threshold in this module
 * exists to prevent, smuggled back in through a bigger `n`.
 */
describe("formats are read separately", () => {
  it("reads a record with no format as 1v1 — every such row predates the column", () => {
    const reading = read(series(MIN_FOR_RATE, 0));
    expect(reading.format).toBe("1v1");
    expect(reading.overall.played).toBe(MIN_FOR_RATE);
    expect(reading.elsewhere).toEqual([]);
  });

  it("never pools two formats into one rate", () => {
    const mixed = [
      ...series(MIN_FOR_RATE, 0),
      ...series(0, MIN_FOR_RATE, { format: "1v1v1" }).map((x) => ({ ...x, id: `p${x.id}` })),
    ];

    const heads = read(mixed);
    expect(heads.overall.played).toBe(MIN_FOR_RATE);
    expect(heads.overall.rate).toBe(1);
    expect(heads.elsewhere).toEqual([{ format: "1v1v1", played: MIN_FOR_RATE }]);

    const pod = read(mixed, undefined, "1v1v1");
    expect(pod.overall.played).toBe(MIN_FOR_RATE);
    expect(pod.overall.rate).toBe(0);
    // Pooled, this would have read 10-10 at 50% — a figure describing neither table.
    expect(pod.elsewhere).toEqual([{ format: "1v1", played: MIN_FOR_RATE }]);
  });

  it("says where the games went rather than claiming nothing was played", () => {
    // The one sentence that would be actively misleading: two games logged, and a reading
    // that answers "Nothing logged yet."
    const reading = read(series(1, 1, { format: "1v1v1" }));
    expect(reading.overall.played).toBe(0);
    expect(reading.notes[0]).not.toBe("Nothing logged yet.");
    expect(reading.notes[0]).toContain("1v1v1");
    expect(reading.notes[0]).toContain("2 games");
  });

  it("still says nothing was played when nothing was", () => {
    expect(read([]).notes[0]).toBe("Nothing logged yet.");
  });

  it("refuses to build a matchup outside 1v1 — a three-way loss is not a loss to one deck", () => {
    const opponent = { opponentLegend: "ogn-002-298" } as const;
    expect(read(series(3, 3, opponent)).matchups.length).toBeGreaterThan(0);
    expect(
      read(series(3, 3, { ...opponent, format: "1v1v1" }), undefined, "1v1v1").matchups,
    ).toEqual([]);
  });

  it("carries par, because 33% is a broken deck heads-up and average in a pod", () => {
    expect(read([], undefined, "1v1").baseline).toBe(1 / 2);
    expect(read([], undefined, "1v1v1").baseline).toBeCloseTo(1 / 3);
    expect(read([], undefined, "2v2").baseline).toBe(1 / 2);
  });

  it("does not let a symptom from one format become a pattern in another", () => {
    const podLosses = series(0, 6, { format: "1v1v1", symptoms: ["cannot-hold"] }).map((x) => ({
      ...x,
      id: `p${x.id}`,
    }));

    expect(read(podLosses).recurring).toEqual([]);
    expect(read(podLosses, undefined, "1v1v1").recurring[0]?.symptom).toBe("cannot-hold");
  });

  it("rejects a format nobody plays, and treats absent as a real answer", () => {
    expect(validate(m({ id: "abc", format: "1v1" }))).toEqual([]);
    expect(validate(m({ id: "abc", format: "2v2" }))).toEqual([]);
    expect(validate(m({ id: "abc", format: null }))).toEqual([]);
    // A typo must not land in a bucket no reading ever asks for.
    expect(validate(m({ id: "abc", format: "3v3" as never }))[0]).toContain("format must be");
  });
});
