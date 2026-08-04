import type { Deck, LegalityResult, Zone } from "@forge/engine";
import { mainDeckCount, zoneCount } from "@forge/engine";
import { hd, type Card, type CardPool } from "./cards.js";
import { STEPS, type Step } from "./buildFlow.js";

/**
 * The tray: one card-shaped slot for every card the deck needs, filled or not.
 *
 * A registered deck has a fixed shape — one Legend, one Chosen Champion, 3 Battlefields,
 * 12 Runes, 39 more Main Deck cards. Drawing that shape makes what is *missing* visible,
 * which a list of what you have cannot do.
 *
 * **Left click opens the card. Right click takes one out.** No hover-only affordances and
 * no 20px targets — the previous version put a tiny minus in a corner that was hard to hit
 * and easy to hit by accident.
 */

/** `MAIN` is 39: the Chosen Champion is the fortieth and has its own slot (L3). */
export const CAPACITY: Record<Zone, number> = { MAIN: 39, RUNE: 12, BATTLEFIELD: 3, SIDEBOARD: 10 };

const ZONE_LABEL: Record<Zone, string> = {
  MAIN: "Main Deck",
  RUNE: "Runes",
  BATTLEFIELD: "Battlefields",
  SIDEBOARD: "Sideboard",
};

export interface Occupant {
  card: Card;
  cardId: string;
}

/**
 * What was clicked, and in what capacity.
 *
 * ⚠️ **The Legend and the Chosen Champion are singular fields, not slots** (DATA-MODEL §1).
 * Removing them means clearing a field; removing anything else means decrementing a slot.
 * The first version of this searched `deck.slots` for the Legend, found nothing, and
 * silently did nothing — so the role is now stated rather than inferred from the id, which
 * also settles the case where the Chosen Champion is *also* in the Main Deck.
 */
export type Role = "legend" | "champion" | "slot";

export interface Target extends Occupant {
  zone: Zone;
  role: Role;
}

function Slots({
  held,
  capacity,
  onOpen,
  onRemove,
  onSeek,
  size = 62,
}: {
  held: Occupant[];
  capacity: number;
  onOpen: (o: Occupant) => void;
  onRemove: (o: Occupant) => void;
  onSeek: () => void;
  size?: number;
}) {
  const blanks = Math.max(0, capacity - held.length);
  return (
    <div className="slots">
      {held.map((o, i) => (
        <button
          key={`${o.cardId}-${i}`}
          type="button"
          className="slot filled"
          aria-label={`${o.card.name} — details`}
          title={`${o.card.name} — click for details, right-click to remove`}
          onClick={() => onOpen(o)}
          onContextMenu={(e) => {
            e.preventDefault();
            onRemove(o);
          }}
        >
          <img src={o.card.printings[0] ? hd(o.card.printings[0], size) : ""} alt={o.card.name} loading="lazy" />
        </button>
      ))}
      {Array.from({ length: blanks }, (_, i) => (
        <button
          key={`blank-${i}`}
          type="button"
          className="slot empty"
          onClick={onSeek}
          aria-label="Find a card for this slot"
        />
      ))}
    </div>
  );
}

