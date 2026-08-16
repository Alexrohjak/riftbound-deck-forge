import { SYMPTOMS, type Symptom } from "../advice/feedback.js";

/**
 * Games you actually played, and what the record is allowed to claim about them.
 *
 * The engine's job here is **restraint**. Counting wins is trivial; the hard part is
 * refusing to turn four games into a percentage, because a win rate is the single most
 * inviting way to launder a small sample into something that looks like knowledge
 * (D-016, D-022). Every threshold below exists to stop that.
 */

export type MatchResult = "WIN" | "LOSS" | "DRAW";

/**
 * How many people were at the table, and on whose side (D-066).
 *
 * ⚠️ **Not a player count — a shape.** `2v2` and a four-player free-for-all both seat four
 * people and are not the same game, so counting heads would lose the distinction that
 * matters. Only the three shapes actually played are listed; a fourth is a one-line addition
 * here plus a `CHECK` in the schema, and until someone plays one it would be a guess.
 */
export const MATCH_FORMATS = ["1v1", "1v1v1", "2v2"] as const;
export type MatchFormat = (typeof MATCH_FORMATS)[number];

/**
 * What a record with no format means. Heads-up, because it is what the log assumed for its
 * whole existence before this field — reading old rows as anything else would invent a fact
 * about games nobody recorded a format for.
 */
export const DEFAULT_FORMAT: MatchFormat = "1v1";

/**
 * The share of games a seat wins **by chance alone**, if every seat were equal.
 *
 * This exists because 33% in a three-way pod and 33% heads-up are opposite readings — the
 * first is par, the second is a deck that does not work — and a rate shown without it invites
 * exactly that mistake. It is arithmetic over seats, not doctrine: no source is being cited
 * and none is needed.
 *
 * ⚠️ It assumes seats are symmetric, which in a free-for-all they are not — politics is real
 * and Forge cannot see it. Par is a reference point, never a target to beat.
 */
export const BASELINE: Record<MatchFormat, number> = {
  "1v1": 1 / 2,
  "1v1v1": 1 / 3,
  "2v2": 1 / 2,
};

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
  /** The shape of the table. Absent means `1v1` — see {@link DEFAULT_FORMAT}. */
  format?: MatchFormat | null;
  /**
   * Their Legend's `card_id`. **Null is a real answer** — you do not always know.
   *
   * ⚠️ Singular, and it stays singular. In a format with more than one opponent it names at
   * most the one you consider the matchup; `read()` refuses to build a matchup record out of
   * it there, because losing a three-way pod is not losing to whoever you wrote down.
   */
  opponentLegend?: string | null;
  opponentNote?: string | null;
  result: MatchResult;
  /**
   * `"2-1"` when a match was several games; null when it was one.
   *
   * ⚠️ **Yours first**, and it must agree with `result` — see `validate()`. The first two
   * games ever logged were entered as `1-0` and `0-1` meaning *won* and *lost*, while
   * `result` sat on its pre-selected default, and the record read 2-0.
   */
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

