import type { CardIndex, Deck, Violation } from "../types.js";
import { deckEntries, has, isType } from "./entries.js";
import { domainIdentity } from "./domains.js";

/**
 * L31 — the Rune Deck holds **only Basic Runes of the Domain Identity**.
 *
 * Another of the six found by reading CR 103.3.a.1 and 164.1 directly. L11 already holds
 * runes to the identity; this adds the part that is easy to miss — the rune deck may contain
 * *nothing but basic runes*. There are only six distinct rune names in the game, so anything
 * else in that zone is a registration error rather than a strategic choice.
 */

export const RUNE_CHECKS = ["L31"] as const;

export function checkRunes(deck: Deck, cards: CardIndex): Violation[] {
  const runeZone = deckEntries(deck, cards).filter((e) => e.zone === "RUNE");

  const offending = [
    ...new Set(
      runeZone
        // Skip printings we know nothing about — under-report rather than invent a verdict.
        .filter((e) => e.facts)
        .filter((e) => !isType(e.facts, "rune") || !has(e.facts, "basic"))
        .map((e) => e.name),
    ),
  ].sort();

  if (offending.length === 0) return [];

  return [
    {
      check: "L31",
      citation: "CR 103.3.a.1, 164.1",
      message: `The Rune Deck may contain only Basic Runes; found ${offending.join(", ")}.`,
    },
  ];
}

/** Exported for the identity check's benefit — the rune zone is judged by the Legend's pair. */
export { domainIdentity };
