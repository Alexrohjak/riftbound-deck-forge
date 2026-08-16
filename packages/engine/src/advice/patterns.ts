import type { CardFacts, CardIndex, Deck } from "../types.js";
import { deckEntries } from "../legality/entries.js";
import { hasKeyword, withoutReminders } from "../text.js";

/**
 * **The pattern vocabulary** — EVALUATION §5.1.
 *
 * *"Patterns are the unit of communication."* EE says **"fragile to cheap Might swing"** and
 * offers two or three representative cards; it does not list the sixty-six that qualify. A
 * single combat can be flipped by 66 different cards, and saying so is true and useless
 * ([D-039](../../../docs/DECISIONS.md#d-039)).
 *
 * ⚠️ **Every name is earned, never asserted.** Each pattern below carries a computable
 * definition, and a card matches it or does not. That is what stops the vocabulary becoming
 * the vague archetype labels this project keeps deleting.
 *
 * ⚠️ **Annotations first, text second.** The pool carries `role`, `produces` and `consumes`
 * for every card — hand-classified, and far more reliable than reading English. Text is used
 * only where no annotation captures the distinction, and always conservatively: a pattern
 * missed is a smaller failure than a pattern claimed.
 */

export type StrategicPattern =
  | "cheap-might-swing"
  | "bounce"
  | "hard-counter"
  | "sweep"
  | "spot-removal"
  | "tempo-denial"
  | "evasion"
  | "recursion"
  | "bomb"
  | "ambush-threat"
  | "ramp"
  | "go-wide";

export interface PatternSpec {
  pattern: StrategicPattern;
  /** How EE refers to it in a sentence. */
  label: string;
  /** The definition, in words, for the grounding line. */
  definition: string;
  matches: (facts: CardFacts) => boolean;
}

const produces = (facts: CardFacts, ...what: string[]): boolean =>
  (facts.produces ?? []).some((p) => what.includes(p));

const roleIs = (facts: CardFacts, ...roles: string[]): boolean =>
  roles.includes(facts.role ?? "");

/** Total cost — Riftbound costs are Energy plus coloured Power, and both must be paid. */
const totalCost = (facts: CardFacts): number | null => {
  const energy = typeof facts.energy === "number" ? facts.energy : null;
  if (energy === null) return null;
  return energy + (typeof facts.power === "number" ? facts.power : 0);
};

/**
 * Kills gear and nothing else — **not** spot removal, whose definition is a single *unit*.
 *
 * ⚠️ 8 of 145 removal-annotated cards are gear-only, and one of them (Zaun Punk) kills a
 * *friendly* gear as a cost to play itself. `role: "removal-kill"` is the right annotation
 * for all of them and the wrong answer to the question this pattern asks — which is what
 * "the name is earned" has to mean in practice.
 */
const gearOnly = (facts: CardFacts): boolean => {
  const body = withoutReminders(facts.text);
  return (
    /\bkill a (friendly )?gear\b|\bdestroy a gear\b/i.test(body) &&
    !/\bkill a unit\b|\bto a unit\b|\bkill target unit\b/i.test(body)
  );
};

/** Hits *everything*, rather than one thing — the distinction between a sweep and removal. */
const isSweep = (facts: CardFacts): boolean =>
  produces(facts, "damage", "kill") &&
  /\ball (other )?units?\b|\beach (other )?unit\b/i.test(withoutReminders(facts.text));

