import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkLegality, energyCurve, zoneCount, type Zone } from "@forge/engine";
import { hd, loadPool, srcSet, zoneFor, type Card, type CardPool, type Printing } from "./cards.js";
import { useDeck, type SaveState } from "./deckStore.js";
import { apply, DOMAIN_LIST, NO_FILTERS, SORTS, TYPES, type Filters, type Tab } from "./filters.js";
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
const SIZES = { S: "9rem", M: "13rem", L: "18rem" } as const;
type Size = keyof typeof SIZES;

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
  index,
  sizes,
  onAdd,
  onRemove,
}: {
  card: Card;
  held: number;
  index: number;
  /** ⚠️ A literal length. `sizes` is parsed before CSS, so `var(--tile)` silently
      falls back to 100vw — which had the gallery fetching 2492px images to draw at 208. */
  sizes: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const printing = card.printings[0];
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
            src={hd(printing, 300)}
            srcSet={srcSet(printing)}
            sizes={sizes}
            alt={card.name}
            loading="lazy"
            decoding="async"
            width={300}
            height={419}
            className={ready ? "ready" : ""}
            onLoad={() => setReady(true)}
          />
        )}
      </button>
      {held > 0 && <span className="held">{held}</span>}
    </div>
  );
}

export function App() {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [base, setBase] = useState<Filters>(NO_FILTERS);
  const [shown, setShown] = useState(PAGE);
  const [size, setSize] = useState<Size>(() => store.get("forge.tileSize", "M") as Size);
  const [open, setOpen] = useState(true);
  const [guided, setGuided] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Target | null>(null);
  const [pane, setPane] = useState(() => Number(store.get("forge.pane", "34")) || 34);

  const sentinel = useRef<HTMLDivElement | null>(null);
  const { deck, save, setQuantity, replacePrinting, setLegend, setChampion, setSlots } = useDeck();

  useEffect(() => {
    loadPool().then(setPool, (e: Error) => setFailed(e.message));
    fetch("/collection")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((b: { counts?: Record<string, number> }) => setOwned(b.counts ?? {}))
      .catch(() => setOwned({}));
  }, []);

  useEffect(() => store.set("forge.tileSize", size), [size]);
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

  const results = useMemo(() => (pool ? apply(pool.cards, filters) : []), [pool, filters]);
  useEffect(() => setShown(PAGE), [filters]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShown((n) => n + PAGE);
      },
      { rootMargin: "800px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [results.length]);

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

  const add = (card: Card) => {
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
            className={showFilters || activeFilters ? "tab on" : "tab"}
            onClick={() => setShowFilters((s) => !s)}
          >
            Filters{activeFilters > 0 && <em className="pipcount">{activeFilters}</em>}
          </button>

          <div className="sizes">
            {(Object.keys(SIZES) as Size[]).map((s) => (
              <button key={s} type="button" className={size === s ? "tab on" : "tab"} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>

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
              {SORTS.map((s) => (
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

        <div className="grid" style={{ ["--tile" as string]: SIZES[size] }}>
          {results.slice(0, shown).map((card, i) => (
            <Tile
              key={card.name}
              index={i % PAGE}
              sizes={SIZES[size]}
              card={card}
              held={card.types.includes("legend") ? 0 : copiesOfName(card)}
              onAdd={() => add(card)}
              onRemove={() => removeOne(card)}
            />
          ))}
        </div>

        <div ref={sentinel} className="sentinel">
          {shown < results.length ? `${results.length - shown} more…` : ""}
          {results.length === 0 && <span className="empty">Nothing matches those filters.</span>}
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

            <Workshop
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
              <section className="panel">
                <h2>Energy curve</h2>
                <EnergyCurve {...curve} />
              </section>
              <p className="caveat">⚠️ {legality.coverage.caveat}</p>
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
