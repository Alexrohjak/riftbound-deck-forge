# Delivery Plan — Forge

> The complete arc from here to a finished tool: every stage, what gates it, what
> "done" means, and where the risk sits.
>
> **Created:** 2026-08-02 · **Revised:** 2026-08-02 after the
> [assumption audit](AUDIT.md) · **Status:** Stage 0 nearly complete

---

## ▶️ Next session — start here

**One question, and it takes seconds — you already know the answer from playing.**

| | What you do |
|---|---|
| **1** | When you build a deck around a Legend, do you get **one domain or two** to build with? Check a Legend's upper-left corner if unsure |

That is the last genuinely unknown rule in the project. Community sites say two, the
RiftScribe API reports one, and the rulebook states no count.

**Meanwhile Claude does [Stage 0.6](#stage-06--card-data-source-verification--no-code)** —
finding a card data source carrying champion tags and domains, since RiftScribe cannot
support 7 of the 27 legality checks.

> ✅ **Stage 0.5 is closed.** The premise — that the collection can produce complete
> legal decks — is confirmed by direct evidence: numerous decks already built from it.
> See [D-033](DECISIONS.md#d-033).

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
STAGE 0.5  Premise verification ............. ▓▓▓▓▓▓▓▓▓▓ ✅ CLOSED — premise confirmed
STAGE 0.6  Card data source verification ... ░░░░░░░░░░  🛑 ← the real blocker
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
| ~~Q7~~ | Best-of-three / sideboard scope | ✅ **In scope** — [D-032](DECISIONS.md#d-032) |
| ~~Q8~~ | Default legality mode | ✅ **Competition only**; casual mode not built — [D-032](DECISIONS.md#d-032) |
| Q10 | How errata and the ban list are ingested and kept current | Stage 4 |
| **DM1 / LR1** | 🛑 **RESOLVED AND NEGATIVE — RiftScribe cannot support legality.** Now **Stage 0.6** | **Stages 4, 5, 7** |

**Stage 0.6 is now the most urgent open item.** Verified across all 950 cards:
no champion tags, single-valued domains, no Signature supertype. **7 of 27 legality
checks are unimplementable** from the chosen data source, and
[D-002](DECISIONS.md#d-002) is partially invalidated.

---

## STAGE 0.5 — Premise verification ✅ **CLOSED**

**Status:** Resolved 2026-08-02 by direct evidence — see [D-033](DECISIONS.md#d-033)

The [audit](AUDIT.md) identified this as the project's highest-risk assumption
(A13, fragility 4 × impact 5 = **20**): *that the bottleneck is information, not
cards.* If the collection could not produce complete legal decks, Forge would have
been a tool that mostly says *"no."*

### ✅ Confirmed

> *"I have over a thousand cards … and I have made numerous decks already."*

**The experiment had already been run** — in the physical world, repeatedly, with a
positive result. The collection demonstrably supports complete legal decks. Counting
runes, battlefields and main deck cards was unnecessary.

**Lesson recorded:** the audit was right to demand verification and wrong about the
cost. The answer was available by **asking the user about their own experience**, not
by designing an experiment to prove a thing they had already done.

### One question survived

Embedded in the original Check 1 was a question that is **not** about the collection
at all, but about the rules:

> **Does a Champion Legend carry one domain, or two?**

Community sites say two. The RiftScribe API reports one. **The rulebook states no
count** — CR 103.1.b.2 says only *"the domains of your Champion Legend."* This gates
Domain Identity, which gates every card in every deck.

**You do:** answer from experience, or glance at a Legend's upper-left corner.

---

## STAGE 0.6 — Card data source verification 🛑 **NO CODE**

**Size:** S · **Gate:** none — parallel with 0.5 · **Blocks Stages 4, 5, 7**

**RiftScribe has been verified insufficient for legality.** Measured across all 950
cards on 2026-08-02:

| Gap | Evidence |
|---|---|
| No champion tags | `tags` empty on **0 / 950** cards |
| Domains single-valued | `faction` has 7 values, none compound — multi-domain cards unrepresentable |
| No Signature supertype | No field distinguishes Signature cards |

This blocks **7 of 27 legality checks** (L8, L10, L17–L21) and partially invalidates
[D-002](DECISIONS.md#d-002).

### Work

1. Evaluate **Scrydex**, **API TCG**, and **RiftboundCardDatabase** for champion tags,
   multi-domain representation, and the Signature supertype
2. If none suffice: scope **hand-authoring the supplement**. It is bounded — 100
   Legends and their tags, plus Signature card identification. Tedious, not hard
3. **Verify against physical cards** whether Champion Legends carry one domain or two.
   Community sources say two; RiftScribe says one; the rulebook does not state a count

**Done when:** a source (or combination) is identified that can support all 27 checks.

> **Why this is pre-work, not Stage 4:** if no source exists and hand-authoring is
> required, that changes the size and shape of Stage 4 substantially — and it is
> better known before the architecture is chosen.

---

## STAGE 1 — Visualization / interface design

**Size:** L · **Gate:** none — Stage 0.5 closed · **Phase 2 of the SOP**

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
- Integrate whichever source Stage 0.6 identified for champion tags, multi-domain
  representation and the Signature supertype — **RiftScribe alone is insufficient**
- Errata and ban list ingestion (Q10)
- New-set refresh strategy

**Done when:** the full pool is queryable offline, variants correctly collapsed, and
champion tags / domains / Signature status available for every card.

---

## STAGE 5 — Legality engine ⚠️ **highest correctness risk**

**Size:** M–L · **Gate:** Stage 4 **and Stage 0.6 resolved** · **Parallel with Stage 6**

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
| 🛑 **Card data cannot support legality** — verified, not speculative | 🛑 **Blocking** | **Stage 0.6** — evaluate alternative sources; hand-authored supplement is bounded (100 Legends) if none suffice |
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
