import type { CardIndex, LegalityResult, Warning } from "../types.js";
import { checkLegality } from "../legality/index.js";
import { mainDeckCount, zoneCount } from "../legality/shape.js";
import { toDeck, type Brief, type Proposal } from "./brief.js";

/**
 * `S5` — the gate a proposal has to pass before anyone sees it.
 *
 * **The model proposes; this disposes.** Everything a language model is bad at — counting to
 * forty, remembering the Chosen Champion sits inside that forty, never exceeding three of a
 * name, staying inside Domain Identity — is checked here against the same 33 rules the app
 * uses. Nothing that fails reaches the builder.
 *
 * ⚠️ **The output is instructions, not complaints.** `checkLegality` says *"Main Deck must be
 * exactly 40; found 37"*, which is the truth and useless to a repair loop. A caller trying
 * again needs *"add 3 more Main Deck cards"*. Turning one into the other is this file's whole
 * reason to exist — the alternative is every caller re-deriving it, and each of them getting
 * a slightly different answer.
 */

export interface Repair {
  /** The check that failed, so the instruction can always be traced back to a rule. */
  check: string;
  /** What to do, in the imperative. */
  fix: string;
}

export interface Verdict {
  legal: boolean;
  /** ⚠️ True only when the deck is legal **and** every card is one the pool actually has. */
  usable: boolean;
  legality: LegalityResult;
  warnings: Warning[];
  repairs: Repair[];
  /**
   * ⚠️ Card ids that are not in the brief's pool at all.
   *
   * This is the failure mode a *generated* deck has that a hand-built one cannot: an id that
   * was never real. `checkLegality` cannot catch it — an unknown printing falls back to its
   * own id as a name, so it looks like a perfectly ordinary card nobody owns, and a deck of
   * forty invented cards would pass every count.
   */
  unknownCardIds: string[];
  counts: { main: number; runes: number; battlefields: number };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Validate a proposal against the brief it was built from.
 *
 * `collection` is optional and only ever produces warnings — a deck you cannot yet build is
 * still a legal deck, and conflating the two is what `LEGALITY.md` calls the point of the
 * whole tool.
 */
export function validateProposal(
  proposal: Proposal,
  brief: Brief,
  cards: CardIndex,
  collection?: Readonly<Record<string, number>>,
): Verdict {
  const deck = toDeck(proposal);

  // Every id the proposal used, including the two singular fields.
  const used = [
    proposal.legendCardId,
    proposal.chosenChampionCardId,
    ...deck.slots.map((s) => s.cardId),
  ].filter(Boolean);

  const known = new Set<string>([brief.legend.cardId, ...brief.legalCardIds]);
  const unknownCardIds = [...new Set(used.filter((id) => !known.has(id)))];

  const legality = checkLegality(
    deck,
    cards,
    collection ? { ownership: { collection } } : undefined,
  );

  const counts = {
    main: mainDeckCount(deck),
    runes: zoneCount(deck, "RUNE"),
    battlefields: zoneCount(deck, "BATTLEFIELD"),
  };

  const repairs: Repair[] = [];

  if (unknownCardIds.length > 0) {
    repairs.push({
      check: "pool",
      fix:
        `Replace ${plural(unknownCardIds.length, "card")} that ` +
        `${unknownCardIds.length === 1 ? "is" : "are"} not in the supplied pool — ` +
        `${unknownCardIds.slice(0, 3).join(", ")}${unknownCardIds.length > 3 ? ", …" : ""}. ` +
        `Use only cardId values given in the brief.`,
    });
  }

  // Counts first: they are the commonest failure and the easiest to act on.
  if (counts.main !== brief.targets.mainDeck) {
    const off = brief.targets.mainDeck - counts.main;
    repairs.push({
      check: "L3",
      fix:
        off > 0
          ? `Add ${plural(off, "more Main Deck card")}. The Chosen Champion counts inside the ${brief.targets.mainDeck}.`
          : `Remove ${plural(-off, "Main Deck card")}. The Chosen Champion counts inside the ${brief.targets.mainDeck}.`,
    });
  }
  if (counts.runes !== brief.targets.runes) {
    const off = brief.targets.runes - counts.runes;
    repairs.push({
      check: "L4",
      fix:
        off > 0
          ? `Add ${plural(off, "more rune")} — Riot's Primer suggests a ${brief.targets.official.runeSplit}-${brief.targets.official.runeSplit} split across your two domains.`
          : `Remove ${plural(-off, "rune")}.`,
    });
  }
  if (counts.battlefields !== brief.targets.battlefields) {
    const off = brief.targets.battlefields - counts.battlefields;
    repairs.push({
      check: "L5",
      fix: off > 0 ? `Add ${plural(off, "more battlefield")}.` : `Remove ${plural(-off, "battlefield")}.`,
    });
  }

  // Everything else the checks found, turned imperative where the wording allows.
  for (const v of legality.violations) {
    if (["L3", "L4", "L5"].includes(v.check)) continue; // already stated as a count above
    repairs.push({ check: v.check, fix: instructionFor(v.check, v.message, brief) });
  }

  // ⚠️ A card the builder asked to be built around, missing from the result. Not a rule
  // violation — but it is the request, and delivering something else without saying so is
  // the failure the brief already refuses to make quietly.
  const present = new Set(used);
  const droppedRequests = brief.around.filter((c) => !present.has(c.cardId));
  if (droppedRequests.length > 0) {
    repairs.push({
      check: "seed",
      fix:
        `Include the cards that were asked for, or say why they cannot work: ` +
        `${droppedRequests.map((c) => c.name).join(", ")}.`,
    });
  }

  return {
    legal: legality.legal,
    usable: legality.legal && unknownCardIds.length === 0 && droppedRequests.length === 0,
    legality,
    warnings: legality.warnings,
    repairs,
    unknownCardIds,
    counts,
  };
}

/** Turn a check's statement of fact into something a caller can act on. */
function instructionFor(check: string, message: string, brief: Brief): string {
  switch (check) {
    case "L9":
    case "L10":
    case "L12":
      return `${message} Replace it with a card inside ${brief.identity.join(" + ")} or a colorless one.`;
    case "L13":
    case "L14":
      return `${message} Cut down to at most ${brief.targets.maxCopiesPerName} copies of that name.`;
    case "L18":
    case "L19":
      return `${message} The Chosen Champion must be a non-Signature unit carrying the Legend's champion tag.`;
    case "L23":
    case "L30":
      return `${message} Remove it — banned cards cannot be registered.`;
    case "L28":
      return `${message} A [Unique] card is limited to one copy.`;
    default:
      // No rewriting when the wording is already actionable. Inventing an instruction for a
      // rule this function has not been taught would be worse than passing the fact through.
      return message;
  }
}
