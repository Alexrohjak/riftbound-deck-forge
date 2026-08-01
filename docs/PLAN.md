# Delivery Plan — Riftbound Deck Forge

> **Purpose:** the complete arc from where we are to a finished tool — every stage,
> what gates it, what "done" means, and where the risk sits.
>
> **Created:** 2026-08-02 · **Status:** Stage 0 in progress

---

## How to read this

Work is expressed in **stages**, not dates. This is an evenings-and-weekends personal
project; calendar estimates would be fiction. Instead each stage carries:

- **Size** — S / M / L, relative effort only
- **Gate** — the condition that must be true before the stage may start
- **Done when** — the observable condition that ends it
- **Risk** — what could go wrong, where known

Stages are sequenced by **dependency**, not preference. Where two stages are genuinely
parallel, that is stated.

---

## The arc at a glance

```
STAGE 0  Discovery ......................... ▓▓▓▓▓▓▓▓▓░ ~90%
STAGE 1  Visualization / interface design .. ░░░░░░░░░░  next
STAGE 2  Architecture ...................... ░░░░░░░░░░
──────────────────────────── BLUEPRINT LOCK ────────────────────────────
STAGE 3  Foundations & deployment spine .... ░░░░░░░░░░
STAGE 4  Card data layer ................... ░░░░░░░░░░
STAGE 5  Legality engine ⚠ highest risk .... ░░░░░░░░░░
STAGE 6  Collection ........................ ░░░░░░░░░░
──────────────────── MILESTONE: collection is real ─────────────────────
STAGE 7  Deck workbench .................... ░░░░░░░░░░
STAGE 8  Statistics — Tiers 1 & 2 .......... ░░░░░░░░░░
──────────────────── MILESTONE: PHASE A COMPLETE ───────────────────────
STAGE 9  Generator ......................... ░░░░░░░░░░
STAGE 10 Tier 3 / meta adapter (conditional) ░░░░░░░░░░
STAGE 11 Deferred features ................. ░░░░░░░░░░
```

---

## STAGE 0 — Discovery

**Size:** M · **Status:** ~90% complete

Establish what is being built and why, before any logic exists.

### Complete

- Problem, scope, users, non-goals — `DISCOVERY.md`
- 24 decisions with alternatives and rationale — `DECISIONS.md`
- Rules and data landscape, rulebook-cited — `RESEARCH.md`
- Statistics framework — `DECK-STATS.md`
- Q1 phone reach · Q2 sideboard · Q3 committed cards · Q6 location · Q9 statistics

### Remaining

| # | Item | Blocks |
|---|---|---|
| **Q5** | What "playstyle" means as a generator input — fixed tags, free text, or inferred from the anchor | Stage 9 only |
| Q7 | Is best-of-three / sideboard play in scope | Stage 5 |
| Q8 | Default legality mode — casual (≥40) or competition (=40). Both must be supported regardless | Stage 5 |
| Q10 | How per-set errata and the official ban list are ingested and kept current | Stage 4 |

**Done when:** Q7, Q8, Q10 are answered. **Q5 is not a blocker** — it gates Stage 9
only and can be resolved much later.

---

## STAGE 1 — Visualization / interface design

**Size:** L · **Gate:** none — ready to start · **Phase 2 of the SOP**

The largest remaining unknown. Two constraints make this genuinely novel rather than
a routine UI pass:

- **Ownership as the organising principle** (D-015) — no existing tool works this way,
  so there is no layout to borrow
- **Full desktop/phone parity** (D-018) — the same workbench must work with a mouse at
  a desk and a thumb at a table (Q11)

### Work

1. Aesthetic direction — explicitly *not* a Piltover Archive clone (D-014)
2. **Ownership visual language** — owned / unowned / committed-elsewhere, and how
   "this card is in *Jinx Aggro v2*" is surfaced without nagging (D-017)
3. **Three-tier statistics language** — the visual encoding that stops a Tier 3
   estimate passing for a Tier 1 fact (D-022). Non-negotiable, so it is designed, not
   improvised
4. Desktop layout — gallery, deck zones, The Bench, stats
5. Phone layout — same capability, different ergonomics
6. Collection entry mode — keyboard-driven, collector-number keyed (D-013)
7. **Interactive prototype** for validation before any real code

**Done when:** a clickable prototype exists that Alexander has used and approved.

**Risk:** designing two ergonomics for one app is where this could sprawl. Mitigation —
design the phone layout *first* under its tighter constraints, then expand to desktop,
rather than shrinking a desktop design down.

---

## STAGE 2 — Architecture

