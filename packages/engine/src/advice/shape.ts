import type { CardIndex, Deck } from "../types.js";
import { countedEntries, type Entry } from "../legality/entries.js";

/**
 * What a deck **is**, measured rather than asserted.
 *
 * ⚠️ **Three kinds of claim live in this module and they must never be blurred**
 * (DECK-STATS §3–5, D-045):
 *
 * - **Fact** — counted from the list. "Eight two-drops." Not arguable.
 * - **Probability** — computed, correct given stated assumptions. "83% to open one."
 * - **Doctrine** — what good players advise. Contested, attributed, never stated as fact.
 *
 * Everything here returns the first two. Doctrine lives in `advice/doctrine.ts`, and every
 * judgement it makes cites who holds it, because deckbuilders genuinely disagree and a tool
 * that hides that is lying about the state of the art.
 */

/** A registered Main Deck is exactly 40, Chosen Champion included (L3). */
export const MAIN_DECK_SIZE = 40;

/**
 * Cards seen by the end of turn one: open four, mulligan the two worst when you have no
 * early play, then draw for turn.
 *
 * ⚠️ This is the **assumption** the opening-odds figure is correct *given*. State it
 * wherever the number is shown — an unqualified percentage is how a probability becomes
 * folklore.
 */
export const CARDS_SEEN_BY_TURN_ONE = 7;

/** Exact hypergeometric: the chance of at least one success in `drawn` from `deck`. */
export function atLeastOne(successes: number, deckSize: number, drawn: number): number {
  if (successes <= 0 || drawn <= 0) return 0;
  if (successes >= deckSize) return 1;
  // P(none) = product over each draw of (misses remaining / cards remaining).
  let pNone = 1;
  for (let i = 0; i < drawn; i++) {
    const misses = deckSize - successes - i;
    if (misses <= 0) return 1;
    pNone *= misses / (deckSize - i);
  }
  return 1 - pNone;
}

export interface DeckShape {
  /** Main Deck cards, Chosen Champion included. */
  size: number;
  /**
   * Playable on turn one — units, spells and gear costing 2 or less.
   *
   * ⚠️ **This definition is contested and Alexander has ruled against it (2026-08-27):**
   * *"turn one plays only include units — not spells that aren't useful. Consider things that
   * give card draw or rune channelling, yes, but turn one plays specifically refer to units."*
   *
   * The number below still counts every card costing 2 or less, so **it overstates a
   * spell-heavy deck.** `Ahri — Hold the Line` reported 14 early plays with only 4 bodies among
   * them, and the deck could not contest a battlefield before turn three while this statistic
   * read as healthy. `Ambessa` reports 19 against a *slow* plan for the same reason.
   *
   * The measure it should be: **bodies, plus the cards that buy you a turn** — card draw and
   * rune channelling. A combat trick castable on turn one is not a turn-one play; there is
   * nothing to trick.
   *
   * ⚠️ Changing it is not local. `archetype.ts` gates aggro on `earlyPlays >= 9` and control on
   * `<= 5`, `doctrine.ts` compares it to `COMMUNITY.earlyPlaysMin/Ideal/Max`, and those
   * community numbers were themselves derived from a count that included spells — so the
   * thresholds have to move with the definition or every deck reads as suddenly short.
   */
  earlyPlays: number;
  /**
   * Probability of seeing at least one by the end of turn one. **Tier 2** — correct given
   * `CARDS_SEEN_BY_TURN_ONE`, which is a convention rather than a rule.
   */
  earlyPlayOdds: number;
  /** Energy cost histogram, dense from 0 to the highest present. */
  curve: number[];
  /** Cards with no cost data, kept out of the histogram rather than folded into zero. */
  uncosted: number;
  units: number;
  spells: number;
  gear: number;
  /** Copies per name, so 3-of / 2-of / 1-of ratios can be read. */
  ratios: { threes: number; twos: number; ones: number };
}

const costOf = (e: Entry): number | null => {
  const energy = e.facts?.energy;
  return typeof energy === "number" && Number.isFinite(energy) ? energy : null;
};

const isType = (e: Entry, type: string) => e.facts?.types?.includes(type) ?? false;

export function deckShape(deck: Deck, cards: CardIndex): DeckShape {
  // Main Deck only. The sideboard is a different question and the rune deck is not drawn.
  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");

  const curve: number[] = [];
  let uncosted = 0;
  let earlyPlays = 0;
  let units = 0;
  let spells = 0;
  let gear = 0;

  const byName = new Map<string, number>();

  for (const e of main) {
    byName.set(e.name, (byName.get(e.name) ?? 0) + e.quantity);
    if (isType(e, "unit")) units += e.quantity;
    if (isType(e, "spell")) spells += e.quantity;
    if (isType(e, "gear")) gear += e.quantity;

    const cost = costOf(e);
    if (cost === null) {
      uncosted += e.quantity;
      continue;
    }
    const bucket = Math.max(0, Math.trunc(cost));
    while (curve.length <= bucket) curve.push(0);
    curve[bucket] = (curve[bucket] ?? 0) + e.quantity;
    // ⚠️ **This is the contested line — see `DeckShape.earlyPlays`.** "Two drop" is treated
    // here as *anything you can cast on turn one*, which is why gear and spells count: the
    // community number is about not having a dead first turn. Alexander's ruling is that a
    // turn-one play means a **body** (plus draw and rune channelling), because a deck that
    // can only cast tricks on turn one still cannot contest a battlefield. Left as-is
    // deliberately rather than changed in passing — the thresholds downstream were calibrated
    // against this count and have to move with it.
    if (cost <= 2) earlyPlays += e.quantity;
  }

  const size = main.reduce((n, e) => n + e.quantity, 0);
  const ratios = { threes: 0, twos: 0, ones: 0 };
  for (const count of byName.values()) {
    if (count >= 3) ratios.threes++;
    else if (count === 2) ratios.twos++;
    else if (count === 1) ratios.ones++;
  }

  return {
    size,
    earlyPlays,
    earlyPlayOdds: atLeastOne(earlyPlays, Math.max(size, MAIN_DECK_SIZE), CARDS_SEEN_BY_TURN_ONE),
    curve,
    uncosted,
    units,
    spells,
    gear,
    ratios,
  };
}
