# Forge — Roadmap

> **Version:** 1.0 · **Updated:** 2026-08-02
>
> The map of where we're going. Five tracks, each a set of milestones with **stable IDs**.
> *Why* it's built this way lives in [`DISCOVERY.md`](DISCOVERY.md) and
> [`DECISIONS.md`](DECISIONS.md); *what "done" means* per milestone lives in
> [`PLAN.md`](PLAN.md); *what we're building* lives in [`spec/`](spec/).

---

## ▓ STATUS BOARD — *you are here*

> The single source of truth for "where are we right now." Update whenever a milestone
> changes state.

| | |
|---|---|
| **Track** | **D — Design** |
| **Progress** | **1 of 16** milestones · `D1` complete |
| **🎯 Next** | **`D2` — Interface design.** No blockers, nothing to prepare. Bring opinions about how it should feel |
| **Active** | None — awaiting `D2` |
| **Blocked** | Nothing |
| **Code** | **None yet.** By design — `DESIGN LOCKED` gates all logic until `D3` completes |

```
D ─ Design         ▓▓▓▓░░░░░░░░  1/3   ← you are here
F ─ Foundation     ░░░░░░░░░░░░  0/3
W ─ Workbench      ░░░░░░░░░░░░  0/4
S ─ Strategist     ░░░░░░░░░░░░  0/5
L ─ Later          ░░░░░░░░░░░░  0/1
                                 ────
                                 1/16
```

### Recently completed

| ID | Milestone | What it produced | Date |
|---|---|---|---|
| `D1` | **Discovery** | 18 documents · 42 decisions · both rulebooks read in full · all 935 cards read and classified · 1.3 MB cached card data · 33 legality checks · EE specified | 2026-08-02 |

---

## How the planning docs fit together

| Doc | Role | Altitude |
|---|---|---|
| [`DISCOVERY.md`](DISCOVERY.md) | **What & why** — problem, scope, users, non-goals | Rarely changes |
| **`ROADMAP.md`** (this) | **The map** — tracks, milestones, status, dependencies | Strategic — no detail |
| [`PLAN.md`](PLAN.md) | **The detail** — gates, "done when", how you validate, risks | Per-milestone |
| [`spec/`](spec/) | **What we're building** — legality, EE, generation, data model | Deep reference |
| [`reference/`](reference/) | **Riftbound itself** — rules, cards, Legends, battlefields | External facts |
| [`DECISIONS.md`](DECISIONS.md) | **Why this way** — 42 decisions, append-only | Never rewritten |

**Milestone IDs are permanent handles.** Format `PREFIX-N` — the letter says *which track*,
the number is an **identity, not a priority**. Order and state live in the Status column, so
new work appends the next free number and **nothing ever renumbers**.

> ⚠️ One historical exception: the original `Stage 0–13` scheme was renamed once (2026-08-02)
> because it had a fractional stage and two parallel tracks sharing one sequence. The mapping
> is preserved in [`PLAN.md`](PLAN.md). **From here IDs are stable.**

**Status legend:** ✅ done · 🟡 active · 🎯 next · ⬜ todo · ⛔ blocked

| Track | Prefix | Theme |
|---|---|---|
| Design | `D` | Decide what we're building, before any logic |
| Foundation | `F` | Get something live and fed with data |
| Workbench | `W` | Build, validate and measure decks |
| Strategist | `S` | EE — answers questions, and proposes decks |
| Later | `L` | Deferred |

---

## Track D — Design

*Decide what Forge is before writing logic. Ends at `DESIGN LOCKED`.*

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `D1` | **Discovery** | Scope, rules, card data, specs and decisions all locked | ✅ | — |
| `D2` | **Interface design** | A clickable prototype exists that you have used and approved | 🎯 **NEXT** | — |
| `D3` | **Architecture** | Stack chosen and justified, with indefinite running cost understood | ⬜ | `D2` |

