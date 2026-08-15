/**
 * **Q-CARD — *"what is this card good at? Bad at? When do I play it?"*** ([`EVALUATION §6.1`](../../../../docs/spec/EVALUATION.md))
 *
 * ⚠️ **This is the tool that would have caught `Cruel Patron`.**
 *
 * [`EE-BRIEFING §3`](../../../../docs/EE-BRIEFING.md) carries the rule twice — *"read the card,
 * do not build from the tag"*, and *"before a card goes in, you must be able to say what it
 * does in a sentence that is not its tag"* — and there was no tool that returned a card's
 * printed text. The mouth was told to read the card and given no way to read it, so it read
 * the tag, and three copies of a unit that **kills a friendly unit to play** shipped in a deck
 * whose plan was holding battlefields with bodies.
 *
 * So the first field of this result is `text`, and everything else is arranged around it.
 *
 * ## What is computed, and what is not
 *
 * ✅ **Combat profile in both orientations** — role-conditional Might is arithmetic, not
 * adjudication: `[Assault]` applies only attacking, `[Shield]` only defending (CR 807, 814).
 * A card that is 5 attacking and 3 defending wants to be the one initiating, and that is
 * derivable without resolving a single fight.
 *
 * ✅ **Cost efficiency against the format**, as the median Might at that energy — the spec's
 * *"cost efficiency vs format median at that cost"*.
 *
 * ❌ **Not what it beats in a fight.** That needs `S1a`. This never claims an outcome, only
 * the statistics either side of one.
 */
import type { CardFacts, CardIndex } from "../types.js";
import type { PoolCard } from "./feedback.js";
import { mechanicsOf, type MechanicHit } from "../mechanics.js";
import { mechanicRule } from "../mechanics.js";
import { patternsOf, PATTERNS, type StrategicPattern } from "./patterns.js";

export interface CombatProfile {
  /** Printed Might. `null` on anything that is not a unit. */
  might: number | null;
  /** Might while attacking — printed plus `[Assault N]` (CR 807). */
  attacking: number | null;
  /** Might while defending — printed plus `[Shield N]` (CR 814). */
  defending: number | null;
  /**
   * ⚠️ Which orientation this card is *built* for, when the two differ.
   *
   * Derived from the gap alone, and stated as an orientation rather than as a verdict: a
   * proactive card in a holding deck is a mistake, but only the plan knows that.
   */
  orientation: "proactive" | "defensive" | "symmetric" | null;
}

export interface CardCounsel {
  cardId: string;
  name: string;
  /** ⚠️ **First, and the point of the tool.** The card's own words, verbatim. */
  text: string;
  types: readonly string[];
  domains: readonly string[];
  energy: number | null;
  power: number | null;
  /** Derived classification — `body`, `combat-trick`, `removal-kill`… Useful, and not a substitute for `text`. */
  role?: string;
  timing?: string;
  produces: readonly string[];
  consumes: readonly string[];
  combat: CombatProfile;
  /**
   * ⚠️ **What this card charges you, needs from you, or lets you do** — each quoting the
   * printed clause that produced it. This is where an additional cost surfaces.
   */
  mechanics: Array<{ id: string; kind: string; clause: string; why: string }>;
  /** The strategic patterns it belongs to, in EE's vocabulary. */
  patterns: Array<{ pattern: StrategicPattern; label: string }>;
  /**
   * Median Might among units at this energy across the unbanned pool, and this card's gap
   * from it. `null` when the card is not a unit or the pool was not supplied.
   */
  formatMedianMight: number | null;
  /** Copies in the boxes. Zero is information, not a disqualification. */
  owned: number;
  /**
   * ⚠️ **Always non-empty.** What this read cannot tell you, so a caller cannot mistake a
   * statistics sheet for an evaluation.
   */
  unmodelled: string[];
}

/** `[Assault 2]` → 2. A bare `[Assault]` with no number reads as 0 rather than as absent. */
function keywordValue(text: string | undefined, keyword: string): number {
  if (!text) return 0;
  const match = new RegExp(`\\[${keyword}\\s*(\\d+)?\\]`, "i").exec(text);
  if (!match) return 0;
  const raw = match[1];
  if (raw === undefined) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

const isUnit = (facts: CardFacts): boolean => (facts.types ?? []).includes("unit");

const isMainDeckCard = (facts: CardFacts): boolean =>
  !(facts.types ?? []).some((t) => ["legend", "rune", "battlefield", "token"].includes(t));

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * Read one card.
 *
 * Returns `null` for a printing the index does not know — which is a different answer from
 * *"a card nobody owns"*, and the caller must not blur them.
 */
export function cardCounsel(
  cardId: string,
  cards: CardIndex,
  pool: readonly PoolCard[] = [],
  collection: Readonly<Record<string, number>> = {},
): CardCounsel | null {
  const facts = cards.factsOf?.(cardId);
  if (!facts) return null;

  const text = facts.text ?? "";
  const might = typeof facts.might === "number" ? facts.might : null;
  const assault = keywordValue(text, "Assault");
  const shield = keywordValue(text, "Shield");

  const attacking = might === null ? null : might + assault;
  const defending = might === null ? null : might + shield;
  let orientation: CombatProfile["orientation"] = null;
  if (attacking !== null && defending !== null) {
    orientation = attacking > defending ? "proactive" : defending > attacking ? "defensive" : "symmetric";
  }

  const hits: MechanicHit[] = mechanicsOf(text);
  const mechanics = hits.map((h) => ({
    id: h.id,
    kind: h.kind,
    clause: h.clause,
    why: mechanicRule(h.id)?.why ?? "",
  }));

  const patterns = patternsOf(facts).map((p) => ({
    pattern: p,
    label: PATTERNS.find((s) => s.pattern === p)?.label ?? p,
  }));

  // Cost efficiency: the median Might among units at this exact energy, across the unbanned
  // pool. Median rather than mean — one Baron Nashor should not move the yardstick.
  let formatMedianMight: number | null = null;
  if (pool.length > 0 && isUnit(facts) && typeof facts.energy === "number") {
    const peers = pool
      .filter(
        ({ facts: f }) =>
          isMainDeckCard(f) &&
          f.banned !== true &&
          isUnit(f) &&
          f.energy === facts.energy &&
          typeof f.might === "number",
      )
      .map(({ facts: f }) => f.might as number);
    formatMedianMight = median(peers);
  }

  return {
    cardId,
    name: facts.name,
    text,
    types: facts.types ?? [],
    domains: facts.domains ?? [],
    energy: facts.energy ?? null,
    power: facts.power ?? null,
    ...(facts.role !== undefined ? { role: facts.role } : {}),
    ...(facts.timing !== undefined ? { timing: facts.timing } : {}),
    produces: facts.produces ?? [],
    consumes: facts.consumes ?? [],
    combat: { might, attacking, defending, orientation },
    mechanics,
    patterns,
    formatMedianMight,
    owned: collection[cardId] ?? 0,
    unmodelled: [
      "⚠️ What this card beats in a fight — no rules core (S1a), so no combat is resolved. The Might figures above are printed statistics either side of a fight, not its outcome.",
      "⚠️ Whether an ability's condition is met — activation conditions are printed in `text` and read by you, not evaluated here.",
      "⚠️ Interactions with specific cards — the synergy graph is tag-level. `around --card` walks it; docs/reference/CARD-KNOWLEDGE.md is where the real interactions are written down.",
    ],
  };
}
