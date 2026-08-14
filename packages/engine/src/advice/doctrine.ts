import type { CardIndex, Deck } from "../types.js";
import { countedEntries } from "../legality/entries.js";
import { CARDS_SEEN_BY_TURN_ONE, deckShape, type DeckShape } from "./shape.js";
import { SELF_SATISFYING, supplyOf } from "./synergy.js";
import { hasKeyword } from "../text.js";

/**
 * What good players advise, and **who advises it**.
 *
 * ⚠️ **Deckbuilders disagree, and that disagreement is content rather than noise.** One
 * school says start from a topping list and mix; another says sieve the whole legal pool
 * down; a third says the real skill is knowing your own deck well enough to mulligan
 * correctly. They are not reconcilable workflows, and a tool that flattens them into one
 * "correct" answer is lying about the state of the art.
 *
 * So every judgement here carries a `source` and a `confidence`, and the caller is expected
 * to show them:
 *
 * - `rulebook` — Core or Tournament Rules. Not advice; a constraint.
 * - `official` — Riot's own Primer. Advice, but from the people who made the game.
 * - `community` — earned from play and widely held. Contested at the edges.
 * - `computed` — arithmetic on this deck, correct given its stated assumption.
 */

export type Source = "rulebook" | "official" | "community" | "computed";
export type Confidence = "fact" | "probability" | "doctrine";

export interface Note {
  /** One sentence. The claim, not the essay. */
  claim: string;
  /** Why it follows — the lever the reader can actually pull. */
  because: string;
  source: Source;
  confidence: Confidence;
  /** Where it comes from, so a disputed claim can be argued with rather than obeyed. */
  attribution: string;
}

/**
 * Riot's Primer, via COMPENDIUM §2. **This outranks community heuristics** where they
 * conflict — it is guidance from the designers, not folklore.
 */
export const OFFICIAL = {
  smallUnitsMin: 9,
  smallUnitCostMax: 4,
  interactiveSpellsMin: 6,
  signatureSlots: 3,
  runeSplit: 6,
} as const;

/**
 * The community's number, and the one piece of deckbuilding maths anyone has actually done:
 * 7–9 cards playable on turn one gives roughly 78 / 83 / 87% to open one. Riot's Primer says
 * 9+ small units at 2–4 cost, which is a different (looser) claim about the same worry.
 */
export const COMMUNITY = { earlyPlaysMin: 7, earlyPlaysIdeal: 8, earlyPlaysMax: 9 } as const;

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** What the deck can do, counted from the synergy graph rather than guessed from names. */
export interface Capabilities {
  removal: number;
  draw: number;
  combatTricks: number;
  bodies: number;
  /**
   * Units that hold a battlefield *better than their Might suggests* — `[Shield]` is
   * "+1 Might while I'm a defender", `[Tank]` is "I must be assigned combat damage first".
   *
   * ⚠️ **Added because the spec asked for decks it could not then measure.**
   * [`GENERATOR §4.2`](../../../../docs/spec/GENERATOR.md) names `Tank` and `Shield` as the
   * mechanical target of a defensive/holding intent, and `audit-knowledge` found 25 and 26
   * cards carrying them with nothing in Forge able to act on either.
   *
   * ⚠️ Counted through `hasKeyword`, so a card that merely *grants* Shield is excluded —
   * `Block` reads `[Hidden] [Action] … give it [Shield]` and does not hold anything itself.
   */
  defenders: number;
  /** `consumes` tags with no matching producer — "eleven cards care about gear, you run four". */
  danglingSynergies: Array<{ needs: string; wants: number; supplies: number }>;
}

/** Which `produces` tags count as which capability. Named here so the mapping is arguable. */
const REMOVAL = ["kill", "damage", "banish", "shrink"];
const TRICKS = ["pump", "stun", "move", "ready", "shrink"];

export function capabilities(deck: Deck, cards: CardIndex): Capabilities {
  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");
  let removal = 0;
  let draw = 0;
  let combatTricks = 0;
  let bodies = 0;
  let defenders = 0;

  const wants = new Map<string, number>();

  for (const e of main) {
    const produces = e.facts?.produces ?? [];
    const consumes = e.facts?.consumes ?? [];
    if (e.facts?.types?.includes("unit")) {
      bodies += e.quantity;
      const text = e.facts.text;
      if (hasKeyword(text, "Tank") || hasKeyword(text, "Shield")) defenders += e.quantity;
    }
    if (produces.some((p) => REMOVAL.includes(p))) removal += e.quantity;
    if (produces.includes("draw")) draw += e.quantity;
    // A trick is an *action* that swings a fight — a unit that pumps on arrival is a body.
    if (!e.facts?.types?.includes("unit") && produces.some((p) => TRICKS.includes(p))) {
      combatTricks += e.quantity;
    }
    for (const c of consumes) wants.set(c, (wants.get(c) ?? 0) + e.quantity);
  }

  /**
   * ⚠️ **Supply is counted through the shared synergy graph, never by matching the tag name
   * against `produces`.** That fallback used to live here and could not match: no card
   * produces `unit_played` or `empowered`, so seventeen of the twenty tags in the pool
   * resolved to a supply of zero no matter what the deck held. A deck of twenty units was
   * told *"6 cards care about unit_played, and only 0 supply it"* — `source: "computed"`,
   * `confidence: "fact"`, and false. `SUPPORTS` is now the single definition (`synergy.ts`).
   *
   * A tag the graph does not model is **skipped, not scored zero**. Silence is the only
   * honest output for something that was never measured.
   */
  const danglingSynergies = [...wants]
    .flatMap(([needs, count]) => {
      if (SELF_SATISFYING.has(needs)) return [];
      const test = supplyOf(needs);
      if (!test) return [];
      const supply = main.reduce((n, e) => (e.facts && test(e.facts) ? n + e.quantity : n), 0);
      return [{ needs, wants: count, supplies: supply }];
    })
    // Only worth mentioning when the payoff is real and the enabler is thin.
    .filter((s) => s.wants >= 3 && s.supplies * 2 < s.wants)
    .sort((a, b) => b.wants - a.wants);

  return { removal, draw, combatTricks, bodies, defenders, danglingSynergies };
}

