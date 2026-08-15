/**
 * **Q-SIDEBOARD — *"what do I swap, against what, and for what?"*** ([`EVALUATION §6.6`](../../../../docs/spec/EVALUATION.md))
 *
 * ⚠️ **The briefing has mandated a sideboard on every deck EE proposes since D-064, and
 * nothing computed one.** [`EE-BRIEFING §3`](../../../../docs/EE-BRIEFING.md) says every
 * proposal *"carries a sideboard of ten"*, defined against the deck's named win condition,
 * split into **insurance** and **flexibility** — and then leaves the mouth to freehand it
 * against a card pool it is forbidden to count from memory. That is the exact shape of gap
 * that produced `Cruel Patron`: a rule with no mechanism under it.
 *
 * ## The constraints are the feature
 *
 * A sideboard is the most rule-bound object in the game, and every one of these binds:
 *
 * | Rule | What it forbids |
 * |---|---|
 * | **TR 601.1.c.1** | More than ten cards. The cap is exact, not a maximum to aim under |
 * | **TR 403.4** | Anything but a 1-for-1 exchange — the Main Deck stays at exactly 40 |
 * | **TR 403.4.b** | Changing runes, the Legend, or Battlefields after registration, ever |
 * | **TR 601.1.c.4** | *(permits)* swapping the Chosen Champion, which is the one exception |
 * | **L16 / TR 601.1.c.3** | Copies counted per zone — the limit spans Main Deck **and** board |
 *
 * ⚠️ **L16 is the one that catches people**, and the briefing already warns about it: two in
 * the board plus two in the deck is four, and illegal. `headroom` below is that arithmetic
 * done in advance, so a suggestion can never be one the gate will reject.
 *
 * ## What it will not do
 *
 * ⚠️ **No meta read.** *"A solid counter exists"* is grounded in what the opposing **identity
 * can field**, never in what anyone is likely to bring
 * ([D-035](../../../../docs/DECISIONS.md#d-035)). That weakens the claim and the weakness is
 * stated rather than papered over.
 *
 * ⚠️ **Ownership is a warning, never a veto.** *"Go and get this one"* is a real answer, so
 * unowned cards are returned with `owned: 0` rather than filtered out — but the count is always
 * shown, so nobody sleeves a deck they cannot build.
 */
import type { CardFacts, CardIndex, Deck, Domain } from "../types.js";
import { countedEntries } from "../legality/entries.js";
import { MAX_COPIES_PER_NAME } from "../legality/copies.js";
import type { PoolCard } from "./feedback.js";
import { ANSWERS } from "./counsel.js";
import { patternsOf, PATTERNS, type StrategicPattern } from "./patterns.js";

/** TR 601.1.c.1 — the cap is exactly ten. */
export const SIDEBOARD_SIZE = 10;

export interface SideboardCandidate {
  cardId: string;
  name: string;
  /** Copies in the boxes. Zero means *go and get it*, not *cannot suggest it*. */
  owned: number;
  energy: number | null;
  /** Copies already registered in the Main Deck — the other half of the L16 sum. */
  inMain: number;
  /**
   * How many more may legally go in the board.
   *
   * ⚠️ **`MAX_COPIES_PER_NAME` minus what is already in the Main Deck** (L16). A candidate with
   * `headroom: 0` is returned rather than hidden, because *"you already run the maximum"* is
   * a useful answer and silently dropping it looks like the card does not exist.
   */
  headroom: number;
  patterns: StrategicPattern[];
}

export interface SideboardLine {
  /** The threat this answers, in the pattern vocabulary. */
  threat: StrategicPattern;
  threatLabel: string;
  /** How many cards in *their* identity carry it — reachability, not likelihood. */
  theirCards: number;
  /** Why this pattern answers that one. Doctrine, and contested — see ANSWERS. */
  because: string;
  answersWith: StrategicPattern;
  answerLabel: string;
  candidates: SideboardCandidate[];
}

export interface SideboardCut {
  cardId: string;
  name: string;
  copies: number;
  /** Why it is least useful *in this matchup* — never a claim that the card is bad. */
  because: string;
}

