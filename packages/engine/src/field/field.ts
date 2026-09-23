import type { Standing } from "../log/match.js";

/**
 * What **other people** play and win with (D-068) — a dated, attributed snapshot, never a feed.
 *
 * Until this existed every matchup read was domain-level: `counter` could say what a Legend's
 * two domains *can* field, never what anyone actually brings. The field answers the second
 * question, and only that one.
 *
 * ⚠️ **The field describes the average deck, not his.** Every figure here is keyed by Legend,
 * never by list, and it is shown *beside* his record, never blended into it. When the two
 * disagree, that disagreement is the finding — averaging a thousand strangers with six of his
 * games would hide it.
 *
 * ⚠️ **Collected outside the engine, read by it.** `scripts/build-field.mjs` normalises what
 * Claude read from the page; the engine only ever receives the resulting document, so it stays
 * pure (D-047) and every reading is reproducible from the committed capture.
 */

export interface FieldSource {
  id: string;
  name: string;
  url: string;
  /** ISO date the page was read. */
  retrieved: string;
  /** What the source itself says the figure covers, verbatim where it says so. */
  covers: string;
}

/**
 * A period the figures are **not** pooled across. A ban or a new set starts a new one, for the
 * same reason formats are never pooled (D-066): a win rate straddling a ban describes neither
 * the format before it nor the one after.
 */
export interface FieldWindow {
  id: string;
  label: string;
  /** First day of the window, ISO. */
  from: string;
}

export interface FieldLegend {
  /** Any printing — matched by **name**, like every other Legend comparison. */
  legendCardId: string;
  /** "Kai'Sa, Daughter of the Void". The card's own name is only the title. */
  name: string;
  /** Recorded tournament games, all opponents. `null` when the source lists no games. */
  wins: number | null;
  losses: number | null;
  /** Editorial tier, where a source publishes one. A prediction, not a result. */
  tier?: { tier: string; rank: number; source: string };
}

/** One direction of a pairing. The reverse is derived, never stored twice. */
export interface FieldPairing {
  a: string;
  b: string;
  /** `a`'s wins against `b`. */
  wins: number;
  losses: number;
}

export interface FieldSnapshot {
  schema: "forge.field/1";
  window: FieldWindow;
  sources: FieldSource[];
  legends: FieldLegend[];
  pairings: FieldPairing[];
  /** Pairings below this many games are not published by the source, so they are absent here. */
  unpublishedBelow: number;
}

/**
 * ⚠️ **Under 20 games a pairing is a record, never a rate.** BoundRift's own rule, checked on
 * 2026-09-23 (every "too few" cell is ≤19 games, every rated one ≥20), and deliberately higher
 * than the log's 5: a field pairing aggregates strangers, so it earns a rate later, not sooner.
 */
export const FIELD_MIN_FOR_RATE = 20;

const standing = (wins: number, losses: number): Standing => {
  const played = wins + losses;
  if (played < FIELD_MIN_FOR_RATE) {
    return {
      played,
      wins,
      losses,
      draws: 0,
      rate: null,
      withheld: `${played} field games is too few to read — a rate needs ${FIELD_MIN_FOR_RATE}.`,
    };
  }
  return { played, wins, losses, draws: 0, rate: wins / played };
};

export type NameOf = (cardId: string) => string | undefined;

/** Name-keyed lookups — built once per snapshot, because a page asks many questions of it. */
export interface FieldReader {
  snapshot: FieldSnapshot;
  legend(cardId: string): FieldLegend | undefined;
  /** This Legend's standing across every opponent. */
  overall(cardId: string): Standing | null;
  /** Its share of every seat in the window's recorded games — how often you will *meet* it. */
  share(cardId: string): number | null;
  /**
   * `ours` against `theirs`, from `ours`' side. `null` means the source published nothing —
   * under `unpublishedBelow` games — which is not the same as a bad matchup.
   */
  pairing(ours: string, theirs: string): Standing | null;
}

