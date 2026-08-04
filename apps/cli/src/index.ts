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
  buildBrief,
  checkLegality,
  diagnose,
  read as readLog,
  validate as validateMatch,
  validateProposal,
  match,
  readArchetype,
  review,
  staticCardIndex,
  suggest,
  type CardEntry,
  type Deck,
  type MatchRecord,
  type PoolCard,
  type Proposal,
} from "@forge/engine";

const USAGE = `forge <legality|review|ask|log|brief|validate> <file.json> [options]

  deck.json    a Deck — see docs/spec/DATA-MODEL.md §1
  --pool       apps/web/public/cards.json — the generated index. Easier than --cards:
               it already holds every printing with domains, energy, might and rules text.
  --collection printing id -> quantity, as PUT /collection takes. Optional everywhere;
               supplying it makes suggestions and warnings ownership-aware.
  --cards      printing id -> card facts. Either "<name>" or
               { "name": ..., "domains": [...], "energy": n } per printing.

               Legality keys on NAME (DATA-MODEL §2); without this file every printing is
               treated as its own name and copy limits under-count rather than silently
               merging distinct cards. Supplying "domains" additionally enables the Domain
               Identity checks — the result's "checked" list always says which ones ran.

  legality     is this deck registerable? 33 checks, each with its citation.
  review       what IS this deck? Counts, odds, and what good players would say —
               every judgement carrying its source and how much confidence it earns.
  brief        --legend <cardId> [--around a,b] [--exclude "Name,Name"]
               The constraint set a deck proposal has to satisfy: the Legend's ability
               text, every card legal under its identity, the targets, and what you own.
               S5 — the model proposes, the engine disposes.

  validate     proposal.json --legend <cardId>
               Runs a proposal through all 33 checks plus ownership and returns
               *instructions*, not complaints: "add 3 more Main Deck cards", not
               "found 37". Also catches card ids that do not exist, which no legality
               check can — an unknown printing looks like an ordinary card nobody owns.

  log          matches.json — the record, and what it is honest to conclude from it.
               ⚠️ Rates are WITHHELD below 10 matches (5 per matchup) rather than shown
               with a caveat. The "withheld" field says why. See docs/spec/LOG.md.

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
  const [command, ...args] = argv;
  // ⚠️ The file argument is positional and optional — `brief` takes only flags. Treating
  // `argv[1]` as a path unconditionally made `forge brief --legend X` read "--legend" as
  // the filename and then report the flag as missing, which is a maddening way to be told
  // the arguments are fine.
  const deckPath = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
  const rest = deckPath ? args.slice(1) : args;

  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (!["legality", "review", "ask", "log", "brief", "validate"].includes(command)) {
    fail(`Unknown command "${command}".\n\n${USAGE}`);
  }
  // `brief` takes flags rather than a file — there is no document to hand it.
  if (!deckPath && command !== "brief") fail(`${command} needs an input file.\n\n${USAGE}`);

  const flag = (name: string): string | undefined => {
    const at = rest.indexOf(name);
    if (at === -1) return undefined;
    const value = rest[at + 1];
    if (!value) fail(`${name} needs a value.`);
    return value;
  };

  let cards: Record<string, CardEntry> = {};
  const cardsPath = flag("--cards");
  if (cardsPath) cards = readJson(cardsPath) as Record<string, CardEntry>;

  /**
   * `--pool` reads the index the app already generates, which carries every printing with
   * domains, energy, might and rules text. Hand-assembling `--cards` for 1,180 printings to
   * ask one question was the friction that kept this surface unused.
   */
  const poolPath = flag("--pool");
  if (poolPath) {
    const raw = readJson(poolPath) as {
      cards?: Array<Record<string, unknown> & { printings?: Array<{ id: string }> }>;
    };
    if (!Array.isArray(raw.cards)) fail(`${poolPath} does not look like the generated card index.`);
    for (const card of raw.cards) {
      for (const printing of card.printings ?? []) {
        cards[printing.id] = {
          name: card.name as string,
          types: card.types as string[],
          superTypes: card.superTypes as string[],
          tags: card.tags as string[],
          text: (card.text as string) ?? "",
          domains: card.domains as never,
          energy: (card.energy as number) ?? null,
          might: (card.might as number) ?? null,
          banned: card.banned === true,
          ...(card.produces ? { produces: card.produces as string[] } : {}),
          ...(card.consumes ? { consumes: card.consumes as string[] } : {}),
          ...(card.championTag ? { championTag: card.championTag as string } : {}),
        } as CardEntry;
      }
    }
  }

  const collectionPath = flag("--collection");
  const collection = collectionPath
    ? ((readJson(collectionPath) as { counts?: Record<string, number> }).counts ??
      (readJson(collectionPath) as Record<string, number>))
    : {};

  const cardIndex = staticCardIndex(cards);

  if (command === "brief" || command === "validate") {
    const legendCardId = flag("--legend");
    if (!legendCardId) fail(`${command} needs --legend <cardId>.`);
    const pool: PoolCard[] = Object.entries(cards).map(([cardId, entry]) => ({
      cardId,
      facts: typeof entry === "string" ? { name: entry } : entry,
    }));
    if (pool.length === 0) fail("No card data. Pass --pool apps/web/public/cards.json.");

    const brief = buildBrief(
      {
        legendCardId,
        aroundCardIds: flag("--around")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        excludeNames: flag("--exclude")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
      },
      cardIndex,
      pool,
      collection,
    );

    if (command === "brief") {
      process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
      return 0;
    }

    if (!deckPath) fail("validate needs a proposal.json.");
    const proposal = readJson(deckPath) as Proposal;
    const verdict = validateProposal(proposal, brief, cardIndex, collection);
    process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
    // ⚠️ Exit 1 means "the deck has problems", the same as `legality`. A repair loop reads
    // this, so it must not differ from the command it mirrors.
    return verdict.usable ? 0 : 1;
  }

  // Everything below reads a file; `brief` was the only command that does not.
  if (!deckPath) fail(`${command} needs an input file.\n\n${USAGE}`);

  if (command === "log") {
    /**
     * The second consumer of the log (D-047). The web app renders `read()`; without this
     * EE could not see the record at all — and the record is the only place a
     * *longitudinal* fact lives. "You lost to this once" is an anecdote a single deck read
     * can produce; "five of your seven losses were cannot-hold" is not, and it is the more
     * useful sentence by a distance.
     *
     * ⚠️ Takes matches rather than a deck, so it dispatches above the Deck parse below.
     */
    const matches = readJson(deckPath);
    if (!Array.isArray(matches)) {
      fail(`${deckPath} does not look like a match log (expected a JSON array).`);
    }

    /**
     * ⚠️ **Validate before reading.** `read()` trusts its input — a non-array `symptoms`
     * or a null entry throws out of it, and an uncaught throw exits Node with code 1, which
     * this file reserves for "violations found". A caller reading exit codes would take a
     * crash for a result, which is the exact confusion the exit-code contract exists to
     * prevent. The API path already answers 400 here; this path must not be laxer.
     */
    const bad = matches.flatMap((record, i) => {
      if (!record || typeof record !== "object") return [`match ${i}: not an object.`];
      return validateMatch(record as MatchRecord).map((p) => `match ${i}: ${p}`);
    });
    if (bad.length > 0) fail(`${deckPath} has invalid records:\n  ${bad.join("\n  ")}`);
    // Names come from --cards when supplied; the engine never learns them itself (D-034).
    const nameOf = (cardId: string) => {
      const entry = cards[cardId];
      return typeof entry === "string" ? entry : entry?.name;
    };
    process.stdout.write(
      `${JSON.stringify(readLog(matches as MatchRecord[], nameOf), null, 2)}\n`,
    );
    return 0;
  }

  const deck = readJson(deckPath) as Deck;
  if (!deck || typeof deck !== "object" || !Array.isArray(deck.slots)) {
    fail(`${deckPath} does not look like a Deck (no slots array).`);
  }

  const index = cardIndex;

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
