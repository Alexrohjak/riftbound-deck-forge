/**
 * **Q-THREAT — *"what should I fear, and how do I handle it?"*** ([`EVALUATION §6.5`](../../../../docs/spec/EVALUATION.md))
 *
 * ⚠️ **This runs the opposite way to `counter`, and confusing the two is the error.**
 * `counterCounsel` starts from *their* Legend and asks what beats it. This starts from **your
 * deck** and asks what beats *you*. They share no input and no output shape, which is why they
 * are separate functions rather than one with a flag — the same reasoning that keeps
 * `theirEngine` and `theirPatterns` apart inside `counter`.
 *
 * ## What it may claim, and what it may not
 *
 * ⚠️ **What an opponent *can* do, never what they *will*.** There is no meta data in this
 * project and there will not be ([D-035](../../../../docs/DECISIONS.md#d-035)), so the
 * denominator here is *the legal pool*, not a field. A sentence like *"most decks run this"*
 * cannot be grounded and is not produced.
 *
 * ⚠️ **No combat is simulated.** `S1a` does not exist, so this never claims a fight's outcome.
 * Every figure below is a **count over printed statistics** — how many of your bodies sit at or
 * below a damage number, how many units in the format sit above your removal's ceiling. Those
 * are arithmetic, not adjudication, and the distinction is what keeps Q-LINE honestly refused
 * while this ships.
 *
 * ⚠️ **Rule-warping threats are reported as unmodelled, not omitted.** 21 cards rewrite rules
 * an engine would hardcode; nothing here sees them. Saying so is the finding.
 */
import type { CardIndex, Deck } from "../types.js";
import { countedEntries } from "../legality/entries.js";
import type { PoolCard } from "./feedback.js";
import { ANSWERS } from "./counsel.js";
import { patternCensus, PATTERNS, type StrategicPattern } from "./patterns.js";

/**
 * The pressure classes from `EVALUATION §6.5`.
 *
 * They are not severities in disguise — they say *why* a thing is hard to deal with, which is
 * what decides the lever. A `must-answer` threat wants an answer in the deck; an
 * `answer-asymmetric` one wants you to stop trying to answer it.
 */
export type ThreatClass = "must-answer" | "board-dominant" | "answer-asymmetric" | "rule-warping";

export interface Threat {
  class: ThreatClass;
  /** One sentence, and the numbers in it are counted. */
  claim: string;
  /** The lever — what you actually do about it. Opinion, and labelled as such by the caller. */
  lever: string;
  /**
   * ⚠️ **Every number in `claim`, with where it came from.** Assembled here rather than by the
   * mouth, so a grounding line cannot be authored ([D-045](../../../../docs/DECISIONS.md#d-045)).
   */
  grounding: string[];
}

export interface ThreatRead {
  deck: { id: string; name: string; bodies: number };
  threats: Threat[];
  /**
   * ⚠️ **What this read cannot see.** Non-empty always — there is no rules core — and a caller
   * that omits it is overclaiming the rest.
   */
  unmodelled: string[];
}

/** Sweep sizes worth reporting. Beyond 5 a symmetric sweep is rare enough to be a bomb. */
const SWEEP_SIZES = [1, 2, 3, 4, 5] as const;

/**
 * The largest "deal N damage" a card's text prints.
 *
 * ⚠️ **Printed, not effective.** A pump that raises Might is not counted, and neither is a
 * kill effect with no number — those are handled by `spot-removal` as a *pattern* rather than
 * as a ceiling. Understating the ceiling is the safe direction: it produces a threat claim
 * that is too cautious rather than one that is too confident.
 */
function damagePrinted(text: string | undefined): number {
  if (!text) return 0;
  let most = 0;
  for (const match of text.matchAll(/deal (\d+) damage/gi)) {
    const raw = match[1];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > most) most = n;
  }
  return most;
}

/**
 * `a`, `a and b`, `a, b and c`.
 *
 * Prose, not decoration: a claim that reads as a list of three joined by *"and"* three times
 * looks generated, and a reader who notices the seam stops trusting the number in front of it.
 */
function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const isUnit = (types: readonly string[] | undefined): boolean => (types ?? []).includes("unit");

const isMainDeckCard = (types: readonly string[] | undefined): boolean =>
  !(types ?? []).some((t) => ["legend", "rune", "battlefield", "token"].includes(t));

/**
 * What beats this deck.
 *
 * `pool` is the whole legal card pool — the denominator for *"how much of the format does this
 * lose to"*. Pass it and the board-dominance read runs; omit it and that threat is skipped
 * rather than guessed.
 */
