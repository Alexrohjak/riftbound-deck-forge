import { read, type MatchRecord, type Standing } from "../log/match.js";
import type { CardIndex, Deck } from "../types.js";

/**
 * How to **pilot** a deck — the half of deckbuilding that happens after the forty is fixed
 * (D-067).
 *
 * The plan (D-064) says what a deck is *built to*; this says what to do with it at the table:
 * which battlefield to pick, what comes in from the sideboard against whom, and what to play
 * around. Every one of those was being worked out in conversation and then lost, because
 * nothing stored it — the sideboard is a list of cards with no record of what each is *for*.
 *
 * ⚠️ **Every sentence carries a voice**, for the same reason `review` separates fact from
 * doctrine: a line Forge computed, a line from the Legend guide, and a line the two of you
 * decided after losing to Azir are three different kinds of claim, and a page that renders
 * them identically invites you to trust the weakest one as much as the strongest.
 */

/**
 * Who is saying it.
 *
 * ⚠️ **`draft` exists so a suggestion cannot pass for a decision.** Plans are seeded in
 * conversation, and a line Claude proposed that you never confirmed is not `ours` — labelling
 * it so would put an unexamined opinion under the strongest badge on the page. Editing a line
 * makes it `ours`.
 */
export const VOICES = ["ours", "draft", "guide", "forge"] as const;
export type Voice = (typeof VOICES)[number];

export interface PlanNote {
  text: string;
  voice: Voice;
}

export interface Swap {
  /** Any printing of the card — swaps are checked by **name**, like every copy limit. */
  cardId: string;
  quantity: number;
}

export interface BattlefieldPick {
  cardId: string;
  why: string;
  /** Who gave the reason. Absent reads as `ours` — a pick typed into the app. */
  voice?: Voice;
}

/**
 * One opponent. Keyed by their Legend when you know it, or by an archetype ("swarm", "big
 * units") when the plan is for a *kind* of deck — a sideboard is usually built against
 * archetypes and then played against Legends, and both are real questions.
 */
export interface MatchupPlan {
  /** Stable within the plan, so an edit updates this card rather than adding another. */
  id: string;
  legendCardId?: string | null;
  archetype?: string | null;
  battlefield?: BattlefieldPick | null;
  bringIn: Swap[];
  takeOut: Swap[];
  watchFor: PlanNote[];
  playAround: PlanNote[];
}

export interface Weakness {
  id: string;
  /** What goes wrong, in the deck's terms. */
  threat: string;
  /** What you do about it at the table. Empty means nobody has decided yet. */
  playAround: string;
  voice: Voice;
}

export interface GamePlan {
  schema: "forge.gameplan/1";
  winPlan: PlanNote[];
  mulligan: PlanNote[];
  /** Your preference order. The first is the default pick when no matchup names one. */
  battlefields: BattlefieldPick[];
  matchups: MatchupPlan[];
  weaknesses: Weakness[];
}

export const emptyGamePlan = (): GamePlan => ({
  schema: "forge.gameplan/1",
  winPlan: [],
  mulligan: [],
  battlefields: [],
  matchups: [],
  weaknesses: [],
});

// ── shape ────────────────────────────────────────────────────────────────────

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === "string";
/** Bounds a runaway client. A game plan is prose, not a novel. */
const MAX_TEXT = 2000;

/**
 * What makes a stored plan **readable** — nothing more.
 *
 * ⚠️ **Shape only, deliberately.** Whether a swap still fits the deck is `checkGamePlan`'s
 * question, and it must not be asked here: the deck changes after the plan is written, and
 * refusing to *save* a plan because last week's swap names a card you have since cut would
 * make the page uneditable at exactly the moment it most needs editing. Stale is shown, never
 * rejected.
 */
