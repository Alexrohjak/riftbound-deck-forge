import type {
  CardIndex,
  Coverage,
  Deck,
  LegalityResult,
  OwnershipContext,
  Violation,
  Warning,
} from "../types.js";
import { checkShape } from "./shape.js";
import { checkCopies } from "./copies.js";
import { DOMAIN_IDENTITY_CHECKS, checkDomainIdentity, domainIdentity } from "./domains.js";
import { CHAMPION_CHECKS, checkChampion } from "./champion.js";
import { UNIQUE_CHECKS, checkUnique } from "./unique.js";
import { FORMAT_CHECKS, checkFormat } from "./format.js";
import { RUNE_CHECKS, checkRunes } from "./runes.js";
import { OWNERSHIP_CHECKS, checkOwnership } from "./ownership.js";

/** Computable from counts and names alone, so these always run. */
export const SHAPE_CHECKS = ["L3", "L4", "L5", "L6", "L7"] as const;
/** L15 is a property of counting by name rather than a separate pass — see `copiesByName`. */
export const COPY_CHECKS = ["L13", "L14", "L15", "L16"] as const;
/** L32 is the rule that the champion tag is *derived*, which `checkChampion` obeys. */
export const DERIVED_TAG_CHECK = ["L32"] as const;

export { DOMAIN_IDENTITY_CHECKS, CHAMPION_CHECKS, UNIQUE_CHECKS, FORMAT_CHECKS, RUNE_CHECKS };
export { OWNERSHIP_CHECKS };

/** Every check `docs/spec/LEGALITY.md` §2 specifies. */
export const SPECIFIED_CHECK_COUNT = 33;

/**
 * ⚠️ **Coverage is per verdict, not per build.** Two calls can run different checks, because
 * what runs depends on what the caller's `CardIndex` knows. Reporting a fixed list would let
 * a name-only lookup claim it had validated Domain Identity or the ban list — silently wrong
 * in exactly the direction `W1` is flagged as the highest correctness risk for.
 *
 * Omit rather than fake (D-022) applies to our own confidence as much as to statistics.
 */
export function coverageFor(checked: readonly string[]): Coverage {
  const complete = checked.length === SPECIFIED_CHECK_COUNT;
  return {
    implemented: checked.length,
    specified: SPECIFIED_CHECK_COUNT,
    complete,
    caveat: complete
      ? `All ${SPECIFIED_CHECK_COUNT} specified checks ran. That means the deck satisfies ` +
        "every rule Forge knows about — read against the Core and Tournament rules as of " +
        "the last review, which is not the same as a judge's ruling."
      : `${checked.length} of ${SPECIFIED_CHECK_COUNT} checks ran: ${checked.join(", ")}. ` +
        "A pass here does NOT mean the deck is tournament-legal.",
  };
}

export interface LegalityOptions {
  /** Supply to run L26/L27. Produces **warnings**, never violations. */
  ownership?: OwnershipContext;
}

/**
 * Validate a deck against the checks this build implements **and this call can run**.
 *
 * Pure: no network, no filesystem, no globals. The browser calls it on every edit (legality
 * is live state, D-042) and the CLI calls it headlessly for Claude Code (D-043) — the same
 * code, which is the whole point of D-047.
 */
export function checkLegality(
  deck: Deck,
  cards: CardIndex,
  options: LegalityOptions = {},
): LegalityResult {
  const hasDomains = domainIdentity(deck, cards) !== undefined;
  // Each group is gated on the data it actually needs, not on one coarse flag. An index
  // that knows domains but not card types must not claim to have checked the Champion.
  const can = cards.capabilities ?? { types: false, text: false, bans: false };
  const hasOwnership = options.ownership !== undefined;

  const checked = [
    ...SHAPE_CHECKS,
    ...COPY_CHECKS,
    ...(hasDomains ? DOMAIN_IDENTITY_CHECKS : []),
    ...(can.types ? CHAMPION_CHECKS : []),
    ...(can.types ? DERIVED_TAG_CHECK : []),
    ...(can.text ? UNIQUE_CHECKS : []),
    ...(can.bans ? FORMAT_CHECKS : []),
    ...(can.types ? RUNE_CHECKS : []),
    ...(hasOwnership ? OWNERSHIP_CHECKS : []),
  ];

  const violations: Violation[] = [
    ...checkShape(deck, cards),
    ...checkCopies(deck, cards),
    ...(hasDomains ? checkDomainIdentity(deck, cards) : []),
    ...(can.types ? checkChampion(deck, cards) : []),
    ...(can.text ? checkUnique(deck, cards) : []),
    ...(can.bans ? checkFormat(deck, cards) : []),
    ...(can.types ? checkRunes(deck, cards) : []),
  ];

  // ⚠️ Warnings never touch `legal`. A deck you cannot afford to build is still legal.
  const warnings: Warning[] = options.ownership
    ? checkOwnership(deck, cards, options.ownership)
    : [];

  return {
    legal: violations.length === 0,
    violations,
    warnings,
    checked,
    coverage: coverageFor(checked),
  };
}

export { checkShape, mainDeckCount, zoneCount } from "./shape.js";
export { checkCopies, copiesByName, MAX_COPIES_PER_NAME } from "./copies.js";
export { checkDomainIdentity, domainIdentity, IDENTITY_SIZE, UNIVERSAL_DOMAIN } from "./domains.js";
export { checkChampion, MAX_SIGNATURE_CARDS } from "./champion.js";
export { checkUnique, isUnique, MAX_UNIQUE_COPIES } from "./unique.js";
export { checkFormat } from "./format.js";
export { checkRunes } from "./runes.js";
export { checkOwnership } from "./ownership.js";
export {
  canPromote,
  committedByPrinting,
  conflictSentence,
  findConflicts,
  holdingsOf,
  overCommitted,
  type Conflict,
  type Holder,
  type Holding,
} from "./commitment.js";
export { deckEntries, countedEntries, isCollected } from "./entries.js";
