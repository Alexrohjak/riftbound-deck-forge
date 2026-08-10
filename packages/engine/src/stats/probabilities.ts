import type { CardIndex, Deck } from "../types.js";
import { deckEntries } from "../legality/entries.js";
import { CARDS_SEEN_BY_TURN_ONE, MAIN_DECK_SIZE } from "../advice/shape.js";

/**
 * 🟡 **Tier 2 — probabilities** (DECK-STATS §4). Computed or simulated, and correct **given
 * assumptions that are always stated**.
 *
 * ⚠️ **Every result carries its own assumptions.** A percentage with its conditions stripped
 * off is how a probability becomes folklore, and this is the tier where that happens. The
 * assumptions are data on the result, not prose in a component, so no caller can render the
 * number without having been handed the caveat.
 *
 * ⚠️ **Simulation is seeded.** `Math.random` would make the panel's numbers jitter on every
 * keystroke while the deck was unchanged, which reads as instability in the deck rather than
 * in the tool — and would make these results untestable. Same deck, same numbers, always.
 */

/** How many turns the curves cover. Six is where a 12-rune deck is exhausted (DECK-STATS §2). */
export const TURNS = 6;

/** Runes channelled per turn (CR 315.3.b.1). Channelled runes stay on the board. */
export const RUNES_PER_TURN = 2;

/**
 * `n choose k`, multiplicatively so the intermediate never leaves double precision for the
 * deck sizes this game uses (12 runes, 40 Main Deck).
 */
function choose(n: number, k: number): number {
  if (k < 0 || k > n || n < 0) return 0;
  const m = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= m; i++) result = (result * (n - m + i)) / i;
  return result;
}

/**
 * Exact hypergeometric: P(at least `k` successes in `drawn` from `deckSize`).
 *
 * `atLeastOne` in `advice/shape.ts` is this with `k = 1`, kept separate because it predates
 * this module and is used where only presence matters.
 *
 * ⚠️ **Summed from the point masses directly, not stepped from `P(X = 0)`.** The obvious
 * recurrence — derive each mass from the previous one — silently returns 1 whenever
 * `P(X = 0)` is *legitimately* zero, because it then multiplies zero forever. That happens
 * exactly when the deck holds fewer misses than you draw: 7 Fury in 12 runes with 6
 * channelled cannot miss twice, so `P(X = 0) = 0` and every later mass came out zero too.
 * It reported 100% where the answer is 99.24% — a plausible-looking wrong number, which is
 * the worst kind in a panel whose whole claim is calibration.
 */
export function atLeast(successes: number, deckSize: number, drawn: number, k: number): number {
  if (k <= 0) return 1;
  if (successes < k || drawn < k || deckSize <= 0) return 0;
  if (drawn >= deckSize) return successes >= k ? 1 : 0;

  const total = choose(deckSize, drawn);
  if (total === 0) return 0;
  let below = 0;
  for (let i = 0; i < k; i++) {
    below += (choose(successes, i) * choose(deckSize - successes, drawn - i)) / total;
  }
  return Math.min(1, Math.max(0, 1 - below));
}

/** Runes of each domain in the Rune Deck, and its size. */
function runeDeck(deck: Deck, cards: CardIndex) {
  const byDomain: Record<string, number> = {};
  let size = 0;
  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "RUNE" || !entry.cardId) continue;
    size += entry.quantity;
    for (const domain of entry.facts?.domains ?? []) {
      byDomain[domain] = (byDomain[domain] ?? 0) + entry.quantity;
    }
  }
  return { byDomain, size };
}

export interface FeasibilityRow {
  domain: string;
  /** The Power cost being asked about. */
  cost: number;
  /** Copies in the deck that actually demand this much Power of this domain. */
  cards: number;
  /** `p[t - 1]` = P(you can pay it on turn `t`). */
  p: number[];
}

export interface RuneFeasibility {
  rows: FeasibilityRow[];
  runeDeckSize: number;
  assumptions: string[];
}

