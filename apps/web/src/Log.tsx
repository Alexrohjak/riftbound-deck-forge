import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatOf,
  MATCH_FORMATS,
  read,
  SYMPTOMS,
  symptomReading,
  type LogReading,
  type MatchFormat,
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

/** The formats you have games in, in a stable order. */
export const formatsPlayed = (matches: readonly MatchRecord[]): MatchFormat[] =>
  MATCH_FORMATS.filter((f) => matches.some((m) => formatOf(m) === f));

/**
 * Which record to open on.
 *
 * ⚠️ **Not simply `1v1`.** Hard-coding it stranded you: log nothing but `1v1v1` and the panel
 * opened on an empty heads-up record *and* hid the switcher, because there was only one format
 * to switch between — your own games sat behind a control that had been reasoned away as
 * furniture. The engine's default is still `1v1`, but that answers what an *unlabelled record*
 * means; this answers which record to show first, and they are different questions.
 */
export const openingFormat = (matches: readonly MatchRecord[]): MatchFormat => {
  const played = formatsPlayed(matches);
  return played.length > 0 && !played.includes("1v1") ? played[0]! : "1v1";
};

/** What each format is, in the words you would use at the table. */
const FORMAT_NOTE: Record<MatchFormat, string> = {
  "1v1": "Heads-up. The format every EE reading assumes.",
  "1v1v1": "Three-way free-for-all. Two opponents, and par is a third of the games.",
  "2v2": "Teams of two. Your deck is half of what won or lost.",
};

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

/**
 * A win/loss/draw line. Shows the record always, the rate only when it is earned.
 *
 * `baseline` is passed only where a rate could be misread — 33% is par in a three-way pod
 * and a broken deck heads-up, and the figure alone cannot tell you which (D-066).
 */
