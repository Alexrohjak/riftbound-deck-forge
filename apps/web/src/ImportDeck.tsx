import { useRef, useState } from "react";
import type { Deck, DeckSlot, Zone } from "@forge/engine";
import { newDeckId } from "./deckStore.js";
import type { CardPool } from "./cards.js";
import { exportCode, exportText, importDeck } from "./deckCode.js";

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
  | { kind: "ok"; name: string; cards: number; unknown: number; skipped?: string[] }
  | { kind: "fail"; message: string };

/**
 * Write an imported deck as a new DRAFT. Shared by the file and the paste importer, so the two
 * cannot disagree about what an import is.
 */
async function save(deck: Deck): Promise<void> {
  const response = await fetch(`/decks/${encodeURIComponent(deck.id)}`, {
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
}

const cardCount = (deck: Deck) =>
  deck.slots.reduce((n, s) => n + s.quantity, 0) + (deck.chosenChampionCardId ? 1 : 0);

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

      // ⚠️ Nothing recognised is a bad file, not an empty deck. Creating one silently gives
      // you a deck named after a proposal with nothing in it and no reason why.
      if (slots.length === 0) {
        throw new Error(
          unknown > 0
            ? `${unknown === 1 ? "The only card" : `None of the ${unknown} cards`} in that file ` +
              `${unknown === 1 ? "is" : "are"} in this card pool.`
            : "That file has no usable cards.",
        );
      }

      const id = newDeckId();
      const deck: Deck = {
        id,
        name,
        state: "DRAFT",
        legendCardId: pool.byPrinting.has(legend) ? legend : "",
        chosenChampionCardId: pool.byPrinting.has(champion) ? champion : "",
        slots,
      };

      await save(deck);
      onImported(id, { kind: "ok", name, cards: cardCount(deck), unknown });
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

/**
 * Paste a deck code or a text list from any deckbuilder — Piltover Archive, the event locator,
 * a guide. Like the file importer it only ever creates: the paste lands beside your decks.
 */
export function PasteDeck({
  pool,
  onImported,
}: {
  pool: CardPool;
  onImported: (id: string, result: DeckImport) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const read = importDeck(text, pool);
      if (read.slots.length === 0 && !read.legendCardId) {
        throw new Error(
          read.skipped.length
            ? `Nothing in that paste is a card Forge knows — first unread line: “${read.skipped[0]}”.`
            : "That paste has no cards in it.",
        );
      }
      const legend = pool.byPrinting.get(read.legendCardId);
      const name = legend ? `${legend.tags[0] ?? legend.name} (imported)` : "Imported deck";
      const deck: Deck = {
        id: newDeckId(),
        name,
        state: "DRAFT",
        legendCardId: read.legendCardId,
        chosenChampionCardId: read.chosenChampionCardId,
        slots: read.slots,
      };
      await save(deck);
      setText("");
      setOpen(false);
      onImported(deck.id, {
        kind: "ok",
        name,
        cards: cardCount(deck),
        unknown: read.skipped.length,
        skipped: read.skipped,
      });
    } catch (error) {
      // A code that will not decode is reported in the library's words: it names the version
      // or set it does not know, which is exactly what you need to tell a stale code from a typo.
      onImported("", { kind: "fail", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="ghost" onClick={() => setOpen(true)}>
        Paste deck
      </button>
    );
  }
  return (
    <div className="pastedeck">
      <textarea
        rows={6}
        value={text}
        autoFocus
        placeholder={"A deck code, or a list:\nLegend:\n1 Kai'Sa, Daughter of the Void\nMainDeck:\n3 Stupefy\n…"}
        onChange={(e) => setText(e.target.value)}
      />
      <span>
        <button type="button" className="primary" disabled={busy || !text.trim()} onClick={() => void load()}>
          {busy ? "Reading…" : "Import"}
        </button>
        <button type="button" className="ghost" onClick={() => setOpen(false)}>
          cancel
        </button>
      </span>
    </div>
  );
}

/** Copy the open deck as a deck code or a text list, for any other deckbuilder or an event sign-up. */
export function ExportDeck({ deck, pool }: { deck: Deck; pool: CardPool }) {
  const [said, setSaid] = useState<string | null>(null);

  const copy = async (what: "code" | "text") => {
    try {
      let body: string;
      let note = "";
      if (what === "code") {
        const out = exportCode(deck, pool);
        body = out.text;
        // ⚠️ Name what a code cannot carry — a copied code that silently lost a card is a
        // deck you register and then cannot play.
        if (out.missing.length) note = ` — left out ${out.missing.join(", ")}, which no code can express`;
      } else {
        body = exportText(deck, pool);
      }
      await navigator.clipboard.writeText(body);
      setSaid(`Copied the deck ${what}${note}.`);
    } catch (error) {
      setSaid(`Could not copy: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <>
      <button type="button" className="ghost" onClick={() => void copy("code")}>
        Copy deck code
      </button>
      <button type="button" className="ghost" onClick={() => void copy("text")}>
        Copy as text
      </button>
      {said && <p className="ok">{said}</p>}
    </>
  );
}
