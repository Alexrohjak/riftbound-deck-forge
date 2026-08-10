import type { CardIndex, Deck, Domain } from "../types.js";
import { deckEntries } from "../legality/entries.js";
import { energyCurve, type EnergyCurve } from "./energyCurve.js";

/**
 * 🟢 **Tier 1 — facts** (DECK-STATS §3). Deterministic, read straight off the decklist,
 * and exactly correct.
 *
 * ⚠️ **The tier is the contract.** A Tier 1 number may never be an approximation, so every
 * statistic here carries the count it could *not* see alongside the count it could. Folding
 * an unknown into a zero is how a fact quietly becomes an estimate — the energy curve keeps
 * costless cards out of bucket 0 for exactly this reason (D-022), and everything below
 * follows it.
 */

/** The keywords DECK-STATS §3 asks for by name. Not all 25 — these are the load-bearing ones. */
export const COUNTED_KEYWORDS = [
  "Tank",
  "Assault",
  "Accelerate",
  "Deflect",
  "Hidden",
  "Legion",
  "Hunt",
] as const;

export interface Tally {
  /** Domain → copies. Only domains actually present appear. */
  byDomain: Record<string, number>;
  total: number;
}

export interface TypeSplit {
  unit: number;
  spell: number;
  gear: number;
  /** Anything the pool types as something else. Kept rather than dropped. */
  other: number;
  /** Cards whose types the caller did not supply. */
  unknown: number;
  counted: number;
}

export interface MightSpread {
  /** `counts[n]` = units with Might `n`, copies included. Dense from 0. */
  counts: number[];
  /** Units whose Might the caller did not supply — never folded into 0. */
  unknown: number;
  /** Units represented. **Non-units are not counted and are not "unknown"** — a spell has
      no Might, which is a different statement from a unit whose Might we cannot see. */
  units: number;
}

export interface DeckFacts {
  /** Main Deck cards the facts were read from, Chosen Champion included. */
  mainDeckSize: number;
  energy: EnergyCurve;
  /**
   * Power demand by domain — *"the figure that must be reconciled against the rune split"*
   * (DECK-STATS §3), and the input the flagship Tier 2 curve consumes.
   */
  power: Tally & {
    /** Copies with a Power cost whose domain cannot be determined — see `CardFacts.power`. */
    ambiguous: number;
    /** Copies whose Power the caller did not supply. */
    unknown: number;
  };
  types: TypeSplit;
  might: MightSpread;
  /** Keyword → copies carrying it. Absent from the map means none; see `keywordsRead`. */
  keywords: Record<string, number>;
  /** ⚠️ False when the pool carries no rules text, so zero keywords means *not looked*. */
  keywordsRead: boolean;
  /** The Rune Deck by domain — 12 in a legal deck (L4). */
  runes: Tally;
  /** Signature cards, capped at 3 across the deck (L20, CR 103.2.d.1). */
  signatures: number;
}

const bump = (into: Record<string, number>, key: string, by: number) => {
  into[key] = (into[key] ?? 0) + by;
};

/**
 * Reminder text is parenthesised on every printed card — `[Accelerate] (You may pay …)`.
 * Stripping it first stops a keyword *explained* in one card's reminder from being counted
 * as a keyword the card *has*.
 */
const withoutReminders = (text: string): string => text.replace(/\([^)]*\)/g, " ");

/**
 * Read the deck's Tier 1 facts.
 *
 * ⚠️ **Runes and battlefields are not Main Deck cards** and are excluded from every
 * statistic except the rune split — they are registered separately, never drawn, and folding
 * them into the curve or the type split would describe a deck nobody plays.
 */
export function deckFacts(deck: Deck, cards: CardIndex): DeckFacts {
  const power = { byDomain: {} as Record<string, number>, total: 0, ambiguous: 0, unknown: 0 };
  const types: TypeSplit = { unit: 0, spell: 0, gear: 0, other: 0, unknown: 0, counted: 0 };
  const mightCounts: number[] = [];
  let mightUnknown = 0;
  let units = 0;
  const keywords: Record<string, number> = {};
  const runes = { byDomain: {} as Record<string, number>, total: 0 };
  let signatures = 0;
  let anyText = false;

  for (const entry of deckEntries(deck, cards)) {
    if (!entry.cardId) continue;
    const facts = entry.facts;
    const n = entry.quantity;

    if (entry.zone === "RUNE") {
      for (const domain of facts?.domains ?? []) bump(runes.byDomain, domain, n);
      runes.total += n;
      continue;
    }
    // Battlefields are registered, not drawn. The sideboard is not the deck you open with.
    if (entry.zone !== "MAIN") continue;

    // ── type split ──────────────────────────────────────────────────────────
    const cardTypes = facts?.types;
    if (cardTypes === undefined) {
      types.unknown += n;
    } else {
      types.counted += n;
      if (cardTypes.includes("unit")) types.unit += n;
      else if (cardTypes.includes("spell")) types.spell += n;
      else if (cardTypes.includes("gear")) types.gear += n;
      else types.other += n;
    }

    // ── Might, over units only ──────────────────────────────────────────────
    if (cardTypes?.includes("unit")) {
      units += n;
      const might = facts?.might;
      if (might === undefined || might === null || !Number.isFinite(might) || might < 0) {
        mightUnknown += n;
      } else {
        const bucket = Math.trunc(might);
        while (mightCounts.length <= bucket) mightCounts.push(0);
        mightCounts[bucket] = (mightCounts[bucket] ?? 0) + n;
      }
    }

    // ── Power demand ────────────────────────────────────────────────────────
    const cost = facts?.power;
    if (cost === undefined) {
      power.unknown += n;
    } else if (cost !== null && cost > 0) {
      power.total += cost * n;
      // Colourless is not a Power domain, so a colourless card with a Power cost is data we
      // cannot place rather than data we can round off.
      const coloured = (facts?.domains ?? []).filter((d) => d !== "colorless");
      if (coloured.length === 1) bump(power.byDomain, coloured[0] as Domain, cost * n);
      else power.ambiguous += cost * n;
    }

    // ── keywords, from the printed text ─────────────────────────────────────
    if (facts?.text !== undefined) {
      anyText = true;
      const body = withoutReminders(facts.text);
      for (const keyword of COUNTED_KEYWORDS) {
        // `[Assault 2]` and `[Assault]` are the same keyword, so match the opening token.
        if (body.includes(`[${keyword}`)) bump(keywords, keyword, n);
      }
    }

    if (facts?.superTypes?.some((s) => s.toLowerCase() === "signature")) signatures += n;
  }

  return {
    mainDeckSize: energyCurve(deck, cards).mainDeckSize,
    energy: energyCurve(deck, cards),
    power,
    types,
    might: { counts: mightCounts, unknown: mightUnknown, units },
    keywords,
    keywordsRead: anyText,
    runes,
    signatures,
  };
}
