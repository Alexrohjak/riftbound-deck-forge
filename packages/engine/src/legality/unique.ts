import type { CardIndex, Deck, Violation } from "../types.js";
import { countedEntries, totalByName } from "./entries.js";

/**
 * L28 · L29 — the `Unique` keyword.
 *
 * ⚠️ **This rule was found only by reading the PDF.** No community source mentioned it, and
 * it *overrides* the 3-copy limit: a card whose text carries `[Unique]` is capped at **one**
 * copy across Main Deck and sideboard (CR 825.3.a). A deck running three Forgefire Capes
 * passes every copy check and is illegal.
 *
 * **L29 is an interaction, not a separate rule.** The 3-Signature allowance is unaffected by
 * Unique, and each Unique name is still capped at 1 — so an Ornn deck may run all three Ornn
 * equipment, one copy each (CR 825.3.b). That falls out of L20 and L28 both applying with no
 * special case, which is exactly why it needs a test rather than code: T12 proves the absence
 * of a wrong special case.
 */

export const UNIQUE_CHECKS = ["L28", "L29"] as const;

/** CR 825.3.a. */
export const MAX_UNIQUE_COPIES = 1;

/**
 * The keyword as it appears in rules text. Matched case-insensitively and in brackets, so
 * "unique" appearing in flavour prose cannot trip it.
 */
const UNIQUE_KEYWORD = /\[unique\]/i;

export const isUnique = (text: string | undefined): boolean => UNIQUE_KEYWORD.test(text ?? "");

export function checkUnique(deck: Deck, cards: CardIndex): Violation[] {
  const counts = totalByName(countedEntries(deck, cards), (e) => isUnique(e.facts?.text));

  return [...counts]
    .filter(([, count]) => count > MAX_UNIQUE_COPIES)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      check: "L28",
      citation: "CR 825.3.a",
      message:
        `"${name}" is [Unique] and appears ${count} times; Unique caps at ` +
        `${MAX_UNIQUE_COPIES} copy, which overrides the 3-copy limit.`,
    }));
}
