import type { CardFacts, CardIndex, Deck } from "../types.js";
import { countedEntries } from "../legality/entries.js";
import { capabilities } from "./doctrine.js";
import { deckShape } from "./shape.js";

/**
 * *"I played into Diana and lost because I couldn't hold battlefields."*
 *
 * The most useful thing a deck can be told is what went wrong in a real game, and the worst
 * possible response is a list of card swaps. **A complaint is evidence about a capability,
 * not about a card.** "I couldn't hold" is a board-presence problem; answering it with three
 * removal spells would be answering a different question confidently.
 *
 * ⚠️ **The engine does not read English.** It is pure (D-047) and stays that way. What it
 * owns is the taxonomy — the symptoms worth distinguishing, what each implies about the
 * deck, and how to find cards that would address it. Turning a sentence into a symptom is
 * Claude Code's job, which is exactly the split D-043 chose: a rules engine with a swappable
 * mouth. `match()` exists so the CLI is usable alone, not as a pretence at understanding.
 */

export type Symptom =
  | "run-over-early"
  | "cannot-hold"
  | "cannot-remove"
  | "clunky-draws"
  | "out-of-gas"
  | "too-slow"
  | "threats-die";

export interface Diagnosis {
  symptom: Symptom;
  /** What the complaint is actually about, in the deck's terms. */
  reading: string;
  /** What the deck currently has, so the reader can disagree with the diagnosis. */
  evidence: string;
  /** The lever. One capability, not a shopping list. */
  lever: string;
  /** ⚠️ Always stated. Every fix costs something, and hiding that is how decks get worse. */
  cost: string;
  /** `produces` tags that would address it. */
  wants: readonly string[];
  /** Cost band that would help, if the fix is curve-shaped rather than capability-shaped. */
  band?: readonly [number, number];
}

/** The taxonomy. Each entry is doctrine, and each says what it would cost you. */
const DIAGNOSES: Record<Symptom, Omit<Diagnosis, "symptom" | "evidence">> = {
  "run-over-early": {
    reading: "You lost the early board and never got it back.",
    lever: "Cheap bodies and cheap interaction — things you can play on turns one and two.",
    cost: "Slots come out of your mid-game. A deck that never loses early can still lose late.",
    wants: ["kill", "damage", "shrink", "stun"],
    band: [1, 2],
  },
  "cannot-hold": {
    reading:
      "A holding problem, not a removal problem. You win battlefields with bodies that survive.",
    lever:
      "More units, or units that are harder to shift — and pump effects that let a defender win the fight it is already in.",
    cost:
      "Units are less flexible than spells. A unit-heavy deck plays more predictably and is worse against sweepers.",
    wants: ["pump", "ready", "buff"],
  },
  "cannot-remove": {
    reading: "Something resolved that you had no answer to.",
    lever: "Removal — and the kind matters: damage trades badly into high Might, kill effects do not.",
    cost:
      "Removal is reactive. Every slot spent on an answer is a slot not spent on a threat, and a hand of answers loses to a board you were already behind on.",
    wants: ["kill", "damage", "banish"],
  },
  "clunky-draws": {
    reading:
      "Your hands did not function — usually a curve problem or a synergy whose enabler you did not draw.",
    lever: "Smooth the curve, or cut the half of a two-card combination you draw without the other.",
    cost: "Smoothing usually means cutting your most powerful cards, which is what makes it hard.",
    wants: ["draw"],
  },
  "out-of-gas": {
    reading: "You ran out of cards before your opponent ran out of answers.",
    lever: "Card draw, or threats that replace themselves when they die.",
    cost:
      "Draw is not free — it costs tempo in the turn you spend it, which is exactly the turn an aggressive deck is punishing you.",
    wants: ["draw"],
  },
  "too-slow": {
    reading: "Your opponent's plan finished first.",
    lever:
      "Lower the curve, or add pressure that forces them to answer you instead of executing.",
    cost: "Going faster means giving up the late game you were presumably built to reach.",
    wants: ["pump", "move", "ready"],
    band: [1, 3],
  },
  "threats-die": {
    reading: "Your important units kept dying before they did anything.",
    lever: "Protection, or redundancy — several copies of the threat rather than one precious one.",
    cost:
      "Protection is a dead card when they have no removal. Redundancy costs the slot variety would have used.",
    wants: ["pump", "ready", "move"],
  },
};

/**
 * The taxonomy, in the order a form should offer it — roughly early game to late.
 *
 * ⚠️ **Single-sourced deliberately.** `log/match.ts` validates recorded symptoms against
 * this, and the deck-log form renders from it. A second copy is how a symptom gets added
 * here and silently rejected by validation there.
 */
export const SYMPTOMS = [
  "run-over-early",
  "cannot-hold",
  "cannot-remove",
  "threats-die",
  "clunky-draws",
  "out-of-gas",
  "too-slow",
] as const satisfies readonly Symptom[];