**`D2` must design three things** — this is the one that grew:
1. The **workbench** — gallery, deck zones, The Bench, ownership language
2. **How EE speaks** — a claim carries a statement, a lever and its grounding. Not a stat tile
3. **How EE is invoked** — advice is pull, never push ([D-042](DECISIONS.md#d-042)), so there
   must be a deliberate way to *ask*

> 🔒 **DESIGN LOCKED** after `D3`. No significant logic before this line.

---

## Track F — Foundation

*Get something live, usable, and fed with real data. Gates both build tracks.*

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `F1` | **Get it online** | A trivial page is live, reachable from your phone, deploying automatically | ⬜ | `D3` |
| `F2` | **First usable version** ⭐ | You can open it on your phone and put cards into a deck | ⬜ | `F1` |
| `F3` | **Card data** | Full pool queryable offline, variants collapsed by name, errata + ban overlay working | ⬜ | `F2` |

> ⭐ **`F2` is the most important sequencing decision in the plan.** The audit found
> time-to-first-value was the dominant risk — the original plan needed four steps of
> infrastructure before anything was usable. `F2` is deliberately crude and genuinely usable.

---

## Track W — The Workbench

*Catalogue what you own; build, validate and measure decks by hand.* **Runs parallel to `S`.**

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `W1` | **Legality checking** ⚠️ | All 33 checks implemented, 13 rulebook tests passing | ⬜ | `F3` |
| `W2` | **Collection entry** | You have entered the real collection; 20 random names spot-check correct | ⬜ | `F3` |
| `W3` | **Deck builder** | A complete legal deck can be built end-to-end on desktop **and** phone | ⬜ | `W1`, `W2` |
| `W4` | **Deck statistics** | Tier 1 + Tier 2 render with correct visual separation, under 2 s | ⬜ | `W3` |

⚠️ **`W1` is the highest correctness risk in the project.** Everything downstream trusts it,
and two rules (`Signature`, `Unique`) were found only by reading the PDF directly — **there
are probably more.**

🏁 **Milestone — the collection is real.** `W2` is where you sit down with your boxes. From
there Forge runs on real data, not fixtures. *This is the biggest practical risk in the
project* — it's an evening of typing that everything else depends on.

---

## Track S — The Strategist (EE)

*Answers questions about your cards, decks and matchups — and proposes decks.*
**Runs parallel to `W`.**

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `S1` | **Rules engine** 🔴 | Every worked example in CR 355–359, 370–375, 465.2 passes as a fixture; each of the 21 rule-warping cards has a regression test | ⬜ | `F3` |
| `S2` | **Analysis** | EE answers Q-CARD, Q-COMPARE and Q-LEGEND correctly, headlessly | ⬜ | `S1` |
| `S3` | **Plain-English answers** ⭐ | No answer exceeds its statement budget, enforced by test | ⬜ | `S2` |
| `S4` | **Conversation** | Follow-ups and "why?" work; no number appears that didn't come from a tool call | ⬜ | `S3`, `D3` (X1) |
| `S5` | **Deck generation** ⭐ | All four modes produce legal, owned, explained candidates you'd actually sleeve | ⬜ | `S3`, `W2` |

🔴 **`S1` is the largest single component in the project.** Riftbound's showdown/chain system
plus **21 cards that rewrite rules an engine would hardcode** make it a real rules engine, not
a calculator. Build it **vertically** — one battlefield, 1v1, full fidelity — then widen.

⭐ **`S3` is what makes EE usable.** It turns *"66 cards refute this"* into *"fragile to cheap
Mind interaction — attack when they're tapped out."* Without it EE is technically correct and
practically worthless.

---

## Track L — Later

| ID | Milestone | Notes | Status |
|---|---|---|---|
| `L1` | **Deferred features** | Physical card location · pack-opening entry · deck version comparison · casual legality mode · rival-deck modelling · Limited (Sealed/Draft) support | ⬜ |

---

## What we are deliberately *not* building

| Not building | Why |
|---|---|
| Meta / tournament statistics | Sources have **opted out** in `robots.txt`; current-set data is n=1–3 |
| A deck power rating | [D-016](DECISIONS.md#d-016) — no composite score, anywhere |
| Multi-user, accounts, sharing | Single user by design |
| Card scanner / OCR | [D-013](DECISIONS.md#d-013) — collector-number entry is faster |
| Our own card database | Riot's gallery is authoritative and cached |

---

## Locked principles

Non-negotiable. Changing one means writing a new `D-***`.

| Principle | Source |
|---|---|
| **The rulebook is the only authority** — community sources have been wrong twice | [D-020](DECISIONS.md#d-020), [D-035](DECISIONS.md#d-035) |
| **No composite score** — no grades, ratings or stars | [D-016](DECISIONS.md#d-016) |
| **Omit rather than fake** — uncertain statistics are left out | [D-022](DECISIONS.md#d-022) |
| **Synthesise, never enumerate** — *in output.* The data layer stays complete | [D-039](DECISIONS.md#d-039) |
| **Advice is pull, never push** — Forge never volunteers suggestions | [D-042](DECISIONS.md#d-042) |
| **Legality ≠ buildability** — a deck can be legal and unbuildable. Never conflate | `spec/LEGALITY.md` |
| **Ownership is the organising principle** — the reason Forge exists | [D-015](DECISIONS.md#d-015) |
| **No scraping** | [D-010](DECISIONS.md#d-010) |

---

## Open questions

Carried deliberately, not forgotten.

| # | Question | Resolve at |
|---|---|---|
| **X1** | Where does EE's conversation layer run — in-app chat, or Claude Code against exported deck state? | `D3` |
| **A6** | "Hosted, always-on" was recorded as *convention, not fact*. A permanently-online service for one user was never justified | `D3` |
| **G1–G4** | Generation: how many candidates? How is a no-identity seed handled? Does it propose battlefields? | `S5` |
| **E2–E7** | EE modelling depth — battlefield abilities, Legend abilities, refutation search depth, hidden cards, multi-unit boards | `S1` |
| **Q10** | ✅ **Answered** — errata and ban list are prose, so a small hand-maintained overlay | — |

---

*Where are we? → the Status Board, top of this file. What does "done" mean? →
[`PLAN.md`](PLAN.md). Why this way? → [`DECISIONS.md`](DECISIONS.md).*
