import type { Domain } from "@forge/engine";
import { isDeckable, search, zoneFor, type Card, type Printing } from "./cards.js";

/**
 * What the gallery is showing, and in what order.
 *
 * Kept out of the component because it is the part with rules in it: the guided flow reads
 * the same predicate the manual tabs do, so "show me what I can pick next" and "show me
 * battlefields" cannot drift apart.
 */

export type Tab = "all" | "legend" | "main" | "battlefield" | "rune";

export type SortKey = "release" | "cost" | "might" | "name" | "copies";
export interface Sort {
  key: SortKey;
  /** `release` ascending is the order the cards were printed, which is the sane default. */
  desc: boolean;
}

export interface Filters {
  tab: Tab;
  query: string;
  /**
   * Show only cards you physically own.
   *
   * ⚠️ **Ownership is per printing; this filter is per name.** You own three copies of a
   * card whether they are three of the same art or three different ones, so the count is
   * summed across a card's printings — the same collapse the gallery already does
   * (DATA-MODEL §2).
   */
  owned: boolean;
  /** Empty means "any". Otherwise a card must sit entirely inside the chosen domains. */
  domains: Domain[];
  /** Empty means "any". `unit`, `spell`, `gear`, `battlefield`, `rune`. */
  types: string[];
  /** Restrict to a Legend's Domain Identity — the guided flow sets this. */
  identity?: readonly Domain[] | undefined;
  /** Restrict to champion units carrying this tag — the guided flow sets this. */
  championTag?: string | undefined;
  sort: Sort;
}

export const NO_FILTERS: Filters = {
  tab: "all",
  query: "",
  owned: false,
  domains: [],
  types: [],
  sort: { key: "release", desc: false },
};

const inTab = (card: Card, tab: Tab): boolean => {
  if (tab === "legend") return card.types.includes("legend");
  if (tab === "rune") return card.types.includes("rune");
  if (tab === "battlefield") return card.types.includes("battlefield");
  // ⚠️ **`all` is the cards you build with — Legends and the Main Deck pool.** It is not
  // "every printing that exists", and the three it drops are each dropped for their own
  // reason. **Battlefields** are the one landscape card, so a tile spans two columns and
  // interrupts the grid wherever it falls; 66 of them scattered through the set order broke
  // up the one tab you scroll to browse, and they have their own zone, their own cap and
  // their own tab. **Runes** are 6 names you never choose — a Legend fills all twelve slots
  // by identity the moment you pick it. **Tokens** are created during play and can never be
  // registered (DATA-MODEL §1), so offering one is offering something the rules refuse.
  if (tab === "all")
    return (
      !card.types.includes("battlefield") &&
      !card.types.includes("rune") &&
      !card.superTypes.includes("token")
    );
  return isDeckable(card) && zoneFor(card) === "MAIN";
};

/** `colorless` is legal under every identity (L12), so it never excludes a card. */
const insideIdentity = (card: Card, identity: readonly Domain[]): boolean =>
  card.domains.every((d) => d === "colorless" || identity.includes(d));

const compare = (
  a: Card,
  b: Card,
  sort: Sort,
  collection: Readonly<Record<string, number>>,
): number => {
  const dir = sort.desc ? -1 : 1;
  switch (sort.key) {
    // Deepest holdings first. Only offered inside the Owned view, where it is the one
    // ordering the gallery cannot already express — everywhere else every card is 0.
    case "copies":
      return (
        dir * (ownedCount(b, collection) - ownedCount(a, collection)) ||
        a.name.localeCompare(b.name)
      );
    case "cost":
      // Cards with no cost sort last either way rather than pretending to be free.
      return dir * ((a.energy ?? 99) - (b.energy ?? 99)) || a.release - b.release;
    case "might":
      return dir * ((a.might ?? -1) - (b.might ?? -1)) || a.release - b.release;
    case "name":
      return dir * a.name.localeCompare(b.name);
    default:
      return dir * (a.release - b.release);
  }
};

/** Copies owned of a card, summed across every printing of that name. */
export const ownedCount = (card: Card, collection: Readonly<Record<string, number>>): number =>
  card.printings.reduce((n, p) => n + (collection[p.id] ?? 0), 0);

/**
 * Cards Forge treats as always on hand — **D-061**.
 *
 * Runes are a fixture of the format rather than something you collect: every deck registers
 * exactly twelve, there are six names in the game, and a Legend fills them for you. Forge
 * therefore never asks whether you own one.
 */
export const alwaysOnHand = (card: Card): boolean => card.types.includes("rune");

/** L13 — three copies of a name. The game's cap, and the only one Forge can apply blind. */
export const MAX_COPIES = 3;