export function Record({ standing, baseline }: { standing: LogReading["overall"]; baseline?: number }) {
  return (
    <span className="record">
      <b>
        {standing.wins}–{standing.losses}
        {standing.draws > 0 && `–${standing.draws}`}
      </b>
      {standing.rate === null ? (
        <em title={standing.withheld}>no rate yet</em>
      ) : (
        <>
          <strong>{Math.round(standing.rate * 100)}%</strong>
          {baseline !== undefined && baseline !== 0.5 && (
            <em title="What a seat wins by chance in this format. A reference point, not a target.">
              par {Math.round(baseline * 100)}%
            </em>
          )}
        </>
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
  /** The match being corrected, if any. Opens the same sheet the game was logged with. */
  const [editing, setEditing] = useState<MatchRecord | null>(null);
  /** `null` until you pick one — see `format` below for why it is not simply `"1v1"`. */
  const [chosen, setChosen] = useState<MatchFormat | null>(null);

  /** Only shown once there is something to switch between — a tab bar over one is furniture. */
  const played = useMemo(() => formatsPlayed(matches ?? []), [matches]);
  const format: MatchFormat = chosen ?? openingFormat(matches ?? []);

  const reading: LogReading | null = useMemo(
    // The engine has no card names by design (D-034); it takes a resolver so a synthesised
    // note can say "Hand of Noxus" rather than "ogn-302-298".
    () => (matches ? read(matches, (id) => pool.byPrinting.get(id)?.name, format) : null),
    [matches, pool, format],
  );

  const nameOf = (cardId: string | null) =>
    cardId ? (pool.byPrinting.get(cardId)?.name ?? cardId) : "not recorded";

  /**
   * The games themselves, newest first.
   *
   * ⚠️ **The panel used to show only aggregates.** Every note you wrote after a game was
   * stored and then invisible, and a row entered wrong could not be found, let alone fixed —
   * the first mistyped result had to be corrected from a database console. A record you
   * cannot read is a record you cannot check.
   */
  const here = useMemo(
    () => (matches ?? []).filter((m) => formatOf(m) === format),
    [matches, format],
  );

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
          {/* Formats are never pooled (D-066), so the reading is always about one of them.
              Shown only when you have played more than one — otherwise it is furniture. */}
          {played.length > 1 && (
            <div className="row formats">
              {played.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={format === f ? "chip on" : "chip"}
                  onClick={() => setChosen(f)}
                  title={FORMAT_NOTE[f]}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <div className="standing">
            <Record standing={reading.overall} baseline={reading.baseline} />
            <span className="dim">
              {reading.overall.played === 1
                ? `1 match · ${reading.format}`
                : `${reading.overall.played} matches · ${reading.format}`}
            </span>
          </div>

          {/* Never let games sit invisibly in another bucket — an empty record with four
              games logged elsewhere reads as "you have not played". */}
          {reading.elsewhere.length > 0 && (
            <p className="dim elsewhere">
              Not counted here:{" "}
              {reading.elsewhere
                .map((f) => `${f.played} in ${f.format}`)
                .join(", ")}
              . Formats are read separately.
            </p>
          )}

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

          {/* The games themselves. Tap one to correct it — the same sheet, pre-filled. */}
          {here.length > 0 && (
            <ol className="played">
              {here.map((m) => (
                <li key={m.id}>
                  <button type="button" className="game" onClick={() => setEditing(m)}>
                    <b className={m.result.toLowerCase()}>{LABEL[m.result]}</b>
                    <span className="dim">{m.playedAt}</span>
                    {m.games && <code>{m.games}</code>}
                    <span className="who">
                      {m.opponentNote ?? (m.opponentLegend ? nameOf(m.opponentLegend) : "")}
                    </span>
                  </button>
                  {(m.symptoms ?? []).length > 0 && (
                    <p className="symptom-row">
                      {(m.symptoms ?? []).map((s) => (
                        <span key={s} className="chip" title={symptomReading(s)}>
                          {s.replace(/-/g, " ")}
                        </span>
                      ))}
                    </p>
                  )}
                  {m.notes && <p className="said">{m.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {(logging || editing) && (
        <LogMatch
          // Remounts per match, so the sheet never opens holding the previous game's answers.
          key={editing?.id ?? "new"}
          deckId={deckId}
          deckName={deckName}
          deckHash={deckHash}
          pool={pool}
          existing={editing ?? undefined}
          onClose={() => {
            setLogging(false);
            setEditing(null);
          }}
          onSaved={() => {
            setLogging(false);
            setEditing(null);
            onRefresh();
          }}
        />
      )}
    </section>
  );
}

/**
 * The form, for a new match or for correcting one. Deliberately short — it is filled in after
 * a game, when you want to be doing something else, and a form nobody finishes produces a log
 * nobody can use.
 *
 * Only the result is required. Everything else, including which Legend you faced, is
 * optional because *not knowing is a real answer* and forcing a guess would put a wrong
 * fact in the record.
 *
 * ⚠️ **Editing reuses the same id**, which the API's `ON CONFLICT(id) DO UPDATE` turns into an
 * update. A separate edit endpoint would be a second writer to the one table in this system
 * that cannot be reconstructed if the two ever disagree.
 */
function LogMatch({
  deckId,
  deckName,
  deckHash,
  pool,
  existing,
  onClose,
  onSaved,
}: {
  deckId: string;
  deckName: string;
  deckHash: string | null;
  pool: CardPool;
  /** The match being corrected, if this is an edit rather than a new game. */
  existing?: MatchRecord | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  /**
   * ⚠️ **No default, and this is the whole point.** It used to start on `WIN`.
   *
   * The comment above says the result is the one required field — but a required field that
   * arrives pre-answered is not required, it is *guessed*, and the guess is invisible because
   * a filled-in form looks finished. The first two games ever logged both saved as wins; the
   * second had been lost, and its own notes said so. Nothing in a fast form asks you to
   * confirm what it already appears to know.
   */
  const [result, setResult] = useState<MatchResult | null>(existing?.result ?? null);
  const [format, setFormat] = useState<MatchFormat>(existing?.format ?? "1v1");
  const [playedAt, setPlayedAt] = useState(existing?.playedAt ?? today());
  const [opponent, setOpponent] = useState(existing?.opponentLegend ?? "");
  const [opponentNote, setOpponentNote] = useState(existing?.opponentNote ?? "");
  const [games, setGames] = useState(existing?.games ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [symptoms, setSymptoms] = useState<Symptom[]>([...(existing?.symptoms ?? [])]);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Two taps to delete. One tap on irreplaceable data is not a confirmation. */
  const [confirming, setConfirming] = useState(false);

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

  /**
   * Remove a match. The endpoint has existed since the log shipped with nothing calling it,
   * which is how a mistyped row became something only a database console could fix.
   */
  const remove = async () => {
    if (!existing) return;
    setSaving(true);
    setProblem(null);
    try {
      const response = await fetch(`/matches/${encodeURIComponent(existing.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onSaved();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
      setSaving(false);
      setConfirming(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    // The button is disabled without one; this is the guard that does not depend on the
    // button, because a form can also be submitted by pressing return in a text field.
    if (!result) return;
    setSaving(true);
    setProblem(null);
    try {
      const response = await fetch("/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // Correcting a match keeps its id, so the row is updated rather than duplicated.
          id: existing?.id ?? id(),
          deckId,
          deckName,
          // ⚠️ An edit must not restamp the build. The hash records which version you
          // *played*, and fixing a typo two weeks later would silently reattribute the game
          // to whatever the deck has become since.
          deckHash: existing ? (existing.deckHash ?? null) : deckHash,
          playedAt,
          format,
          result,
          // ⚠️ Only heads-up records a Legend. With two opponents the field would name one
          // of them and the record would then claim a matchup that never happened — the
          // select is hidden below, and this is the guard that survives a stale state value.
          opponentLegend: format === "1v1" ? opponent || null : null,
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
    <div
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-label={existing ? "Correct a match" : "Log a match"}
    >
      <form className="sheet" onSubmit={submit}>
        <h3>{existing ? "Correct a match" : "Log a match"}</h3>

        {/* ⚠️ Nothing is pre-selected. The result is the one thing the record cannot infer,
            and a chip already lit reads as an answer you gave. */}
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
        {!result && <p className="dim">How did it go? Everything else is optional.</p>}

        {/* The shape of the table. It decides what the record is allowed to conclude, so it
            is asked for up front rather than buried under the notes (D-066). */}
        <div className="row formats">
          {MATCH_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              className={format === f ? "chip on" : "chip"}
              onClick={() => setFormat(f)}
              title={FORMAT_NOTE[f]}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="row">
          <label>
            Played
            <input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} />
          </label>
          {/* ⚠️ Labelled for what it is. "Games" invited it to be used as the result — the
              first two entries said 1-0 and 0-1 meaning won and lost — and the row then
              disagreed with itself. Yours goes first, and the engine now rejects a score
              that contradicts the result rather than storing both claims. */}
          <label>
            Games, if several
            <input
              value={games}
              onChange={(e) => setGames(e.target.value)}
              placeholder="2-1, yours first"
              inputMode="numeric"
            />
          </label>
        </div>

        {/* One opponent, one Legend. In any other format there is more than one and the
            record refuses to pick — they go in the free text below instead. */}
        {format === "1v1" && (
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
        )}

        <label>
          {format === "1v1" ? "Their deck" : "Who else was at the table"}
          <input
            value={opponentNote}
            onChange={(e) => setOpponentNote(e.target.value)}
            placeholder={
              format === "2v2"
                ? "Partner: Jinx tempo. Against Diana and Yasuo"
                : format === "1v1v1"
                  ? "Diana ramp and Yasuo aggro"
                  : "Yasuo aggro, splashing Order"
            }
          />
        </label>

        {result === "LOSS" && (
          <fieldset className="symptoms">
            <legend>What went wrong? Optional, and it is what makes losses add up.</legend>
            {/* Symptoms aggregate within a format, never across one. "Couldn't hold" against
                two opponents may be arithmetic rather than a fact about the deck. */}
            {format !== "1v1" && (
              <p className="dim">
                Counted only against your other {format} games — holding a battlefield against
                two players is a different question.
              </p>
            )}
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
          {/* Deleting a match destroys the one thing here that cannot be reconstructed, so it
              asks twice — and it lives only on an existing row, never beside "Log it". */}
          {existing &&
            (confirming ? (
              <button type="button" className="ghost danger" onClick={remove} disabled={saving}>
                Delete it permanently?
              </button>
            ) : (
              <button type="button" className="ghost" onClick={() => setConfirming(true)}>
                Delete
              </button>
            ))}
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          {/* Disabled until a result is picked. The record's one required fact is not one the
              form is willing to assume on your behalf. */}
          <button type="submit" className="primary" disabled={saving || !result}>
            {saving ? "Saving…" : existing ? "Save the correction" : "Log it"}
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
