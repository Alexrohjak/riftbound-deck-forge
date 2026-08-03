# Forge

A personal deckbuilding workbench for [Riftbound](https://playriftbound.com/),
Riot Games' League of Legends trading card game.

> **Status:** ✅ `D1` discovery + `D2` interface design complete · 🎯 `D3` architecture is next, the last gate before `DESIGN LOCKED` · **the collection tool works and is in use**

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

*Last worked on 2026-08-03. This section is the recipe; the live status board is
[`docs/ROADMAP.md`](docs/ROADMAP.md).*

**Where things stand.** 🔒 **`D1` and `D2` are closed.** Discovery is done, the interface is
locked, and Forge has working code — a [collection tool](tools/collection/) used for real entry
and improved twice from that use. **`D3` (architecture) is the last gate before
`DESIGN LOCKED`**, after which logic can be written.

### 1 · Run what exists

```bash
cd ~/code/riftbound && git pull
cd tools/collection && python3 -m http.server 8000     # → http://localhost:8000
```

Pick a set, type collector numbers — matches appear as you type, `⏎` adds.
**Export from the Data tab when finished**: the collection lives in `localStorage`, and that
exported JSON is the durable asset. Full instructions in
[`tools/collection/README.md`](tools/collection/README.md).

### 2 · What changed on 2026-08-03

Four decisions, and the `S` track is a different shape because of them.

| # | Decision | Effect |
|---|---|---|
| [**D-043**](docs/DECISIONS.md#d-043) | **EE is a rules engine with a swappable mouth** — the mouth is Claude Code against exported state | `S3`/`S4` retired; new `S6` at a fraction of the size; **X1 and E1 dissolved** |
| [**D-044**](docs/DECISIONS.md#d-044) | **`S1` splits** — `S1a` combat and legality now, `S1b` chains deferred | Seven of EE's eight questions stop waiting on the hardest half |
| [**D-045**](docs/DECISIONS.md#d-045) | **Tier by answer-part** — Grounding is measured-only, the read is opinion | Resolves the contradiction where [D-022](docs/DECISIONS.md#d-022) forbade the advice EE promises |
| [**D-046**](docs/DECISIONS.md#d-046) | 🔒 **`D2` closed** — the interface is locked | `D3` is the only remaining design gate |

**Two calls inside D-046 were mine, not yours.** Pips cap at three (a fourth copy is
unplayable under [L13](docs/spec/LEGALITY.md), so a fourth pip encodes nothing), and EE's
answer budget is 1 statement / ≤2 lever sentences / ≤3 grounding lines. **Both are cheap to
reverse** — open the [prototype](docs/design/D2-workbench-prototype.html) and say so if either
reads wrong.

### 3 · Next — `D3`, architecture

Stack · hosting and its **indefinite** running cost · storage · card cache · access control ·
backup and export. Plus two questions deliberately carried this far:

- **X5** — where the docs are served from, so the roadmap has a bookmarkable always-current URL.
  ⚠️ GitHub Pages is ruled out: it needs a paid plan on a private repo
- **A6** — *"hosted, always-on"* was recorded as **convention, not fact**. A permanently-online
  service for exactly one user was never justified. **Re-examine it before accepting it**

Then `F1`/`F2` get it online, and `F2` is the one that matters — the first genuinely usable
version, deliberately crude.

> ⚠️ **Read [`docs/AUDIT.md`](docs/AUDIT.md) and the honest-review findings before adding
> more documentation.** The project has 64,000 words of docs against a few hundred lines of
> code, and the counts in them have drifted three times. **Prefer building over writing.**

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
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 46 decisions with alternatives and rationale — including five reversals |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, non-goals |
| [`docs/AUDIT.md`](docs/AUDIT.md) | First-principles audit of the project's own assumptions |
| [`docs/design/`](docs/design/) | 🔒 The **locked** `D2` interface — open the HTML in a browser. A design artifact, not a starting codebase |

### Code

| | |
|---|---|
| [**`tools/collection/`**](tools/collection/) | **The collection tool — keyboard entry over all 1,180 printings, live matches with images, JSON export. Working, and in use.** |
| [`tools/check-docs.py`](tools/check-docs.py) | Fails when the docs contradict themselves — milestone arithmetic, the two status boards, decision counts, links. Run it after editing any planning doc |

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
3. 🟡 **Development** — every change maps to a task ← *`D3` first, then `DESIGN LOCKED` lifts*
4. **Human QA** — the final gate

---

## Notes

Personal project. Single user. Not affiliated with Riot Games or UVS Games.
Riftbound is a trademark of Riot Games, Inc.
