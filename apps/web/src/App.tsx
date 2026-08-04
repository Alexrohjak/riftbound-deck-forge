import { useEffect, useMemo, useRef, useState } from "react";
import { checkLegality, energyCurve, mainDeckCount, zoneCount, type Zone } from "@forge/engine";
import {
  isDeckable,
  loadPool,
  search,
  thumb,
  zoneFor,
  type Card,
  type CardPool,
} from "./cards.js";
import { useDeck, type SaveState } from "./deckStore.js";

/**
 * The workbench: a gallery of cards, and a workshop that holds the deck being built.
 *
 * **The card is the information.** Cost, might, domains and rules text are all printed on
 * the card, so a tile is the card and nothing else — no transcribed stats, no chrome.
 *
 * **The workshop is a set of slots, not a list.** A registered deck is a fixed shape: one
 * Legend, one Chosen Champion, 3 Battlefields, 12 Runes, 39 more Main Deck cards. Showing
 * that shape as empty slots makes what is missing visible at a glance — a list of what you
 * have cannot show you what you lack.
 */

const ZONE_LABEL: Record<Zone, string> = {
  MAIN: "Main Deck",
  RUNE: "Rune Deck",
  BATTLEFIELD: "Battlefields",
  SIDEBOARD: "Sideboard",
};

/**
 * Slots per zone. **`MAIN` is 39, not 40** — the Chosen Champion is the fortieth and has
 * its own slot above (L3, TR 601.1.b). Counting it twice here would show a full deck as
 * one card short.
 */
const CAPACITY: Record<Zone, number> = { MAIN: 39, RUNE: 12, BATTLEFIELD: 3, SIDEBOARD: 10 };

/** L13 — a fourth copy is never legal, so the gallery does not offer one. */
const MAX_COPIES = 3;
/** Tiles per page. More arrive as you scroll; 935 card images at once is ~16 MB. */
const PAGE = 60;

/** Gallery tile widths. Stored per browser — a display preference, not deck state. */
const SIZES = { S: "9rem", M: "13rem", L: "18rem" } as const;
type Size = keyof typeof SIZES;
const SIZE_KEY = "forge.tileSize";

type Filter = "all" | "legend" | "main" | "battlefield" | "rune";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "legend", label: "Legends" },
  { id: "main", label: "Main Deck" },
  { id: "battlefield", label: "Battlefields" },
  { id: "rune", label: "Runes" },
];

const matchesFilter = (card: Card, filter: Filter): boolean => {
  if (filter === "all") return true;
  if (filter === "legend") return card.types.includes("legend");
  if (filter === "rune") return card.types.includes("rune");
  if (filter === "battlefield") return card.types.includes("battlefield");
  return isDeckable(card) && zoneFor(card) === "MAIN";
};

