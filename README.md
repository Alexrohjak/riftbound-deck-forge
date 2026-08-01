# Riftbound Deck Forge

A personal deckbuilding workbench for [Riftbound](https://riftbound.leagueoflegends.com/en-us/),
Riot Games' League of Legends trading card game.

> **Status:** 🔍 Discovery. No implementation yet — by design.

---

## The Problem

Riftbound cards come from random pack openings. Every published guide and netdeck
assumes a card pool you don't have, which makes them aspirational rather than
actionable.

This project inverts the question:

> **Given the cards I actually own, what can I legally and effectively build?**

---

## What It Will Be

**Phase A — The Workbench**
Catalogue the cards you physically own, then browse, filter and assemble decks by
hand with live rules validation and real deck statistics. Read-only deck access on
your phone while playing.

**Phase B — The Generator**
Give it an anchor (a Legend, a Champion, or a card you want to build around), a
playstyle, and any constraints on what you *don't* want. It proposes complete,
legal, effective decks built only from cards you own — and when you disagree with a
suggestion, you say so and it iterates.

Design north star: [Piltover Archive](https://piltoverarchive.com/deckbuilder),
plus an owned-cards layer, plus a genuinely smart generator.

---

## Planning Documentation

This repository currently holds planning artefacts only. Read them in this order:

| Document | Contents |
|---|---|
| [**`docs/PLAN.md`**](docs/PLAN.md) | **The full delivery plan — every stage from here to a finished tool, with gates, milestones and risks. Start here.** |
| [`docs/DISCOVERY.md`](docs/DISCOVERY.md) | Problem, scope, users, constraints, non-goals, open questions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Every decision, its alternatives, and why — including three deliberate reversals |
| [`docs/RESEARCH.md`](docs/RESEARCH.md) | Riftbound rules (rulebook-cited), the card-data API, the meta-data landscape |
| [`docs/DECK-STATS.md`](docs/DECK-STATS.md) | What the tool reports about a deck, and how honest it is about its own uncertainty |

---

## Process

Built under 4-Phase Spec-Driven Development:

1. **Discovery** — lock the spec before writing logic ← *we are here*
2. **Visualization** — prototype for early UX validation
3. **Development** — every change maps to a task
4. **Human QA** — the final gate

---

## Data Sources

- **Card data:** [RiftScribe API](https://riftscribe.gg/api-docs) — free, public, no auth
- **Collection ingestion:** existing OCR scanner apps → CSV → import
- **Meta data:** pluggable adapter. **No scraping** of sources that prohibit it
  (see [`D-010`](docs/DECISIONS.md#d-010--we-will-not-scrape-sources-that-prohibit-it))

---

## Notes

Personal project. Single user. Not affiliated with Riot Games or UVS Games.
Riftbound is a trademark of Riot Games, Inc.
