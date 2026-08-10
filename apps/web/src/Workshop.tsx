import type { Conflict, Deck, LegalityResult, Zone } from "@forge/engine";
import { conflictSentence, mainDeckCount, zoneCount } from "@forge/engine";
import { useState } from "react";
import { hd, printingOf, srcSet, zoneFor, type Card, type CardPool } from "./cards.js";
import { STEPS, type Step } from "./buildFlow.js";
import type { BenchEntry } from "./deckStore.js";

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

/** One physical card in the tray. Three copies are three entries, in play order. */
export interface Occupant {
  card: Card;
  cardId: string;
  quantity: number;
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

/**
 * A full-size look at whatever the pointer is over.
 *
 * ⚠️ Fixed-position rather than a scaled-up tile: the tray scrolls, so a card that grew
 * inside it would be clipped by its own container at exactly the moment you wanted to read it.
 */
function Peek({
  card,
  cardId,
  at,
}: {
  card: Card;
  /** ⚠️ The printing the slot holds. A peek at the base art of the card you deliberately
      sleeved in a showcase printing is a peek at the wrong object. */
  cardId: string;
  at: { x: number; y: number };
}) {
  const printing = printingOf(card, cardId);
  if (!printing) return null;
  // Flip to the left of the pointer when there is no room to the right.
  const flip = at.x > window.innerWidth - (card.landscape ? 460 : 340);
  return (
    <img
      className={card.landscape ? "peek wide" : "peek"}
      src={hd(printing, card.landscape ? 420 : 260)}
      srcSet={srcSet(printing)}
      sizes={card.landscape ? "26rem" : "19rem"}
      alt=""
      style={{
        left: flip ? at.x - (card.landscape ? 430 : 320) : at.x + 16,
        top: Math.min(at.y - 40, window.innerHeight - 380),
      }}
    />
  );
}

/**
 * The art a filled slot draws.
 *
 * ⚠️ **Every one of these had reached for `card.printings[0]`.** The deck stores a printing
 * and the tray drew the card's default, so picking an alternate art wrote through to D1 and
 * changed nothing you could see — the bug looked like a broken picker and was three broken
 * pictures. One component now, so the next slot cannot get it wrong on its own.
 */
function SlotArt({
  card,
  cardId,
  width,
  sizes,
  lazy = false,
}: {
  card: Card;
  cardId: string;
  width: number;
  sizes: string;
  /** The tray scrolls; the Legend and Champion are always on screen. */
  lazy?: boolean;
}) {
  const printing = printingOf(card, cardId);
  if (!printing) return null;
  return (
    <img
      src={hd(printing, width)}
      srcSet={srcSet(printing)}
      sizes={sizes}
      alt={card.name}
      {...(lazy ? { loading: "lazy" as const } : {})}
    />
  );
}

function Slots({
  held,
  blanks,
  zone,
  onOpen,
  onRemove,
  onSeek,
}: {
  held: Occupant[];
  /** Empty slots to draw. Only meaningful where one slot is one card (battlefields). */
  blanks: number;
  /** Drives the layout: 39 cards, 12 runes and 3 landscape battlefields want different grids. */
  zone: Zone;
  onOpen: (o: Occupant) => void;
  onRemove: (o: Occupant) => void;
  onSeek: () => void;
}) {
  const [peek, setPeek] = useState<
    { card: Card; cardId: string; at: { x: number; y: number } } | null
  >(null);

  return (
    <div className={`slots ${zone.toLowerCase()}`} onMouseLeave={() => setPeek(null)}>
      {peek && <Peek card={peek.card} cardId={peek.cardId} at={peek.at} />}
      {held.map((o, i) => (
        <div
          className="tray"
          key={`${o.cardId}-${i}`}
          onMouseMove={(e) =>
            setPeek({ card: o.card, cardId: o.cardId, at: { x: e.clientX, y: e.clientY } })
          }
          onMouseLeave={() => setPeek(null)}
        >
          <button
            type="button"
            className="slot filled"
            aria-label={`${o.card.name} — details`}
            title={`${o.card.name} — click for details, right-click to remove one`}
            onClick={() => onOpen(o)}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemove(o);
            }}
          >
            <SlotArt card={o.card} cardId={o.cardId} width={150} sizes="(max-width: 60rem) 22vw, 9vw" lazy />
          </button>
        </div>
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

/**
 * `DRAFT` or `BUILT`, and what stands between them — D-017, DATA-MODEL §3.
 *
 * ⚠️ **A conflict is an address, never a dead end.** The whole point of commitment is that
 * an unavailable card tells you where it went, so every line here names the deck holding the
 * cards and the button offers the way out rather than just refusing.
 */
function Commitment({
  deck,
  conflicts,
  overCommitments,
  onPromote,
  onDismantle,
}: {
  deck: Deck;
  conflicts: Conflict[];
  overCommitments: Conflict[];
  onPromote: () => void;
  onDismantle: () => void;
}) {
  const built = deck.state === "BUILT";
  return (
    <section className={`commitment${built ? " built" : ""}`}>
      <div className="state">
        <b>{built ? "Built" : "Draft"}</b>
        <span>
          {built
            ? "these cards are in sleeves and unavailable to other decks"
            : "a plan — commits nothing, and any number may exist"}
        </span>
        {built ? (
          <button type="button" className="ghost" onClick={onDismantle}>
            Dismantle
          </button>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={onPromote}
            // ⚠️ Not `disabled`: a button that cannot be pressed and cannot say why is the
            // dead end D-017 forbids. It stays pressable and explains, and the conflicts
            // below name the deck to dismantle.
            aria-disabled={conflicts.length > 0}
            title={
              conflicts.length > 0
                ? "Some of these cards are in another built deck — dismantle it first"
                : "Mark this deck as physically sleeved"
            }
          >
            Mark as built
          </button>
        )}
      </div>

      {/* Loud, and never auto-corrected — Forge must not decide which deck loses a card. */}
      {overCommitments.length > 0 && (
        <ul className="over">
          {overCommitments.map((c) => (
            <li key={c.name}>
              <b>Over-committed</b> {c.committed} copies of {c.name} are in decks, and you own{" "}
              {c.owned}. Something was traded away — {c.holders.map((h) => h.deckName).join(", ")}{" "}
              {c.holders.length === 1 ? "holds" : "hold"} them.
            </li>
          ))}
        </ul>
      )}

      {conflicts.length > 0 && (
        <ul className="conflicts">
          {conflicts.map((c) => (
            <li key={c.name}>{conflictSentence(c)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The Bench — cards under consideration, saved with the deck (DATA-MODEL §1).
 *
 * **Never validated, never committed.** It is the one concept adopted wholesale from
 * Piltover Archive ([D-014](docs/DECISIONS.md#d-014)), and what it buys is that a long
 * tinkering session survives being closed: the four cards you were undecided about are still
 * there tomorrow, instead of living in your head until you shut the tab.
 *
 * ⚠️ Drawn as a shelf of small arts rather than a list of names. You are deciding between
 * *cards*, and a card is a picture — a row of text would make you remember what each one
 * does, which is exactly the work the Bench exists to save you.
 */
function Bench({
  entries,
  pool,
  onOpen,
  onAdd,
  onRemove,
}: {
  entries: BenchEntry[];
  pool: CardPool;
  onOpen: (o: Occupant) => void;
  onAdd: (cardId: string) => void;
  onRemove: (cardId: string) => void;
}) {
  const [peek, setPeek] = useState<{ card: Card; cardId: string; at: { x: number; y: number } } | null>(
    null,
  );
  if (entries.length === 0) return null;
  return (
    <section className="bay bench">
      <h2>
        The Bench<span className="of">{entries.length} parked</span>
      </h2>
      <p className="hint">
        Cards you are still deciding about. Saved with the deck, and deliberately not counted
        by anything — click to add one to the deck, right-click to let it go.
      </p>
      <div className="slots">
        {entries.map((entry) => {
          const card = pool.byPrinting.get(entry.cardId);
          if (!card) return null;
          const occupant = { card, cardId: entry.cardId, quantity: 1 };
          return (
            <div
              key={entry.cardId}
              onMouseMove={(e) =>
                setPeek({ card, cardId: entry.cardId, at: { x: e.clientX, y: e.clientY } })
              }
              onMouseLeave={() => setPeek(null)}
            >
              <button
                type="button"
                className="slot filled"
                title={`${card.name}${entry.note ? ` — ${entry.note}` : ""} — click to add to the deck, right-click to take off the bench`}
                aria-label={`${card.name} — on the bench`}
                onClick={() => onAdd(entry.cardId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove(entry.cardId);
                }}
              >
                <SlotArt
                  card={card}
                  cardId={entry.cardId}
                  width={150}
                  sizes="(max-width: 60rem) 22vw, 9vw"
                  lazy
                />
              </button>
              {entry.note && <span className="note">{entry.note}</span>}
              {/* Opening the card is still available, just not the primary action here. */}
              <button
                type="button"
                className="ghost tiny"
                onClick={() => onOpen(occupant)}
                aria-label={`${card.name} — details`}
              >
                ?
              </button>
            </div>
          );
        })}
      </div>
      {peek && <Peek card={peek.card} cardId={peek.cardId} at={peek.at} />}
    </section>
  );
}

export function Workshop({
  deck,
  pool,
  legality,
  conflicts,
  overCommitments,
  bench,
  onBenchAdd,
  onBenchRemove,
  onPromote,
  onDismantle,
  step,
  guided,
  occupants,
  onOpen,
  onRemove,
  onSeek,
  showDeck,
  children,
}: {
  deck: Deck;
  pool: CardPool;
  legality: LegalityResult;
  /** What this deck asks for and cannot have, with the deck holding it (D-017). */
  conflicts: Conflict[];
  /** Cards sleeved into more decks than the boxes can supply — DATA-MODEL §4. */
  overCommitments: Conflict[];
  /** Cards parked while you decide. Never validated — see `Bench`. */
  bench: BenchEntry[];
  /** Move a benched card into the deck. It stays on the bench: parking is not a commitment. */
  onBenchAdd: (cardId: string) => void;
  onBenchRemove: (cardId: string) => void;
  onPromote: () => void;
  onDismantle: () => void;
  step: Step;
  guided: boolean;
  occupants: (zone: Zone) => Occupant[];
  onOpen: (t: Target) => void;
  onRemove: (t: Target) => void;
  onSeek: (zone: Zone) => void;
  /**
   * ⚠️ The counts and violations stay on screen in every view. They are *state* — the thing
   * you are steering by — and hiding them behind a tab would make the other views feel like
   * a different application.
   */
  showDeck: boolean;
  children?: React.ReactNode;
}) {
  const legend = pool.byPrinting.get(deck.legendCardId);
  const champion = pool.byPrinting.get(deck.chosenChampionCardId);

  const bay = (zone: Zone) => {
    const held = occupants(zone);
    if (zone === "SIDEBOARD" && held.length === 0) return null;
    const capacity = CAPACITY[zone];
    const cards = held.length;
    const blanks = Math.max(0, capacity - cards);
    return (
      <section className="bay" key={zone}>
        <h2>
          {ZONE_LABEL[zone]}
          <span className={cards === capacity ? "of met" : "of"}>
            {cards} / {capacity}
          </span>
        </h2>
        <Slots
          held={held}
          blanks={blanks}
          zone={zone}
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

      <Commitment
        deck={deck}
        conflicts={conflicts}
        overCommitments={overCommitments}
        onPromote={onPromote}
        onDismantle={onDismantle}
      />


      {showDeck && <>
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
                  onOpen({ card: legend, cardId: deck.legendCardId, quantity: 1, zone: "MAIN", role: "legend" })
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove({ card: legend, cardId: deck.legendCardId, quantity: 1, zone: "MAIN", role: "legend" });
                }}
              >
                <SlotArt
                  card={legend}
                  cardId={deck.legendCardId}
                  width={400}
                  sizes="(max-width: 60rem) 45vw, 20vw"
                />
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
                    quantity: 1,
                    zone: "MAIN",
                    role: "champion",
                  })
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove({
                    card: champion,
                    cardId: deck.chosenChampionCardId,
                    quantity: 1,
                    zone: "MAIN",
                    role: "champion",
                  });
                }}
              >
                <SlotArt
                  card={champion}
                  cardId={deck.chosenChampionCardId}
                  width={400}
                  sizes="(max-width: 60rem) 45vw, 20vw"
                />
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
      <Bench
        entries={bench}
        pool={pool}
        onOpen={(o) => onOpen({ ...o, zone: zoneFor(o.card), role: "slot" })}
        onAdd={onBenchAdd}
        onRemove={onBenchRemove}
      />
      </>}

      {children}
    </>
  );
}
