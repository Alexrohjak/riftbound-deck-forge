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
import { checkLegality, staticCardIndex, type Deck } from "@forge/engine";

const USAGE = `forge legality <deck.json> [--cards <names.json>]

  deck.json    a Deck — see docs/spec/DATA-MODEL.md §1
  --cards      printing id -> card name map. Legality keys on NAME (DATA-MODEL §2);
               without it, every printing is treated as its own name and copy limits
               under-count rather than silently merging distinct cards.

Prints a LegalityResult as JSON. Exit 0 legal, 1 violations, 2 bad input.`;

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
  if (command !== "legality") fail(`Unknown command "${command}".\n\n${USAGE}`);
  if (!deckPath) fail(`legality needs a deck file.\n\n${USAGE}`);

  let names: Record<string, string> = {};
  const cardsFlag = rest.indexOf("--cards");
  if (cardsFlag !== -1) {
    const cardsPath = rest[cardsFlag + 1];
    if (!cardsPath) fail("--cards needs a path.");
    names = readJson(cardsPath) as Record<string, string>;
  }

  const deck = readJson(deckPath) as Deck;
  if (!deck || typeof deck !== "object" || !Array.isArray(deck.slots)) {
    fail(`${deckPath} does not look like a Deck (no slots array).`);
  }

  const result = checkLegality(deck, staticCardIndex(names));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.legal ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