/** What a symptom means, for a caller that has no deck to diagnose against. */
export const symptomReading = (symptom: Symptom): string => DIAGNOSES[symptom].reading;

/** Words that point at a symptom. **Not** language understanding — a convenience. */
const HINTS: Array<[Symptom, RegExp]> = [
  ["run-over-early", /\b(early|turn one|turn 1|turn two|fast start|rushed|aggro)\b/i],
  ["cannot-hold", /\b(hold|holding|contest|battlefield|board|presence|conquer)\b/i],
  ["cannot-remove", /\b(remove|removal|answer|kill|deal with|couldn'?t stop)\b/i],
  ["clunky-draws", /\b(clunky|awkward|hand|hands|mulligan|curve|dead card)\b/i],
  ["out-of-gas", /\b(gas|ran out|topdeck|top deck|empty|no cards|outvalued)\b/i],
  ["too-slow", /\b(slow|too late|beat me to|raced)\b/i],
  ["threats-die", /\b(died|dying|killed|removed|traded off|fragile)\b/i],
];

/**
 * A crude keyword pass, for the CLI. Returns every symptom the words touch, because a
 * sentence usually names more than one and picking arbitrarily would be worse than saying so.
 */
export function match(note: string): Symptom[] {
  return HINTS.filter(([, re]) => re.test(note)).map(([s]) => s);
}

/** Read the deck against a symptom, so the diagnosis is about *this* deck. */
export function diagnose(deck: Deck, cards: CardIndex, symptom: Symptom): Diagnosis {
  const base = DIAGNOSES[symptom];
  const shape = deckShape(deck, cards);
  const caps = capabilities(deck, cards);

  const evidence = ((): string => {
    switch (symptom) {
      case "run-over-early":
      case "too-slow":
        return `${shape.earlyPlays} cards playable on turn one (${Math.round(shape.earlyPlayOdds * 100)}% to open one).`;
      case "cannot-hold":
        return `${shape.units} units in ${shape.size} Main Deck cards.`;
      case "cannot-remove":
        return `${caps.removal} cards that remove something.`;
      case "out-of-gas":
        return `${caps.draw} cards that draw.`;
      case "threats-die":
        return `${caps.combatTricks} combat tricks to protect with.`;
      default: {
        const dangling = caps.danglingSynergies[0];
        return dangling
          ? `${dangling.wants} cards want ${dangling.needs.replace("_matters", "")}; ${dangling.supplies} supply it.`
          : `Curve: ${shape.curve.map((n, i) => `${i}:${n}`).join(" ")}.`;
      }
    }
  })();

  return { symptom, evidence, ...base };
}

/** A card from the legal pool, with the reason it is being offered. */
export interface Candidate {
  cardId: string;
  name: string;
  why: string;
}

export interface PoolCard {
  cardId: string;
  facts: CardFacts;
}

/**
 * Cards that would address the diagnosis — **from the pool the caller supplies**, so the
 * engine never needs to know where cards come from.
 *
 * ⚠️ Filtered to the deck's Domain Identity and the copy limit, because a suggestion you
 * cannot legally play is not a suggestion. Capped at a handful: D-039 forbids enumeration,
 * and forty candidates is a search result rather than advice.
 */
export function suggest(
  deck: Deck,
  cards: CardIndex,
  diagnosis: Diagnosis,
  pool: readonly PoolCard[],
  limit = 5,
): Candidate[] {
  const identity = cards.domainsOf?.(deck.legendCardId);
  const held = new Map<string, number>();
  for (const e of countedEntries(deck, cards)) held.set(e.name, (held.get(e.name) ?? 0) + e.quantity);

  const seen = new Set<string>();
  const scored: Array<{ c: Candidate; score: number }> = [];

  for (const { cardId, facts } of pool) {
    if (seen.has(facts.name)) continue;
    if (facts.banned) continue;
    if (facts.types?.some((t) => t === "legend" || t === "rune" || t === "battlefield")) continue;
    if (facts.superTypes?.includes("token")) continue;
    // Already at the limit, so offering it is offering nothing.
    if ((held.get(facts.name) ?? 0) >= 3) continue;
    // Illegal under this Legend — L9/L10.
    if (identity && !facts.domains?.every((d) => d === "colorless" || identity.includes(d))) continue;

    const produces = facts.produces ?? [];
    const matches = diagnosis.wants.filter((w) => produces.includes(w));
    if (matches.length === 0) continue;

    let score = matches.length;
    const energy = facts.energy;
    if (diagnosis.band && typeof energy === "number") {
      const [lo, hi] = diagnosis.band;
      if (energy < lo || energy > hi) continue; // wrong part of the curve to be useful
      score += 1;
    }

    seen.add(facts.name);
    scored.push({
      c: {
        cardId,
        name: facts.name,
        why: `${matches.join(" and ")}${typeof energy === "number" ? ` at ${energy} Energy` : ""}`,
      },
      score,
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
    .slice(0, limit)
    .map((s) => s.c);
}
