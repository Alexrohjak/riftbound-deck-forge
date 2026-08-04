import type { CardIndex, Deck, OwnershipContext, Warning } from "../types.js";
import { deckEntries } from "./entries.js";

/**
 * L26 · L27 — ownership. **Warnings, never violations.**
 *
 * LEGALITY.md is unambiguous: *"a deck can be perfectly legal and unbuildable. These must
 * never be conflated — the distinction is the point of the whole tool."* So nothing here can
 * make `legal` false, and these travel in their own array. Forge exists to answer *what can I
 * build from what I own*, which means it has to be able to say "this deck is legal, and you
 * are two cards short" as one sentence rather than one failure.
 *
 * ⚠️ **Ownership is keyed on printing; legality is keyed on name** (DATA-MODEL §2). Three
 * copies of a name spread across three different arts is three cards you own, and this is the
 * one place in the engine where that distinction is load-bearing in the printing direction.
 */

export const OWNERSHIP_CHECKS = ["L26", "L27"] as const;

export function checkOwnership(
  deck: Deck,
  cards: CardIndex,
  ownership: OwnershipContext,
): Warning[] {
  const warnings: Warning[] = [];
  const { collection, committed = {} } = ownership;

  // Needed per printing, summed across zones — the same art used in the Main Deck and the
  // sideboard is still one physical card that cannot be in two sleeves at once.
  const needed = new Map<string, number>();
  for (const e of deckEntries(deck, cards)) {
    needed.set(e.cardId, (needed.get(e.cardId) ?? 0) + e.quantity);
  }

  const short: string[] = [];
  const conflicted: string[] = [];

  for (const [cardId, want] of [...needed].sort(([a], [b]) => a.localeCompare(b))) {
    const owned = collection[cardId] ?? 0;
    const spokenFor = committed[cardId] ?? 0;
    const name = cards.nameOf(cardId) ?? cardId;

    // L26 — do you own enough copies at all?
    if (want > owned) short.push(`${name} (need ${want}, own ${owned})`);
    // L27 — of the ones you own, are some already sleeved into a BUILT deck? (D-017)
    else if (want > owned - spokenFor) {
      conflicted.push(`${name} (need ${want}, ${spokenFor} already in a built deck)`);
    }
  }

  if (short.length > 0) {
    warnings.push({
      check: "L26",
      message: `Not enough copies owned: ${short.join("; ")}.`,
    });
  }
  if (conflicted.length > 0) {
    warnings.push({
      check: "L27",
      message: `Owned, but committed elsewhere: ${conflicted.join("; ")}.`,
    });
  }

  return warnings;
}