**Size:** M · **Gate:** Stage 1 approved (D-019 — design constrains the stack, not the reverse)

D-018 has already narrowed this considerably: full editing on two devices demands a
single source of truth, which points at a hosted web application. Because there is one
app rather than two synchronised surfaces, **no sync-conflict logic is required.**

### Decisions to make

- Stack and framework
- Hosting, and what it costs to run indefinitely
- Data storage — collection, decks, commitments
- Card data caching strategy (the full pool is 950 cards — small enough to cache whole)
- Access control: single user, but reachable from the public internet
- Backup and export — the collection represents real hours of entry

**Done when:** an architecture document exists with the stack chosen and justified.

> ### 🔒 BLUEPRINT LOCK
> Stages 0–2 complete. `BLUEPRINT.md` is written and locked. Per the SOP, **no
> significant logic is written before this point**, and from here every change maps
> to a task in `task.md`.

---

## STAGE 3 — Foundations & deployment spine

**Size:** S · **Gate:** BLUEPRINT locked

Scaffold, repo structure, test harness, CI, and **a deployed hello-world reachable from
Alexander's phone.**

**Deployment comes first deliberately.** Phone parity is a hard requirement (D-018);
discovering a hosting problem after building the workbench would be expensive. Prove
the pipeline while it is cheap to fix.

**Done when:** a trivial page is live, reachable from the phone, and deploys automatically.

---

## STAGE 4 — Card data layer

**Size:** S–M · **Gate:** Stage 3

- Ingest the full card pool from the RiftScribe API (D-002) — 950 printings, 767 names
- **Cache locally in full** — mitigates RiftScribe being an independent fan project
  that could disappear
- Pagination: `limit` caps at 200; the `set` filter parameter does not work — filter
  client-side on `set_id` (RESEARCH §2)
- Model **variant collapsing**: printings of one name collapse for legality; different
  names of one character do not (CR 103.2.b.2)
- Ingest errata and the ban list (Q10)
- Refresh strategy for new sets

**Done when:** the full pool is queryable offline, with variants correctly collapsed.

**Risk:** RiftScribe is a fan project with no SLA. Mitigated by the full local cache.

---

## STAGE 5 — Legality engine ⚠️ **highest correctness risk**

**Size:** M–L · **Gate:** Stage 4 · **Can run parallel to Stage 6**

Every rule from CR 103 and TR 601, per D-020. **Built early and tested heavily,
because everything downstream trusts it.** A wrong legality engine produces decks that
cannot be played, which destroys the tool's entire value.

### Rules to encode

| Rule | Source |
|---|---|
| Main deck ≥40 casual / **=40 competition** — mode switch | CR 103.2 / TR 601.1.b |
| Rune deck exactly 12, matching Domain Identity | CR 103.3 |
| Battlefields: count by Mode of Play, unique names | CR 103.4 |
| Domain Identity — multi-domain cards need **all** domains present | CR 103.1.b.4 |
| Max 3 copies **per name**, Chosen Champion included | CR 103.2.b |
| Chosen Champion: champion unit, tag matches Legend, **signature units ineligible** | CR 103.2.a |
| ⚠️ **Signature cards: 3 total regardless of name**, tag must match Legend | CR 103.2.d |
| Sideboard ≤10; copy limits span main + sideboard | TR 601.1.c |
| Format legality, banned cards, precon exemption | TR 601.2 |

**Done when:** a comprehensive test suite passes, including every worked example given
in the rulebook itself (Volibear, Yasuo, Loose Cannon, Tibbers).

**Risk:** the Signature card rule was discovered *late* and only by reading the actual
PDF. **There are probably more rules like it.** Mitigation — work from the rulebook
text directly, never from summaries, and encode the book's own examples as tests.

---

## STAGE 6 — Collection

**Size:** M · **Gate:** Stage 4 · **Can run parallel to Stage 5**

- **Collector-number keyboard entry** (D-013) — 2–3 keystrokes per card, no mouse
- Name typeahead fallback via RiftScribe search
- **Preconstructed products as one-click bundles** — ~200 cards with zero typing
- Quantity management, variant/foil tracking
- The **commitment model** (D-017): `owned` / `committed[]` / `free`

> ### 🏁 MILESTONE — the collection is real
> Alexander sits down with his boxes and enters his actual collection (~20 minutes).
> From this point the tool operates on real data, not test fixtures.

**Done when:** the real collection is in the system and verified against the boxes.

---

## STAGE 7 — Deck workbench

**Size:** L · **Gate:** Stages 5 + 6

The centrepiece.

