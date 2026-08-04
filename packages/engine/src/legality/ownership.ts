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
 * ⚠️ **Ownership is *stored* per printing and *compared* per name** (DATA-MODEL §2). Three
 * copies of a name spread across three different arts is three cards you own — the arts are
 * interchangeable in a sleeve, and a deck slot demands a card rather than a particular
 * picture of one.
 *
 * This used to compare printing to printing, which said you were three short while holding
 * three of the card, because the gallery had recorded a different art from the one you
 * registered. It contradicted the sentence directly above it in this very file. The
 * distinction DATA-MODEL §2 draws is about *what a copy is* — and a copy is a physical card.
 */

export const OWNERSHIP_CHECKS = ["L26", "L27"] as const;

/** Names shown before the count takes over. */
const NAMED = 3;

/**
 * ⚠️ **Synthesise, never enumerate** (D-039). A deck missing 33 cards across 11 names
 * produced a paragraph naming every one — true, unreadable, and precisely the failure the
 * project's own principle exists to prevent. The number is the fact; a few names are the
 * grounding; the rest belongs behind a "show me" the caller can build from `counts`.
 */
function summarise(kind: "short" | "committed", names: string[], copies: number): string {
  const sample = names.slice(0, NAMED).join(", ");
  const rest = names.length - NAMED;
  const tail = rest > 0 ? `${sample} and ${rest} more` : sample;
  return kind === "short"
    ? `${copies} ${copies === 1 ? "copy" : "copies"} short across ` +
        `${names.length} ${names.length === 1 ? "name" : "names"} — ${tail}.`
    : `${copies} ${copies === 1 ? "copy" : "copies"} already sleeved into a built deck, across ` +
        `${names.length} ${names.length === 1 ? "name" : "names"} — ${tail}.`;
}

export function checkOwnership(
  deck: Deck,
  cards: CardIndex,
  ownership: OwnershipContext,
): Warning[] {
  const warnings: Warning[] = [];
  const { collection, committed = {} } = ownership;

  // Needed per name, summed across zones — the same card in the Main Deck and the sideboard
  // is still one physical card that cannot be in two sleeves at once.
  const needed = new Map<string, number>();
  for (const e of deckEntries(deck, cards)) {
    if (!e.cardId) continue;
    needed.set(e.name, (needed.get(e.name) ?? 0) + e.quantity);
  }

  /** Collapse a printing-keyed tally onto names, which is what a deck actually asks for. */
  const perName = (source: Readonly<Record<string, number>>) => {
    const out = new Map<string, number>();
    for (const [cardId, n] of Object.entries(source)) {
      const name = cards.nameOf(cardId) ?? cardId;
      out.set(name, (out.get(name) ?? 0) + n);
    }
    return out;
  };
  const ownedByName = perName(collection);
  const committedByName = perName(committed);

  const short: string[] = [];
  const conflicted: string[] = [];
  let shortCopies = 0;
  let conflictedCopies = 0;

  for (const [name, want] of [...needed].sort(([a], [b]) => a.localeCompare(b))) {
    const owned = ownedByName.get(name) ?? 0;
    const spokenFor = committedByName.get(name) ?? 0;

    // L26 — do you own enough copies at all?
    if (want > owned) {
      short.push(name);
      shortCopies += want - owned;
    }
    // L27 — of the ones you own, are some already sleeved into a BUILT deck? (D-017)
    else if (want > owned - spokenFor) {
      conflicted.push(name);
      conflictedCopies += want - (owned - spokenFor);
    }
  }

  if (short.length > 0) {
    warnings.push({ check: "L26", message: summarise("short", short, shortCopies) });
  }
  if (conflicted.length > 0) {
    warnings.push({ check: "L27", message: summarise("committed", conflicted, conflictedCopies) });
  }

  return warnings;
}
