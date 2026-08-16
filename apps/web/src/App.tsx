import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkLegality,
  committedByPrinting,
  championAccess,
  deckFacts,
  deckHash,
  playableOptions,
  runeFeasibility,
  simulateOpenings,
  findConflicts,
  mainDeckCount,
  overCommitted,
  zoneCount,
  type Zone,
} from "@forge/engine";
import {
  copiesInDeck,
  hd,
  loadPool,
  printingOf,
  srcSet,
  zoneFor,
  type Card,
  type CardPool,
  type Printing,
} from "./cards.js";
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
import { Advisor, ClaimLegend } from "./Advisor.js";
import { ImportCollection, type Result as ImportResult } from "./ImportCollection.js";
import { History, LogPanel, useMatches } from "./Log.js";
import { apply, copyLimit, DOMAIN_LIST, MAX_COPIES, NO_FILTERS, orderShelf, ownedCount, SORTS, TYPES, type Filters, type ShelfRow, type Tab } from "./filters.js";
import { filtersFor, runeSlots, stepFor, type Step } from "./buildFlow.js";
import { Workshop, type Occupant, type Target } from "./Workshop.js";
import { CardDetail } from "./CardDetail.js";
import { useCommitments } from "./commitments.js";
import { Probabilities, Statistics } from "./Statistics.js";
import { Wishlist } from "./Wishlist.js";

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
    wide: "(max-width: 30rem) 87vw, (max-width: 48rem) 27rem, 44rem",
  },
  M: {
    css: "tile-m",
    sizes: "(max-width: 30rem) 42vw, 13rem",
    wide: "(max-width: 30rem) 87vw, 44rem",
  },
} as const;

/**
 * ⚠️ **A landscape tile spans two columns** (`.tile.wide`), so a battlefield is drawn at
 * roughly twice a portrait tile's width. Declaring the single-column width asked the browser
 * for half the pixels it was about to paint, and the browser obliged.
 *
 * The `wide` hint now deliberately over-declares — 44rem against a measured 435–499px box.
 * That is not slack, it is the point: it takes the 820 rung rather than the 620, and a
 * battlefield's rules text is fine enough detail that downsampling a larger scan is visibly
 * crisper than a near-exact one. It costs ~22 KB a card on one tab, and the ladder still
 * caps at the 1038 the scan actually holds, so it can never tip over into an upscale.
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

/**
 * Why the tile will not take another copy — said in the terms that caused it, because
 * "three copies is the limit" on a card you own one of is a lie about your own boxes.
 */
const limitNote = (card: Card, limit: number): string => {
  if (limit >= MAX_COPIES) return `${card.name} — three copies is the limit`;
  if (limit === 0) return `${card.name} — none in your collection`;
  return `${card.name} — you own ${limit}, and ${limit === 1 ? "it is" : "they are"} in the deck`;
};

