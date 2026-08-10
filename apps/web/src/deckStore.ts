import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck, DeckSlot, DeckState, Zone } from "@forge/engine";

/**
 * The deck lives in D1, not in the browser (D-049 — **editing requires connectivity**).
 *
 * That is a real limitation at a table with no signal, and the honest thing is to show it
 * rather than pretend a local edit was saved. So this store keeps one authoritative copy
 * on the server and reports exactly where a change got to.
 */

/**
 * `W3` — many decks. `F2` held exactly one, at the hardcoded id `main`, which meant
 * *starting* a deck was the same act as *destroying* the one you had.
 *
 * The id is remembered locally rather than on the server: which deck you had open is a
 * property of this browser, not of the collection, and syncing it would make opening Forge
 * on a phone yank the desktop to a different deck.
 */
const ACTIVE_KEY = "forge.activeDeck";
/** The deck `F2` created. Kept as the default so an existing install opens what it had. */
export const FIRST_DECK_ID = "main";

export const newDeckId = () =>
  `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function activeDeckId(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? FIRST_DECK_ID;
  } catch {
    return FIRST_DECK_ID;
  }
}

export function setActiveDeckId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // Private mode or blocked storage. The session still works; it just forgets on reload.
  }
}

export interface DeckSummary {
  id: string;
  name: string;
  state: DeckState;
  legendCardId: string | null;
  updatedAt: string;
  counts: { main: number; runes: number; battlefields: number };
}
/** Long enough to coalesce a burst of taps, short enough that you never wait for it. */
const SAVE_DEBOUNCE_MS = 600;

export type SaveState =
  | { status: "loading" }
  | { status: "saved" }
  | { status: "saving" }
  | { status: "offline"; detail: string };

/**
 * Loose Cannon (Jinx, Fury + Chaos) and Jinx, Demolitionist — a starting point, not a
 * fixture. Both are changeable in the app now that the whole pool is loaded, and an empty
 * Legend would mean no Domain Identity and therefore no domain checks at all.
 */
const DEFAULT_LEGEND = "ogn-301-298";
const DEFAULT_CHAMPION = "ogn-030-298";

const emptyDeck = (id: string): Deck => ({
  id,
  name: "First deck",
  state: "DRAFT",
  legendCardId: DEFAULT_LEGEND,
  chosenChampionCardId: DEFAULT_CHAMPION,
  slots: [],
});

/** Quantity of one printing in one zone. */
export const quantityOf = (deck: Deck, cardId: string, zone: Zone): number =>
  deck.slots.find((s) => s.cardId === cardId && s.zone === zone)?.quantity ?? 0;

/** Set a quantity, dropping the slot entirely at zero — absence is how removal is stored. */
function withQuantity(deck: Deck, cardId: string, zone: Zone, quantity: number): Deck {
  const others = deck.slots.filter((s) => !(s.cardId === cardId && s.zone === zone));
  const slots: DeckSlot[] = quantity > 0 ? [...others, { cardId, zone, quantity }] : others;
  return { ...deck, slots };
}

export function useDeck(deckId: string) {
  const [deck, setDeck] = useState<Deck>(() => emptyDeck(deckId));
  const [save, setSave] = useState<SaveState>({ status: "loading" });

  // The deck to save, held in a ref so the debounce timer always writes the newest state
  // rather than the one captured when the timer was set.
  const pending = useRef<Deck | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True once the server's answer is known — see the guard in `push`. */
  const loaded = useRef(false);

  const push = useCallback(async () => {
    const next = pending.current;
    if (!next) return;

    // ⚠️ **Never save over a deck we failed to read.** If the initial GET fails, `deck` is
    // still the empty default — and a single edit would then PUT that emptiness over a
    // real, saved deck. The edit stays on screen and stays unsaved, which is the only
    // honest state (D-049); reloading once the connection is back recovers it.
    if (!loaded.current) {
      setSave({
        status: "offline",
        detail: "Your saved deck could not be loaded, so nothing is being written over it.",
      });
      return;
    }

    pending.current = null;
    setSave({ status: "saving" });
    try {
      // ⚠️ **The deck says which deck it is.** Writing to the closure's `deckId` meant a
      // save could land on whatever deck happened to be open when the timer fired. Using
      // `next.id` makes a pending edit self-addressing, which is what lets it be flushed
      // *after* you have switched away.
      const response = await fetch(`/decks/${encodeURIComponent(next.id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      setSave({ status: "saved" });
    } catch (error) {
      // Never claim a save that did not happen. The edit stays on screen and stays
      // unsaved, which is the truthful state — see D-049.
      setSave({ status: "offline", detail: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // ⚠️ **Flush before switching, do not discard.** An unsaved edit belongs to the deck it
    // was made on. Clearing `pending` here stopped the old deck's contents landing on the
    // new one — and silently threw the edit away: add a card, switch deck inside the 600ms
    // debounce, and it was simply gone. `push` addresses the write by `next.id`, so the
    // pending edit still reaches the deck it was made on.
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current) void push();

    // Only then is it safe to say nothing is loaded: `push` checks this flag, and the flush
    // above has to happen while it still refers to the deck being left.
    loaded.current = false;
    setSave({ status: "loading" });
    (async () => {
      try {
        const response = await fetch(`/decks/${encodeURIComponent(deckId)}`);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const body = (await response.json()) as { deck: Deck | null };
        if (cancelled) return;
        // A deck that does not exist yet is not an error — it is the first run.
        setDeck(body.deck ? { ...emptyDeck(deckId), ...body.deck } : emptyDeck(deckId));
        // A deck that does not exist yet still counts as loaded: we know the server has
        // nothing, so writing the first one over it destroys nothing.
        loaded.current = true;
        setSave({ status: "saved" });
      } catch (error) {
        if (cancelled) return;
        setSave({ status: "offline", detail: (error as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId, push]);

  const edit = useCallback(
    (change: (current: Deck) => Deck) => {
      setDeck((current) => {
        const next = change(current);
        pending.current = next;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(push, SAVE_DEBOUNCE_MS);
        return next;
      });
    },
    [push],
  );

  const setQuantity = useCallback(
    (cardId: string, zone: Zone, quantity: number) =>
      edit((current) => withQuantity(current, cardId, zone, quantity)),
    [edit],
  );

  /**
   * Swap which printing a slot uses — the same card in a different coat.
   *
   * Quantity and zone are preserved because nothing about the card changed: legality
   * counts names, so this cannot make a legal deck illegal (DATA-MODEL §2). It only
   * changes which physical copies you intend to sleeve.
   */
  const replacePrinting = useCallback(
    (from: string, zone: Zone, to: string) =>
      edit((current) => {
        const slot = current.slots.find((s) => s.cardId === from && s.zone === zone);
        if (!slot || from === to) return current;
        const withoutBoth = current.slots.filter(
          (s) => !(s.zone === zone && (s.cardId === from || s.cardId === to)),
        );
        // If the target printing is already in this zone, the two rows merge rather than
        // colliding on the deck_slots primary key.
        const existing = current.slots.find((s) => s.cardId === to && s.zone === zone);
        return {
          ...current,
          slots: [
            ...withoutBoth,
            { cardId: to, zone, quantity: slot.quantity + (existing?.quantity ?? 0) },
          ],
        };
      }),
    [edit],
  );

  const setLegend = useCallback(
    (cardId: string) => edit((current) => ({ ...current, legendCardId: cardId })),
    [edit],
  );

  const setChampion = useCallback(
    (cardId: string) => edit((current) => ({ ...current, chosenChampionCardId: cardId })),
    [edit],
  );

  /** Replace the whole slot list — used when picking a Legend refills the runes in one move. */
  const setSlots = useCallback(
    (change: (slots: DeckSlot[]) => DeckSlot[]) =>
      edit((current) => ({ ...current, slots: change(current.slots) })),
    [edit],
  );

  const clear = useCallback(() => edit((current) => ({ ...current, slots: [] })), [edit]);

  /** `W3` — the one thing you edit *about* a deck rather than *in* it. */
  const setName = useCallback((name: string) => edit((current) => ({ ...current, name })), [edit]);

  /**
   * `DRAFT ↔ BUILT` — the commitment switch (D-017, DATA-MODEL §3).
   *
   * ⚠️ **The gate lives with the caller, not here.** Promotion requires zero conflicts, and
   * deciding that needs the collection and every other deck's contents — neither of which
   * this store has. `canPromote` in the engine is the rule; this only records the answer.
   * Dismantling has no gate at all: un-sleeving a deck is always allowed.
   */
  const setState = useCallback(
    (state: DeckState) => edit((current) => ({ ...current, state })),
    [edit],
  );

  return {
    deck,
    save,
    setQuantity,
    replacePrinting,
    setLegend,
    setChampion,
    setSlots,
    setName,
    setState,
    clear,
  };
}
