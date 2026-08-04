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
  type Printing,
} from "./cards.js";
import { useDeck, type SaveState } from "./deckStore.js";

/**
 * The workbench: a gallery of cards, and the deck beside it.
 *
 * **The card is the information.** Cost, might, domains and rules text are all printed on
 * the card itself, so a row of transcribed stats beside a thumbnail was duplication that
 * pushed the actual card down to a postage stamp. Big art, no chrome — you recognise a
 * card by its art far faster than you read it by its name.
 *
 * **Release order, not alphabetical.** Collector numbers only mean anything inside a set,
 * and alphabetical order means nothing to anyone. The index ships pre-sorted (`release`),
 * and neither filtering nor searching reorders it.
 */

const ZONE_LABEL: Record<Zone, string> = {
  MAIN: "Main Deck",
  RUNE: "Rune Deck",
  BATTLEFIELD: "Battlefields",
  SIDEBOARD: "Sideboard",
};
const ZONE_TARGET: Partial<Record<Zone, number>> = { MAIN: 40, RUNE: 12, BATTLEFIELD: 3 };
/** L13 — a fourth copy is never legal, so the gallery does not offer one. */
const MAX_COPIES = 3;
/** Tiles per page. More arrive as you scroll; 935 card images at once is ~16 MB. */
const PAGE = 60;

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
  onAdd,
  onRemove,
}: {
  card: Card;
  held: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const printing = card.printings[0];
  const atLimit = !card.types.includes("rune") && held >= MAX_COPIES;
  return (
    <div className={held > 0 ? "tile in" : "tile"}>
      <button type="button" className="face" onClick={onAdd} disabled={atLimit} title={card.name}>
        <img
          src={printing ? thumb(printing, 280) : ""}
          alt={card.name}
          loading="lazy"
          decoding="async"
          width={280}
          height={391}
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

export function App() {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [picking, setPicking] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const { deck, save, setQuantity, replacePrinting, setLegend, setChampion } = useDeck();

  useEffect(() => {
    loadPool().then(setPool, (e: Error) => setFailed(e.message));
    fetch("/collection")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((b: { counts?: Record<string, number> }) => setOwned(b.counts ?? {}))
      .catch(() => setOwned({}));
  }, []);

  const results = useMemo(() => {
    if (!pool) return [];
    return search(
      pool.cards.filter((c) => matchesFilter(c, filter)),
      query,
    );
  }, [pool, filter, query]);

  // A new list means starting at the top of it — showing page 15 of a fresh search is noise.
  useEffect(() => setShown(PAGE), [query, filter]);

  // Reveal more as you approach the end, rather than mounting 935 images up front.
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

  const legality = useMemo(() => (pool ? checkLegality(deck, pool.index) : null), [deck, pool]);
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
    // A Legend is not added to a deck — it *is* the deck's identity, so clicking one in
    // the Legends tab selects it.
    if (card.types.includes("legend")) {
      const id = card.printings[0]?.id;
      if (!id) return;
      setLegend(id);

      // ⚠️ The Chosen Champion must carry the new Legend's champion tag (L18). Leaving the
      // old one would put the deck in a state the rules forbid — and L18 is not among the
      // 13 checks implemented, so nothing downstream would catch it. Every Legend has
      // between 2 and 4 eligible champion units, so there is always one to fall back to.
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

  const zoneRows = (zone: Zone) =>
    deck.slots
      .filter((s) => s.zone === zone)
      .map((slot) => ({ slot, card: pool.byPrinting.get(slot.cardId) }))
      .filter((r): r is { slot: (typeof deck.slots)[number]; card: Card } => Boolean(r.card))
      .sort(
        (a, b) =>
          (a.card.energy ?? 99) - (b.card.energy ?? 99) || a.card.name.localeCompare(b.card.name),
      );

  return (
    <div className="workspace">
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
          <span className="count">{results.length} cards</span>
        </div>

        <div className="grid">
          {results.slice(0, shown).map((card) => (
            <Tile
              key={card.name}
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

      <aside className="deckpane">
        <header>
          <h1>Forge</h1>
          <SaveBadge save={save} />
        </header>

        <div className="chosen">
          <div className="pick">
            <span className="label">Legend</span>
            <b>{legend?.name ?? "none"}</b>
            <small>{legend ? legend.championTag : "pick one in the Legends tab"}</small>
          </div>
          <button
            type="button"
            className="pick"
            onClick={() => setPicking((p) => !p)}
            disabled={!legend}
          >
            <span className="label">Champion</span>
            <b>{champion?.name ?? "Choose…"}</b>
            <small>{champion ? "counted inside the 40" : "—"}</small>
          </button>
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

        <div className="tally">
          {(["MAIN", "RUNE", "BATTLEFIELD"] as Zone[]).map((zone) => {
            const held = zone === "MAIN" ? mainDeckCount(deck) : zoneCount(deck, zone);
            const target = ZONE_TARGET[zone] ?? 0;
            return (
              <div key={zone} className={held === target ? "slot done" : "slot"}>
                <b>
                  {held}
                  <span className="of">/{target}</span>
                </b>
                <span>{ZONE_LABEL[zone]}</span>
              </div>
            );
          })}
          <div className={legality.legal ? "slot verdict pass" : "slot verdict fail"}>
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

        <div className="panel">
          <h2>Energy curve</h2>
          <EnergyCurve {...curve} />
        </div>

        {(["MAIN", "RUNE", "BATTLEFIELD", "SIDEBOARD"] as Zone[]).map((zone) => {
          const rows = zoneRows(zone);
          if (rows.length === 0) return null;
          return (
            <div className="panel" key={zone}>
              <h2>
                {ZONE_LABEL[zone]}{" "}
                <span className="of">
                  {zoneCount(deck, zone)}
                  {ZONE_TARGET[zone] ? ` / ${ZONE_TARGET[zone]}` : ""}
                </span>
              </h2>
              <ul className="deckrows">
                {rows.map(({ slot, card }) => {
                  const own = card.printings.reduce((n, p) => n + (owned[p.id] ?? 0), 0);
                  return (
                    <li key={`${zone}-${slot.cardId}`}>
                      <span className="n">{slot.quantity}</span>
                      <span className="nm">
                        {card.name}
                        {card.banned && <em className="flag">BANNED</em>}
                        {own > 0 && <em className="own">own {own}</em>}
                      </span>
                      {card.printings.length > 1 && (
                        <span className="arts">
                          {card.printings.map((p: Printing) => (
                            <button
                              key={p.id}
                              type="button"
                              className={p.id === slot.cardId ? "art on" : "art"}
                              title={p.code}
                              onClick={() => replacePrinting(slot.cardId, zone, p.id)}
                            >
                              <img src={thumb(p, 64)} alt="" loading="lazy" />
                            </button>
                          ))}
                        </span>
                      )}
                      <button
                        type="button"
                        className="less"
                        aria-label={`Remove ${card.name}`}
                        onClick={() => setQuantity(slot.cardId, zone, slot.quantity - 1)}
                      >
                        –
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <p className="caveat">⚠️ {legality.coverage.caveat}</p>
      </aside>
    </div>
  );
}