/**
 * ⭐ **The flagship** (DECK-STATS §2) — *"with a 7 Fury / 5 Calm split you have a 74% chance
 * of paying 2 Fury Power on turn 3"*. No other Riftbound tool can produce this, because none
 * knows the rune split and the deck's Power demands together.
 *
 * **The model.** By turn `t` you have channelled `2t` runes and they are still on the board.
 * Paying `k` Power of a domain means recycling `k` runes **of that domain** from the board,
 * so the question is exactly: *of the `2t` runes drawn from a 12-card deck, are at least `k`
 * of the right colour?* — a hypergeometric, computed exactly.
 *
 * ⚠️ **Energy does not compete with Power for the same rune.** A rune may be exhausted for
 * `1 Energy` **and then** recycled for `1 Power` (CR 164.2, 414.1.b — the correction recorded
 * in DECK-STATS §2). Treating it as either/or would report decks as unable to pay costs they
 * can actually pay, so only the colour requirement binds here.
 *
 * ⚠️ **Recycling on earlier turns is not modelled**, and that is the assumption doing the
 * most work: a recycled rune returns to the Rune Deck and changes what you channel next turn.
 * Modelling it needs a play pattern, which is a guess about you rather than about the deck —
 * so the number is exact under "you have not recycled yet" and says so.
 */
export function runeFeasibility(deck: Deck, cards: CardIndex): RuneFeasibility {
  const runes = runeDeck(deck, cards);

  // What the deck actually asks for: Power costs per domain, and how many copies ask.
  const demand = new Map<string, Map<number, number>>();
  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "MAIN" || !entry.cardId) continue;
    const cost = entry.facts?.power;
    if (typeof cost !== "number" || cost <= 0) continue;
    const coloured = (entry.facts?.domains ?? []).filter((d) => d !== "colorless");
    // A two-domain card's Power cannot be attributed, and a guess here would be invisible
    // in the output — so it is left out rather than assigned to whichever domain sorts first.
    if (coloured.length !== 1) continue;
    const domain = coloured[0] as string;
    const perCost = demand.get(domain) ?? new Map<number, number>();
    perCost.set(cost, (perCost.get(cost) ?? 0) + entry.quantity);
    demand.set(domain, perCost);
  }

  const rows: FeasibilityRow[] = [];
  for (const [domain, perCost] of [...demand].sort(([a], [b]) => a.localeCompare(b))) {
    const have = runes.byDomain[domain] ?? 0;
    for (const [cost, count] of [...perCost].sort(([a], [b]) => a - b)) {
      const p: number[] = [];
      for (let turn = 1; turn <= TURNS; turn++) {
        const channelled = Math.min(RUNES_PER_TURN * turn, runes.size);
        p.push(atLeast(have, runes.size, channelled, cost));
      }
      rows.push({ domain, cost, cards: count, p });
    }
  }

  return {
    rows,
    runeDeckSize: runes.size,
    assumptions: [
      `${RUNES_PER_TURN} runes channelled per turn, from a ${runes.size}-rune deck`,
      "no recycling on earlier turns — a recycled rune returns to the Rune Deck",
      "a rune may be exhausted for Energy and then recycled for Power, so only colour binds",
      "no mulligan modelling, and no card effects that move runes",
    ],
  };
}

export interface Access {
  /** Copies of the card in the Main Deck. */
  copies: number;
  /** `p[t - 1]` = P(you have seen at least one by the end of turn `t`). */
  p: number[];
  assumptions: string[];
}

/**
 * **Chosen Champion access** — P(drawn by turn N).
 *
 * Counted **by name**: a Champion you also run copies of in the Main Deck is a card you see
 * more often, and the deck slot and the copies are the same card as far as drawing goes.
 */
