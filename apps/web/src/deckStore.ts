import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck, DeckSlot, Zone } from "@forge/engine";
import { CHAMPION_CARD_ID, LEGEND_CARD_ID } from "./pool.js";

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

const emptyDeck = (): Deck => ({
  id: DECK_ID,
  name: "First deck",
  state: "DRAFT",
  legendCardId: LEGEND_CARD_ID,
  chosenChampionCardId: CHAMPION_CARD_ID,
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

  const push = useCallback(async () => {
    const next = pending.current;
    if (!next) return;
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

  const clear = useCallback(() => edit((current) => ({ ...current, slots: [] })), [edit]);

  return { deck, save, setQuantity, clear };
}
