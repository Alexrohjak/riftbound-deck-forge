# Delivery Plan — Forge

> The **detail layer**: what gates each milestone, what "done" means, how you validate it, and
> where the risk sits. For *status* — where we are right now — see [`ROADMAP.md`](ROADMAP.md).
>
> **Created:** 2026-08-02 · **Rewritten:** 2026-08-03 (v5 — `D3` closed, `DESIGN LOCKED` lifted)
> · **Status:** the design track is **complete**; `F1` is next and the architecture is
> [`ARCHITECTURE.md`](ARCHITECTURE.md) — see the
> [README](../README.md#-start-here--how-to-pick-this-up)

**Navigation:** [`ROADMAP.md`](ROADMAP.md) (**status — start here**) · [`ARCHITECTURE.md`](ARCHITECTURE.md) (**how it's built**) ·
[`spec/OVERVIEW.md`](spec/OVERVIEW.md) (system map) · [`DECISIONS.md`](DECISIONS.md) ·
[`AUDIT.md`](AUDIT.md) · [`reference/COMPENDIUM.md`](reference/COMPENDIUM.md)

---

## ▶️ Next session

> 📍 **The recipe for picking this up lives in the [README](../README.md#-start-here--how-to-pick-this-up).**
>
> It used to be restated here, and promptly drifted — this copy said `D2` designs *two*
> things while [`ROADMAP.md`](ROADMAP.md) said three. Status now has exactly two homes:
> the **README** (how to resume) and [`ROADMAP.md`](ROADMAP.md) (where we are).
> **This document is the detail layer only.**

---

## 1. What Forge is

Two phases. **Each stands alone** — if the project stopped after the Workbench it would still be
worth having.

| Phase | What | Status |
|---|---|---|
| **The Workbench** | Catalogue what you own; browse, filter and build decks by hand with live legality and honest statistics. Cards sleeved into a BUILT deck stop being available and always show which deck holds them | Specified |
| **The Strategist (EE)** | Ask questions about your cards, decks and matchups; get answers grounded in a deterministic rules core. *"What's this card good at? How do I pilot this? What should I fear? What do I sideboard?"* | Specified — [`spec/EVALUATION.md`](spec/EVALUATION.md) |
| **Generation** (part of the Strategist) | Propose decks — seeded on cards you name, on a playstyle, or on *"what beats this deck"*. Reinstated and fused with EE ([D-041](DECISIONS.md#d-041)) | Specified — [`spec/GENERATOR.md`](spec/GENERATOR.md) |

---

## 2. How to read this

Work is in **steps**, not dates — this is an evenings-and-weekends project and calendar
estimates would be fiction. Each step carries:

- **Size** — S / M / L / XL, relative effort only
- **Gate** — what must be true before it starts
- **Done when** — the observable condition that ends it
- **You do** — how Alexander validates it (the SOP's Human QA gate, made concrete)

### Honest scale

**The Workbench is a season or two of evenings. The Strategist is comparable again** — the EE rules core
is the single largest component in the project, because Riftbound's showdown/chain system
and card-level rule overrides make it a real rules engine, not a calculator.

**The mitigation is F2**, which puts something genuinely usable in your hands within
weeks rather than after four steps of infrastructure.

---

## 3. The arc

> 📍 **The live status board, milestone table and dependency graph now live in
> [`ROADMAP.md`](ROADMAP.md).** That is the answer to *"where are we?"*
>
> **This document is the detail layer** — what gates each milestone, what "done" means, how
> you validate it, and where the risk sits. The two are deliberately split so status and
> rationale don't drift apart.

**The naming key.** A letter says *which track*, the number says *which step within it*.
Steps in different tracks are **not** ordered against each other.

| Prefix | Track | Meaning |
|---|---|---|
| **D** | Design | Decide what we're building, before any logic |
| **F** | Foundation | Get something live and fed with data |
| **W** | Workbench | Build, validate and measure decks |
| **S** | Strategist | EE — answers questions and proposes decks |
| **L** | Later | Deferred |

**Why W and S are parallel:** the EE rules engine is pure logic over cached card data. It
needs **F3** and nothing else — not the workbench, not the collection, not the UI. It can be
built and tested headlessly, which also makes it the most resumable work in the project.

<details>
<summary>Old names, for reading earlier commits</summary>

| Old | New | | Old | New |
|---|---|---|---|---|
| Stage 0 | **D1** | | Stage 7 | **W3** |
| Stage 1 | **D2** | | Stage 8 | **W4** |
| Stage 2 | **D3** | | Stage 9 | **S1** → `S1a` + `S1b` |
| Stage 3 | **F1** | | Stage 10 | **S2** |
| Stage 3.5 | **F2** | | Stage 11 | ~~S3~~ → **S6** |
| Stage 4 | **F3** | | Stage 12 | ~~S4~~ retired |
| Stage 5 | **W1** | | Stage 13 | **L1** |
| Stage 6 | **W2** | | Spike G | **S5** (reinstated) |
| Phase A | The Workbench | | BLUEPRINT LOCK | DESIGN LOCKED |
| Phase B | The Strategist | | | |

</details>

---

## 4. Design and Foundation — D1 to F3

### D1 — Discovery ✅ **COMPLETE**

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

### D2 — Interface design 🎨 ✅ **COMPLETE 2026-08-03**

**Size:** L · **Gate:** ✅ none · **SOP Phase 2**

> **Closed by [D-046](DECISIONS.md#d-046).** The prototype is
> [`design/D2-workbench-prototype.html`](design/D2-workbench-prototype.html) — self-contained,
> open it in a browser. Both open questions were answered in that decision: **ownership pips
> cap at three** (a fourth copy is unplayable under [L13](spec/LEGALITY.md), so a fourth pip
> encodes nothing), and **EE's answer budget is 1 statement / ≤2 lever sentences / ≤3 grounding
> lines**. Both were my call rather than yours, and both are cheap to reverse on first real use.

It was the largest remaining unknown, and genuinely novel rather than a routine UI pass:

- **Ownership is the organising principle** ([D-015](DECISIONS.md#d-015)) — no existing tool
  works this way, so there is no layout to borrow
- **Full desktop/phone parity** ([D-018](DECISIONS.md#d-018))
- ⭐ **EE needs a presentation language.** An answer with a statement, a lever and its
  grounding is a new component type
- ⭐ **EE needs an invocation.** Advice is pull, never push ([D-042](DECISIONS.md#d-042)) —
  so there must be a deliberate way to *ask*. State (legality, counts, statistics) stays
  live; opinion waits

**Work:** aesthetic direction (explicitly not a Piltover Archive clone,
[D-014](DECISIONS.md#d-014)) · ownership visual language (owned / unowned /
committed-elsewhere) · **EE answer presentation** · honesty-tier encoding
([D-022](DECISIONS.md#d-022)) · desktop layout · phone layout · collection entry mode ·
**interactive prototype**

**Done when:** ✅ a clickable prototype exists that you have used and approved.

**Risk taken:** designing two ergonomics for one app is where this could have sprawled.
**What contained it:** the phone layout was designed first and expanded — never a desktop
design shrunk down.

⚠️ **The prototype is a design artifact, not a starting codebase.** `D3` picks the stack
without regard to how it happens to be built.

---

### D3 — Architecture ✅ **COMPLETE 2026-08-03**

**Size:** M · **Gate:** ✅ D2 approved ([D-019](DECISIONS.md#d-019) — design constrains the stack)

> 📐 **Output: [`ARCHITECTURE.md`](ARCHITECTURE.md)** — stack, hosting, verified cost, and an
> explicit list of what is now ruled out. Recorded as [D-047](DECISIONS.md#d-047),
> [D-048](DECISIONS.md#d-048) and [D-049](DECISIONS.md#d-049).

**The shape:** one pure TypeScript rules package, imported by both the web app and the CLI
Claude Code calls. A static React bundle, one edge function and managed SQLite — deployed to
Cloudflare, behind Cloudflare Access.

**The load-bearing argument** ([D-047](DECISIONS.md#d-047)): legality is **live state** on
screen ([D-042](DECISIONS.md#d-042)) *and* must answer **headlessly** for Claude Code
([D-043](DECISIONS.md#d-043)). Two implementations of the 33 checks would mean two bodies for
`W1`, the component everything downstream trusts. **That is why the stack is TypeScript rather
than Python**, despite the card tooling being Python — Python cannot serve live in-browser
legality without Pyodide. The Python in `tools/` stays, because it is a build step.

**A6 — upheld.** *"Reachable from anywhere"* and *"a server I keep running"* had been fused and
are not the same thing. Static files, per-request functions and managed SQLite **have no idle
state**: nothing runs when Forge isn't being used. The audit's instinct was right; the word it
caught was *"always-on"*.

**X5 — resolved as a side effect.** One Cloudflare account serves app, API, database, access
control and docs. `PLAN.md` had asked for exactly this: *one host can serve both, and picking
twice is waste.* GitHub Pages remains ruled out on a private repo
([D-011](DECISIONS.md#d-011)); Cloudflare deploys private repos free.

**Cost: £0/month, verified against vendor documentation on 2026-08-03.** Forge sits roughly
three orders of magnitude below every limit that matters. ⚠️ **The risk is terms changing, not
usage growing** — mitigated by there being no lock-in: a static bundle, one small function, and
SQLite that exports to a file.

**Done when:** ✅ an architecture document exists with the stack chosen and justified.

> ### 🔓 DESIGN LOCKED — LIFTED 2026-08-03
> D1–D3 complete. **No significant logic preceded this point.** From here every change maps
> to a task, and every remaining milestone produces running code.

---

### F1 — Get it online **← NEXT**

**Size:** S · **Gate:** ✅ design locked · 📐 Build to [`ARCHITECTURE.md`](ARCHITECTURE.md)

**Scaffold:** npm workspaces — `packages/engine` (pure TypeScript, no I/O),
`apps/web` (React + Vite), `apps/api` (one Cloudflare Worker over D1). Cloudflare Pages
deploying from the private repo, with Cloudflare Access in front of app and API.

⚠️ **The engine must not import anything browser- or Node-specific** — a single `fetch` or
`fs` call in it breaks one of its two consumers, and it will be the one nobody ran
([D-047](DECISIONS.md#d-047)). Worth a lint rule in this milestone rather than a debugging
session in `S1a`.

Scaffold, repo structure, test harness, CI, and **a deployed hello-world reachable from
your phone.**

✅ **The docs-consistency check exists already** — [`tools/check-docs.py`](../tools/check-docs.py),
built early on 2026-08-03 because the drift kept recurring. `F1` only has to wire it into CI:

```bash
python3 tools/check-docs.py     # exits non-zero on any contradiction
```

It found a real error the moment it was written: the claim that `D2`'s restructuring took the
project from 16 milestones to 15. Two were retired and two added — **it was still 16.** That
is the fourth instance of a hand-maintained count being wrong, and the first one caught by a
machine instead of by reading.

It checks milestone arithmetic (the status board, the ledger and the track tables must agree),
that `docs/roadmap.html` carries the same status as `ROADMAP.md`, that declared decision counts
match the anchors in `DECISIONS.md`, that no milestone is referenced without being defined, and
that every relative link resolves.

**Covering `docs/roadmap.html` matters most.** It is a *hand-maintained view* of `ROADMAP.md`,
and two files carrying the same status is how `GAME-RULES.md` drifted from the rulebooks — the
mitigation is that the check fails when they disagree, not that we keep only one.

💡 **Serve `docs/` alongside the app** if the D3 host allows it (X5) — that gives the roadmap
a real always-current URL for free. ⚠️ Not GitHub Pages: it requires a paid plan on a private
repo (verified 2026-08-02). Deployment comes first deliberately — phone parity is a hard requirement and
finding a hosting problem later would be expensive.

**Done when:** a trivial page is live, reachable from the phone, deploying automatically.

---

### F2 — First usable version ⭐

**Size:** M · **Gate:** F1

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

### F3 — Card data

**Size:** S–M · **Gate:** F2 · **Gates both tracks**

Ingest the full pool from Riot's official gallery — **1,180 printings / 935 names**, one
~3.2 MB request. Cache locally in full. Resolve `buildId` at fetch time, never hard-code it.
Variant collapsing **by name**. **Errata and ban-list overlay** (Q10) — hand-maintained,
~10 banned names and ~8 errata per set.

**Done when:** the full pool is queryable offline, variants collapsed by name, with champion
tags, domains and Signature status available for every card.

---

## 5. The Workbench — W1 to W4

### W1 — Legality checking ⚠️ **highest correctness risk**

**Size:** M–L · **Gate:** F3 · **Parallel with W2**

Specification: [`spec/LEGALITY.md`](spec/LEGALITY.md) — **33 checks**, 13 rulebook-derived tests.

Built early and tested heavily because everything downstream trusts it.

**Done when:** L1–L33 implemented, T1–T13 passing, and the spec reconciled against the
rulebooks (both now read in full — see [COMPENDIUM](reference/COMPENDIUM.md)).

> **Risk LR2 is confirmed real, twice over.** The Signature-card rule and the `Unique`
> keyword were both found only by reading the PDF directly. **There are probably more.**
> Mitigation: read the rulebook line by line, never summaries; encode every rulebook
> example as a test.

### W2 — Collection entry

**Size:** M · **Gate:** F3 · **Parallel with W1**

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

### W3 — Deck builder

**Size:** L · **Gate:** W1 + W2

The centrepiece. Gallery owned-by-default with ownership as a filter dimension · filters ·
zones (Legend, Champion, Main, Runes, Battlefields, Sideboard) · **The Bench** (staging
area, saved with the deck, never validated) · live legality · **commitment awareness** —
unavailable cards always show which deck holds them · save, name, edit, snapshot, compare ·
DRAFT → BUILT promotion · **full phone parity**.

**Done when:** a complete legal deck can be built end-to-end on both desktop and phone.

### W4 — Deck statistics

**Size:** M–L · **Gate:** W3 · Spec: [`spec/DECK-STATS.md`](spec/DECK-STATS.md)

Tier 1 facts and Tier 2 probabilities, including the flagship **rune feasibility curve**
([D-023](DECISIONS.md#d-023)). Tier 3 deliberately absent, and the panel must read as
complete without it.

**Done when:** both tiers render with correct visual separation, inside the <2 s target.
**Risk:** Monte Carlo performance on a phone. Measure early; move server-side if needed.

> ### 🏁 MILESTONE — THE WORKBENCH IS DONE
> The workbench is usable for real deckbuilding. **If the project stopped here it would
> still be worth having.**

---

## 6. The Strategist (EE) — S1a, S1b, S2, S5, S6

Specification: [`spec/EVALUATION.md`](spec/EVALUATION.md)

> 🔑 **Restructured 2026-08-03.** [D-043](DECISIONS.md#d-043) — **EE is a rules engine with a
> swappable mouth**, and the mouth is Claude Code against exported state. `S3` and `S4` are
> retired as build work; `S6` replaces them at a fraction of the size.
> [D-044](DECISIONS.md#d-044) splits the engine so the track delivers before its hardest half
> is finished. **IDs never renumber** — `S3` and `S4` stay retired, not reused.

### S1a — Rules engine, core 🔴 **largest single component**

**Size:** L · **Gate:** F3 · **Parallel with the Workbench track**

Game state · legal-action enumeration · combat damage assignment under
Tank/Backline/lethal-first/no-overkill · replacement effects · layers · cleanups including
recall-attackers-on-stall.

⚠️ **Rules must be data, not code.** **21 cards rewrite rules an engine would hardcode** —
Elder Dragon voids the lethal-damage threshold, Dune Surfer voids `Tank`, Baron Nashor adds
a battlefield mid-game. CR 002 — *card text supersedes rules text* — is a design requirement.

⚠️ **Leave room for a priority stack** even though nothing pushes to it yet. A flat
"resolve immediately" model that cannot be extended turns `S1b` from a deferral into a
rewrite — which is the one way this split loses money.

**Build vertically:** one battlefield, 1v1, full fidelity first. Then widen.

**Done when:** each of the 21 rule-warping cards has a regression test, and combat resolves
correctly against hand-built fixtures.

### S1b — Chains and showdowns 💤 **deferred**

**Size:** L · **Gate:** S1a · **Trigger:** you ask `Q-LINE` and mind the refusal

**Chain resolution** (LIFO, `[Reaction]`-only when closed) and **showdowns as alternating
priority windows.**

**Why it waits:** of the eight questions EE answers, seven need combat and card evaluation.
One needs chains — `Q-LINE`, *"should I attack here?"*. Deferring the half that serves one
question unblocks the half that serves seven.

**Done when:** every worked example in CR 355–359, 370–375 and 465.2 passes as a fixture, and
LIFO / Reaction-only-when-closed / pass-pass-termination hold as property tests.

**Until then** `Q-LINE` returns an explicit *"not modelled yet."* Never a guess
([D-022](DECISIONS.md#d-022)).

### S2 — Analysis

**Size:** L · **Gate:** S1a

Refutation search · robustness (breadth, cost, speed, reach, frequency) · answer coverage ·
threat pressure classes · Legend fit · dead-card detection.

**Also here:** the annotation overlays — **~153 card effects** and **49 Legend abilities**,
hand-annotated rather than parsed.

**Done when:** EE can answer Q-CARD, Q-COMPARE and Q-LEGEND correctly, headlessly.

### S6 — EE's mouth ⭐ **the one that makes EE usable**

**Size:** S · **Gate:** S2 · Replaces the retired `S3` + `S4`

Three deliverables, none of them a chat interface:

1. **The tool surface** — `legality()`, `duel()`, `coverage()`, `legendPool()` and siblings.
   Structured data in, structured data out, no assumption of a caller that can be reasoned with
2. **The export contract** — deck and collection state in a form Claude Code can read directly
3. **The briefing** — the document that binds EE to [D-039](DECISIONS.md#d-039) synthesis,
   [D-045](DECISIONS.md#d-045) tiering, [D-042](DECISIONS.md#d-042) pull-not-push, and the
   answer budget fixed in [D-046](DECISIONS.md#d-046)

> **This is still the layer that turns "66 cards refute this" into "fragile to cheap Mind
> interaction — attack when they're tapped out."** The difference from `S3` is that the prose
> is Claude's job and only the **contract** is built. See [`spec/EVALUATION.md`](spec/EVALUATION.md) §2.

🔻 **The honest cost.** `S3`'s statement-budget test was going to run in CI; a briefing is
weaker than a test. What partly replaces it is **structural**: grounding lines are assembled
from tool output only, so the mouth is never able to author one. That is available precisely
*because* the engine is headless — but the budget itself is now guidance, not a gate.

**Done when:** a real question is answered end-to-end from Claude Code, and every number in
the answer traces to a tool call.
**You do:** read 20 answers and say which ones you'd actually act on.

### S5 — Deck generation ⭐

**Size:** L · **Gate:** S2 + **W2** (generation is meaningless without knowing what you own)
· Spec: [`spec/GENERATOR.md`](spec/GENERATOR.md)

**Reinstated and fused with EE** ([D-041](DECISIONS.md#d-041)) — this is EE running in the
*propose* direction, not a separate subsystem. **Re-gated from `S3` to `S2`** by
[D-043](DECISIONS.md#d-043), since its old gate no longer exists.

**Four modes:**

| Mode | Input |
|---|---|
| **Seeded** | *"Build around Ornn"* / a few cards you want in the deck |
| **Intent** | A playstyle, expressed mechanically ([D-030](DECISIONS.md#d-030)) |
| ⭐ **Counter** | *"I keep losing to this deck — what beats it?"* |
| **Open** | Several distinct directions your collection supports |

> **The objective always comes from you**, so no composite score is ever computed and
> [D-016](DECISIONS.md#d-016) holds. Forge proposes candidates and explains them; you choose.

**Also here:** live suggestions while hand-building (G5), and the **gap-analysis failure
mode** — *"you have 34 of 40, here are the 6 gaps"* — which is the most valuable output for a
collection-constrained player.

**Done when:** all four modes produce legal, owned, explained candidates you would actually
sleeve.
**You do:** generate ten decks and say how many you'd build.

> ⚠️ Audit finding **A9** still stands: the stated goal is *enjoying hours of building*.
> Generation must **add** to that loop, never shortcut it.

> ### 🏁 MILESTONE — THE STRATEGIST IS DONE
> You can ask Forge questions about your decks and get answers you'd act on.

---

## 7. L1 — Deferred features

| Feature | Waiting on |
|---|---|
| Physical card location (Q6, [D-021](DECISIONS.md#d-021)) | The new organising box |
| Pack-opening entry mode | Base entry already covers it |
| Deck version comparison | Emerges from real use |
| Casual (non-tournament) legality mode | Wanted, not just possible |
| Specific rival-deck modelling for EE | The threat-space model shipping first |
| Limited (Sealed/Draft) support | A genuinely different validator — COMPENDIUM §II.9 |

## 8. What is *not* being built

| Not building | Why |
|---|---|
| Casual (non-tournament) legality mode | Tournament-only by [D-032](DECISIONS.md#d-032). Recorded, cheap to add if ever wanted |
| Limited (Sealed/Draft) support | A genuinely different validator — no copy limits, `Unique` doesn't apply |
| Meta / tournament statistics | Sources have **opted out** ([DATA-SOURCES](reference/DATA-SOURCES.md)), and current-set data is n=1–3 |
| A deck power rating | [D-016](DECISIONS.md#d-016). Never |

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

Not a phase — an **ongoing obligation** from F3.

| Clock | Cadence | Response |
|---|---|---|
| **New sets** | ~quarterly | Re-fetch gallery; refresh `buildId` |
| **Errata** | Per set, ~8 cards | Hand-maintained overlay keyed by name |
| **Rules updates** | With sets and patches | **Re-read the changed PDF sections**, never summaries |
| **Ban list** | Independent of sets | Hand-maintained — currently 5 cards + 5 battlefields + 1 legend (2v2) |

## 11. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| ⭐ **Time-to-first-value** — enthusiasm decays before the tool is useful (A12) | 🔴 High | **F2, the first usable version** |
| 🆕 **EE rules core is underestimated** — showdowns, chains, layers and 21 rule-overrides make it a real engine | 🔴 High | Build vertically; rulebook examples as fixtures; headless and resumable |
| 🆕 **EE answers become noise** — technically correct, practically unreadable | 🔴 High | **`S6`'s briefing** + the [D-046](DECISIONS.md#d-046) budget. ⚠️ **Weakened by [D-043](DECISIONS.md#d-043)** — this used to be a CI test. Partly offset structurally: grounding comes from tool output only. This risk killed the v2 spec design |
| **Undiscovered rules** (LR2) — confirmed twice (Signature, `Unique`) | 🔴 High | Rulebook line by line; every example a test |
| **Collection entry never happens** (A3) | 🟡 Medium | Explicit milestone with a spot-check |
| **Annotation drift** — 153 effects + 49 Legends by hand | 🟡 Medium | Completeness test: every card matching `Deal\|Kill\|Stun` must have an annotation |
| Phone/desktop design sprawl | 🟡 Medium | Phone-first, then expand |
| Monte Carlo too slow on mobile | 🟡 Medium | Measure early; server-side fallback |
| Card data source disappears | 🟡 Medium | Full local cache from F3 |
| 🆕 **Generation shortcuts the fun** (audit A9) | 🟡 Medium | Generation must live *inside* the building loop — suggestions and seeds, never one finished list. Validated at S5 by generating ten decks and counting how many you'd build |
| ~~Premise may not hold~~ | ✅ Closed | [D-033](DECISIONS.md#d-033) |
| ~~Card data can't support legality~~ | ✅ Closed | [D-034](DECISIONS.md#d-034) |

## 12. Guiding principles

The full list lives in [`spec/OVERVIEW.md`](spec/OVERVIEW.md) §4. The three that most often
decide an argument:

1. **The rulebook is the only authority.** Community sources have been wrong twice.
2. **Omit rather than fake.** No grades, no invented certainty.
3. **Synthesis over enumeration.** Three useful statements beat sixty-six true ones.
