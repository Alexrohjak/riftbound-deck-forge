#!/usr/bin/env node
/**
 * `forge` — EE's tool surface, the second consumer of `@forge/engine` (D-047).
 *
 * **This is what Claude Code calls.** D-043 decided the conversation layer is not built:
 * EE is a headless engine with a swappable mouth, and the mouth is Claude Code reading
 * exported state. So the contract here is *structured data in, structured data out* —
 * never prose, never a number this process invented.
 *
 *     forge legality <deck.json> [--cards <names.json>]
 *
 * Exit codes: 0 legal · 1 violations found · 2 bad input. Distinguishing "illegal" from
 * "couldn't tell" matters: a caller must never read a crash as a pass.
 */
import { readFileSync } from "node:fs";
import {
  checkLegality,
  diagnose,
  match,
  readArchetype,
  review,
  staticCardIndex,
  suggest,
  type CardEntry,
  type Deck,
  type PoolCard,
} from "@forge/engine";

const USAGE = `forge <legality|review|ask> <deck.json> [--cards <cards.json>] [--note "..."]

  deck.json    a Deck — see docs/spec/DATA-MODEL.md §1
  --cards      printing id -> card facts. Either "<name>" or
               { "name": ..., "domains": [...], "energy": n } per printing.

               Legality keys on NAME (DATA-MODEL §2); without this file every printing is
               treated as its own name and copy limits under-count rather than silently
               merging distinct cards. Supplying "domains" additionally enables the Domain
               Identity checks — the result's "checked" list always says which ones ran.

  legality     is this deck registerable? 33 checks, each with its citation.
  review       what IS this deck? Counts, odds, and what good players would say —
               every judgement carrying its source and how much confidence it earns.
  ask          --note "I played into Diana and lost, could not hold battlefields"
               Turns a complaint into a diagnosis and a handful of candidates.
               A complaint is evidence about a CAPABILITY, never about a card.

⚠️ review returns three kinds of claim and they are not interchangeable:
   fact        counted from the list; not arguable
   probability computed, correct GIVEN the assumption in its attribution
   doctrine    what good players advise — and they disagree, so it is attributed

Prints JSON. Exit 0 legal, 1 violations, 2 bad input.`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not read ${path}: ${(error as Error).message}`);
  }
}

function main(argv: string[]): number {
  const [command, deckPath, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (!["legality", "review", "ask"].includes(command)) {
    fail(`Unknown command "${command}".\n\n${USAGE}`);
  }
  if (!deckPath) fail(`${command} needs a deck file.\n\n${USAGE}`);

  let cards: Record<string, CardEntry> = {};
  const cardsFlag = rest.indexOf("--cards");
  if (cardsFlag !== -1) {
    const cardsPath = rest[cardsFlag + 1];
    if (!cardsPath) fail("--cards needs a path.");
    cards = readJson(cardsPath) as Record<string, CardEntry>;
  }

  const deck = readJson(deckPath) as Deck;
  if (!deck || typeof deck !== "object" || !Array.isArray(deck.slots)) {
    fail(`${deckPath} does not look like a Deck (no slots array).`);
  }

  const index = staticCardIndex(cards);

  if (command === "ask") {
    const noteFlag = rest.indexOf("--note");
    const note = noteFlag === -1 ? "" : (rest[noteFlag + 1] ?? "");
    if (!note) fail(`ask needs --note "what went wrong".\n\n${USAGE}`);

    // ⚠️ Keyword matching, not comprehension. The engine is pure and stays that way; turning
    // a sentence into symptoms is the caller's job (D-043 — a swappable mouth).
    const symptoms = match(note);
    if (symptoms.length === 0) {
      process.stdout.write(
        `${JSON.stringify(
          {
            note,
            symptoms: [],
            hint: "No symptom matched. Pass a recognised one, or let Claude Code pick from the taxonomy.",
          },
          null,
          2,
        )}\n`,
      );
      return 0;
    }

    const pool: PoolCard[] = Object.entries(cards).map(([cardId, entry]) => ({
      cardId,
      facts: typeof entry === "string" ? { name: entry } : entry,
    }));

    const answers = symptoms.map((symptom) => {
      const d = diagnose(deck, index, symptom);
      return { ...d, candidates: suggest(deck, index, d, pool) };
    });
    process.stdout.write(`${JSON.stringify({ note, archetype: readArchetype(deck, index), answers }, null, 2)}\n`);
    return 0;
  }

  if (command === "review") {
    // Deliberately not a score. A deck is a set of trade-offs and a number hides which
    // ones were chosen (D-016).
    process.stdout.write(
      `${JSON.stringify({ ...review(deck, index), archetype: readArchetype(deck, index) }, null, 2)}\n`,
    );
    return 0;
  }

  const result = checkLegality(deck, index);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.legal ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
