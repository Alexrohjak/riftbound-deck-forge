# Deck Statistics Framework

> **Resolves Q9.** Establishes what Forge *measures* about a deck, now that
> [D-016](../DECISIONS.md#d-016) has ruled out a composite effectiveness grade.
>
> **Measurement, not interpretation.** This document owns the numbers;
> [`EVALUATION.md`](EVALUATION.md) (EE) owns what they *mean* and what to do about them.
> See [`OVERVIEW.md`](OVERVIEW.md) §1 for why the two must never blur.
>
> **Status:** Design accepted 2026-08-02. **The energy curve is built** — a histogram, never
> a mean (§6), with cost-less cards held out of the buckets rather than folded into zero.
> The rest of the framework, and `W4`'s Tier 1 / Tier 2 visual separation, is still design
> rather than implementation detail.

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

> ⚠️ **Correction (2026-08-02): this is not an either/or.** A rune has **two abilities with
> two costs**, and no rule forbids using both — **exhaust it for `1 Energy`, then recycle
> the exhausted rune for `1 Power`** (CR 164.2, 414.1.b, 416; see
> [COMPENDIUM §III.3](../reference/COMPENDIUM.md#3-resources--the-central-tension)).
>
> **The feasibility model must include the exhaust-then-recycle line**, or it will report
> decks as unable to pay costs they can actually pay. The real trade-off is *"keep this rune
> as a recurring Energy source"* vs *"cash it out now for Energy **and** Power"* — a
> sequencing decision, not a binary one.

### Why this cannot be done by hand

To pay a **Fury** Power cost you must recycle a **Fury rune currently on the board**.
Whether one is available on turn *N* depends on which runes you happened to channel —
a **hypergeometric** problem over a 12-card deck, further complicated by recycling
returning runes to it.

> *"With a 7 Fury / 5 Calm split, you have an **85%** chance of paying `2 Fury Power`
> on turn 2. Moving to 8/4 raises that to 93% — and drops turn-2 Calm feasibility
> from 58% to 41%."*

> ⚠️ **The figures above were corrected on 2026-08-10, when this was implemented.** The
> original example quoted 74% for `2 Fury Power` on **turn 3**; the exact answer is 99.2%,
> because by turn 3 you have channelled six of twelve runes and seven of them are Fury.
> Illustrative numbers written before the calculation existed are exactly the folklore this
> tier is meant to prevent, so they are now computed values. **Turn 2 is also the better
> illustration** — turn 3 is where nearly every split succeeds, and the trade-off the section
> is about is only visible while the answer is still in doubt.

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
| **Signature card count** | Hard cap of 3 total (CR 103.2.d.1) — see [D-020](../DECISIONS.md#d-020) |
| **Collection reality** | How many slots are **committed to other decks** ([D-017](../DECISIONS.md#d-017)) |

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

**Requires data external to the rules and the card pool.** Genuinely uncertain — and
therefore **omitted entirely**, not rendered.

- Meta positioning and metashare
- Win probability against a named deck or Legend
- Performance of comparable tournament decks
- Archetype fit as judged by the community

> **Blocked on Q4** (legitimate access to tournament data), and now also **evidentially
> discredited**: current-set meta data rests on samples of **n = 1 to 3**
> ([COMPENDIUM §VI.6](../reference/COMPENDIUM.md#6-the-meta--and-why-it-may-not-matter-for-forge)).
> Under [D-009](../DECISIONS.md#d-009) the panel omits this tier rather than fabricating it.
> An absent Tier 3 is an honest panel; an invented one is not.

### ⚠️ What is *not* Tier 3 — matchup analysis against the legal format

Tier 3 means *"needs external data."* It does **not** mean *"concerns matchups."*

**EE's matchup analysis is derived entirely from the rules and the card pool** — what an
opposing Domain Identity *can legally field*, and whether your deck answers it. That needs
no tournament data and no assumptions, so it is **Tier 1/2, not Tier 3**.

| Question | Tier |
|---|---|
| *"Does my removal answer what Body/Fury can field at 5+ cost?"* | 🟢 **Tier 1** — derived from the legal pool |
| *"How likely am I to hold an answer by turn 4?"* | 🟡 **Tier 2** — computed, assumptions stated |
| *"What's my winrate against Diana decks?"* | 🔴 **Tier 3** — omitted |

The distinction is *"what they **can** do"* (derivable) versus *"what they **will** do or
how often you'd beat them"* (not). See [`EVALUATION.md`](EVALUATION.md) §3.

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
| S5 | Whether the generator ranks candidates using these statistics without ever compositing them into a score — **it must not**, per [D-016](../DECISIONS.md#d-016) |
