import type { CardIndex, Deck } from "../types.js";
import { deckEntries, isCollected } from "./entries.js";

/**
 * Commitment — *"cards sleeved into a built deck stop being available"* (D-017,
 * DATA-MODEL §3).
 *
 * **Derived, never stored.** Commitments always equal the current contents of every `BUILT`
 * deck, so there is nothing to release when one is edited and nothing to reconcile when one
 * is deleted. Storing them would create a second truth that drifts from the first.
 *
 * ⚠️ **A conflict is information, not a wall.** A `DRAFT` deck may freely exceed what is
 * available — it is a plan, and planning around cards currently in another sleeve is a
 * normal thing to do. The one place this hardens into a gate is `DRAFT → BUILT`, which is a
 * claim about physical cardboard and cannot be true twice.
 *
 * ⚠️ **This lives in the engine rather than the app because it is a rule** (D-047). The
 * browser needs it to draw a conflict; the CLI needs it before proposing a deck built from
 * cards that are already spoken for.
 */

/** One `BUILT` deck's hold on one printing. The API derives these; the rules interpret them. */
export interface Holding {
  deckId: string;
  deckName: string;
  cardId: string;
  quantity: number;
}

/** Who holds the copies, and how many — D-017 requires the location always be shown. */
export interface Holder {
  deckId: string;
  deckName: string;
  quantity: number;
}

/**
 * One card this deck asks for and cannot have, with its address.
 *
 * `owned` and `committed` are both reported so the caller can tell the two causes apart:
 * cards you never had, and cards you have but have already sleeved.
 */
export interface Conflict {
  name: string;
  /** Copies this deck asks for, summed across every zone. */
  want: number;
  /** Copies in the boxes, summed across every printing of the name (DATA-MODEL §2). */
  owned: number;
  /** Copies held by *other* `BUILT` decks. */
  committed: number;
  /** `owned − committed`, floored at zero. */
  available: number;
  /** How many copies of `want` cannot be covered. */
  short: number;
  /** Which decks hold them, largest first. Empty when the shortfall is pure ownership. */
  holders: Holder[];
}

/**
 * Collapse holdings onto printings, optionally ignoring one deck.
 *
 * ⚠️ **A deck never conflicts with itself.** Checking a `BUILT` deck against commitments
 * that include its own contents reports every card in it as spoken for — the deck holds the
 * cards it holds. `exceptDeckId` is what makes editing a built deck possible at all.
 */
export function committedByPrinting(
  holdings: readonly Holding[],
  exceptDeckId?: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of holdings) {
    if (h.deckId === exceptDeckId) continue;
    out[h.cardId] = (out[h.cardId] ?? 0) + h.quantity;
  }
  return out;
}

/** Sum a printing-keyed tally onto names, which is the unit every copy rule is written in. */
function byName(
  source: Readonly<Record<string, number>>,
  cards: CardIndex,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [cardId, n] of Object.entries(source)) {
    const name = cards.nameOf(cardId) ?? cardId;
    out.set(name, (out.get(name) ?? 0) + n);
  }
  return out;
}

/**
 * Every card this deck physically needs — `deckEntries`, minus runes, plus the Legend.
 *
 * ⚠️ **The Legend is counted here and nowhere else in the engine.** `deckEntries` omits it,
 * so L26/L27 stay silent about Legends exactly as they always have; commitment cannot,
 * because a Legend is a single piece of cardboard that cannot be in two decks at once. The
 * asymmetry is deliberate: ownership asks *what may I build*, and a Legend you have not
 * registered is a gap in the collection rather than an illegal deck — but commitment asks
 * *what is in a sleeve right now*, and there the Legend is as physical as anything else.
 *
 * ⚠️ **Runes are exempt** (D-061). Forge treats them as always on hand, so twelve of them
 * can never contend with another deck and can never block promotion.
 */
function sleeveDemand(deck: Deck, cards: CardIndex): Map<string, number> {
  const want = new Map<string, number>();
  const add = (name: string, quantity: number) =>
    want.set(name, (want.get(name) ?? 0) + quantity);
  for (const e of deckEntries(deck, cards)) {
    if (!e.cardId || !isCollected(e)) continue;
    add(e.name, e.quantity);
  }
  if (deck.legendCardId) {
    add(cards.nameOf(deck.legendCardId) ?? deck.legendCardId, 1);
  }
  return want;
}

/**
 * What this deck asks for that it cannot have, and who has it.
 *
 * ⚠️ **What counts as "in the deck"** is every zone including the sideboard (DATA-MODEL §4:
 * sideboard cards are physically present), the Chosen Champion, which lives in its own
 * field, and the Legend — see `sleeveDemand`.
 */
export function findConflicts(
  deck: Deck,
  cards: CardIndex,
  collection: Readonly<Record<string, number>>,
  holdings: readonly Holding[],
): Conflict[] {
  const want = sleeveDemand(deck, cards);

  const others = holdings.filter((h) => h.deckId !== deck.id);
  const ownedByName = byName(collection, cards);
  const committedByName = byName(committedByPrinting(others), cards);

  /** Name → the decks holding it, so a conflict can carry its address. */
  const holdersByName = new Map<string, Map<string, Holder>>();
  for (const h of others) {
    const name = cards.nameOf(h.cardId) ?? h.cardId;
    const decks = holdersByName.get(name) ?? new Map<string, Holder>();
    const held = decks.get(h.deckId) ?? { deckId: h.deckId, deckName: h.deckName, quantity: 0 };
    held.quantity += h.quantity;
    decks.set(h.deckId, held);
    holdersByName.set(name, decks);
  }

  const conflicts: Conflict[] = [];
  for (const [name, asked] of [...want].sort(([a], [b]) => a.localeCompare(b))) {
    const owned = ownedByName.get(name) ?? 0;
    const committed = committedByName.get(name) ?? 0;
    const available = Math.max(0, owned - committed);
    if (asked <= available) continue;
    conflicts.push({
      name,
      want: asked,
      owned,
      committed,
      available,
      short: asked - available,
      holders: [...(holdersByName.get(name)?.values() ?? [])].sort(
        (a, b) => b.quantity - a.quantity,
      ),
    });
  }
  return conflicts;
}