export function championAccess(deck: Deck, cards: CardIndex): Access {
  const name = deck.chosenChampionCardId ? cards.nameOf(deck.chosenChampionCardId) : undefined;
  let copies = 0;
  let mainDeckSize = 0;
  // ⚠️ `deckEntries` already emits the Chosen Champion as its own Main Deck entry, so this
  // counts everything and pre-seeds nothing. Skipping entries that share the Champion's
  // printing id — an earlier attempt at avoiding a double count — dropped the copies of it
  // actually in the Main Deck, which are the ones that make it easier to find.
  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "MAIN" || !entry.cardId) continue;
    mainDeckSize += entry.quantity;
    if (name !== undefined && entry.name === name) copies += entry.quantity;
  }
  const size = mainDeckSize > 0 ? mainDeckSize : MAIN_DECK_SIZE;

  const p: number[] = [];
  for (let turn = 1; turn <= TURNS; turn++) {
    // Seen by turn one is the opening hand after a mulligan plus the draw for turn; every
    // turn after that is one more card.
    const seen = CARDS_SEEN_BY_TURN_ONE + (turn - 1);
    p.push(atLeast(copies, size, Math.min(seen, size), 1));
  }
  return {
    copies,
    p,
    assumptions: [
      `${CARDS_SEEN_BY_TURN_ONE} cards seen by the end of turn one, then one draw per turn`,
      "on the play; no card effects that draw",
    ],
  };
}

export interface Flexibility {
  /** `options[t - 1]` = distinct cards castable on turn `t`. */
  options: number[];
  /** Distinct Main Deck cards the question was asked of. */
  distinct: number;
  assumptions: string[];
}

/**
 * **Playable options per turn** — DECK-STATS §6's concrete definition of *flexibility*,
 * which is decoration until it is defined: *given expected resources on turn N, how many
 * distinct cards in the deck could actually be cast?*
 *
 * Distinct **cards**, not copies: fourteen castable options is a different deck from four,
 * and running three of each does not make you more flexible.
 */
export function playableOptions(deck: Deck, cards: CardIndex): Flexibility {
  const runes = runeDeck(deck, cards);
  const seen = new Map<string, { energy: number | null; power: number; domain: string | null }>();

  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "MAIN" || !entry.cardId || seen.has(entry.name)) continue;
    const energy = entry.facts?.energy;
    const power = entry.facts?.power;
    const coloured = (entry.facts?.domains ?? []).filter((d) => d !== "colorless");
    seen.set(entry.name, {
      energy: typeof energy === "number" ? energy : null,
      power: typeof power === "number" ? power : 0,
      domain: coloured.length === 1 ? (coloured[0] as string) : null,
    });
  }

  const options: number[] = [];
  for (let turn = 1; turn <= TURNS; turn++) {
    const available = RUNES_PER_TURN * turn;
    let n = 0;
    for (const card of seen.values()) {
      if (card.energy === null) continue; // no cost data is not a castable card
      if (card.energy > available) continue;
      // The colour has to be in the deck at all, or it is not an option however cheap it is.
      if (card.power > 0) {
        const have = card.domain ? (runes.byDomain[card.domain] ?? 0) : 0;
        if (have < card.power || card.power > available) continue;
      }
      n += 1;
    }
    options.push(n);
  }

  return {
    options,
    distinct: seen.size,
    assumptions: [
      `${RUNES_PER_TURN} runes channelled per turn, all available as Energy`,
      "the colour is assumed present if the Rune Deck runs enough of it — this is capacity, not a draw",
      "cards with no cost data are not counted as castable",
    ],
  };
}

/** A tiny deterministic PRNG (mulberry32) — same deck, same numbers, every render. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Openings {
  hands: number;
  /** Share of openings with a castable turn-one play. */
  turnOne: number;
  /** Share with a castable play on turn one or turn two. */
  turnTwo: number;
  /** `might[t - 1]` = mean Might on board at the end of turn `t`. */
  might: number[];
  assumptions: string[];
}