export function readThreats(deck: Deck, cards: CardIndex, pool: readonly PoolCard[] = []): ThreatRead {
  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");
  const threats: Threat[] = [];
  const alsoUnmodelled: string[] = [];

  // Computed up front because two reads need it: the blind-spot read below, and the removal
  // ceiling — which must know whether numberless removal exists before it calls a deck helpless.
  const census = patternCensus(deck, cards);
  const held = new Set(census.map((c) => c.pattern));

  // ── sweeps, against your own Might distribution ─────────────────────────────
  //
  // The spec's own worked example: "14 of your 40 cards are Might ≤3; a single Deal 3-to-all
  // wipes your board."
  const bodies = main.filter((e) => isUnit(e.facts?.types));
  const bodyCount = bodies.reduce((n, e) => n + e.quantity, 0);
  if (bodyCount > 0) {
    let worst = { size: 0, dead: 0 };
    for (const size of SWEEP_SIZES) {
      const dead = bodies
        .filter((e) => typeof e.facts?.might === "number" && (e.facts.might ?? 0) <= size)
        .reduce((n, e) => n + e.quantity, 0);
      // The smallest sweep that already takes half the bodies is the one worth naming —
      // a Deal 5 killing everything is true of most decks and tells you nothing.
      if (dead * 2 >= bodyCount) {
        worst = { size, dead };
        break;
      }
    }
    if (worst.size > 0) {
      threats.push({
        class: "must-answer",
        claim: `A single "deal ${worst.size} to all" clears ${worst.dead} of your ${bodyCount} bodies.`,
        lever:
          `Do not over-commit once you are ahead on points — hold back enough that a sweep ` +
          `costs you the board but not the game.`,
        grounding: [
          `${worst.dead} of ${bodyCount} Main Deck units have Might ≤ ${worst.size}`,
          `Counted from printed Might; units with no Might data are excluded rather than assumed small`,
        ],
      });
    }
  }

  // ── what your removal cannot kill ───────────────────────────────────────────
  //
  // ⚠️ **A ceiling of zero is not a measurement.** `damagePrinted` only sees a printed number, so
  // a deck whose removal reads *"kill target unit"* scores 0 and every unit in the format sits
  // "above" it — which produced a real false alarm: *"623 of the format's 626 units cannot be
  // removed"*, said of a deck that could remove things. At a ceiling of zero the only honest
  // claim is about **damage-based** removal, and only when the deck has no numberless removal
  // either. When it does, the ceiling is unmeasurable and that is reported as a blind spot
  // rather than dressed up as a finding.
  const ceiling = main.reduce((most, e) => Math.max(most, damagePrinted(e.facts?.text)), 0);
  const numberlessRemoval = held.has("spot-removal") || held.has("sweep");
  if (pool.length > 0 && !(ceiling === 0 && numberlessRemoval)) {
    const formatUnits = pool.filter(
      ({ facts }) => isMainDeckCard(facts.types) && facts.banned !== true && isUnit(facts.types),
    );
    const above = formatUnits.filter(({ facts }) => (facts.might ?? 0) > ceiling);
    if (formatUnits.length > 0 && above.length > 0) {
      const share = Math.round((above.length / formatUnits.length) * 100);
      threats.push({
        class: "board-dominant",
        claim:
          ceiling === 0
            ? `The deck prints no damage number anywhere, so damage-based removal is not a lever you have — and you carry no removal without one either.`
            : `Your removal tops out at ${ceiling} damage, and ${share}% of the format's units outclass it.`,
        lever:
          ceiling === 0
            ? `Every unit you cannot kill has to be gone around — take a different battlefield, or ` +
              `win the fight with a bigger body rather than with a spell.`
            : `You cannot remove those — you have to go around them to another battlefield, or win ` +
              `the fight with combat rather than with a spell.`,
        grounding:
          ceiling === 0
            ? [
                `No card in the Main Deck prints "deal N damage"`,
                `No card carries the spot-removal or sweep pattern either, so the absence is real rather than an artefact of counting numbers`,
                `${formatUnits.length} unbanned units in the pool`,
              ]
            : [
                `Highest printed "deal N damage" in the Main Deck: ${ceiling}`,
                `${above.length} of ${formatUnits.length} unbanned units in the pool have Might > ${ceiling}`,
                `⚠️ Counts printed damage only — kill effects with no number are not a ceiling and are excluded`,
              ],
      });
    }
  } else if (ceiling === 0 && numberlessRemoval) {
    alsoUnmodelled.push(
      "Your removal's ceiling — the deck removes things without printing a damage number, and " +
        "how big a unit a numberless effect can kill is a rules question (S1a), not a countable one. " +
        "No board-dominance claim is made rather than one made from a zero.",
    );
  }

  // ── what you structurally cannot answer ─────────────────────────────────────
  //
  // ⚠️ A blind spot is derived from the ANSWERS doctrine table, so it is a claim about what
  // this deck *cannot do*, grounded in a census of what it does. It is not a claim that the
  // opponent has the threat — nobody knows that, and §7 forbids guessing.
  const missing: { answer: StrategicPattern; threats: StrategicPattern[] }[] = [];
  for (const row of ANSWERS) {
    for (const answer of row.answers) {
      if (held.has(answer)) continue;
      const existing = missing.find((m) => m.answer === answer);
      if (existing) existing.threats.push(row.threat);
      else missing.push({ answer, threats: [row.threat] });
    }
  }
  // The blind spot that leaves the most threat classes unanswered is the one worth a sentence.
  missing.sort((a, b) => b.threats.length - a.threats.length);
  const worstGap = missing[0];
  if (worstGap) {
    const label = (p: StrategicPattern) => PATTERNS.find((s) => s.pattern === p)?.label ?? p;
    threats.push({
      class: "answer-asymmetric",
      claim: `You run no ${label(worstGap.answer)}, which is the published answer to ${list(worstGap.threats.map(label))}.`,
      lever:
        `Either accept those matchups and race them, or find room for two or three — the ` +
        `doctrine says this is the answer, not that you must carry one.`,
      grounding: [
        `${label(worstGap.answer)}: 0 cards in the Main Deck`,
        `Answer relationship from the ANSWERS table in advice/counsel — doctrine, and contested`,
      ],
    });
  }

  return {
    deck: { id: deck.id, name: deck.name, bodies: bodyCount },
    threats,
    unmodelled: [
      "Rule-warping cards — 21 cards rewrite rules an engine would hardcode (Elder Dragon voids the lethal threshold, Dune Surfer voids [Tank]). Nothing here sees them; S1a is where they land.",
      "Combat outcomes — no rules core, so no fight is resolved. Every figure above is a count over printed statistics.",
      "What an opponent is actually playing — no meta data exists (D-035). The denominator is the legal pool.",
      ...alsoUnmodelled,
    ],
  };
}
