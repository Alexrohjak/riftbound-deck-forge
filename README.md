# Forge

A personal deckbuilding workbench for [Riftbound](https://playriftbound.com/),
Riot Games' League of Legends trading card game.

> **Status:** ✅ Discovery complete · Stage 1 (interface design) is next · no code yet

---

## The Problem

Riftbound cards come from random pack openings. Every published guide and netdeck
assumes a card pool you don't have, which makes them aspirational rather than
actionable.

Forge inverts the question:

> **Given the cards I actually own, what can I legally and effectively build?**

---

## What It Will Be

**Phase A — The Workbench**
Catalogue the cards you physically own, then browse, filter and assemble decks by hand
with live rules validation and honest statistics. Cards sleeved into a built deck stop
being available — and always show which deck holds them. The same app on desktop and
phone, fully editable on both.

**Phase B — The Generator** *(hypothesis, not a commitment)*
Give it an anchor, a playstyle and constraints on what you *don't* want; it proposes
legal decks built only from cards you own, and iterates when you disagree.
Deliberately downgraded to a research spike — see [why](#three-things-worth-knowing).

---

## 📍 Start here next session

**Stage 1 — design the interface.** All blockers are cleared. Nothing to prepare.

Full detail: [`docs/PLAN.md`](docs/PLAN.md)

---

## Documentation

| Document | Contents |
|---|---|
| [**`docs/PLAN.md`**](docs/PLAN.md) | **The delivery plan — every stage, gate, milestone and risk. Start here.** |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, non-goals, open questions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 35 decisions with alternatives and rationale — including four reversals |
| [`docs/AUDIT.md`](docs/AUDIT.md) | First-principles audit of the project's own assumptions |

### Specification — what we're building

| Document | Contents |
|---|---|
| [`docs/spec/DATA-MODEL.md`](docs/spec/DATA-MODEL.md) | Entities, the DRAFT/BUILT commitment model, lifecycle answers |
| [`docs/spec/LEGALITY.md`](docs/spec/LEGALITY.md) | 27 validation checks, 10 tests drawn from the rulebook's own examples |
| [**`docs/spec/EVALUATION.md`**](docs/spec/EVALUATION.md) | **The evaluation engine — what a deck does well, what it's good against, and where it comes up short. Derived from the rules, never guessed.** |
| [`docs/spec/DECK-STATS.md`](docs/spec/DECK-STATS.md) | What Forge reports, and how honest it is about its own uncertainty |
| [`docs/spec/GENERATOR.md`](docs/spec/GENERATOR.md) | The generator as a research spike, with kill conditions |

### Reference — external facts we don't control

| Document | Contents |
|---|---|
| [**`docs/reference/COMPENDIUM.md`**](docs/reference/COMPENDIUM.md) | **The deep reference — complete rules, all 25 keywords, the card universe as data, strategy, ban list. Start here for anything Riftbound.** |
| [`docs/reference/GAME-RULES.md`](docs/reference/GAME-RULES.md) | How Riftbound works, cited to the official rulebooks |
| [`docs/reference/DATA-SOURCES.md`](docs/reference/DATA-SOURCES.md) | Card data, the meta-data landscape, and what's off-limits |

---

## Key facts

| | |
|---|---|
| **Card data** | Riot's **official** card gallery — 1,180 printings · 935 distinct names · 5 sets · one ~3.2 MB request |
| **Rules authority** | Official Core Rules + Tournament Rules PDFs **only** ([D-035](docs/DECISIONS.md#d-035)) |
| **Rules scope** | Tournament rules, best-of-three — main deck exactly 40, sideboard ≤10 |
| **Domain Identity** | Every Champion Legend carries **exactly 2 domains** (verified, all 118) |
| **Collection** | ~1,000 physical cards · 200–300 unique names · entered by collector number |
| **Delivery** | Hosted, desktop + phone, fully editable on both |

---

## Three things worth knowing

**An audit prosecuted the project's own assumptions.** The highest-risk one — that the
bottleneck is *information* rather than *cards* — is now confirmed: decks have already
been built from this collection. Two findings changed the plan permanently: a walking
skeleton was inserted so something is usable in weeks rather than months, and the
generator was downgraded.

**The generator may not be wanted.** The stated goal is to enjoy hours of tinkering; a
generator automates tinkering. It also carries an unresolved contradiction — a
generator needs an objective function, and Forge refuses to composite one. It is now a
spike with kill conditions, not a plan.

**Statistics never composite into a grade.** Deck strength is an estimate, not a fact,
so Forge shows independent statistics in three confidence tiers — facts, probabilities,
estimates — and **omits the uncertain tier entirely rather than faking it**. The
flagship is rune feasibility: *"with a 7 Fury / 5 Calm split you have a 74% chance of
paying 2 Fury Power on turn 3"* — a calculation no other Riftbound tool can perform,
because none knows your rune split and your deck's Power demands together.

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
