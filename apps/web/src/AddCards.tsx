import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, CardPool, Printing } from "./cards.js";
import { hd } from "./cards.js";

/**
 * Entering the collection, **inside Forge**.
 *
 * ⚠️ This replaces remembering to `cd tools/collection && python3 -m http.server 8000`, then
 * exporting a file, then importing it. That worked, and *"how will I remember to do all those
 * things every time"* is the correct objection to it: a workflow you have to rehearse is one
 * you stop using. Adding a card is now the same as opening Forge.
 *
 * The entry model is the disposable tool's, because it was right: **the field keeps focus**,
 * so it is number → Enter → number → Enter without touching the mouse, and matches appear
 * *before* you commit rather than after.
 *
 * The standalone tool stays for one reason only — it works with no signal, which Forge
 * cannot (D-049).
 */

/**
 * A match, resolved all the way down to the printing.
 *
 * ⚠️ **The printing is the point.** Returning only the card meant `197a` found Teemo and
 * then registered `OGN-197` — the base art — because the caller had to re-derive a printing
 * and picked the first one in the set. Typing the suffix and getting the other card is the
 * exact mistake the suffix exists to prevent, and it is invisible: both are real entries.
 */
export interface Match {
  card: Card;
  printing: Printing;
}

export interface Parsed {
  cands: Match[];
  /** How many to add. `12 x3` adds three. */
  mult: number;
  /** `-1` when the input ends in `-`, for correcting a miscount. */
  sign: 1 | -1;
  /** More matches than shown, so the count can be stated rather than implied. */
  total?: number;
  miss?: string;
  typing?: boolean;
}

const SET_CODE = /^([A-Za-z]{3})[\s-]+(.*)$/;
const COLLECTOR = /^(\d{1,3})([A-Za-z*]?)$/;
const MULTIPLIER = /^(.*?)\s*[*x]\s*(\d+)$/i;

/**
 * Turn what was typed into candidates. Ported from the collection tool rather than
 * reinvented — every rule here exists because a real collector number needed it.
 */
export function parseEntry(raw: string, pool: CardPool, currentSet: string): Parsed | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let set = currentSet;
  let rest = trimmed;
  let mult = 1;
  let sign: 1 | -1 = 1;

  const withSet = rest.match(SET_CODE);
  if (withSet && pool.sets.includes(withSet[1]!.toUpperCase())) {
    set = withSet[1]!.toUpperCase();
    rest = withSet[2]!.trim();
  }
  // A trailing minus means "I counted one too many", which happens constantly.
  if (rest.endsWith("-")) {
    sign = -1;
    rest = rest.slice(0, -1).trim();
  }
  const withMult = rest.match(MULTIPLIER);
  if (withMult) {
    rest = withMult[1]!.trim();
    mult = Math.max(1, Math.min(99, Number(withMult[2])));
  }
  if (rest.endsWith("-")) {
    sign = -1;
    rest = rest.slice(0, -1).trim();
  }

  const collector = rest.match(COLLECTOR);
  if (collector) {
    const number = Number(collector[1]);
    const suffix = collector[2] ?? "";
    const padded = String(number).padStart(3, "0");
    // The exact printing, not merely the card that has one. `197` and `197a` are different
    // objects on a shelf and the whole reason the suffix is typed at all.
    const wanted = `${set}-${padded}${suffix}/`;
    for (const card of pool.cards) {
      const printing = card.printings.find((p) => p.set === set && p.code.startsWith(wanted));
      if (printing) return { cands: [{ card, printing }], mult, sign };
    }
    return { cands: [], miss: `${set} ${number}${suffix}`, mult, sign };
  }

  const query = rest.toLowerCase();
  if (query.length < 2) return { cands: [], typing: true, mult, sign };

  const hits = pool.cards.filter((c) => c.name.toLowerCase().includes(query));
  if (hits.length === 0) return { cands: [], miss: rest, mult, sign };
  hits.sort((a, b) => {
    const rank = (c: Card) => {
      const l = c.name.toLowerCase();
      return l === query ? 0 : l.startsWith(query) ? 1 : 2;
    };
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
  // A name cannot name an art, so a name match takes the set's base printing. Type the
  // collector number with its suffix when you want a specific one.
  return {
    cands: hits.slice(0, 6).map((card) => ({ card, printing: printingFor(card, set) })),
    total: hits.length,
    mult,
    sign,
  };
}

/** Which printing a *name* match lands on, given the set you are working through. */
const printingFor = (card: Card, set: string) =>
  card.printings.find((p) => p.set === set) ?? card.printings[0]!;

interface Step {
  cardId: string;
  name: string;
  delta: number;
}

/**
 * ⚠️ **Unsaved entries survive everything.**
 *
 * A card is committed the instant you press Enter and the field clears immediately — which
 * is right for typing speed and catastrophic if the write then fails. Over a few hours the
 * Access session can expire, or the wifi drops, and every subsequent Enter would vanish into
 * an error line you are not looking at because your eyes are on a box of cards.
 *
 * So a failed adjustment is *held*, not lost: queued, mirrored to localStorage so a reload
 * or a crash cannot take it, retried automatically on the next success, and counted in a
 * banner that does not go away until it is empty.
 */
const PENDING_KEY = "forge.collection.pending";

const readPending = (): Step[] => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Step[]) : [];
  } catch {
    return [];
  }
};

