import { useEffect, useRef } from "react";
import type { Zone } from "@forge/engine";
import { hd, symbols, type Card, type Printing } from "./cards.js";

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
  zone,
  owned,
  onPickArt,
  onRemove,
  onClose,
}: {
  card: Card;
  /** The printing currently in the deck, so the right art is marked. */
  cardId: string;
  zone: Zone;
  owned: number;
  onPickArt: (printing: Printing) => void;
  onRemove: () => void;
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
        <img className="detail-art" src={current ? hd(current, 520) : ""} alt={card.name} />

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
              <dd>{owned > 0 ? owned : "none yet"}</dd>
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
            <button type="button" className="danger" onClick={onRemove}>
              Remove one from {zone === "MAIN" ? "the deck" : zone.toLowerCase()}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