export function readField(snapshot: FieldSnapshot, nameOf: NameOf): FieldReader {
  // By title: a Legend has alternate printings, and the deck and the snapshot may name different ones.
  const key = (id: string) => nameOf(id) ?? id;
  const legends = new Map<string, FieldLegend>();
  for (const l of snapshot.legends) legends.set(key(l.legendCardId), l);
  const pairs = new Map<string, [number, number]>();
  for (const p of snapshot.pairings) {
    pairs.set(`${key(p.a)}|${key(p.b)}`, [p.wins, p.losses]);
    pairs.set(`${key(p.b)}|${key(p.a)}`, [p.losses, p.wins]);
  }
  const seats = snapshot.legends.reduce((a, l) => a + (l.wins ?? 0) + (l.losses ?? 0), 0);

  const legend = (id: string) => legends.get(key(id));
  return {
    snapshot,
    legend,
    overall(id) {
      const l = legend(id);
      return l && l.wins !== null && l.losses !== null ? standing(l.wins, l.losses) : null;
    },
    share(id) {
      const l = legend(id);
      if (!l || l.wins === null || l.losses === null || seats === 0) return null;
      return (l.wins + l.losses) / seats;
    },
    pairing(ours, theirs) {
      const p = pairs.get(`${key(ours)}|${key(theirs)}`);
      return p ? standing(p[0], p[1]) : null;
    },
  };
}

// ── coverage ─────────────────────────────────────────────────────────────────

export interface Pressure {
  legendCardId: string;
  name: string;
  /** How often you will meet it. */
  share: number;
  /** Your Legend against it in the field. */
  field: Standing | null;
  /**
   * `share × (1 − field rate)` — the share of all your games you should expect to **lose to
   * this Legend** if you played the average list. `null` when the pairing has no rate, and then
   * the entry ranks below every measured one: an unmeasured matchup is unknown, not safe.
   */
  expectedLossShare: number | null;
  planned: boolean;
}

/** A page that ranks nine threats ranks none (D-039). */
export const PRESSURE_BUDGET = 5;

/**
 * Which opposing Legends cost this deck the most games, in the field's terms — the question a
 * sideboard and a game plan exist to answer, ranked so the first entry is the first to plan.
 *
 * ⚠️ **Losses weighted by how often you meet them**, because a 30% matchup you meet once a
 * tournament costs less than a 45% one you meet every round. Neither half alone ranks the list.
 */
export function pressure(
  field: FieldReader,
  ours: string,
  planned: ReadonlySet<string>,
  nameOf: NameOf,
  budget = PRESSURE_BUDGET,
): Pressure[] {
  const key = (id: string) => nameOf(id) ?? id;
  const self = key(ours);
  const out: Pressure[] = [];
  for (const l of field.snapshot.legends) {
    if (key(l.legendCardId) === self) continue;
    const share = field.share(l.legendCardId);
    if (share === null) continue;
    const f = field.pairing(ours, l.legendCardId);
    out.push({
      legendCardId: l.legendCardId,
      name: l.name,
      share,
      field: f,
      expectedLossShare: f?.rate != null ? share * (1 - f.rate) : null,
      planned: planned.has(key(l.legendCardId)),
    });
  }
  out.sort(
    (x, y) =>
      (y.expectedLossShare ?? -1) - (x.expectedLossShare ?? -1) || y.share - x.share,
  );
  return out.slice(0, budget);
}

// ── shape ────────────────────────────────────────────────────────────────────

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const count = (x: unknown) => Number.isInteger(x) && (x as number) >= 0;

/** What makes a snapshot readable. The normaliser checks the numbers against the page. */
export function validateField(x: unknown): string[] {
  const problems: string[] = [];
  if (!isObj(x)) return ["A field snapshot must be an object."];
  if (x.schema !== "forge.field/1") problems.push('schema must be "forge.field/1".');
  if (!isObj(x.window) || typeof x.window.id !== "string") problems.push("A snapshot needs a window with an id.");
  if (!Array.isArray(x.sources) || x.sources.length === 0) problems.push("A snapshot names its sources.");
  if (!Array.isArray(x.legends)) problems.push("legends must be a list.");
  else
    x.legends.forEach((l, i) => {
      if (!isObj(l) || typeof l.legendCardId !== "string") problems.push(`legends[${i}] needs a legendCardId.`);
      else if ((l.wins !== null && !count(l.wins)) || (l.losses !== null && !count(l.losses))) {
        problems.push(`legends[${i}] has a count that is not a whole number.`);
      }
    });
  if (!Array.isArray(x.pairings)) problems.push("pairings must be a list.");
  else
    x.pairings.forEach((p, i) => {
      if (!isObj(p) || typeof p.a !== "string" || typeof p.b !== "string" || !count(p.wins) || !count(p.losses)) {
        problems.push(`pairings[${i}] needs a, b, wins and losses.`);
      }
    });
  return problems;
}
