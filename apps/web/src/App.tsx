import { useEffect, useMemo, useState } from "react";
import { checkLegality, energyCurve, mainDeckCount, zoneCount, type Zone } from "@forge/engine";
import {
  isDeckable,
  loadPool,
  search,
  zoneFor,
  thumb,
  type Card,
  type CardPool,
  type Printing,
} from "./cards.js";
import { useDeck, type SaveState } from "./deckStore.js";

/**
 * `F3` — the whole card pool, 935 cards behind a search box.
 *
 * **Ownership no longer gates the `+` button.** F2 capped it at what you own, which was
 * right when the collection was a fixture and wrong now: LEGALITY.md is explicit that
 * ownership is a *warning*, never a legality failure — "a deck can be perfectly legal and
 * unbuildable, and these must never be conflated". So the cap is the copy limit, and what
 * you own is reported beside it. Until `W2` puts the real collection in, you own nothing,
 * and a deckbuilder that refused to build anything would be useless rather than honest.
 */

const ZONE_LABEL: Record<Zone, string> = {
  MAIN: "Main Deck",
  RUNE: "Rune Deck",
  BATTLEFIELD: "Battlefields",
  SIDEBOARD: "Sideboard",
};
const ZONE_TARGET: Partial<Record<Zone, number>> = { MAIN: 40, RUNE: 12, BATTLEFIELD: 3 };
/** L13. A fourth copy is never legal, so the stepper does not offer one. */
const MAX_COPIES = 3;
/** Rows rendered before you search. Each carries a thumbnail, so this is a bytes decision. */
const VISIBLE = 40;

function Domains({ card }: { card: Card }) {
  return (
    <span className="domains">
      {card.domains.map((d) => (
        <i key={d} className={`dot ${d}`} title={d} />
      ))}
    </span>
  );
}

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
  // Below a handful of cards the histogram describes noise, not a deck.
  if (counted < 5) return <p className="empty">Add a few cards — the curve needs a deck to describe.</p>;
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