export function Workshop({
  deck,
  pool,
  legality,
  step,
  guided,
  occupants,
  onOpen,
  onRemove,
  onSeek,
  children,
}: {
  deck: Deck;
  pool: CardPool;
  legality: LegalityResult;
  step: Step;
  guided: boolean;
  occupants: (zone: Zone) => Occupant[];
  onOpen: (t: Target) => void;
  onRemove: (t: Target) => void;
  onSeek: (zone: Zone) => void;
  children?: React.ReactNode;
}) {
  const legend = pool.byPrinting.get(deck.legendCardId);
  const champion = pool.byPrinting.get(deck.chosenChampionCardId);

  const bay = (zone: Zone) => {
    const held = occupants(zone);
    if (zone === "SIDEBOARD" && held.length === 0) return null;
    const capacity = CAPACITY[zone];
    return (
      <section className="bay" key={zone}>
        <h2>
          {ZONE_LABEL[zone]}
          <span className={held.length === capacity ? "of met" : "of"}>
            {held.length} / {capacity}
          </span>
        </h2>
        <Slots
          held={held}
          capacity={capacity}
          onOpen={(o) => onOpen({ ...o, zone, role: "slot" })}
          onRemove={(o) => onRemove({ ...o, zone, role: "slot" })}
          onSeek={() => onSeek(zone)}
        />
      </section>
    );
  };

  return (
    <>
      {guided && (
        <ol className="steps">
          {STEPS.map(({ step: s, label }) => {
            const order = STEPS.findIndex((x) => x.step === s);
            const nowAt = STEPS.findIndex((x) => x.step === step);
            const state = step === "done" || order < nowAt ? "done" : s === step ? "now" : "";
            return (
              <li key={s} className={state}>
                {label}
              </li>
            );
          })}
        </ol>
      )}

      <div className="tally">
        {(["MAIN", "RUNE", "BATTLEFIELD"] as Zone[]).map((zone) => {
          const count = zone === "MAIN" ? mainDeckCount(deck) : zoneCount(deck, zone);
          const target = zone === "MAIN" ? 40 : CAPACITY[zone];
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
        <div className={legality.legal ? "stat verdict" : "stat verdict fail"}>
          <b>{legality.legal ? "✓" : legality.violations.length}</b>
          <span>
            {legality.legal ? "checks pass" : legality.violations.length === 1 ? "problem" : "problems"}
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

      {legality.warnings.length > 0 && (
        <ul className="warnings">
          {legality.warnings.map((w) => (
            <li key={`${w.check}-${w.message}`}>
              <b>{w.check}</b> {w.message}
            </li>
          ))}
        </ul>
      )}

      <section className="bay singles">
        <div>
          <h2>
            Legend<span className={legend ? "of met" : "of"}>{legend ? "1 / 1" : "0 / 1"}</span>
          </h2>
          <div className="slots">
            {legend ? (
              <button
                type="button"
                className="slot filled tall"
                aria-label={`Legend: ${legend.name} — details`}
                title={`${legend.name} — click for details, right-click to clear`}
                onClick={() =>
                  onOpen({ card: legend, cardId: deck.legendCardId, zone: "MAIN", role: "legend" })
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove({ card: legend, cardId: deck.legendCardId, zone: "MAIN", role: "legend" });
                }}
              >
                <img src={legend.printings[0] ? hd(legend.printings[0], 160) : ""} alt={legend.name} />
              </button>
            ) : (
              <button
                type="button"
                className="slot empty tall"
                aria-label="Choose a Legend"
                onClick={() => onSeek("MAIN")}
              />
            )}
          </div>
          {legend && (
            <p className="identity-line">
              <span className="identity">
                {legend.domains.map((d) => (
                  <i key={d} className={`dot ${d}`} title={d} />
                ))}
              </span>
              {legend.domains.join(" + ")}
            </p>
          )}
        </div>
        <div>
          <h2>
            Champion<span className={champion ? "of met" : "of"}>{champion ? "1 / 1" : "0 / 1"}</span>
          </h2>
          <div className="slots">
            {champion ? (
              <button
                type="button"
                className="slot filled tall"
                aria-label={`Chosen Champion: ${champion.name} — details`}
                title={`${champion.name} — click for details, right-click to clear`}
                onClick={() =>
                  onOpen({
                    card: champion,
                    cardId: deck.chosenChampionCardId,
                    zone: "MAIN",
                    role: "champion",
                  })
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove({
                    card: champion,
                    cardId: deck.chosenChampionCardId,
                    zone: "MAIN",
                    role: "champion",
                  });
                }}
              >
                <img src={champion.printings[0] ? hd(champion.printings[0], 160) : ""} alt={champion.name} />
              </button>
            ) : (
              <button
                type="button"
                className="slot empty tall"
                aria-label="Choose a Legend"
                onClick={() => onSeek("MAIN")}
              />
            )}
          </div>
          {champion && <p className="identity-line">counted inside the 40</p>}
        </div>
      </section>

      {bay("MAIN")}
      {bay("RUNE")}
      {bay("BATTLEFIELD")}
      {bay("SIDEBOARD")}

      {children}
    </>
  );
}
