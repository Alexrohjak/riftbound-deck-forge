# Forge

A personal deckbuilding workbench for [Riftbound](https://playriftbound.com/),
Riot Games' League of Legends trading card game.

> **Status:** ✅ **The Workbench builds decks.** [Forge is a working deckbuilder](https://forge.alexander-rohde-jakobsen.workers.dev) over **all 935 cards** — search, alternate arts, live legality, the energy curve, saved as you go · **many decks** ([D-060](docs/DECISIONS.md#d-060)), **card entry built in** (`+ Add cards`), deck and collection **import**, **[the log](docs/spec/LOG.md)** and **EE on screen** · ✅ **`W3` is closed — a complete legal deck has been built end to end on desktop *and* phone**, which brought **commitment** (sleeved cards leave the pool and say which deck holds them), **the Bench**, and **[D-061](docs/DECISIONS.md#d-061): runes are no longer collected** · 🏁 **`W4` is closed and the Workbench track is done** — 🟢 facts and 🟡 probabilities, visually separated, with the **rune feasibility curve** no other Riftbound tool can compute · ✅ **EE answers every deckbuilding question it specified** — `card`, `threats` and `sideboard` shipped, and the engine reads printed text rather than tags ([EE-COMPLETION](docs/EE-COMPLETION.md)) · 🎯 **`S6` is built and now partly proven** — **three games are logged** (two `1v1v1` at 1–1, and a `1v1` loss to Vi on 2026-08-25), the log records the **shape of the table** ([D-066](docs/DECISIONS.md#d-066)), and playing and building with it has found **five defects no test caught**; the remaining gate is `G7`, wiring `matches.symptoms` to the plan. `S1a` stays deliberately out of scope and `Q-LINE` stays refused · **nightly backups run off-vendor**

---

## The Problem

Riftbound cards come from random pack openings. Every published guide and netdeck
assumes a card pool you don't have, which makes them aspirational rather than
actionable.

Forge inverts the question:

> **Given the cards I actually own, what can I legally and effectively build?**

---

## What It Will Be

**The Workbench**
Catalogue the cards you physically own, then browse, filter and assemble decks by hand
with live rules validation and honest statistics. Cards sleeved into a built deck stop
being available — and always show which deck holds them. The same app on desktop and
phone, fully editable on both.

**The Strategist (EE)**
Ask questions about your cards, decks and matchups; get answers grounded in a
deterministic rules core. *"What's this card good at? How do I pilot this deck? What
should I fear? What do I sideboard against Diana?"* Not a report — a conversation, where
every answer traces back to the rulebook and the real card pool.

**Generation** *(part of the Strategist)*
Propose decks from cards you own — seeded on a Legend or a few cards you like, driven by a
playstyle, or aimed at a problem: *"I keep losing to this deck, what beats it?"* The
objective always comes from you, so nothing is ever scored — Forge proposes candidates and
explains them ([D-041](docs/DECISIONS.md#d-041)).

---

## 📍 Start here — how to pick this up

*Last worked on 2026-08-27. This section is the recipe; the live status board is
[`docs/ROADMAP.md`](docs/ROADMAP.md).*

> ## 🎯 Pick this up here — four decks sleeved, and three statistics that lie
>
> **All four real decks are `BUILT`** — Ahri (calm+mind), Ambessa (body+order), Rengar
> (fury+body), Zed (fury+chaos). Verified 2026-08-27: **nothing is over-committed** across the
> four, champion copies counted. The three `TEMP — Draven` decks and `Draven — Executioner's
> Tempo` are still `DRAFT` and hold nothing.
>
> ### ⚠️ Three measures read as healthy while describing something else
>
> All three were found **by playing the decks**, not by a test — and two of them changed a
> deck decision this session.
>
> | Measure | What it actually says | Cost |
> |---|---|---|
> | **`earlyPlays`** | Counts every card costing ≤2, **spells included**. Alexander's ruling: *"turn one plays only include units — consider card draw or rune channelling, yes, but they specifically refer to units."* Ambessa read **19**; it is **8 bodies** | Annotated in `advice/shape.ts`, **not changed** — `archetype.ts` gates aggro on `>= 9` and `doctrine.ts` on `COMMUNITY.earlyPlays*`, all calibrated against the spell-inclusive count |
> | **`engine`** | Noise for `unit_played` and `combat_win` Legends. Rengar reports **27** against a target of 8–10 that is arithmetically unreachable — every unit supplies `unit_played` | The `combat_win` half is **fixed** (`skeletons` no longer calls a whole Legend unbuildable). The `unit_played` half is **open** |
> | **`runeFeasibility`** | Answers *"can I cast this ONE card"* and assumes *"no recycling on earlier turns"*. **Blind** to a whole curve of Power costs draining the board | Rengar was at **28 of 40 cards costing Power** and could not deploy its own top end. Rebuilt to **5** |
>
> ### 🔑 Paying Power recycles a rune off the board
>
> You channel 2 a turn; every Power symbol paid cancels half a turn of it, and Energy comes
> from exhausting runes still standing. **The meta rule: every body you deploy on curve is
> power-0.** Power belongs on cheap reactive spells and the odd expensive ambush unit — never
> on the bodies you play every turn. Current density: **Rengar 5 · Ambessa 9 · Zed 11 ·
> Ahri 15** — ⚠️ **Ahri is now the worst offender and has never been checked against this.**
>
> ### Each deck should carry one piece of spice
>
> Every skeleton reserves `spice: 1` and [`advice/skeleton.ts`](packages/engine/src/advice/skeleton.ts)
> **deliberately refuses to fill it** — its value is meta knowledge [D-035](docs/DECISIONS.md#d-035)
> says Forge will never have. Left alone it silently becomes a filler singleton. Rengar's is
> `Brynhir Thundersong` — *"opponents can't play cards this turn"*, which makes an alpha strike
> uninterruptible. **Ambessa's is still unfilled.**
>
> ### Next, in order
>
> 1. **Ambessa**: `defenders: 0`, 17 of 40 cards at two energy against 9 at three, and `Kayle,
>    Justified` is a 1-of that cannot be duplicated from the collection
> 2. **Ahri**: re-read against the Power lens — 15 power-costing cards, unexamined
> 3. **The `unit_played` engine noise** — the mirror of the `combat_win` bug already fixed
> 4. **Shopping list**, in priority order: `Kai'Sa, Survivor` · `Nidalee, Cat Form` ·
>    `Irresistible Faefolk` · `Grim Apothecary` (all four in every meta Rengar list) · more
>    `Kayle, Justified`
>
> ---
>
> ## Previously — five decks, two games logged, and four defects found by using it
>
> **[D-064](docs/DECISIONS.md#d-064) is built end to end** — a deck is built to a **plan**, and
> the plan is measured where the deck is written, so nobody can forget to look. **On top of it,
> [`EE-COMPLETION.md`](docs/EE-COMPLETION.md) is closed:** the three questions
> [`EVALUATION §6`](docs/spec/EVALUATION.md) specified and nothing answered now answer, and the
> engine reads **printed text** rather than tags.
>
> | Piece | What it does |
> |---|---|
> | `advice/packages.ts` | What each card is **for** — `scoring` · `engine` · `interaction` · `closers` · `coreUnits` |
> | `advice/skeleton.ts` | Four `pace × objective` templates, each target carrying who holds it |
> | `advice/plan.ts` | Package deltas, curve shape, and the **second yardstick** |
> | `advice/battlefields.ts` | One-sided / symmetric / restriction, with cannot-hurt-me as the floor |
> | `mechanics.ts` + `advice/mechanics.ts` | **The table moved into the engine** — every finding quotes the printed clause that produced it |
> | `advice/tokens.ts` | **What to bring in the box** — read off printed text, because 4 of the 11 tokens were never printed as cards ([D-065](docs/DECISIONS.md#d-065)) |
> | `advice/card.ts` | **Q-CARD** — the printed text *first*, then what it charges you |
> | `advice/threats.ts` | **Q-THREAT** — run from *your* deck outward, not from theirs |
> | `advice/sideboard.ts` | **Q-SIDEBOARD** — the ten-card board, `L16` headroom subtracted up front |
> | `simulateMulligans` | How often an opening cannot act before turn three |
> | `scripts/audit-knowledge.mjs` | What the cards say against what Forge models |
>
> ```bash
> npm run state                                    # first thing, every session — now brings the plan down too
> node apps/cli/dist/index.js skeletons --legend <id> $P
> node apps/cli/dist/index.js card --card <cardId> $P   # read the card before arguing about it
> node apps/cli/dist/index.js threats deck.json $P
> node apps/cli/dist/index.js sideboard deck.json --against <legendId> $P
> npm run deck -- <proposal.json> --name "…" --plan <plan.json> --dry-run
> npm run audit:knowledge
> ```
>
> ⚠️ **`apps/cli` is not built by `npm run build`.** It is not deployed, so the deploy gate
> skips it — after pulling, `npm run build -w @forge/cli` or the new commands are simply absent.
>
> ### ⚠️ The two rules that were broken the moment they were written
>
> Both are in [`EE-BRIEFING.md`](docs/EE-BRIEFING.md) §3 and both cost a rebuild:
>
> 1. **Naming cards and mechanics is not stating an intent.** *"An Ambessa deck focused on
>    Respected and Feared, I like Profiteer"* is a **seed**. If you cannot name the **pace**
>    and **conquer-or-hold**, you have no plan — offer two or three distinct directions with
>    their owned counts and honest weaknesses, and let him pick.
> 2. **Read the card. Do not build from the tag.** `Cruel Patron` reads *"as an additional
>    cost, kill a friendly unit"* and three copies shipped in a deck built to hold
>    battlefields with bodies.
>
> ### On the Workbench: eight decks, four sleeved
>
> | Deck | Legend | Identity | State |
> |---|---|---|---|
> | `Ambessa — Orange Might` | Matriarch of War | body+order | **BUILT** |
> | `Ahri — Hold the Line` | Nine-Tailed Fox | calm+mind | **BUILT** |
> | `Zed — Shadow Flow` | Master of Shadows | fury+chaos | **BUILT** |
> | `Rengar — Pridestalker` | Pridestalker | fury+body | **BUILT** |
> | `Draven — Executioner's Tempo` | Glorious Executioner | fury+chaos | DRAFT |
> | `TEMP — Draven Hybrid` · `Midrange` · `Armory` | Glorious Executioner | fury+chaos | DRAFT, **scratch** |
>
> ⚠️ **Only the two `BUILT` decks hold cards out of the pool** ([D-017](docs/DECISIONS.md#d-017)).
> Mark a deck BUILT when you physically sleeve it — that is what makes commitment real.
>
> ⚠️ **The three `TEMP —` decks are an unfinished decision.** They were built on 2026-08-26 as
> three Draven directions to choose between, and they read as three *archetypes* — aggro,
> midrange and combo — while all three carry the **same** `slow-conquer` plan. That is one
> plan built three ways, not three directions, and it is the §3 rule below going wrong in the
> other direction. **Pick one and give it its own plan, or delete all three** — leaving them
> is what makes `npm run state` say nine decks.
>
> ⚠️ **The played Ambessa list no longer exists.** All three logged matches name deck hash
> `012aa1c9…`; the sleeved deck now hashes `1c0de3da…` — it was rebuilt on 2026-08-26, from 27
> slots to 29, and renamed. The hash is doing exactly its job ([`LOG.md`](docs/spec/LOG.md)),
> and the consequence is that **the deck currently in sleeves has no games behind it.**
>
> ⚠️ **And the rebuild does not obviously answer the loss.** The 2026-08-25 note reads *"a
> surplus of units … no spells and therefore lack of removal"* (`out-of-gas`, `cannot-remove`,
> `threats-die`). The new list sits at **interaction 8**, the floor of its own 8–12 band,
> **coreUnits 19** against a floor of 9, and **engine 12 against a target of 6–9 — the only
> package out of band.** It measures as *aggro* against a plan that states `slow` · `conquer`.
> Read it with `review --plan` before sleeving it again.
>
> ⚠️ **Only Ambessa has been played**, and only three games. Every number on the other decks is
> about shape, not about winning. `G7` still stands: `matches.symptoms` is **not yet wired to
> the plan**, so a complaint is still evidence about a *capability* rather than about a
> **package**. ⚠️ **Its concrete blocker is one query** — `scripts/pull-state.mjs` reads
> `collection`, `decks` and `deck_slots` and **never `matches`**, so the state file every
> session starts from contains no symptoms at all.
>
> ### Contention is only ever shared domains
>
> A Legend's identity is exactly **2 domains**, every card's domains must fit inside it (L8–L10),
> and **there are no colourless main-deck cards at all** — 1,666 owned copies, all mono-domain
> but 18. So two decks contest **only the domains they share**, and nothing else. Two decks with
> no shared domain contest literally zero cards.
>
> After the five real decks take their cards, every domain pair still leaves **67–82 playsets**
> against the ~13 a 40-card deck needs. Volume is not the constraint here and never has been.
>
> ⚠️ **A Legend is a character, not a colour pair.** L18 ties the Chosen Champion to the
> Legend's champion tag, so the character *fixes* the identity — Draven can only be Glorious
> Executioner (fury+chaos), Fiora only Grand Duelist (body+order), Kennen only Heart of the
> Tempest (order+chaos). Picking a Legend by its domains produces an **illegal** deck, which is
> how a session was spent proposing Irelia's Legend for a Draven deck.
>
> ### ⚠️ The first real games were `1v1v1`, and the log could not describe them
>
> [**D-066**](docs/DECISIONS.md#d-066) — a match now records the **shape of the table**
> (`1v1` · `1v1v1` · `2v2`), and **formats are never pooled**. Par is 50% heads-up and **33%**
> in a three-way pod, so a combined rate describes no game anyone played — and it arrives with
> a bigger `n`, which makes it look *more* trustworthy than the honest figures it replaced.
> Matchups exist only in `1v1`, symptoms aggregate within a format, and games in another format
> are always named rather than silently dropped.
>
> ✅ **The migration has been run against production** (2026-08-16) — `matches.format` is live.
>
> ⚠️ **Recording a format is not modelling one.** Everything EE says — `threats`, `sideboard`,
> the battlefield reads, the plan yardsticks — is heads-up doctrine, and nothing in the engine
> knows what a third player at the table does to a board.
>
> ### ✅ Three games are logged — and logging them found three more defects
>
> **The deck has been played.** Two `1v1v1` games on 2026-08-16, **1–1**, both against Viktor
> and Ivern, and a `1v1` **loss** to Vi on 2026-08-25 (`1-2`, *"loads of units with assault
> making it hard to hold battlefields"*). All three have notes. `G7` still stands (symptoms are
> not wired to the plan), but the record is no longer empty.
>
> Entering them broke the log three ways at once, and all three are fixed
> ([`LOG.md §2`](docs/spec/LOG.md)):
>
> | Defect | Fix |
> |---|---|
> | The form shipped with **`Won` pre-selected**, so both games saved as wins — one had been lost | Nothing is pre-selected; `Log it` is disabled until a result is picked |
> | Win/loss was typed into the **score** field as `1-0` / `0-1` | Relabelled *"Games, if several"* — and `validate()` now **rejects a row whose score contradicts its result** |
> | The panel showed **only aggregates** — notes were stored and invisible, and a wrong row needed a database console to fix | The games are listed with their notes; tap one to correct it, same id, upserted |
>
> ⚠️ **The validation is the load-bearing fix.** The form is one of two writers (D-047) and the
> CLI would have accepted the same contradiction happily.
>
> ### ✅ Building a Draven deck found three more measurement defects
>
> All three were found by **using the tool on a real deck**, not by a test — the pattern this
> project keeps repeating. The third is the sharpest case: [`synergy.ts`](packages/engine/src/advice/synergy.ts)
> had already written the rule down — *"callers must emit `null` for anything that is not
> `counted`"* — and `feasibility` was the one caller that did not.
>
> | Defect | What it did | Fix |
> |---|---|---|
> | **`coreUnits` was exclusive** | Pridestalker rewards `unit_played`, so `engine` claimed every body first. A **29-unit** deck reported `coreUnits` **0** against Riot's 9+ floor, and `engine` **25** against 8–10 | `coreUnits` is now an **overlay** — a body counts as a body whatever else it serves. Rengar reads **25** |
> | **The early-play note asserted a threshold** | *"Past about 9 the odds barely move"* covers both an 8-point gap (9→12) and a 0.07-point one (22→23), and a deck reported **100%** to open turn one | The note now **computes** what the surplus bought, per deck. `source` moved from `community`/`doctrine` to `computed`/`probability` |
> | **`skeletons` reported a hole in Forge as a hole in the boxes** (2026-08-26) | Draven's reward `combat_win` is `self-satisfying`, so nothing could ever fill `engine` — and all four plans came back `supportable: false` on *"engine: 0 owned, 6 needed — 6 short"*. **15 of 49 Legends** were affected, Ahri's among them | `Feasibility` carries `unmeasurable` and `PackageSupply` carries `measured`; an unmeasured package makes no gap and cannot decide `supportable`. Draven now returns **four** plans |
>
> ⚠️ **Three percentages in the codebase were folklore.** `COMMUNITY`'s own doc said 7–9 early
> plays gives *"roughly 78 / 83 / 87%"* — the computed values are **77 / 82 / 86** — and a note
> quoted *"about 83%"* for 8, which is **82%**. Illustrative numbers written beside the function
> that computes the real ones, exactly as [`DECK-STATS.md`](docs/spec/DECK-STATS.md) recorded
> for the flagship statistic. `earlyPlays.test.ts` now pins the curve.
>
> ⚠️ **`pct()` rounded 99.9% to "100%"**, which asserts an opening *cannot fail*. It renders
> `>99%` now — saturated, not guaranteed.
>
> ### ⚠️ Netdecks are built on a banned card
>
> Both S2 Regional lists for Draven (Chengdu top-8, Fuzhou 1st, December 2025) are built around
> **`Draven, Vanquisher`** — **banned in Constructed 1v1** by the **2026-07-16** list, along with
> `Fight or Flight` and the `Obelisk of Power` battlefield. The deck gate refused to write the
> deck, which is what that check is for. **Check `data/banlist.json` before copying any list.**
> ⚠️ **The two older decks were deleted** on request (2026-08-15). Recoverable from the
> `backups` branch snapshot of 2026-08-11, which holds both.
>
> ### ⚠️ The deck and its stored plan disagree, and that is the thing to settle first
>
> Its stored plan is **`slow-conquer`** — pace `slow`, objective `conquer`, *"out-resource them,
> then take the points you need in a short window"*. Measured against that plan, `review` says:
>
> | Reading | Number | Why it matters against **this** plan |
> |---|---|---|
> | `engine` package | **18** vs target 6–9 | `+9` over — the chain grew past the plan that holds it |
> | `coreUnits` | **5** vs min 9 | `−4` under Riot's Primer floor |
> | `draw` | **0** | *Out-resource them* with no card draw is the plan arguing with itself |
> | archetype classifier | **aggro**, weak confidence | 14 turn-one plays, average Energy 3.2 — the shape reads fast, the plan says slow |
>
> ⚠️ **Do not "fix" the deck to the plan, or the plan to the deck, without asking.** Which one
> is wrong is an intent question, and rule 1 above is exactly about not answering it silently.
>
> ⚠️ **An earlier draft of this section said the objective was *hold* and pointed at
> `Towering Combatant`.** The stored plan says `conquer`, so that finding was resting on a pace
> nobody had confirmed. `defenders` is **1** of **25** bodies — a fact `review` now returns; the
> check still fires at zero only, deliberately (commit `0f53b60`), because no
> source publishes a target and a band would be doctrine authored inside a check.
>
> ### Next, by weight
>
> `npm run audit:knowledge` reports **0 of 921 cards carrying a mechanic nothing can act on**,
> down from 185 (20%).
>
> ⚠️ **That 0% flatters the depth and should not be reported as "everything is modelled".**
> `additional-cost` and `level-threshold` produce real findings with quoted clauses;
> `accelerate` and `repeat` get a single shared caveat about the curve.
> [`EE-COMPLETION.md`](docs/EE-COMPLETION.md) §6 says so at length.
>
> The open work is no longer knowledge — it is **evidence**. `S6` is *built, unproven*, and
> [`G7`](docs/spec/GENERATOR.md) wires `matches.symptoms` to the plan; until a real game is
> logged every number here describes shape rather than winning. `S1a`, the rules core, stays
> out of scope and `Q-LINE` stays refused ([D-062](docs/DECISIONS.md#d-062)).
>
> ### ✅ Settled: `X8` is healthy
>
> The `backups` branch committed **2026-08-15** and **2026-08-16**, both at 685 printings,
> matching the live collection. The cron (`12 3 * * *`, UTC) only commits when content changes,
> so silence after a quiet day is normal — a gap *plus* a changed collection is the thing to look at.

**Where things stand.** 🔓 The whole design track is done and `DESIGN LOCKED` has lifted.
✅ **`F1`, `F2` and `F3` are all closed** — Forge is live, private, deploys itself on every push
to `main`, and **is now a deckbuilder you can actually use** (§4).

✅ **`W2` is closed — Forge runs on your cards now.** **672 printings / 1,550 copies**,
entered through `+ Add cards` inside Forge rather than through the standalone tool.
⚖️ **`W1` is done** too: all 33 legality checks, with the rulebook's own 13 worked examples
as tests.

🏁 ✅ **`W3` is closed — a complete legal deck has been built end to end, on desktop and on a
phone.** Closing it took three things that only a *finished* deck could surface: the
**commitment model** ([D-017](docs/DECISIONS.md#d-017)) had never been wired to the browser, so
two decks could both claim your only copy of a card; **the Bench** table had sat in the schema
since Discovery with nothing ever writing to it; and **[D-061](docs/DECISIONS.md#d-061)** —
the first complete deck reported twelve copies short of runes and could therefore never be
marked as built. Runes have left the collection entirely.

> 🏁 ✅ **The `W2` spot-check has now been run, and passed.** Twenty printings — 66 copies —
> counted against the boxes with every one matching, then ten cards pulled physically at
> random and found in Forge. The milestone is closed on **evidence** rather than judgement,
> which it had been since the 7th. Both halves mattered: a sample of rows that already exist
> can only catch a wrong count, never a pile you never entered.
>
> ⚠️ **One gap remains, deliberately.** **`OGS` is not entered** — the 24-printing Origins
> supplement inside Proving Grounds — so everything reading ownership calls those 24 unowned.
> True until the set goes in, and the one place Forge will be confidently wrong about your
> boxes.

🏁 ✅ **`W4` is closed, and with it the whole Workbench track** — the point the plan marks as
*"if the project stopped here it would still be worth having"*. Statistics come in two tiers
that cannot be mistaken for each other, and the flagship **rune feasibility curve** computes
exactly. It also corrected a **fabricated figure in its own spec**, which had illustrated the
flagship with a number no model produces.

**🎯 Next is `S1a`** — the rules engine core, 🔴 the largest single component in the project.
⚠️ **Rules must be data, not code**: 21 cards rewrite rules an engine would hardcode.
✅ **`X8` is closed** ([D-051](docs/DECISIONS.md#d-051)):
a nightly cron commits a JSON snapshot to this repo rather than to R2, because a backup in
the same Cloudflare account does not survive losing the account. **Live and proven in
production** — §5.

### 1 · Enter cards — in Forge, not in the tool

**`+ Add cards` in the toolbar** is where entry lives now. Pick a set, type collector
numbers, matches appear as you type, `⏎` adds — and it writes straight to D1, so there is no
export step and nothing to lose. Turning it on also turns on the Owned view, because entering
cards and seeing what you own are the same activity.

> The standalone [collection tool](tools/collection/) still works and still exports the same
> `forge.collection/1` JSON, which the app imports. It is now the **fallback**, not the
> route: it took six steps per card and the round trip through a file is exactly what made it
> a tool you abandon.

```bash
cd ~/code/riftbound && git pull
cd tools/collection && python3 -m http.server 8000     # → http://localhost:8000
```

### 2 · What was decided on 2026-08-03

Seven decisions closed `D2` and `D3`. The two that reshape the most work:

| # | Decision | Effect |
|---|---|---|
| [**D-043**](docs/DECISIONS.md#d-043) | **EE is a rules engine with a swappable mouth** — the mouth is Claude Code against exported state | `S3`/`S4` retired; new `S6` at a fraction of the size; **X1 and E1 dissolved** |
| [**D-047**](docs/DECISIONS.md#d-047) | **One TypeScript rules package, two consumers** — the browser and Claude Code import the same engine | Prevents two implementations of `W1`, the highest-correctness-risk component |
| [**D-048**](docs/DECISIONS.md#d-048) | **Nothing is always-on** — static bundle, one edge function, managed SQLite on Cloudflare | **£0/month, verified.** A6 upheld, X5 resolved as a side effect |
| [**D-044**](docs/DECISIONS.md#d-044) · [**D-045**](docs/DECISIONS.md#d-045) · [**D-046**](docs/DECISIONS.md#d-046) · [**D-049**](docs/DECISIONS.md#d-049) | `S1` splits · tier by answer-part · `D2` closed · offline is read-only | See [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the decision log |

**Three calls were mine rather than yours**, all flagged in the decisions and all cheap to
reverse: pips cap at three (a fourth copy is unplayable under
[L13](docs/spec/LEGALITY.md)); EE's answer budget is 1 statement / ≤2 lever sentences / ≤3
grounding lines; and **editing requires connectivity** — offline you can look but not edit
([D-049](docs/DECISIONS.md#d-049)), which is a real limitation at a table with no signal.

### 3 · Run the workspace

`packages/engine` is the real thing — pure TypeScript, ⚖️ **all 33 legality checks**,
the energy curve, commitment, the log's honesty thresholds, 432 tests:

```bash
npm install
npm run check      # docs · engine purity · typecheck · tests · build
npm run dev        # the web app alone, on http://localhost:5173

# The whole thing — Worker, SPA and a local D1 — on http://127.0.0.1:8787
npm run build
npm run db:init:local -w @forge/api    # first run only
npm run dev -w @forge/api
```

**Prove the architecture in one command** — the same package, called headlessly the way
Claude Code will call it:

```bash
npm run build -w @forge/cli
node apps/cli/dist/index.js legality <deck.json> --cards <cards.json>
node apps/cli/dist/index.js log <matches.json> --cards <cards.json>

# S5 — deck generation. The engine states the constraints; the caller chooses the cards.
node apps/cli/dist/index.js brief --legend <cardId> --pool apps/web/public/cards.json
node apps/cli/dist/index.js validate <proposal.json> --legend <cardId> --pool apps/web/public/cards.json

# D-064 — a deck is built to a PLAN, and read against it.
node apps/cli/dist/index.js skeletons --legend <cardId> $P        # the plans your pool supports
node apps/cli/dist/index.js brief --legend <cardId> --plan fast-conquer $P
node apps/cli/dist/index.js review <deck.json> --plan fast-conquer $P

# Put a proposal on the Workbench, sideboard and all. Runs the 33 checks first and
# refuses to write an illegal deck. Writes decks/deck_slots only, never the collection.
npm run deck -- <proposal.json> --name "Grand Duelist vs Ivern"
```

`brief` returns the Legend's ability text, every card legal under its identity, the targets
and what you own. `validate` returns **instructions rather than complaints** — *"add 3 more
Main Deck cards"*, not *"found 37"* — and catches card ids that do not exist, which no
legality check can: an unknown printing falls back to its own id as a name, so forty invented
cards would pass every count.

`log` is the same engine reading the [match record](docs/spec/LOG.md) — and it is where the
restraint shows: below 10 matches it returns `rate: null` with a `withheld` sentence saying
why, rather than a percentage from four games.

`--cards` takes either `"<name>"` or `{ "name", "domains", "energy" }` per printing;
supplying domains is what turns on the Domain Identity checks. The result's `checked`
list always says which checks actually ran.

### 4 · `F2`/`F3` — Forge is a deckbuilder over the whole pool

**[forge.alexander-rohde-jakobsen.workers.dev](https://forge.alexander-rohde-jakobsen.workers.dev)**
— sign in with your email; nobody else gets in.

| Piece | State |
|---|---|
| **The deckbuilder** | **All 935 cards** behind a search box — the browsing tab holds **854** of them, since battlefields and runes have their own tabs and tokens can never be registered. Pick any of the 49 Legends and an eligible Champion, tap to add and remove, saved to D1 as you go |
| **Many decks** | Start one, rename one, destroy one, switch between them ([D-060](docs/DECISIONS.md#d-060)). A deck imports from a list, and so does the collection |
| **Alternate arts** | Collapsed behind each card; pick which printing a deck slot uses, and **the tray draws the printing you picked** |
| **Live legality** | ⚖️ **All 33 checks**, including the ban list, the Signature cap and `[Unique]`. Violations name the check *and* its rulebook citation. Ownership appears as a **warning**, never a violation — but the **workshop will not take more copies than the boxes hold** ([DATA-MODEL §2](docs/spec/DATA-MODEL.md)) |
| **Commitment** | A deck marked **Built** takes its cards out of the pool, and an unavailable card **names the deck holding it** ([D-017](docs/DECISIONS.md#d-017)). Promotion is refused while another deck holds the cards — the one place ownership hardens into a gate. ⚠️ **Runes are exempt** ([D-061](docs/DECISIONS.md#d-061)) |
| **The Bench** | Cards parked while you decide, saved with the deck. **Never validated, never committed** — structurally, not by discipline: the engine's `Deck` type has no bench on it |
| **The energy curve** | A histogram, never a mean ([DECK-STATS §6](docs/spec/DECK-STATS.md)). Cards with no cost data are kept out of the buckets rather than folded into zero |
| **One Worker, one origin** | Serves the SPA *and* the API ([D-050](docs/DECISIONS.md#d-050) — Cloudflare closed Pages to new projects) |
| **D1** | `forge`, schema applied. Decks, slots, bench, deck history, matches, events — and the **real collection: 672 printings / 1,550 copies**, every set but `OGS` |
| **Zero Trust Access** | Self-hosted app, allow-list of one email, 7-day sessions. Verified enforcing |
| **Automatic deploys** | `main` → build → deploy, via Workers Builds. **`npm run build` is the gate** — see below |

**Deploying by hand is no longer the way.** Push to `main` and Cloudflare builds it. Preview
builds for other branches are deliberately **off**: they would inherit the same D1 binding, and
there is only one database — a branch build would write to the collection.

> 🔒 **The build gates itself, because nothing else can.** Workers Builds deploys on every push
> to `main` and **does not wait for GitHub Actions** — so a gate that lived only in CI would let
> a failing test ship while CI went red beside it. `npm run build` therefore runs engine purity,
> typecheck and the full test suite *before* it emits a single asset: a red test means exit 1 and
> an empty `dist/`, so there is nothing to deploy. Verified by deliberately failing a test.
>
> `npm run check` is that plus the docs check. **The docs check is deliberately outside the
> build** — a drifted count should fail review, not a production deploy, and keeping `python3`
> off the deploy path means the build cannot break on a container that lacks it.
>
> ✅ **Verified wired, 2026-08-04.** Cloudflare's **Workers & Pages → `forge` → Settings →
> Builds** reads `npm run build`, then `npx wrangler deploy --config apps/api/wrangler.toml`.
> The first gated deploy passed there, which also proves `vitest` resolves in Cloudflare's
> build container — the gate cannot silently become a blockage.
>
> ⚠️ **If that field is ever changed, the gate stops running.** It lives in the dashboard and
> **cannot** be set from `wrangler.toml` — Workers Builds ignores Wrangler's custom-build
> config — so nothing in this repo can defend it. Check it after any dashboard work.

**What `F2` asks of you:** use it, and report what feels wrong. That feedback reshapes
everything after it — which is the entire reason `F2` came before the card pool.

`F3` landed the full pool: **935 cards / 1,180 printings**, generated by
[`scripts/build-card-index.mjs`](scripts/build-card-index.mjs) and served as a **101 KB
gzipped** asset, fetched rather than bundled so a UI change does not re-download it.
Alternate arts collapse behind the card they belong to and are selectable per deck slot;
banned cards are **shown with a badge, never hidden**; champion tags are derived from
Signature cards (L32 — 49 of 49 Legends, including the Yordle/Kennen trap).

> ⚠️ **`decks.plan` needs a one-off migration on the live database** ([D-064](docs/DECISIONS.md#d-064)).
> `schema.sql` carries the column for a fresh database, but `CREATE TABLE IF NOT EXISTS`
> cannot add one to a table that already exists:
>
> ```bash
> cd apps/api && npx wrangler d1 execute forge --remote --file=./migrations/001-deck-plan.sql
> ```
>
> Existing decks keep `NULL`, which means *"built without a stated plan"* and is a real answer
> rather than a gap to backfill. **Re-running it errors** with `duplicate column name`, which
> is the safe failure. ⚠️ The `PUT` deliberately **preserves** a stored plan when the body
> omits one — the app has been saving decks since long before plans existed, and clearing it
> on an unrelated edit would be silent data loss. Clearing has to be typed: `"plan": null`.

### 5 · `X8` — the nightly backup ✅ live

**Running.** It reads D1 at 03:12 UTC and commits a
JSON snapshot to the **`backups` branch of this repo** — a different vendor from the data
it protects, which is the whole point ([D-051](docs/DECISIONS.md#d-051)). Cloudflare's own
Time Travel covers 7 days on the free plan; this covers everything else.

**Proven in production, 2026-08-04**, by temporarily running the cron every five minutes:
the first snapshot landed as `b7b1b41` on `backups`, and the runs after it committed nothing
because the content had not changed. Both halves verified — it writes, and it stays quiet.

The `GITHUB_TOKEN` secret is fine-grained, scoped to this repo, contents-write only. If it is
ever lost or rotated, the backup **skips cleanly and logs why** rather than throwing, and is
restored with:

```bash
cd apps/api && npx wrangler secret put GITHUB_TOKEN   # GITHUB_TOKEN is the NAME
```

⚠️ The value goes in at the interactive prompt, never on the command line — anything passed
as the argument becomes the secret's *name*, which is displayed in plaintext in the dashboard.

The `backups` branch is an orphan — it shares no history with `main`, so the snapshots
never mix with the code. Restoring is a load, not a migration:

```bash
# The snapshot's `collection` field is exactly what the importer accepts.
jq '.collection' forge-state.json > restore.json     # from the backups branch
```

Then load `restore.json` with **Import a collection file** in Forge's *Owned* view.

> ⚠️ **Do not `curl` it.** Cloudflare Access answers an unauthenticated request with a `302`
> to its login page, so the request never reaches the Worker — the upload looks like it
> succeeded and writes nothing. A signed-in browser carries the session cookie automatically,
> which is why the importer lives in the app ([D-058](docs/DECISIONS.md#d-058)).

> **Why the repo and not R2.** An R2 bucket lives in the same Cloudflare account as the
> database it backs up — it insures a bad write, not losing the account, and Time Travel
> already covers the first case. Adding an R2 subscription would bill against a card on
> file to cover a risk that was already covered. Full reasoning in
> [D-051](docs/DECISIONS.md#d-051).

### 6 · `S6` — asking EE a question

**EE's mouth is this terminal** ([D-043](docs/DECISIONS.md#d-043)), and
[**`docs/EE-BRIEFING.md`**](docs/EE-BRIEFING.md) is what binds it: the answer budget, the
tiering, the never-list, and the rule that matters most — **every number in an answer comes
from a tool call actually made**.

```bash
npm run state          # live D1 → state/forge-state.json. First thing, every session.

P="--pool apps/web/public/cards.json --collection state/forge-state.json"
node apps/cli/dist/index.js legend   --legend <cardId> $P   # what goes in this Legend
node apps/cli/dist/index.js around   --card   <cardId> $P   # build around my one copy
node apps/cli/dist/index.js counter  --legend <cardId> $P   # what beats this Legend
node apps/cli/dist/index.js mechanic --name   <tag>    $P   # play around this mechanic
```

⚠️ **Without `--collection` every ownership number is zero**, and an answer built on that is
confidently wrong about the one thing Forge exists to know. `state/` is gitignored: it changes
whenever you enter a card, and a stale copy in git would be worse than none.

⚠️ **The four tools return data, never prose.** A tool that could write the sentence could
invent it. Judgement comes from the mouth reading them beside
[`reference/`](docs/reference/) — 39,000 words covering all 49 Legends, all 814 main-deck
cards and both rulebooks.

---

> 📄 **Write a document when there is something to record, not to feel productive.**
> This replaces the blanket "stop writing documents" rule, which had done its job: it was
> written when the project had ~66,000 words of docs against a few hundred lines of code,
> and that ratio has since corrected itself. A new document now needs an **explicit need** —
> knowledge that has nowhere else to live and would be lost or re-derived without it.
>
> Everything else still holds: update a doc's **existing home** rather than starting a
> rival, and run [`tools/check-docs.py`](tools/check-docs.py) afterwards, which fails when
> the docs contradict each other. Prose that merely restates the code is still a liability.

---

## Documentation

**Start with the roadmap.** [`ROADMAP.md`](docs/ROADMAP.md) answers *"where are we?"* —
status board, milestones, dependencies. [`spec/OVERVIEW.md`](docs/spec/OVERVIEW.md) is the
system map and **where to put a new idea**.

| Document | Contents |
|---|---|
| [**`docs/ROADMAP.md`**](docs/ROADMAP.md) | **📍 The map — status board, all 16 milestones, dependencies. Start here.** |
| [`docs/roadmap.html`](docs/roadmap.html) | The same roadmap, rendered. Download and open in a browser |
| [**`docs/spec/OVERVIEW.md`**](docs/spec/OVERVIEW.md) | **System map — how everything relates, and where new ideas go. Read before adding a feature.** |
| [`docs/PLAN.md`](docs/PLAN.md) | The detail layer — gates, "done when", validation and risks |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 66 decisions with alternatives and rationale — including five reversals and one vendor-forced amendment |
| [**`docs/EE-BRIEFING.md`**](docs/EE-BRIEFING.md) | **What binds EE when it answers — the answer budget, the tiering, and "never author a number". Read before asking it anything.** |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, non-goals |
| [**`docs/ARCHITECTURE.md`**](docs/ARCHITECTURE.md) | **How it's built — stack, hosting, verified £0/month cost, and what's ruled out. Read before writing code.** |
| [`docs/AUDIT.md`](docs/AUDIT.md) | First-principles audit of the project's own assumptions |
| [`docs/design/`](docs/design/) | 🔒 The **locked** `D2` interface — open the HTML in a browser. A design artifact, not a starting codebase |

### Code

| | |
|---|---|
| [**`packages/engine/`**](packages/engine/) | **The rules, as a pure library.** Imported by both the web app and the CLI — one implementation, two consumers ([D-047](docs/DECISIONS.md#d-047)). all 33 legality checks and the energy curve; the rulebook's own 13 worked examples are tests |
| [`apps/web/`](apps/web/) | The workbench. Static React + Vite bundle |
| [`apps/cli/`](apps/cli/) | **EE's tool surface** — what Claude Code calls. Structured data in, structured data out |
| [`apps/api/`](apps/api/) | One Cloudflare Worker over D1. No idle state |
| [**`tools/collection/`**](tools/collection/) | **The collection tool — keyboard entry over all 1,180 printings, live matches with images, JSON export. Working, and in use.** |
| [`tools/check-docs.py`](tools/check-docs.py) | Fails when the docs contradict themselves — milestone arithmetic, the two status boards, decision counts, links. Run it after editing any planning doc |
| [`scripts/pull-state.mjs`](scripts/pull-state.mjs) | `npm run state` — live D1 into `state/forge-state.json`, so no EE answer is built on a stale file. **Read-only**, and it refuses to write an empty collection: "you own none of that" is a plausible-looking answer and a catastrophic one |
| [`scripts/audit-knowledge.mjs`](scripts/audit-knowledge.mjs) | `npm run audit:knowledge` — **what the cards say against what Forge models.** Reports the mechanics printed on cards that no check can act on, ranked by how many cards carry them. ⚠️ Reports; never edits — a gap is a question for a human, not a licence to author card data ([D-034](docs/DECISIONS.md#d-034)) |
| [`scripts/check-engine-purity.mjs`](scripts/check-engine-purity.mjs) | Fails if the engine imports `fs`, `fetch` or the DOM — that would break one of its two consumers, and it would be the one nobody ran |

### Specification — what we're building

| Document | Contents |
|---|---|
| [**`docs/spec/EVALUATION.md`**](docs/spec/EVALUATION.md) | **EE — the strategist. The questions it answers, and why it synthesises rather than enumerates.** |
| [`docs/spec/DATA-MODEL.md`](docs/spec/DATA-MODEL.md) | Entities, the DRAFT/BUILT commitment model, lifecycle answers |
| [`docs/spec/LEGALITY.md`](docs/spec/LEGALITY.md) | 33 validation checks, 13 tests drawn from the rulebook's own examples |
| [`docs/spec/DECK-STATS.md`](docs/spec/DECK-STATS.md) | What Forge measures, and how honest it is about its own uncertainty |
| [`docs/spec/GENERATOR.md`](docs/spec/GENERATOR.md) | **Generation** — EE in the propose direction: seeded, by intent, or to counter a deck |
| [`docs/spec/LOG.md`](docs/spec/LOG.md) | The match log, deck history and diagnostics — and what the record refuses to claim from a small sample |

### Reference — external facts we don't control

| Document | Contents |
|---|---|
| [**`docs/reference/COMPENDIUM.md`**](docs/reference/COMPENDIUM.md) | **The deep reference — complete rules, all 25 keywords, the card universe as data, strategy, ban list. Start here for anything Riftbound.** |
| [**`docs/reference/CARD-KNOWLEDGE.md`**](docs/reference/CARD-KNOWLEDGE.md) | **Interactions, engines, locks and sequences — every card read in release order. EE's design input.** |
| [**`docs/reference/LEGEND-GUIDE.md`**](docs/reference/LEGEND-GUIDE.md) | **All 49 Legends — what each rewards, what fits, what fights it, and the deck shape that results.** |
| [**`docs/reference/BATTLEFIELD-GUIDE.md`**](docs/reference/BATTLEFIELD-GUIDE.md) | **All 66 battlefields — the only card your opponent also gets to use. Judged on asymmetry.** |
| [**`docs/reference/CARD-INDEX.md`**](docs/reference/CARD-INDEX.md) | **All 814 main-deck cards classified — what each produces, consumes, its timing and curve position. The synergy graph.** ⚠️ **Plus all 49 Legends**, annotated separately: the original pass was scoped to the 40, and the Legend is not in it |
| [**`docs/reference/DECKBUILDING.md`**](docs/reference/DECKBUILDING.md) | **What good players advise, and who advises it** — Riot's Primer, the one piece of maths, archetypes, and the places the schools genuinely disagree. EE's doctrine, never mistaken for rules |
| [`docs/reference/DATA-SOURCES.md`](docs/reference/DATA-SOURCES.md) | Card data, the meta-data landscape, and what's off-limits |

---

## Key facts

| | |
|---|---|
| **Card data** | Riot's **official** card gallery — 1,180 printings · 935 distinct names · 5 sets · one ~3.2 MB request |
| **Rules authority** | Official Core Rules + Tournament Rules PDFs **only** ([D-035](docs/DECISIONS.md#d-035)) |
| **Rules scope** | Tournament rules, best-of-three — main deck exactly 40, sideboard ≤10 |
| **Domain Identity** | Every Champion Legend carries **exactly 2 domains** — 118 printings, **49 distinct Legends**, all 15 possible pairs |
| **Collection** | ~1,000 physical cards · 200–300 unique names · entered by collector number |
| **Delivery** | Hosted, desktop + phone, fully editable on both |

---

## Four things worth knowing

**Both rulebooks were read cover to cover, and it paid.** 170 pages of primary source
yielded rules no community guide mentions — most importantly **`Unique`**, a keyword that
overrides the 3-copy limit. It is the *second* rule found only by reading the PDF directly.
The project's "rulebook is the only authority" principle has now been vindicated twice.

**EE synthesises; it never enumerates.** A single combat can be flipped by 66 different
cards. Saying so is true and useless. EE says *"fragile to cheap Mind interaction — attack
when they're tapped out"*, and keeps the 66 behind a "show me" affordance. An answer you
can't hold in your head has failed, however correct it is ([D-039](docs/DECISIONS.md#d-039)).

**Nothing composites into a grade.** No scores, no ratings, no stars. Statistics come in
three confidence tiers — facts, probabilities, estimates — and the uncertain tier is
**omitted entirely rather than faked**. The flagship is rune feasibility: *"with a 7 Fury /
5 Calm split you have a 74% chance of paying 2 Fury Power on turn 3"* — a calculation no
other Riftbound tool can perform, because none knows your rune split and your deck's Power
demands together.

**Generation assists; it never takes over.** The stated goal is to enjoy hours of building,
so generation lives *inside* that loop — suggestions while you build by hand, answers when
you're stuck, seeds when you want a starting point. It proposes several distinct candidates
and explains each; it never hands you one finished list and never ranks them.

---

## Process

4-Phase Spec-Driven Development:

1. ✅ **Discovery** — lock the spec before writing logic (`D1`)
2. ✅ **Visualization** — prototype for early UX validation (`D2`, closed 2026-08-03)
3. 🟡 **Development** — every change maps to a milestone in [`ROADMAP.md`](docs/ROADMAP.md) ← *you are here*
4. **Human QA** — the final gate

---

## Notes

Personal project. Single user. Not affiliated with Riot Games or UVS Games.
Riftbound is a trademark of Riot Games, Inc.
