/**
 * Reading what is actually printed on a card.
 *
 * ⚠️ **Mentioning a keyword is not having it**, and the difference is 6% of the pool. Cleave
 * *grants* `[Assault 3]` to another unit. Noxus Saboteur talks about the opponent's
 * `[Hidden]` cards. Captain Farron gives `[Assault]` to its neighbours. A substring search
 * for `[Assault` counts all three as having the keyword, and produced a **fact** panel that
 * was wrong about 48 of 814 cards.
 *
 * The rule this module encodes is how the cards are laid out: **a card's own keywords lead
 * its text**, each optionally followed by parenthesised reminder text. Anything after the
 * opening run is rules text *about* keywords rather than a claim to have one.
 */

/** A keyword token at the head of the text, e.g. `[Assault 2]` or `[Deflect]`. */
const KEYWORD = /^\[([A-Za-z'’]+)(?:\s+\d+)?\]\s*/;
/** The parenthesised reminder that usually follows a printed keyword. */
const REMINDER = /^\([^)]*\)\s*/;
/** Some cards join the keyword to the sentence with a dash — `[Deathknell] — Deal 4 …`. */
const JOINER = /^[—–-]\s*/;

/**
 * The keywords a card **has**, read from the leading run.
 *
 * ⚠️ **Deliberately conservative.** Raging Soul reads *"If you've discarded a card this turn,
 * I have [Assault]"* — a conditional the card only sometimes satisfies. It is excluded,
 * because a keyword count that includes conditional grants is answering a different question
 * from the one a deckbuilder is asking. False negatives beat false positives in a tier whose
 * whole guarantee is that it is exactly right.
 */
export function leadingKeywords(text: string | undefined): string[] {
  if (!text) return [];
  const found: string[] = [];
  let rest = text.trimStart();
  for (;;) {
    const keyword = KEYWORD.exec(rest);
    if (!keyword) break;
    found.push(keyword[1] as string);
    rest = rest.slice(keyword[0].length);
    const reminder = REMINDER.exec(rest);
    if (reminder) rest = rest.slice(reminder[0].length);
    const joiner = JOINER.exec(rest);
    if (joiner) rest = rest.slice(joiner[0].length);
  }
  return found;
}

/** Whether a card carries a keyword itself, rather than mentioning it. */
export const hasKeyword = (text: string | undefined, keyword: string): boolean =>
  leadingKeywords(text).some((k) => k.toLowerCase() === keyword.toLowerCase());

/**
 * Rules text with parenthesised reminders removed — what the card *does*, without the
 * explanations of what its keywords mean.
 */
export const withoutReminders = (text: string | undefined): string =>
  (text ?? "").replace(/\([^)]*\)/g, " ");
