# Forge — System Map

> How the pieces fit together, and **where to put a new idea**.
>
> Read this before adding a feature, changing a spec, or wondering which document owns a
> question.
>
> **Created:** 2026-08-02

---

## 1. Forge in one picture

```
                        ┌──────────────────────────┐
                        │        COLLECTION        │   what you physically own
                        │   (DATA-MODEL.md)        │   entered by collector number
                        └────────────┬─────────────┘
                                     │
                        ┌────────────▼─────────────┐
                        │        WORKBENCH         │   browse · filter · assemble
                        │   (interface — D2)    │   ownership is the organising idea
                        └────────────┬─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼─────────┐ ┌──────────▼─────────┐ ┌──────────▼─────────┐
   │      LEGALITY      │ │     DECK-STATS     │ │         EE         │
   │  is it legal?      │ │  what is it?       │ │  what does it MEAN?│
   │  (LEGALITY.md)     │ │  (DECK-STATS.md)   │ │  (EVALUATION.md)   │
   │  pass/fail + why   │ │  measured facts    │ │  answers questions │
   └──────────┬─────────┘ └──────────┬─────────┘ └──────────┬─────────┘
              └──────────────────────┼──────────────────────┘
                                     │
                        ┌────────────▼─────────────┐
                        │   RULES + CARD UNIVERSE  │   the ground truth
                        │  (reference/COMPENDIUM)  │   rulebooks + 1,180 cards
                        └──────────────────────────┘
```

**The three analysis pillars answer different questions and must never blur:**

| Pillar | Question | Output |
|---|---|---|
| **LEGALITY** | *May I play this?* | Pass/fail, with the rule that failed |
| **DECK-STATS** | *What is this deck made of?* | Measurements — curve, coverage, feasibility |
| **EE** | *What does that mean, and what do I do?* | Answers, in language, with a lever |

> Legality is binary. Stats are numbers. EE is judgement grounded in both. Conflating them
> is the fastest way to make Forge untrustworthy.

---

## 2. Document map

### Ground truth — things we don't control

| Document | Owns | Change when |
|---|---|---|
| [`reference/COMPENDIUM.md`](../reference/COMPENDIUM.md) | **The rules and the card universe.** Deck construction, all 25 keywords, combat, scoring, card-pool data, ban list, strategy fundamentals | Riot ships a set, errata, rules update or ban-list change |
| [`reference/DATA-SOURCES.md`](../reference/DATA-SOURCES.md) | Where data comes from, what's accessible, what's off-limits | A source appears, dies or changes access |