- Gallery — **owned by default**, ownership as a filter dimension (D-015)
- Filters: set · collector number · domain · type · rarity · variant · energy · power ·
  might · owned/unowned
- Zone-based construction: Legend · Champion · Main · Runes · Battlefields · Sideboard
- **The Bench** — staging area for cards under consideration, saved with the deck
- Live legality validation against Stage 5
- **Commitment awareness** — committed cards are unavailable, and always show *which
  deck holds them*, never a dead end
- Save, name, edit, version, compare
- Mark a deck as physically built
- **Full phone parity throughout** — responsive is a requirement of every screen here,
  not a later pass

**Done when:** a complete legal deck can be built end-to-end, on both desktop and phone.

---

## STAGE 8 — Statistics, Tiers 1 & 2

**Size:** M–L · **Gate:** Stage 7 · Spec in `DECK-STATS.md`

**Tier 1 — Facts.** Energy curve, Power demand by domain, type split, Might
distribution, keyword counts, rune split, signature count, collection reality.

**Tier 2 — Probabilities.**
- ⭐ **Rune feasibility curve** (D-023) — the flagship. Closed-form hypergeometric
  pre-recycling; Monte Carlo for the general case
- Chosen Champion access by turn N
- Opening-hand playability over ~10,000 simulated hands
- Expected Might on board by turn N
- Playable options per turn — the concrete definition of "flexibility" (D-024)

**Tier 3 is deliberately absent** and the panel must read as complete without it.

**Done when:** the panel renders both tiers with correct visual separation, and stays
inside the <2 s responsiveness target.

**Risk:** Monte Carlo performance on a phone. Mitigation — measure early; move
simulation server-side if needed.

> ### 🏁 MILESTONE — PHASE A COMPLETE
> The workbench is usable for real deckbuilding. Everything beyond this point is
> additive; if the project stopped here it would still be worth having.

---

## STAGE 9 — The generator

**Size:** L · **Gate:** Phase A complete · **Q5 must be resolved first**

- **Anchor semantics** — Legend, Champion, or an arbitrary card. The third case is
  hardest: it requires reverse-solving for Legends that could legally include it
- Playstyle / archetype input (Q5)
- **Negative constraints** — "not this card", "not this strategy"
- Constraint satisfaction over the owned pool, respecting commitments
- Multiple candidates, never a single answer
- **Interactive refinement** — reject a choice, explain why, re-derive. This loop *is*
  the product; one-shot generation is not what was asked for
- **Failure modes done well** — "you have 34 of 40, here are the 6 gaps" beats
  "no results"

**Done when:** a deck can be generated from an anchor, rejected, refined, and accepted
into the workbench.

**Risk:** archetype→card mapping exists in **no API** and must be sourced or derived.
This is unsolved and is the main reason Q5 is open.

---

## STAGE 10 — Tier 3 / meta adapter — **conditional**

**Size:** M · **Gate:** Stage 9 **and** Q4 resolved favourably

Only proceeds if legitimate access to tournament data is obtained. Under D-009 this
sits behind a clean adapter, so the project is complete without it.

**Action now, cheap:** ask Riftools and RiftDecks about API access for a personal,
non-published tool. They are fan projects and may well agree. **No scraping** — D-010
is non-negotiable.

**If declined:** the stage is cancelled with no loss. Nothing depends on it.

---

## STAGE 11 — Deferred features

**Size:** varies · **Gate:** Phase A complete, and as circumstances allow

| Feature | Waiting on |
|---|---|
| **Physical card location** (Q6, D-021) | Alexander's new organising box |
| Pack-opening entry mode | Nice-to-have; base entry already covers it |
| Deck version comparison | Emerges from real use |
| Sideboard support | Q7 — rules already fully captured |

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| **Undiscovered rules** — Signature cards was found only by reading the PDF | 🔴 High | Work from rulebook text only; encode the book's own examples as tests (Stage 5) |
| **RiftScribe disappears** — independent fan project, no SLA | 🟡 Medium | Full local cache from Stage 4; 950 cards is trivially small |
| **No meta data access** (Q4) | 🟢 Low | Adapter pattern (D-009); project is complete without Tier 3 |
| **Phone/desktop design sprawl** | 🟡 Medium | Design phone-first under tighter constraints, then expand (Stage 1) |
| **Monte Carlo too slow on mobile** | 🟡 Medium | Measure early; move server-side if needed |
| **Scope creep from an ambitious generator** | 🟡 Medium | Phase A is independently valuable; Stage 9 is genuinely optional |
| **Collection entry never happens** | 🟡 Medium | Make it the Stage 6 milestone, not a background chore |

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
