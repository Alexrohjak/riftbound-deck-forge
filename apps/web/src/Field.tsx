import { useEffect, useMemo, useState } from "react";
import { pressure, readField, validateField, type FieldReader, type FieldSnapshot, type Standing } from "@forge/engine";
import { Record } from "./Log.js";

/**
 * What the tournament field does with this Legend (D-068), beside the plan — never inside it.
 *
 * ⚠️ **The field is the average list, not his.** Its figures sit next to his record and are
 * never merged with it; when the two disagree, both are shown and the page says so, because
 * that disagreement is what he most needs to see.
 */

export function useField(nameOf: (id: string) => string | undefined): FieldReader | null {
  const [snapshot, setSnapshot] = useState<FieldSnapshot | null>(null);
  useEffect(() => {
    fetch("/field.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw: unknown) => {
        // A missing or malformed snapshot hides the section; the plan must still render.
        if (validateField(raw).length === 0) setSnapshot(raw as FieldSnapshot);
      })
      .catch(() => setSnapshot(null));
  }, []);
  return useMemo(() => (snapshot ? readField(snapshot, nameOf) : null), [snapshot, nameOf]);
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** One field figure: a rate when there are 20 games, else the record and why there is no rate. */
export function FieldStanding({ standing }: { standing: Standing | null }) {
  if (!standing) return <span className="dim" title="Under 5 field games — the source publishes nothing.">field: unpublished</span>;
  return (
    <span className="field-figure" title={standing.withheld ?? `${standing.played} tournament games`}>
      <span className="badge voice-field">field</span>
      <Record standing={standing} />
      <span className="dim">{standing.played} games</span>
    </span>
  );
}

/**
 * The field and his own record point different ways — worth a sentence, not just two numbers.
 * Only once both have a rate: a 0-2 against a 58% field is two games, not a contradiction.
 */
export function disagreement(mine: Standing | undefined, field: Standing | null): string | null {
  if (!mine || mine.rate === null || !field || field.rate === null) return null;
  const gap = mine.rate - field.rate;
  if (Math.abs(gap) < 0.15) return null;
  return gap < 0
    ? `You win ${pct(mine.rate)} here; the field wins ${pct(field.rate)}. The list or the play may be the difference.`
    : `You win ${pct(mine.rate)} here; the field only ${pct(field.rate)}. Something in your plan is working.`;
}

export function FieldPanel({
  field,
  legendCardId,
  planned,
  nameOf,
  onPlan,
  disabled,
}: {
  field: FieldReader;
  legendCardId: string;
  /** Legend names that already have a matchup card. */
  planned: ReadonlySet<string>;
  nameOf: (id: string) => string | undefined;
  onPlan: (legendCardId: string) => void;
  disabled: boolean;
}) {
  const snap = field.snapshot;
  const me = field.legend(legendCardId);
  if (!me) {
    return (
      <section className="panel plan field">
        <h2>In the field</h2>
        <p className="empty">This Legend is not in the {snap.window.label} snapshot.</p>
      </section>
    );
  }
  const share = field.share(legendCardId);
  const threats = pressure(field, legendCardId, planned, nameOf);
  const sources = snap.sources;

  return (
    <section className="panel plan field">
      <h2>In the field</h2>
      <p className="field-head">
        <b>{me.name}</b> <FieldStanding standing={field.overall(legendCardId)} />
        {share !== null && <span className="dim">· {pct(share)} of seats</span>}
        {me.tier && (
          <span className="chip" title={`Rank ${me.tier.rank} — an editorial prediction, not a result.`}>
            tier {me.tier.tier}
          </span>
        )}
      </p>
      <p className="dim">
        The average list, not yours. {snap.window.label} since {snap.window.from}.
      </p>

      {threats.length > 0 && (
        <>
          <h3>What costs this Legend the most games</h3>
          <p className="dim">Losses in the field, weighted by how often you meet each Legend.</p>
          <ol className="pressure">
            {threats.map((t) => (
              <li key={t.legendCardId}>
                <b>{t.name}</b>
                <span className="dim">{pct(t.share)} of seats</span>
                <FieldStanding standing={t.field} />
                {t.planned ? (
                  <span className="chip on">planned</span>
                ) : (
                  <button type="button" className="chip" disabled={disabled} onClick={() => onPlan(t.legendCardId)}>
                    + plan
                  </button>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="attribution dim">
        {sources.map((s, i) => (
          <span key={s.id}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name}
            </a>
            , read {s.retrieved}
          </span>
        ))}
      </p>
    </section>
  );
}