export interface SideboardCounsel {
  against: { cardId: string; name: string; domains: readonly Domain[] };
  /** The Main Deck's own win condition, when the caller knows it. Shapes nothing; reported so the answer can be read against it. */
  winCondition?: string;
  constraints: {
    sideboardSize: number;
    mainDeckSize: number;
    /** TR 403.4 — swaps are 1-for-1, so this is what may move, not what may be added. */
    exchangesAre: string;
    locked: string[];
    swappable: string[];
  };
  /** ⚠️ Ordered by their reachability — how much of that identity can actually field the threat. */
  bring: SideboardLine[];
  /**
   * ⚠️ **What comes out, and only for this matchup.** Empty is common and correct: a deck with
   * no damage-based removal has nothing that this analysis can call dead.
   */
  cut: SideboardCut[];
  /** ⚠️ Always non-empty. What this counsel is not allowed to know. */
  caveats: string[];
}

const isMainDeckCard = (facts: CardFacts): boolean =>
  !(facts.types ?? []).some((t) => ["legend", "rune", "battlefield", "token"].includes(t));

const insideIdentity = (facts: CardFacts, identity: readonly Domain[]): boolean =>
  (facts.domains ?? []).every((d) => d === "colorless" || identity.includes(d));

const isUnit = (facts: CardFacts): boolean => (facts.types ?? []).includes("unit");

/** The largest printed "deal N damage" on a card. Understating is the safe direction. */
function damagePrinted(text: string | undefined): number {
  if (!text) return 0;
  let most = 0;
  for (const match of text.matchAll(/deal (\d+) damage/gi)) {
    const raw = match[1];
    if (raw === undefined) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > most) most = n;
  }
  return most;
}

/** The median of a list of numbers. Median rather than mean: one Baron Nashor is not a board. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Candidates returned per threat line. A sideboard is ten cards; twenty suggestions is a search result. */
const DEPTH = 4;

const labelOf = (p: StrategicPattern): string => PATTERNS.find((s) => s.pattern === p)?.label ?? p;

/**
 * What to bring in against a named Legend, and what to take out for it.
 *
 * Returns `null` when either Legend is unknown to the index — a sideboard built against a
 * Legend we cannot identify would be advice about nothing.
 */
