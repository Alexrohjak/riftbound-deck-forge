import { cardFactsFrom, staticCardIndex, type CardFacts, type CardIndex, type Deck, type Domain, type Zone,
  type PoolCard,
} from "@forge/engine";

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
  /** Position in the sequence of everything ever printed — set order, then collector number. */
  release: number;
  energy: number | null;
  power: number | null;
  might: number | null;
  types: string[];
  superTypes: string[];
  domains: Domain[];
  tags: string[];
  text: string;
  /** Derived classification, present for the 814 main-deck cards. */
  role?: string;
  timing?: string;
  produces?: string[];
  consumes?: string[];
  printings: Printing[];
  /** Present only when true. Banned cards are shown, never hidden — just marked. */
  banned?: boolean;
  /** Battlefields are landscape (1039×744) and must not be drawn in a portrait box. */
  landscape?: boolean;
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
  /** Public collector code → printing id. The bridge for importing an older export. */
  byCode: Map<string, string>;
  /** Set codes in release order — the entry field works one set at a time. */
  sets: string[];
  /** What the engine needs: name, domains and energy per printing id. */
  index: CardIndex;
  /**
   * The same facts as a list, which is the shape `suggest()` takes. Exposed rather than
   * rebuilt at the call site: the engine must never be handed a pool assembled by different
   * rules from the one legality ran against, or it would recommend cards the checks reject.
   */
  pool: PoolCard[];
}

interface RawIndex {
  schema: string;
  counts: { names: number; printings: number; legends: number; banned: number };
  cards: Card[];
}

export function buildPool(raw: RawIndex): CardPool {
  const byPrinting = new Map<string, Card>();
  const byName = new Map<string, Card>();
  const facts: Record<string, CardFacts> = {};

  for (const card of raw.cards) {
    byName.set(card.name, card);
    for (const printing of card.printings) {
      byPrinting.set(printing.id, card);
      // Every printing of a name resolves to the same facts — which is the point of the
      // collapse, and what makes copy limits count correctly across alternate arts.
      //
      // ⚠️ Supply everything the engine can use. Omitting a field does not weaken a check,
      // it *disables* it — a name-only index silently skips the ban list, the Signature cap
      // and Unique, and reports a smaller `checked` list rather than a wrong verdict.
      // ⚠️ One mapping, shared with the CLI (D-047). Both consumers used to build this by
      // hand and they drifted: the CLI's lost `power`, `role` and `timing` without anything
      // failing. Whichever side is "correct" today, two of them is the bug.
      facts[printing.id] = cardFactsFrom(card as unknown as Record<string, unknown>);
    }
  }

  const byCode = new Map<string, string>();
  /**
   * The set chips, in the order the game shipped them.
   *
   * ⚠️ **Only a card's base printing votes for its set.** `release` is where a card *first*
   * appeared, so letting every printing vote let a reprint carry an early rank into a late
   * set: Pouty Poro is an OGN card reprinted as UNL-220, and its OGN rank ranked the whole
   * of UNL above SFD. The entry field read `OGN · UNL · VEN · SFD · OGS` — four of the five
   * in the wrong place, on the one screen where you are working set by set through a pile.
   */
  const setOrder = new Map<string, number>();
  for (const card of raw.cards) {
    for (const p of card.printings) byCode.set(p.code, p.id);
    const base = card.printings[0];
    if (!base) continue;
    const seen = setOrder.get(base.set);
    if (seen === undefined || card.release < seen) setOrder.set(base.set, card.release);
  }
  // A set that exists only as reprints still has to be enterable, so it goes to the end
  // rather than being dropped from a list whose job is to cover the whole pool.
  for (const card of raw.cards) {
    for (const p of card.printings) if (!setOrder.has(p.set)) setOrder.set(p.set, Number.MAX_SAFE_INTEGER);
  }
  const sets = [...setOrder].sort((a, b) => a[1] - b[1]).map(([code]) => code);

  return {
    cards: raw.cards,
    byPrinting,
    byName,
    byCode,
    sets,
    index: staticCardIndex(facts),
    pool: Object.entries(facts).map(([cardId, f]) => ({ cardId, facts: f })),
  };
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

/**
 * The same, but sharp on the screen it lands on.
 *
 * ⚠️ **Pass the CSS size, not the pixel size.** Capped at 3×, quality 82 — card text is
 * fine detail and the default 75 was visibly mushing it.
 *
 * Prefer `srcSet` wherever the rendered size is not fixed. This helper guesses once; a
 * srcset lets the browser measure.
 */
/**
 * The width of the scan Riot actually holds, read from the URL it is served under
 * (`…-744x1039.png`). Three shapes exist in the pool: 744-wide portraits (1,088 of them),
 * **1,038–1,040-wide landscape battlefields (all 66)**, and 26 double-resolution cards at
 * 1,488.
 *
 * ⚠️ This is the number every request should be clamped to and none should stop short of.
 * Above it the CDN upscales — more bytes, no more detail. Below it you are throwing away
 * picture you have already been given, which is what made the battlefields look soft.
 */
export const nativeWidth = (printing: Printing): number => {
  const found = /-(\d+)x\d+\.png/.exec(printing.img);
  return found?.[1] ? Number(found[1]) : 744;
};

export const hd = (printing: Printing, cssWidth: number): string => {
  const ratio = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 3);
  const width = Math.min(Math.round(cssWidth * ratio), nativeWidth(printing));
  return `${printing.img}&w=${width}&q=82&fm=webp`;
};

