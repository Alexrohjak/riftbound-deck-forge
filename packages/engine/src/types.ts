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

/**
 * The engine never fetches card data — it is pure (D-047). Callers supply a lookup,
 * which is also what lets the browser and the CLI share this code unchanged.
 */
export interface CardIndex {
  /** The legality unit. `undefined` when the printing is unknown to the caller. */
  nameOf(cardId: string): string | undefined;
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
