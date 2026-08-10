import type { Access, DeckFacts, Flexibility, Openings, RuneFeasibility } from "@forge/engine";
import { COUNTED_KEYWORDS, TURNS } from "@forge/engine";
import { useState } from "react";

/**
 * 🟢 **Tier 1 — facts** (DECK-STATS §3).
 *
 * ⚠️ **The tier is encoded in the visual language, not footnoted** (DECK-STATS §1). Every
 * panel here carries the same green rule and the same "fact" label, so that when Tier 2
 * arrives beside it — probabilities, correct only under stated assumptions — the difference
 * is visible before a single number is read. *"Three misleading statistics are worse than
 * one misleading grade, because they take longer to discredit themselves."*
 *
 * Nothing here composites. There is no score, no rating and no overall shape — every number
 * stands on its own and says what it does not know.
 */

/** A count Forge could not take, said plainly rather than rounded into a zero (D-022). */
function Unseen({ n, of }: { n: number; of: string }) {
  if (n <= 0) return null;
  return (
    <p className="unseen">
      {n} {of} — not counted, because the card data does not carry it.
    </p>
  );
}

function Bars({ counts, label }: { counts: number[]; label: (i: number) => string }) {
  const peak = Math.max(1, ...counts);
  return (
    <div className="curve">
      {counts.map((count, i) => (
        <div className="bar" key={i}>
          <span className="count">{count || ""}</span>
          <span className="stem" style={{ height: `${(count / peak) * 100}%` }} />
          <span className="tick">{label(i)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Power demand against the rune split — the reconciliation DECK-STATS §3 calls *"the figure
 * that must be reconciled"*, and the input the Tier 2 feasibility curve will consume.
 *
 * ⚠️ Shown side by side and **not divided into a ratio**. A ratio would be a composite, and
 * the useful reading is *"you are asking for 14 Fury and running 7 Fury runes"*, which is two
 * numbers a person can hold rather than one number they have to decode.
 */
function PowerAgainstRunes({ facts }: { facts: DeckFacts }) {
  const domains = [...new Set([...Object.keys(facts.power.byDomain), ...Object.keys(facts.runes.byDomain)])].sort();
  if (domains.length === 0) return <p className="empty">No Power costs and no runes yet.</p>;
  return (
    <>
      <table className="reconcile">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Power demanded</th>
            <th>Runes</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d}>
              <td>
                <i className={`dot ${d}`} /> {d}
              </td>
              <td className="num">{facts.power.byDomain[d] ?? 0}</td>
              <td className="num">{facts.runes.byDomain[d] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {facts.power.ambiguous > 0 && (
        <p className="unseen">
          {facts.power.ambiguous} Power on two-domain cards — the card data does not say which
          domain it is owed in, so it is left out of the split rather than guessed at.
        </p>
      )}
      <Unseen n={facts.power.unknown} of="cards with no Power data" />
    </>
  );
}

export function Statistics({
  facts,
  committed,
  committedKnown,
}: {
  facts: DeckFacts;
  committed: number;
  /** ⚠️ False until `/commitments` has answered. Absent is not the same as none. */
  committedKnown: boolean;
}) {
  const { types, might } = facts;
  const keywords = COUNTED_KEYWORDS.filter((k) => (facts.keywords[k] ?? 0) > 0);

  return (
    <>
      <section className="panel tier1">
        <h2>
          Energy curve<span className="tier">fact</span>
        </h2>
        {facts.energy.counted < 5 ? (
          <p className="empty">The curve needs a few more cards to describe.</p>
        ) : (
          <Bars counts={facts.energy.counts} label={(i) => String(i)} />
        )}
        <Unseen n={facts.energy.unknown} of="cards with no cost data" />
      </section>

      <section className="panel tier1">
        <h2>
          Power against runes<span className="tier">fact</span>
        </h2>
        <PowerAgainstRunes facts={facts} />
      </section>

      <section className="panel tier1">
        <h2>
          What the deck is made of<span className="tier">fact</span>
        </h2>
        {/* Load-bearing, not decoration: you hold battlefields with bodies, so a unit-light
            deck physically cannot contest three locations however good its cards are. */}
        <dl className="facts">
          <div>
            <dt>Units</dt>
            <dd>{types.unit}</dd>
          </div>
          <div>
            <dt>Spells</dt>
            <dd>{types.spell}</dd>
          </div>
          <div>
            <dt>Gear</dt>
            <dd>{types.gear}</dd>
          </div>
          {types.other > 0 && (
            <div>
              <dt>Other</dt>
              <dd>{types.other}</dd>
            </div>
          )}
          <div>
            <dt>Signature</dt>
            <dd>
              {facts.signatures}
              <span className="of"> / 3</span>
            </dd>
          </div>
        </dl>
        <p className="note">
          You hold battlefields with bodies — three locations need units, not card quality.
        </p>
        <Unseen n={types.unknown} of="cards with no type data" />
      </section>

      <section className="panel tier1">
        <h2>
          Might<span className="tier">fact</span>
        </h2>
        {might.units === 0 ? (
          <p className="empty">No units yet — Might is a unit's combat stat.</p>
        ) : (
          <Bars counts={might.counts} label={(i) => String(i)} />
        )}
        <Unseen n={might.unknown} of="units with no Might data" />
      </section>

      {(keywords.length > 0 || !facts.keywordsRead) && (
        <section className="panel tier1">
          <h2>
            Keywords<span className="tier">fact</span>
          </h2>
          {facts.keywordsRead ? (
            <ul className="keywords">
              {keywords.map((k) => (
                <li key={k}>
                  <b>{facts.keywords[k]}</b> {k}
                </li>
              ))}
            </ul>
          ) : (
            /* Zero is not the same as none — say which one this is. */
            <p className="unseen">This card pool carries no rules text, so nothing was read.</p>
          )}
        </section>
      )}

      <section className="panel tier1">
        <h2>
          Collection reality<span className="tier">fact</span>
        </h2>
        <p className="note">
          {!committedKnown
            ? "Not read yet — this says nothing about your other decks until it has."
            : committed === 0
              ? "Nothing this deck wants is sleeved into another built deck."
              : `${committed} ${committed === 1 ? "card is" : "cards are"} spoken for by another built deck — see the deck panel for which.`}
        </p>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   🟡 Tier 2 — probabilities

   ⚠️ **A different colour and a different word.** DECK-STATS §1's one non-negotiable is
   that a lower tier can never pass for a higher one, and the way that holds is that these
   never look like the green "fact" panels above them.

   ⚠️ **The assumptions travel with the number.** They come back on the result from the
   engine rather than being written here, so a component cannot render a percentage it has
   no caveat for. Open item S3 asked whether they should always be visible or revealed on
   interaction: revealed, because a panel that shows four assumption lists at once is the
   wall S2 warns about — but the affordance is on every single number, not one per panel.
   ══════════════════════════════════════════════════════════════════════════ */

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** The conditions a probability is correct *given*. One per panel, opened on demand. */
function Assumptions({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="assume">
      <button type="button" className="ghost" onClick={() => setOpen((v) => !v)}>
        {open ? "hide assumptions" : "correct given…"}
      </button>
      {open && (
        <ul>
          {items.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A row of per-turn percentages. Turns run along the top, once, for every row. */
function TurnHead({ label }: { label: string }) {
  return (
    <tr>
      <th>{label}</th>
      {Array.from({ length: TURNS }, (_, i) => (
        <th key={i} className="num">
          T{i + 1}
        </th>
      ))}
    </tr>
  );
}

export function Probabilities({
  runes,
  champion,
  flexibility,
  openings,
}: {
  runes: RuneFeasibility;
  champion: Access;
  flexibility: Flexibility;
  openings: Openings;
}) {
  return (
    <>
      <section className="panel tier2">
        <h2>
          Rune feasibility<span className="tier">probability</span>
        </h2>
        {runes.rows.length === 0 ? (
          <p className="empty">
            Nothing in this deck asks for coloured Power yet — the runes are doing Energy work
            only.
          </p>
        ) : (
          <>
            <p className="note">
              The chance you can pay each Power cost your deck actually asks for, by turn.
            </p>
            <div className="scroller">
              <table className="turns">
                <thead>
                  <TurnHead label="Cost" />
                </thead>
                <tbody>
                  {runes.rows.map((row) => (
                    <tr key={`${row.domain}-${row.cost}`}>
                      <th>
                        <i className={`dot ${row.domain}`} /> {row.cost} {row.domain}
                        <span className="of"> · {row.cards} cards</span>
                      </th>
                      {row.p.map((p, i) => (
                        <td key={i} className="num">
                          {pct(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Assumptions items={runes.assumptions} />
      </section>

      <section className="panel tier2">
        <h2>
          Finding your Champion<span className="tier">probability</span>
        </h2>
        {champion.copies === 0 ? (
          <p className="empty">No Chosen Champion yet.</p>
        ) : (
          <div className="scroller">
            <table className="turns">
              <thead>
                <TurnHead label="Seen by" />
              </thead>
              <tbody>
                <tr>
                  <th>
                    {champion.copies} {champion.copies === 1 ? "copy" : "copies"}
                  </th>
                  {champion.p.map((p, i) => (
                    <td key={i} className="num">
                      {pct(p)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <Assumptions items={champion.assumptions} />
      </section>

      <section className="panel tier2">
        <h2>
          Openings<span className="tier">probability</span>
        </h2>
        {/* A distribution, not an anecdote — this is what a Sample Hand should have been. */}
        <dl className="facts">
          <div>
            <dt>Turn-one play</dt>
            <dd>{pct(openings.turnOne)}</dd>
          </div>
          <div>
            <dt>By turn two</dt>
            <dd>{pct(openings.turnTwo)}</dd>
          </div>
        </dl>
        <p className="note">
          Across {openings.hands.toLocaleString("en-GB")} simulated openings — a distribution
          rather than one hand, which tells you nothing.
        </p>
        <Assumptions items={openings.assumptions} />
      </section>

      <section className="panel tier2">
        <h2>
          Board and options by turn<span className="tier">probability</span>
        </h2>
        <div className="scroller">
          <table className="turns">
            <thead>
              <TurnHead label="" />
            </thead>
            <tbody>
              <tr>
                <th>Might on board</th>
                {openings.might.map((m, i) => (
                  <td key={i} className="num">
                    {m.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr>
                {/* DECK-STATS §6: flexibility, defined — distinct cards you could cast. */}
                <th>
                  Castable cards<span className="of"> of {flexibility.distinct}</span>
                </th>
                {flexibility.options.map((n, i) => (
                  <td key={i} className="num">
                    {n}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">
          Expected Might replaces calling a deck "early" or "late"; castable cards is what
          flexibility means when you define it.
        </p>
        <Assumptions items={[...openings.assumptions, ...flexibility.assumptions]} />
      </section>
    </>
  );
}
