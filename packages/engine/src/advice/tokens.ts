import type { CardFacts, CardIndex, Deck } from "../types.js";
import { deckEntries } from "../legality/entries.js";

/**
 * **What to bring in the box beside the deck.**
 *
 * A registered deck is 40 + 12 + 3 cards, and none of them is a token. Tokens are created
 * during play and are never registered (DATA-MODEL §1), which is exactly why the Workbench
 * excludes them from the collection — and exactly why nothing in Forge ever told you that a
 * Zed deck is unplayable without six Shadow Clones. The decklist is complete and the *pile*
 * is not, and only the pile loses you a game.
 *
 * ⚠️ **Read from printed text, never from a token registry.** The obvious implementation is
 * to look up which token *cards* exist and match deck cards against their names. It is also
 * wrong here: `data/cards.json` carries token cards for 7 of the 11 tokens the pool actually
 * creates. **Mech, Sand Soldier, Shadow Clone and Tentacle have no token card at all** — the
 * newer sets' tokens were never catalogued — so a registry-driven version would answer
 * "nothing" for Zed and for Azir, the two decks most obviously about their tokens. The
 * creating card states everything needed: *"play a 0 :rb_might: **Shadow Clone unit token**"*
 * carries the name, the type and the Might. This module reads that sentence and nothing else,
 * which is the same rule the rest of the engine settled on (EE-COMPLETION).
 *
 * ⚠️ **Mentioning a token is not making one.** *"Bird, Cat, Dog, and Poro"* is a tribal list
 * on 10 cards that create nothing; *"Bird units here have +1 Might"* is a lord. The signal
 * that separates them is that a real creation always prints the token's **type** before the
 * word `token` — `Bird unit token`, `Gold gear token`, `Baron Pit battlefield token`. Nothing
 * that merely refers to a token ever does. That one requirement takes Bird from 17 mentions
 * to 7 makers with no false positives across all 1,180 printings.
 */

/**
 * The type word a real creation always prints between the token's name and `token`.
 *
 * `spell` has no example in the current pool and is listed anyway: the cost of it never
 * matching is nothing, and the cost of a future set printing one is a token that silently
 * fails to appear in the only place that would have told you to pack it.
 */
const TOKEN_TYPE = "(unit|gear|battlefield|spell)";

/**
 * `<Capitalised words> <type> token(s)`.
 *
 * The name is the run of capitalised words immediately before the type, which is what makes
 * multi-word tokens (`Shadow Clone`, `Sand Soldier`, `Baron Pit`) fall out for free rather
 * than needing a list to be maintained alongside every new set.
 */
const CREATION = new RegExp(`((?:[A-Z][A-Za-z'’-]*\\s+)+)${TOKEN_TYPE}\\s+tokens?\\b`, "g");

/** The verbs that put a token onto the board. The count word is looked for after the last one. */
const VERB = /\b(play|plays|played|add|adds|create|creates|put|puts|replace|replaces)\b/gi;

const COUNT_WORD = /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

const NUMBER: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * An ability that can fire more than once per copy.
 *
 * ⚠️ **`When you play me` is not in this list and must not be.** It fires exactly once per
 * copy, so it is already counted by the number of copies; reading it as repeatable would
 * double-count every enters-play trigger in the game. The distinction is `When you play me`
 * against `When you play a card` — one letter of grammar apart and opposite in meaning.
 */
const REPEATABLE =
  /:rb_exhaust:|\bonce each turn\b|\[Repeat\]|\bat the start of\b|\bwhen (?:i|you) (?:conquer|hold|move|win|score)\b|\bwhen another\b|\bwhen you play a\b|\bwhenever\b/i;

/** A count the board decides — `play a Sand Soldier for each Equipment you control`. */
const VARIABLE = /\bfor each\b/i;

/** `add the Baron Pit … if it's not there already` — the card says only one can ever exist. */
const UNIQUE = /\bif it'?[’']?s not there already\b/i;

/** The token dies at the start of your turn, so the same physical card is reused. */
const TEMPORARY = /\[Temporary\]/i;

/**
 * A practical ceiling on what is worth sleeving.
 *
 * ⚠️ **Not a rules limit.** Riftbound puts no cap on tokens in play, and a repeatable source
 * is unbounded over a long game. This is the point past which you are administering a board
 * rather than playing one, and it is stated here rather than hidden in a formula so that the
 * one arbitrary number in this module is visible and arguable.
 */
export const BRING_CAP = 12;

/** One deck card that makes a token, and what it makes. */
export interface TokenSource {
  /** The deck card's name. */
  name: string;
  /** Copies of it registered in the deck, the Legend and Chosen Champion included. */
  copies: number;
  /** The most this card makes in a single resolution. */
  atOnce: number;
  /** Whether it can do it more than once — an activated ability or a recurring trigger. */
  repeatable: boolean;
  /** Whether the number depends on the board rather than on the card. */
  variable: boolean;
}

