/**
 * Reading what is actually printed on a card.
 *
 * ⚠️ **Mentioning a keyword is not having it**, and the difference is 6% of the pool. Cleave
 * *grants* `[Assault 3]` to another unit. Noxus Saboteur talks about the opponent's
 * `[Hidden]` cards. Captain Farron gives `[Assault]` to its neighbours. A substring search
 * for `[Assault` counts all three as having the keyword, and produced a **fact** panel that
 * was wrong about 48 of 814 cards.
 *
 * The rule this module encodes is how the cards are laid out: **a card's own keywords open a
 * sentence**, each optionally followed by parenthesised reminder text. A keyword in the
 * middle of a sentence is rules text *about* a keyword rather than a claim to have one.
 *
 * ⚠️ **"Opens a sentence", not "opens the card".** The rule used to read only the run a card
 * starts with, which was true of the first sets and hid 62 cards' keywords by Radiance:
 * `Commander Ledros` prints its cost reduction first and `[Deflect]` `[Ganking]` after it,
 * `Wrath of the Freljord` reads *"I enter ready. [Shield 3]"*, and both read as having none.
 * Every one of the 62 differences was a keyword the card has; none was one it does not.
 */

/** A keyword token, e.g. `[Assault 2]`, `[Deflect]` or the two-word `[Show Off]`. */
const KEYWORD = /\[([A-Za-z'’]+(?: [A-Za-z'’]+)*)(?:\s+(\d+))?\]/g;

/** One keyword a card has, with the number printed on it — `null` when it prints none. */
export interface LeadingKeyword {
  name: string;
  value: number | null;
}

/**
 * The keywords a card **has**, each with its printed number.
 *
 * A keyword is the card's own when it opens the text, follows a full stop, or follows another
 * of the card's own keywords — reminders, commas and dashes in between are stepped over.
 * `[Assault 2], [Shield 2]` is two; so is `[Disarm]. (When each of us attacks…) [Ganking]`.
 *
 * ⚠️ **Deliberately conservative.** Raging Soul reads *"If you've discarded a card this turn,
 * I have [Assault]"* — a conditional the card only sometimes satisfies. It is excluded,
 * because a keyword count that includes conditional grants is answering a different question
 * from the one a deckbuilder is asking. So is Jayce's *"choose one to give me this turn —
 * [Assault 2] … [Deflect 2] … [Ganking]"*: the run follows a dash inside a sentence, so
 * none of the three is his. False negatives beat false positives in a tier whose whole
 * guarantee is that it is exactly right.
 */
export function leadingKeywordValues(text: string | undefined): LeadingKeyword[] {
  if (!text) return [];
  const found: LeadingKeyword[] = [];
  /** Where each of the card's own keywords ends, so the next token can tell it follows one. */
  const ownEnds = new Set<number>();
  for (const match of text.matchAll(KEYWORD)) {
    let before = text.slice(0, match.index).trimEnd();
    while (before.endsWith(")")) {
      const open = before.lastIndexOf("(");
      if (open < 0) break;
      before = before.slice(0, open).trimEnd();
    }
    const opensSentence = before === "" || before.endsWith(".");
    const followsOwn = ownEnds.has(before.replace(/[,—–-]\s*$/, "").trimEnd().length);
    if (!opensSentence && !followsOwn) continue;
    found.push({ name: match[1] as string, value: match[2] === undefined ? null : Number.parseInt(match[2], 10) });
    ownEnds.add(match.index + match[0].length);
  }
  return found;
}

/** The keywords a card **has**, by name. See `leadingKeywordValues`. */
export const leadingKeywords = (text: string | undefined): string[] =>
  leadingKeywordValues(text).map((k) => k.name);

/** Whether a card carries a keyword itself, rather than mentioning it. */
export const hasKeyword = (text: string | undefined, keyword: string): boolean =>
  leadingKeywords(text).some((k) => k.toLowerCase() === keyword.toLowerCase());

/**
 * Rules text with parenthesised reminders removed — what the card *does*, without the
 * explanations of what its keywords mean.
 */
export const withoutReminders = (text: string | undefined): string =>
  (text ?? "").replace(/\([^)]*\)/g, " ");
