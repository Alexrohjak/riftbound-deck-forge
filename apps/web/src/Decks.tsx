import { useCallback, useEffect, useState } from "react";
import type { Deck } from "@forge/engine";
import { newDeckId, type DeckSummary } from "./deckStore.js";
import type { CardPool } from "./cards.js";
import { ImportDeck, type DeckImport } from "./ImportDeck.js";

/**
 * `W3` — more than one deck.
 *
 * ⚠️ **Until now, starting a deck and destroying one were the same act.** Forge held exactly
 * one, at the hardcoded id `main`. That made the whole idea of *proposing* a deck (`S5`)
 * incoherent: a proposal you have to accept by overwriting the deck you already liked is not
 * a proposal, it is an ultimatum.
 *
 * It also makes the match log mean what it was designed to mean. Every game was attaching to
 * `main`; with real decks, "which build went 4-1" is a question the record can answer.
 */

export function useDecks(activeId: string) {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);

  const refresh = useCallback(() => {
    fetch("/decks")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: { decks: DeckSummary[] }) => setDecks(body.decks))
      // A failed list must not take the builder down with it — you can still edit the deck
      // that is open, which is the thing you came to do.
      .catch(() => setDecks([]));
  }, []);

  useEffect(refresh, [refresh, activeId]);

  return { decks, refresh };
}

/** Write a deck straight to the API. Used for "new" and "duplicate", which both create. */
async function create(deck: Deck): Promise<boolean> {
  const response = await fetch(`/decks/${encodeURIComponent(deck.id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(deck),
  }).catch(() => null);
  const type = response?.headers.get("content-type") ?? "";
  return Boolean(response?.ok) && type.includes("json");
}

export function DeckBar({
  deck,
  decks,
  pool,
  onOpen,
  onRefresh,
}: {
  deck: Deck;
  decks: DeckSummary[] | null;
  pool: CardPool;
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [imported, setImported] = useState<DeckImport | null>(null);

  const legendName = (id: string | null) =>
    (id && pool.byPrinting.get(id)?.name) || "no Legend yet";

  const startNew = async () => {
    setBusy(true);
    const id = newDeckId();
    // An empty deck, deliberately: a new deck starts at the Legend step, which is where
    // the guided flow begins and where Domain Identity gets decided.
    const ok = await create({
      id,
      name: `Deck ${(decks?.length ?? 0) + 1}`,
      state: "DRAFT",
      legendCardId: "",
      chosenChampionCardId: "",
      slots: [],
    });
    setBusy(false);
    if (ok) {
      onRefresh();
      onOpen(id);
      setOpen(false);
    }
  };

  const duplicate = async () => {
    setBusy(true);
    const id = newDeckId();
    // ⚠️ Copies the *contents*, not the history or the matches. Those belong to the deck
    // that actually played them; inheriting someone else's record would be a lie.
    const ok = await create({ ...deck, id, name: `${deck.name} copy`, state: "DRAFT" });
    setBusy(false);
    if (ok) {
      onRefresh();
      onOpen(id);
      setOpen(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    await fetch(`/decks/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    setConfirming(null);
    onRefresh();
    // Deleting the deck you are looking at leaves nothing open, so fall to another.
    if (id === deck.id) {
      const next = (decks ?? []).find((d) => d.id !== id);
      if (next) onOpen(next.id);
    }
  };

  return (
    <div className="deckbar">
      <button
        type="button"
        className="deckpick"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <b>{deck.name}</b>
        <span className="dim">{legendName(deck.legendCardId)}</span>
        <span className="caret">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="decklist">
          {decks === null && <p className="empty">Reading your decks…</p>}
          {decks?.map((d) => (
            <div key={d.id} className={d.id === deck.id ? "deckrow on" : "deckrow"}>
              <button type="button" className="deckopen" onClick={() => { onOpen(d.id); setOpen(false); }}>
                <b>{d.name}</b>
                <span className="deckmeta">
                  {legendName(d.legendCardId)} · {d.counts.main}/40 · {d.counts.runes}/12 ·{" "}
                  {d.counts.battlefields}/3
                </span>
              </button>
              {confirming === d.id ? (
                <span className="confirm">
                  <button type="button" className="danger" onClick={() => void remove(d.id)}>
                    delete
                  </button>
                  <button type="button" className="ghost" onClick={() => setConfirming(null)}>
                    keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setConfirming(d.id)}
                  aria-label={`Delete ${d.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="deckactions">
            <button type="button" className="primary" disabled={busy} onClick={() => void startNew()}>
              New deck
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => void duplicate()}>
              Duplicate this one
            </button>
            <ImportDeck
              pool={pool}
              onImported={(id, result) => {
                setImported(result);
                if (result.kind === "ok") {
                  onRefresh();
                  onOpen(id);
                  setOpen(false);
                }
              }}
            />
          </div>
          {imported?.kind === "ok" && (
            <p className="ok">
              Imported <b>{imported.name}</b> — {imported.cards} cards.
              {imported.unknown > 0 && ` ${imported.unknown} unrecognised skipped.`}
            </p>
          )}
          {imported?.kind === "fail" && <p className="fail">{imported.message}</p>}
          {/* Deleting a deck keeps its matches: a game you played is not the deck's to
              take with it (LOG §2). */}
          <p className="deckfoot">Deleting a deck keeps the matches you logged with it.</p>
        </div>
      )}
    </div>
  );
}

/** Rename in place — the name is the only thing you edit *about* a deck rather than in it. */
export function DeckName({ deck, onRename }: { deck: Deck; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(deck.name);

  useEffect(() => setDraft(deck.name), [deck.name]);

  if (!editing) {
    return (
      <button type="button" className="ghost rename" onClick={() => setEditing(true)}>
        rename
      </button>
    );
  }

  const commit = () => {
    const next = draft.trim();
    if (next && next !== deck.name) onRename(next);
    setEditing(false);
  };

  return (
    <input
      className="renamefield"
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}
