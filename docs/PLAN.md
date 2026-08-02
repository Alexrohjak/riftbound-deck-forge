# Delivery Plan — Forge

> Every stage from here to a finished tool: what gates it, what "done" means, and where the
> risk sits.
>
> **Created:** 2026-08-02 · **Rewritten:** 2026-08-02 (v2 — EE promoted to a first-class
> track) · **Status:** Discovery complete; Stage 1 is next

**Navigation:** [`spec/OVERVIEW.md`](spec/OVERVIEW.md) (system map) ·
[`DECISIONS.md`](DECISIONS.md) · [`AUDIT.md`](AUDIT.md) ·
[`reference/COMPENDIUM.md`](reference/COMPENDIUM.md)

---

## ▶️ Next session

### 🎨 Stage 1 — design the interface

**All blockers cleared.** Discovery is complete. The next work is the biggest remaining
unknown and the most enjoyable part: deciding what Forge looks and feels like.

> Nothing to prepare. Bring opinions about how it should feel.

⚠️ **Stage 1 has grown.** It must now design **two** things, not one:
1. The **workbench** — gallery, deck zones, The Bench, ownership language
2. **How EE speaks** — an answer with a statement, a lever and its grounding is not a stat
   tile. Whether EE is a panel, a conversation, or both, is a Stage 1 question (X4)

---

## 1. What Forge is

Two phases. **Each stands alone** — if the project stopped after Phase A it would still be
worth having.

| Phase | What | Status |
|---|---|---|
| **A — The Workbench** | Catalogue what you own; browse, filter and build decks by hand with live legality and honest statistics. Cards sleeved into a BUILT deck stop being available and always show which deck holds them | Specified |
| **B — EE, the strategist** | Ask questions about your cards, decks and matchups; get answers grounded in a deterministic rules core. *"What's this card good at? How do I pilot this? What should I fear? What do I sideboard?"* | Specified — [`spec/EVALUATION.md`](spec/EVALUATION.md) |
| ⏸️ *Spike G — Generator* | Auto-propose decks. **Deferred**, with kill conditions | [`spec/GENERATOR.md`](spec/GENERATOR.md) |

---

## 2. How to read this

Work is in **stages**, not dates — this is an evenings-and-weekends project and calendar
estimates would be fiction. Each stage carries:

