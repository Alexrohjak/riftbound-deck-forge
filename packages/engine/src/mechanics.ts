/**
 * **What a card's printed text says, as data the engine can act on.**
 *
 * ⚠️ **This module exists because 185 of 921 cards (20%) carried a mechanic nothing in Forge
 * could see.** `scripts/audit-knowledge.mjs` could *detect* every one of them and, by design,
 * only reported. So the audit knew about `Cruel Patron`'s additional cost and the engine did
 * not — and three copies shipped in a deck whose plan was holding battlefields with bodies.
 *
 * The briefing's answer was the instruction *"read the card, do not build from the tag."*
 * [D-064](../../../docs/DECISIONS.md#d-064) already settled what an instruction is worth:
 *
 * > *"This section already told you to run `review`. A deck of nineteen two-drops shipped
 * > anyway, with every gate green — because an instruction is not a mechanism."*
 *
 * ## This derives; it does not author
 *
 * [D-034](../../../docs/DECISIONS.md#d-034) — card data is Riot's and we never write it. Every
 * flag here is a **regex over the printed text Riot published**, in the same spirit as the
 * keyword extraction that already built `cards.json`. Nothing is hand-assigned to a card, so
 * nothing can drift from the printing, and a reprint changes the flag by changing the text.
 *
 * ## Every hit carries the clause that produced it
 *
 * A regex over prose over-matches sooner or later. `MechanicHit.clause` quotes the matched
 * sentence, so a false positive costs one glance rather than one wrong deck — and a caller
 * that shows the clause can never be accused of asserting a mechanic the card does not have.
 *
 * ⚠️ **This is the single source of truth.** The audit script imports `MECHANICS` from here
 * rather than keeping its own copy: two copies of a mapping is exactly the drift
 * [D-047](../../../docs/DECISIONS.md#d-047) exists to prevent, and it had already happened
 * once in this seam (`cardFactsFrom`).
 */

/**
 * What *kind* of thing the mechanic is, which is what decides whether a caller should care.
 *
 * The distinction is not cosmetic: a `cost` is something the card takes from you whether you
 * planned for it or not, while a `threshold` is something the card needs from the deck. They
 * fail in opposite directions and read as different sentences.
 */
export type MechanicKind =
  /** The card charges something beyond its printed cost — a body, a card, an extra rune. */
  | "cost"
  /** The card needs the deck to reach something before it functions at all. */
  | "threshold"
  /** The card can do something the deck may be built around. */
  | "capability"
  /** A combat or resource keyword already visible elsewhere in the engine. */
  | "keyword";

export interface MechanicRule {
  readonly id: string;
  readonly pattern: RegExp;
  readonly kind: MechanicKind;
  /**
   * What in Forge *acts* on this, or `null` if nothing does.
   *
   * ⚠️ **This is the honest half of the table.** A mechanic merely *mentioned* in a document
   * is not modelled, and saying otherwise would make the audit congratulate us for prose.
   */
  readonly modelled: string | null;
  /** Why a deck goes wrong when nothing sees it. Printed by the audit. */
  readonly why: string;
}

/**
 * The mechanics a card's printed text can carry.
 *
 * ⚠️ **Order is not priority.** Callers that need to rank findings do it by severity in
 * context — an additional cost on a body in a hold deck outranks `[Predict]` on anything, and
 * that judgement belongs where the deck is known, not here.
 */
