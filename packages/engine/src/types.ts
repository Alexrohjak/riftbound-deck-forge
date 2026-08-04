/**
 * The entities the rules operate on, mirroring `docs/spec/DATA-MODEL.md` §1.
 *
 * ⚠️ The single most error-prone relationship in the system (DATA-MODEL §2):
 * **ownership is keyed on printing, legality is keyed on name.** Two printings of
 * "Jinx, Rebel" are two objects in a box and one name for the 3-copy limit.
 * Everything in this file that says `cardId` means a printing; everything that
 * counts toward a rule resolves to a name first.
 */

/** Where a card sits in a registered deck. */
export type Zone = "MAIN" | "RUNE" | "BATTLEFIELD" | "SIDEBOARD";

/**
 * The six domains, plus `colorless` — which is not a seventh domain but the absence of
 * one, and is legal under every identity (L12).
 */
export const DOMAINS = ["fury", "calm", "mind", "body", "chaos", "order", "colorless"] as const;
export type Domain = (typeof DOMAINS)[number];

/** DRAFT commits nothing; BUILT commits cards out of the available pool (D-017, D-026). */
export type DeckState = "DRAFT" | "BUILT";

export interface DeckSlot {
  /** A printing id, e.g. "ogn-202a-298". */
  cardId: string;
  zone: Zone;
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  state: DeckState;
  /** Exactly one. Not a slot — it is singular and behaves differently (DATA-MODEL §1). */
  legendCardId: string;
  /** Exactly one, and **counted inside the 40** (L3). Also not a slot. */
  chosenChampionCardId: string;
  slots: DeckSlot[];
}

/** What the engine needs to know about one printing. Everything beyond `name` is optional. */
export interface CardFacts {
  name: string;
  /**
   * ⚠️ **Omitting this is not the same as an empty list.** Absent means *the caller has
   * no domain data*, and the identity checks are skipped rather than guessed; `[]` would
   * be a claim that the card has no domains at all.
   */
  domains?: readonly Domain[];
  /**
   * Energy cost. `null` where the card has no such stat (battlefields, runes) — which is
   * different again from the field being absent, meaning *not supplied*.
   */
  energy?: number | null;
}

/**
 * The engine never fetches card data — it is pure (D-047). Callers supply a lookup,
 * which is also what lets the browser and the CLI share this code unchanged.
 */
export interface CardIndex {
  /** The legality unit. `undefined` when the printing is unknown to the caller. */
  nameOf(cardId: string): string | undefined;
  /**
   * `undefined` when this index carries no domains for the printing — which is the normal
   * case for an index built from names alone. Domain Identity then does not run, and
   * `LegalityResult.checked` says so.
   */
  domainsOf?(cardId: string): readonly Domain[] | undefined;
  /** `undefined` when unsupplied, `null` when the card genuinely has no Energy cost. */
  energyOf?(cardId: string): number | null | undefined;
}

/** One failed rule, carrying the citation so a verdict can always be traced. */
export interface Violation {
  /** Check id from `docs/spec/LEGALITY.md`, e.g. "L3". */
  check: string;
  /** Rulebook citation, e.g. "TR 601.1.b". */
  citation: string;
  message: string;
}

export interface LegalityResult {
  legal: boolean;
  violations: Violation[];
  /**
   * ⚠️ Which checks actually ran. `legal: true` means **these** checks passed —
   * not that the deck is tournament-legal. See `coverage`.
   */
  checked: string[];
  coverage: Coverage;
}

export interface Coverage {
  implemented: number;
  /** All 33 checks specified in `docs/spec/LEGALITY.md` §2. */
  specified: number;
  /** True only when every specified check runs. Until `W1`, always false. */
  complete: boolean;
  /** Plain-language statement of what a verdict does and does not mean. */
  caveat: string;
}