export function sideboardCounsel(
  deck: Deck,
  cards: CardIndex,
  pool: readonly PoolCard[],
  againstLegendCardId: string,
  collection: Readonly<Record<string, number>> = {},
  winCondition?: string,
): SideboardCounsel | null {
  const theirLegend = cards.factsOf?.(againstLegendCardId);
  const myLegend = cards.factsOf?.(deck.legendCardId);
  if (!theirLegend || !myLegend) return null;

  const theirIdentity = (theirLegend.domains ?? []) as readonly Domain[];
  const myIdentity = (myLegend.domains ?? []) as readonly Domain[];

  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");
  const mainSize = main.reduce((n, e) => n + e.quantity, 0);
  const inMainByName = new Map<string, number>();
  for (const e of main) inMainByName.set(e.name, (inMainByName.get(e.name) ?? 0) + e.quantity);

  // ── what their identity can field ───────────────────────────────────────────
  const theirs = pool.filter(
    ({ facts }) => isMainDeckCard(facts) && facts.banned !== true && insideIdentity(facts, theirIdentity),
  );
  const theirPatternCounts = new Map<StrategicPattern, Set<string>>();
  for (const { facts } of theirs) {
    for (const pattern of patternsOf(facts)) {
      theirPatternCounts.set(pattern, (theirPatternCounts.get(pattern) ?? new Set<string>()).add(facts.name));
    }
  }

  /**
   * ⚠️ **Mine is filtered to what I can actually register**, and this is not optional here the
   * way it is on `counter`. A sideboard is registered under a Legend already chosen, so a
   * suggestion outside my Domain Identity is not a weaker answer — it is an illegal one.
   */
  const registerable = pool.filter(
    ({ facts }) => isMainDeckCard(facts) && facts.banned !== true && insideIdentity(facts, myIdentity),
  );

  const ownedOf = (cardId: string): number => collection[cardId] ?? 0;

  const bring: SideboardLine[] = [];
  for (const row of ANSWERS) {
    const theirCards = theirPatternCounts.get(row.threat)?.size ?? 0;
    if (theirCards === 0) continue;
    for (const answer of row.answers) {
      const candidates = registerable
        .filter(({ facts }) => patternsOf(facts).includes(answer))
        .map(({ cardId, facts }): SideboardCandidate => {
          const inMain = inMainByName.get(facts.name) ?? 0;
          return {
            cardId,
            name: facts.name,
            owned: ownedOf(cardId),
            energy: facts.energy ?? null,
            inMain,
            headroom: Math.max(0, MAX_COPIES_PER_NAME - inMain),
            patterns: patternsOf(facts),
          };
        })
        // Owned first — a card you can sleeve tonight beats one you would have to find — then
        // cheap first, because the cheap answer is the one you can hold up alongside a play.
        .sort((a, b) => b.owned - a.owned || (a.energy ?? 99) - (b.energy ?? 99) || a.name.localeCompare(b.name))
        .slice(0, DEPTH);
      if (candidates.length === 0) continue;
      bring.push({
        threat: row.threat,
        threatLabel: labelOf(row.threat),
        theirCards,
        because: row.because,
        answersWith: answer,
        answerLabel: labelOf(answer),
        candidates,
      });
    }
  }
  // Most-reachable threat first: what their identity can field a lot of is what to prepare for.
  bring.sort((a, b) => b.theirCards - a.theirCards || a.threatLabel.localeCompare(b.threatLabel));

  // ── what comes out, for this matchup only ───────────────────────────────────
  //
  // The spec's own worked example: *"Cut 2× Flurry of Blades — their board is Might 4+, so 1
  // damage to all does nothing."* Their median unit Might is the yardstick, and it is counted
  // from their identity's actual pool rather than assumed.
  const theirMights = theirs.filter(({ facts }) => isUnit(facts) && typeof facts.might === "number")
    .map(({ facts }) => facts.might as number);
  const theirMedian = median(theirMights);
  const cut: SideboardCut[] = [];
  for (const e of main) {
    const damage = damagePrinted(e.facts?.text);
    if (damage === 0 || theirMedian === 0) continue;
    if (damage >= theirMedian) continue;
    cut.push({
      cardId: e.cardId,
      name: e.name,
      copies: e.quantity,
      because:
        `Deals ${damage}, and the median unit in ${theirLegend.name}'s identity has Might ` +
        `${theirMedian} — it does not kill what this matchup puts in front of it.`,
    });
  }
  cut.sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));

  return {
    against: { cardId: againstLegendCardId, name: theirLegend.name, domains: theirIdentity },
    ...(winCondition !== undefined ? { winCondition } : {}),
    constraints: {
      sideboardSize: SIDEBOARD_SIZE,
      mainDeckSize: mainSize,
      exchangesAre: "1-for-1 — the Main Deck stays at exactly 40 (TR 403.4)",
      locked: [
        "Runes (TR 403.4.b)",
        "The Legend (TR 403.4.b)",
        "Battlefields (TR 403.4.b)",
      ],
      swappable: ["The Chosen Champion (TR 601.1.c.4)"],
    },
    bring,
    cut,
    caveats: [
      "⚠️ What their identity CAN field, never what an opponent WILL play — no meta data exists (D-035). Every count above is over the legal pool of that identity.",
      "⚠️ Answer relationships come from the ANSWERS doctrine table and are contested; they are what good players advise, not what a rules engine proved.",
      "⚠️ No combat is simulated (no S1a), so 'does not kill' above is printed damage against printed Might and nothing else.",
      `⚠️ Copy limits span Main Deck and sideboard combined (L16) — 'headroom' is ${MAX_COPIES_PER_NAME} minus what is already registered, and a suggestion above it is illegal rather than greedy.`,
    ],
  };
}
