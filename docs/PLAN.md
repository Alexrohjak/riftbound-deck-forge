# Delivery Plan — Forge

> The complete arc from here to a finished tool: every stage, what gates it, what
> "done" means, and where the risk sits.
>
> **Created:** 2026-08-02 · **Revised:** 2026-08-02 after the
> [assumption audit](AUDIT.md) · **Status:** Stage 0 nearly complete

---

## How to read this

Work is expressed in **stages**, not dates. This is an evenings-and-weekends personal
project; calendar estimates would be fiction. Each stage carries:

- **Size** — S / M / L, relative effort only
- **Gate** — what must be true before it may start
- **Done when** — the observable condition that ends it
- **You do** — what Alexander does to validate it (the SOP's Human QA gate, made concrete)

Stages are sequenced by **dependency**. Where two are genuinely parallel, it says so.

### Honest scale

**Phase A is a season or two of evenings, not a few weekends.** Stage 7 alone is
substantial, and Stages 1, 5 and 8 are each real work. This is worth knowing before
starting rather than discovering in month three.

**The mitigation is Stage 3.5**, which puts something genuinely usable in your hands
within weeks rather than after four stages of infrastructure.

---

## The arc

```
STAGE 0    Discovery ........................ ▓▓▓▓▓▓▓▓▓▓ ~95%
STAGE 0.5  Premise verification — NO CODE ... ░░░░░░░░░░  ← do this first
STAGE 1    Visualization / interface design . ░░░░░░░░░░
STAGE 2    Architecture .................... ░░░░░░░░░░
────────────────────────── BLUEPRINT LOCK ──────────────────────────
STAGE 3    Foundations & deployment spine .. ░░░░░░░░░░
STAGE 3.5  Walking skeleton ⭐ ............. ░░░░░░░░░░  ← first real value
STAGE 4    Card data layer ................. ░░░░░░░░░░
STAGE 5    Legality engine ⚠ highest risk .. ░░░░░░░░░░
STAGE 6    Collection ...................... ░░░░░░░░░░
──────────────────── MILESTONE: the collection is real ─────────────────
STAGE 7    Deck workbench .................. ░░░░░░░░░░
STAGE 8    Statistics — Tiers 1 & 2 ........ ░░░░░░░░░░
──────────────────── MILESTONE: PHASE A COMPLETE ───────────────────────
SPIKE G    Generator research spike ........ ░░░░░░░░░░  ← hypothesis, not commitment
STAGE 9    Deferred features ............... ░░░░░░░░░░
```

---

## STAGE 0 — Discovery

**Size:** M · **Status:** ~95%

### Complete

Problem and scope ([DISCOVERY.md](DISCOVERY.md)) · 24+ decisions with rationale
([DECISIONS.md](DECISIONS.md)) · rulebook-cited rules
([reference/GAME-RULES.md](reference/GAME-RULES.md)) · data landscape
([reference/DATA-SOURCES.md](reference/DATA-SOURCES.md)) · statistics framework
([spec/DECK-STATS.md](spec/DECK-STATS.md)) · data model
([spec/DATA-MODEL.md](spec/DATA-MODEL.md)) · legality specification
([spec/LEGALITY.md](spec/LEGALITY.md)) · assumption audit ([AUDIT.md](AUDIT.md))

Q1 · Q2 · Q3 · Q6 · Q9 resolved. Q5 resolved in principle by the mechanical-playstyle
proposal in [spec/GENERATOR.md §5](spec/GENERATOR.md).

### Remaining

| # | Item | Blocks |
|---|---|---|
| Q7 | Is best-of-three / sideboard play in scope | Stage 5 scope only |
| Q8 | Default legality mode — casual or competition. **Both are supported regardless** | Stage 5 default only |
| Q10 | How errata and the ban list are ingested and kept current | Stage 4 |
| **DM1 / LR1** | ⚠️ **Does any source expose champion tags and the Signature supertype?** | **Stage 5 hard blocker** |

**DM1 is now the most urgent open item** — five legality checks (L17–L21) are
unimplementable without it, and it was discovered only while writing the data model.

---

## STAGE 0.5 — Premise verification ⭐ **NO CODE**

**Size:** S — about two hours · **Gate:** none · **Do this before anything else**

The [audit](AUDIT.md) identified the project's most fragile foundational assumption
(A13, risk 20): **that the bottleneck is information, not cards.**

The collection holds perhaps 250–300 of 767 names, and Domain Identity restricts any
deck to 2 of 6 domains — so the usable pool for any one Legend may be only 80–100
names. If a complete legal deck cannot be assembled, Forge becomes a tool that mostly
says *"no."*

### The test

1. Pick one owned Champion Legend
2. By hand, count whether the collection contains **40 legal main deck cards + 12
   matching runes + 3 battlefields + an eligible Chosen Champion**
3. Repeat for a **second Legend in different domains**

### Outcomes

| Result | Meaning |
|---|---|
| Both succeed | ✅ Premise holds. Build Forge as planned |
| One succeeds | ⚠️ Forge is a **gap-analysis tool**, not a deckbuilder. Different product — revisit scope |
| Neither succeeds | 🛑 The bottleneck is **cards**, not information. **No software fixes that** |

**You do:** the counting. Two hours, no code, and it either de-risks or redirects the
entire project.

---

## STAGE 1 — Visualization / interface design

**Size:** L · **Gate:** Stage 0.5 passed · **Phase 2 of the SOP**

The largest remaining unknown. Genuinely novel rather than a routine UI pass, because:

- **Ownership is the organising principle** (D-015) — no existing tool works this way,
  so there is no layout to borrow
- **Full desktop/phone parity** (D-018) — the same workbench under a mouse and a thumb (Q11)

### Work

1. Aesthetic direction — explicitly **not** a Piltover Archive clone (D-014)
2. **Ownership visual language** — owned / unowned / committed-elsewhere, and how
   *"this card is in Jinx Aggro v2"* appears without nagging (D-017)
3. **Three-tier statistics language** — the visual encoding preventing a Tier 3
   estimate from passing as Tier 1 (D-022). Non-negotiable, therefore designed
4. Desktop layout — gallery, deck zones, The Bench, statistics
5. Phone layout — same capability, different ergonomics
6. Collection entry mode — keyboard, collector-number keyed (D-013)
7. **Interactive prototype**

**Done when:** a clickable prototype exists that you have used and approved.
**You do:** use the prototype and say what feels wrong.

**Risk:** designing two ergonomics for one app is where this could sprawl.
**Mitigation:** design the **phone layout first** under tighter constraints, then
expand — never shrink a desktop design down.

---

## STAGE 2 — Architecture

**Size:** M · **Gate:** Stage 1 approved (D-019 — design constrains the stack)

D-018 narrowed this considerably: editing on two devices demands a single source of
truth. **But the audit flagged this as convention, not fact** (A6) — a hosted,
always-on, internet-reachable service for exactly one user was never separately
justified. **Re-examine before accepting.**

### Decisions

- Stack and framework
- Hosting — and what it costs to run **indefinitely**
- Storage for collection, decks, commitments
- Card cache strategy (950 cards — cacheable whole)
- Access control: one user, public internet
- **Backup and export** — see [spec/DATA-MODEL.md §6](spec/DATA-MODEL.md#6-backup-and-portability)

**Done when:** an architecture document exists with the stack chosen and justified.

> ### 🔒 BLUEPRINT LOCK
> Stages 0–2 complete. `BLUEPRINT.md` is written and locked. Per the SOP, **no
> significant logic precedes this point**; afterwards every change maps to a task.

---

## STAGE 3 — Foundations & deployment spine

**Size:** S · **Gate:** BLUEPRINT locked

Scaffold, repo structure, test harness, CI, and **a deployed hello-world reachable
from your phone.**

Deployment comes first deliberately: phone parity is a hard requirement, and finding a
hosting problem after the workbench exists would be expensive.

**Done when:** a trivial page is live, reachable from the phone, deploying automatically.

---

## STAGE 3.5 — Walking skeleton ⭐

**Size:** M · **Gate:** Stage 3

**The most important change to this plan.** The [audit](AUDIT.md) identified
time-to-first-value as the dominant risk (A12, risk 20): the original sequence
required four stages of layered infrastructure before anything was usable.

A **walking skeleton** is end-to-end and deliberately crude:

- **One** hardcoded Legend and its domain pool
- Card data loaded from a static file — no ingestion pipeline
- Legality: **only** deck-size and domain-identity checks
- Collection: a hand-written list of ~30 cards
- Add and remove cards; see the count
- **One** statistic — the energy curve

Ugly, incomplete, and **genuinely usable end-to-end.**

**Why:** every later stage becomes *"replace the crude part with the real one"*
instead of *"build a layer and hope it fits."* Design mistakes surface in week three
rather than month four.

**Done when:** you can open it on your phone and put cards into a deck.
**You do:** use it and report what feels wrong — that feedback reshapes Stages 4–8.

---

## STAGE 4 — Card data layer

**Size:** S–M · **Gate:** Stage 3.5

- Ingest the full pool from RiftScribe (D-002) — 950 printings, 767 names
- **Cache locally in full** — mitigates the dependency disappearing
- Pagination: `limit` caps at 200; the `set` filter does not work — filter client-side
- **Variant collapsing** by name ([spec/DATA-MODEL.md §2](spec/DATA-MODEL.md))
- ⚠️ **Resolve DM1** — champion tags and Signature supertype. Fall back to Scrydex,
  API TCG, or hand-authored data if RiftScribe lacks them
- Errata and ban list ingestion (Q10)
- New-set refresh strategy

**Done when:** the full pool is queryable offline with variants correctly collapsed,
and DM1 is resolved.

---

## STAGE 5 — Legality engine ⚠️ **highest correctness risk**

**Size:** M–L · **Gate:** Stage 4 (DM1 resolved) · **Parallel with Stage 6**

Specification: [spec/LEGALITY.md](spec/LEGALITY.md) — 27 checks, 10 rulebook-derived
tests.

Built early and tested heavily because everything downstream trusts it.

**Done when:** checks L1–L27 implemented, tests T1–T10 passing, and CR 103 / TR 601
**read in full** and reconciled against the specification.

**Risk (LR2):** the Signature card rule was found only by reading the PDF, after
community sources had already been wrong about the sideboard. **There are probably
more.** Mitigation — read the rulebook line by line, never summaries; encode every
rulebook example as a test.

---

## STAGE 6 — Collection

**Size:** M · **Gate:** Stage 4 · **Parallel with Stage 5**

- **Collector-number keyboard entry** (D-013)
- Name typeahead fallback
- **Preconstructed products as one-click bundles** — ~200 cards, zero typing
- Quantity and variant handling
- The **commitment model** — DRAFT vs BUILT
  ([spec/DATA-MODEL.md §3](spec/DATA-MODEL.md#3-commitment))

> ### 🏁 MILESTONE — the collection is real
> You sit down with your boxes and enter the actual collection. From here Forge
> operates on real data, not fixtures.
>
> **Audit finding A3 (risk 15):** this was assumed rather than planned. It is now an
> explicit milestone with a completion check — spot-check 20 random names against the
> boxes and confirm the counts match.

---

## STAGE 7 — Deck workbench

**Size:** L · **Gate:** Stages 5 + 6

The centrepiece.

- Gallery — **owned by default**, ownership as a filter dimension (D-015)
- Filters: set · collector number · domain · type · rarity · variant · energy · power ·
  might · owned/unowned
- Zones: Legend · Champion · Main · Runes · Battlefields · Sideboard
- **The Bench** — staging area, saved with the deck, never validated
- Live legality validation
- **Commitment awareness** — unavailable cards always show *which deck holds them*
- Save, name, edit, snapshot, compare
- DRAFT → BUILT promotion with conflict resolution
- **Full phone parity on every screen**

**Done when:** a complete legal deck can be built end-to-end on both desktop and phone.

---

## STAGE 8 — Statistics, Tiers 1 & 2

**Size:** M–L · **Gate:** Stage 7 · Specification:
[spec/DECK-STATS.md](spec/DECK-STATS.md)

Tier 1 facts and Tier 2 probabilities, including the flagship **rune feasibility
curve** (D-023). **Tier 3 is deliberately absent**, and the panel must read as
complete without it.

**Done when:** both tiers render with correct visual separation, inside the <2 s target.

**Risk:** Monte Carlo performance on a phone. Measure early; move server-side if needed.

> ### 🏁 MILESTONE — PHASE A COMPLETE
> The workbench is usable for real deckbuilding. **If the project stopped here it
> would still be worth having** — which is exactly why the generator can be optional.

---

## SPIKE G — Generator research spike

**Size:** ? · **Gate:** Phase A complete **and** evidence of real need
**Specification:** [spec/GENERATOR.md](spec/GENERATOR.md)

⚠️ **Downgraded from a planned stage to a hypothesis with kill conditions**, following
audit finding A9. The stated goal is to *enjoy hours of tinkering*; a generator
automates tinkering. What is actually wanted may be a workbench that makes tinkering
fast and well-informed — which is Phase A.

It also carries an unresolved contradiction: **a generator needs an objective
function, and D-016 forbids a composite score.** Leading resolution is multi-objective
Pareto selection. **Unvalidated.**

**Output:** a recommendation to build, redesign, or cancel — **not a feature.**

---

## STAGE 9 — Deferred features

| Feature | Waiting on |
|---|---|
| **Physical card location** (Q6, D-021) | The new organising box |
| Pack-opening entry mode | Base entry already covers it |
| Deck version comparison | Emerges from real use |
| Sideboard support | Q7 — rules already captured |
| Tier 3 / meta adapter | Q4 — **and its relevance problem**, see below |

---

## Testing strategy

| Layer | Approach |
|---|---|
| **Legality** | Exhaustive. Every check independently tested; every rulebook example a fixture. **Non-negotiable** |
| **Statistics — Tier 1** | Deterministic; straightforward assertions |
| **Statistics — Tier 2** | ⚠️ Genuinely hard. Probabilities cannot be asserted exactly. Approach: verify Monte Carlo against **closed-form hypergeometric** where both apply, then test invariants (monotonicity, bounds, convergence) where only simulation applies |
| **Data layer** | Contract tests against cached fixtures, so RiftScribe changes surface as failures |
| **UI** | Manual, via the Human QA gates. Automated UI testing is disproportionate for one user |

---

## Maintenance

Not a phase — an **ongoing obligation** that begins at Stage 4.

- **New sets ship regularly** (Vendetta, 31 July 2026). Card refresh must be routine
- **Errata revise existing cards** — including cards already owned and already in
  BUILT decks. Refresh must reconcile, not blindly overwrite (DM4)
- **Rules updates change legality** — the sideboard moved from 8 to 10 in July 2026.
  Re-verify [spec/LEGALITY.md](spec/LEGALITY.md) against each rules release
- **The ban list changes independently** of set releases

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| ⭐ **Time-to-first-value** — enthusiasm decays before the tool is useful (audit A12) | 🔴 High | **Stage 3.5 walking skeleton** — usable in weeks, not months |
| **Premise may not hold** — collection may not support multiple decks (A13) | 🔴 High | **Stage 0.5**, two hours, before any code |
| **DM1 / LR1** — champion tags & Signature supertype may be unavailable | 🔴 High | Resolve in Stage 4; fallback sources identified |
| **Undiscovered rules** (LR2) | 🔴 High | Rulebook line by line; every example a test |
| **Collection entry never happens** (A3) | 🟡 Medium | Explicit milestone with a spot-check |
| RiftScribe disappears | 🟡 Medium | Full local cache from Stage 4 |
| Phone/desktop design sprawl | 🟡 Medium | Phone-first, then expand |
| Monte Carlo too slow on mobile | 🟡 Medium | Measure early; server-side fallback |
| Generator scope creep | 🟢 Low | Downgraded to a spike with kill conditions |
| **Meta data relevance** (A8) — tournament winrates come from unlimited pools and may not transfer to a 250-name collection | 🟢 Low | Tier 3 optional by design; question is answerable without obtaining data |

---

## Guiding principles

1. **The rulebook is the only legality authority** (D-020). Community guides have
   already been wrong once.
2. **Phase A must stand alone.** If the generator is never built, the workbench is
   still worth having.
3. **Honesty over polish in statistics** (D-022). Omit Tier 3 rather than fake it.
4. **Never a dead end.** An unavailable card shows where it is; an impossible deck
   shows what is missing.
5. **No scraping** (D-010).
6. **Design constrains the stack**, not the reverse (D-019).
7. ⭐ **Verify premises before building on them.** The audit exists because this was
   nearly skipped.