/**
 * Cards sleeved into more copies than the boxes hold — you traded away a card that is still
 * in a deck.
 *
 * **Surfaced loudly, never auto-corrected** (DATA-MODEL §4). Forge must not decide which
 * deck loses a card; only the person holding the sleeves knows which one came apart.
 */
export function overCommitted(
  cards: CardIndex,
  collection: Readonly<Record<string, number>>,
  holdings: readonly Holding[],
): Conflict[] {
  const ownedByName = byName(collection, cards);
  const committedByName = byName(committedByPrinting(holdings), cards);

  const holdersByName = new Map<string, Map<string, Holder>>();
  for (const h of holdings) {
    const name = cards.nameOf(h.cardId) ?? h.cardId;
    const decks = holdersByName.get(name) ?? new Map<string, Holder>();
    const held = decks.get(h.deckId) ?? { deckId: h.deckId, deckName: h.deckName, quantity: 0 };
    held.quantity += h.quantity;
    decks.set(h.deckId, held);
    holdersByName.set(name, decks);
  }

  const out: Conflict[] = [];
  for (const [name, committed] of [...committedByName].sort(([a], [b]) => a.localeCompare(b))) {
    const owned = ownedByName.get(name) ?? 0;
    if (committed <= owned) continue;
    out.push({
      name,
      want: committed,
      owned,
      committed,
      available: 0,
      short: committed - owned,
      holders: [...(holdersByName.get(name)?.values() ?? [])].sort(
        (a, b) => b.quantity - a.quantity,
      ),
    });
  }
  return out;
}

/**
 * The `DRAFT → BUILT` gate (DATA-MODEL §3). Promotion is a claim that the cards are
 * physically in sleeves, and the same card cannot be in two sleeves at once — so this is the
 * one place a conflict stops being information and starts being a refusal.
 *
 * The caller is expected to offer dismantling the holding deck, which is why the blocking
 * conflicts come back rather than a bare `false`.
 */
export function canPromote(
  deck: Deck,
  cards: CardIndex,
  collection: Readonly<Record<string, number>>,
  holdings: readonly Holding[],
): { ok: boolean; blocking: Conflict[] } {
  const blocking = findConflicts(deck, cards, collection, holdings);
  return { ok: blocking.length === 0, blocking };
}

/**
 * A conflict in one sentence, with its address — DATA-MODEL §3's own example shape:
 * *"2 of 3 copies of Jinx, Demolitionist are in **Jinx Aggro v2**."*
 *
 * ⚠️ **Synthesise, never enumerate** (D-039). Two deck names, then a count — a card held
 * across five decks is a sentence you can read, not a list you have to parse.
 */
export function conflictSentence(conflict: Conflict): string {
  const { name, owned, committed, holders, want, available } = conflict;
  if (holders.length === 0) {
    return `${name} — you own ${owned}, and this deck asks for ${want}.`;
  }
  const named = holders.slice(0, 2).map((h) => h.deckName);
  const rest = holders.length - named.length;
  const where = rest > 0 ? `${named.join(" and ")} and ${rest} more` : named.join(" and ");
  return (
    `${committed} of your ${owned} ${owned === 1 ? "copy" : "copies"} of ${name} ` +
    `${committed === 1 ? "is" : "are"} in ${where} — ${available} available, ${want} asked for.`
  );
}

/**
 * Every `BUILT` deck's hold on every printing it sleeves — the rule behind
 * `apps/api/src/commitments.ts`, expressed over `Deck` objects for callers that already have
 * them (the CLI reads them out of the `npm run state` file rather than out of D1).
 *
 * ⚠️ **Every zone but `RUNE`.** Sideboard cards are physically present when a deck is built
 * (DATA-MODEL §4), so they hold cardboard exactly as the Main Deck does. Leaving them out is
 * the bug this function exists to make hard: it reports sleeved cards as free, and the report
 * looks identical to a correct one.
 *
 * ⚠️ **The Legend and Chosen Champion live in their own fields**, so walking `slots` alone
 * reports every built deck two cards short — and both are singular by construction, which
 * makes them the copies most likely to be the only one you own.
 *
 * `DRAFT` decks commit nothing (D-017): a draft is a plan, and plans may freely overlap.
 */
export function holdingsOf(decks: readonly Deck[]): Holding[] {
  const out: Holding[] = [];
  for (const deck of decks) {
    if (deck.state !== "BUILT") continue;
    // One row per (deck, printing). A Champion also sleeved as a Main Deck slot — or a Legend
    // that is also the Champion — is the same physical card counted twice unless these merge.
    const perPrinting = new Map<string, number>();
    const add = (cardId: string, quantity: number) => {
      if (!cardId) return;
      perPrinting.set(cardId, (perPrinting.get(cardId) ?? 0) + quantity);
    };
    for (const slot of deck.slots ?? []) {
      if (slot.zone === "RUNE") continue;
      add(slot.cardId, slot.quantity);
    }
    add(deck.chosenChampionCardId, 1);
    add(deck.legendCardId, 1);
    for (const [cardId, quantity] of perPrinting) {
      out.push({ deckId: deck.id, deckName: deck.name, cardId, quantity });
    }
  }
  return out;
}