/**
 * A ladder of widths, so the browser can pick one that fits what it is about to draw.
 *
 * ⚠️ **This is the fix for a real defect, not a refinement.** The workshop asked for a
 * 160px image and drew it at 538 — a 3.4× upscale, which is exactly as bad as it sounds.
 * A fixed width cannot work here because the deck panel is *draggable*: the same slot is
 * 200px wide or 800px depending on where you left the grip, and no single guess is right
 * for both. With `srcset` the browser measures the box, multiplies by the pixel ratio, and
 * asks for the rung that fits.
 */
/**
 * ⚠️ **The ladder ends at the printing's own width, whatever that is.** It used to stop at
 * a flat 820 for everything, with a comment claiming the top rung was there for the
 * battlefields — but battlefields are **1,038 wide**, so 820 was the one thing they could
 * never ask for. Every battlefield was served at best a 79% scan and usually far less,
 * which is what made them look soft next to the portraits.
 *
 * Taking the cap from the URL fixes all three shapes at once and cannot drift: portraits
 * stop at 744 (asking for 820 was already an upscale), battlefields reach 1,038, and the 26
 * double-resolution cards reach 1,488.
 */
const LADDER = [160, 260, 400, 620, 820, 1040];

export const srcSet = (printing: Printing): string => {
  const native = nativeWidth(printing);
  const rungs = [...LADDER.filter((w) => w < native), native];
  return rungs.map((w) => `${printing.img}&w=${w}&q=82&fm=webp ${w}w`).join(", ");
};

/**
 * The exact art a deck slot holds, rather than the card's default coat.
 *
 * ⚠️ **A deck stores printings; the gallery collapses them.** Everywhere the deck is *drawn*
 * has both facts to hand — the `Card`, and the printing id the slot was saved with — and
 * reaching for `printings[0]` because it is shorter silently discards the second one. That is
 * what made picking an alternate art look like it did nothing: the choice was written to the
 * deck and to D1, the detail view marked it correctly on reopen, and every tile in the tray
 * carried on drawing the base art.
 *
 * Falls back to the default rather than to nothing, so a deck saved with a printing this
 * pool no longer carries still draws the card instead of an empty slot.
 */
export const printingOf = (card: Card, cardId: string): Printing | undefined =>
  card.printings.find((p) => p.id === cardId) ?? card.printings[0];

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

/**
 * Card text carries Riot's symbol tokens — `:rb_might:`, `:rb_energy_3:`, `:rb_rune_fury:`.
 * There are 19 of them in the pool and they are unreadable raw, so they render as the thing
 * they stand for. Energy is a number in a ring; runes are named by domain, which is the one
 * place text is allowed to carry domain because a coloured pip inside a sentence would be
 * smaller than the full stop next to it.
 */
export function symbols(text: string): string {
  return text
    .replace(/:rb_energy_(\d+):/g, "($1)")
    .replace(/:rb_rune_rainbow:/g, "[any rune]")
    .replace(/:rb_rune_([a-z]+):/g, (_m, d: string) => `[${d} rune]`)
    .replace(/:rb_exhaust:/g, "[exhaust]")
    .replace(/:rb_might:/g, "Might")
    .replace(/:([a-z0-9_]+):/g, "");
}

/**
 * Copies of a card already committed to a deck, **counted by name** (DATA-MODEL §2).
 *
 * ⚠️ **The Chosen Champion counts.** It is a Main Deck card that happens to live in its own
 * field, so it counts toward L13's three-per-name and toward what your boxes can supply.
 * Counting only `slots` let you choose a Champion and then add three more copies of it — four
 * in a 40 that allows three, and one more than you owned. The engine caught the violation; the
 * tile that should have refused the click did not, which is the worse of the two failures
 * because it happens first.
 */
export function copiesInDeck(deck: Deck, pool: CardPool, name: string): number {
  const inSlots = deck.slots
    .filter((s) => pool.byPrinting.get(s.cardId)?.name === name)
    .reduce((n, s) => n + s.quantity, 0);
  const champion = pool.byPrinting.get(deck.chosenChampionCardId);
  return inSlots + (champion?.name === name ? 1 : 0);
}
