import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, CardPool } from "./cards.js";
import { thumb } from "./cards.js";

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

export interface Parsed {
  cands: Card[];
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
    const hit = pool.cards.find((card) =>
      card.printings.some(
        (p) => p.set === set && p.n === number && p.code.startsWith(`${set}-${padded}${suffix}/`),
      ),
    );
    return hit
      ? { cands: [hit], mult, sign }
      : { cands: [], miss: `${set} ${number}${suffix}`, mult, sign };
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
  return { cands: hits.slice(0, 6), total: hits.length, mult, sign };
}

/** Which printing a name-match should land on, given the set you are working through. */
const printingFor = (card: Card, set: string) =>
  card.printings.find((p) => p.set === set) ?? card.printings[0]!;

interface Step {
  cardId: string;
  name: string;
  delta: number;
}

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
  const [problem, setProblem] = useState<string | null>(null);
  const field = useRef<HTMLInputElement | null>(null);

  // The field keeps focus, which is the whole ergonomic point of number → Enter → number.
  useEffect(() => field.current?.focus(), []);

  const parsed = useMemo(() => parseEntry(text, pool, set), [text, pool, set]);

  const commit = async (card: Card, mult: number, sign: 1 | -1) => {
    const printing = printingFor(card, set);
    const delta = mult * sign;
    setText("");
    setProblem(null);
    field.current?.focus();
    try {
      const response = await fetch("/collection", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adjust: { [printing.id]: delta } }),
      });
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("json")) {
        throw new Error(
          type.includes("json")
            ? `Could not save (HTTP ${response.status}).`
            : "The server answered with a page — you may need to sign in again.",
        );
      }
      const body = (await response.json()) as { counts?: Record<string, number>; error?: string };
      if (body.error) throw new Error(body.error);
      onChanged(body.counts ?? {});
      setHistory((h) => [{ cardId: printing.id, name: card.name, delta }, ...h].slice(0, 40));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
    }
  };

  const undo = async () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));
    const response = await fetch("/collection", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adjust: { [last.cardId]: -last.delta } }),
    }).catch(() => null);
    if (response?.ok) {
      const body = (await response.json()) as { counts?: Record<string, number> };
      onChanged(body.counts ?? {});
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

      {problem && <p className="fail">{problem}</p>}

      {parsed?.miss && (
        <p className="empty">No match for {parsed.miss} — check the set, or type part of a name.</p>
      )}

      {parsed && parsed.cands.length > 0 && (
        <ul className="hits">
          {parsed.cands.map((card, i) => {
            const printing = printingFor(card, set);
            const have = owned[printing.id] ?? 0;
            return (
              <li key={card.name}>
                <button type="button" onClick={() => void commit(card, parsed.mult, parsed.sign)}>
                  <img src={thumb(printing, 80)} alt="" loading="lazy" />
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
