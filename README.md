# Forge

A personal deckbuilding workbench for [Riftbound](https://riftbound.leagueoflegends.com/en-us/),
Riot Games' League of Legends trading card game.

> **Status:** 🔍 Discovery. No implementation yet — by design.

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
with live rules validation and honest deck statistics. Cards sleeved into a built deck
stop being available — and always show which deck holds them. Same app on desktop and
phone, fully editable on both.

**Phase B — The Generator** *(hypothesis, not a commitment)*
Give it an anchor, a playstyle, and constraints on what you *don't* want; it proposes
legal decks built only from cards you own, and iterates when you disagree.
Deliberately downgraded to a research spike — see below.

---

## Documentation

| Document | Contents |
|---|---|
| [**`docs/PLAN.md`**](docs/PLAN.md) | **The delivery plan — every stage, gate, milestone and risk. Start here.** |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, non-goals, open questions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Every decision with alternatives and rationale — including four reversals |
| [`docs/AUDIT.md`](docs/AUDIT.md) | First-principles audit of the project's own assumptions |

### Specification — what we're building

| Document | Contents |
|---|---|
| [`docs/spec/DATA-MODEL.md`](docs/spec/DATA-MODEL.md) | Entities, the commitment model, lifecycle questions answered |
| [`docs/spec/LEGALITY.md`](docs/spec/LEGALITY.md) | 27 validation checks, 10 rulebook-derived tests |
| [`docs/spec/DECK-STATS.md`](docs/spec/DECK-STATS.md) | What Forge reports, and how honest it is about its own uncertainty |
| [`docs/spec/GENERATOR.md`](docs/spec/GENERATOR.md) | The generator as a research spike, with kill conditions |

### Reference — external facts we don't control

| Document | Contents |
|---|---|
| [`docs/reference/GAME-RULES.md`](docs/reference/GAME-RULES.md) | How Riftbound works, cited to the official rulebooks |
| [`docs/reference/DATA-SOURCES.md`](docs/reference/DATA-SOURCES.md) | Card APIs, the meta-data landscape, and what's off-limits |

---

## Three things worth knowing

**An audit found the project's most fragile assumption.** Forge assumes the bottleneck
is *information*, not *cards*. If the collection can't actually produce complete legal
decks, no software fixes that. **Stage 0.5 tests this by hand, in two hours, before any
code is written.**

**The generator may not be wanted.** The stated goal is to enjoy hours of tinkering; a
generator automates tinkering. That contradiction is unresolved and the feature is now
a spike with kill conditions, not a plan.

**Statistics never composite into a grade.** Deck strength is an estimate, not a fact,
so Forge shows a panel of independent statistics in three confidence tiers — and omits
the uncertain tier entirely rather than faking it.

---

## Process

Built under 4-Phase Spec-Driven Development:

1. **Discovery** — lock the spec before writing logic ← *we are here*
2. **Visualization** — prototype for early UX validation
3. **Development** — every change maps to a task
4. **Human QA** — the final gate

---

## Notes

Personal project. Single user. Not affiliated with Riot Games or UVS Games.
Riftbound is a trademark of Riot Games, Inc.
