import type { Symptom } from "../advice/feedback.js";

/**
 * Games you actually played, and what the record is allowed to claim about them.
 *
 * The engine's job here is **restraint**. Counting wins is trivial; the hard part is
 * refusing to turn four games into a percentage, because a win rate is the single most
 * inviting way to launder a small sample into something that looks like knowledge
 * (D-016, D-022). Every threshold below exists to stop that.
 */

export type MatchResult = "WIN" | "LOSS" | "DRAW";

export interface MatchRecord {
  id: string;
  /** No foreign key by design — a match outlives the deck it was played with (LOG §2). */
  deckId?: string | null;
  /** The name the deck had **when you played it**. Refreshing this would be the bug. */
  deckName?: string | null;
  /** Which build. Joins to `deck_history.hash`. */
  deckHash?: string | null;
  /** `YYYY-MM-DD`. The date played, not the date typed in. */
  playedAt: string;
  /** Their Legend's `card_id`. **Null is a real answer** — you do not always know. */
  opponentLegend?: string | null;
  opponentNote?: string | null;
  result: MatchResult;
  /** `"2-1"` when a match was several games; null when it was one. */
  games?: string | null;
  /** EE symptom codes — the link that makes losses aggregate into a build problem. */
  symptoms?: readonly Symptom[];
  notes?: string | null;
}

/**
 * ⚠️ The thresholds. These are the feature.
 *
 * At n=3 the gap between 33% and 67% is one game, so a rate there describes the dice rather
 * than the deck. 10 is not a magic number — it is the point where the interval is narrow
 * enough that the figure is worth reading at all, and it is stated here so it can be argued
 * with rather than discovered by surprise.
 */
export const MIN_FOR_RATE = 10;
/** Per-matchup, against one Legend. Lower, because the question is narrower. */
export const MIN_FOR_MATCHUP = 5;
/** Before any claim about a *pattern* in losses. */
export const MIN_LOSSES_FOR_PATTERN = 4;

export interface Standing {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  /** ⚠️ `null` below the threshold. Not zero, not a guess — absent. */
  rate: number | null;
  /** Present exactly when `rate` is null, so the interface can say why. */
  withheld?: string;
}

const stand = (matches: readonly MatchRecord[], min: number, unit: string): Standing => {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const m of matches) {
    if (m.result === "WIN") wins += 1;
    else if (m.result === "LOSS") losses += 1;
    else draws += 1;
  }
  const played = matches.length;
  // Draws are excluded from the denominator rather than counted as half. Half a win is a
  // convention, not a fact, and inventing one here would put a made-up number in a record.
  const decisive = wins + losses;
  if (played < min || decisive === 0) {
    return {
      played,
      wins,
      losses,
      draws,
      rate: null,
      withheld:
        decisive === 0
          ? "No decisive games yet."
          : `${played} ${unit} is too few to read — a rate needs ${min}.`,
    };
  }
  return { played, wins, losses, draws, rate: wins / decisive };
};

export interface Matchup {
  /** `null` means you did not record their Legend, which is its own useful bucket. */
  legendCardId: string | null;
  standing: Standing;
}

export interface Pattern {
  symptom: Symptom;
  losses: number;
  /** Share of *losses*, not of matches. Losing to something is the question. */
  share: number;
}

export interface LogReading {
  overall: Standing;
  /** Sorted by games played — the matchups you have actually tested come first. */
  matchups: Matchup[];
  /** Per build, so "which version went 4-1" is answerable. */
  versions: Array<{ hash: string; standing: Standing }>;
  recurring: Pattern[];
  /**
   * A handful of statements worth reading, not a table (D-039). Capped deliberately —
   * a log that says nine things says nothing.
   */
  notes: string[];
}