/** A token this deck creates, and how many of it to pack. */
export interface TokenNeed {
  /** As printed — `Shadow Clone`, `Recruit`, `Baron Pit`. */
  name: string;
  /** `unit`, `gear`, `battlefield` or `spell`. */
  type: string;
  /** 🟢 Every deck card that makes it, most productive first. */
  sources: TokenSource[];
  /** 🟢 Copies across the deck that can make it. */
  copies: number;
  /** 🟢 The most a single card makes in one resolution. */
  atOnce: number;
  /** 🟢 At least one source can make it repeatedly, so the true ceiling is open. */
  repeatable: boolean;
  /** 🟢 At least one source's count is decided by the board. */
  variable: boolean;
  /** 🟢 It is made with `[Temporary]`, so it dies each turn and the card is reused. */
  temporary: boolean;
  /** 🟢 The card says only one can exist at a time. */
  unique: boolean;
  /**
   * 🟡 How many to put in the box.
   *
   * **Enough for the largest single burst, and one for every copy that can make one** —
   * capped at {@link BRING_CAP}, and pinned to 1 where the card says only one may exist.
   * A judgement, and the only one in this module.
   */
  bring: number;
}

/**
 * Something a token *card* cannot represent but the deck still needs a marker for.
 *
 * ⚠️ **Kept apart from `TokenNeed` rather than folded in.** `[Empowered]` is a state a unit
 * is in, not a card you play, and there is no printed token for it at all. Listing it beside
 * Shadow Clone as though you could go and find one would send you looking for a card that
 * does not exist. Buff and XP Tracker *do* have printed cards and say so.
 */
export interface MarkerNeed {
  name: string;
  /** Why the deck needs it, in one sentence. */
  why: string;
  /** 🟢 Copies in the deck that call for it. */
  copies: number;
  /** 🟡 How many to bring. */
  bring: number;
  /** Whether a printed token card exists for it, or you must supply your own marker. */
  printed: boolean;
}

export interface DeckTokens {
  tokens: TokenNeed[];
  markers: MarkerNeed[];
  /**
   * ⚠️ **False when the index carries no rules text**, in which case an empty list means
   * *not looked* rather than *none needed* — the distinction `keywordsRead` exists for in
   * `DeckFacts`, applied here. A panel that cannot tell them apart will one day tell you a
   * Zed deck needs no tokens.
   */
  read: boolean;
}

/** The count word governing a creation: the first one after the verb that put it there. */
function countBefore(text: string, at: number): number {
  const before = text.slice(0, at);
  VERB.lastIndex = 0;
  let verbEnd = -1;
  for (let m = VERB.exec(before); m; m = VERB.exec(before)) verbEnd = m.index + m[0].length;
  // No verb in front of it means the sentence is not a creation we can count; one is the
  // safe reading, since the phrase itself is singular or plural but never zero.
  const segment = verbEnd >= 0 ? before.slice(verbEnd) : "";
  const word = COUNT_WORD.exec(segment);
  return word ? (NUMBER[word[1]!.toLowerCase()] ?? 1) : 1;
}

/** The sentence a match sits in — the scope every modifier is read from. */
function sentenceAt(text: string, at: number): string {
  const start = Math.max(0, text.lastIndexOf(".", at) + 1, text.lastIndexOf(";", at) + 1);
  const dot = text.indexOf(".", at);
  return text.slice(start, dot === -1 ? text.length : dot + 1);
}

interface Creation {
  name: string;
  type: string;
  atOnce: number;
  repeatable: boolean;
  variable: boolean;
  temporary: boolean;
  unique: boolean;
}

/**
 * Every token one card creates.
 *
 * Exported because it is the whole of the reading and deserves to be testable on a string,
 * without a deck around it.
 */
export function creationsIn(text: string | undefined): Creation[] {
  if (!text) return [];
  const out: Creation[] = [];
  CREATION.lastIndex = 0;
  for (let m = CREATION.exec(text); m; m = CREATION.exec(text)) {
    const name = m[1]!.trim();
    const sentence = sentenceAt(text, m.index);
    out.push({
      name,
      type: m[2]!,
      atOnce: countBefore(text, m.index),
      // Read from the whole card, not the sentence: `:rb_exhaust:` and the trigger that
      // pays for it are routinely printed either side of a comma or a line break.
      repeatable: REPEATABLE.test(text),
      variable: VARIABLE.test(sentence),
      temporary: TEMPORARY.test(sentence),
      unique: UNIQUE.test(sentence),
    });
  }
  return out;
}

