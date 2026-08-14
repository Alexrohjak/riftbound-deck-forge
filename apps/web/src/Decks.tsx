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

/**
 * Read the deck list out of a response, or say why it could not be read.
 *
 * ⚠️ **A `200` is not proof of an answer.** Cloudflare Access replies to an unauthenticated
 * request with a `302` to its login page; `fetch` follows redirects, so an expired session
 * arrives here as **HTTP 200 carrying HTML** and `response.ok` is `true`. The content type is
 * the only thing that tells the two apart — the same trap [D-058](../../../docs/DECISIONS.md)
 * documents for `curl`, reached from inside the app instead.
 *
 * Exported and pure so it can be tested: there is no DOM test environment here, and the
 * branch that matters is the one that only happens after a week away.
 */
export function readDecks(status: number, contentType: string | null, body: unknown):
  | { ok: true; decks: DeckSummary[] }
  | { ok: false; why: string } {
  if (status === 401 || status === 403) return { ok: false, why: "you are signed out" };
  if (!(status >= 200 && status < 300)) return { ok: false, why: `the server said ${status}` };
  if (!(contentType ?? "").includes("json")) return { ok: false, why: "your sign-in has expired" };
  const decks = (body as { decks?: DeckSummary[] } | null)?.decks;
  if (!Array.isArray(decks)) return { ok: false, why: "the reply made no sense" };
  return { ok: true, decks };
}

export function useDecks(activeId: string) {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  /**
   * ⚠️ **Why a failed read is not an empty list.** This used to `catch` into `setDecks([])`,
   * so a lapsed Access session and *"you have no decks"* rendered identically — an empty
   * shelf, with nothing on screen suggesting the app had failed to ask. That is what turned
   * one expired sign-in into three days of believing the decks were gone.
   */
  const [failed, setFailed] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      try {
        const response = await fetch("/decks");
        // `.json()` throws on the Access login page, which is the point — but it throws a
        // parse error, so the read is checked before it is attempted.
        const type = response.headers.get("content-type");
        const body = (type ?? "").includes("json") ? await response.json() : null;
        const result = readDecks(response.status, type, body);
        // A failed list must not take the builder down with it — you can still edit the deck
        // that is open, which is the thing you came to do. It must, however, say so.
        if (result.ok) {
          setDecks(result.decks);
          setFailed(null);
        } else {
          setFailed(result.why);
        }
      } catch (error) {
        setFailed((error as Error).message || "the network did not answer");
      }
    })();
  }, []);

  useEffect(refresh, [refresh, activeId]);

  return { decks, failed, refresh };
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
  failed,
  pool,
  onOpen,
  onRefresh,
}: {
  deck: Deck;
  decks: DeckSummary[] | null;
  /** Why the list could not be read, if it could not. Never rendered as an empty shelf. */
  failed: string | null;
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

  /** Create an empty deck and open it. Shared by "New deck" and by deleting the last one. */
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
    if (id !== deck.id) return;

    // Deleting the deck you are looking at leaves nothing open, so fall to another.
    const next = (decks ?? []).find((d) => d.id !== id);
    if (next) {
      onOpen(next.id);
      return;
    }
    // ⚠️ Deleting your *last* deck left the app still pointing at the deleted id. The store
    // reads `{ deck: null }`, falls back to an empty deck, and the next edit writes it
    // straight back — so the deck you deleted reappears the moment you touch anything.
    // Forge should always have a real deck open.
    await startNew();
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
          {decks === null && !failed && <p className="empty">Reading your decks…</p>}
          {failed && (
            <p className="unread">
              <b>Could not read your decks</b> — {failed}.
              {" "}Nothing has been lost: this is the list failing to load, not the decks
              themselves. Reload the page to sign in again.
            </p>
          )}
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
                if (result.kind !== "ok") return;
                onRefresh();
                onOpen(id);
                // ⚠️ Stay open when something was skipped. The report renders inside this
                // panel, so closing it throws the message away — which is exactly the bug
                // the collection importer had, made twice in one day. A clean import has
                // nothing to say, so that one closes.
                if (result.unknown === 0) setOpen(false);
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
