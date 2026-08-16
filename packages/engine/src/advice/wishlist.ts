/**
 * **What to look for when you are trading** — every deck you own, read at once.
 *
 * ⚠️ **This is the one read that spans decks.** Everything else in `advice/` answers a
 * question about *a* deck; a copy shortfall is invisible from inside one. Two decks each
 * legally running two copies of a card you own two of are both legal, both pass every one of
 * the 33 checks, and **cannot be sleeved at the same time**. Nothing in the legality layer is
 * wrong about that — the rules are per deck, and the constraint is per shelf.
 *
 * ## Two kinds of want, and they are not the same errand
 *
 * - 🔴 **`blocking`** — the decks together need more copies than exist in the boxes. Until
 *   this is fixed, one of the decks cannot be built while the other is. Buy these first.
 * - 🟠 **`upgrade`** — a deck plays **every copy it owns** and owns fewer than the legal
 *   maximum. Nothing is broken; the deck would simply rather draw the card more often.
 *
 * ## What it deliberately does not do
 *
 * ⚠️ **It never suggests a card you do not own.** "You should acquire X" is a claim about
 * what would improve a deck, and that judgement needs a plan, a pool read and a builder's
 * intent — it is `legend`/`counter`/`sideboard` work, not arithmetic over a shelf. This
 * counts copies of cards already chosen, and stops. Suggesting new cards from here would be
 * the tool inventing a deck nobody asked it to build ([D-042](../../../../docs/DECISIONS.md#d-042)).
 *
 * ⚠️ **Runes are not counted** — [D-061](../../../../docs/DECISIONS.md#d-061). Every deck
 * registers twelve, there are six names in the game, and Forge does not ask whether you own
 * one. Counting them would put twelve permanent shortfalls at the top of every list.
 */
import type { CardIndex, Deck } from "../types.js";
import { MAX_COPIES_PER_NAME } from "../legality/copies.js";
import { countedEntries } from "../legality/entries.js";

/** One deck to read, with the name to show against it. */
export interface WishlistDeck {
  id: string;
  name: string;
  deck: Deck;
}

/** Which deck wants a card, and how many copies it asks for. */
export interface WishlistUse {
  id: string;
  name: string;
  copies: number;
}

export interface WishlistRow {
  name: string;
  /**
   * ⚠️ **Summed across every printing of the name**, which is the caller's job — see the
   * `ownedByName` parameter. Copy limits are counted per name (L13, L16, TR 601.1.c.3), so a
   * card owned as two different arts is two copies of one card, not one copy of two.
   */
  owned: number;
  /** Copies all the decks want between them. */
  needed: number;
  /** How many to look for. For `blocking`, the deficit; for `upgrade`, the distance to three. */
  short: number;
  kind: "blocking" | "upgrade";
  decks: WishlistUse[];
}

/**
 * Read every deck against the boxes.
 *
 * `ownedByName` must already be summed across printings — the engine has no printing→name
 * map, and the app that does (`ownedCount` in `filters.ts`) is the one place that mapping
 * should live.
 */
export function wishlist(
  decks: readonly WishlistDeck[],
  cards: CardIndex,
  ownedByName: ReadonlyMap<string, number>,
): WishlistRow[] {
  const uses = new Map<string, WishlistUse[]>();

  for (const { id, name: deckName, deck } of decks) {
    // Per name, not per printing: two arts of one card are one name against the limit. Runes
    // are excluded by `countedEntries`, which spans Main Deck and sideboard only.
    const perName = new Map<string, number>();
    for (const e of countedEntries(deck, cards)) {
      perName.set(e.name, (perName.get(e.name) ?? 0) + e.quantity);
    }
    for (const [cardName, copies] of perName) {
      const list = uses.get(cardName) ?? [];
      list.push({ id, name: deckName, copies });
      uses.set(cardName, list);
    }
  }

  const rows: WishlistRow[] = [];
  for (const [name, used] of uses) {
    const owned = ownedByName.get(name) ?? 0;
    const needed = used.reduce((n, u) => n + u.copies, 0);
    used.sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));

    if (needed > owned) {
      rows.push({ name, owned, needed, short: needed - owned, kind: "blocking", decks: used });
      continue;
    }
    // An upgrade is only a want if a deck is actually playing every copy there is. A deck
    // running two of a card you own three of has made a choice, not hit a wall.
    const maxedOut = used.some((u) => u.copies >= owned);
    if (maxedOut && owned < MAX_COPIES_PER_NAME) {
      rows.push({
        name,
        owned,
        needed,
        short: MAX_COPIES_PER_NAME - owned,
        kind: "upgrade",
        decks: used,
      });
    }
  }

  // Blocking first — those are the ones stopping a deck existing — then by size of the gap.
  const rank = { blocking: 0, upgrade: 1 } as const;
  return rows.sort(
    (a, b) => rank[a.kind] - rank[b.kind] || b.short - a.short || a.name.localeCompare(b.name),
  );
}