/**
 * **Opening-hand playability and expected Might** — DECK-STATS §4.
 *
 * *"This is what a Sample Hand should have been — a distribution, not an anecdote."* One
 * hand tells you nothing; ten thousand tell you the shape.
 *
 * The Might simulation plays a deliberately simple line — each turn, cast the most expensive
 * unit you can afford — because the alternative is a pretend pilot whose skill would be
 * baked invisibly into the number. A greedy curve-out is the assumption, and it is stated.
 */
export function simulateOpenings(deck: Deck, cards: CardIndex, hands = 10_000): Openings {
  interface Card { energy: number | null; power: number; domain: string | null; might: number }
  const library: Card[] = [];
  for (const entry of deckEntries(deck, cards)) {
    if (entry.zone !== "MAIN" || !entry.cardId) continue;
    const energy = entry.facts?.energy;
    const might = entry.facts?.might;
    const coloured = (entry.facts?.domains ?? []).filter((d) => d !== "colorless");
    const card: Card = {
      energy: typeof energy === "number" ? energy : null,
      power: typeof entry.facts?.power === "number" ? (entry.facts.power as number) : 0,
      domain: coloured.length === 1 ? (coloured[0] as string) : null,
      might: typeof might === "number" && entry.facts?.types?.includes("unit") ? might : 0,
    };
    for (let i = 0; i < entry.quantity; i++) library.push(card);
  }

  const runes = runeDeck(deck, cards);
  const empty: Openings = {
    hands: 0,
    turnOne: 0,
    turnTwo: 0,
    might: Array.from({ length: TURNS }, () => 0),
    assumptions: [],
  };
  if (library.length === 0) return empty;

  const castable = (card: Card, turn: number): boolean => {
    if (card.energy === null || card.energy > RUNES_PER_TURN * turn) return false;
    if (card.power > 0) {
      const have = card.domain ? (runes.byDomain[card.domain] ?? 0) : 0;
      if (have < card.power || card.power > RUNES_PER_TURN * turn) return false;
    }
    return true;
  };

  const random = rng(0x5eed);
  let one = 0;
  let two = 0;
  const mightTotal = new Array<number>(TURNS).fill(0);

  for (let h = 0; h < hands; h++) {
    // Fisher-Yates over indices, so the library array itself is never mutated.
    const order = library.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j] as number, order[i] as number];
    }

    const hand: Card[] = [];
    let next = 0;
    const draw = (n: number) => {
      for (let i = 0; i < n && next < order.length; i++) {
        hand.push(library[order[next++] as number] as Card);
      }
    };
    draw(CARDS_SEEN_BY_TURN_ONE);

    let board = 0;
    let playedByOne = false;
    let playedByTwo = false;
    for (let turn = 1; turn <= TURNS; turn++) {
      if (turn > 1) draw(1);
      // Greedy: the most expensive castable unit, then anything else castable.
      let best = -1;
      for (let i = 0; i < hand.length; i++) {
        const card = hand[i] as Card;
        if (!castable(card, turn)) continue;
        const better = best < 0 || (card.energy ?? 0) > ((hand[best] as Card).energy ?? 0);
        if (better) best = i;
      }
      if (best >= 0) {
        const played = hand.splice(best, 1)[0] as Card;
        board += played.might;
        if (turn === 1) playedByOne = true;
        if (turn <= 2) playedByTwo = true;
      }
      mightTotal[turn - 1] = (mightTotal[turn - 1] ?? 0) + board;
    }
    if (playedByOne) one += 1;
    if (playedByTwo) two += 1;
  }

  return {
    hands,
    turnOne: one / hands,
    turnTwo: two / hands,
    might: mightTotal.map((total) => total / hands),
    assumptions: [
      `${hands.toLocaleString("en-GB")} simulated openings, seeded so the same deck always reports the same numbers`,
      `${CARDS_SEEN_BY_TURN_ONE} cards seen by the end of turn one, then one draw per turn`,
      "one card played per turn, greedily the most expensive affordable — not a pilot",
      "no mulligan modelling, no card effects, no opponent",
    ],
  };
}
