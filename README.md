# Forge

A personal deckbuilding workbench for [Riftbound](https://playriftbound.com/),
Riot Games' League of Legends trading card game.

> **Status:** ✅ **The Foundation track is complete.** [Forge is a working deckbuilder](https://forge.alexander-rohde-jakobsen.workers.dev) over **all 935 cards** — search, alternate arts, live legality, the energy curve, saved as you go · 🎯 `W2` next — enter the real collection · **nightly backups run off-vendor**

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

*Last worked on 2026-08-04. This section is the recipe; the live status board is
[`docs/ROADMAP.md`](docs/ROADMAP.md).*

**Where things stand.** 🔓 The whole design track is done and `DESIGN LOCKED` has lifted.
✅ **`F1`, `F2` and `F3` are all closed** — Forge is live, private, deploys itself on every push
to `main`, and **is now a deckbuilder you can actually use** (§4). Forge also still has the
[collection tool](tools/collection/), used for real entry and improved twice from that use.

**🎯 Next is `W2`** — an evening entering the real collection, which is when Forge stops
being a demo. ⚖️ **`W1` is done**: all 33 legality checks, with the rulebook's own 13 worked
examples as tests. ✅ **`X8` is closed** ([D-051](docs/DECISIONS.md#d-051)):
a nightly cron commits a JSON snapshot to this repo rather than to R2, because a backup in
the same Cloudflare account does not survive losing the account. **Live and proven in
production** — §5.

### 1 · Run the collection tool

```bash
cd ~/code/riftbound && git pull
cd tools/collection && python3 -m http.server 8000     # → http://localhost:8000
```

Pick a set, type collector numbers — matches appear as you type, `⏎` adds.
**Export from the Data tab when finished**: the collection lives in `localStorage`, and that
exported JSON is the durable asset. Full instructions in
[`tools/collection/README.md`](tools/collection/README.md).

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
the energy curve, 72 tests:

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
```

`--cards` takes either `"<name>"` or `{ "name", "domains", "energy" }` per printing;
supplying domains is what turns on the Domain Identity checks. The result's `checked`
list always says which checks actually ran.

### 4 · `F2`/`F3` — Forge is a deckbuilder over the whole pool

**[forge.alexander-rohde-jakobsen.workers.dev](https://forge.alexander-rohde-jakobsen.workers.dev)**
— sign in with your email; nobody else gets in.

| Piece | State |
|---|---|
| **The deckbuilder** | **All 935 cards** behind a search box. Pick any of the 49 Legends and an eligible Champion, tap to add and remove, saved to D1 as you go |
| **Alternate arts** | Collapsed behind each card; pick which printing a deck slot uses. Thumbnails are served at `w=96` — the full scans are ~1 MB each |
| **Live legality** | ⚖️ **All 33 checks**, including the ban list, the Signature cap and `[Unique]`. Violations name the check *and* its rulebook citation. Ownership appears as a **warning**, never a violation |
| **The energy curve** | A histogram, never a mean ([DECK-STATS §6](docs/spec/DECK-STATS.md)). Cards with no cost data are kept out of the buckets rather than folded into zero |
| **One Worker, one origin** | Serves the SPA *and* the API ([D-050](docs/DECISIONS.md#d-050) — Cloudflare closed Pages to new projects) |
| **D1** | `forge`, schema applied. Holds one deck; the collection table is still empty until `W2` |
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
[`scripts/build-card-index.mjs`](scripts/build-card-index.mjs) and served as a **95 KB
gzipped** asset, fetched rather than bundled so a UI change does not re-download it.
Alternate arts collapse behind the card they belong to and are selectable per deck slot;
banned cards are **shown with a badge, never hidden**; champion tags are derived from
Signature cards (L32 — 49 of 49 Legends, including the Yordle/Kennen trap).

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
# The snapshot's `collection` field is exactly what PUT /collection accepts.
jq '.collection' forge-state.json > restore.json     # from the backups branch
curl -X PUT https://forge.alexander-rohde-jakobsen.workers.dev/collection \
     -H 'content-type: application/json' --data @restore.json
```

> **Why the repo and not R2.** An R2 bucket lives in the same Cloudflare account as the
> database it backs up — it insures a bad write, not losing the account, and Time Travel
> already covers the first case. Adding an R2 subscription would bill against a card on
> file to cover a risk that was already covered. Full reasoning in
> [D-051](docs/DECISIONS.md#d-051).

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
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 52 decisions with alternatives and rationale — including five reversals and one vendor-forced amendment |
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
| [`scripts/check-engine-purity.mjs`](scripts/check-engine-purity.mjs) | Fails if the engine imports `fs`, `fetch` or the DOM — that would break one of its two consumers, and it would be the one nobody ran |

### Specification — what we're building

| Document | Contents |
|---|---|
| [**`docs/spec/EVALUATION.md`**](docs/spec/EVALUATION.md) | **EE — the strategist. The questions it answers, and why it synthesises rather than enumerates.** |
| [`docs/spec/DATA-MODEL.md`](docs/spec/DATA-MODEL.md) | Entities, the DRAFT/BUILT commitment model, lifecycle answers |
| [`docs/spec/LEGALITY.md`](docs/spec/LEGALITY.md) | 33 validation checks, 13 tests drawn from the rulebook's own examples |
| [`docs/spec/DECK-STATS.md`](docs/spec/DECK-STATS.md) | What Forge measures, and how honest it is about its own uncertainty |
| [`docs/spec/GENERATOR.md`](docs/spec/GENERATOR.md) | **Generation** — EE in the propose direction: seeded, by intent, or to counter a deck |

### Reference — external facts we don't control

| Document | Contents |
|---|---|
| [**`docs/reference/COMPENDIUM.md`**](docs/reference/COMPENDIUM.md) | **The deep reference — complete rules, all 25 keywords, the card universe as data, strategy, ban list. Start here for anything Riftbound.** |
| [**`docs/reference/CARD-KNOWLEDGE.md`**](docs/reference/CARD-KNOWLEDGE.md) | **Interactions, engines, locks and sequences — every card read in release order. EE's design input.** |
| [**`docs/reference/LEGEND-GUIDE.md`**](docs/reference/LEGEND-GUIDE.md) | **All 49 Legends — what each rewards, what fits, what fights it, and the deck shape that results.** |
| [**`docs/reference/BATTLEFIELD-GUIDE.md`**](docs/reference/BATTLEFIELD-GUIDE.md) | **All 66 battlefields — the only card your opponent also gets to use. Judged on asymmetry.** |
| [**`docs/reference/CARD-INDEX.md`**](docs/reference/CARD-INDEX.md) | **All 814 main-deck cards classified — what each produces, consumes, its timing and curve position. The synergy graph.** |
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
