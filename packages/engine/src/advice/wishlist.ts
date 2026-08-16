/**
 * **What to look for when you are trading** — every deck you own, read at once.
 *
 * ⚠️ **This is the one read that spans decks.** Everything else in `advice/` answers a
 * question about *a* deck; a copy shortfall is invisible from inside one. Two decks each
 * legally running two copies of a card you own two of are both legal, both pass every one of
 * the 33 checks, and **cannot be sleeved at the same time**. Nothing in the legality layer is
 * wrong about that — the rules are per deck, and the constraint is per shelf.
 *
 * ## Three kinds of want, and they are not the same errand
 *
 * - 🔴 **`blocking`** — the decks together need more copies than exist in the boxes. Until
 *   this is fixed, one of the decks cannot be built while the other is. Buy these first.
 * - 🟢 **`spare`** — copies sitting in the boxes that **no deck is playing**. Costs nothing
 *   and needs no trade: the cards are already yours. Listed above `upgrade` for exactly that
 *   reason — free improvement outranks a shopping list.
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
import { deckEntries, isCollected } from "../legality/entries.js";

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

/**
 * The most copies of one name a single deck may register.
 *
 * ⚠️ **A battlefield is one per deck, not three.** L6 (CR 103.4.c / TR 402.1) requires
 * battlefield *names* to be unique, so "you own five and play one, add more" is advice the
 * gate will refuse every time. Five of thirty-two rows were that claim before this existed —
 * and the way it was found is worth recording: a deck built to take a second `Risen Altar`
 * was rejected by `checkLegality` on L6, which is the same list saying no to its own suggestion.
 */
const capFor = (facts: { types?: readonly string[] } | undefined): number =>
  (facts?.types ?? []).includes("battlefield") ? 1 : MAX_COPIES_PER_NAME;

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
  /**
   * The number this row is about, and ⚠️ **it means something different per `kind`** — which
   * is why the view labels each section rather than showing a bare column of numbers.
   *
   * - `blocking` — copies to **find**, the deficit against what the decks need
   * - `upgrade` — copies to **find**, the distance to the legal three
   * - `spare` — copies you **already own and could add today**, no trade required
   */
  short: number;
  kind: "blocking" | "spare" | "upgrade";
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
  /** Per-name legal ceiling in one deck — three, or one for a battlefield (L6). */
  const cap = new Map<string, number>();

  for (const { id, name: deckName, deck } of decks) {
    /**
     * ⚠️ **Every zone the collection covers, not just the ones copy limits span.**
     *
     * `countedEntries` is the right set for L13/L16 — the limit spans Main Deck and sideboard
     * and nothing else — and it is the *wrong* set here. This question is not "is the deck
     * legal", it is "do the cards exist on the shelf", and a battlefield is a physical card
     * you own a finite number of. Registering the same battlefield in two decks is perfectly
     * legal and still impossible if you own one.
     *
     * `isCollected` is the distinction already drawn for exactly this purpose (D-061): every
     * zone except runes, which are a fixture of the format rather than something you collect.
     */
    const perName = new Map<string, number>();
    for (const e of deckEntries(deck, cards).filter(isCollected)) {
      perName.set(e.name, (perName.get(e.name) ?? 0) + e.quantity);
      cap.set(e.name, capFor(e.facts));
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
    /**
     * ⚠️ **Copies in the box that no deck is playing.** Free improvement — the cards are
     * already yours, so this outranks anything you would have to trade for.
     *
     * Counted against the whole shelf rather than per deck on purpose: with two decks sharing
     * a card, "this deck could run one more" is only true if the other deck gives one up, and
     * a list that quietly assumed that would be recommending a swap it never mentioned.
     * `owned - needed` is the number that is unambiguously idle.
     */
    const idle = owned - needed;
    /**
     * ⚠️ **Capped by what a deck can legally add, not by how many are idle.** Reporting the
     * raw idle count put *"+9 Brutal Hunter"* at the top of the list against a deck already
     * running two of a legal three — nine copies are genuinely spare, and eight of them have
     * nowhere to go. The number has to be the one you can act on.
     */
    const ceiling = cap.get(name) ?? MAX_COPIES_PER_NAME;
    const room = Math.max(0, ...used.map((u) => ceiling - u.copies));
    const canAdd = Math.min(idle, room);
    if (canAdd > 0) {
      rows.push({ name, owned, needed, short: canAdd, kind: "spare", decks: used });
      continue;
    }

    // An upgrade is only a want if a deck is actually playing every copy there is. A deck
    // running two of a card you own three of has made a choice, not hit a wall.
    const maxedOut = used.some((u) => u.copies >= owned);
    if (maxedOut && owned < ceiling) {
      rows.push({
        name,
        owned,
        needed,
        short: ceiling - owned,
        kind: "upgrade",
        decks: used,
      });
    }
  }

  // Blocking first — those stop a deck existing. Then spare, which costs nothing to act on.
  const rank = { blocking: 0, spare: 1, upgrade: 2 } as const;
  return rows.sort(
    (a, b) => rank[a.kind] - rank[b.kind] || b.short - a.short || a.name.localeCompare(b.name),
  );
}