const groupBy = <T>(items: readonly MatchRecord[], key: (m: MatchRecord) => T) => {
  const out = new Map<T, MatchRecord[]>();
  for (const m of items) {
    const k = key(m);
    const bucket = out.get(k);
    if (bucket) bucket.push(m);
    else out.set(k, [m]);
  }
  return out;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** How many statements a reading is allowed to make. Three, and they must earn it. */
const NOTE_BUDGET = 3;

export function read(matches: readonly MatchRecord[]): LogReading {
  const overall = stand(matches, MIN_FOR_RATE, "matches");

  const matchups: Matchup[] = [...groupBy(matches, (m) => m.opponentLegend ?? null)]
    .map(([legendCardId, ms]) => ({
      legendCardId,
      standing: stand(ms, MIN_FOR_MATCHUP, "games"),
    }))
    .sort((a, b) => b.standing.played - a.standing.played);

  const versions = [...groupBy(matches, (m) => m.deckHash ?? "")]
    .filter(([hash]) => hash !== "")
    .map(([hash, ms]) => ({ hash, standing: stand(ms, MIN_FOR_MATCHUP, "games") }))
    .sort((a, b) => b.standing.played - a.standing.played);

  // ── patterns in losses ──────────────────────────────────────────────────────
  const lost = matches.filter((m) => m.result === "LOSS");
  const counts = new Map<Symptom, number>();
  for (const m of lost) {
    // A match names each symptom once however many times you felt it.
    for (const s of new Set(m.symptoms ?? [])) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const recurring: Pattern[] =
    lost.length >= MIN_LOSSES_FOR_PATTERN
      ? [...counts]
          .map(([symptom, n]) => ({ symptom, losses: n, share: n / lost.length }))
          // Three occurrences and a third of your losses. Below that it is a bad night.
          .filter((p) => p.losses >= 3 && p.share >= 1 / 3)
          .sort((a, b) => b.losses - a.losses)
      : [];

  const notes: string[] = [];

  const worst = recurring[0];
  if (worst) {
    notes.push(
      `${worst.losses} of your ${lost.length} losses were "${worst.symptom}" — ${pct(worst.share)}. ` +
        `That is a build problem rather than variance, and one game could never have shown it.`,
    );
  }

  // Only compare builds when both have been played enough to be worth comparing.
  const rated = versions.filter((v) => v.standing.rate !== null);
  if (rated.length >= 2) {
    const best = rated[0]!;
    const worstV = rated[rated.length - 1]!;
    const gap = (best.standing.rate ?? 0) - (worstV.standing.rate ?? 0);
    if (gap >= 0.2) {
      notes.push(
        `Your best build (${best.hash.slice(0, 7)}) is ${pct(best.standing.rate ?? 0)} over ` +
          `${best.standing.played}; the weakest is ${pct(worstV.standing.rate ?? 0)}. ` +
          `Worth reading the diff before tuning further.`,
      );
    }
  }

  const hardest = matchups
    .filter((m) => m.standing.rate !== null && m.legendCardId !== null)
    .sort((a, b) => (a.standing.rate ?? 0) - (b.standing.rate ?? 0))[0];
  if (hardest && (hardest.standing.rate ?? 1) <= 0.34) {
    notes.push(
      `${hardest.standing.wins}-${hardest.standing.losses} against ${hardest.legendCardId}. ` +
        `A matchup this one-sided is usually answered in the sideboard, not the 40.`,
    );
  }

  if (notes.length === 0) {
    notes.push(
      overall.played === 0
        ? "Nothing logged yet."
        : `${overall.played} logged. ${overall.withheld ?? "Nothing stands out yet — keep playing."}`,
    );
  }

  return { overall, matchups, versions, recurring, notes: notes.slice(0, NOTE_BUDGET) };
}

/** Symptom codes the engine knows. Kept in step with `advice/feedback.ts`. */
const SYMPTOMS: readonly string[] = [
  "run-over-early",
  "cannot-hold",
  "cannot-remove",
  "clunky-draws",
  "out-of-gas",
  "too-slow",
  "threats-die",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GAMES = /^\d{1,2}-\d{1,2}$/;

/**
 * What is wrong with a record, in the order a person would notice it. Empty means valid.
 *
 * ⚠️ Validation happens here rather than in the API so both consumers get it, and so a
 * malformed record is rejected before it reaches storage — a log with junk in it is worse
 * than no log, because you go on trusting it.
 */
export function validate(m: MatchRecord, today?: string): string[] {
  const problems: string[] = [];
  if (!m.id || !/^[A-Za-z0-9_-]{1,64}$/.test(m.id)) {
    problems.push("id must be 1-64 characters of [A-Za-z0-9_-].");
  }
  if (m.result !== "WIN" && m.result !== "LOSS" && m.result !== "DRAW") {
    problems.push("result must be WIN, LOSS or DRAW.");
  }
  if (!ISO_DATE.test(m.playedAt ?? "")) {
    problems.push("playedAt must be a YYYY-MM-DD date.");
  } else if (today && m.playedAt > today) {
    // A typo'd year silently sorts to the end of the log forever.
    problems.push(`playedAt ${m.playedAt} is in the future.`);
  }
  if (m.games != null && m.games !== "" && !GAMES.test(m.games)) {
    problems.push('games must look like "2-1".');
  }
  for (const s of m.symptoms ?? []) {
    if (!SYMPTOMS.includes(s)) problems.push(`Unknown symptom "${s}".`);
  }
  return problems;
}