/** The stack of alternate arts behind one card. Same card; different coat. */
function ArtPicker({
  card,
  current,
  onPick,
}: {
  card: Card;
  current: string;
  onPick: (printing: Printing) => void;
}) {
  if (card.printings.length < 2) return null;
  return (
    <div className="arts">
      {card.printings.map((p) => (
        <button
          key={p.id}
          type="button"
          className={p.id === current ? "art on" : "art"}
          title={`${p.code}${p.star ? " · showcase" : ""}${p.alt ? " · alternate art" : ""}`}
          onClick={() => onPick(p)}
        >
          <img src={thumb(p, 64)} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

export function App() {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState<"legend" | "champion" | null>(null);
  const { deck, save, setQuantity, replacePrinting, setLegend, setChampion } = useDeck();

  useEffect(() => {
    loadPool().then(setPool, (e: Error) => setFailed(e.message));
    fetch("/collection")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((body: { counts?: Record<string, number> }) => setOwned(body.counts ?? {}))
      .catch(() => setOwned({}));
  }, []);

  const legality = useMemo(
    () => (pool ? checkLegality(deck, pool.index) : null),
    [deck, pool],
  );
  const curve = useMemo(() => (pool ? energyCurve(deck, pool.index) : null), [deck, pool]);

  const legends = useMemo(
    () => (pool ? pool.cards.filter((c) => c.types.includes("legend")) : []),
    [pool],
  );
  const legend = pool?.byPrinting.get(deck.legendCardId);
  const champion = pool?.byPrinting.get(deck.chosenChampionCardId);

  /** L18 — the Chosen Champion's tag must match the Legend's, derived per L32. */
  const eligibleChampions = useMemo(
    () =>
      pool && legend?.championTag
        ? pool.cards.filter(
            (c) =>
              c.types.includes("unit") &&
              c.superTypes.includes("champion") &&
              !c.superTypes.includes("signature") && // L19 — Signature units are ineligible
              c.tags.includes(legend.championTag as string),
          )
        : [],
    [pool, legend],
  );

  const results = useMemo(() => {
    if (!pool) return [];
    return search(pool.cards.filter(isDeckable), query);
  }, [pool, query]);

  if (failed) {
    return (
      <main>
        <h1>Forge</h1>
        <p className="fail">The card pool did not load: {failed}</p>
      </main>
    );
  }
  if (!pool || !legality || !curve) {
    return (
      <main>
        <h1>Forge</h1>
        <p className="empty">Loading 935 cards…</p>
      </main>
    );
  }

  const inDeck = deck.slots
    .map((slot) => ({ slot, card: pool.byPrinting.get(slot.cardId) }))
    .filter((row): row is { slot: (typeof deck.slots)[number]; card: Card } => Boolean(row.card))
    .sort(
      (a, b) =>
        (a.card.energy ?? 99) - (b.card.energy ?? 99) || a.card.name.localeCompare(b.card.name),
    );

  const copiesOfName = (card: Card) =>
    deck.slots
      .filter((s) => pool.byPrinting.get(s.cardId)?.name === card.name)
      .reduce((n, s) => n + s.quantity, 0);

  const ownedOfName = (card: Card) =>
    card.printings.reduce((n, p) => n + (owned[p.id] ?? 0), 0);

  const addOne = (card: Card) => {
    const zone = zoneFor(card);
    // Add to the printing already in the deck if there is one, so quantities stack rather
    // than splitting a card across two rows for no reason.
    const existing = deck.slots.find(
      (s) => s.zone === zone && pool.byPrinting.get(s.cardId)?.name === card.name,
    );
    const printing = existing?.cardId ?? card.printings[0]?.id;
    if (!printing) return;
    setQuantity(printing, zone, (existing?.quantity ?? 0) + 1);
  };

  return (
    <main>
      <header>
        <div>
          <h1>Forge</h1>
          <p className="sub">
            {pool.cards.length} cards · {legend ? legend.name : "no Legend"}
          </p>
        </div>
        <SaveBadge save={save} />
      </header>

      <section className="chosen">
        <button type="button" className="pick" onClick={() => setPicking("legend")}>
          <span className="label">Legend</span>
          <b>{legend?.name ?? "Choose…"}</b>
          <small>
            {legend ? (
              <>
                <Domains card={legend} /> {legend.championTag}
              </>
            ) : (
              "sets your Domain Identity"
            )}
          </small>
        </button>
        <button
          type="button"
          className="pick"
          onClick={() => setPicking("champion")}
          disabled={!legend}
        >
          <span className="label">Chosen Champion</span>
          <b>{champion?.name ?? "Choose…"}</b>
          <small>{champion ? `${champion.energy} Energy · counts inside the 40` : "—"}</small>
        </button>
      </section>

      {picking && (
        <section className="card picker">
          <h2>
            {picking === "legend" ? "Choose a Legend" : "Choose a Champion"}
            <button type="button" className="close" onClick={() => setPicking(null)}>
              close
            </button>
          </h2>
          <ul className="pool">
            {(picking === "legend" ? legends : eligibleChampions).map((c) => (
              <li key={c.name} className="row">
                <img className="thumb" src={c.printings[0] ? thumb(c.printings[0], 96) : ""} alt="" loading="lazy" />
                <span className="who">
                  <b>
                    {c.name} {c.banned && <em className="banned">BANNED</em>}
                  </b>
                  <small>
                    <Domains card={c} />
                    {c.championTag ?? c.tags.join(", ")}
                    {c.energy !== null && ` · ${c.energy} Energy`}
                  </small>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const id = c.printings[0]?.id;
                    if (!id) return;
                    if (picking === "legend") setLegend(id);
                    else setChampion(id);
                    setPicking(null);
                  }}
                >
                  choose
                </button>
              </li>
            ))}
            {picking === "champion" && eligibleChampions.length === 0 && (
              <li className="empty">No champion units carry this Legend's tag.</li>
            )}
          </ul>
        </section>
      )}

      <section className="tally">
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
      </section>

      {legality.violations.length > 0 && (
        <ul className="violations">
          {legality.violations.map((v) => (
            <li key={`${v.check}-${v.message}`}>
              <b>{v.check}</b> <span className="cite">{v.citation}</span>
              <br />
              {v.message}
            </li>
          ))}
        </ul>
      )}

      <section className="card">
        <h2>Energy curve</h2>
        <EnergyCurve {...curve} />
      </section>

      {inDeck.length > 0 && (
        <section className="card">
          <h2>In this deck</h2>
          <ul className="pool">
            {inDeck.map(({ slot, card }) => (
              <li key={`${slot.zone}-${slot.cardId}`} className="row in">
                <span className="cost">{card.energy ?? "–"}</span>
                <span className="who">
                  <b>
                    {card.name} {card.banned && <em className="banned">BANNED</em>}
                  </b>
                  <small>
                    <Domains card={card} />
                    {ZONE_LABEL[slot.zone]}
                    {card.might !== null && ` · ${card.might} Might`}
                  </small>
                  <ArtPicker
                    card={card}
                    current={slot.cardId}
                    onPick={(p) => replacePrinting(slot.cardId, slot.zone, p.id)}
                  />
                </span>
                <span className="stepper">
                  <button
                    type="button"
                    aria-label={`Remove ${card.name}`}
                    onClick={() => setQuantity(slot.cardId, slot.zone, slot.quantity - 1)}
                  >
                    –
                  </button>
                  <b>{slot.quantity}</b>
                  <button
                    type="button"
                    aria-label={`Add ${card.name}`}
                    disabled={slot.zone !== "RUNE" && copiesOfName(card) >= MAX_COPIES}
                    onClick={() => setQuantity(slot.cardId, slot.zone, slot.quantity + 1)}
                  >
                    +
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>
          All cards <span className="of">{results.length} shown</span>
        </h2>
        <input
          className="search"
          type="search"
          value={query}
          placeholder="Search name, rules text or tag — try “deflect” or “jinx”"
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="pool">
          {results.slice(0, VISIBLE).map((card) => {
            const held = copiesOfName(card);
            const own = ownedOfName(card);
            return (
              <li key={card.name} className={held > 0 ? "row in" : "row"}>
                <img className="thumb" src={card.printings[0] ? thumb(card.printings[0], 96) : ""} alt="" loading="lazy" />
                <span className="who">
                  <b>
                    {card.name} {card.banned && <em className="banned">BANNED</em>}
                  </b>
                  <small>
                    <Domains card={card} />
                    {card.energy !== null && `${card.energy}E `}
                    {card.might !== null && `${card.might}M `}
                    {card.printings.length > 1 && `· ${card.printings.length} arts `}
                    {own > 0 ? `· you own ${own}` : ""}
                  </small>
                </span>
                <span className="stepper">
                  <b>{held || ""}</b>
                  <button
                    type="button"
                    aria-label={`Add ${card.name}`}
                    disabled={zoneFor(card) !== "RUNE" && held >= MAX_COPIES}
                    onClick={() => addOne(card)}
                  >
                    +
                  </button>
                </span>
              </li>
            );
          })}
          {results.length > VISIBLE && (
            <li className="empty">
              {results.length - VISIBLE} more — keep typing to narrow it down.
            </li>
          )}
          {results.length === 0 && <li className="empty">Nothing matches “{query}”.</li>}
        </ul>
      </section>

      <footer>
        <p className="caveat">⚠️ {legality.coverage.caveat}</p>
        <p>
          Ownership is a <b>warning, never a legality failure</b> — a deck can be perfectly
          legal and unbuildable, and Forge never conflates the two. The real collection
          arrives at <code>W2</code>.
        </p>
      </footer>
    </main>
  );
}
