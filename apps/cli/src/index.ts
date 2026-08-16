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
  aroundCounsel,
  capabilities,
  cardCounsel,
  cardFactsFrom,
  buildBrief,
  counterCounsel,
  feasibilities,
  planFromSkeleton,
  reviewAgainstPlan,
  reviewBattlefields,
  rewardsOf,
  skeletonById,
  SKELETONS,
  legendCounsel,
  mechanicCounsel,
  checkLegality,
  diagnose,
  read as readLog,
  validate as validateMatch,
  validateProposal,
  match,
  readArchetype,
  readThreats,
  review,
  sideboardCounsel,
  simulateMulligans,
  staticCardIndex,
  suggest,
  type CardEntry,
  type Deck,
  type MatchRecord,
  type PoolCard,
  type Plan,
  type PoolSupply,
  type Proposal,
} from "@forge/engine";

const USAGE = `forge <legality|review|ask|log|skeletons|brief|validate|legend|around|counter|mechanic|card|threats|sideboard> [file.json] [options]

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
               --plan <skeletonId|plan.json> adds D-064's plan-relative read: package
               deltas, curve shape, the mulligan number, and the battlefield classes.
  skeletons    --legend <cardId>
               D-064 — the two-or-three plans this collection can support for that Legend,
               each with its package targets and how much of your pool could fill them.
               ⚠️ Returned UNRANKED, and unsupportable ones are returned too: ordering them
               would be the composite score D-016 forbids, and a skeleton you are four
               closers short of is a shopping list, not a failure.
               ⚠️ This is the FALLBACK for when no intent was stated. If he said what he
               wants — "good at holding battlefields", "beat this deck" — the plan comes
               from that and this command is not needed.

  brief        --legend <cardId> [--plan <skeletonId>] [--around a,b] [--exclude "Name,Name"]
               The constraint set a deck proposal has to satisfy: the Legend's ability
               text, every card legal under its identity, the targets, and what you own.
               S5 — the model proposes, the engine disposes.
               --plan attaches the plan and, more usefully, how much of the legal pool sits
               in each package against its target. Without it the model sees an
               undifferentiated list and cannot tell it is overshooting while it builds.

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

  ── the deckbuilding questions (S6) ──────────────────────────────────────────
  legend    --legend <cardId>
            "I like this Legend — what goes in it?" Its own text and identity, the
            Champions it may choose, everything you own that is legal under it grouped
            by what the card DOES, and the patterns you own nothing for.
            ⚠️ What the Legend *rewards* is not computed — read its text and
            docs/reference/LEGEND-GUIDE.md. A tool that guessed it would be inventing
            the most important sentence in the answer.

  around    --card <cardId>
            "I have one copy of this and want a deck around it." Walks the synergy
            graph both ways: what satisfies what this card asks for, and what wants
            what it makes. Plus every Legend whose identity admits it.

  counter   --legend <cardId> [--mine <cardId>]
            "I hate playing into this Legend." Two reads: "theirEngine" is the Legend's
            OWN trigger and how many cards in its identity feed it; "theirPatterns" is
            what that identity CAN do — never what an opponent is likely to hold (no
            meta data exists). Plus, as labelled doctrine with its reasoning, what
            answers each of those and what you own that does it.
            ⚠️ "theirPatterns" is DOMAIN level — every Legend sharing those two domains
            gets the same list. "theirEngine" is what tells them apart. Neither says how
            to pilot the matchup: docs/reference/LEGEND-GUIDE.md covers all 49.
            --mine names the Legend you are playing, so the answers are ones you can
            legally register. Without it they span all six domains and are not a deck.

  mechanic  --name <tag>
            gear_matters | flow | token_matters | trash_matters | hidden | … or a
            pattern name. Returns both halves: cards that pay the mechanic off, and
            cards that feed it.

  card      --card <cardId>
            "What is this card good at?" ⚠️ RETURNS THE PRINTED TEXT FIRST, which is
            the point: the briefing has told the mouth to read the card since D-064
            and there was no tool that returned one. Plus what it CHARGES you — every
            mechanic with the clause that produced it — the combat profile in both
            orientations (Assault attacking, Shield defending), and the format's
            median Might at that cost.
            ⚠️ Never says what it beats in a fight. That needs S1a.

  threats   deck.json
            "What should I fear?" Runs the OPPOSITE way to "counter": that one starts
            from their Legend, this one starts from YOUR deck. Sweep exposure against
            your own Might distribution, what your removal cannot kill as a share of
            the format, and the answer you run none of.
            ⚠️ What an opponent CAN do, never what they WILL — the denominator is the
            legal pool, and "unmodelled" always says what this cannot see.

  sideboard deck.json --against <cardId> [--win "how this deck wins"]
            "What do I swap, against what, and for what?" The ten-card board the
            briefing has mandated since D-064 with nothing computing it. Returns what
            to bring with L16 HEADROOM already subtracted — copies span Main Deck and
            sideboard combined, so a suggestion above it is illegal rather than greedy
            — and what to cut, grounded in their identity's median unit Might.
            ⚠️ Grounded in what their identity CAN field. There is no meta data.

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
  if (!["legality", "review", "ask", "log", "skeletons", "brief", "validate", "legend", "around", "counter", "mechanic", "card", "threats", "sideboard"].includes(command)) {
    fail(`Unknown command "${command}".\n\n${USAGE}`);
  }
  // `brief` takes flags rather than a file — there is no document to hand it.
  const fileless = ["skeletons", "brief", "legend", "around", "counter", "mechanic", "card"];
  if (!deckPath && !fileless.includes(command)) fail(`${command} needs an input file.\n\n${USAGE}`);

  const flag = (name: string): string | undefined => {
    const at = rest.indexOf(name);
    if (at === -1) return undefined;
    const value = rest[at + 1];
    if (!value) fail(`${name} needs a value.`);
    return value;
  };

  let cards: Record<string, CardEntry> = {};
  /**
   * ⚠️ **Shape-checked, because the wrong shape here is silent.** `--cards` is a
   * `printing id -> facts` map. Handing it the generated pool index instead — an object with
   * a `cards` array — used to be accepted: every id lookup missed, every card came back
   * factless, and `review` answered with a full, confident analysis reading `uncosted: 40`,
   * `0 units`, `0 removal` and an archetype of "control" for a deck of twenty units. Nothing
   * failed, so nothing said the answer was worthless.
   *
   * `--pool` and `--collection` both already refuse a wrong shape for exactly this reason
   * (the collection comment below records the same lesson). This is the third door.
   */
  const cardsPath = flag("--cards");
  if (cardsPath) {
    const raw = readJson(cardsPath);
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      fail(`${cardsPath} must be an object of printing id -> card facts.`);
    }
    if ("cards" in (raw as Record<string, unknown>)) {
      fail(
        `${cardsPath} looks like the generated card index, which --cards cannot read. ` +
          `Pass it as --pool instead.`,
      );
    }
    const bad = Object.entries(raw as Record<string, unknown>).find(
      ([, entry]) => typeof entry !== "string" && (entry === null || typeof entry !== "object"),
    );
    if (bad) {
      fail(
        `${cardsPath} entry "${bad[0]}" is neither a name nor a facts object. ` +
          `--cards takes "<name>" or { "name", "domains", "energy" } per printing.`,
      );
    }
    cards = raw as Record<string, CardEntry>;
  }

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
        // ⚠️ One mapping, shared with the browser (D-047). Hand-rolling it here is what
        // dropped `power`, `role` and `timing` without anything failing.
        cards[printing.id] = cardFactsFrom(card);
      }
    }
  }

  /**
   * The collection, from any of the three shapes it legitimately arrives in: the state file
   * `npm run state` writes, the `forge.collection/1` export the app imports, or a bare
   * `printing -> quantity` map.
   *
   * ⚠️ **A wrong shape used to read as an empty collection**, which is the worst possible
   * failure here: every ownership answer becomes a confident "you own none of that" rather
   * than an error. It is now an explicit failure, because being told the file is wrong costs
   * a second and being told you own nothing costs a deck.
   */
  const collectionPath = flag("--collection");
  let collection: Record<string, number> = {};
  if (collectionPath) {
    const raw = readJson(collectionPath) as {
      counts?: Record<string, number>;
      collection?: { counts?: Record<string, number> };
    };
    const counts =
      raw.collection?.counts ?? raw.counts ?? (raw as unknown as Record<string, number>);
    const usable = Object.entries(counts).filter(([, n]) => typeof n === "number" && n > 0);
    if (usable.length === 0) {
      fail(
        `${collectionPath} has no card counts in it. Expected the state file from ` +
          `\`npm run state\`, a forge.collection/1 export, or a bare { "<printing>": n } map.`,
      );
    }
    collection = Object.fromEntries(usable);
  }

  const cardIndex = staticCardIndex(cards);

  /**
   * `S6` — the deckbuilding surface. Every one of these returns structured data for the
   * mouth to reason over (D-043); none of them writes a sentence, because a tool that could
   * write the sentence could invent it.
   */
  if (["legend", "around", "counter", "mechanic", "card"].includes(command)) {
    const pool: PoolCard[] = Object.entries(cards).map(([cardId, entry]) => ({
      cardId,
      facts: typeof entry === "string" ? { name: entry } : entry,
    }));
    if (pool.length === 0) fail("No card data. Pass --pool apps/web/public/cards.json.");

    const emit = (value: unknown, missing: string): number => {
      if (value === null) fail(missing);
      process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
      return 0;
    };

    if (command === "legend" || command === "counter") {
      const legendCardId = flag("--legend");
      if (!legendCardId) fail(`${command} needs --legend <cardId>.`);
      // `--mine` names the Legend *you* are playing, so `counter` can drop answers you
      // could never register. Optional: without it the answers span every domain at once.
      const mine = flag("--mine");
      const counsel =
        command === "legend"
          ? legendCounsel(legendCardId, cardIndex, pool, collection)
          : counterCounsel(legendCardId, cardIndex, pool, collection, 5, mine);
      return emit(
        counsel,
        mine
          ? `No card with id "${legendCardId}" or "${mine}" in the pool.`
          : `No card with id "${legendCardId}" in the pool.`,
      );
    }
    if (command === "around") {
      const cardId = flag("--card");
      if (!cardId) fail("around needs --card <cardId>.");
      return emit(aroundCounsel(cardId, cardIndex, pool, collection), `No card with id "${cardId}".`);
    }
    /**
     * Q-CARD. ⚠️ **`text` comes back first and verbatim** — see `advice/card.ts` for why a
     * tool that returns a card's own words is the fix for a rule that kept being broken.
     */
    if (command === "card") {
      const cardId = flag("--card");
      if (!cardId) fail("card needs --card <cardId>.");
      return emit(
        cardCounsel(cardId, cardIndex, pool, collection),
        `No card with id "${cardId}" in the pool. ⚠️ This is not the same as a card you do not own.`,
      );
    }
    const name = flag("--name");
    if (!name) fail("mechanic needs --name <tag>.");
    const counsel = mechanicCounsel(name, pool, collection);
    if (!counsel.known) fail(`Nothing in the pool engages "${name}".`);
    return emit(counsel, "");
  }

  /**
   * Map a brief's pool onto what `feasibility` reads.
   *
   * ⚠️ Built from the brief rather than from the raw pool **so both see the same cards** —
   * the brief has already applied Domain Identity, the ban list and the exclusions, and a
   * second filter here would be a second implementation of L9/L10 to drift out of step.
   */
  const supplyOfBrief = (brief: ReturnType<typeof buildBrief>): PoolSupply[] =>
    brief.pool.map((c) => ({
      facts: {
        name: c.name,
        types: c.types,
        // ⚠️ **`domains` is deliberately omitted.** Package assignment never reads it, and
        // the brief has already applied Domain Identity — L9/L10 ran there. Carrying it
        // would mean widening `Domain` or casting, to feed a field nothing consumes.
        energy: c.energy,
        might: c.might,
        text: c.text,
        ...(c.role ? { role: c.role } : {}),
        ...(c.produces ? { produces: c.produces } : {}),
        ...(c.consumes ? { consumes: c.consumes } : {}),
      },
      owned: c.owned,
    }));

  if (command === "skeletons") {
    const legendCardId = flag("--legend");
    if (!legendCardId) fail("skeletons needs --legend <cardId>.");
    const pool: PoolCard[] = Object.entries(cards).map(([cardId, entry]) => ({
      cardId,
      facts: typeof entry === "string" ? { name: entry } : entry,
    }));
    if (pool.length === 0) fail("No card data. Pass --pool apps/web/public/cards.json.");

    const brief = buildBrief({ legendCardId }, cardIndex, pool, collection);
    const rewards = rewardsOf(legendCardId, cardIndex);
    process.stdout.write(
      `${JSON.stringify(
        {
          legend: brief.legend.name,
          identity: brief.identity,
          rewards,
          poolNames: brief.counts.poolNames,
          /**
           * ⚠️ **Unranked, and misfits included.** Ordering would be the composite score
           * D-016 forbids; dropping the unsupportable ones would hide the gap analysis,
           * which is often the more useful answer.
           */
          skeletons: feasibilities(rewards, supplyOfBrief(brief)),
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }

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
      const planId = flag("--plan");
      if (!planId) {
        process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
        return 0;
      }
      const skeleton = skeletonById(planId);
      if (!skeleton) {
        fail(`Unknown plan "${planId}". Try: ${SKELETONS.map((s) => s.id).join(", ")}`);
      }
      const rewards = rewardsOf(legendCardId, cardIndex);
      process.stdout.write(
        `${JSON.stringify(
          {
            ...brief,
            plan: planFromSkeleton(skeleton),
            /**
             * ⚠️ **The addition that matters.** Without it the model sees 321
             * undifferentiated cards and five numbers, and cannot tell it is overshooting a
             * package until after the deck exists.
             */
            supply: feasibilities(rewards, supplyOfBrief(brief)).find(
              (f) => f.skeleton.id === skeleton.id,
            )?.supply,
          },
          null,
          2,
        )}\n`,
      );
      return 0;
    }

    if (!deckPath) fail("validate needs a proposal.json.");
    const proposal = readJson(deckPath) as Proposal;
    /**
     * ⚠️ **Shape-check before handing it to the engine.** A `Deck` and a `Proposal` look
     * alike enough to confuse — a Deck has `slots`, a Proposal has `main`/`runes`/
     * `battlefields` — and passing the wrong one crashed with a stack trace. This file's own
     * header says a caller must never read a crash as a pass; an unhandled TypeError on
     * stderr with no exit contract is exactly that failure.
     */
    for (const field of ["main", "runes", "battlefields"] as const) {
      if (!Array.isArray(proposal?.[field])) {
        fail(
          `${deckPath} is not a proposal: "${field}" must be an array of ` +
            `{ cardId, quantity }. A saved Deck uses "slots" instead — those are different ` +
            `shapes, see docs/spec/GENERATOR.md.`,
        );
      }
    }
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

  /**
   * Q-THREAT and Q-SIDEBOARD — the two deckbuilding questions `EVALUATION §6` specifies that
   * had nothing behind them. Both read a deck, so they live below the deck load.
   *
   * ⚠️ **Both need the pool**, and both degrade honestly without it rather than guessing:
   * `threats` drops the board-dominance read, `sideboard` refuses outright, because a
   * sideboard is a claim about a card pool and an empty one is not a smaller claim.
   */
  if (command === "threats" || command === "sideboard") {
    const pool: PoolCard[] = Object.entries(cards).map(([cardId, entry]) => ({
      cardId,
      facts: typeof entry === "string" ? { name: entry } : entry,
    }));

    if (command === "threats") {
      process.stdout.write(`${JSON.stringify(readThreats(deck, index, pool), null, 2)}\n`);
      return 0;
    }

    const against = flag("--against");
    if (!against) fail("sideboard needs --against <cardId> — the Legend you are boarding against.");
    if (pool.length === 0) fail("sideboard needs --pool apps/web/public/cards.json — it is a claim about a card pool.");
    const counsel = sideboardCounsel(deck, index, pool, against, collection, flag("--win"));
    if (!counsel) {
      fail(
        `Could not read either "${against}" or this deck's Legend "${deck.legendCardId}" from the pool. ` +
          `A sideboard built against a Legend we cannot identify would be advice about nothing.`,
      );
    }
    process.stdout.write(`${JSON.stringify(counsel, null, 2)}\n`);
    return 0;
  }

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
    const planArg = flag("--plan");
    /**
     * D-064 — the plan-relative read.
     *
     * ⚠️ **A plan file is the normal case, a skeleton id the convenience.** EE's entry point
     * is a sentence and usually carries the intent already, so most plans are written from
     * what he said rather than picked off the menu (`GENERATOR §2`, `EE-BRIEFING §3`).
     */
    let plan: Plan | undefined;
    if (planArg) {
      const skeleton = skeletonById(planArg);
      if (skeleton) plan = planFromSkeleton(skeleton);
      else {
        const loaded = readJson(planArg) as Plan;
        if (!loaded?.packages || typeof loaded.closerFrom !== "number") {
          fail(
            `"${planArg}" is neither a skeleton id (${SKELETONS.map((s) => s.id).join(", ")}) ` +
              `nor a plan file with "packages" and "closerFrom" — see docs/spec/GENERATOR.md §2.`,
          );
        }
        plan = loaded;
      }
    }

    // Deliberately not a score. A deck is a set of trade-offs and a number hides which
    // ones were chosen (D-016).
    process.stdout.write(
      `${JSON.stringify(
        {
          ...review(deck, index),
          /**
           * ⚠️ **The counts, not just the notes about them.**
           *
           * `review()` computes these to decide what to say and then threw them away, so a
           * capability only reached the reader when it crossed a threshold worth a sentence.
           * `defenders` is the case that exposed it: the `hold`-plan check fires at **zero
           * only** — deliberately, because no source publishes a target and inventing one
           * would author doctrine inside a check (D-016). A deck with *one* [Tank]/[Shield]
           * body on a holding plan is therefore met with silence, and silence there is
           * indistinguishable from "nothing to report".
           *
           * A count is a fact and costs nothing to state. The judgement stays the builder's.
           */
          capabilities: capabilities(deck, index),
          archetype: readArchetype(deck, index),
          mulligans: simulateMulligans(deck, index),
          ...(plan
            ? {
                plan: reviewAgainstPlan(deck, plan, index),
                battlefields: reviewBattlefields(
                  deck,
                  index,
                  new Set((plan.battlefields ?? []).map((b) => b.cardId)),
                ),
              }
            : {}),
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  const result = checkLegality(deck, index);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.legal ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