function SaveBadge({ save }: { save: SaveState }) {
  if (save.status === "offline") {
    return (
      <span className="save offline" title={save.detail}>
        not saved
      </span>
    );
  }
  return (
    <span className={`save ${save.status}`}>
      {{ loading: "loading…", saving: "saving…", saved: "saved" }[save.status]}
    </span>
  );
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

/** One card in the gallery: the image, and nothing already printed on it. */
function Tile({
  card,
  held,
  index,
  onAdd,
  onRemove,
}: {
  card: Card;
  held: number;
  index: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const printing = card.printings[0];
  const atLimit = !card.types.includes("rune") && held >= MAX_COPIES;
  // A cold CDN transform takes about a second. Without this the grid fills in as a series
  // of hard pops; with it, cards arrive.
  const [ready, setReady] = useState(false);
  // Dealt in, not switched on. Capped at ~12 tiles' worth so a filter change never feels
  // like waiting for a queue.
  const deal = `${Math.min(index, 12) * 22}ms`;
  return (
    <div
      className={held > 0 ? "tile in" : "tile"}
      style={{ ["--deal" as string]: deal }}
    >
      <button type="button" className="face" onClick={onAdd} disabled={atLimit} title={card.name}>
        <img
          src={printing ? thumb(printing, 400) : ""}
          alt={card.name}
          loading="lazy"
          decoding="async"
          width={400}
          height={559}
          className={ready ? "ready" : ""}
          onLoad={() => setReady(true)}
        />
      </button>
      {card.banned && <span className="flag">BANNED</span>}
      {held > 0 && (
        <>
          <span className="qty">{held}</span>
          <button
            type="button"
            className="less"
            onClick={onRemove}
            aria-label={`Remove ${card.name}`}
          >
            –
          </button>
        </>
      )}
    </div>
  );
}

/** A filled slot in the workshop. Clicking it takes that copy back out. */
function Filled({ card, onClear }: { card: Card; onClear: () => void }) {
  const printing = card.printings[0];
  return (
    <button
      type="button"
      className="slot filled"
      title={`${card.name} — click to remove`}
      onClick={onClear}
    >
      <img src={printing ? thumb(printing, 160) : ""} alt={card.name} loading="lazy" />
      {card.banned && <span className="flag">BAN</span>}
    </button>
  );
}

/** An empty slot. Clicking it points the gallery at the cards that could fill it. */
function Empty({ hint, onSeek }: { hint: string; onSeek: () => void }) {
  return (
    <button type="button" className="slot empty" onClick={onSeek} title={hint}>
      <span>+</span>
    </button>
  );
}

export function App() {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(true);
  const [size, setSize] = useState<Size>(
    () => (localStorage.getItem(SIZE_KEY) as Size | null) ?? "M",
  );
  const sentinel = useRef<HTMLDivElement | null>(null);
  const { deck, save, setQuantity, replacePrinting, setLegend, setChampion } = useDeck();

  useEffect(() => {
    loadPool().then(setPool, (e: Error) => setFailed(e.message));
    fetch("/collection")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((b: { counts?: Record<string, number> }) => setOwned(b.counts ?? {}))
      .catch(() => setOwned({}));
  }, []);

  useEffect(() => localStorage.setItem(SIZE_KEY, size), [size]);

  const results = useMemo(() => {
    if (!pool) return [];
    return search(
      pool.cards.filter((c) => matchesFilter(c, filter)),
      query,
    );
  }, [pool, filter, query]);

  useEffect(() => setShown(PAGE), [query, filter]);

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
    // Ownership is passed in so L26/L27 run — they produce warnings, and can never make a
    // deck illegal. That distinction is the point of the whole tool (LEGALITY.md).
    () => (pool ? checkLegality(deck, pool.index, { ownership: { collection: owned } }) : null),
    [deck, pool, owned],
  );
  const curve = useMemo(() => (pool ? energyCurve(deck, pool.index) : null), [deck, pool]);

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
  const champion = pool.byPrinting.get(deck.chosenChampionCardId);

  const copiesOfName = (card: Card) =>
    deck.slots
      .filter((s) => pool.byPrinting.get(s.cardId)?.name === card.name)
      .reduce((n, s) => n + s.quantity, 0);

  const slotFor = (card: Card) =>
    deck.slots.find(
      (s) => s.zone === zoneFor(card) && pool.byPrinting.get(s.cardId)?.name === card.name,
    );

  /** Champion units carrying a given champion tag — L18, minus Signature units (L19). */
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
    if (card.types.includes("legend")) {
      const id = card.printings[0]?.id;
      if (!id) return;
      setLegend(id);
      // ⚠️ The Chosen Champion must carry the new Legend's champion tag (L18), which is not
      // among the 13 checks implemented — so nothing downstream would catch a stale one.
      const keeps = champion && card.championTag && champion.tags.includes(card.championTag);
      if (!keeps) {
        const replacement = championsFor(card.championTag)[0]?.printings[0]?.id;
        if (replacement) setChampion(replacement);
      }
      return;
    }
    const existing = slotFor(card);
    const id = existing?.cardId ?? card.printings[0]?.id;
    if (id) setQuantity(id, zoneFor(card), (existing?.quantity ?? 0) + 1);
  };

  const remove = (card: Card) => {
    const existing = slotFor(card);
    if (existing) setQuantity(existing.cardId, existing.zone, existing.quantity - 1);
  };

  /**
   * One entry per physical card in a zone — three copies occupy three slots, because that
   * is what they occupy in the deck.
   */
  const occupants = (zone: Zone): Array<{ card: Card; cardId: string }> =>
    deck.slots
      .filter((s) => s.zone === zone)
      .flatMap((s) => {
        const card = pool.byPrinting.get(s.cardId);
        return card
          ? Array.from({ length: s.quantity }, () => ({ card, cardId: s.cardId }))
          : [];
      })
      .sort((a, b) => (a.card.energy ?? 99) - (b.card.energy ?? 99) || a.card.name.localeCompare(b.card.name));

  const takeOne = (cardId: string, zone: Zone) => {
    const slot = deck.slots.find((s) => s.cardId === cardId && s.zone === zone);
    if (slot) setQuantity(cardId, zone, slot.quantity - 1);
  };

  const SEEK: Record<Zone, Filter> = {
    MAIN: "main",
    RUNE: "rune",
    BATTLEFIELD: "battlefield",
    SIDEBOARD: "main",
  };

  const bay = (zone: Zone) => {
    const held = occupants(zone);
    const capacity = CAPACITY[zone];
    const blanks = Math.max(0, capacity - held.length);
    return (
      <div className="bay" key={zone}>
        <h2>
          {ZONE_LABEL[zone]}
          <span className={held.length === capacity ? "of done" : "of"}>
            {held.length} / {capacity}
          </span>
          {zone === "MAIN" && <span className="of">+ Champion = 40</span>}
          {zone === "SIDEBOARD" && <span className="of">optional</span>}
        </h2>
        <div className="slots">
          {held.map((o, i) => (
            <Filled key={`${o.cardId}-${i}`} card={o.card} onClear={() => takeOne(o.cardId, zone)} />
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <Empty
              key={`blank-${i}`}
              hint={`Add a card to the ${ZONE_LABEL[zone]}`}
              onSeek={() => setFilter(SEEK[zone])}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={open ? "workspace" : "workspace solo"}>
      <section className="gallery">
        <div className="toolbar">
          <div className="tabs">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={filter === f.id ? "tab on" : "tab"}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="search"
            type="search"
            value={query}
            placeholder="Search name, rules text or tag"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="sizes">
            {(Object.keys(SIZES) as Size[]).map((s) => (
              <button
                key={s}
                type="button"
                className={size === s ? "tab on" : "tab"}
                onClick={() => setSize(s)}
                title={`${s === "S" ? "Small" : s === "M" ? "Medium" : "Large"} cards`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="count">{results.length}</span>
          <button type="button" className="tab toggle" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide workshop ›" : "‹ Workshop"}
          </button>
        </div>

        <div className="grid" style={{ ["--tile" as string]: SIZES[size] }}>
          {results.slice(0, shown).map((card, i) => (
            <Tile
              key={card.name}
              index={i % PAGE}
              card={card}
              held={card.types.includes("legend") ? 0 : copiesOfName(card)}
              onAdd={() => add(card)}
              onRemove={() => remove(card)}
            />
          ))}
        </div>

        <div ref={sentinel} className="sentinel">
          {shown < results.length ? `${results.length - shown} more…` : ""}
          {results.length === 0 && <span className="empty">Nothing matches “{query}”.</span>}
        </div>
      </section>

      {open && (
        <aside className="workshop">
          <header>
            <h1>Forge</h1>
            <SaveBadge save={save} />
          </header>

          {legend && (
            <p className="identity-line">
              <span className="identity">
                {legend.domains.map((d) => (
                  <i key={d} className={`dot ${d}`} title={d} />
                ))}
              </span>
              <span>{legend.domains.join(" + ")} identity</span>
            </p>
          )}

          <div className="tally">
            {(["MAIN", "RUNE", "BATTLEFIELD"] as Zone[]).map((zone) => {
              const count = zone === "MAIN" ? mainDeckCount(deck) : zoneCount(deck, zone);
              const target = zone === "MAIN" ? 40 : CAPACITY[zone];
              // Met / short / over, carried by a solid rule, a dashed one and a strike —
              // never by red and green, which would collide with Fury and Body (D2).
              const state = count === target ? "done" : count > target ? "over" : "short";
              return (
                <div key={zone} className={`stat ${state}`}>
                  <b>
                    {count}
                    <span className="of">/{target}</span>
                  </b>
                  <span>{ZONE_LABEL[zone]}</span>
                </div>
              );
            })}
            <div className={legality.legal ? "stat verdict pass" : "stat verdict fail"}>
              <b>{legality.legal ? "✓" : legality.violations.length}</b>
              <span>
                {legality.legal
                  ? "checks pass"
                  : legality.violations.length === 1
                    ? "problem"
                    : "problems"}
              </span>
            </div>
          </div>

          {legality.violations.length > 0 && (
            <ul className="violations">
              {legality.violations.map((v) => (
                <li key={`${v.check}-${v.message}`}>
                  <b>{v.check}</b> <span className="cite">{v.citation}</span> {v.message}
                </li>
              ))}
            </ul>
          )}

          {/* Separate list, separate colour: these never make the deck illegal. */}
          {legality.warnings.length > 0 && (
            <ul className="warnings">
              {legality.warnings.map((w) => (
                <li key={`${w.check}-${w.message}`}>
                  <b>{w.check}</b> {w.message}
                </li>
              ))}
            </ul>
          )}

          <div className="bay singles">
            <div>
              <h2>
                Legend<span className="of">{legend ? "1 / 1" : "0 / 1"}</span>
              </h2>
              <div className="slots">
                {legend ? (
                  <button
                    type="button"
                    className="slot filled"
                    title={`${legend.name} — pick another in the Legends tab`}
                    onClick={() => setFilter("legend")}
                  >
                    <img
                      src={legend.printings[0] ? thumb(legend.printings[0], 160) : ""}
                      alt={legend.name}
                    />
                  </button>
                ) : (
                  <Empty hint="Choose a Legend" onSeek={() => setFilter("legend")} />
                )}
              </div>
            </div>
            <div>
              <h2>
                Champion<span className="of">{champion ? "1 / 1" : "0 / 1"}</span>
              </h2>
              <div className="slots">
                {champion ? (
                  <button
                    type="button"
                    className="slot filled"
                    title={`${champion.name} — click to change`}
                    onClick={() => setPicking((p) => !p)}
                  >
                    <img
                      src={champion.printings[0] ? thumb(champion.printings[0], 160) : ""}
                      alt={champion.name}
                    />
                  </button>
                ) : (
                  <Empty hint="Choose a Champion" onSeek={() => setPicking(true)} />
                )}
              </div>
            </div>
          </div>

          {picking && (
            <ul className="champions">
              {championsFor(legend?.championTag).map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => {
                      const id = c.printings[0]?.id;
                      if (id) setChampion(id);
                      setPicking(false);
                    }}
                  >
                    <img src={c.printings[0] ? thumb(c.printings[0], 96) : ""} alt="" loading="lazy" />
                    <span>{c.name}</span>
                  </button>
                </li>
              ))}
              {championsFor(legend?.championTag).length === 0 && (
                <li className="empty">No champion units carry this Legend's tag.</li>
              )}
            </ul>
          )}

          {bay("MAIN")}
          {bay("RUNE")}
          {bay("BATTLEFIELD")}
          {bay("SIDEBOARD")}

          <div className="panel">
            <h2>Energy curve</h2>
            <EnergyCurve {...curve} />
          </div>

          {/* Alternate arts live here rather than on the slots: which coat a card wears is a
              per-printing choice, and the slots deliberately show physical copies. */}
          {deck.slots.some((s) => (pool.byPrinting.get(s.cardId)?.printings.length ?? 0) > 1) && (
            <div className="panel">
              <h2>Alternate arts</h2>
              <ul className="deckrows">
                {deck.slots
                  .map((slot) => ({ slot, card: pool.byPrinting.get(slot.cardId) }))
                  .filter(
                    (r): r is { slot: (typeof deck.slots)[number]; card: Card } =>
                      Boolean(r.card) && (r.card?.printings.length ?? 0) > 1,
                  )
                  .map(({ slot, card }) => (
                    <li key={`${slot.zone}-${slot.cardId}`}>
                      <span className="nm">{card.name}</span>
                      <span className="arts">
                        {card.printings.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={p.id === slot.cardId ? "art on" : "art"}
                            title={p.code}
                            onClick={() => replacePrinting(slot.cardId, slot.zone, p.id)}
                          >
                            <img src={thumb(p, 64)} alt="" loading="lazy" />
                          </button>
                        ))}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {Object.keys(owned).length > 0 && (
            <p className="caveat">
              Ownership is a warning, never a legality failure — a deck can be perfectly legal
              and unbuildable.
            </p>
          )}
          <p className="caveat">⚠️ {legality.coverage.caveat}</p>
        </aside>
      )}
    </div>
  );
}
