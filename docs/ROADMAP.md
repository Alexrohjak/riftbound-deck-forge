# Forge — Roadmap

> **Version:** 1.2 · **Updated:** 2026-08-03 — `D3` complete, **`DESIGN LOCKED` lifted**
>
> 🖥️ **Visual version: [`roadmap.html`](roadmap.html)** — same content, rendered. Open it from
> disk, or use the published page. ✅ **X5 resolved** — the docs ship from the same Cloudflare
> account as the app ([D-048](DECISIONS.md#d-048)); `F1` wires it up.
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
| **Track** | **F — Foundation** |
| **Progress** | **3 of 16** milestones · `D1`, `D2`, `D3` complete |
| **🎯 Next** | **Finish `F1`** — **[Forge is live](https://forge.alexander-rohde-jakobsen.workers.dev)** on real D1. Two dashboard steps remain, both yours: connect the repo for automatic deploys, and put Access in front of it |
| **Active** | **`F1`** — deployed and verified end-to-end: SPA, `/health`, `/collection`, and a D1 write round-trip |
| **Blocked** | Nothing. ⚠️ The site is **publicly reachable** until Zero Trust Access is configured |
| **Stack** | TypeScript · React + Vite · **one Cloudflare Worker** (SPA + API, [D-050](DECISIONS.md#d-050)) + D1 · **£0/month, verified** — [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **Code** | **The workspace is real.** `packages/engine` (pure TS, 8 of 33 legality checks, 14 tests) · `apps/web` · `apps/cli` · `apps/api` · CI. Plus [the collection tool](../tools/collection/) and [`check-docs.py`](../tools/check-docs.py) |

```
D ─ Design         ▓▓▓▓▓▓▓▓▓▓▓▓  3/3   ✅ complete
F ─ Foundation     ░░░░░░░░░░░░  0/3   ← you are here
W ─ Workbench      ░░░░░░░░░░░░  0/4
S ─ Strategist     ░░░░░░░░░░░░  0/5
L ─ Later          ░░░░░░░░░░░░  0/1
                                 ────
                                 3/16
```

> **The count is unchanged; the shape is not.** [D-043](DECISIONS.md#d-043) retired `S3` and
> `S4` and added `S6`; [D-044](DECISIONS.md#d-044) split `S1` into `S1a` + `S1b`. Two out, two
> in — still 16. **What changed is the size of the pieces**: the largest milestone is no longer
> a single block, and the two retired ones were the second and third largest in the `S` track.
> **Milestone IDs never renumber** — superseded ones stay in the table, struck through.

### Recently completed

| ID | Milestone | What it produced | Date |
|---|---|---|---|
| `D3` | **Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) — one TypeScript rules package with two consumers; static app, one edge function, managed SQLite. **£0/month, verified.** A6 upheld, X5 resolved. [D-047](DECISIONS.md#d-047)–[D-049](DECISIONS.md#d-049) | 2026-08-03 |
| `D2` | **Interface design** | [Clickable prototype](design/D2-workbench-prototype.html), approved. Ownership visual language, EE's answer shape, and how EE is invoked — all three locked. Four decisions: [D-043](DECISIONS.md#d-043) to [D-046](DECISIONS.md#d-046) | 2026-08-03 |
| — | **Collection tool** | Keyboard entry over 1,180 printings, live matches with images, JSON export. 21 parser tests | 2026-08-02 |
| `D1` | **Discovery** | 19 documents · 42 decisions · both rulebooks read in full · all 935 cards read, 814 main-deck cards classified · 1.3 MB cached card data · 33 legality checks · EE and generation specified | 2026-08-02 |

---

## How the planning docs fit together

| Doc | Role | Altitude |
|---|---|---|
| [`DISCOVERY.md`](DISCOVERY.md) | **What & why** — problem, scope, users, non-goals | Rarely changes |
| **`ROADMAP.md`** (this) | **The map** — tracks, milestones, status, dependencies | Strategic — no detail |
| [`PLAN.md`](PLAN.md) | **The detail** — gates, "done when", how you validate, risks | Per-milestone |
| [`spec/`](spec/) | **What we're building** — legality, EE, generation, data model | Deep reference |
| [`reference/`](reference/) | **Riftbound itself** — rules, cards, Legends, battlefields | External facts |
| [`DECISIONS.md`](DECISIONS.md) | **Why this way** — 50 decisions, append-only | Never rewritten |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | **How it's built** — stack, hosting, verified cost, what's ruled out | Changes rarely |

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
| `D2` | **Interface design** | A clickable prototype exists that you have used and approved | ✅ | — |
| `D3` | **Architecture** | Stack chosen and justified, with indefinite running cost understood — **including where the docs are served from** (X5) | ✅ | `D2` |

**`D2` designed three things**, all locked in [D-046](DECISIONS.md#d-046):
1. The **workbench** — gallery, deck zones, The Bench, ownership language
2. **How EE speaks** — a claim carries a statement, a lever and its grounding. Not a stat tile
3. **How EE is invoked** — advice is pull, never push ([D-042](DECISIONS.md#d-042)), so there
   must be a deliberate way to *ask*

> **`D3` is smaller than it was.** [D-043](DECISIONS.md#d-043) dissolved **X1** — "where does
> EE's conversation layer run" was never an architecture question. `D3` now decides the stack,
> hosting, storage, backup, **X5** and **A6**.

> 🔓 **DESIGN LOCKED — LIFTED 2026-08-03.** `D1`–`D3` complete. Logic can now be written, and
> per the SOP every change from here maps to a task. The architecture is
> [`ARCHITECTURE.md`](ARCHITECTURE.md): **one TypeScript rules package with two consumers**, a
> static app, one edge function and managed SQLite — **£0/month, verified**.

---

## Track F — Foundation

*Get something live, usable, and fed with real data. Gates both build tracks.*

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `F1` | **Get it online** | A trivial page is live, reachable from your phone, deploying automatically | 🟡 **ACTIVE** — deployed and verified; awaiting Git-triggered deploys + Access | `D3` |
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

> 🔑 **This track was restructured on 2026-08-03.** [D-043](DECISIONS.md#d-043) — **EE is a
> rules engine with a swappable mouth**, and the mouth is Claude Code against exported state.
> The conversation layer is not built. [D-044](DECISIONS.md#d-044) splits the rules engine so
> the track starts delivering before its hardest half is finished.

| ID | Milestone | Done when | Status | Depends on |
|---|---|---|---|---|
| `S1a` | **Rules engine — core** 🔴 | State, legal actions, combat under Tank/Backline/lethal-first/no-overkill, replacement effects, layers. Each of the 21 rule-warping cards has a regression test | ⬜ | `F3` |
| `S1b` | **Chains and showdowns** | CR 355–359, 370–375, 465.2 worked examples pass as fixtures; LIFO and Reaction-only-when-closed hold as property tests | 💤 **deferred** | `S1a` |
| `S2` | **Analysis** | EE answers Q-CARD, Q-COMPARE and Q-LEGEND correctly, headlessly | ⬜ | `S1a` |
| `S6` | **EE's mouth** | Tool surface + export contract + briefing. A real question answered end-to-end from Claude Code, with every number traceable to a tool call | ⬜ | `S2` |
| `S5` | **Deck generation** ⭐ | All four modes produce legal, owned, explained candidates you'd actually sleeve | ⬜ | `S2`, `W2` |
| ~~`S1`~~ | ~~Rules engine~~ | — | ↔️ **split** into `S1a` + `S1b` — [D-044](DECISIONS.md#d-044) | — |
| ~~`S3`~~ | ~~Plain-English answers~~ | — | ❌ **retired** — [D-043](DECISIONS.md#d-043) | — |
| ~~`S4`~~ | ~~Conversation~~ | — | ❌ **retired** — [D-043](DECISIONS.md#d-043) | — |

🔴 **`S1a` is still the largest single component.** **21 cards rewrite rules an engine would
hardcode** — Elder Dragon voids the lethal-damage threshold, Dune Surfer voids `Tank`. Rules
must be **data, not code**. Build it **vertically** — one battlefield, 1v1, full fidelity.

💤 **`S1b` starts when `Q-LINE` is actually missed** — when you ask *"should I attack here?"*
and mind the refusal. Not on a date. ⚠️ **`S1a` must leave room for a priority stack** even
while nothing pushes to it, or the deferral becomes a rewrite.

⭐ **`S6` is what makes EE usable** — the role `S3` used to hold. The difference is that the
prose is Claude's job and only the **contract** is built: tools that return structured data,
an export format, and a briefing that binds EE to [D-039](DECISIONS.md#d-039) synthesis and
[D-045](DECISIONS.md#d-045) tiering. **Grounding lines come from tool output only** — the
mouth is never given the ability to author one.

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
| **Grounding is measured, always** — an evidence line is never inference | [D-045](DECISIONS.md#d-045) |
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
| **X6** | Custom domain, or is `forge.<subdomain>.workers.dev` enough? Cosmetic and reversible | `F1` |
| ~~**X7**~~ | ✅ **Answered** — [D-050](DECISIONS.md#d-050) removed the Pages project, so the docs site is a separate question, deferred until the docs need a URL | — |
| **X8** | Scheduled D1 → JSON backup: a Cron Trigger, or a manual export that genuinely gets done | `F1` |
| **X9** | Does `apps/cli` gain an MCP wrapper, or is shelling out enough? | `S6`, on evidence |
| **G1–G4** | Generation: how many candidates? How is a no-identity seed handled? Does it propose battlefields? | `S5` |
| **E2–E7** | EE modelling depth — battlefield abilities, Legend abilities, refutation search depth, hidden cards, multi-unit boards | `S1a` |
| **A6** | ✅ **Upheld** — [D-048](DECISIONS.md#d-048). There is no always-on server: static files, per-request functions and managed SQLite have no idle state | — |
| **X5** | ✅ **Resolved as a side effect** — [D-048](DECISIONS.md#d-048). One Cloudflare account serves app and docs, so it was never a separate decision | — |
| **X1 / E1** | ✅ **Dissolved** — [D-043](DECISIONS.md#d-043). EE's conversation layer runs in Claude Code; it was never a `D3` question | — |
| **Q10** | ✅ **Answered** — errata and ban list are prose, so a small hand-maintained overlay | — |

*The three proposals carried here on 2026-08-02 were all accepted on 2026-08-03 —
[D-043](DECISIONS.md#d-043), [D-044](DECISIONS.md#d-044), [D-045](DECISIONS.md#d-045).*

---

⚠️ **[`roadmap.html`](roadmap.html) is a generated view of this file.** This markdown is the
source of truth — if the two disagree, this one is right and the page needs regenerating.

*Where are we? → the Status Board, top of this file. What does "done" mean? →
[`PLAN.md`](PLAN.md). Why this way? → [`DECISIONS.md`](DECISIONS.md).*
