import { useCallback, useEffect, useMemo, useState } from "react";
import {
  read,
  SYMPTOMS,
  symptomReading,
  type LogReading,
  type MatchRecord,
  type MatchResult,
  type Symptom,
} from "@forge/engine";
import type { Card, CardPool } from "./cards.js";

/**
 * The record — what you actually played, and what it is honest to conclude from it.
 *
 * ⚠️ **Every threshold shown here is the engine's, not this file's.** The interface renders
 * `withheld` when a rate is absent rather than computing one of its own; a percentage that
 * appears only in the UI is a percentage nothing tested (D-047).
 */

const LABEL: Record<MatchResult, string> = { WIN: "Won", LOSS: "Lost", DRAW: "Drew" };

/** `YYYY-MM-DD` in the *local* timezone. `toISOString()` is UTC and rolls the date early. */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const id = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function useMatches(deckId: string) {
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch(`/matches?deck=${encodeURIComponent(deckId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: { matches: MatchRecord[] }) => {
        setMatches(body.matches);
        setFailed(null);
      })
      // The log failing to load must never take the deckbuilder with it — it is a record,
      // not a dependency.
      .catch((error: Error) => setFailed(error.message));
  }, [deckId]);

  useEffect(refresh, [refresh]);

  return { matches, failed, refresh };
}

/** A win/loss/draw line. Shows the record always, the rate only when it is earned. */
function Record({ standing }: { standing: LogReading["overall"] }) {
  return (
    <span className="record">
      <b>
        {standing.wins}–{standing.losses}
        {standing.draws > 0 && `–${standing.draws}`}
      </b>
      {standing.rate === null ? (
        <em title={standing.withheld}>no rate yet</em>
      ) : (
        <strong>{Math.round(standing.rate * 100)}%</strong>
      )}
    </span>
  );
}

export function LogPanel({
  deckId,
  deckName,
  deckHash,
  pool,
  matches,
  failed,
  onRefresh,
}: {
  deckId: string;
  deckName: string;
  deckHash: string | null;
  pool: CardPool;
  matches: MatchRecord[] | null;
  failed: string | null;
  onRefresh: () => void;
}) {
  const [logging, setLogging] = useState(false);
  const reading: LogReading | null = useMemo(
    // The engine has no card names by design (D-034); it takes a resolver so a synthesised
    // note can say "Hand of Noxus" rather than "ogn-302-298".
    () => (matches ? read(matches, (id) => pool.byPrinting.get(id)?.name) : null),
    [matches, pool],
  );

  const nameOf = (cardId: string | null) =>
    cardId ? (pool.byPrinting.get(cardId)?.name ?? cardId) : "not recorded";

  return (
    <section className="panel log">
      <h2>
        The record
        <button type="button" className="ghost" onClick={() => setLogging(true)}>
          Log a match
        </button>
      </h2>

      {failed && <p className="fail">The log did not load: {failed}</p>}
      {!matches && !failed && <p className="empty">Reading the log…</p>}

      {reading && (
        <>
          <div className="standing">
            <Record standing={reading.overall} />
            <span className="dim">
              {reading.overall.played === 1 ? "1 match" : `${reading.overall.played} matches`}
            </span>
          </div>

          {/* Three statements at most. A log that says nine things says nothing (D-039). */}
          <ul className="notes">
            {reading.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          {reading.matchups.length > 1 && (
            <table className="matchups">
              <tbody>
                {reading.matchups.slice(0, 6).map((m) => (
                  <tr key={m.legendCardId ?? "unknown"}>
                    <th scope="row">{nameOf(m.legendCardId)}</th>
                    <td>
                      <Record standing={m.standing} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {logging && (
        <LogMatch
          deckId={deckId}
          deckName={deckName}
          deckHash={deckHash}
          pool={pool}
          onClose={() => setLogging(false)}
          onSaved={() => {
            setLogging(false);
            onRefresh();
          }}
        />
      )}
    </section>
  );
}

/**
 * The form. Deliberately short — it is filled in after a game, when you want to be doing
 * something else, and a form nobody finishes produces a log nobody can use.
 *
 * Only the result is required. Everything else, including which Legend you faced, is
 * optional because *not knowing is a real answer* and forcing a guess would put a wrong
 * fact in the record.
 */
function LogMatch({
  deckId,
  deckName,
  deckHash,
  pool,
  onClose,
  onSaved,
}: {
  deckId: string;
  deckName: string;
  deckHash: string | null;
  pool: CardPool;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [result, setResult] = useState<MatchResult>("WIN");
  const [playedAt, setPlayedAt] = useState(today());
  const [opponent, setOpponent] = useState("");
  const [opponentNote, setOpponentNote] = useState("");
  const [games, setGames] = useState("");
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const legends = useMemo(
    () =>
      pool.cards
        .filter((c: Card) => c.types.includes("legend"))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [pool],
  );

  const toggle = (s: Symptom) =>
    setSymptoms((current) =>
      current.includes(s) ? current.filter((x) => x !== s) : [...current, s],
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setProblem(null);
    try {
      const response = await fetch("/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: id(),
          deckId,
          deckName,
          deckHash,
          playedAt,
          result,
          opponentLegend: opponent || null,
          opponentNote: opponentNote.trim() || null,
          games: games.trim() || null,
          // Symptoms only mean something on a loss. Recording "cannot-hold" on a win would
          // put noise into the one signal that aggregates.
          symptoms: result === "LOSS" ? symptoms : [],
          notes: notes.trim() || null,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      onSaved();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
      setSaving(false);
    }
  };

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Log a match">
      <form className="sheet" onSubmit={submit}>
        <h3>Log a match</h3>

        <div className="row results">
          {(["WIN", "LOSS", "DRAW"] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={result === r ? `chip on ${r.toLowerCase()}` : "chip"}
              onClick={() => setResult(r)}
            >
              {LABEL[r]}
            </button>
          ))}
        </div>

        <div className="row">
          <label>
            Played
            <input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} />
          </label>
          <label>
            Games
            <input
              value={games}
              onChange={(e) => setGames(e.target.value)}
              placeholder="2-1"
              inputMode="numeric"
            />
          </label>
        </div>

        <label>
          Their Legend
          <select value={opponent} onChange={(e) => setOpponent(e.target.value)}>
            {/* Not knowing is a real answer, and it is the default. */}
            <option value="">— didn't note it —</option>
            {legends.map((c) => (
              <option key={c.printings[0]!.id} value={c.printings[0]!.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Their deck
          <input
            value={opponentNote}
            onChange={(e) => setOpponentNote(e.target.value)}
            placeholder="Yasuo aggro, splashing Order"
          />
        </label>

        {result === "LOSS" && (
          <fieldset className="symptoms">
            <legend>What went wrong? Optional, and it is what makes losses add up.</legend>
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                className={symptoms.includes(s) ? "chip on" : "chip"}
                onClick={() => toggle(s)}
                title={symptomReading(s)}
              >
                {s.replace(/-/g, " ")}
              </button>
            ))}
          </fieldset>
        )}

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What actually happened."
          />
        </label>

        {problem && <p className="fail">{problem}</p>}

        <div className="row end">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Saving…" : "Log it"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface Version {
  seq: number;
  hash: string;
  at: string;
  /** Optional: a row that failed to parse server-side arrives as `{}`. */
  contents?: { slots?: Array<{ quantity?: number }> };
}

/**
 * The deck's timeline. Shows *that* it changed and when; **comparing two versions is
 * deliberately not here** — PLAN §7 defers it until real use says what a useful diff is,
 * and guessing would build the wrong one.
 */
export function History({ deckId, playedOn }: { deckId: string; playedOn: Set<string> }) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/decks/${encodeURIComponent(deckId)}/history`)
      // Without the `ok` check a 400 parses into `versions: undefined`, which matches
      // neither empty nor non-empty below and leaves the panel reading forever.
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: { versions?: Version[] }) => setVersions(body.versions ?? []))
      .catch(() => setVersions([]));
  }, [deckId, open]);

  return (
    <section className="panel">
      <h2>
        History
        <button type="button" className="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? "hide" : "show"}
        </button>
      </h2>
      {open && !versions && <p className="empty">Reading…</p>}
      {open && versions?.length === 0 && (
        <p className="empty">No saved versions yet — the first edit starts the timeline.</p>
      )}
      {open && versions && versions.length > 0 && (
        <ol className="timeline">
          {versions.map((v) => {
            // Optional all the way down: one malformed row must cost a row, not the page.
            const cards = (v.contents?.slots ?? []).reduce((n, s) => n + (s?.quantity ?? 0), 0);
            return (
              <li key={v.seq}>
                <code>{v.hash.slice(0, 7)}</code>
                <span>{v.at.slice(0, 16)}</span>
                <span className="dim">{cards} cards</span>
                {/* A version you have games on is the one worth going back to. */}
                {playedOn.has(v.hash) && <em>played</em>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
