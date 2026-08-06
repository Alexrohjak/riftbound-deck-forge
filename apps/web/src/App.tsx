import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkLegality, deckHash, energyCurve, zoneCount, type Zone } from "@forge/engine";
import { hd, loadPool, srcSet, zoneFor, type Card, type CardPool, type Printing } from "./cards.js";
import {
  activeDeckId,
  newDeckId,
  setActiveDeckId,
  useDeck,
  type DeckSummary,
  type SaveState,
} from "./deckStore.js";
import { AddCards } from "./AddCards.js";
import { watchForUpdates } from "./version.js";
import { DeckBar, DeckName, useDecks } from "./Decks.js";
import { Advisor } from "./Advisor.js";
import { ImportCollection, type Result as ImportResult } from "./ImportCollection.js";
import { History, LogPanel, useMatches } from "./Log.js";
import { apply, DOMAIN_LIST, NO_FILTERS, orderShelf, ownedCount, SORTS, TYPES, type Filters, type ShelfRow, type Tab } from "./filters.js";
import { filtersFor, runeSlots, stepFor, type Step } from "./buildFlow.js";
import { Workshop, type Occupant, type Target } from "./Workshop.js";
import { CardDetail } from "./CardDetail.js";

/**
 * Forge — a light table of cards, and a workbench tray beside it.
 *
 * **The card is the information.** Every stat is printed on the card, so a gallery tile is
 * the art and nothing else. The detail view carries the small print, because a 3rem slot
 * cannot.
 *
 * **Left click adds. Right click removes. Clicking a card already in the tray opens it.**
 * One rule everywhere, with no hover-only affordances and no 20px targets.
 */

const MAX_COPIES = 3;
const PAGE = 60;

/**
 * **Tile size belongs to the tab, not to you.** It used to be an S/M/L control, which meant
 * every visit started at whichever size you last left it on and the gallery never looked
 * like itself twice. What a card needs to be readable is a property of the card: portrait
 * cards want the large tile, and battlefields are landscape — the same width holds far more
 * picture, so they read at medium and a large one would waste half the shelf.
 *
 * ⚠️ `sizes` is an image hint, parsed before CSS runs, so it cannot say `var(--tile)` — it
 * mirrors the same breakpoints by hand. Getting this wrong is expensive rather than ugly:
 * an unresolved `var()` falls back to `100vw` and the gallery fetches 2492px scans to draw
 * them at 208.
 */
const TILE = {
  L: {
    css: "tile-l",
    sizes: "(max-width: 30rem) 42vw, (max-width: 48rem) 13rem, 18rem",
    wide: "(max-width: 30rem) 87vw, (max-width: 48rem) 27rem, 37rem",
  },
  M: {
    css: "tile-m",
    sizes: "(max-width: 30rem) 42vw, 13rem",
    wide: "(max-width: 30rem) 87vw, 27rem",
  },
} as const;

/**
 * ⚠️ **A landscape tile spans two columns** (`.tile.wide`), so its `wide` hint is two tile
 * widths plus the 0.75rem gap. Stating the single-column width instead is not a rounding
 * error — it asked the browser for half the pixels it was about to draw, and the browser
 * obliged, which is the other half of why the battlefields were soft.
 */
const tileFor = (tab: Tab): (typeof TILE)[keyof typeof TILE] =>
  tab === "battlefield" ? TILE.M : TILE.L;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  { id: "legend", label: "Legends" },
  { id: "main", label: "Main Deck" },
  { id: "battlefield", label: "Battlefields" },
  { id: "rune", label: "Runes" },
];

const store = {
  get: (k: string, fallback: string) => {
    try {
      return localStorage.getItem(k) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode — a lost preference is not worth an error */
    }
  },
};

function SaveBadge({ save }: { save: SaveState }) {
  if (save.status === "offline") {
    return (
      <span className="save offline" title={save.detail}>
        not saved
      </span>
    );
  }
  return <span className="save">{{ loading: "loading…", saving: "saving…", saved: "saved" }[save.status]}</span>;
}