const stand = (
  matches: readonly MatchRecord[],
  min: number,
  unit: [one: string, many: string],
): Standing => {
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
          : `${played} ${played === 1 ? unit[0] : unit[1]} is too few to read — a rate needs ${min}.`,
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
  /**
   * Which format this reading is **about**. Every number below covers only games played in
   * it — see `read()` for why a reading that mixes formats is a reading of nothing.
   */
  format: MatchFormat;
  /** What a seat wins by chance in this format. Context for `overall.rate`, never a target. */
  baseline: number;
  overall: Standing;
  /**
   * Games in the *other* formats, so their absence is visible rather than silent. A record
   * that shows "nothing logged" while three games sit in another bucket is the one failure
   * this field exists to prevent.
   */
  elsewhere: Array<{ format: MatchFormat; played: number }>;
  /**
   * Sorted by games played — the matchups you have actually tested come first.
   *
   * ⚠️ **Empty except in `1v1`.** A matchup is a claim about two decks meeting; with a third
   * player at the table the result is not attributable to any one of them.
   */
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

/**
 * Turn a `card_id` into something a person recognises.
 *
 * ⚠️ The engine does not know card names and must not start — card data is Riot's and is
 * never authored here (D-034). The caller already holds the index, so it passes a resolver;
 * without one the notes fall back to the id, which is ugly but never wrong.
 */
export type NameOf = (cardId: string) => string | undefined;

const human = (symptom: Symptom) => symptom.replace(/-/g, " ");

/** The format a record counts as, resolving the absent case once so nothing else has to. */
export const formatOf = (m: MatchRecord): MatchFormat => m.format ?? DEFAULT_FORMAT;

/**
 * Read the record — **for one format at a time** (D-066).
 *
 * ⚠️ **Formats are never pooled, and this is the whole point of the parameter.** A win rate
 * over mixed formats is a rate of nothing: heads-up you are beating one deck, in a pod you
 * are beating two, and 2v2 is not even your deck alone. Averaging them produces a number
 * that describes no game that was played. Every threshold in this file exists to stop a
 * small sample from looking like knowledge, and silently merging formats would smuggle the
 * same error back in through a bigger `n`.
 *
 * Games in other formats are reported in `elsewhere` rather than dropped — the one way this
 * could mislead is by showing an empty record while games sit in a bucket nobody asked for.
 */
export function read(
  matches: readonly MatchRecord[],
  nameOf?: NameOf,
  format: MatchFormat = DEFAULT_FORMAT,
): LogReading {
  const here = matches.filter((m) => formatOf(m) === format);
  const overall = stand(here, MIN_FOR_RATE, ["match", "matches"]);

  const elsewhere = MATCH_FORMATS.filter((f) => f !== format)
    .map((f) => ({ format: f, played: matches.filter((m) => formatOf(m) === f).length }))
    .filter((f) => f.played > 0);

  const matchups: Matchup[] =
    // Only heads-up. With two opponents "you lost to X" is not a fact the record holds, and
    // grouping by whichever Legend got typed in would manufacture one.
    format !== "1v1"
      ? []
      : [...groupBy(here, (m) => m.opponentLegend ?? null)]
          .map(([legendCardId, ms]) => ({
            legendCardId,
            standing: stand(ms, MIN_FOR_MATCHUP, ["game", "games"]),
          }))
          // Games where you did not note the Legend sort last however many there are:
          // "opponent unknown" is a gap in the record, not the matchup you tested most.
          .sort(
            (a, b) =>
              Number(a.legendCardId === null) - Number(b.legendCardId === null) ||
              b.standing.played - a.standing.played,
          );

  const versions = [...groupBy(here, (m) => m.deckHash ?? "")]
    .filter(([hash]) => hash !== "")
    .map(([hash, ms]) => ({ hash, standing: stand(ms, MIN_FOR_MATCHUP, ["game", "games"]) }))
    .sort((a, b) => b.standing.played - a.standing.played);

  // ── patterns in losses ──────────────────────────────────────────────────────
  const lost = here.filter((m) => m.result === "LOSS");
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
      `${worst.losses} of your ${lost.length} losses were "${human(worst.symptom)}" — ${pct(worst.share)}. ` +
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
      `${hardest.standing.wins}-${hardest.standing.losses} against ` +
        `${nameOf?.(hardest.legendCardId!) ?? hardest.legendCardId}. ` +
        `A matchup this one-sided is usually answered in the sideboard, not the 40.`,
    );
  }

  if (notes.length === 0) {
    // The withheld reason already states the count, so prefixing it with the count again
    // reads like a stutter.
    //
    // ⚠️ The empty case has to name the other formats. "Nothing logged yet" while four games
    // sit in another bucket is the single most misleading sentence this file could produce —
    // it reads as "you have not played", when what happened is that you played something
    // this reading is deliberately not about.
    const away = elsewhere.reduce((n, f) => n + f.played, 0);
    notes.push(
      overall.played === 0
        ? away === 0
          ? "Nothing logged yet."
          : `Nothing logged in ${format} — but ${away} ${away === 1 ? "game" : "games"} in ` +
            `${elsewhere.map((f) => f.format).join(" and ")}. Formats are read separately, ` +
            `because a rate that mixes them is a rate of no game you played.`
        : (overall.withheld ?? "Nothing stands out yet — keep playing."),
    );
  }

  return {
    format,
    baseline: BASELINE[format],
    overall,
    elsewhere,
    matchups,
    versions,
    recurring,
    notes: notes.slice(0, NOTE_BUDGET),
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GAMES = /^\d{1,2}-\d{1,2}$/;

/**
 * Bounds on free text. Not security — this is a single-user log behind Access — but an
 * unbounded field is an unbounded row, and every row here ends up in the nightly backup
 * that gets committed to a git repository (D-051).
 */
const LIMITS = {
  notes: 2000,
  opponentNote: 200,
  deckName: 120,
  deckHash: 64,
  // Bounded too: these are equally free-form, land on the same row, and reach the same
  // backup. Omitting them left the stated invariant false rather than merely incomplete.
  deckId: 64,
  opponentLegend: 64,
} as const;

/**
 * What is wrong with a record, in the order a person would notice it. Empty means valid.
 *
 * ⚠️ Validation happens here rather than in the API so both consumers get it, and so a
 * malformed record is rejected before it reaches storage — a log with junk in it is worse
 * than no log, because you go on trusting it.
 */
export function validate(m: MatchRecord, notAfter?: string): string[] {
  const problems: string[] = [];
  if (!m.id || !/^[A-Za-z0-9_-]{1,64}$/.test(m.id)) {
    problems.push("id must be 1-64 characters of [A-Za-z0-9_-].");
  }
  if (m.result !== "WIN" && m.result !== "LOSS" && m.result !== "DRAW") {
    problems.push("result must be WIN, LOSS or DRAW.");
  }
  if (!ISO_DATE.test(m.playedAt ?? "")) {
    problems.push("playedAt must be a YYYY-MM-DD date.");
  } else if (notAfter && m.playedAt > notAfter) {
    // A typo'd year silently sorts to the end of the log forever.
    //
    // ⚠️ `notAfter` is a *tolerant* boundary, not "today". The client sends its **local**
    // date and a server computes UTC, so at UTC+8 a match logged at 01:00 local is still
    // "yesterday" in UTC and a strict comparison rejects it — which it did, between
    // midnight and 08:00, for exactly the person this was built for. The caller passes
    // tomorrow-in-UTC: wide enough for any real timezone, still narrow enough to catch
    // the typo this check exists for.
    problems.push(`playedAt ${m.playedAt} is in the future.`);
  }
  if (m.games != null && m.games !== "" && !GAMES.test(m.games)) {
    problems.push('games must look like "2-1".');
  } else if (m.games != null && m.games !== "" && GAMES.test(m.games)) {
    /**
     * ⚠️ **A row must not contradict itself.** `games: "0-1"` with `result: "WIN"` is not a
     * near-miss to be tolerated — it is two different claims about the same game, and the
     * record has no way to know which one you meant.
     *
     * This is not hypothetical. The first two games ever logged went in as `1-0` and `0-1`
     * — the score field used to mean *won* and *lost* — while `result` sat on the value the
     * form had pre-selected. The log read **2-0** for an evening that went 1-1, and nothing
     * anywhere objected. The interface that made it easy has been fixed too, but a form is
     * one of two writers here (D-047) and the CLI would have accepted it just as happily.
     */
    const [mine, theirs] = m.games.split("-").map(Number) as [number, number];
    const implied: MatchResult = mine > theirs ? "WIN" : mine < theirs ? "LOSS" : "DRAW";
    if (implied !== m.result) {
      problems.push(
        `games "${m.games}" says ${implied}, but result is ${m.result}. Your score goes first.`,
      );
    }
  }
  // Null and absent are both fine and both mean 1v1; a *wrong* value is not, because it
  // would land in a bucket no reading ever asks for and the games would silently vanish.
  if (m.format != null && !(MATCH_FORMATS as readonly string[]).includes(m.format)) {
    problems.push(`format must be one of ${MATCH_FORMATS.join(", ")}.`);
  }
  // A non-array here used to throw out of `for...of` and surface as a 500 rather than a
  // 400 — a malformed request crashing the endpoint instead of being told off.
  if (m.symptoms != null && !Array.isArray(m.symptoms)) {
    problems.push("symptoms must be an array.");
  } else {
    for (const s of m.symptoms ?? []) {
      if (!(SYMPTOMS as readonly string[]).includes(s)) problems.push(`Unknown symptom "${s}".`);
    }
  }

  for (const [field, max] of Object.entries(LIMITS)) {
    const value = m[field as keyof typeof LIMITS];
    if (typeof value === "string" && value.length > max) {
      problems.push(`${field} is longer than ${max} characters.`);
    }
  }

  return problems;
}
