import { useMemo } from "react";
import { deckTokens, type Deck, type MarkerNeed, type TokenNeed } from "@forge/engine";
import { hd, srcSet, type Card, type CardPool } from "./cards.js";

/**
 * **Tokens — what to put in the box beside the deck.**
 *
 * The decklist is the 55 cards you register. This is everything else the deck physically
 * needs to be playable, and Forge is the only place that can work it out, because it is the
 * only place that has read your list.
 *
 * ⚠️ **This panel is yellow on purpose, and yellow is a loaded colour here.** `theme.css`
 * reserves colour for **domain** (D-046/D-052, where Order *is* yellow) and Tier 2 already
 * carries an amber rule for *"probability"*. The way it stays legible rather than becoming a
 * third meaning for the same hue is placement, which is the same rule D-053 put on brass:
 * this yellow appears only on the panel's own chrome — its rule, its heading, its counts —
 * and **never on a card, never beside a domain dot**. Tokens are colourless to a card, so
 * there is no domain for it to be confused with in the one place confusion would cost
 * something. `--token` is its own variable so that changing this is a one-line decision.
 *
 * ⚠️ **The facts and the judgement are separated, as everywhere else** (D-045). *Which*
 * tokens the deck creates is read off printed text and is not arguable. *How many to bring*
 * is a call, it is marked as one, and the cards it was derived from are listed under it so
 * you can overrule it in a second.
 */

/** The token *card*, where one was ever printed. Used for the picture and nothing else. */
function tokenPrintings(pool: CardPool, name: string): Card[] {
  return pool.cards.filter(
    (c) =>
      c.superTypes.includes("token") &&
      // `Recruit` is printed four times as `Recruit (DE)`, `(NX)` and `(ZN)` — the same
      // token in three regional coats. Matching the bare name would find none of them.
      (c.name === name || c.name.startsWith(`${name} (`)),
  );
}

/** A picture of the token, or an honest hole where the game never printed one. */
function Face({ cards, name }: { cards: Card[]; name: string }) {
  const printing = cards[0]?.printings[0];
  if (!printing) {
    return (
      <div className="tokenface none" aria-hidden="true">
        <span>{name}</span>
      </div>
    );
  }
  return (
    <img
      className={cards[0]!.landscape ? "tokenface wide" : "tokenface"}
      src={hd(printing, 96)}
      srcSet={srcSet(printing)}
      sizes="6rem"
      loading="lazy"
      alt=""
    />
  );
}

/**
 * The sentence under the count.
 *
 * ⚠️ **Every clause here is a fact with a source in the list**, which is why it is assembled
 * from the need rather than written as prose per token. A hand-written line would be a claim
 * this component authored, and this codebase does not let the mouth author claims (D-043).
 */
function why(need: TokenNeed): string {
  if (need.unique) return "The card says only one can be on the board at a time.";
  const parts: string[] = [];
  parts.push(
    need.atOnce > 1
      ? `${need.atOnce} at once from one card`
      : `one at a time, from ${need.copies} ${need.copies === 1 ? "copy" : "copies"}`,
  );
  if (need.atOnce > 1) parts.push(`${need.copies} ${need.copies === 1 ? "copy" : "copies"} make it`);
  if (need.repeatable) parts.push("and a source can do it again every turn");
  if (need.variable) parts.push("one source's count is decided by the board");
  return `${parts.join(", ")}.`;
}

function Token({ need, cards }: { need: TokenNeed; cards: Card[] }) {
  return (
    <li className="token">
      <Face cards={cards} name={need.name} />
      <div className="tokenbody">
        <p className="tokenname">
          {need.name}
          <span className="tokentype">{need.type}</span>
          {/* The count is the point of the panel, so it is the thing you can read across
              the list without reading anything else. */}
          <b className="tokenbring">
            ×{need.bring}
            {need.repeatable || need.variable ? "+" : ""}
          </b>
        </p>
        <p className="tokenwhy">{why(need)}</p>
        {need.temporary && (
          <p className="tokennote">
            Made with [Temporary] — it dies each turn, so the same card comes back out.
          </p>
        )}
        {cards.length === 0 && (
          /* ⚠️ Worth saying out loud. Four of the game's eleven tokens have no printed card,
             so "I could not find it in the set list" is the expected experience and not a
             failure to search properly. */
          <p className="tokennote">No token card was ever printed — use any marker.</p>
        )}
        {cards.length > 1 && (
          <p className="tokennote">
            {cards.length} printings: {cards.map((c) => c.name).join(", ")}.
          </p>
        )}
        <ul className="tokensources">
          {need.sources.map((s) => (
            <li key={s.name}>
              <b>{s.copies}×</b> {s.name}
              {s.atOnce > 1 && <span className="of"> — {s.atOnce} at a time</span>}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function Marker({ marker }: { marker: MarkerNeed }) {
  return (
    <li className="marker">
      <p className="tokenname">
        {marker.name}
        <b className="tokenbring">×{marker.bring}</b>
      </p>
      <p className="tokenwhy">{marker.why}</p>
      {!marker.printed && <p className="tokennote">Called for by {marker.copies} cards in this deck.</p>}
    </li>
  );
}

export function Tokens({ deck, pool }: { deck: Deck; pool: CardPool }) {
  const needs = useMemo(() => deckTokens(deck, pool.index), [deck, pool]);
  const printings = useMemo(
    () => new Map(needs.tokens.map((t) => [t.name, tokenPrintings(pool, t.name)])),
    [needs, pool],
  );

  return (
    <section className="panel tokens">
      <h2>
        Tokens<span className="tier">bring</span>
      </h2>

      {!needs.read ? (
        /* ⚠️ Zero is not the same as none. An index with no rules text has not looked. */
        <p className="unseen">This card pool carries no rules text, so nothing was read.</p>
      ) : needs.tokens.length === 0 && needs.markers.length === 0 ? (
        <p className="empty">Nothing to bring — no card in this deck creates a token.</p>
      ) : (
        <>
          {needs.tokens.length > 0 && (
            <ul className="tokenlist">
              {needs.tokens.map((t) => (
                <Token key={`${t.name}|${t.type}`} need={t} cards={printings.get(t.name) ?? []} />
              ))}
            </ul>
          )}

          {needs.markers.length > 0 && (
            <>
              {/* Kept under their own heading: a marker is a state you have to show rather
                  than a card you can go and find, and `[Empowered]` has no printing at all. */}
              <h3 className="tokensub">Markers</h3>
              <ul className="tokenlist markers">
                {needs.markers.map((m) => (
                  <Marker key={m.name} marker={m} />
                ))}
              </ul>
            </>
          )}

          <p className="note">
            Counts are a judgement — enough for the largest single burst, and one for every
            copy that can make one. The cards under each are the facts they came from.
          </p>
        </>
      )}
    </section>
  );
}
