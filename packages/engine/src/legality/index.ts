import type { CardIndex, Coverage, Deck, LegalityResult } from "../types.js";
import { checkShape } from "./shape.js";
import { checkCopies } from "./copies.js";
import { DOMAIN_IDENTITY_CHECKS, checkDomainIdentity, domainIdentity } from "./domains.js";

/** Shape and copy limits need only counts and names, so they always run. */
export const SHAPE_CHECKS = ["L3", "L4", "L5", "L6", "L7"] as const;
export const COPY_CHECKS = ["L13", "L14", "L16"] as const;

/** Runs only when the caller's index carries domains — see `coverageFor`. */
export { DOMAIN_IDENTITY_CHECKS };

/** Every check `docs/spec/LEGALITY.md` §2 specifies. */
export const SPECIFIED_CHECK_COUNT = 33;

/**
 * ⚠️ **Coverage is per verdict, not per build.** Two calls to `checkLegality` can run
 * different checks, because the domain checks depend on what the caller's `CardIndex`
 * knows. Reporting a fixed list would have made a name-only lookup claim it had
 * validated Domain Identity — silently wrong in exactly the direction `W1` is flagged
 * as the highest correctness risk for.
 *
 * Omit rather than fake (D-022) applies to our own confidence as much as to statistics.
 */
export function coverageFor(checked: readonly string[]): Coverage {
  return {
    implemented: checked.length,
    specified: SPECIFIED_CHECK_COUNT,
    complete: checked.length === SPECIFIED_CHECK_COUNT,
    caveat:
      `${checked.length} of ${SPECIFIED_CHECK_COUNT} checks ran: ${checked.join(", ")}. ` +
      "Champion eligibility, Signature limits, the ban list and Unique are not among " +
      "them. A pass here does NOT mean the deck is tournament-legal.",
  };
}

/**
 * Validate a deck against the checks this build implements **and this call can run**.
 *
 * Pure: no network, no filesystem, no globals. The browser calls it on every edit
 * (legality is live state, D-042) and the CLI calls it headlessly for Claude Code
 * (D-043) — the same code, which is the whole point of D-047.
 */
export function checkLegality(deck: Deck, cards: CardIndex): LegalityResult {
  const hasDomains = domainIdentity(deck, cards) !== undefined;

  const checked = [
    ...SHAPE_CHECKS,
    ...COPY_CHECKS,
    ...(hasDomains ? DOMAIN_IDENTITY_CHECKS : []),
  ];

  const violations = [
    ...checkShape(deck, cards),
    ...checkCopies(deck, cards),
    ...(hasDomains ? checkDomainIdentity(deck, cards) : []),
  ];

  return {
    legal: violations.length === 0,
    violations,
    checked,
    coverage: coverageFor(checked),
  };
}

export { checkShape, mainDeckCount, zoneCount } from "./shape.js";
export { checkCopies, copiesByName, MAX_COPIES_PER_NAME } from "./copies.js";
export { checkDomainIdentity, domainIdentity, IDENTITY_SIZE, UNIVERSAL_DOMAIN } from "./domains.js";
