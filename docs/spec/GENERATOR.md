# The Generator — Research Spike

> ⚠️ **This is not a planned feature. It is a hypothesis with a kill condition.**
>
> Downgraded from a committed stage following the [assumption audit](../AUDIT.md)
> (finding A9, risk 16). **Status:** unproven · **Gate:** Phase A complete **and**
> evidence of real need

---

## 1. Why this was downgraded

The audit surfaced a direct contradiction between the stated goal and the proposed
feature:

> **Stated goal:** *"I want to enjoy sitting for hours creating, putting together,
> sleeving and testing decks."*
>
> **What a generator does:** produces a finished deck, removing the activity the user
> says they want to spend hours doing.

The generator was reached for because *"the computer figures it out"* is the obvious
shape a software solution takes — not because it was established as the thing that
would be enjoyed. That is a **convention**, not a requirement.

**Plausible alternative:** what is actually wanted is a workbench that makes tinkering
**fast and well-informed** — which is Phase A — and the felt need after two weeks of
real use may be *"help me evaluate the deck I'm already making"* rather than
*"show me a deck."*

**This is unanswerable before Phase A exists.** Hence: spike, not stage.

---

## 2. Kill conditions

Abandon without regret if **any** of the following hold:

| # | Condition |
|---|---|
| **K1** | After two weeks of real workbench use, the felt need is evaluation rather than generation |
| **K2** | The collection cannot support multiple distinct legal decks — see [AUDIT.md](../AUDIT.md) Stage 0.5. **Then generation has nothing to search** and the correct product is gap analysis |
| **K3** | No workable definition of "playstyle" emerges (Q5) that is better than the user simply picking cards |
| **K4** | Generated decks are consistently rejected in favour of hand-built ones |

**Nothing in Phase A depends on this spike.** Cancellation costs nothing already built.

---

## 3. ⚠️ The unresolved contradiction

**A generator needs an objective function. [D-016](../DECISIONS.md#d-016) forbids a
composite score.**

To *search* a space, something must rank candidates. To *rank*, something must
compose multiple factors into an ordering. That is precisely the composite grade the
project rejected as false precision.

This is not a detail to resolve during implementation. **It is a design contradiction
that must be settled first.**

### Candidate resolutions

| | Approach | Assessment |
|---|---|---|
| **R1** | Optimise internally, never display the score | Defensible — the score is a search heuristic, not a claim about the deck. But it silently smuggles back the judgement D-016 rejected |
| **R2** | Generate diverse *legal* candidates; let the statistics panel do all judging | Purest fit with D-016, but "diverse" still needs a metric, and output quality may be poor |
| **R3** | **Multi-objective / Pareto** — return only candidates not strictly worse than another on every axis | **Preferred.** Preserves "no single grade" honestly: the tool never says *which* is best, only *these are the non-dominated options*. The user chooses their trade-off |

**R3 is the leading candidate** and needs validation before any code.

---

## 4. Search strategy — unspecified

The plan previously sized this **L** with eight bullets and no method. Honestly:

| Approach | Assessment |
|---|---|
| Exhaustive enumeration | ❌ Combinatorially impossible — choosing 40 cards with quantities from ~100 candidates |
| Constraint satisfaction (CSP / ILP) | 🟡 Legality maps cleanly to hard constraints, but requires §3 resolved first |
| Greedy from the anchor | 🟡 Fast, weak results, easy to prototype |
| **Archetype-skeleton fill** | 🟢 Start from a curve/role template, fill with owned cards. Most tractable |
| Local search / annealing | 🟡 Good for *refinement* — likely the right engine for the interactive loop |

**Likely shape:** skeleton fill for the initial candidate, local search for interactive
refinement. **Not yet validated.**

---

## 5. Q5 — "playstyle", and a way around it

Archetype→card mapping exists in **no API** (see
[DATA-SOURCES.md](../reference/DATA-SOURCES.md)). The plan's previous answer — *"must
be sourced or derived"* — restates the problem rather than solving it.

### Proposal: define playstyle **mechanically**, not by name

Instead of labelling decks "aggro" or "control" and needing a taxonomy nobody
publishes, express intent as **axes computable from data already held**:

| Intent | Mechanical expression |
|---|---|
| *Aggressive* | High share of ≤2-energy Units; Assault keywords; high early Might |
| *Defensive* | Tank keywords; high Might-per-energy at 3+; late-game Might curve |
| *Board-wide* | Unit count and token generation |
| *Reactive* | Spell share; Deflect; Hidden |
| *Resource-hungry* | High Power demand relative to rune split |

**Why this is better:** it needs no external data, it is honest about being a
mechanical proxy rather than a claim about strategy, and it composes with the existing
statistics framework instead of inventing a parallel vocabulary.

**Also resolves Q5** without waiting on data that may never arrive.

---

## 6. If the spike proceeds

Requirements captured from the original vision, retained verbatim in intent:

- **Anchor** — a Legend, a Champion, or an arbitrary card. The third is hardest:
  it requires reverse-solving for Legends that could legally include it
- **Negative constraints** — "not this card", "not this strategy"
- Respect commitments — never propose a deck using cards held by a BUILT deck
  ([DATA-MODEL.md](DATA-MODEL.md#3-commitment))
- **Multiple candidates, never one answer**
- **Interactive refinement** — reject a choice, say why, re-derive. *This loop is the
  product;* one-shot generation is not what was asked for
- **Failure modes done well** — *"you have 34 of 40, here are the 6 gaps"* beats
  "no results". Note this is the gap-analysis idea returning as an error state

---

## 7. Spike deliverable

A **time-boxed** investigation producing a written answer to:

1. Is R3 (Pareto) workable, or does it degenerate to too many candidates?
2. Does skeleton-fill produce decks the user would actually sleeve?
3. Do the mechanical playstyle axes in §5 feel like real control, or like noise?

**Output:** a recommendation to build, redesign, or cancel — **not** a feature.
