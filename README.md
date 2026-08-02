# Forge

A personal deckbuilding workbench for [Riftbound](https://playriftbound.com/),
Riot Games' League of Legends trading card game.

> **Status:** ✅ Discovery complete · D2 (interface design) is next · no code yet

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

***L2 — The Generator*** *(hypothesis, not a commitment)*
Auto-propose legal decks from cards you own. Deliberately downgraded to a research spike
with kill conditions — see [why](#four-things-worth-knowing).

---

## 📍 Start here next session

**D2 — design the interface.** All blockers are cleared. Nothing to prepare.

Full detail: [`docs/PLAN.md`](docs/PLAN.md)

---

## Documentation

**Two documents orient you.** [`spec/OVERVIEW.md`](docs/spec/OVERVIEW.md) is the system
map — how the pieces fit and **where to put a new idea**. [`PLAN.md`](docs/PLAN.md) is the
delivery plan.

| Document | Contents |
|---|---|
| [**`docs/spec/OVERVIEW.md`**](docs/spec/OVERVIEW.md) | **System map — how everything relates, and where new ideas go. Read before adding a feature.** |
| [**`docs/PLAN.md`**](docs/PLAN.md) | **The delivery plan — every step, gate, milestone and risk.** |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 40 decisions with alternatives and rationale — including four reversals |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, non-goals |
| [`docs/AUDIT.md`](docs/AUDIT.md) | First-principles audit of the project's own assumptions |

### Specification — what we're building

| Document | Contents |
|---|---|
| [**`docs/spec/EVALUATION.md`**](docs/spec/EVALUATION.md) | **EE — the strategist. The questions it answers, and why it synthesises rather than enumerates.** |
| [`docs/spec/DATA-MODEL.md`](docs/spec/DATA-MODEL.md) | Entities, the DRAFT/BUILT commitment model, lifecycle answers |
| [`docs/spec/LEGALITY.md`](docs/spec/LEGALITY.md) | 33 validation checks, 13 tests drawn from the rulebook's own examples |
| [`docs/spec/DECK-STATS.md`](docs/spec/DECK-STATS.md) | What Forge measures, and how honest it is about its own uncertainty |
| [`docs/spec/GENERATOR.md`](docs/spec/GENERATOR.md) | The generator as a research spike, with kill conditions |

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

**The generator may not be wanted.** The stated goal is to enjoy hours of tinkering; a
generator automates tinkering. EE weakens the case further — if Forge can *explain* a
deck's strengths and gaps, the reason to auto-build shrinks. It is a spike with kill
conditions, not a plan.

---

## Process

4-Phase Spec-Driven Development:

1. ✅ **Discovery** — lock the spec before writing logic
2. **Visualization** — prototype for early UX validation ← *next*
3. **Development** — every change maps to a task
4. **Human QA** — the final gate

---

## Notes

Personal project. Single user. Not affiliated with Riot Games or UVS Games.
Riftbound is a trademark of Riot Games, Inc.
