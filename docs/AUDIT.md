# Assumption Audit — Forge

> First-principles audit of the premises underneath this project, run at the end of
> Discovery and **before any implementation**. Findings ranked by fragility × impact.
>
> **Run:** 2026-08-02 · **Method:** assumption prosecution, not framework fill-in

---

## Phase 1 — Is the problem correctly defined?

**As stated:** *"Build a tool that generates decks from the cards I own."*

**Interrogation.** That framing came from the frustration ("guides assume cards I don't
have"), but it does not match the stated *goal*, which was:

> *"I want it to be really useful so that I can enjoy sitting for hours creating,
> putting together, sleeving and testing decks."*

Those are different problems. One asks for **output**. The other asks for a better
**process**. A tool that hands over a finished deck removes the very activity the user
says they want to spend hours doing.

**Reframed core question:**

> **How do we make deckbuilding from a constrained, randomly-acquired collection feel
> rewarding rather than frustrating?**

**Consequence:** the **workbench is the product**. The generator is a *hypothesis*
about what would help — not an established requirement. This reframing is already
latent in two earlier decisions made on instinct: adopting The Bench (a tinkering
surface) and rejecting a composite grade (refusing to do the thinking for the user).
The audit makes explicit what those choices implied.

---

## Phase 2 — Assumptions mined

### Surface

| | Assumption |
|---|---|
| **A1** | The collection is ~1,000 physical cards / 200–300 unique names |
| **A2** | Collection entry takes ~20 minutes |
| **A3** | The collection will actually get entered |
| **A4** | RiftScribe remains available |
| **A5** | The rulebook is complete enough to encode legality correctly |

### Middle — conventions

| | Assumption |
|---|---|
| **A6** | A hosted multi-device web app is the right vehicle for a single user |
| **A7** | Deck "effectiveness" is knowable enough to inform decisions |
| **A8** | Tournament meta data would materially improve suggestions **for this collection** |
| **A9** | A generator is a valuable feature at all |
| **A10** | Phase A is independently valuable |
| **A11** | A two-panel gallery/deck layout is the right starting shape |

### Deep — never questioned

| | Assumption |
|---|---|
| **A12** | Interest in Riftbound persists long enough for this to pay off |
| **A13** | **The bottleneck in deckbuilding is information, not cards** |
| **A14** | Building this is a better use of the time than simply playing more |
| **A15** | A tool can improve on the user's own judgement about their own collection |

---

## Phase 3 — Classification

🔵 Physical fact · 🟡 Historical convention · 🔴 Subjective belief · ⚫ Interest-driven

| | Type | Note |
|---|---|---|
| A1 | 🔵 | Measured against the API; sound |
| A2 | 🔴 | My estimate. Never tested by anyone |
| A3 | 🔴 | Assumed, not evidenced |
| A4 | 🟡 | A fan project has no obligation to continue existing |
| A5 | 🟡 | Rulebooks are authoritative, but **already proved incomplete in practice** |
| A6 | 🟡 | "Apps are hosted web apps" is a convention of this decade, not a requirement |
| A7 | 🔴 | Partially mitigated by the three-tier framework |
| A8 | 🔴 | **Load-bearing and untested** |
| A9 | 🔴 | Assumed from the outset; never challenged |
| A10 | 🔴 | Plausible, unverified |
| A11 | 🟡 | Inherited from Piltover Archive |
| A12 | 🔴 | Uncomfortable and unexamined |
| A13 | 🔴 | **The foundation of the entire project** |
| A14 | 🔴 | Never raised |
| A15 | 🔴 | Partially verified — the rune maths is genuinely beyond human calculation |

**The most valuable reclassification:** A6. A hosted, always-on, internet-reachable
service for exactly one user was treated as a *fact* following D-018. It is a
**convention**. It was never separately justified — it fell out of "phone must edit
too," which is a real requirement, but the delivery model that satisfies it was never
compared against alternatives.

---

## Phase 4 — Risk ranking (fragility × impact)

| Assumption | Fragility | Impact | **Risk** |
|---|---|---|---|
| **A13** — bottleneck is information, not cards | 4 | 5 | **20** |
| **A12** — sustained interest | 4 | 5 | **20** |
| **A9** — the generator is genuinely wanted | 4 | 4 | **16** |
| **A8** — tournament meta transfers to a small collection | 5 | 3 | **15** |
| **A3** — collection entry actually happens | 3 | 5 | **15** |
| A6 — hosted app for one user | 3 | 4 | 12 |
| A5 — legality correct from the rulebook | 3 | 4 | 12 |
| A4 — RiftScribe availability | 3 | 3 | 9 |
| A2 — ~20 minutes | 4 | 2 | 8 |

### 🥇 A13 — "The bottleneck is information, not cards" — risk 20

The whole project assumes the user *can* build good decks and merely lacks the means
to find them. But the collection holds perhaps 250–300 of 767 distinct names, and
**Domain Identity restricts any given deck to 2 of 6 domains** — so the usable pool
for any one Legend is roughly a third of the collection, maybe 80–100 names. A 40-card
main deck drawing on ~20 distinct names is feasible; *several genuinely different*
decks may not be.

If this assumption is wrong, Forge becomes a tool that mostly says **"no."**

> **Verify:** pick one owned Legend. By hand, right now, count whether 40 legal main
> deck cards + 12 matching runes + 3 battlefields actually exist in the collection.
> Then repeat for a second Legend in different domains. **Two hours of counting
> settles whether this project's premise holds.**

### 🥈 A12 — "Interest persists" — risk 20 *(the uncomfortable one)*

Phase A is **months of evenings**. Riftbound released October 2025; this interest is
roughly nine months old. Nothing in the plan accounts for enthusiasm decaying faster
than the build. The plan's own hedge — "Phase A stands alone" — is a *partial*
mitigation, but Phase A is itself the large part.

> **Verify:** does the tool produce something useful within **one week** of starting,
> or only after four stages? Currently: only after four stages. **That is the actual
> risk, and it is fixable by resequencing rather than by willpower.**

### 🥉 A9 — "The generator is genuinely wanted" — risk 16

Directly contradicted by Phase 1. The stated pleasure is *tinkering*; a generator
automates tinkering. It is plausible that what is actually wanted is a workbench that
makes tinkering **fast and well-informed** — which is Phase A — and that the generator
was reached for because "the computer should figure it out" is the obvious shape for a
software solution, not because it is the thing that would be enjoyed.

> **Verify:** after using the workbench for two weeks, is the felt need "show me a
> deck" or "help me evaluate the deck I'm already making"? **Unanswerable before
> Phase A exists — which is itself an argument for building Phase A first and
> deciding later.**

### Also notable — A8, risk 15

Tournament decks are built from **unlimited card pools**. Their winrates describe what
wins when you can play anything. Mapping that onto a 250-name collection may be close
to meaningless — the top deck's performance says nothing about the degraded version
the collection can actually produce. Q4 has been treated as an access problem; it may
also be a **relevance** problem.

---

## Phase 5 — Reconstruction

### Original thinking

> Build a workbench, then a generator. Hosted, multi-device. Layered construction:
> data → legality → collection → workbench → statistics. Deployment first because
> phone parity is required. Months of evenings, and Phase A stands alone as the hedge.

### Rebuilt thinking

> **The workbench is the product; the generator is an unvalidated hypothesis.**
> Before building layers, verify the premise: does the collection actually support
> multiple distinct legal decks? Then get something *usable* into the user's hands in
> the shortest possible path — not the most architecturally tidy one — because the
> dominant risk is not technical failure, it is enthusiasm decaying before value
> arrives.

### What changed

| | Before | After |
|---|---|---|
| **Generator status** | Planned Phase B feature | **Hypothesis**, gated on evidence from real workbench use |
| **First milestone** | Deployed hello-world (infrastructure) | **Premise verification** — can the collection even do this? |
| **Sequencing logic** | Layer by layer, correctness first | **Thin vertical slice first**, then widen |
| **Dominant risk** | Undiscovered rules | **Time-to-first-value** |
| **Meta data (Q4)** | An access problem | An access problem **and** a relevance problem |

### What survived scrutiny

- The three-tier statistics framework — it is *precisely* an honesty mechanism, and
  the audit strengthens rather than weakens it
- Rune feasibility as flagship — verified as genuinely beyond human calculation (A15)
- Legality from the rulebook only — already vindicated once
- No scraping
- The commitment model (cards in decks are taken) — models physical reality accurately

### The single most important thing to verify

> **Take one Legend you own. Count whether you can legally build a complete deck from
> your collection right now. Then do it for a second Legend in different domains.**
>
> If both succeed, the premise holds and Forge is worth building.
> If only one succeeds, Forge is a *gap-analysis* tool, not a deckbuilder — a
> different product.
> If neither succeeds, the bottleneck is **cards**, not information, and no software
> fixes that.

**This costs about two hours and no code.**

---

## Actions taken in response

| Finding | Response |
|---|---|
| A13 | **Stage 0.5 added** to PLAN.md — manual premise verification before any build |
| A12 | **Vertical slice inserted as Stage 3.5**; time-to-first-value added to the risk register |
| A9 | Generator **downgraded** from planned stage to research spike with an explicit kill condition — see [GENERATOR.md](spec/GENERATOR.md) |
| A8 | Q4 reframed as relevance *and* access; recorded in DECISIONS |
| A3 | Collection entry made an explicit milestone with a defined completion check |
| A6 | Recorded as convention, to be re-examined during Stage 2 rather than assumed |