function EnergyCurve({ counts, unknown, counted }: ReturnType<typeof energyCurve>) {
  if (counted < 5) return <p className="empty">The curve needs a few more cards to describe.</p>;
  const peak = Math.max(1, ...counts);
  return (
    <>
      <div className="curve">
        {counts.map((count, energy) => (
          <div className="bar" key={energy}>
            <span className="count">{count || ""}</span>
            <span className="stem" style={{ height: `${(count / peak) * 100}%` }} />
            <span className="tick">{energy}</span>
          </div>
        ))}
      </div>
      {unknown > 0 && <p className="empty">{unknown} card(s) with no cost data — not shown.</p>}
    </>
  );
}

/** A gallery tile: the art, and a count when it is in the deck. */
function Tile({
  card,
  held,
  owned,
  printing: shown,
  index,
  tile,
  onAdd,
  onRemove,
}: {
  card: Card;
  held: number;
  /** Copies in the box. A different fact from `held`, which is copies in this deck. */
  owned: number;
  /**
   * ⚠️ Which printing to draw. The gallery collapses a card to one entry, which is right
   * when you are choosing *cards* — but the collection is a shelf of *objects*, and an
   * alternate art is a different object you own a different number of. Absent means "the
   * collapsed default"; supplied means "this exact art".
   */
  printing?: Printing;
  index: number;
  /** ⚠️ Literal lengths and media conditions only. `sizes` is parsed before CSS, so
      `var(--tile)` silently falls back to 100vw — which had the gallery fetching 2492px
      images to draw at 208. It mirrors `TILE`'s breakpoints by hand for that reason. */
  tile: { sizes: string; wide: string };
  onAdd: () => void;
  onRemove: () => void;
}) {
  const printing = shown ?? card.printings[0];
  const atLimit = !card.types.includes("rune") && held >= MAX_COPIES;
  const [ready, setReady] = useState(false);
  return (
    <div
      className={`tile${held > 0 ? " in" : ""}${atLimit ? " maxed" : ""}${card.landscape ? " wide" : ""}`}
      style={{ ["--deal" as string]: `${Math.min(index, 12) * 22}ms` }}
    >
      <button
        type="button"
        className="face"
        onClick={onAdd}
        onContextMenu={(e) => {
          e.preventDefault();
          onRemove();
        }}
        disabled={atLimit}
        title={atLimit ? `${card.name} — three copies is the limit` : `${card.name} — click to add`}
      >
        {printing && (
          <img
            src={hd(printing, card.landscape ? 560 : 300)}
            srcSet={srcSet(printing)}
            sizes={card.landscape ? tile.wide : tile.sizes}
            alt={card.name}
            loading="lazy"
            decoding="async"
            {...(card.landscape ? { width: 419, height: 300 } : { width: 300, height: 419 })}
            className={ready ? "ready" : ""}
            onLoad={() => setReady(true)}
          />
        )}
      </button>
      {held > 0 && <span className="held">{held}</span>}
      {owned > 0 && <span className="own" title={`${owned} in your collection`}>{owned}</span>}
      {/* The collector number, with its suffix — `066a` is the alternate art and the whole
          reason this tile exists separately from `066`. */}
      {shown && <span className="printcode">{shown.code.split("/")[0]}</span>}
    </div>
  );
}