export const MECHANICS: readonly MechanicRule[] = [
  // ── things a deck is built around, where a gap changes what gets built ──
  {
    id: "empower",
    pattern: /\[Empower\]/i,
    kind: "keyword",
    modelled: "empowered / becomes_mighty in SUPPORTS",
    why: "The empower engine's payoff half",
  },
  {
    id: "empower-once-only",
    pattern: /use only if not \[?Empowered/i,
    kind: "cost",
    modelled: "advice/mechanics findings — charge accounting on an empower plan",
    why: "Every Empower is one charge per body. An empower engine needs far more sources than a card count suggests — this drove a whole rebuild and nothing in the data says it",
  },
  {
    id: "level-threshold",
    pattern: /\[Level \d+\]/i,
    kind: "threshold",
    modelled: "advice/mechanics findings — thresholds against the deck's XP sources",
    why: "Payoffs switch on at 3, 6 and 11 XP. A deck can be built to cross a threshold, and Forge cannot see the threshold",
  },
  {
    id: "xp-gain",
    pattern: /gain \d+ XP|\[Hunt/i,
    kind: "capability",
    modelled: "counted in the `scoring` package",
    why: "The source half of the XP economy",
  },
  {
    id: "xp-spend",
    pattern: /spend \d+ XP/i,
    kind: "threshold",
    modelled: "advice/mechanics findings — sinks against sources",
    why: "The sink half of the XP economy. Sources without sinks is a dangling synergy nobody can detect",
  },
  {
    id: "additional-cost",
    pattern: /as an additional cost/i,
    kind: "cost",
    modelled: "advice/mechanics findings — quoted on every deck that runs one",
    why: "Cruel Patron reads 'kill a friendly unit' to play it. Three copies shipped in a deck whose plan was holding battlefields with bodies",
  },
  {
    id: "buff",
    pattern: /\[Buff\]|spend my buff|spend a buff/i,
    kind: "keyword",
    modelled: "buff_spend in SUPPORTS",
    why: "A counter economy with its own sinks",
  },
  {
    id: "scores-a-point",
    pattern: /score \d+ point|win the game/i,
    kind: "capability",
    modelled: "counted in the `scoring` package",
    why: "The only thing that actually ends a game",
  },

  // ── combat keywords, where a gap changes what a deck can answer ──
  {
    id: "deflect",
    pattern: /\[Deflect/i,
    kind: "keyword",
    modelled: "hasKeyword, and a pattern in advice/patterns",
    why: "Protection, which decides whether removal connects",
  },
  {
    id: "shield",
    pattern: /\[Shield/i,
    kind: "keyword",
    modelled: "capabilities().defenders, and a hold-plan check in advice/plan",
    why: "Defending Might, which is how a battlefield is held",
  },
  {
    id: "ganking",
    pattern: /\[Ganking\]/i,
    kind: "capability",
    modelled: "advice/mechanics findings — counted on hold plans",
    why: "Free movement between battlefields, which is how a hold plan repositions",
  },
  {
    id: "assault",
    pattern: /\[Assault/i,
    kind: "keyword",
    modelled: "hasKeyword",
    why: "Attacking Might, which is how a battlefield is taken",
  },
  {
    id: "tank",
    pattern: /\[Tank\]/i,
    kind: "keyword",
    modelled: "capabilities().defenders, and a hold-plan check in advice/plan",
    why: "Forces damage through it first",
  },
  {
    id: "hidden",
    pattern: /\[Hidden\]/i,
    kind: "keyword",
    modelled: "hidden in SUPPORTS",
    why: "Arrives without warning, ignoring base cost",
  },
  {
    id: "temporary",
    pattern: /\[Temporary\]/i,
    kind: "keyword",
    modelled: "temporary in SUPPORTS",
    why: "Leaves at end of turn — a body that cannot hold",
  },
  {
    id: "accelerate",
    pattern: /\[Accelerate\]/i,
    kind: "cost",
    modelled: "advice/mechanics findings — quoted as an optional extra cost",
    why: "Enters ready for an extra cost — the same verb the Ambessa deck was built on",
  },

  // ── resources ──
  {
    id: "flow",
    pattern: /\[Flow\]/i,
    kind: "keyword",
    modelled: "flow in SUPPORTS",
    why: "Plays from the trash",
  },
  {
    id: "repeat",
    pattern: /\[Repeat\]/i,
    kind: "cost",
    modelled: "advice/mechanics findings — quoted as a repeatable extra cost",
    why: "Pay again to repeat a spell. A cost reducer changes which repeats are affordable",
  },
  {
    id: "predict",
    pattern: /\[Predict\]/i,
    kind: "capability",
    modelled: "advice/mechanics findings — flagged against the opening-hand simulation",
    why: "Deck manipulation, invisible to the opening-hand simulation",
  },
  {
    id: "recycle",
    pattern: /recycle/i,
    kind: "keyword",
    modelled: "recycle in SUPPORTS",
    why: "Turns an exhausted rune back into Power",
  },
  {
    id: "deathknell",
    pattern: /\[Deathknell\]/i,
    kind: "capability",
    modelled: "advice/mechanics findings — counted as a death payoff",
    why: "A payoff for your own unit dying — the enabler half of several archetypes",
  },
  {
    id: "equip",
    pattern: /\[Equip\]/i,
    kind: "keyword",
    modelled: "gear_matters in SUPPORTS",
    why: "Gear attaches and stays",
  },
];

const BY_ID: ReadonlyMap<string, MechanicRule> = new Map(MECHANICS.map((m) => [m.id, m]));

/** The rule behind an id, for a caller that has a hit and wants its prose. */
export const mechanicRule = (id: string): MechanicRule | undefined => BY_ID.get(id);

export interface MechanicHit {
  readonly id: string;
  readonly kind: MechanicKind;
  /**
   * The clause of printed text that matched.
   *
   * ⚠️ **Always show this when reporting a hit.** It is what makes a false positive cost one
   * glance instead of one wrong deck, and it is the difference between quoting the card and
   * asserting a property of it.
   */
  readonly clause: string;
}

/** How far either side of a match we look for a sentence boundary. */
const CLAUSE_WINDOW = 160;

/**
 * The sentence containing `index`, trimmed to something quotable.
 *
 * Riftbound's printed text puts reminder text in parentheses and separates abilities with
 * full stops, so both are treated as boundaries. The window is capped because a card with no
 * punctuation at all should still yield a clause rather than its entire body.
 */
function clauseAround(text: string, index: number, length: number): string {
  const from = Math.max(0, index - CLAUSE_WINDOW);
  const to = Math.min(text.length, index + length + CLAUSE_WINDOW);

  let start = from;
  for (let i = index - 1; i >= from; i--) {
    const ch = text[i];
    if (ch === "." || ch === "(" || ch === ")" || ch === "\n") {
      start = i + 1;
      break;
    }
  }

  let end = to;
  for (let i = index + length; i < to; i++) {
    const ch = text[i];
    if (ch === "." || ch === "(" || ch === ")" || ch === "\n") {
      end = ch === "." ? i + 1 : i;
      break;
    }
  }

  return text.slice(start, end).trim();
}

/**
 * Every mechanic printed on this card, each with the clause that produced it.
 *
 * Returns `[]` for a card with no text, which is correct and not the same as *"we did not
 * look"* — a caller that needs to tell those apart should check the text itself.
 */
export function mechanicsOf(text: string | undefined): MechanicHit[] {
  if (!text || !text.trim()) return [];
  const hits: MechanicHit[] = [];
  for (const rule of MECHANICS) {
    // The table's patterns are unanchored and global-free on purpose: we want the first
    // match's position, and a `/g` regex would carry `lastIndex` between cards.
    const match = rule.pattern.exec(text);
    if (!match) continue;
    hits.push({
      id: rule.id,
      kind: rule.kind,
      clause: clauseAround(text, match.index, match[0].length),
    });
  }
  return hits;
}

/** Does this card print this mechanic? */
export const hasMechanic = (text: string | undefined, id: string): boolean => {
  const rule = BY_ID.get(id);
  return rule !== undefined && !!text && rule.pattern.test(text);
};

/**
 * The `[Level N]` thresholds printed on a card.
 *
 * ⚠️ **A card can print more than one**, and the deck has to clear the *highest* one for the
 * card to be fully switched on — but clearing a lower one already buys something, so both are
 * returned rather than reduced to a maximum here.
 */
export function levelThresholds(text: string | undefined): number[] {
  if (!text) return [];
  const found: number[] = [];
  for (const match of text.matchAll(/\[Level (\d+)\]/gi)) {
    const raw = match[1];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) found.push(n);
  }
  return found;
}

/** XP this card's text explicitly grants. `[Hunt]` is *not* here — it is conditional. */
export function xpGranted(text: string | undefined): number {
  if (!text) return 0;
  let total = 0;
  for (const match of text.matchAll(/gain (\d+) XP/gi)) {
    const raw = match[1];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

/** XP this card's text spends. The sink half — see `xp-spend`. */
export function xpSpent(text: string | undefined): number {
  if (!text) return 0;
  let total = 0;
  for (const match of text.matchAll(/spend (\d+) XP/gi)) {
    const raw = match[1];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}