export const PATTERNS: readonly PatternSpec[] = [
  {
    pattern: "cheap-might-swing",
    label: "cheap Might swing",
    definition: "playable in a showdown, costs 2 or less, and changes Might",
    // ⚠️ A card that leads with `[Hidden]` counts too: it is played later, in reaction, which
    // is exactly the combat-flipping shape this pattern is about — and those cards are
    // annotated `timing: "Action"`, so the timing field alone would miss them.
    matches: (f) =>
      (["Action", "Reaction"].includes(f.timing ?? "") || hasKeyword(f.text, "Hidden")) &&
      (totalCost(f) ?? 99) <= 2 &&
      produces(f, "pump", "shrink"),
  },
  {
    pattern: "bounce",
    label: "bounce",
    definition: "returns a unit from a battlefield to hand",
    matches: (f) => produces(f, "bounce"),
  },
  {
    pattern: "hard-counter",
    label: "hard counter",
    definition: "counters a spell or ability outright",
    matches: (f) => produces(f, "counter") || roleIs(f, "counter"),
  },
  {
    pattern: "sweep",
    label: "sweep",
    definition: "damages or kills every unit, not one",
    matches: isSweep,
  },
  {
    pattern: "spot-removal",
    label: "spot removal",
    definition: "kills or lethally damages a single unit",
    // A sweep is not spot removal: they answer different problems and pretending otherwise
    // would tell a deck it has answers to a single big threat when it only has a board wipe.
    matches: (f) =>
      !isSweep(f) &&
      !gearOnly(f) &&
      (produces(f, "kill") || roleIs(f, "removal-kill", "removal-damage", "body+removal")),
  },
  {
    pattern: "tempo-denial",
    label: "tempo denial",
    definition: "stuns, exhausts or otherwise takes a turn away",
    matches: (f) => produces(f, "stun") || roleIs(f, "tempo"),
  },
  {
    pattern: "evasion",
    label: "evasion",
    definition: "hard to target — Deflect, or protection",
    matches: (f) => hasKeyword(f.text, "Deflect"),
  },
  {
    pattern: "recursion",
    label: "recursion",
    definition: "replays cards from the trash",
    matches: (f) => produces(f, "trashplay"),
  },
  {
    pattern: "bomb",
    label: "bomb",
    definition: "costs 8 or more, and expects to dominate the board",
    matches: (f) => (totalCost(f) ?? 0) >= 8,
  },
  {
    pattern: "ambush-threat",
    label: "ambush threat",
    definition: "arrives without warning — played from hiding",
    // ⚠️ **The text, not the `timing` annotation** — and this was checked rather than assumed.
    // `timing: "Hidden"` is on 26 cards, five of which merely *reference* hiding: Noxus
    // Saboteur is a body whose text is about the opponent's hidden cards, and Ava Achiever
    // pays to play them. Meanwhile Stand United and Block genuinely lead with `[Hidden]` and
    // are annotated `timing: "Action"`. The annotation answers a different question from the
    // one this pattern asks.
    matches: (f) => hasKeyword(f.text, "Hidden"),
  },
  {
    pattern: "ramp",
    label: "ramp",
    definition: "adds resources beyond the two runes a turn gives you",
    matches: (f) => produces(f, "ramp_power", "ramp_energy", "rune") || roleIs(f, "body+ramp", "gear+ramp"),
  },
  {
    pattern: "go-wide",
    label: "go wide",
    definition: "makes more than one body from a single card",
    /**
     * ⚠️ **A Gold gear token is not a body**, and counting it as one was a real defect.
     *
     * The `token` tag does not say *what kind* of token, so **17 cards that play a Gold gear
     * token** — `Bushwhack`, `Plundering Poro`, `Blood Money`, `Deadly Flourish`… — were all
     * reported as go-wide. That inflated the pattern everywhere it is counted: `counter` and
     * `sideboard` recommend sweeps against decks that cannot actually go wide, and `threats`
     * names go-wide as a blind spot a deck may not have.
     *
     * Found by boarding a real deck: `sideboard` offered `Bushwhack` as the answer to a
     * tribal swarm, and its text is *"friendly units enter ready this turn, play a Gold gear
     * token"* — it makes no bodies at all.
     *
     * ⚠️ Keyed on the printed text rather than the tag, because the tag is the thing that is
     * wrong. A card naming a **unit** token still counts however much gear it also makes.
     */
    matches: (f) => {
      if (!(produces(f, "token") || roleIs(f, "token-maker", "body+tokens"))) return false;
      const text = withoutReminders(f.text);
      const gearOnly = /gear token/i.test(text) && !/unit token/i.test(text);
      return !gearOnly;
    },
  },
] as const;

const SPEC = new Map<StrategicPattern, PatternSpec>(PATTERNS.map((p) => [p.pattern, p]));

/** The patterns one card matches. A card commonly matches several — they are not exclusive. */
export function patternsOf(facts: CardFacts | undefined): StrategicPattern[] {
  if (!facts) return [];
  return PATTERNS.filter((spec) => spec.matches(facts)).map((spec) => spec.pattern);
}

export interface PatternCount {
  pattern: StrategicPattern;
  label: string;
  definition: string;
  /** Copies in the deck, so a 3-of counts three times — this is how often you draw it. */
  copies: number;
  /** Distinct cards, which is what makes it a capability rather than one card. */
  cards: number;
  /** Up to three, as the unit of communication (D-039) — not the whole list. */
  examples: string[];
}

/**
 * What this deck can **do**, in EE's vocabulary.
 *
 * ⚠️ **Three examples, never the full list.** The whole point of a named pattern is that it
 * replaces the enumeration; a census that listed every matching card would have reintroduced
 * exactly the wall D-039 exists to prevent, one level up.
 */
export function patternCensus(deck: Deck, cards: CardIndex): PatternCount[] {
  const tally = new Map<StrategicPattern, { copies: number; names: Set<string>; examples: string[] }>();

  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "MAIN" || !entry.cardId || !entry.facts) continue;
    for (const pattern of patternsOf(entry.facts)) {
      const seen = tally.get(pattern) ?? { copies: 0, names: new Set<string>(), examples: [] };
      seen.copies += entry.quantity;
      if (!seen.names.has(entry.name)) {
        seen.names.add(entry.name);
        if (seen.examples.length < 3) seen.examples.push(entry.name);
      }
      tally.set(pattern, seen);
    }
  }

  return [...tally]
    .map(([pattern, seen]) => {
      const spec = SPEC.get(pattern) as PatternSpec;
      return {
        pattern,
        label: spec.label,
        definition: spec.definition,
        copies: seen.copies,
        cards: seen.names.size,
        examples: seen.examples,
      };
    })
    // Most-present first: what a deck does a lot of is what it does.
    .sort((a, b) => b.copies - a.copies || a.label.localeCompare(b.label));
}
