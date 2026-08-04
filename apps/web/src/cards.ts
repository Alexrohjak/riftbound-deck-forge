import { staticCardIndex, type CardIndex, type Domain, type Zone } from "@forge/engine";

/**
 * `F3` — the full card pool: 935 cards, 1,180 printings.
 *
 * **Fetched, not bundled.** 95 KB gzipped is small enough to ship either way, but as a
 * separate asset it caches independently of the code, so a deploy that changes one line of
 * UI does not make every phone re-download the card pool.
 *
 * **A card is a name; a printing is an object in a box.** The gallery lists cards; the
 * alternate arts live behind each one and matter only when you choose which copy to sleeve.
 * That is the same printing-vs-name split the rules already force (DATA-MODEL §2), which is
 * why the deck stores printing ids and legality counts names.
 */

export interface Printing {
  id: string;
  code: string;
  set: string;
  n: number;
  img: string;
  /** Showcase / foil treatment. */
  star?: boolean;
  /** Alternate art of the same collector number. */
  alt?: boolean;
}

export interface Card {
  name: string;
  energy: number | null;
  power: number | null;
  might: number | null;
  types: string[];
  superTypes: string[];
  domains: Domain[];
  tags: string[];
  text: string;
  printings: Printing[];
  /** Present only when true. Banned cards are shown, never hidden — just marked. */
  banned?: boolean;
  /**
   * Legends only, derived from Signature cards (L32). ⚠️ **Not** `superTypes`, which only
   * 9 of 118 Legend printings carry.
   */
  championTag?: string;
}

export interface CardPool {
  cards: Card[];
  /** Every printing id → its card. The deck holds printing ids. */
  byPrinting: Map<string, Card>;
  byName: Map<string, Card>;
  /** What the engine needs: name, domains and energy per printing id. */
  index: CardIndex;
}

interface RawIndex {
  schema: string;
  counts: { names: number; printings: number; legends: number; banned: number };
  cards: Card[];
}

export function buildPool(raw: RawIndex): CardPool {
  const byPrinting = new Map<string, Card>();
  const byName = new Map<string, Card>();
  const facts: Record<string, { name: string; domains: Domain[]; energy: number | null }> = {};

  for (const card of raw.cards) {
    byName.set(card.name, card);
    for (const printing of card.printings) {
      byPrinting.set(printing.id, card);
      // Every printing of a name resolves to the same facts — which is the point of the
      // collapse, and what makes copy limits count correctly across alternate arts.
      facts[printing.id] = { name: card.name, domains: card.domains, energy: card.energy };
    }
  }

  return { cards: raw.cards, byPrinting, byName, index: staticCardIndex(facts) };
}

export async function loadPool(): Promise<CardPool> {
  const response = await fetch("/cards.json");
  if (!response.ok) throw new Error(`Card pool failed to load: ${response.status}`);
  return buildPool((await response.json()) as RawIndex);
}

/**
 * A thumbnail URL at the width you will actually display.
 *
 * ⚠️ **Never render `printing.img` directly in a list.** The gallery images are full card
 * scans at **827 KB each** — a 120-row list would pull ~99 MB and lock the renderer, which
 * is exactly what it did the first time. At `w=96` the same image is 28 KB, a 30× cut, and
 * `fm=webp` takes another bite. The collection tool has always sized its images this way;
 * this is the same trick, in the app.
 */
export const thumb = (printing: Printing, width: number): string =>
  `${printing.img}&w=${width}&q=75&fm=webp`;

/** Where a card belongs, from its type. Runes and battlefields are registered separately. */
export function zoneFor(card: Card): Zone {
  if (card.types.includes("rune")) return "RUNE";
  if (card.types.includes("battlefield")) return "BATTLEFIELD";
  return "MAIN";
}

/**
 * Cards you could put in a deck at all.
 *
 * Tokens are excluded: they are created during play and never registered (DATA-MODEL §1),
 * so listing them in a deckbuilder is offering something the rules do not allow.
 */
export const isDeckable = (card: Card): boolean =>
  !card.superTypes.includes("token") && !card.types.includes("legend");

/**
 * Search over 935 cards. Name first, then the rules text — typing "deflect" should find
 * the cards that do it, not just one whose name happens to contain it.
 */
export function search(cards: Card[], query: string): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  const terms = q.split(/\s+/);
  const scored: Array<{ card: Card; rank: number }> = [];

  for (const card of cards) {
    const name = card.name.toLowerCase();
    const text = card.text.toLowerCase();
    const tags = card.tags.join(" ").toLowerCase();
    if (!terms.every((t) => name.includes(t) || text.includes(t) || tags.includes(t))) continue;
    // Exact and prefix name matches first: searching "jinx" should not bury the Jinx cards
    // under everything whose rules text mentions her.
    const rank = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : 3;
    scored.push({ card, rank });
  }

  return scored
    .sort((a, b) => a.rank - b.rank || a.card.name.localeCompare(b.card.name))
    .map((s) => s.card);
}