/** A gallery tile: the art, and a count when it is in the deck. */
function Tile({
  card,
  held,
  owned,
  limit,
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
   * The most copies this card will accept — `MAX_COPIES`, or fewer when the boxes say so
   * (`copyLimit`). ⚠️ **Counted by name, never by the printing on the tile**, or owning one
   * of each of two arts would cap the card at one from either side.
   */
  limit: number;
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
  const atLimit = held >= limit;
  const [ready, setReady] = useState(false);
  return (
    <div
      className={`tile${held > 0 ? " in" : ""}${atLimit ? " maxed" : ""}${card.landscape ? " wide" : ""}`}
      style={{ ["--deal" as string]: `${Math.min(index, 12) * 22}ms` }}
    >
      {/* ⚠️ **Full is not `disabled`.** A disabled button dispatches no mouse events at all,
          so the right-click that takes a card *out* dies with the left-click that puts one
          in. That was survivable while the cap was three and rarely met; against the boxes a
          single-copy card fills on its first click, and the tile you just filled would be the
          one tile you could not undo. Left click is refused, right click still removes. */}
      <button
        type="button"
        className="face"
        onClick={atLimit ? undefined : onAdd}
        onContextMenu={(e) => {
          e.preventDefault();
          onRemove();
        }}
        aria-disabled={atLimit}
        title={atLimit ? limitNote(card, limit) : `${card.name} — click to add`}
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
  /**
   * Whether the workshop is showing. Two different things behind one flag: on desktop it is
   * a side panel that can be collapsed, on a phone it is an overlay over the gallery.
   *
   * ⚠️ **Starts closed on a phone.** Stacked below the gallery it meant scrolling past every
   * card to see the deck and back up to find the next one — the single-column layout was
   * honest about the space and useless to build in. Read once, with the CSS breakpoint's own
   * unit rather than a pixel guess, and never re-read: after the first tap the answer is
   * yours, not the viewport's.
   */
  const [open, setOpen] = useState(
    () => !window.matchMedia("(max-width: 60rem)").matches,
  );
  const [guided, setGuided] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  /**
   * ⚠️ The workshop used to be one column: bays, then curve, then EE, then the log, then
   * history — 3378px of scroll, with EE starting at 2915. Everything added went to the
   * bottom, and the bottom was two screens past anywhere anyone looks. Three views instead,
   * so nothing new is ever buried by being newest.
   */
  const [view, setView] = useState<"deck" | "analysis" | "log" | "wishlist">("deck");
  const [detail, setDetail] = useState<Target | null>(null);
  const [pane, setPane] = useState(() => Number(store.get("forge.pane", "34")) || 34);

  const sentinel = useRef<HTMLDivElement | null>(null);
  /** Which deck is open. Local to this browser — see `activeDeckId`. */
  const [deckId, setDeckId] = useState(activeDeckId);
  const {
    deck,
    bench,
    benchCard,
    unbenchCard,
    save,
    setQuantity,
    replacePrinting,
    setLegend,
    setChampion,
    setSlots,
    setName,
    setState,
  } = useDeck(deckId);
  const { decks, failed: decksFailed, refresh: refreshDecks } = useDecks(deckId);
  // `holdings` in this file already means the collection summary — this is the other thing:
  // what every BUILT deck is physically holding.
  const { holdings: sleeved, loaded: commitmentsKnown, refresh: refreshCommitments } = useCommitments();

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

  /**
   * Whether Forge knows your boxes at all. ⚠️ **Derived once per collection, never per
   * tile** — `Object.keys` on 600+ printings, called for every card in the grid on every
   * render, is the shape of the lag that made the search box stutter.
   */
  const tracked = holdings.printings > 0;

  /**
   * Paging resets when the *criteria* change — not when the object holding them is rebuilt.
   *
   * ⚠️ **This was a bug you could not work around.** `filters` is a memo over `deck`, so
   * every card added produced a new object with identical contents; the effect then reset the
   * gallery to its first 60 cards. Building a deck from a late set meant scrolling the whole
   * pool again after every single pick. Depending on the contents rather than the identity is
   * the difference between "the filters changed" and "React made a new object".
   */
  const filterKey = useMemo(
    () =>
      JSON.stringify([
        filters.tab,
        filters.query,
        filters.owned,
        filters.sort,
        [...filters.domains].sort(),
        [...filters.types].sort(),
        filters.identity ? [...filters.identity].sort() : null,
        filters.championTag ?? null,
      ]),
    [filters],
  );
  useEffect(() => setShown(PAGE), [filterKey]);

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

  /**
   * Copies held by **other** built decks (D-017).
   *
   * ⚠️ Excluding this deck is what makes editing a `BUILT` deck possible — measured against
   * commitments that include its own contents, every card in it reads as spoken for.
   */
  const committed = useMemo(
    () => committedByPrinting(sleeved, deck.id),
    [sleeved, deck.id],
  );

  const legality = useMemo(
    () =>
      pool
        ? checkLegality(deck, pool.index, { ownership: { collection: owned, committed } })
        : null,
    [deck, pool, owned, committed],
  );

  /** What this deck asks for and cannot have — with the address of whatever holds it. */
  const conflicts = useMemo(
    () => (pool ? findConflicts(deck, pool.index, owned, sleeved) : []),
    [deck, pool, owned, sleeved],
  );

  /**
   * Cards sleeved into more decks than the boxes can supply. Not this deck's fault and not
   * this deck's to fix, so it is reported wherever you are — you traded away a card that is
   * still in a sleeve, and only you know which deck came apart (DATA-MODEL §4).
   */
  const overCommitments = useMemo(
    () => (pool ? overCommitted(pool.index, owned, sleeved) : []),
    [pool, owned, sleeved],
  );

  /**
   * Commitments are derived from deck state, so they go stale exactly when a deck that
   * commits something is written. A `DRAFT` edit changes nothing and is not worth a request.
   */
  /**
   * Re-read commitments when a write **lands**.
   *
   * ⚠️ **On the transition into `saved`, not on `save.status === "saved"`.** The previous
   * version also skipped the read for `DRAFT` decks, to save a request. Both were wrong
   * together: `dismantle()` flips local state to `DRAFT` while the status is still `saved`
   * from the *last* write, so the effect fired immediately, refetched against a server where
   * the deck was still `BUILT`, and consumed the "was it built" flag. When the real write
   * landed, nothing refreshed — so a dismantled deck's cards stayed spoken for until reload.
   *
   * The saved request was two queries over a few hundred rows. It was not worth a class of
   * bug that only shows up as stale advice.
   */
  const wasSaved = useRef(save.status === "saved");
  useEffect(() => {
    const landed = !wasSaved.current && save.status === "saved";
    wasSaved.current = save.status === "saved";
    if (landed) refreshCommitments();
  }, [save.status, refreshCommitments]);

  /**
   * Copies this deck asks for that another built deck is holding — DECK-STATS §3's
   * "collection reality".
   *
   * ⚠️ Derived from the holdings themselves, never from `conflicts`. A conflict only exists
   * when demand *exceeds* availability; cards that are spoken for but still coverable produce
   * no conflict at all, and summing conflicts therefore reported zero while another deck held
   * three of them.
   */
  const committedHere = useMemo(() => {
    if (!pool) return 0;
    const wanted = new Set(
      deck.slots
        .filter((s) => s.zone === "MAIN" || s.zone === "SIDEBOARD")
        .map((s) => pool.byPrinting.get(s.cardId)?.name)
        .filter((n): n is string => Boolean(n)),
    );
    const champion = pool.byPrinting.get(deck.chosenChampionCardId)?.name;
    if (champion) wanted.add(champion);
    return sleeved
      .filter((h) => h.deckId !== deck.id)
      .filter((h) => {
        const name = pool.byPrinting.get(h.cardId)?.name;
        return name !== undefined && wanted.has(name);
      })
      .reduce((n, h) => n + h.quantity, 0);
  }, [deck, pool, sleeved]);

  /**
   * `DRAFT → BUILT` — the one gate (DATA-MODEL §3). Promotion is a claim that these cards
   * are physically in sleeves, and the same card cannot be in two sleeves at once.
   */
  const promote = useCallback(() => {
    // ⚠️ **Not knowing is not the same as nothing.** If `/commitments` has not answered —
    // offline, 500, an expired Access session — `sleeved` is empty and every deck looks
    // unconflicted. Promoting on that would sleeve a card another deck already holds, which
    // is the one direction this feature must not fail in (`useCommitments`).
    if (!commitmentsKnown || conflicts.length > 0) return;
    setState("BUILT");
  }, [commitmentsKnown, conflicts, setState]);

  /** Dismantling has no gate — un-sleeving a deck is always allowed, and releases its cards. */
  const dismantle = useCallback(() => setState("DRAFT"), [setState]);
  /** `W4` — 🟢 Tier 1 facts. Deterministic, so they ride the same live recompute as legality. */
  const facts = useMemo(() => (pool ? deckFacts(deck, pool.index) : null), [deck, pool]);
  /**
   * 🟡 Tier 2. ⚠️ **Only computed while the Analysis view is open.** The simulation is
   * 10,000 openings; running it on every keystroke in the gallery would spend that on a
   * panel nobody is looking at. `view` is in the dependency list for exactly that reason.
   */
  const chances = useMemo(() => {
    if (!pool || view !== "analysis") return null;
    return {
      runes: runeFeasibility(deck, pool.index),
      champion: championAccess(deck, pool.index),
      flexibility: playableOptions(deck, pool.index),
      openings: simulateOpenings(deck, pool.index),
    };
    // ⚠️ Keyed on the deck's *content hash*, not the deck object: `setName` rewrites `deck`
    // on every character typed, and this memo runs 10,000 simulated openings synchronously.
  }, [currentHash, deck, pool, view]);

  /** By name, Chosen Champion included — see `copiesInDeck`. */
  const copiesOfName = useCallback(
    (card: Card) => (pool ? copiesInDeck(deck, pool, card.name) : 0),
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
  if (!pool || !legality || !facts) {
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
            /**
             * ⚠️ **Owned composes with the guided flow; it does not cancel it.**
             *
             * The guided build owns exactly two things — the **tab** and the **identity** —
             * because those are what the step decides. Everything else is a filter and stacks
             * on top: `filtersFor` spreads `base` through unchanged, so "only what I own"
             * narrows a guided step rather than fighting it. Narrowing the Champion step to
             * the champions you actually have is the single most useful combination there is,
             * and this used to drop you out of the flow for asking.
             *
             * `setTab` still exits guided, and should: the flow *overrides* the tab, so a tab
             * press inside it would otherwise do nothing you could see.
             */
            onClick={() => {
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
          {/* ⚠️ Both labels are rendered and CSS picks one, rather than a media-query hook.
              The chevrons describe a panel sliding aside, which is a lie on a phone where
              the same flag opens an overlay — and the phone label carries the deck count, so
              the button says how far along you are without being pressed. */}
          <button
            type="button"
            className="tab toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <span className="wide-only">{open ? "Hide deck ›" : "‹ Deck"}</span>
            <span className="narrow-only">
              {open ? "Close" : `Deck ${mainDeckCount(deck)}/40`}
            </span>
          </button>
        </div>

        {showFilters && (
          <div className="filterbar">
            <div className="fgroup">
              <span className="flabel">Type</span>
              {/* ⚠️ No battlefield or rune chip. Their tabs are the only route to them now,
                  so in every other tab the chip could only ever return nothing — a filter
                  that empties the gallery reads as a broken gallery, not as a filter you
                  should not have pressed. */}
              {TYPES.filter((t) => t !== "battlefield" && t !== "rune").map((t) => (
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
                  // ⚠️ The row's `owned` is this art alone; the limit is the name's total
                  // across every art, which is why it is recomputed rather than reused.
                  limit={copyLimit(row.card, owned, tracked)}
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
              limit={copyLimit(card, owned, tracked)}
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
                {/* ⚠️ The overlay covers the toolbar, so the button that opened it is not
                    reachable to close it. Lives in the workshop's own sticky header, which
                    is the only thing guaranteed to be on screen. */}
                <button
                  type="button"
                  className="ghost narrow-only"
                  onClick={() => setOpen(false)}
                  aria-label="Close the deck and go back to the cards"
                >
                  ✕ Cards
                </button>
              </div>
            </header>

            <DeckBar
              deck={deck}
              decks={decks}
              failed={decksFailed}
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
                  // ⚠️ Reads every deck, not the open one — the only view that does.
                  ["wishlist", "Wishlist"],
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
              conflicts={conflicts}
              overCommitments={overCommitments}
              bench={bench}
              // ⚠️ Adding from the bench leaves it on the bench. Parking a card is not a
              // decision, so acting on one is not a decision to stop considering it — you
              // take it off when you have decided, not as a side effect of trying it.
              onBenchAdd={(cardId) => {
                const card = pool.byPrinting.get(cardId);
                if (!card) return;
                // ⚠️ **The Bench obeys the same cap as the gallery.** Every tile refuses a
                // click at `copyLimit`; this path called `add()` unguarded, so five clicks on
                // a benched card put five copies of it in a deck you own one of — reopening
                // exactly what `1b64b3b` closed, by a route that did not exist when it did.
                if (copiesOfName(card) >= copyLimit(card, owned, tracked)) return;
                add(card, printingOf(card, cardId));
              }}
              onBenchRemove={unbenchCard}
              onPromote={promote}
              onDismantle={dismantle}
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
              {view === "analysis" && facts && (
                <>
                  {/* ⚠️ First, because the badges below are meaningless without it. */}
                  <ClaimLegend />
                  <Statistics
                    facts={facts}
                    // Copies this deck asks for that another BUILT deck is holding — the
                    // "collection reality" DECK-STATS §3 asks for, read from the commitment
                    // data the workshop already has rather than recomputed here.
                    // ⚠️ Counted from the holdings, **not** from the conflict list. Own 4,
                    // ask for 1, another built deck holding 3 produces no conflict — and the
                    // old sum then asserted "nothing is sleeved", which is false, in a panel
                    // labelled `fact`.
                    committed={committedHere}
                    committedKnown={commitmentsKnown}
                  />
                  {chances && <Probabilities {...chances} />}
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

              {view === "wishlist" && <Wishlist pool={pool} owned={owned} />}

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
          benched={bench.some((e) => e.cardId === detail.cardId)}
          onBench={() => {
            if (bench.some((e) => e.cardId === detail.cardId)) unbenchCard(detail.cardId);
            else benchCard(detail.cardId);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