/**
 * Read the deck and say what is true about it — with the reason, the source, and how much
 * confidence the claim deserves.
 *
 * Deliberately **not** a score. Nothing here composites into a grade (D-016): a deck is a
 * set of trade-offs, and a number would hide which ones you chose.
 */
export function review(deck: Deck, cards: CardIndex): { shape: DeckShape; notes: Note[] } {
  const shape = deckShape(deck, cards);
  const caps = capabilities(deck, cards);
  const notes: Note[] = [];

  // ── turn one ────────────────────────────────────────────────────────────────
  if (shape.earlyPlays < COMMUNITY.earlyPlaysMin) {
    notes.push({
      claim: `${shape.earlyPlays} cards are playable on turn one — ${pct(shape.earlyPlayOdds)} to open one.`,
      because:
        `Missing turn one is the most punishing opening in the game, and the fix is cheap: ` +
        `${COMMUNITY.earlyPlaysIdeal} early plays takes it to about 83%. Riot's Primer asks ` +
        `for ${OFFICIAL.smallUnitsMin}+ small units at ${OFFICIAL.smallUnitCostMax} or less ` +
        `for the same reason.`,
      source: "computed",
      confidence: "probability",
      attribution: `Hypergeometric over ${CARDS_SEEN_BY_TURN_ONE} cards seen by end of turn one; the 7–9 band is community consensus, the 9+ small units is Riot's Primer`,
    });
  } else if (shape.earlyPlays > COMMUNITY.earlyPlaysMax + 2) {
    notes.push({
      claim: `${shape.earlyPlays} early plays is more than the opening needs.`,
      because:
        `Past about ${COMMUNITY.earlyPlaysMax} the odds barely move — each extra one is a slot ` +
        `not spent on the mid-game, where decks are usually decided.`,
      source: "community",
      confidence: "doctrine",
      attribution: "Diminishing returns past 9 is widely held; the exact ceiling is not agreed",
    });
  }

  // ── what the deck can do at all ─────────────────────────────────────────────
  if (caps.removal === 0) {
    notes.push({
      claim: "Nothing in the Main Deck removes an enemy unit.",
      because:
        "Every removal-free deck loses to the first threat it cannot fight over. This is a " +
        "capability gap rather than a card choice — no amount of tuning the curve fixes it.",
      source: "community",
      confidence: "doctrine",
      attribution: "Universal across the deckbuilding guides; none dissent",
    });
  }
  if (caps.draw === 0) {
    notes.push({
      claim: "No card draw.",
      because:
        "More cards is more options, and the guides are blunt that a deck with no draw can " +
        "simply be starved. Cheap to add, expensive to lack.",
      source: "community",
      confidence: "doctrine",
      attribution: "Widely held; weight varies by archetype — control decks care far more than aggro",
    });
  }
  if (caps.combatTricks === 0 && shape.size >= 20) {
    notes.push({
      claim: "No combat tricks.",
      because:
        "Tricks are hidden until used, so they win fights your opponent thought they had. A " +
        "deck without them plays entirely on visible information.",
      source: "community",
      confidence: "doctrine",
      attribution: "Consensus that some are needed; the right number is contested",
    });
  }

  // ── synergies that point nowhere ────────────────────────────────────────────
  for (const s of caps.danglingSynergies.slice(0, 2)) {
    notes.push({
      claim: `${s.wants} cards care about ${s.needs.replace("_matters", "")}, and only ${s.supplies} supply it.`,
      because:
        "A payoff without its enabler is a dead card in most openings. Either add the " +
        "enabler or cut the payoff — carrying both halves at the wrong ratio is the worst of both.",
      source: "computed",
      confidence: "fact",
      attribution: "Counted from the deck's produces/consumes tags",
    });
  }

  // ── shape ───────────────────────────────────────────────────────────────────
  if (shape.units > 0 && shape.units < shape.size * 0.4 && shape.size >= 30) {
    notes.push({
      claim: `${shape.units} units in ${shape.size} cards.`,
      because:
        "You hold battlefields with bodies. A unit-light deck cannot physically contest three " +
        "locations, however good the cards are.",
      source: "official",
      confidence: "doctrine",
      attribution: "Riot's Primer: prioritise units over spells and gear for board presence",
    });
  }

  return { shape, notes };
}