/**
 * How many copies of a card the workshop will take.
 *
 * ⚠️ **The boxes cap a deck as hard as the rulebook does.** L13 allows three of a name;
 * owning one allows one. Counting to three regardless let a deck fill up with copies that do
 * not exist — legal on paper and unsleeveable at the table, which is the precise confusion
 * this tool was built to remove.
 *
 * This does **not** touch the verdict. Ownership stays a warning there and can never make a
 * deck illegal ([LEGALITY §2](../../../docs/spec/LEGALITY.md)) — a tile declining a click and
 * an engine calling a deck illegal are different statements, and the distinction is the point
 * of the whole tool.
 *
 * **Two exemptions.** Runes are not collected — a Legend fills twelve of them and the
 * collection has no rows to count, so a cap would read as "you own none of the six runes that
 * exist". A Legend is the deck's *identity* rather than a copy in it; blacking one out would
 * stop the build at step one with nothing to click past it.
 *
 * @param tracked Whether the collection holds anything at all. **Empty means "not entered
 * yet", never "you own nothing"** — without this the whole gallery greys out in the moment
 * before D1 answers, and stays that way for a collection that has never been imported.
 */
export const copyLimit = (
  card: Card,
  collection: Readonly<Record<string, number>>,
  tracked: boolean,
): number => {
  if (alwaysOnHand(card) || card.types.includes("legend")) return Infinity;
  if (!tracked) return MAX_COPIES;
  return Math.min(MAX_COPIES, ownedCount(card, collection));
};

export function apply(
  cards: Card[],
  f: Filters,
  collection: Readonly<Record<string, number>> = {},
): Card[] {
  const picked = cards.filter((card) => {
    // ⚠️ Runes survive the Owned filter with no rows behind them (D-061). Hiding them would
    // empty the Rune tab the moment you filtered to what you own, for cards Forge has
    // decided you always have.
    if (f.owned && !alwaysOnHand(card) && ownedCount(card, collection) === 0) return false;
    if (!inTab(card, f.tab)) return false;
    if (f.identity && !insideIdentity(card, f.identity)) return false;
    if (f.championTag) {
      // L18 + L19 — the tag must match, and Signature units are ineligible.
      if (!card.types.includes("unit")) return false;
      if (!card.superTypes.includes("champion")) return false;
      if (card.superTypes.includes("signature")) return false;
      if (!card.tags.includes(f.championTag)) return false;
    }
    if (f.types.length > 0 && !f.types.some((t) => card.types.includes(t))) return false;
    if (f.domains.length > 0 && !insideIdentity(card, f.domains)) return false;
    return true;
  });

  // Search ranks by relevance, so it decides the order when there is a query at all.
  const found = f.query.trim() ? search(picked, f.query) : picked;
  return f.query.trim() ? found : [...found].sort((a, b) => compare(a, b, f.sort, collection));
}

/** One printing you physically hold. The Owned view's row, as opposed to the gallery's card. */
export interface ShelfRow {
  card: Card;
  printing: Printing;
  owned: number;
}

/**
 * Where a printing sits in the sequence of everything ever printed.
 *
 * ⚠️ **A card's `release` cannot order a shelf.** `release` is where the *name* first
 * appeared, so ordering printings by it filed every reprint next to its original — the SFD
 * printing of Yasuo, Windrider sitting inside the OGN block because the OGN one is there.
 * 42 cards are reprinted, which is 42 places the collection contradicted the boxes it is
 * supposed to describe. A shelf is physical objects, and they are sorted by the set they
 * came out of.
 */
export const printingRank = (p: Printing, sets: readonly string[]): number => {
  const set = sets.indexOf(p.set);
  // An unknown set goes last, not first: a pool cached before a new set shipped should
  // degrade to "at the end", never to "before everything you own".
  const rank = set === -1 ? sets.length : set;
  return rank * 1_000_000 + p.n * 4 + (p.star ? 2 : 0) + (p.alt ? 1 : 0);
};

/**
 * The Owned view's order — the gallery's sort keys, applied to printings instead of names.
 *
 * **Every key falls back to set order**, so rows that tie never sit in an arbitrary
 * arrangement that shifts as you enter more cards.
 */
export const orderShelf = (
  rows: readonly ShelfRow[],
  sort: Sort,
  sets: readonly string[],
): ShelfRow[] => {
  const dir = sort.desc ? -1 : 1;
  const rank = (r: ShelfRow): number => printingRank(r.printing, sets);
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      // Deepest holdings first, and ⚠️ the direction toggle applies — the Owned view used
      // to hardcode descending, so pressing the chip a second time changed the arrow and
      // nothing else.
      case "copies":
        return dir * (b.owned - a.owned) || rank(a) - rank(b);
      case "cost":
        return dir * ((a.card.energy ?? 99) - (b.card.energy ?? 99)) || rank(a) - rank(b);
      case "might":
        return dir * ((a.card.might ?? -1) - (b.card.might ?? -1)) || rank(a) - rank(b);
      case "name":
        return dir * a.card.name.localeCompare(b.card.name) || rank(a) - rank(b);
      default:
        return dir * (rank(a) - rank(b));
    }
  });
};

export const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "release", label: "Set order" },
  { key: "cost", label: "Energy" },
  { key: "might", label: "Might" },
  { key: "name", label: "Name" },
  // ⚠️ Only meaningful with the Owned filter on; the toolbar hides it otherwise.
  { key: "copies", label: "Copies held" },
];

export const TYPES = ["unit", "spell", "gear", "battlefield", "rune"];
export const DOMAIN_LIST: Domain[] = ["fury", "calm", "mind", "body", "chaos", "order"];