- **Size** — S / M / L / XL, relative effort only
- **Gate** — what must be true before it starts
- **Done when** — the observable condition that ends it
- **You do** — how Alexander validates it (the SOP's Human QA gate, made concrete)

### Honest scale

**Phase A is a season or two of evenings. Phase B is comparable again** — the EE rules core
is the single largest component in the project, because Riftbound's showdown/chain system
and card-level rule overrides make it a real rules engine, not a calculator.

**The mitigation is Stage 3.5**, which puts something genuinely usable in your hands within
weeks rather than after four stages of infrastructure.

---

## 3. The arc

```
FOUNDATION
  0    Discovery ......................... ▓▓▓▓▓▓▓▓▓▓ ✅ COMPLETE
  1    Interface design .................. ░░░░░░░░░░  ← NEXT
  2    Architecture ...................... ░░░░░░░░░░
  ──────────────────── BLUEPRINT LOCK ────────────────────
  3    Foundations & deployment spine .... ░░░░░░░░░░
  3.5  Walking skeleton ⭐ ............... ░░░░░░░░░░  ← first real value
  4    Card data layer ................... ░░░░░░░░░░

              ┌──────────────── then two parallel tracks ────────────────┐

TRACK A — Workbench                     TRACK B — EE
  5   Legality engine ⚠ ....... ░░░░      9   Rules core 🔴 ......... ░░░░
  6   Collection .............. ░░░░     10   Analysis layer ........ ░░░░
  7   Deck workbench .......... ░░░░     11   Synthesis layer ⭐ .... ░░░░
  8   Statistics .............. ░░░░     12   Conversation layer .... ░░░░
  ── MILESTONE: PHASE A ──                ── MILESTONE: PHASE B ──

  13   Deferred features ................ ░░░░░░░░░░
  G    Generator spike (kill conditions) ░░░░░░░░░░
```

**Why two tracks:** the EE rules core is pure logic over cached card data. It needs Stage 4
and nothing else — not the workbench, not the collection, not the UI. It can be built and
tested headlessly, in parallel, which also makes it the most resumable work in the project.

---

## 4. Foundation stages

### Stage 0 — Discovery ✅ **COMPLETE**

Problem and scope · 35+ decisions with rationale · the rules and card universe read from
primary sources · data landscape · statistics framework · data model · legality spec ·
EE spec · assumption audit.

**Resolved during Discovery:**

| | |
|---|---|
| ✅ Premise | Decks already built from this collection ([D-033](DECISIONS.md#d-033)) |
| ✅ Card data | Riot's official gallery — 1,180 printings, 935 names ([D-034](DECISIONS.md#d-034)) |
| ✅ Rules scope | Tournament rules, best-of-three ([D-032](DECISIONS.md#d-032)) |
| ✅ Rules authority | Official PDFs only ([D-035](DECISIONS.md#d-035)) |
| ✅ Q10 — errata & ban list | Prose, not APIs. A small hand-maintained overlay — COMPENDIUM §VI.7 |
| ✅ Legend domains | Exactly 2, all 118 printings; **49 distinct Legends** |

---

### Stage 1 — Interface design 🎨 **← NEXT**

**Size:** L · **Gate:** ✅ none · **SOP Phase 2**

The largest remaining unknown, and genuinely novel rather than a routine UI pass:

- **Ownership is the organising principle** ([D-015](DECISIONS.md#d-015)) — no existing tool
  works this way, so there is no layout to borrow
- **Full desktop/phone parity** ([D-018](DECISIONS.md#d-018))
- ⭐ **EE needs a presentation language.** An answer with a statement, a lever and its
  grounding is a new component type

**Work:** aesthetic direction (explicitly not a Piltover Archive clone,
[D-014](DECISIONS.md#d-014)) · ownership visual language (owned / unowned /
committed-elsewhere) · **EE answer presentation** · honesty-tier encoding
([D-022](DECISIONS.md#d-022)) · desktop layout · phone layout · collection entry mode ·
**interactive prototype**

**Done when:** a clickable prototype exists that you have used and approved.
**You do:** use it and say what feels wrong.

**Risk:** designing two ergonomics for one app is where this could sprawl.
**Mitigation:** design the **phone layout first**, then expand — never shrink a desktop
design down.

---

### Stage 2 — Architecture

**Size:** M · **Gate:** Stage 1 approved ([D-019](DECISIONS.md#d-019) — design constrains the stack)

Decisions: stack · hosting and its **indefinite** running cost · storage · card cache ·
access control · backup and export.

⭐ **New:** **where EE's conversation layer runs** (X1) — in-app chat with an API key and
per-query cost, or Claude Code against an exported deck state. This materially affects
hosting and cost.

> ⚠️ The audit flagged "hosted, always-on" as convention rather than fact (A6). A
> permanently-online service for exactly one user was never separately justified.
> **Re-examine before accepting.**

**Done when:** an architecture document exists with the stack chosen and justified.

> ### 🔒 BLUEPRINT LOCK
> Stages 0–2 complete. Per the SOP, **no significant logic precedes this point**;
> afterwards every change maps to a task.

---

### Stage 3 — Foundations & deployment spine

**Size:** S · **Gate:** BLUEPRINT locked

Scaffold, repo structure, test harness, CI, and **a deployed hello-world reachable from
your phone.** Deployment comes first deliberately — phone parity is a hard requirement and
finding a hosting problem later would be expensive.

**Done when:** a trivial page is live, reachable from the phone, deploying automatically.

---

### Stage 3.5 — Walking skeleton ⭐

**Size:** M · **Gate:** Stage 3

**The most important sequencing decision in this plan.** The [audit](AUDIT.md) identified
time-to-first-value as the dominant risk (A12): the original plan needed four stages of
infrastructure before anything was usable.

Deliberately crude, end-to-end: one hardcoded Legend · card data from a static file ·
legality limited to deck size and domain identity · a hand-written ~30-card collection ·
add and remove cards · one statistic (the energy curve).

Ugly, incomplete, and **genuinely usable.**

**Done when:** you can open it on your phone and put cards into a deck.
**You do:** use it and report what feels wrong — that feedback reshapes everything after.

---

### Stage 4 — Card data layer

**Size:** S–M · **Gate:** Stage 3.5 · **Gates both tracks**

Ingest the full pool from Riot's official gallery — **1,180 printings / 935 names**, one
~3.2 MB request. Cache locally in full. Resolve `buildId` at fetch time, never hard-code it.
Variant collapsing **by name**. **Errata and ban-list overlay** (Q10) — hand-maintained,
~10 banned names and ~8 errata per set.

**Done when:** the full pool is queryable offline, variants collapsed by name, with champion
tags, domains and Signature status available for every card.

---

## 5. Track A — the Workbench

### Stage 5 — Legality engine ⚠️ **highest correctness risk**

**Size:** M–L · **Gate:** Stage 4 · **Parallel with Stage 6**

Specification: [`spec/LEGALITY.md`](spec/LEGALITY.md) — **33 checks**, 13 rulebook-derived tests.

Built early and tested heavily because everything downstream trusts it.

**Done when:** L1–L33 implemented, T1–T13 passing, and the spec reconciled against the
rulebooks (both now read in full — see [COMPENDIUM](reference/COMPENDIUM.md)).

> **Risk LR2 is confirmed real, twice over.** The Signature-card rule and the `Unique`
> keyword were both found only by reading the PDF directly. **There are probably more.**
> Mitigation: read the rulebook line by line, never summaries; encode every rulebook
> example as a test.

### Stage 6 — Collection

**Size:** M · **Gate:** Stage 4 · **Parallel with Stage 5**

Collector-number keyboard entry ([D-013](DECISIONS.md#d-013)) — must parse **all 17
`publicCode` forms**, including `VEN-R01` runes and `UNL-T1` tokens. Name typeahead
fallback. Preconstructed products as one-click bundles. Quantity and variant handling. The
DRAFT/BUILT commitment model.

> ### 🏁 MILESTONE — the collection is real
> You sit down with your boxes and enter the actual collection. From here Forge operates on
> real data, not fixtures.
>
> **Audit finding A3:** this was assumed rather than planned. It is now an explicit
> milestone with a completion check — spot-check 20 random names against the boxes.

### Stage 7 — Deck workbench

**Size:** L · **Gate:** Stages 5 + 6

The centrepiece. Gallery owned-by-default with ownership as a filter dimension · filters ·
zones (Legend, Champion, Main, Runes, Battlefields, Sideboard) · **The Bench** (staging
area, saved with the deck, never validated) · live legality · **commitment awareness** —
unavailable cards always show which deck holds them · save, name, edit, snapshot, compare ·
DRAFT → BUILT promotion · **full phone parity**.

**Done when:** a complete legal deck can be built end-to-end on both desktop and phone.

### Stage 8 — Statistics

**Size:** M–L · **Gate:** Stage 7 · Spec: [`spec/DECK-STATS.md`](spec/DECK-STATS.md)

Tier 1 facts and Tier 2 probabilities, including the flagship **rune feasibility curve**
([D-023](DECISIONS.md#d-023)). Tier 3 deliberately absent, and the panel must read as
complete without it.

**Done when:** both tiers render with correct visual separation, inside the <2 s target.
**Risk:** Monte Carlo performance on a phone. Measure early; move server-side if needed.

> ### 🏁 MILESTONE — PHASE A COMPLETE
> The workbench is usable for real deckbuilding. **If the project stopped here it would
> still be worth having.**

---

## 6. Track B — EE

Specification: [`spec/EVALUATION.md`](spec/EVALUATION.md)

### Stage 9 — Rules core 🔴 **largest single component**

**Size:** XL · **Gate:** Stage 4 · **Parallel with Track A**

A real rules engine: game state · legal-action enumeration · **chain resolution (LIFO,
`[Reaction]`-only when closed)** · **showdowns as alternating priority windows** · combat
damage assignment under Tank/Backline/lethal-first/no-overkill · replacement effects ·
layers · cleanups including recall-attackers-on-stall.

⚠️ **Rules must be data, not code.** **21 cards rewrite rules an engine would hardcode** —
Elder Dragon voids the lethal-damage threshold, Dune Surfer voids `Tank`, Baron Nashor adds
a battlefield mid-game. CR 002 — *card text supersedes rules text* — is a design requirement.

**Build vertically:** one battlefield, 1v1, full fidelity first. Then widen.

**Done when:** every worked example in CR 355–359, 370–375 and 465.2 passes as a fixture,
and each of the 21 rule-warping cards has a regression test.

### Stage 10 — Analysis layer

**Size:** L · **Gate:** Stage 9

Refutation search · robustness (breadth, cost, speed, reach, frequency) · answer coverage ·
threat pressure classes · Legend fit · dead-card detection.

**Also here:** the annotation overlays — **~153 card effects** and **49 Legend abilities**,
hand-annotated rather than parsed.

**Done when:** EE can answer Q-CARD, Q-COMPARE and Q-LEGEND correctly, headlessly.

### Stage 11 — Synthesis layer ⭐ **the one that makes EE usable**

**Size:** M · **Gate:** Stage 10

Pattern vocabulary · salience ranking · statement budgets.

> **This is the layer that turns "66 cards refute this" into "fragile to cheap Mind
> interaction — attack when they're tapped out."** Without it EE is technically correct and
> practically useless. See [`spec/EVALUATION.md`](spec/EVALUATION.md) §2.

**Done when:** no answer exceeds its statement budget, enforced by test.
**You do:** read 20 answers and say which ones you'd actually act on.

### Stage 12 — Conversation layer

**Size:** M · **Gate:** Stage 11 + the X1 decision from Stage 2

Open questions, follow-ups, "why?", memory of the conversation.

**Discipline, enforced by test:** never does arithmetic, never adjudicates rules, never
emits a number that didn't come from a tool call.

> ### 🏁 MILESTONE — PHASE B COMPLETE
> You can ask Forge questions about your decks and get answers you'd act on.

---

## 7. Stage 13 — Deferred features

| Feature | Waiting on |
|---|---|
| Physical card location (Q6, [D-021](DECISIONS.md#d-021)) | The new organising box |
| Pack-opening entry mode | Base entry already covers it |
| Deck version comparison | Emerges from real use |
| Casual (non-tournament) legality mode | Wanted, not just possible |
| Specific rival-deck modelling for EE | The threat-space model shipping first |
| Limited (Sealed/Draft) support | A genuinely different validator — COMPENDIUM §II.9 |

## 8. Spike G — Generator

**Gate:** Phase A complete **and** evidence of real need · Spec: [`spec/GENERATOR.md`](spec/GENERATOR.md)

⚠️ **Downgraded to a hypothesis with kill conditions.** The stated goal is to enjoy hours of
tinkering; a generator automates tinkering. It also needs an objective function, and
[D-016](DECISIONS.md#d-016) forbids a composite score.

> **EE weakens the case further.** If Forge can explain a deck's strengths, gaps and lines
> precisely, the reason to auto-generate shrinks. **Output: a recommendation, not a feature.**

---

## 9. Testing strategy

| Layer | Approach |
|---|---|
| **Legality** | Exhaustive. Every check independently tested; every rulebook example a fixture. **Non-negotiable** |
| **EE rules core** | The rulebook *is* the test suite — every worked example a fixture. Plus a regression test per rule-warping card |
| **EE synthesis** | ⭐ Budget tests: no answer exceeds its statement budget or names >3 example cards |
| **EE conversation** | Adversarial: assert no number appears that didn't come from a tool call |
| **Statistics — Tier 1** | Deterministic assertions |
| **Statistics — Tier 2** | ⚠️ Genuinely hard. Verify Monte Carlo against **closed-form hypergeometric** where both apply; test invariants (monotonicity, bounds, convergence) where only simulation applies |
| **Data layer** | Contract tests against cached fixtures, so upstream changes surface as failures |
| **UI** | Manual, via Human QA gates. Automated UI testing is disproportionate for one user |

## 10. Maintenance

Not a phase — an **ongoing obligation** from Stage 4.

| Clock | Cadence | Response |
|---|---|---|
| **New sets** | ~quarterly | Re-fetch gallery; refresh `buildId` |
| **Errata** | Per set, ~8 cards | Hand-maintained overlay keyed by name |
| **Rules updates** | With sets and patches | **Re-read the changed PDF sections**, never summaries |
| **Ban list** | Independent of sets | Hand-maintained — currently 5 cards + 5 battlefields + 1 legend (2v2) |

## 11. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| ⭐ **Time-to-first-value** — enthusiasm decays before the tool is useful (A12) | 🔴 High | **Stage 3.5 walking skeleton** |
| 🆕 **EE rules core is underestimated** — showdowns, chains, layers and 21 rule-overrides make it a real engine | 🔴 High | Build vertically; rulebook examples as fixtures; headless and resumable |
| 🆕 **EE answers become noise** — technically correct, practically unreadable | 🔴 High | **Stage 11 synthesis** + budget tests. This killed the v2 spec design |
| **Undiscovered rules** (LR2) — confirmed twice (Signature, `Unique`) | 🔴 High | Rulebook line by line; every example a test |
| **Collection entry never happens** (A3) | 🟡 Medium | Explicit milestone with a spot-check |
| **Annotation drift** — 153 effects + 49 Legends by hand | 🟡 Medium | Completeness test: every card matching `Deal\|Kill\|Stun` must have an annotation |
| Phone/desktop design sprawl | 🟡 Medium | Phone-first, then expand |
| Monte Carlo too slow on mobile | 🟡 Medium | Measure early; server-side fallback |
| Card data source disappears | 🟡 Medium | Full local cache from Stage 4 |
| Generator scope creep | 🟢 Low | Deferred spike with kill conditions |
| ~~Premise may not hold~~ | ✅ Closed | [D-033](DECISIONS.md#d-033) |
| ~~Card data can't support legality~~ | ✅ Closed | [D-034](DECISIONS.md#d-034) |

## 12. Guiding principles

The full list lives in [`spec/OVERVIEW.md`](spec/OVERVIEW.md) §4. The three that most often
decide an argument:

1. **The rulebook is the only authority.** Community sources have been wrong twice.
2. **Omit rather than fake.** No grades, no invented certainty.
3. **Synthesis over enumeration.** Three useful statements beat sixty-six true ones.
