import { useMemo } from "react";
import { checkLegality, energyCurve, mainDeckCount, zoneCount, type Zone } from "@forge/engine";
import {
  CARDS,
  CHAMPION_CARD_ID,
  COLLECTION,
  LEGEND_CARD_ID,
  OWNED_IDS,
  cardIndex,
  cardOf,
  zoneFor,
  type PoolCard,
} from "./pool.js";
import { quantityOf, useDeck, type SaveState } from "./deckStore.js";

/**
 * `F2` — the first genuinely usable version.
 *
 * **Deliberately crude** (PLAN.md §4): one hardcoded Legend, a static ~30-name pool, and
 * one statistic. It exists because the audit named time-to-first-value as the project's
 * dominant risk (A12) — four milestones of infrastructure before anything was usable was
 * the plan this replaces.
 *
 * The locked `D2` interface is **not** what this is. That arrives with the real card pool
 * and the ownership visual language; dressing this up would invite mistaking it for the
 * finished thing.
 */

const ZONE_LABEL: Record<Zone, string> = {
  MAIN: "Main Deck",
  RUNE: "Rune Deck",
  BATTLEFIELD: "Battlefields",
  SIDEBOARD: "Sideboard",
};

/** What each zone must hold when the deck is legal (L3, L4, L5). */
const ZONE_TARGET: Partial<Record<Zone, number>> = { MAIN: 40, RUNE: 12, BATTLEFIELD: 3 };

function Domains({ card }: { card: PoolCard }) {
  return (
    <span className="domains">
      {card.domains.map((domain) => (
        <i key={domain} className={`dot ${domain}`} title={domain} />
      ))}
    </span>
  );
}

function SaveBadge({ save }: { save: SaveState }) {
  if (save.status === "offline") {
    return (
      <span className="save offline" title={save.detail}>
        not saved — no connection
      </span>
    );
  }
  const label = { loading: "loading…", saving: "saving…", saved: "saved" }[save.status];
  return <span className={`save ${save.status}`}>{label}</span>;
}

/** The one statistic F2 ships. A histogram, never a mean (DECK-STATS §6). */
function EnergyCurve({ counts, unknown }: { counts: number[]; unknown: number }) {
  const peak = Math.max(1, ...counts);
  if (counts.length === 0) return <p className="empty">Add a card to see the curve.</p>;

  return (
    <div className="curve">
      {counts.map((count, energy) => (
        <div className="bar" key={energy}>
          <span className="count">{count || ""}</span>
          <span className="stem" style={{ height: `${(count / peak) * 100}%` }} />
          <span className="tick">{energy}</span>
        </div>
      ))}
      {unknown > 0 && <p className="empty">{unknown} card(s) with no cost data — not shown.</p>}
    </div>
  );
}

export function App() {
  const { deck, save, setQuantity, clear } = useDeck();

  const legality = useMemo(() => checkLegality(deck, cardIndex), [deck]);
  const curve = useMemo(() => energyCurve(deck, cardIndex), [deck]);

  const legend = cardOf(LEGEND_CARD_ID);
  const champion = cardOf(CHAMPION_CARD_ID);

  const tally: Array<{ zone: Zone; held: number; target: number }> = (
    ["MAIN", "RUNE", "BATTLEFIELD"] as Zone[]
  ).map((zone) => ({
    zone,
    // The Champion sits inside the 40 without being a slot (L3), so MAIN is counted the
    // way the rules count it, not the way the slots array looks.
    held: zone === "MAIN" ? mainDeckCount(deck) : zoneCount(deck, zone),
    target: ZONE_TARGET[zone] ?? 0,
  }));

  const groups = (["MAIN", "RUNE", "BATTLEFIELD"] as Zone[]).map((zone) => ({
    zone,
    ids: OWNED_IDS.filter((id) => {
      const card = cardOf(id);
      return card ? zoneFor(card) === zone : false;
    }),
  }));

  return (
    <main>
      <header>
        <div>
          <h1>Forge</h1>
          <p className="sub">
            {legend ? legend.name : LEGEND_CARD_ID} · {legend?.domains.join(" + ")} ·{" "}
            {champion?.name}
          </p>
        </div>
        <SaveBadge save={save} />
      </header>

      <section className="tally">
        {tally.map(({ zone, held, target }) => (
          <div key={zone} className={held === target ? "slot done" : "slot"}>
            <b>
              {held}
              <span className="of">/{target}</span>
            </b>
            <span>{ZONE_LABEL[zone]}</span>
          </div>
        ))}
        <div className={legality.legal ? "slot verdict pass" : "slot verdict fail"}>
          <b>{legality.legal ? "✓" : legality.violations.length}</b>
          <span>
            {legality.legal ? "checks pass" : legality.violations.length === 1 ? "problem" : "problems"}
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
        <EnergyCurve counts={curve.counts} unknown={curve.unknown} />
      </section>

      {groups.map(({ zone, ids }) => (
        <section className="card" key={zone}>
          <h2>
            {ZONE_LABEL[zone]}{" "}
            <span className="of">
              {zone === "MAIN" ? mainDeckCount(deck) : zoneCount(deck, zone)}
              {ZONE_TARGET[zone] ? ` of ${ZONE_TARGET[zone]}` : ""}
            </span>
          </h2>

          <ul className="pool">
            {ids.map((id) => {
              const card = cardOf(id);
              if (!card) return null;
              const owned = COLLECTION[id] ?? 0;
              const held = quantityOf(deck, id, zone);
              const isChampion = id === CHAMPION_CARD_ID;

              return (
                <li key={id} className={held > 0 ? "row in" : "row"}>
                  <span className="cost">{card.energy ?? "–"}</span>
                  <span className="who">
                    <b>{card.name}</b>
                    <small>
                      <Domains card={card} />
                      {card.might !== null && ` ${card.might} Might`}
                      {card.power ? ` · ${card.power} Power` : ""}
                      {isChampion && " · your Chosen Champion, counted as +1"}
                    </small>
                  </span>
                  <span className="stepper">
                    <button
                      type="button"
                      aria-label={`Remove ${card.name}`}
                      disabled={held === 0}
                      onClick={() => setQuantity(id, zone, held - 1)}
                    >
                      –
                    </button>
                    <b>
                      {held}
                      <span className="of">/{owned}</span>
                    </b>
                    <button
                      type="button"
                      aria-label={`Add ${card.name}`}
                      // Capped at what you physically own — you cannot sleeve a card that
                      // is not in the box. The 3-copy limit is a separate matter, and the
                      // engine reports it: ownership and legality are never conflated
                      // (LEGALITY.md L26/L27).
                      disabled={held >= owned}
                      onClick={() => setQuantity(id, zone, held + 1)}
                    >
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer>
        <p className="caveat">⚠️ {legality.coverage.caveat}</p>
        <p>
          <button type="button" className="clear" onClick={clear}>
            Empty the deck
          </button>
        </p>
        <p>
          <code>F2</code> — one Legend, {OWNED_IDS.length} owned printings, one statistic. The
          full pool arrives at <code>F3</code>.
        </p>
      </footer>
    </main>
  );
}
