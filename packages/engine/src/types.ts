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

/**
 * What the engine needs to know about one printing. Everything beyond `name` is optional,
 * and a check that lacks its data **does not run** rather than guessing — `checked` on the
 * result always says which ones did.
 */
export interface CardFacts {
  name: string;
  /** `unit`, `spell`, `gear`, `rune`, `battlefield`, `legend`. */
  types?: readonly string[];
  /** `champion`, `signature`, `token`, `basic`. */
  superTypes?: readonly string[];
  /** ⚠️ Mixes champion tags with species and region tags — see `championTag` (L32). */
  tags?: readonly string[];
  /** Rules text, searched for `[Unique]` (L28). */
  text?: string;
  /** Banned in Constructed 1v1 (L23, L30). Resolved through the ban list's alias map. */
  banned?: boolean;
  /**
   * Legends only: the champion tag, **derived from the Legend's Signature cards** (L32).
   * Not `tags`, which would wrongly admit 13 Yordles under Heart of the Tempest.
   */
  championTag?: string;
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
  /**
   * Everything else the checks need. `undefined` means the caller supplied no detail for
   * this printing — the checks that need it are then skipped, not guessed.
   */
  factsOf?(cardId: string): CardFacts | undefined;
  /**
   * What this index can actually answer, derived from the data it was built with.
   *
   * ⚠️ **This exists because absence is ambiguous.** A card with no `banned` field could be
   * legal or could be unknown, and guessing "legal" would make Forge quietly pass a banned
   * deck. So a check runs only when its index *demonstrably* carries the data, and
   * `LegalityResult.checked` reports the difference.
   */
  capabilities?: IndexCapabilities;
}

/** Per-field completeness of a `CardIndex`. True only when **every** entry carries it. */
export interface IndexCapabilities {
  /** `types` and `superTypes` — needed by the Champion, Signature and Rune checks. */
  types: boolean;
  /** Rules text — needed to see `[Unique]`. */
  text: boolean;
  /** Ban status — needed before any deck can be called format-legal. */
  bans: boolean;
}

/**
 * An ownership problem. **Deliberately not a `Violation`.**
 *
 * LEGALITY.md is explicit: *"a deck can be perfectly legal and unbuildable, and these must
 * never be conflated — the distinction is the point of the whole tool."* So these travel in
 * their own array and can never turn `legal` false.
 */
export interface Warning {
  /** `L26` or `L27`. */
  check: string;
  message: string;
}

/** What you physically own, and what is already spoken for (D-017). */
export interface OwnershipContext {
  /** Printing id → copies in the box. */
  collection: Readonly<Record<string, number>>;
  /** Printing id → copies already sleeved into a `BUILT` deck (DATA-MODEL §3). */
  committed?: Readonly<Record<string, number>>;
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
   * Ownership problems (L26, L27). ⚠️ **Never folded into `violations`** — a legal deck you
   * cannot physically build is legal. Empty unless an `OwnershipContext` was supplied.
   */
  warnings: Warning[];
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