export function App() {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  /** Survives the import that unmounts the button which produced it. */
  const [imported, setImported] = useState<ImportResult | null>(null);
  /** Entering cards is a mode, not a page — the gallery below stays useful while you type. */
  const [adding, setAdding] = useState(false);
  /** A newer Forge has been deployed under this page. Never acted on without asking. */
  const [stale, setStale] = useState(false);
  useEffect(() => watchForUpdates(() => setStale(true)), []);
  /** Re-read after an import, so the Owned view fills in without a refresh. */
  const loadCollection = useCallback(() => {
    fetch("/collection")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((b: { counts?: Record<string, number> }) => setOwned(b.counts ?? {}))
      .catch(() => setOwned({}));
  }, []);
  const [base, setBase] = useState<Filters>(NO_FILTERS);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(true);
  const [guided, setGuided] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  /**
   * ⚠️ The workshop used to be one column: bays, then curve, then EE, then the log, then
   * history — 3378px of scroll, with EE starting at 2915. Everything added went to the
   * bottom, and the bottom was two screens past anywhere anyone looks. Three views instead,
   * so nothing new is ever buried by being newest.
   */
  const [view, setView] = useState<"deck" | "analysis" | "log">("deck");
  const [detail, setDetail] = useState<Target | null>(null);
  const [pane, setPane] = useState(() => Number(store.get("forge.pane", "34")) || 34);

  const sentinel = useRef<HTMLDivElement | null>(null);
  /** Which deck is open. Local to this browser — see `activeDeckId`. */
  const [deckId, setDeckId] = useState(activeDeckId);
  const { deck, save, setQuantity, replacePrinting, setLegend, setChampion, setSlots, setName } =
    useDeck(deckId);
  const { decks, refresh: refreshDecks } = useDecks(deckId);

  const openDeck = useCallback((id: string) => {
    setActiveDeckId(id);
    setDeckId(id);
  }, []);

  useEffect(() => {
    loadPool().then(setPool, (e: Error) => setFailed(e.message));
    loadCollection();
  }, [loadCollection]);

  useEffect(() => store.set("forge.pane", String(pane)), [pane]);

  // ── the workshop is dragged, not fixed ──────────────────────────────────────
  const dragging = useRef(false);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const fromRight = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      setPane(Math.min(70, Math.max(18, fromRight)));
    };
    const up = () => {
      dragging.current = false;
      document.body.classList.remove("resizing");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const step: Step = pool ? stepFor(deck, pool) : "legend";
  const filters = useMemo(
    () => (pool && guided ? filtersFor(step, deck, pool, base) : base),
    [pool, guided, step, deck, base],
  );
  /** Read off the tab actually in force, so the guided flow sizes its shelf too. */
  const tile = tileFor(filters.tab);

  const { matches, failed: logFailed, refresh: refreshLog } = useMatches(deck.id);
  /**
   * The build currently on screen, by the same pure function the Worker stores history
   * with (D-047). Computed here rather than read back from the save response so a match
   * logged mid-edit names what you are actually holding.
   */
  const currentHash = useMemo(() => deckHash(deck), [deck]);
  const playedOn = useMemo(
    () => new Set((matches ?? []).flatMap((m) => (m.deckHash ? [m.deckHash] : []))),
    [matches],
  );

  const results = useMemo(
    () => (pool ? apply(pool.cards, filters, owned) : []),
    [pool, filters, owned],
  );

  /**
   * The collection, **one entry per printing you own**.
   *
   * ⚠️ The gallery collapses printings onto a name, which is right when you are choosing
   * *cards* — three arts of Blazing Scorcher are three ways to play the same card, and the
   * copy limit counts them together (DATA-MODEL §2). The collection is the other thing: a
   * shelf of physical objects, where `OGN-066` and `OGN-066a` are different cards you own
   * different numbers of, and collapsing them hides what is actually in the box.
   *
   * So the Owned view expands rather than collapses. The filters still apply — they are
   * about the card — but the tiles are printings.
   */
  /**
   * How many rows the grid is actually showing. ⚠️ The Owned view renders *printings* and
   * everything else renders *names*, so paging and the "N more…" counter have to follow the
   * list on screen rather than the one they were written against.
   */
  const shelf = useMemo(() => {
    if (!pool || !filters.owned) return [];
    const rows: ShelfRow[] = [];
    for (const card of results) {
      for (const printing of card.printings) {
        const n = owned[printing.id] ?? 0;
        if (n > 0) rows.push({ card, printing, owned: n });
      }
    }
    // ⚠️ The rows arrive in the *card* order `apply` produced, which is not an order for
    // printings — see `printingRank`. Re-order them as objects. A search query still wins,
    // exactly as it does in the gallery: relevance decides when you have asked for a card.
    return filters.query.trim() ? rows : orderShelf(rows, filters.sort, pool.sets);
  }, [pool, results, owned, filters]);

  /** Rows on screen: printings in the Owned view, names everywhere else. */
  const listLength = filters.owned ? shelf.length : results.length;

  /**
   * The collection in one line. **Names, not printings** — you own a card once however many
   * arts it came in, and printings is the number that would make a collection sound bigger
   * than it plays (DATA-MODEL §2).
   */
  const holdings = useMemo(() => {
    if (!pool) return { names: 0, printings: 0, copies: 0 };
    let names = 0;
    for (const card of pool.cards) if (ownedCount(card, owned) > 0) names += 1;
    return {
      names,
      // ⚠️ Printings too, now that the view shows one tile per art. Saying "3 cards" over a
      // grid of six tiles reads as a bug in the count rather than as the distinction it is.
      printings: Object.keys(owned).length,
      copies: Object.values(owned).reduce((n, q) => n + q, 0),
    };
  }, [pool, owned]);
  useEffect(() => setShown(PAGE), [filters]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        // ⚠️ Bounded. Unbounded, this climbs past the result count whenever the sentinel
        // sits in view with nothing left to reveal, re-rendering to show the same nothing.
        //
        // Honest correction: an earlier commit blamed this for freezing the tab. It was not
        // that — `requestAnimationFrame` and long `setTimeout` chains are throttled almost
        // to a stop in a *backgrounded* tab, so the automation scripts were hanging, not the
        // app. Measured with the fix in place and 900 printings owned, a keystroke costs
        // 0–3 ms. The cap is still correct; the diagnosis attached to it was not.
        if (entries[0]?.isIntersecting) {
          setShown((n) => (n >= listLength ? n : n + PAGE));
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [listLength]);

  const legality = useMemo(
    () => (pool ? checkLegality(deck, pool.index, { ownership: { collection: owned } }) : null),
    [deck, pool, owned],
  );
  const curve = useMemo(() => (pool ? energyCurve(deck, pool.index) : null), [deck, pool]);

  const copiesOfName = useCallback(
    (card: Card) =>
      pool
        ? deck.slots
            .filter((s) => pool.byPrinting.get(s.cardId)?.name === card.name)
            .reduce((n, s) => n + s.quantity, 0)
        : 0,
    [deck, pool],
  );

  if (failed) {
    return (
      <main className="boot">
        <h1>Forge</h1>
        <p className="fail">The card pool did not load: {failed}</p>
      </main>
    );
  }
  if (!pool || !legality || !curve) {
    return (
      <main className="boot">
        <h1>Forge</h1>
        <p className="empty">Loading the card pool…</p>
      </main>
    );
  }

  const legend = pool.byPrinting.get(deck.legendCardId);

  const slotFor = (card: Card) =>
    deck.slots.find((s) => s.zone === zoneFor(card) && pool.byPrinting.get(s.cardId)?.name === card.name);

  const championsFor = (tag: string | undefined) =>
    tag
      ? pool.cards.filter(
          (c) =>
            c.types.includes("unit") &&
            c.superTypes.includes("champion") &&
            !c.superTypes.includes("signature") &&
            c.tags.includes(tag),
        )
      : [];

  /**
   * @param printing ⚠️ Only supplied from the collection view, where the tile *is* a
   * specific art. Clicking the copy you own and having a different printing go into the
   * deck is a small lie, and the whole reason the collection shows arts separately. Copy
   * limits still count by name (L13), so the tile disables at three either way.
   */
  const add = (card: Card, printing?: Printing) => {
    // A Legend is the deck's identity rather than a card in it — and picking one fixes the
    // Domain Identity, so the runes it implies are filled in the same move (Riot's 6-6).
    if (card.types.includes("legend")) {
      const id = card.printings[0]?.id;
      if (!id) return;
      setLegend(id);
      const champion = pool.byPrinting.get(deck.chosenChampionCardId);
      const keeps = champion && card.championTag && champion.tags.includes(card.championTag);
      if (!keeps) {
        // Guided: clear it, so the next step is *choosing* a Champion from this Legend's
        // own units — which is the point of the step. Browsing freely: substitute one
        // silently, because a stale Champion under a new Legend is illegal (L18) and
        // nothing else would catch it.
        const replacement = guided ? "" : championsFor(card.championTag)[0]?.printings[0]?.id;
        setChampion(replacement ?? "");
      }
      setSlots((slots) => [...slots.filter((s) => s.zone !== "RUNE"), ...runeSlots(card, pool)]);
      return;
    }
    // Mid-flow, a champion unit is a choice rather than an addition.
    if (guided && step === "champion" && card.superTypes.includes("champion")) {
      const id = card.printings[0]?.id;
      if (id) setChampion(id);
      return;
    }
    if (printing) {
      const zone = zoneFor(card);
      const mine = deck.slots.find((s) => s.cardId === printing.id && s.zone === zone);
      setQuantity(printing.id, zone, (mine?.quantity ?? 0) + 1);
      return;
    }
    const existing = slotFor(card);
    const id = existing?.cardId ?? card.printings[0]?.id;
    if (id) setQuantity(id, zoneFor(card), (existing?.quantity ?? 0) + 1);
  };

  const removeOne = (card: Card) => {
    const existing = slotFor(card);
    if (existing) setQuantity(existing.cardId, existing.zone, existing.quantity - 1);
  };

  /**
   * Take one out. ⚠️ Routed by **role**, because the Legend and the Chosen Champion are
   * singular fields rather than slots — searching `deck.slots` for them finds nothing and
   * fails silently, which is exactly the bug this replaced. Clearing a Legend also clears
   * the Champion, because a Champion without its Legend can never satisfy L18.
   */
  const removeTarget = (t: Target) => {
    if (t.role === "legend") {
      setLegend("");
      setChampion("");
      return;
    }
    if (t.role === "champion") {
      setChampion("");
      return;
    }
    const slot = deck.slots.find((s) => s.cardId === t.cardId && s.zone === t.zone);
    if (slot) setQuantity(t.cardId, t.zone, slot.quantity - 1);
  };

  /**
   * One entry per physical card, in play order — cheapest first, then by name. Three copies
   * are three cards in the tray, because that is what they are in the deck.
   */
  const occupants = (zone: Zone): Occupant[] =>
    deck.slots
      .filter((s) => s.zone === zone)
      .flatMap((s) => {
        const card = pool.byPrinting.get(s.cardId);
        return card
          ? Array.from({ length: s.quantity }, () => ({ card, cardId: s.cardId, quantity: 1 }))
          : [];
      })
      .sort((a, b) => (a.card.energy ?? 99) - (b.card.energy ?? 99) || a.card.name.localeCompare(b.card.name));

  const setTab = (tab: Tab) => {
    setGuided(false);
    setBase((f) => ({ ...f, tab }));
  };

  const toggle = (key: "domains" | "types", value: string) =>
    setBase((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next } as Filters;
    });

  const activeFilters = base.domains.length + base.types.length;

  return (
    <div className={`workspace${open ? "" : " solo"}`} style={{ ["--pane" as string]: `${pane}%` }}>
      {stale && (
        <p className="stale">
          <span>
            A newer Forge is deployed. This page is still running the version it loaded —
            reload to pick up the change.
          </span>
          <button type="button" className="primary" onClick={() => location.reload()}>
            Reload
          </button>
          {/* Dismissible, because mid-entry is exactly when you do not want to. */}
          <button type="button" className="ghost" onClick={() => setStale(false)}>
            later
          </button>
        </p>
      )}
      <section className="gallery">
        <div className="toolbar">
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={!guided && filters.tab === t.id ? "tab on" : "tab"}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <input
            className="search"
            type="search"
            value={base.query}
            placeholder="Search name, rules text or tag"
            onChange={(e) => setBase((f) => ({ ...f, query: e.target.value }))}
          />

          <button
            type="button"
            className={adding ? "tab add on" : "tab add"}
            onClick={() => {
              setAdding((v) => !v);
              // Entering cards and seeing what you own are the same activity.
              if (!adding) setBase((f) => ({ ...f, owned: true }));
            }}
            title="Type collector numbers to register cards you own"
          >
            + Add cards
          </button>

          <button
            type="button"
            className={base.owned ? "tab owned on" : "tab owned"}
            onClick={() => {
              setGuided(false);
              setBase((f) => ({
                ...f,
                owned: !f.owned,
                sort: !f.owned || f.sort.key !== "copies" ? f.sort : { key: "release", desc: false },
              }));
            }}
            title="Show only cards you physically own"
          >
            Owned
          </button>

          <button
            type="button"
            className={showFilters || activeFilters ? "tab on" : "tab"}
            onClick={() => setShowFilters((s) => !s)}
          >
            Filters{activeFilters > 0 && <em className="pipcount">{activeFilters}</em>}
          </button>

          <span className="count">{results.length}</span>
          <button type="button" className="tab toggle" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide deck ›" : "‹ Deck"}
          </button>
        </div>

        {showFilters && (
          <div className="filterbar">
            <div className="fgroup">
              <span className="flabel">Type</span>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={base.types.includes(t) ? "chip on" : "chip"}
                  onClick={() => toggle("types", t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="fgroup">
              <span className="flabel">Domain</span>
              {DOMAIN_LIST.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={base.domains.includes(d) ? "chip on" : "chip"}
                  onClick={() => toggle("domains", d)}
                >
                  <i className={`dot ${d}`} />
                  {d}
                </button>
              ))}
            </div>
            <div className="fgroup">
              <span className="flabel">Sort</span>
              {SORTS.filter((s) => s.key !== "copies" || base.owned).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={base.sort.key === s.key ? "chip on" : "chip"}
                  onClick={() =>
                    setBase((f) => ({
                      ...f,
                      sort: { key: s.key, desc: f.sort.key === s.key ? !f.sort.desc : false },
                    }))
                  }
                >
                  {s.label}
                  {base.sort.key === s.key && <em>{base.sort.desc ? " ↓" : " ↑"}</em>}
                </button>
              ))}
              {activeFilters > 0 && (
                <button
                  type="button"
                  className="chip clear"
                  onClick={() => setBase((f) => ({ ...f, domains: [], types: [] }))}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {guided && (
          <p className="guiderail">
            <span>
              {step === "legend" && "Pick a Legend — it fixes your Domain Identity and fills a 6-6 rune split."}
              {step === "champion" && `Pick a Chosen Champion. Only ${legend?.championTag} units are eligible.`}
              {step === "main" &&
                `${39 - zoneCount(deck, "MAIN")} more Main Deck cards, inside ${legend?.domains.join(" + ")}.`}
              {step === "battlefield" && `${3 - zoneCount(deck, "BATTLEFIELD")} more battlefields.`}
              {step === "done" && "The deck is legal. Keep tuning, or look it over."}
            </span>
            <button type="button" className="ghost" onClick={() => setGuided(false)}>
              browse freely
            </button>
          </p>
        )}

        {adding && (
          <AddCards pool={pool} owned={owned} onChanged={setOwned} />
        )}

        {base.owned && holdings.names > 0 && (
          <p className="rail">
            <span>
              <strong>{holdings.names}</strong> cards ·{" "}
              <strong>{holdings.printings}</strong>{" "}
              {holdings.printings === 1 ? "printing" : "printings"} ·{" "}
              <strong>{holdings.copies}</strong> copies
              {listLength < holdings.printings && ` · ${listLength} match the filters`}
            </span>
            <span className="railtools">
              {/* Re-importable: the collection grows, and re-exporting the whole thing is
                  how the tool works. An upload replaces rather than merges. */}
              <ImportCollection pool={pool} onLoaded={loadCollection} onResult={setImported} />
              <button
                type="button"
                className="ghost"
                onClick={() => setBase((f) => ({ ...f, owned: false }))}
              >
                show every card
              </button>
            </span>
          </p>
        )}

        {imported && (
          <p className={imported.kind === "ok" ? "ok importnote" : "fail importnote"}>
            {imported.kind === "ok" ? (
              <>
                Saved <b>{imported.copies}</b> copies across <b>{imported.printings}</b>{" "}
                printings.
                {imported.translated > 0 &&
                  ` ${imported.translated} re-keyed from collector codes.`}
                {imported.dropped > 0 &&
                  ` ${imported.dropped} unrecognised ${imported.dropped === 1 ? "entry" : "entries"} skipped.`}
              </>
            ) : (
              imported.message
            )}
            <button type="button" className="ghost" onClick={() => setImported(null)}>
              dismiss
            </button>
          </p>
        )}

        <div className={`grid ${tile.css}`}>
          {filters.owned
            ? shelf.slice(0, shown).map((row, i) => (
                <Tile
                  key={row.printing.id}
                  index={i % PAGE}
                  tile={tile}
                  card={row.card}
                  printing={row.printing}
                  owned={row.owned}
                  held={row.card.types.includes("legend") ? 0 : copiesOfName(row.card)}
                  onAdd={() => add(row.card, row.printing)}
                  onRemove={() => removeOne(row.card)}
                />
              ))
            : results.slice(0, shown).map((card, i) => (
            <Tile
              key={card.name}
              index={i % PAGE}
              tile={tile}
              card={card}
              owned={ownedCount(card, owned)}
              held={card.types.includes("legend") ? 0 : copiesOfName(card)}
                  onAdd={() => add(card)}
                  onRemove={() => removeOne(card)}
                />
              ))}
        </div>

        <div ref={sentinel} className="sentinel">
          {shown < listLength ? `${listLength - shown} more…` : ""}
          {listLength === 0 &&
            (base.owned && Object.keys(owned).length === 0 ? (
              <span className="empty">
                Nothing registered yet. Enter your cards with the collection tool in
                <code> tools/collection/</code>, then load the file it exports — until then
                Forge knows every card that exists and none that you have.
                <ImportCollection pool={pool} onLoaded={loadCollection} onResult={setImported} />
              </span>
            ) : (
              <span className="empty">Nothing matches those filters.</span>
            ))}
        </div>
      </section>

      {open && (
        <>
          <div
            className="grip"
            role="separator"
            aria-label="Resize the deck panel"
            aria-orientation="vertical"
            onPointerDown={() => {
              dragging.current = true;
              document.body.classList.add("resizing");
            }}
            onDoubleClick={() => setPane(34)}
          />
          <aside className="workshop">
            <header>
              <h1>Forge</h1>
              <div className="headtools">
                <DeckName deck={deck} onRename={setName} />
                <SaveBadge save={save} />
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setGuided(true);
                    setShowFilters(false);
                  }}
                >
                  Guided build
                </button>
              </div>
            </header>

            <DeckBar
              deck={deck}
              decks={decks}
              pool={pool}
              onOpen={openDeck}
              onRefresh={refreshDecks}
            />

            <nav className="views">
              {(
                [
                  ["deck", "Deck"],
                  ["analysis", "Analysis"],
                  ["log", "Log"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={view === id ? "view on" : "view"}
                  onClick={() => setView(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <Workshop
              showDeck={view === "deck"}
              deck={deck}
              pool={pool}
              legality={legality}
              step={step}
              guided={guided}
              occupants={occupants}
              onOpen={setDetail}
              onRemove={removeTarget}
              onSeek={(zone) => {
                setGuided(false);
                setBase((f) => ({
                  ...f,
                  tab: zone === "RUNE" ? "rune" : zone === "BATTLEFIELD" ? "battlefield" : "main",
                }));
              }}
            >
              {view === "analysis" && (
                <>
                  <section className="panel">
                    <h2>Energy curve</h2>
                    <EnergyCurve {...curve} />
                  </section>
                  <Advisor deck={deck} pool={pool} owned={owned} />
                </>
              )}

              {view === "log" && (
                <>
                  <LogPanel
                    deckId={deck.id}
                    deckName={deck.name}
                    deckHash={currentHash}
                    pool={pool}
                    matches={matches}
                    failed={logFailed}
                    onRefresh={refreshLog}
                  />
                  <History deckId={deck.id} playedOn={playedOn} />
                </>
              )}

              {view === "deck" && <p className="caveat">⚠️ {legality.coverage.caveat}</p>}
            </Workshop>
          </aside>
        </>
      )}

      {detail && (
        <CardDetail
          card={detail.card}
          cardId={detail.cardId}
          role={detail.role}
          owned={detail.card.printings.reduce((n, p) => n + (owned[p.id] ?? 0), 0)}
          onPickArt={(p: Printing) => {
            if (detail.role === "legend") setLegend(p.id);
            else if (detail.role === "champion") setChampion(p.id);
            else replacePrinting(detail.cardId, detail.zone, p.id);
            setDetail(null);
          }}
          onRemove={() => {
            removeTarget(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