export function validateGamePlan(x: unknown): string[] {
  const problems: string[] = [];
  if (!isObj(x)) return ["A game plan must be an object."];
  if (x.schema !== "forge.gameplan/1") problems.push('schema must be "forge.gameplan/1".');

  const text = (v: unknown, where: string) => {
    if (!isStr(v)) problems.push(`${where} must be text.`);
    else if (v.length > MAX_TEXT) problems.push(`${where} is over ${MAX_TEXT} characters.`);
  };
  const notes = (v: unknown, where: string) => {
    if (!Array.isArray(v)) return problems.push(`${where} must be a list.`);
    v.forEach((n, i) => {
      if (!isObj(n)) return problems.push(`${where}[${i}] must be an object.`);
      text(n.text, `${where}[${i}].text`);
      if (!VOICES.includes(n.voice as Voice)) {
        problems.push(`${where}[${i}].voice must be one of ${VOICES.join(", ")}.`);
      }
    });
  };
  const pick = (v: unknown, where: string) => {
    if (!isObj(v)) return problems.push(`${where} must be an object.`);
    if (!isStr(v.cardId) || !v.cardId) problems.push(`${where}.cardId is required.`);
    text(v.why, `${where}.why`);
    if (v.voice !== undefined && !VOICES.includes(v.voice as Voice)) {
      problems.push(`${where}.voice is not a voice.`);
    }
  };
  const swaps = (v: unknown, where: string) => {
    if (!Array.isArray(v)) return problems.push(`${where} must be a list.`);
    v.forEach((s, i) => {
      if (!isObj(s) || !isStr(s.cardId) || !s.cardId) {
        return problems.push(`${where}[${i}] needs a cardId.`);
      }
      if (!Number.isInteger(s.quantity) || (s.quantity as number) < 1 || (s.quantity as number) > 3) {
        problems.push(`${where}[${i}].quantity must be 1-3.`);
      }
    });
  };
  const ids = new Set<string>();
  const uniqueId = (v: unknown, where: string) => {
    if (!isStr(v) || !v) return problems.push(`${where}.id is required.`);
    if (ids.has(v)) problems.push(`${where}.id "${v}" is used twice.`);
    ids.add(v);
  };

  notes(x.winPlan, "winPlan");
  notes(x.mulligan, "mulligan");
  if (!Array.isArray(x.battlefields)) problems.push("battlefields must be a list.");
  else x.battlefields.forEach((b, i) => pick(b, `battlefields[${i}]`));

  if (!Array.isArray(x.matchups)) problems.push("matchups must be a list.");
  else
    x.matchups.forEach((m, i) => {
      const where = `matchups[${i}]`;
      if (!isObj(m)) return problems.push(`${where} must be an object.`);
      uniqueId(m.id, where);
      const legend = isStr(m.legendCardId) && m.legendCardId !== "";
      const archetype = isStr(m.archetype) && m.archetype.trim() !== "";
      // A matchup against nobody is a note with nowhere to be read from.
      if (!legend && !archetype) problems.push(`${where} needs a legendCardId or an archetype.`);
      if (m.battlefield != null) pick(m.battlefield, `${where}.battlefield`);
      swaps(m.bringIn, `${where}.bringIn`);
      swaps(m.takeOut, `${where}.takeOut`);
      notes(m.watchFor, `${where}.watchFor`);
      notes(m.playAround, `${where}.playAround`);
    });

  if (!Array.isArray(x.weaknesses)) problems.push("weaknesses must be a list.");
  else
    x.weaknesses.forEach((w, i) => {
      const where = `weaknesses[${i}]`;
      if (!isObj(w)) return problems.push(`${where} must be an object.`);
      uniqueId(w.id, where);
      text(w.threat, `${where}.threat`);
      text(w.playAround, `${where}.playAround`);
      if (!VOICES.includes(w.voice as Voice)) problems.push(`${where}.voice is not a voice.`);
    });

  return problems;
}

// ── against the deck as it is now ────────────────────────────────────────────

export interface PlanIssue {
  /** The matchup it concerns, or `null` for the general section. */
  matchupId: string | null;
  message: string;
}

/**
 * Does the plan still describe **this** forty?
 *
 * Everything here is a fact about the list, never an opinion about the swap. It exists because
 * a sideboard guide rots silently: cut a card from the sideboard and every matchup that
 * brought it in now describes a swap you cannot make, and you find out mid-tournament.
 *
 * ⚠️ Counted by **name**, because the deck holds printing ids and a plan written against one
 * printing must still recognise the alt-art copy in your sleeves.
 */
