import { useRef, useState } from "react";
import type { Deck, DeckSlot, Zone } from "@forge/engine";
import { newDeckId } from "./deckStore.js";
import type { CardPool } from "./cards.js";

/**
 * Load a deck from a file — the last step of the `S5` loop.
 *
 * ⚠️ **It always creates, never overwrites.** A proposal you accept by destroying the deck
 * you already liked is an ultimatum rather than a proposal ([D-060](../../docs/DECISIONS.md#d-060)),
 * so an import lands beside your decks with a fresh id, whatever id the file claims.
 *
 * ⚠️ It also cannot reach production by `curl` — Access answers an unauthenticated request
 * with a redirect to its login page ([D-058](../../docs/DECISIONS.md#d-058)). Same reason the
 * collection importer exists: from inside the app, the session cookie rides along.
 */

const ZONES: readonly Zone[] = ["MAIN", "RUNE", "BATTLEFIELD", "SIDEBOARD"];

interface Incoming {
  name?: unknown;
  legendCardId?: unknown;
  chosenChampionCardId?: unknown;
  slots?: unknown;
  /** A `forge validate` verdict wraps the deck; accept that shape too. */
  deck?: unknown;
}

export type DeckImport =
  | { kind: "ok"; name: string; cards: number; unknown: number }
  | { kind: "fail"; message: string };

export function ImportDeck({
  pool,
  onImported,
}: {
  pool: CardPool;
  onImported: (id: string, result: DeckImport) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (file: File) => {
    setBusy(true);
    try {
      const raw = JSON.parse(await file.text()) as Incoming;
      // Accept a bare deck or anything that wraps one, so the file I hand you works whether
      // it came from a proposal, a validation, or an export.
      const body = (raw.deck && typeof raw.deck === "object" ? raw.deck : raw) as Incoming;

      if (!Array.isArray(body.slots)) {
        throw new Error("That file has no `slots` — is it a deck?");
      }

      const slots: DeckSlot[] = [];
      let unknown = 0;
      for (const entry of body.slots) {
        const slot = entry as { cardId?: unknown; zone?: unknown; quantity?: unknown };
        const zone = ZONES.find((z) => z === slot.zone);
        const quantity = typeof slot.quantity === "number" ? Math.floor(slot.quantity) : 0;
        if (typeof slot.cardId !== "string" || !zone || quantity <= 0) continue;
        // ⚠️ A card this pool has never heard of is dropped and *counted*. Silently keeping
        // it would put a deck in front of you that Forge cannot render or check.
        if (!pool.byPrinting.has(slot.cardId)) {
          unknown += 1;
          continue;
        }
        slots.push({ cardId: slot.cardId, zone, quantity });
      }

      const legend = typeof body.legendCardId === "string" ? body.legendCardId : "";
      const champion =
        typeof body.chosenChampionCardId === "string" ? body.chosenChampionCardId : "";
      const name =
        typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Imported deck";

      const id = newDeckId();
      const deck: Deck = {
        id,
        name,
        state: "DRAFT",
        legendCardId: pool.byPrinting.has(legend) ? legend : "",
        chosenChampionCardId: pool.byPrinting.has(champion) ? champion : "",
        slots,
      };

      const response = await fetch(`/decks/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(deck),
      });
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("json")) {
        throw new Error(
          type.includes("json")
            ? `Import failed (HTTP ${response.status}).`
            : "The server answered with a page — you may need to sign in again.",
        );
      }

      const cards = slots.reduce((n, s) => n + s.quantity, 0) + (deck.chosenChampionCardId ? 1 : 0);
      onImported(id, { kind: "ok", name, cards, unknown });
    } catch (error) {
      onImported("", {
        kind: "fail",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ghost"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Loading…" : "Import deck"}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void load(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