/** Markers are keyed off what the deck's text asks for, not off a card being present. */
const MARKERS: ReadonlyArray<{
  name: string;
  why: string;
  printed: boolean;
  /** How many to bring, given the copies that call for it. */
  bring: (copies: number) => number;
  wants: (text: string) => boolean;
}> = [
  {
    name: "Buff",
    why: "A unit may hold no more than one buff at a time, so you need one per buffed unit.",
    printed: true,
    bring: (copies) => Math.min(6, Math.max(2, copies)),
    // `[Buff]` as a keyword action, or the verb with an object. Not a bare "buff", which
    // appears in reminder prose about other things.
    wants: (t) => /\[Buff\]/i.test(t) || /\bbuff (?:a|an|all|me|it|the|each|two|three)\b/i.test(t) || /\bspend a buff\b/i.test(t),
  },
  {
    name: "XP Tracker",
    why: "XP is a running total you must be able to show; one tracker covers the whole game.",
    printed: true,
    bring: () => 1,
    wants: (t) => /\bXP\b/.test(t) || /\[Level\b/i.test(t),
  },
  {
    name: "Empowered",
    /* ⚠️ There is no Empowered token card in the pool. Saying so is the useful part — the
       alternative is you searching the set list for a card that was never printed. */
    why: "[Empowered] is a state with no printed token — bring your own marker to show it.",
    printed: false,
    bring: (copies) => Math.min(6, Math.max(1, copies)),
    wants: (t) => /\[Empower(?:ed)?\]/i.test(t),
  },
];

/**
 * What to bring in the box beside this deck.
 *
 * ⚠️ **The Legend is included, and `deckEntries` does not return it.** Azir's whole plan is
 * *"exhaust: play a Sand Soldier"* printed on the Legend, and a version that iterated only
 * slots and the Chosen Champion answered "no tokens" for the deck most defined by them.
 */
export function deckTokens(deck: Deck, cards: CardIndex): DeckTokens {
  const entries = deckEntries(deck, cards);
  const legend: Array<{ name: string; quantity: number; facts: CardFacts | undefined }> = deck.legendCardId
    ? [
        {
          name: cards.nameOf(deck.legendCardId) ?? deck.legendCardId,
          quantity: 1,
          facts: cards.factsOf?.(deck.legendCardId),
        },
      ]
    : [];
  const all = [...entries.map((e) => ({ name: e.name, quantity: e.quantity, facts: e.facts })), ...legend];

  const read = all.some((e) => typeof e.facts?.text === "string");

  /** name|type → the need being accumulated. */
  const byToken = new Map<string, TokenNeed>();
  const markerCopies = new Map<string, number>();

  for (const e of all) {
    const text = e.facts?.text;
    if (!text) continue;

    for (const marker of MARKERS) {
      if (marker.wants(text)) markerCopies.set(marker.name, (markerCopies.get(marker.name) ?? 0) + e.quantity);
    }

    // One card may print the same token twice (a trigger and an activated ability). Both
    // sentences describe the same physical need, so the card contributes its best single
    // burst once rather than once per sentence.
    const best = new Map<string, Creation>();
    for (const c of creationsIn(text)) {
      const key = `${c.name}|${c.type}`;
      const prior = best.get(key);
      if (!prior) {
        best.set(key, c);
        continue;
      }
      best.set(key, {
        ...prior,
        atOnce: Math.max(prior.atOnce, c.atOnce),
        repeatable: prior.repeatable || c.repeatable,
        variable: prior.variable || c.variable,
        temporary: prior.temporary || c.temporary,
        unique: prior.unique || c.unique,
      });
    }

    for (const [key, c] of best) {
      const need =
        byToken.get(key) ??
        ({
          name: c.name,
          type: c.type,
          sources: [],
          copies: 0,
          atOnce: 0,
          repeatable: false,
          variable: false,
          temporary: false,
          unique: false,
          bring: 0,
        } satisfies TokenNeed);
      need.sources.push({
        name: e.name,
        copies: e.quantity,
        atOnce: c.atOnce,
        repeatable: c.repeatable,
        variable: c.variable,
      });
      need.copies += e.quantity;
      need.atOnce = Math.max(need.atOnce, c.atOnce);
      need.repeatable ||= c.repeatable;
      need.variable ||= c.variable;
      need.temporary ||= c.temporary;
      need.unique ||= c.unique;
      byToken.set(key, need);
    }
  }

  const tokens = [...byToken.values()].map((need) => {
    need.sources.sort((a, b) => b.atOnce * b.copies - a.atOnce * a.copies || a.name.localeCompare(b.name));
    need.bring = need.unique ? 1 : Math.min(BRING_CAP, Math.max(need.atOnce, need.copies));
    return need;
  });

  // Most to pack first: that is the order you fill the box in, and the long tail of
  // one-offs is what you skim rather than what you read.
  tokens.sort((a, b) => b.bring - a.bring || a.name.localeCompare(b.name));

  const markers = MARKERS.filter((m) => (markerCopies.get(m.name) ?? 0) > 0).map((m) => {
    const copies = markerCopies.get(m.name)!;
    return { name: m.name, why: m.why, copies, bring: m.bring(copies), printed: m.printed } satisfies MarkerNeed;
  });

  return { tokens, markers, read };
}
