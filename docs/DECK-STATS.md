# Deck Statistics Framework

> **Resolves Q9.** Establishes what the workbench and generator report about a deck,
> now that [D-016](DECISIONS.md#d-016) has ruled out a composite effectiveness grade.
>
> **Status:** Design accepted 2026-08-02. Not yet specified to implementation detail.

---

## 1. The governing principle

Killing the single grade was correct, but it relocates the problem rather than
removing it: **three misleading statistics are worse than one misleading grade,
because they take longer to discredit themselves.**

So statistics are organised by **epistemic confidence** — how much we actually know —
and the interface must make that tier immediately legible.

> **Non-negotiable:** a Tier 3 estimate must never be able to pass for a Tier 1 fact.
> Tier must be encoded in the visual language — not merely footnoted.

| Tier | Nature | Guarantee |
|---|---|---|
| 🟢 **1 — Facts** | Deterministic, from the decklist | Exactly correct |
| 🟡 **2 — Probabilities** | Computed or simulated | Correct *given stated assumptions*, which are always shown |
| 🔴 **3 — Estimates** | Requires external data | Genuinely uncertain; omitted entirely rather than faked |

---

## 2. Why rune feasibility is the headline

### The mechanic (CR 160–168, 315.3)

- The **Rune Deck is exactly 12** (CR 161.2.a)
- **2 runes are channelled per turn** (CR 315.3.b.1); channelled runes remain on the board
- Every Basic Rune has exactly two abilities (CR 164.2):
  - `[E]` **Exhaust** → add **1 Energy** — generic, no domain (CR 163.1.a)
  - `Recycle this` → add **1 Power of that rune's domain**, **and the rune returns to
    the Rune Deck** (CR 164.2.b, 161.2.b)
- The **Rune Pool empties** at the start of each Main Phase and at end of turn;
  unspent resources are **lost** (CR 167)

### The resulting curve

| Turn | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Runes channelled (cumulative, no recycling) | 2 | 4 | 6 | 8 | 10 | **12 — deck empty** |

### The central tension

**Paying Power costs board presence.** Recycling a rune for coloured Power removes it
from the board — forfeiting that Energy source — while replenishing the Rune Deck for
future channelling. A Power-heavy deck and an Energy-heavy deck therefore have
structurally different resource curves, and the same 12 runes serve them very
differently.

### Why this cannot be done by hand

To pay a **Fury** Power cost you must recycle a **Fury rune currently on the board**.
Whether one is available on turn *N* depends on which runes you happened to channel —
a **hypergeometric** problem over a 12-card deck, further complicated by recycling
returning runes to it.

> *"With a 7 Fury / 5 Calm split, you have a **74%** chance of paying `2 Fury Power`
> on turn 3. Moving to 8/4 raises that to 86% — and drops turn-4 Calm feasibility
> from 91% to 68%."*

**No other Riftbound tool can produce this**, because none knows the rune split and
the deck's actual Power demands together. It is the single strongest argument for
this project existing.

### Computation approach

| Case | Method |
|---|---|
| No recycling yet (early turns) | **Closed-form hypergeometric** — exact and instant |
| General case (recycling returns runes to the deck) | **Monte Carlo simulation** — the state space is a Markov process; simulation is simpler and fast enough at this scale |

Assumptions (always displayed alongside the number): no mulligan modelling, no
card-effect rune manipulation, play/draw position stated explicitly.

---

## 3. 🟢 Tier 1 — Facts

Deterministic. Computed directly from the decklist. Always exactly right.

| Statistic | Notes |
|---|---|
| **Energy curve** | Histogram, never a mean — see §6 |
| **Power demand by domain** | The figure that must be reconciled against the rune split |
| **Type split** — Unit / Spell / Gear | Load-bearing: you win by *holding* Battlefields with bodies. A Unit-light deck **physically cannot contest three locations**, regardless of card quality |
| **Might distribution** | Combat is Might-vs-Might in Showdowns |
| **Keyword counts** | Tank, Assault, Accelerate, Deflect, Hidden, Legion, Hunt |
| **Rune split** | Per domain, out of 12 |
| **Signature card count** | Hard cap of 3 total (CR 103.2.d.1) — see [D-020](DECISIONS.md#d-020) |
| **Collection reality** | How many slots are **committed to other decks** ([D-017](DECISIONS.md#d-017)) |

---

## 4. 🟡 Tier 2 — Probabilities

Computed or simulated. Correct given assumptions, which are always stated.

| Statistic | Answers |
|---|---|
| **Rune feasibility curve** ⭐ | P(can pay this cost) per turn, per domain. **The flagship** — see §2 |
| **Chosen Champion access** | P(drawn by turn N) |
| **Opening-hand playability** | Over ~10,000 simulated hands: the share with a real turn-1 line, and with a turn-2 line. **This is what a Sample Hand should have been** — a distribution, not an anecdote |
| **Expected Might on board by turn N** | The genuine **early-vs-late** answer, replacing vague archetype labels |
| **Playable options per turn** | See §6 — the concrete definition of "flexibility" |

---

## 5. 🔴 Tier 3 — Estimates

External data. Genuinely uncertain. Visually distinct and explicitly labelled.

- Meta positioning
- Matchup counterplay against specific decks and Legends
- Archetype fit
- Performance of comparable tournament decks

> **Currently blocked on Q4** (legitimate access to tournament data). Under
> [D-009](DECISIONS.md#d-009) the panel **omits this tier entirely rather than
> fabricating it.** An absent Tier 3 is an honest panel; an invented one is not.

---

## 6. Deliberate departures from the original request

### ❌ "Average cost of a card" — dropped

A single mean is actively misleading. A deck of all 3-drops and a deck split between
1-drops and 6-drops share a mean of 3 and play nothing alike. The **histogram already
conveys everything the mean does**, honestly. Dropped in favour of the curve.

### ✅ "Flexibility" — given a concrete definition

Undefined, it becomes decoration. Defined as:

> **Playable options per turn** — given expected resources on turn *N*, how many
> **distinct cards** in the deck could actually be cast?

A deck with 14 castable options on turn 3 is meaningfully more flexible than one with
4, and it is computable from data we already hold.

---

## 7. Open items

| # | Item |
|---|---|
| S1 | Exact visual language separating the three tiers |
| S2 | Which statistics surface by default vs. on demand — the panel must not become a wall |
| S3 | Whether Tier 2 assumptions are always visible or revealed on interaction |
| S4 | Monte Carlo iteration count vs. responsiveness (target <2 s, per DISCOVERY §9) |
| S5 | Whether the generator ranks candidates using these statistics without ever compositing them into a score — **it must not**, per [D-016](DECISIONS.md#d-016) |
