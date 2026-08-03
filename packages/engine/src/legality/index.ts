import type { CardIndex, Coverage, Deck, LegalityResult } from "../types.js";
import { checkShape } from "./shape.js";
import { checkCopies } from "./copies.js";

/** The checks this build actually runs. */
export const IMPLEMENTED_CHECKS = ["L3", "L4", "L5", "L6", "L7", "L13", "L14", "L16"] as const;

/** Every check `docs/spec/LEGALITY.md` §2 specifies. */
export const SPECIFIED_CHECK_COUNT = 33;

/**
 * ⚠️ **The skeleton subset, not `W1`.** These are the checks computable from a deck plus
 * a name lookup — shape and copy limits. Everything needing card *types*, *domains* or
 * *supertypes* (Domain Identity, Champion eligibility, Signature limits) waits for `F3`,
 * which is what puts the card pool in reach.
 *
 * The result reports its own incompleteness deliberately. A verdict that said only
 * `legal: true` would be read as "tournament-legal", and it is not — that is precisely
 * the silent-wrongness failure `W1` is flagged as the highest correctness risk for.
 * Omit rather than fake (D-022) applies to our own confidence as much as to statistics.
 */
export const COVERAGE: Coverage = {
  implemented: IMPLEMENTED_CHECKS.length,
  specified: SPECIFIED_CHECK_COUNT,
  complete: false,
  caveat:
    `Skeleton subset: ${IMPLEMENTED_CHECKS.length} of ${SPECIFIED_CHECK_COUNT} checks. ` +
    "Shape and copy limits only — Domain Identity, Champion eligibility and Signature " +
    "limits are not yet checked. A pass here does NOT mean the deck is tournament-legal.",
};

/**
 * Validate a deck against the checks this build implements.
 *
 * Pure: no network, no filesystem, no globals. The browser calls it on every edit
 * (legality is live state, D-042) and the CLI calls it headlessly for Claude Code
 * (D-043) — the same code, which is the whole point of D-047.
 */
export function checkLegality(deck: Deck, cards: CardIndex): LegalityResult {
  const violations = [...checkShape(deck, cards), ...checkCopies(deck, cards)];
  return {
    legal: violations.length === 0,
    violations,
    checked: [...IMPLEMENTED_CHECKS],
    coverage: COVERAGE,
  };
}

export { checkShape, mainDeckCount, zoneCount } from "./shape.js";
export { checkCopies, copiesByName, MAX_COPIES_PER_NAME } from "./copies.js";