export function checkGamePlan(plan: GamePlan, deck: Deck, index: CardIndex): PlanIssue[] {
  const name = (id: string) => index.nameOf(id) ?? id;
  const inZone = (zone: "MAIN" | "SIDEBOARD") => {
    const out = new Map<string, number>();
    for (const s of deck.slots) {
      if (s.zone !== zone) continue;
      out.set(name(s.cardId), (out.get(name(s.cardId)) ?? 0) + s.quantity);
    }
    // The Chosen Champion is a Main Deck card (L3) and may be sided out (TR 601.1.c.4).
    if (zone === "MAIN" && deck.chosenChampionCardId) {
      const n = name(deck.chosenChampionCardId);
      out.set(n, (out.get(n) ?? 0) + 1);
    }
    return out;
  };
  const main = inZone("MAIN");
  const side = inZone("SIDEBOARD");
  const fields = new Set(
    deck.slots.filter((s) => s.zone === "BATTLEFIELD").map((s) => name(s.cardId)),
  );

  const issues: PlanIssue[] = [];
  for (const b of plan.battlefields) {
    if (!fields.has(name(b.cardId))) {
      issues.push({ matchupId: null, message: `${name(b.cardId)} is not one of this deck's battlefields.` });
    }
  }

  for (const m of plan.matchups) {
    const say = (message: string) => issues.push({ matchupId: m.id, message });
    if (m.battlefield && !fields.has(name(m.battlefield.cardId))) {
      say(`${name(m.battlefield.cardId)} is not one of this deck's battlefields.`);
    }
    const total = (list: Swap[]) => list.reduce((a, s) => a + s.quantity, 0);
    const want = (list: Swap[]) => {
      const out = new Map<string, number>();
      for (const s of list) out.set(name(s.cardId), (out.get(name(s.cardId)) ?? 0) + s.quantity);
      return out;
    };
    for (const [card, n] of want(m.bringIn)) {
      const have = side.get(card) ?? 0;
      if (have < n) say(`Brings in ${n} ${card}, and the sideboard has ${have}.`);
    }
    for (const [card, n] of want(m.takeOut)) {
      const have = main.get(card) ?? 0;
      if (have < n) say(`Takes out ${n} ${card}, and the Main Deck has ${have}.`);
    }
    // TR 403.4 — the Main Deck stays at exactly 40, so every exchange is one for one.
    if (total(m.bringIn) !== total(m.takeOut)) {
      say(`${total(m.bringIn)} in and ${total(m.takeOut)} out — a swap must be one for one.`);
    }
  }
  return issues;
}

// ── against the record ──────────────────────────────────────────────────────

export interface PlanRecord {
  /** Heads-up standing per matchup id — only for matchups keyed by a Legend. */
  byMatchup: Map<string, Standing>;
  /**
   * Legends you have **played against with this deck** and have no plan for, most-played
   * first. This is the link the log never had (`G7`): the record now says where the plan is
   * missing, instead of a human carrying it across.
   */
  unplanned: Array<{ legendCardId: string; standing: Standing }>;
}

/**
 * The games behind each matchup.
 *
 * ⚠️ `1v1` only, through `read()`, so the thresholds are the log's own: a matchup with three
 * games shows three games and **no rate**. A plan page is exactly where a 2-0 would otherwise
 * be read as "solved".
 */
export function planRecord(
  plan: GamePlan,
  matches: readonly MatchRecord[],
  nameOf: (cardId: string) => string | undefined,
): PlanRecord {
  const reading = read(matches, nameOf, "1v1");
  // By name: a Legend has alternate printings, and the log and the plan may name different ones.
  const key = (id: string) => nameOf(id) ?? id;
  const standings = new Map<string, Standing>();
  for (const m of reading.matchups) if (m.legendCardId) standings.set(key(m.legendCardId), m.standing);

  const byMatchup = new Map<string, Standing>();
  const planned = new Set<string>();
  for (const m of plan.matchups) {
    if (!m.legendCardId) continue;
    planned.add(key(m.legendCardId));
    const s = standings.get(key(m.legendCardId));
    if (s) byMatchup.set(m.id, s);
  }
  const unplanned = reading.matchups
    .filter(
      (m): m is typeof m & { legendCardId: string } =>
        !!m.legendCardId && !planned.has(key(m.legendCardId)),
    )
    .map((m) => ({ legendCardId: m.legendCardId, standing: m.standing }));
  return { byMatchup, unplanned };
}
