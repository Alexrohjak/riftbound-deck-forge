import { useMemo, useState } from "react";
import {
  diagnose,
  match,
  patternCensus,
  readArchetype,
  review,
  suggest,
  symptomReading,
  SYMPTOMS,
  type Confidence,
  type Deck,
  type Note,
  type Source,
  type Symptom,
} from "@forge/engine";
import type { CardPool } from "./cards.js";

/**
 * EE, in the app at last.
 *
 * ⚠️ **Advice is pull, never push** ([D-042](../../docs/DECISIONS.md#d-042)) — and the pull
 * is *navigating to the Analysis tab*. Nothing here renders in the Deck view, where you are
 * building: a builder mid-thought does not want to be corrected, and a tool that volunteers
 * is a tool you learn to ignore. The counts and violations that stay on screen everywhere
 * are *state*, which is not advice.
 *
 * There was briefly a second "look this deck over" button on top of the tab. It satisfied
 * the same rule and made the feature unfindable — two deliberate acts to get one opinion.
 *
 * ⚠️ **The prose is the engine's, not this component's.** Every sentence rendered below came
 * out of a tool call with a `source` and a `confidence` attached, and this file adds none of
 * its own. That is the structural half of D-043: a mouth that cannot author a claim cannot
 * invent one. If a statement here looks wrong, it is wrong in the engine, where a test can
 * reach it.
 */

/** What kind of claim this is — the distinction D-045 exists to keep visible. */
const CONFIDENCE: Record<Confidence, { label: string; hint: string }> = {
  fact: { label: "fact", hint: "Counted from your list. Not arguable." },
  probability: {
    label: "odds",
    hint: "Computed, and correct given the assumption stated in its attribution.",
  },
  doctrine: {
    label: "doctrine",
    hint: "What good players advise — and they disagree, which is why it is attributed.",
  },
};

const SOURCE: Record<Source, string> = {
  rulebook: "Core / Tournament Rules — a constraint, not advice",
  official: "Riot's own Primer — advice, from the people who made the game",
  community: "Earned from play and widely held. Contested at the edges",
  computed: "Arithmetic on this deck",
};

function Claim({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const conf = CONFIDENCE[note.confidence];
  return (
    <li className="claim">
      <p className="claim-what">
        {note.claim}
        <button
          type="button"
          className={`badge ${note.confidence}`}
          title={conf.hint}
          onClick={() => setOpen((v) => !v)}
        >
          {conf.label}
        </button>
      </p>
      <p className="claim-why">{note.because}</p>
      {/* Attribution is one tap away rather than always on: it is what lets you disagree,
          but it is not what you read first. */}
      {open && (
        <p className="claim-source">
          <b>{SOURCE[note.source]}.</b> {note.attribution}.
        </p>
      )}
    </li>
  );
}

export function Advisor({
  deck,
  pool,
  owned,
}: {
  deck: Deck;
  pool: CardPool;
  /** What you hold, keyed on printing — so EE leads with cards you can sleeve tonight. */
  owned: Readonly<Record<string, number>>;
}) {
  const [note, setNote] = useState("");
  const [symptom, setSymptom] = useState<Symptom | null>(null);

  /**
   * ⚠️ **Opening the Analysis tab is the ask** — that is what keeps this D-042-compliant
   * without a second button. Advice never appears in the Deck view, where you are building;
   * it appears in a tab you deliberately navigated to. Making you then click "look this deck
   * over" was ceremony, and ceremony is what made the feature unfindable.
   */
  const read = useMemo(() => review(deck, pool.index), [deck, pool]);
  const archetype = useMemo(() => readArchetype(deck, pool.index), [deck, pool]);
  /**
   * **What this deck can do, in EE's own vocabulary** (EVALUATION §5.1).
   *
   * ⚠️ This is the layer everything else is meant to be phrased in. Until now EE could say
   * a deck "reads as Aggro" and quote doctrine at it, but had no words for its *capabilities*
   * — so it could not say "no answer to a resolved bomb" without listing cards.
   */
  const census = useMemo(() => patternCensus(deck, pool.index), [deck, pool]);

  // A complaint is evidence about a CAPABILITY, never about a card — so the answer is a
  // diagnosis with its cost, and candidates come second.
  const answer = useMemo(() => {
    if (!symptom) return null;
    const d = diagnose(deck, pool.index, symptom);
    return { d, candidates: suggest(deck, pool.index, d, pool.pool, 6, owned) };
  }, [symptom, deck, pool, owned]);

  const nameOf = (cardId: string) => pool.byPrinting.get(cardId)?.name ?? cardId;

  return (
    <section className="panel ee">
      <h2>What EE makes of it</h2>

      {read && archetype && (
        <>
          <p className="verdict">
            Reads as <b>{archetype.archetype}</b>
            <span className="dim"> · {archetype.confidence} signal</span>
          </p>
          {archetype.matchups && <p className="claim-why">{archetype.matchups}</p>}
          <p className="evidence">{archetype.evidence.join(" · ")}</p>

          {census.length > 0 && (
            <div className="census">
              <h3>What it can do</h3>
              <ul>
                {census.map((p) => (
                  <li key={p.pattern}>
                    <b>{p.label}</b>
                    <span className="dim">
                      {" "}
                      {p.copies} {p.copies === 1 ? "copy" : "copies"}
                      {p.cards > 1 ? ` across ${p.cards} cards` : ""}
                    </span>
                    {/* Three names, never the whole list — the pattern IS the summary. */}
                    <em title={p.definition}>{p.examples.join(", ")}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {read.notes.length > 0 ? (
            <ul className="claims">
              {read.notes.map((n) => (
                <Claim key={n.claim} note={n} />
              ))}
            </ul>
          ) : (
            // Saying nothing is a real answer. Manufacturing a note to fill the panel is
            // exactly the failure D-022 names.
            <p className="empty">
              Nothing stands out. That is not praise — it means no rule of thumb here has
              anything to say about this list.
            </p>
          )}

          <div className="complaint">
            <label htmlFor="ee-note">Lost a game? Say what went wrong.</label>
            <input
              id="ee-note"
              value={note}
              placeholder="I played into Diana and couldn't hold battlefields"
              onChange={(e) => {
                setNote(e.target.value);
                // Keyword matching, not comprehension — the engine never parses English
                // (D-043). Picking the first match keeps one sentence to one diagnosis.
                setSymptom(match(e.target.value)[0] ?? null);
              }}
            />
            <div className="symptom-row">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={symptom === s ? "chip on" : "chip"}
                  title={symptomReading(s)}
                  onClick={() => setSymptom(symptom === s ? null : s)}
                >
                  {s.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {answer && (
            <div className="diagnosis">
              <p className="claim-what">{answer.d.reading}</p>
              <p className="evidence">{answer.d.evidence}</p>
              <p className="claim-why">
                <b>The lever.</b> {answer.d.lever}
              </p>
              {/* Always shown. Every fix costs something, and hiding that is how decks
                  quietly get worse. */}
              <p className="cost">
                <b>What it costs.</b> {answer.d.cost}
              </p>
              {answer.candidates.length > 0 && (
                <ul className="candidates">
                  {answer.candidates.map((c) => (
                    <li key={c.cardId} className={c.owned > 0 ? "have" : "havent"}>
                      <b>{nameOf(c.cardId)}</b>
                      <span className="dim"> — {c.why}</span>
                      {/* The difference between advice you can act on tonight and a
                          shopping list. Never the same typography. */}
                      <em>{c.owned > 0 ? `you have ${c.owned}` : "not in your boxes"}</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