> **COMPENDIUM is the living reference.** Every other document defers to it on rules. If a
> spec and the compendium disagree about Riftbound, the compendium wins — and if the
> compendium and the PDF disagree, **the PDF wins** ([D-020](../DECISIONS.md#d-020)).

### Specification — what we're building

| Document | Owns |
|---|---|
| [`OVERVIEW.md`](OVERVIEW.md) | **This file.** How the pieces relate; where new ideas go |
| [`DATA-MODEL.md`](DATA-MODEL.md) | Entities, ownership vs legality units, DRAFT/BUILT commitment, backup |
| [`LEGALITY.md`](LEGALITY.md) | Deck validation — every check, every rulebook test |
| [`DECK-STATS.md`](DECK-STATS.md) | What we measure and the honesty tiers |
| [`EVALUATION.md`](EVALUATION.md) | **EE** — the strategist. Questions, synthesis, conversation |
| [`GENERATOR.md`](GENERATOR.md) | Deferred research spike, with kill conditions |

### Process — how we got here and where we're going

| Document | Owns |
|---|---|
| [`../PLAN.md`](../PLAN.md) | Delivery plan — stages, gates, status, risks |
| [`../DECISIONS.md`](../DECISIONS.md) | Append-only decision log with rationale |
| [`../DISCOVERY.md`](../DISCOVERY.md) | Problem, scope, users, non-goals |
| [`../AUDIT.md`](../AUDIT.md) | First-principles audit of the project's assumptions |

---

## 3. 🔧 Where does a new idea go?

Use this table before creating anything. **Most ideas belong in an existing document.**

| If the idea is… | It goes in | As |
|---|---|---|
| A new **question EE should answer** | `EVALUATION.md` §3 + §6 | A new `Q-*` entry with its computation |
| A new **strategic concept** EE should recognise | `EVALUATION.md` §5.1 | A pattern with a *computable* definition |
| A new **deck-legality rule** | `LEGALITY.md` §2 | A new `L*` check with its citation |
| A new **measurement** | `DECK-STATS.md` §3–5 | A statistic, placed in its honesty tier |
| A **fact about Riftbound** | `COMPENDIUM.md` | The relevant Part, cited to the PDF |
| A new **entity or lifecycle rule** | `DATA-MODEL.md` | An entity or state transition |
| A **choice with alternatives and rationale** | `DECISIONS.md` | A new `D-***`, append-only, never rewritten |
| A **change to scope or sequencing** | `PLAN.md` | A stage edit, plus a `D-***` if it reverses a decision |
| Something that fits **nowhere** | Here, §2 | A new spec document — and a row in this map |

### The three rules of adding to Forge

1. **Cite it or don't claim it.** A rules assertion without a CR/TR citation is a bug.
2. **Decisions are append-only.** Reversals get a new `D-***` explaining what changed and
   why — the old one stays. Four reversals already exist and they're the most useful
   entries in the log.
3. **Put the constraint next to the feature.** If a new EE question can't be honestly
   answered, say so *in the spec* rather than discovering it in implementation.

---

## 4. The principles everything obeys

These are decided and load-bearing. Changing one means writing a `D-***`.

| # | Principle | Source |
|---|---|---|
| 1 | **The rulebook is the only legality authority.** Community guides have been wrong twice | [D-020](../DECISIONS.md#d-020) |
| 2 | **No composite score.** No grades, ratings or stars, anywhere | [D-016](../DECISIONS.md#d-016) |
| 3 | **Omit rather than fake.** An uncertain statistic is left out, not estimated | [D-022](../DECISIONS.md#d-022) |
| 4 | **Synthesis over enumeration — *in output only*.** EE says three useful things, not 66 true ones. ⚠️ The **data layer stays complete**; this governs what a human reads, never what we store | `EVALUATION.md` §2 |
| 5 | **Never a dead end.** An unavailable card shows where it is; an impossible deck shows what's missing | [DISCOVERY](../DISCOVERY.md) |
| 6 | **Ownership is the organising principle** — the whole reason Forge exists | [D-015](../DECISIONS.md#d-015) |
| 7 | **Legality ≠ buildability.** A deck can be legal and unbuildable. Never conflate | `LEGALITY.md` §2 |
| 8 | **No scraping** | [D-010](../DECISIONS.md#d-010) |
| 9 | **Design constrains the stack**, not the reverse | [D-019](../DECISIONS.md#d-019) |
| 10 | **Verify premises before building on them** | [AUDIT](../AUDIT.md) |

---

## 5. Feature status at a glance

| Feature | Spec | Status |
|---|---|---|
| Collection entry by collector number | `DATA-MODEL.md` | ✅ specified |
| DRAFT/BUILT commitment model | `DATA-MODEL.md` | ✅ specified |
| Deck legality validation | `LEGALITY.md` | ✅ specified — 33 checks |
| Deck statistics + rune feasibility | `DECK-STATS.md` | ✅ specified |
| **EE — the strategist** | `EVALUATION.md` | 🟡 specified; rules core is the open work |
| Interface / interaction design | — | 🔴 **D2 — next, not yet started** |
| Architecture + hosting | — | 🔴 D3 — not started |
| Deck generator | `GENERATOR.md` | ⏸️ deferred spike, kill conditions set |

---

## 6. Open cross-cutting questions

Questions that don't belong to one spec.

| # | Question | Affects |
|---|---|---|
| **X1** | Where does EE's conversation layer run — in-app chat, or Claude Code against exported deck state? | D3, EE §11 E1 |
| **X2** | How much of the rules engine does F2 need before EE says anything useful? | PLAN sequencing |
| **X3** | Do EE answers get cached per (deck, format version), or recomputed live? | Performance, <2 s target |
| **X4** | Does the interface present EE as a panel, a chat, or both? | D2 |
