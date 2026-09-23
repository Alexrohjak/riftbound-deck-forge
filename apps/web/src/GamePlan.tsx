import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkGamePlan,
  planRecord,
  type BattlefieldPick,
  type Deck,
  type GamePlan,
  type MatchRecord,
  type MatchupPlan,
  type PlanNote,
  type Swap,
  type Voice,
  type Weakness,
} from "@forge/engine";
import type { Card, CardPool } from "./cards.js";
import { Record as Standing } from "./Log.js";
import { disagreement, FieldPanel, FieldStanding, useField } from "./Field.js";

/**
 * How to pilot this deck (D-067) — battlefield picks, what to side in against whom, and what
 * to play around.
 *
 * ⚠️ **Every sentence shows who said it.** `ours` is what you decided, `draft` is Claude's
 * unconfirmed suggestion, `guide` is the Legend guide's doctrine, `forge` is computed. Edit a
 * line and it becomes `ours`, because it now is.
 *
 * ⚠️ **Staleness is shown, never enforced.** The deck moves on after the plan is written; the
 * engine's `checkGamePlan` says which swaps no longer fit, and the page still saves.
 */

const VOICE: Record<Voice, { label: string; hint: string }> = {
  ours: { label: "ours", hint: "Decided by you — at the table or in conversation." },
  draft: { label: "draft", hint: "Suggested by Claude and not yet confirmed. Edit it to make it yours." },
  guide: { label: "guide", hint: "From the Legend guide. Doctrine, and players disagree." },
  forge: { label: "forge", hint: "Computed by Forge from the list. A count, not advice." },
  field: { label: "field", hint: "What the tournament field does — the average list, not yours." },
};