const writePending = (steps: Step[]) => {
  try {
    if (steps.length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(steps));
  } catch {
    // Storage full or blocked. The in-memory queue still holds them for this session.
  }
};

/** Sum repeated adjustments to the same printing — the API takes one delta per card. */
const merge = (steps: readonly Step[]) => {
  const out: Record<string, number> = {};
  for (const s of steps) out[s.cardId] = (out[s.cardId] ?? 0) + s.delta;
  return out;
};

export function AddCards({
  pool,
  owned,
  onChanged,
}: {
  pool: CardPool;
  owned: Readonly<Record<string, number>>;
  onChanged: (counts: Record<string, number>) => void;
}) {
  const [set, setSet] = useState(pool.sets[0] ?? "OGN");
  const [text, setText] = useState("");
  const [history, setHistory] = useState<Step[]>([]);
  const [pending, setPending] = useState<Step[]>(readPending);
  const [problem, setProblem] = useState<string | null>(null);
  const field = useRef<HTMLInputElement | null>(null);

  // The field keeps focus, which is the whole ergonomic point of number → Enter → number.
  useEffect(() => field.current?.focus(), []);

  const parsed = useMemo(() => parseEntry(text, pool, set), [text, pool, set]);

  /** Send a batch of adjustments. Throws with a readable message; never swallows. */
  const send = async (steps: readonly Step[]) => {
    const response = await fetch("/collection", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adjust: merge(steps) }),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.includes("json")) {
      throw new Error(
        type.includes("json")
          ? `Could not save (HTTP ${response.status}).`
          : "Not saved — the server answered with a page. Sign in again, then press Retry.",
      );
    }
    const body = (await response.json()) as { counts?: Record<string, number>; error?: string };
    if (body.error) throw new Error(body.error);
    return body.counts ?? {};
  };

  const retry = async () => {
    if (pending.length === 0) return;
    try {
      onChanged(await send(pending));
      setPending([]);
      writePending([]);
      setProblem(null);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
    }
    field.current?.focus();
  };

  const commit = async ({ card, printing }: Match, mult: number, sign: 1 | -1) => {
    const delta = mult * sign;
    const step: Step = { cardId: printing.id, name: card.name, delta };
    setText("");
    setProblem(null);
    field.current?.focus();
    try {
      // Anything held from an earlier failure rides along, so recovery needs no ceremony.
      const batch = [...pending, step];
      const counts = await send(batch);
      onChanged(counts);
      if (pending.length > 0) {
        setPending([]);
        writePending([]);
      }
      setHistory((h) => [step, ...h].slice(0, 40));
      return;
    } catch (error) {
      const held = [...pending, step];
      setPending(held);
      writePending(held);
      setProblem(error instanceof Error ? error.message : String(error));
      return;
    }
  };

  const undo = async () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));
    const reverse: Step = { ...last, delta: -last.delta };
    try {
      onChanged(await send([...pending, reverse]));
      if (pending.length > 0) {
        setPending([]);
        writePending([]);
      }
    } catch (error) {
      // An undo that fails is held exactly like an add, or the correction is lost.
      const held = [...pending, reverse];
      setPending(held);
      writePending(held);
      setProblem(error instanceof Error ? error.message : String(error));
    }
    field.current?.focus();
  };

  const totals = useMemo(() => {
    const copies = Object.values(owned).reduce((a, b) => a + b, 0);
    return { printings: Object.keys(owned).length, copies };
  }, [owned]);

  return (
    <div className="adder">
      <div className="setbar">
        {pool.sets.map((s) => (
          <button
            key={s}
            type="button"
            className={s === set ? "setchip on" : "setchip"}
            onClick={() => {
              setSet(s);
              field.current?.focus();
            }}
          >
            {s}
          </button>
        ))}
        <span className="addtotals">
          <b>{totals.copies}</b> {totals.copies === 1 ? "copy" : "copies"} ·{" "}
          <b>{totals.printings}</b> {totals.printings === 1 ? "printing" : "printings"}
        </span>
        {history.length > 0 && (
          <button type="button" className="ghost" onClick={() => void undo()}>
            undo {history[0]!.name.slice(0, 18)}
          </button>
        )}
      </div>

      <input
        ref={field}
        className="addfield"
        value={text}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={`${set} collector number, or part of a name`}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !parsed) return;
          const first = parsed.cands[0];
          if (first) void commit(first, parsed.mult, parsed.sign);
        }}
      />

      <p className="addhint">
        <b>12</b> adds one · <b>12 x3</b> adds three · <b>12-</b> takes one back ·{" "}
        <b>66a</b> alt art · <b>ogn 12</b> jumps set
      </p>

      {/* Does not disappear until the queue is empty. Losing an hour of typing to a line
          of red text nobody looked at is the failure this exists to prevent. */}
      {pending.length > 0 && (
        <p className="held">
          <b>
            {pending.length} {pending.length === 1 ? "entry" : "entries"} not saved
          </b>
          <span>{problem ?? "They are kept here, and survive a reload."}</span>
          <button type="button" className="primary" onClick={() => void retry()}>
            Retry
          </button>
        </p>
      )}
      {problem && pending.length === 0 && <p className="fail">{problem}</p>}

      {parsed?.miss && (
        <p className="empty">No match for {parsed.miss} — check the set, or type part of a name.</p>
      )}

      {/**
        * A collector number resolves to exactly one card, which is the overwhelming majority
        * of entries — so that case gets a **large** preview rather than a row in a list. The
        * whole job at that moment is confirming you are about to register the card in your
        * hand, and a thumbnail the size of a favicon cannot do it.
        */}
      {parsed && parsed.cands.length === 1 && (
        <button
          type="button"
          className="hit-solo"
          onClick={() => void commit(parsed.cands[0]!, parsed.mult, parsed.sign)}
        >
          {(() => {
            const { card, printing } = parsed.cands[0]!;
            const wide = card.landscape === true;
            return (
              <>
                <img
                  className={wide ? "wide" : ""}
                  src={hd(printing, wide ? 300 : 210)}
                  alt=""
                />
                <span className="solo-mid">
                  <b>{card.name}</b>
                  <span className="hit-meta">{printing.code}</span>
                  <span className="solo-own">
                    you own <b>{owned[printing.id] ?? 0}</b>
                  </span>
                </span>
                <span className="solo-right">
                  <span className={parsed.sign < 0 ? "hit-delta dn" : "hit-delta up"}>
                    {parsed.sign < 0 ? "−" : "+"}
                    {parsed.mult}
                  </span>
                  <span className="hit-key">⏎ enter</span>
                </span>
              </>
            );
          })()}
        </button>
      )}

      {parsed && parsed.cands.length > 1 && (
        <ul className="hits">
          {parsed.cands.map((match, i) => {
            const { card, printing } = match;
            const have = owned[printing.id] ?? 0;
            return (
              <li key={printing.id}>
                <button type="button" onClick={() => void commit(match, parsed.mult, parsed.sign)}>
                  {/* ⚠️ **These numbers are the CSS, restated.** `.hits img` is 96px and
                      `.hits img.wide` is 132px — asking for 96 and drawing 132 is a 1.4x
                      upscale, and it landed on exactly one kind of card: the battlefields,
                      in the one list you stare at while entering a pile of them. */}
                  <img
                    className={card.landscape === true ? "wide" : ""}
                    src={hd(printing, card.landscape === true ? 132 : 96)}
                    alt=""
                    loading="lazy"
                  />
                  <span className="hit-mid">
                    <b>{card.name}</b>
                    <span className="hit-meta">
                      {printing.code} · own {have}
                    </span>
                  </span>
                  <span className={parsed.sign < 0 ? "hit-delta dn" : "hit-delta up"}>
                    {parsed.sign < 0 ? "−" : "+"}
                    {parsed.mult}
                  </span>
                  {i === 0 && <span className="hit-key">⏎</span>}
                </button>
              </li>
            );
          })}
          {parsed.total && parsed.total > parsed.cands.length && (
            <li className="hit-more">{parsed.total - parsed.cands.length} more — keep typing</li>
          )}
        </ul>
      )}
    </div>
  );
}
