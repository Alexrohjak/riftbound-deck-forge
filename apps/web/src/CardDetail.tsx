import { useEffect, useRef } from "react";
import type { Zone } from "@forge/engine";
import { hd, srcSet, symbols, type Card, type Printing } from "./cards.js";
import type { Role } from "./Workshop.js";

/**
 * The card, full size, with everything the gallery deliberately does not say.
 *
 * The gallery shows art and nothing else, because every stat is already printed on the
 * card. At gallery size that is true; at 3rem in a workshop slot it is not. So the detail
 * view is where the small print lives — and where you change which art you intend to
 * sleeve, which is a decision about physical copies rather than about the deck.
 */
export function CardDetail({
  card,
  cardId,
  role,
  zone,
  owned,
  benched,
  onPickArt,
  onRemove,
  onMove,
  onBench,
  onClose,
}: {
  card: Card;
  /** The printing currently in the deck, so the right art is marked. */
  cardId: string;
  role: Role;
  /** Which bay this copy was opened from — the side of the Main Deck / sideboard line it is on. */
  zone: Zone;
  owned: number;
  /** Whether this printing is already parked on the Bench. */
  benched: boolean;
  onPickArt: (printing: Printing) => void;
  onRemove: () => void;
  /**
   * Send this copy across the Main Deck / sideboard line.
   *
   * ⚠️ This is the *only* way to move a card you have already placed. Taking it out and
   * putting it back would work, but it loses the printing you chose — and re-adding puts it
   * wherever the gallery's destination happens to be pointing, which is how a card you
   * meant to side ends up back in the 40.
   */
  onMove: () => void;
  /** Park it, or take it off. The Bench is a scratchpad — this decides nothing. */
  onBench: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Focus moves into the dialog so the keyboard follows the eye.
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = card.printings.find((p) => p.id === cardId) ?? card.printings[0];

  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div
        className="detail"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={card.name}
        onClick={(e) => e.stopPropagation()}
      >
        {current && (
          <img
            className="detail-art"
            src={hd(current, 520)}
            srcSet={srcSet(current)}
            sizes="(max-width: 48rem) 90vw, 20rem"
            alt={card.name}
          />
        )}

        <div className="detail-body">
          <header>
            <h3>{card.name}</h3>
            <button type="button" className="ghost" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>

          <dl className="facts">
            {card.energy !== null && (
              <div>
                <dt>Energy</dt>
                <dd>{card.energy}</dd>
              </div>
            )}
            {card.power !== null && (
              <div>
                <dt>Power</dt>
                <dd>{card.power}</dd>
              </div>
            )}
            {card.might !== null && (
              <div>
                <dt>Might</dt>
                <dd>{card.might}</dd>
              </div>
            )}
            <div>
              <dt>Type</dt>
              <dd>{[...card.superTypes, ...card.types].join(" ")}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd className="identity">
                {card.domains.map((d) => (
                  <i key={d} className={`dot ${d}`} title={d} />
                ))}
                {card.domains.join(" + ")}
              </dd>
            </div>
            {card.tags.length > 0 && (
              <div>
                <dt>Tags</dt>
                <dd>{card.tags.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt>Owned</dt>
              {/* ⚠️ "none yet" would be a false statement about a rune (D-061) — Forge does
                  not track them, which is not the same as you not having any. */}
              <dd>
                {card.types.includes("rune")
                  ? "always on hand"
                  : owned > 0
                    ? owned
                    : "none yet"}
              </dd>
            </div>
          </dl>

          {card.text && <p className="rules">{symbols(card.text)}</p>}

          {card.printings.length > 1 && (
            <section className="artset">
              <h4>
                Alternate art <span className="of">{card.printings.length} printings</span>
              </h4>
              <p className="hint">
                Same card, different copy. Legality counts names, so this never changes
                whether the deck is legal — only which one you sleeve.
              </p>
              <div className="artgrid">
                {card.printings.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={p.id === cardId ? "artpick on" : "artpick"}
                    onClick={() => onPickArt(p)}
                    title={`${p.code}${p.star ? " · showcase" : ""}${p.alt ? " · alternate art" : ""}`}
                  >
                    <img src={hd(p, 150)} alt="" loading="lazy" />
                    <span>{p.code}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <footer>
            <span className="of">{current?.code}</span>
            {/* Deciding later is a real answer, and the Bench is where it goes. */}
            <button type="button" className="ghost" onClick={onBench}>
              {benched ? "Take off the bench" : "Bench it"}
            </button>
            {/* The Legend and the Chosen Champion are singular fields (DATA-MODEL §1) and
                runes and battlefields are registered separately — none of the four can be
                sided, so none of them offers it. */}
            {role === "slot" && (zone === "MAIN" || zone === "SIDEBOARD") && (
              <button type="button" className="ghost" onClick={onMove}>
                {zone === "SIDEBOARD" ? "Move to the deck" : "Move to the sideboard"}
              </button>
            )}
            <button type="button" className="danger" onClick={onRemove}>
              {role === "legend"
                ? "Clear Legend"
                : role === "champion"
                  ? "Clear Champion"
                  : "Remove one copy"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