export function useGamePlan(deckId: string) {
  const [plan, setPlan] = useState<GamePlan | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPlan(null);
    fetch(`/decks/${encodeURIComponent(deckId)}/gameplan`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: { plan: GamePlan; updatedAt: string | null }) => {
        setPlan(body.plan);
        setUpdatedAt(body.updatedAt);
        setFailed(null);
      })
      .catch((error: Error) => setFailed(error.message));
  }, [deckId]);

  useEffect(refresh, [refresh]);

  /** Resolves to an error message, or null when it saved. */
  const save = useCallback(
    async (next: GamePlan): Promise<string | null> => {
      try {
        const response = await fetch(`/decks/${encodeURIComponent(deckId)}/gameplan`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) return body.error ?? `HTTP ${response.status}`;
        setPlan(next);
        setUpdatedAt(new Date().toISOString().slice(0, 19).replace("T", " "));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    [deckId],
  );

  return { plan, updatedAt, failed, save };
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * Lines of a textarea back into notes. A line whose text is unchanged keeps the voice it had;
 * anything new or edited is `ours`, because you wrote it.
 */
export const linesToNotes = (text: string, before: readonly PlanNote[]): PlanNote[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => before.find((n) => n.text === line) ?? { text: line, voice: "ours" as const });

const notesToLines = (notes: readonly PlanNote[]) => notes.map((n) => n.text).join("\n");

function Voiced({ voice }: { voice: Voice }) {
  return (
    <span className={`badge voice-${voice}`} title={VOICE[voice].hint}>
      {VOICE[voice].label}
    </span>
  );
}

function Notes({ notes, empty }: { notes: readonly PlanNote[]; empty: string }) {
  if (notes.length === 0) return <p className="empty">{empty}</p>;
  return (
    <ul className="plan-notes">
      {notes.map((n, i) => (
        <li key={i}>
          {n.text}
          <Voiced voice={n.voice} />
        </li>
      ))}
    </ul>
  );
}

// ── the view ────────────────────────────────────────────────────────────────

export function GamePlanPanel({
  deck,
  pool,
  matches,
}: {
  deck: Deck;
  pool: CardPool;
  matches: MatchRecord[] | null;
}) {
  const { plan, updatedAt, failed, save } = useGamePlan(deck.id);
  const [editing, setEditing] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const nameOf = useCallback((id: string) => pool.byPrinting.get(id)?.name, [pool]);
  const name = (id: string | null | undefined) => (id ? (nameOf(id) ?? id) : "—");

  const issues = useMemo(
    () => (plan ? checkGamePlan(plan, deck, pool.index) : []),
    [plan, deck, pool.index],
  );
  const record = useMemo(
    () => (plan && matches ? planRecord(plan, matches, nameOf) : null),
    [plan, matches, nameOf],
  );
  const field = useField(nameOf);
  const planned = useMemo(
    () => new Set((plan?.matchups ?? []).flatMap((m) => (m.legendCardId ? [nameOf(m.legendCardId) ?? m.legendCardId] : []))),
    [plan, nameOf],
  );

  const commit = async (next: GamePlan) => {
    setProblem(null);
    const error = await save(next);
    if (error) setProblem(error);
    else setEditing(null);
  };

  if (failed) return <section className="panel plan"><p className="fail">The game plan did not load: {failed}</p></section>;
  if (!plan) return <section className="panel plan"><p className="empty">Reading the game plan…</p></section>;

  const edit = (key: string) => () => {
    setProblem(null);
    setEditing(key);
  };
  const cancel = () => setEditing(null);
  const general = issues.filter((i) => i.matchupId === null);

  return (
    <>
      {field && (
        <FieldPanel
          field={field}
          legendCardId={deck.legendCardId}
          planned={planned}
          nameOf={nameOf}
          onPlan={(id) => edit(`new:${id}`)()}
          disabled={editing !== null}
        />
      )}
      <section className="panel plan">
        <h2>
          How it wins
          {editing !== "general" && (
            <button type="button" className="ghost plan-btn" onClick={edit("general")}>
              edit
            </button>
          )}
        </h2>
        {updatedAt === null && (
          <p className="dim">
            No game plan yet. Write one here, or have Claude draft one with <code>npm run gameplan</code>.
          </p>
        )}
        {editing === "general" ? (
          <GeneralEditor plan={plan} onSave={commit} onCancel={cancel} />
        ) : (
          <>
            <Notes notes={plan.winPlan} empty="Nothing written about how this deck wins." />
            <h3>Mulligan</h3>
            <Notes notes={plan.mulligan} empty="No mulligan guidance yet." />
          </>
        )}
      </section>

      <section className="panel plan">
        <h2>
          Battlefields
          {editing !== "battlefields" && (
            <button type="button" className="ghost plan-btn" onClick={edit("battlefields")}>
              edit
            </button>
          )}
        </h2>
        {editing === "battlefields" ? (
          <BattlefieldEditor deck={deck} plan={plan} name={name} onSave={commit} onCancel={cancel} />
        ) : plan.battlefields.length === 0 ? (
          <p className="empty">No preference recorded. Matchups can still name their own pick.</p>
        ) : (
          <ol className="plan-fields">
            {plan.battlefields.map((b, i) => (
              <li key={b.cardId}>
                <b>{name(b.cardId)}</b>
                {i === 0 && <span className="chip on">default</span>}
                {b.why && (
                  <p className="said">
                    {b.why}
                    <Voiced voice={b.voice ?? "ours"} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {general.map((i, n) => (
          <p key={n} className="fail">⚠️ {i.message}</p>
        ))}
      </section>

      <section className="panel plan">
        <h2>
          Matchups
          {editing === null && (
            <button type="button" className="ghost plan-btn" onClick={edit("new")}>
              + matchup
            </button>
          )}
        </h2>
        {editing === "new" && (
          <MatchupEditor
            deck={deck}
            pool={pool}
            name={name}
            initial={{ id: uid("mu"), bringIn: [], takeOut: [], watchFor: [], playAround: [] }}
            onSave={(m) => commit({ ...plan, matchups: [...plan.matchups, m] })}
            onCancel={cancel}
          />
        )}
        {record && record.unplanned.length > 0 && (
          <div className="unplanned">
            <p className="dim">Faced with this deck, and no plan yet:</p>
            {record.unplanned.map((u) => (
              <button
                key={u.legendCardId}
                type="button"
                className="chip"
                disabled={editing !== null}
                onClick={edit(`new:${u.legendCardId}`)}
              >
                {name(u.legendCardId)} <em>{u.standing.wins}–{u.standing.losses}</em>
              </button>
            ))}
          </div>
        )}
        {editing?.startsWith("new:") && (
          <MatchupEditor
            deck={deck}
            pool={pool}
            name={name}
            initial={{
              id: uid("mu"),
              legendCardId: editing.slice(4),
              bringIn: [],
              takeOut: [],
              watchFor: [],
              playAround: [],
            }}
            onSave={(m) => commit({ ...plan, matchups: [...plan.matchups, m] })}
            onCancel={cancel}
          />
        )}
        {plan.matchups.length === 0 && editing === null && (
          <p className="empty">No matchups planned yet.</p>
        )}
        {plan.matchups.map((m) =>
          editing === m.id ? (
            <MatchupEditor
              key={m.id}
              deck={deck}
              pool={pool}
              name={name}
              initial={m}
              onSave={(next) =>
                commit({ ...plan, matchups: plan.matchups.map((x) => (x.id === m.id ? next : x)) })
              }
              onDelete={() => commit({ ...plan, matchups: plan.matchups.filter((x) => x.id !== m.id) })}
              onCancel={cancel}
            />
          ) : (
            <article key={m.id} className="matchup">
              <header>
                <h3>{m.legendCardId ? name(m.legendCardId) : m.archetype}</h3>
                {m.legendCardId && m.archetype && <span className="dim">{m.archetype}</span>}
                {record?.byMatchup.get(m.id) && <Standing standing={record.byMatchup.get(m.id)!} />}
                {field && m.legendCardId && (
                  <FieldStanding standing={field.pairing(deck.legendCardId, m.legendCardId)} />
                )}
                {editing === null && (
                  <button type="button" className="ghost plan-btn" onClick={edit(m.id)}>
                    edit
                  </button>
                )}
              </header>
              {field && m.legendCardId && (() => {
                const said = disagreement(record?.byMatchup.get(m.id), field.pairing(deck.legendCardId, m.legendCardId));
                return said && <p className="said">{said}<Voiced voice="forge" /></p>;
              })()}
              {m.battlefield && (
                <p className="field-pick">
                  <span className="dim">Battlefield</span> <b>{name(m.battlefield.cardId)}</b>
                  {m.battlefield.why && (
                    <>
                      <span className="dim"> — {m.battlefield.why}</span>
                      <Voiced voice={m.battlefield.voice ?? "ours"} />
                    </>
                  )}
                </p>
              )}
              {(m.bringIn.length > 0 || m.takeOut.length > 0) && (
                <div className="swaps">
                  <SwapList label="In" swaps={m.bringIn} name={name} />
                  <SwapList label="Out" swaps={m.takeOut} name={name} />
                </div>
              )}
              {m.watchFor.length > 0 && (
                <>
                  <h4>Watch for</h4>
                  <Notes notes={m.watchFor} empty="" />
                </>
              )}
              {m.playAround.length > 0 && (
                <>
                  <h4>Play around it</h4>
                  <Notes notes={m.playAround} empty="" />
                </>
              )}
              {issues
                .filter((i) => i.matchupId === m.id)
                .map((i, n) => (
                  <p key={n} className="fail">⚠️ {i.message}</p>
                ))}
            </article>
          ),
        )}
      </section>

      <section className="panel plan">
        <h2>
          Weaknesses
          {editing !== "weaknesses" && (
            <button type="button" className="ghost plan-btn" onClick={edit("weaknesses")}>
              edit
            </button>
          )}
        </h2>
        {editing === "weaknesses" ? (
          <WeaknessEditor plan={plan} onSave={commit} onCancel={cancel} />
        ) : plan.weaknesses.length === 0 ? (
          <p className="empty">None written down. The Analysis view's threat scan is a place to start.</p>
        ) : (
          <dl className="weaknesses">
            {plan.weaknesses.map((w) => (
              <div key={w.id}>
                <dt>
                  {w.threat}
                  <Voiced voice={w.voice} />
                </dt>
                <dd>{w.playAround || <span className="dim">No answer decided yet.</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      {problem && <p className="fail">Not saved: {problem}</p>}
    </>
  );
}

function SwapList({ label, swaps, name }: { label: string; swaps: Swap[]; name: (id: string) => string }) {
  return (
    <div>
      <h4>{label}</h4>
      {swaps.length === 0 ? (
        <p className="empty">—</p>
      ) : (
        <ul>
          {swaps.map((s) => (
            <li key={s.cardId}>
              <span className="qty">{s.quantity}×</span> {name(s.cardId)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── editors ─────────────────────────────────────────────────────────────────

function Buttons({ onCancel, onDelete }: { onCancel: () => void; onDelete?: (() => void) | undefined }) {
  /** Two taps to delete. A matchup is written after a loss, and that note does not come back. */
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="row actions">
      <button type="submit" className="primary">
        Save
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Cancel
      </button>
      {onDelete && (
        <button
          type="button"
          className="ghost danger"
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
        >
          {confirming ? "Really delete" : "Delete"}
        </button>
      )}
    </div>
  );
}

function GeneralEditor({
  plan,
  onSave,
  onCancel,
}: {
  plan: GamePlan;
  onSave: (p: GamePlan) => void;
  onCancel: () => void;
}) {
  const [win, setWin] = useState(notesToLines(plan.winPlan));
  const [mull, setMull] = useState(notesToLines(plan.mulligan));
  return (
    <form
      className="plan-edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...plan, winPlan: linesToNotes(win, plan.winPlan), mulligan: linesToNotes(mull, plan.mulligan) });
      }}
    >
      <label>
        How it wins <span className="dim">— one point per line</span>
        <textarea rows={4} value={win} onChange={(e) => setWin(e.target.value)} />
      </label>
      <label>
        Mulligan
        <textarea rows={3} value={mull} onChange={(e) => setMull(e.target.value)} />
      </label>
      <Buttons onCancel={onCancel} />
    </form>
  );
}

function BattlefieldEditor({
  deck,
  plan,
  name,
  onSave,
  onCancel,
}: {
  deck: Deck;
  plan: GamePlan;
  name: (id: string) => string;
  onSave: (p: GamePlan) => void;
  onCancel: () => void;
}) {
  // Every registered battlefield, in the plan's order first — so a field added to the deck
  // since the plan was written appears at the bottom rather than not at all.
  const registered = deck.slots.filter((s) => s.zone === "BATTLEFIELD").map((s) => s.cardId);
  const [rows, setRows] = useState<BattlefieldPick[]>(() => [
    ...plan.battlefields.filter((b) => registered.includes(b.cardId)),
    ...registered
      .filter((id) => !plan.battlefields.some((b) => b.cardId === id))
      .map((cardId) => ({ cardId, why: "" })),
  ]);
  const move = (i: number, by: number) =>
    setRows((r) => {
      const next = [...r];
      const [x] = next.splice(i, 1);
      next.splice(i + by, 0, x!);
      return next;
    });
  return (
    <form
      className="plan-edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...plan, battlefields: rows.map((r) => ({ ...r, why: r.why.trim() })) });
      }}
    >
      <p className="dim">First is the default pick.</p>
      {rows.map((r, i) => (
        <div key={r.cardId} className="row field-row">
          <b>{name(r.cardId)}</b>
          <button type="button" className="ghost plan-btn" disabled={i === 0} onClick={() => move(i, -1)}>
            ↑
          </button>
          <button type="button" className="ghost plan-btn" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
            ↓
          </button>
          <input
            placeholder="Why"
            value={r.why}
            onChange={(e) =>
              setRows((all) => all.map((x, j) => (j === i ? { ...x, why: e.target.value, voice: "ours" } : x)))
            }
          />
        </div>
      ))}
      <Buttons onCancel={onCancel} />
    </form>
  );
}

/** The distinct cards in one zone, by name, as options. */
const zoneCards = (deck: Deck, pool: CardPool, zone: "MAIN" | "SIDEBOARD") => {
  const seen = new Map<string, { cardId: string; name: string; max: number }>();
  const ids = deck.slots.filter((s) => s.zone === zone).map((s) => [s.cardId, s.quantity] as const);
  if (zone === "MAIN" && deck.chosenChampionCardId) ids.push([deck.chosenChampionCardId, 1]);
  for (const [cardId, q] of ids) {
    const n = pool.byPrinting.get(cardId)?.name ?? cardId;
    const had = seen.get(n);
    seen.set(n, { cardId: had?.cardId ?? cardId, name: n, max: (had?.max ?? 0) + q });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
};

function SwapEditor({
  label,
  options,
  swaps,
  onChange,
  name,
}: {
  label: string;
  options: Array<{ cardId: string; name: string; max: number }>;
  swaps: Swap[];
  onChange: (s: Swap[]) => void;
  name: (id: string) => string;
}) {
  const unused = options.filter((o) => !swaps.some((s) => name(s.cardId) === o.name));
  return (
    <fieldset className="swap-edit">
      <legend>{label}</legend>
      {swaps.map((s, i) => (
        <div key={s.cardId} className="row">
          <select
            value={s.quantity}
            onChange={(e) => onChange(swaps.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))}
          >
            {[1, 2, 3].map((q) => (
              <option key={q} value={q}>
                {q}×
              </option>
            ))}
          </select>
          <span>{name(s.cardId)}</span>
          <button type="button" className="ghost plan-btn" onClick={() => onChange(swaps.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      {unused.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            const o = options.find((x) => x.cardId === e.target.value);
            if (o) onChange([...swaps, { cardId: o.cardId, quantity: Math.min(o.max, 2) }]);
          }}
        >
          <option value="">+ add a card…</option>
          {unused.map((o) => (
            <option key={o.cardId} value={o.cardId}>
              {o.name} ({o.max})
            </option>
          ))}
        </select>
      )}
    </fieldset>
  );
}

function MatchupEditor({
  deck,
  pool,
  name,
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  deck: Deck;
  pool: CardPool;
  name: (id: string) => string;
  initial: MatchupPlan;
  onSave: (m: MatchupPlan) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [legend, setLegend] = useState(initial.legendCardId ?? "");
  const [archetype, setArchetype] = useState(initial.archetype ?? "");
  const [field, setField] = useState(initial.battlefield?.cardId ?? "");
  const [fieldWhy, setFieldWhy] = useState(initial.battlefield?.why ?? "");
  const [bringIn, setBringIn] = useState<Swap[]>(initial.bringIn);
  const [takeOut, setTakeOut] = useState<Swap[]>(initial.takeOut);
  const [watch, setWatch] = useState(notesToLines(initial.watchFor));
  const [around, setAround] = useState(notesToLines(initial.playAround));

  const legends = useMemo(
    () => pool.cards.filter((c: Card) => c.types.includes("legend")).sort((a, b) => a.name.localeCompare(b.name)),
    [pool],
  );
  const fields = deck.slots.filter((s) => s.zone === "BATTLEFIELD").map((s) => s.cardId);
  const inTotal = bringIn.reduce((a, s) => a + s.quantity, 0);
  const outTotal = takeOut.reduce((a, s) => a + s.quantity, 0);

  return (
    <form
      className="plan-edit matchup"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: initial.id,
          legendCardId: legend || null,
          archetype: archetype.trim() || null,
          battlefield: field
            ? {
                cardId: field,
                why: fieldWhy.trim(),
                // Untouched keeps who said it; any change to the pick or the reason is yours.
                voice:
                  initial.battlefield &&
                  initial.battlefield.cardId === field &&
                  initial.battlefield.why === fieldWhy.trim()
                    ? (initial.battlefield.voice ?? "ours")
                    : "ours",
              }
            : null,
          bringIn,
          takeOut,
          watchFor: linesToNotes(watch, initial.watchFor),
          playAround: linesToNotes(around, initial.playAround),
        });
      }}
    >
      <div className="row">
        <label>
          Their Legend
          <select value={legend} onChange={(e) => setLegend(e.target.value)}>
            <option value="">— a kind of deck, not one Legend —</option>
            {legends.map((c) => (
              <option key={c.printings[0]!.id} value={c.printings[0]!.id}>
                {c.name}
                {c.championTag ? ` — ${c.championTag}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Archetype
          <input placeholder="swarm, big units, gear…" value={archetype} onChange={(e) => setArchetype(e.target.value)} />
        </label>
      </div>
      <div className="row">
        <label>
          Battlefield
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">— use the default —</option>
            {fields.map((id) => (
              <option key={id} value={id}>
                {name(id)}
              </option>
            ))}
          </select>
        </label>
        {field && (
          <label>
            Why
            <input value={fieldWhy} onChange={(e) => setFieldWhy(e.target.value)} />
          </label>
        )}
      </div>
      <div className="swaps">
        <SwapEditor label="In, from the sideboard" options={zoneCards(deck, pool, "SIDEBOARD")} swaps={bringIn} onChange={setBringIn} name={name} />
        <SwapEditor label="Out, from the deck" options={zoneCards(deck, pool, "MAIN")} swaps={takeOut} onChange={setTakeOut} name={name} />
      </div>
      {inTotal !== outTotal && (
        <p className="fail">
          {inTotal} in and {outTotal} out — the deck stays at 40, so every swap is one for one.
        </p>
      )}
      <label>
        Watch for <span className="dim">— one per line</span>
        <textarea rows={3} value={watch} onChange={(e) => setWatch(e.target.value)} />
      </label>
      <label>
        Play around it
        <textarea rows={3} value={around} onChange={(e) => setAround(e.target.value)} />
      </label>
      {!legend && !archetype.trim() && <p className="fail">Name their Legend or an archetype.</p>}
      <Buttons onCancel={onCancel} onDelete={onDelete} />
    </form>
  );
}

function WeaknessEditor({
  plan,
  onSave,
  onCancel,
}: {
  plan: GamePlan;
  onSave: (p: GamePlan) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<Weakness[]>(plan.weaknesses);
  const set = (i: number, patch: Partial<Weakness>) =>
    // Any edit makes the line yours — it is no longer what Forge or the guide said.
    setRows((all) => all.map((w, j) => (j === i ? { ...w, ...patch, voice: "ours" } : w)));
  return (
    <form
      className="plan-edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...plan, weaknesses: rows.filter((w) => w.threat.trim()) });
      }}
    >
      {rows.map((w, i) => (
        <div key={w.id} className="weakness-edit">
          <input placeholder="What goes wrong" value={w.threat} onChange={(e) => set(i, { threat: e.target.value })} />
          <textarea
            rows={2}
            placeholder="What you do about it"
            value={w.playAround}
            onChange={(e) => set(i, { playAround: e.target.value })}
          />
          <button type="button" className="ghost plan-btn" onClick={() => setRows((all) => all.filter((_, j) => j !== i))}>
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="ghost"
        onClick={() => setRows((all) => [...all, { id: uid("wk"), threat: "", playAround: "", voice: "ours" }])}
      >
        + weakness
      </button>
      <Buttons onCancel={onCancel} />
    </form>
  );
}
