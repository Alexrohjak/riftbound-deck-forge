import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck, DeckSlot, Zone } from "@forge/engine";

/**
 * The deck lives in D1, not in the browser (D-049 — **editing requires connectivity**).
 *
 * That is a real limitation at a table with no signal, and the honest thing is to show it
 * rather than pretend a local edit was saved. So this store keeps one authoritative copy
 * on the server and reports exactly where a change got to.
 */

/** F2 builds one deck. `W3` is where more than one becomes a question worth answering. */
const DECK_ID = "main";
const ENDPOINT = `/decks/${DECK_ID}`;
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

const emptyDeck = (): Deck => ({
  id: DECK_ID,
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

export function useDeck() {
  const [deck, setDeck] = useState<Deck>(emptyDeck);
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
      const response = await fetch(ENDPOINT, {
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
    (async () => {
      try {
        const response = await fetch(ENDPOINT);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const body = (await response.json()) as { deck: Deck | null };
        if (cancelled) return;
        // A deck that does not exist yet is not an error — it is the first run.
        setDeck(body.deck ? { ...emptyDeck(), ...body.deck } : emptyDeck());
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
  }, []);

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

  return { deck, save, setQuantity, replacePrinting, setLegend, setChampion, setSlots, clear };
}
