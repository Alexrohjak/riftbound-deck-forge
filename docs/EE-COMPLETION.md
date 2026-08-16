# EE — the path to deck-ready

> **Created:** 2026-08-15. The gap between the EE that is specified
> ([`spec/EVALUATION.md`](spec/EVALUATION.md)) and the EE that is built, and the shortest
> path from here to *"I can put a deck together with it today."*
>
> ⚠️ **This document has a deadline in it.** "Deck-ready" is not "spec-complete", and the
> difference is deliberate and argued in §2.

---

## 1. Understanding lock

- **What is being built:** the remaining tool surface that makes EE usable for *building
  decks*, not for adjudicating combat.
- **Why:** every EE question that deckbuilding needs is answered by the analysis layer.
  The one thing EE still lacks is the ability to **read a card** rather than its tag —
  which is how two defects reached real decks.
- **Who for:** Alexander, at a table, today, with 685 printings and one untested deck.
- **Key constraint:** [D-034](DECISIONS.md#d-034) — card data is Riot's. Forge **derives**
  from printed text; it never authors card data.
- **Explicit non-goal:** `S1a`, the rules core. See §2.

**Assumptions**, stated rather than asked:

| # | Assumption | If wrong |
|---|---|---|
| A1 | "Ready to go" means *build decks*, not *simulate combat* | Q-LINE/Q-COMPARE return, and `S1a` is a multi-session job |
| A2 | Deriving a mechanic flag by regex over printed text is derivation, not authoring | The whole approach is barred by D-034 — but `cards.json` already derives keywords this way |
| A3 | A tool that flags a cost is worth more than a tool that ranks a card | Ranking is barred anyway by [D-016](DECISIONS.md#d-016) |

---

## 2. Why the rules core is *out* of scope

`EVALUATION §9` puts the rules core at *"comparable to the rest of the Workbench
combined"*, and `ROADMAP` marks `S1a` 🔴, the largest single component in the project.

It buys exactly two questions: **Q-LINE** (*should I attack here?*) and the combat half of
**Q-COMPARE**. Neither is asked while building a deck; both are asked while *playing* one.

[D-062](DECISIONS.md#d-062) already made this argument once, when it re-gated `S6` off
`S2` on the grounds that **the four deckbuilding questions need no rules core.** This
document extends the same reasoning to the rest of the deckbuilding surface.

> **The honest cost:** Q-LINE stays refused, and the briefing keeps saying so. Refusing a
> combat question is the one refusal that protects everything else EE says.

---

## 3. The gap

| ID | Question | Status before | Status after |
|---|---|---|---|
| **Q-LEGEND** | What suits this Legend? | ✅ `legend` | ✅ |
| **Q-DECK** | How do I pilot this? | ✅ `review` | ✅ |
| **Q-GENERATE** | Build me a deck | ✅ `skeletons`/`brief`/`validate`/`deck` | ✅ |
| **Q-BUILD** | What do I add or cut? | 🟡 `review --plan` deltas | ✅ + cost/threshold findings |
| **Q-CARD** | What is this card good at? | ❌ nothing | ✅ **`card`** |
| **Q-THREAT** | What should I fear? | ❌ nothing | ✅ **`threats`** |
| **Q-SIDEBOARD** | What do I swap? | ❌ nothing, though mandated | ✅ **`sideboard`** |
| **Q-COMPARE** | Card vs card | ❌ | ❌ — needs `S1a` |
| **Q-LINE** | Should I attack? | 💤 refused | 💤 refused, deliberately |

### The blindness underneath all of it

`npm run audit:knowledge` — **185 of 921 cards (20%)** carry at least one mechanic nothing
in Forge can act on:

| Mechanic | Cards | Why a deck goes wrong without it |
|---|---|---|
| `additional-cost` | 56 | `Cruel Patron` kills a friendly unit to play. Three shipped in a **hold** deck |
| `empower-once-only` | 37 | One charge per body — an empower engine is far hungrier than its card count |
| `ganking` | 34 | Free repositioning, which is *how* a hold plan holds |
| `accelerate` | 26 | Enters ready — the verb the Ambessa deck was built on |
| `repeat` | 24 | Pay again to repeat a spell |
| `deathknell` | 24 | A payoff for your own unit dying |
| `level-threshold` | 14 | Payoffs switch on at 3/6/11 XP; Forge cannot see a threshold |
| `xp-spend` | 11 | The sink half of the XP economy — sources with no sink is a dangling synergy |
| `predict` | 4 | Deck manipulation, invisible to the opening-hand simulation |

**The audit already detects every one of these.** It reports them and stops, by design.
The gap is that the *engine* cannot see what the *audit* can — so no check acts, and the
only defence is an instruction in a briefing. D-064 settled what instructions are worth:

> *"This section already told you to run `review`. A deck of nineteen two-drops shipped
> anyway, with every gate green — because an instruction is not a mechanism."*

---

## 4. Decision log

| # | Decision | Alternatives | Why |
|---|---|---|---|
| **1** | **Mechanics are derived in the engine**, in one shared module, from printed text | (a) hand-annotate 185 cards into `classification.json`; (b) leave in the audit script | Hand-annotation is 185 judgement calls that drift from the printing. Derivation is reproducible and D-034-safe. Leaving it in the audit keeps the engine blind |
| **2** | **The audit consumes the engine's table**, not its own copy | Keep the regexes in both | Two copies of a mapping is exactly the drift [D-047](DECISIONS.md#d-047) exists to prevent — and it already happened once in this seam (`cardFactsFrom`) |
| **3** | **Flags are surfaced as findings, never as a score** | Rank cards by mechanic risk | [D-016](DECISIONS.md#d-016) — no grades. A finding names a card and a cost; the judgement stays Alexander's |
| **4** | **`npm run deck` acts on them**, not just `card` | Only expose via the Q-CARD tool | Decision 3 of D-064: the check must run where the deck is written, or it is skippable |
| **5** | **Q-COMPARE stays unbuilt** | Ship a Might-only comparison | A comparison that ignores abilities is confidently wrong about the interesting cases. Better absent than plausible |
| **6** | **`threats` reads my deck; `counter` reads theirs** | Extend `counter` with a `--mine`-only mode | They answer opposite questions and share no output shape. One tool doing both is how `theirEngine`/`theirPatterns` got confused |
| **7** | **Mechanics are derived on demand from `facts.text`**, not cached on `CardFacts` | Add a `mechanics` field populated in `cardFactsFrom` | `text` is already carried, so a cached field would be a second copy of a derivation — the same drift decisions 1 and 2 exist to prevent, one level down. 22 regexes over a 40-card deck is not a cost worth a staleness risk |
| **8** | **`sideboard` groups by the answer, not by the threat** | Keep the ANSWERS table's own threat-first shape | The table is written threat-first because that is how the *question* is asked. Answered that way it produced **14 lines and 45 suggestions for a board of 10**, with `Riposte` four times over — a search result, not counsel, and a direct breach of [D-039](DECISIONS.md#d-039). A board slot holds a **card**, so the card's job is the unit. Regrouped: 7 lines, 24 candidates, no repeats. ⚠️ `theirCards` became a **union** in the process, or a broad answer would double-count its way to false urgency |
| **9** | **`review` returns the capability counts, not only the notes about them** | Add a "you have only one defender" check | `review()` computed `capabilities` to decide what to say and then discarded it, so a count only reached the reader when it crossed a threshold. The alternative needs a target number of defenders and **no source publishes one** — inventing a band is exactly the doctrine-in-a-check that `0f53b60` refused. A count is a fact and costs nothing; the judgement stays the builder's ([D-016](DECISIONS.md#d-016)) |

---

## 5. Plan

### Scope

**In:** mechanics-as-data · `card` (Q-CARD) · `threats` (Q-THREAT) · `sideboard`
(Q-SIDEBOARD) · plan-review findings wired into `npm run deck` · briefing + docs.

**Out:** `S1a` rules core · Q-LINE · Q-COMPARE · anything that ranks or grades ·
authoring card data.

### Action items

- [x] Add `packages/engine/src/mechanics.ts` — the mechanic table and `mechanicsOf`, derived from printed text
- [x] ~~Populate `CardFacts.mechanics`~~ — **superseded.** Derived on demand from `facts.text`, which is already carried: one source, nothing to go stale, no serialisation question. Decision 7 below
- [x] Point `scripts/audit-knowledge.mjs` at the engine table, deleting its private copy
- [x] Add cost/threshold findings to `advice/plan.ts`, so `npm run deck` prints them
- [x] Add `card` — Q-CARD: printed text, what it does, and what it costs you
- [x] Add `threats` — Q-THREAT: what beats this deck
- [x] Add `sideboard` — Q-SIDEBOARD: candidates against a named Legend, TR 403.4 / L16 safe
- [x] Fix the two flaws the live `threats` run exposed — degenerate ceiling-zero read, list grammar
- [x] **Tests** — 66 across four files: `mechanics`, `card`, `threats`, `sideboard`. 432 → **498**
- [x] Update `EE-BRIEFING.md` with the three new questions, and put a mechanism under §3's two
      unbacked rules — *read the card* and *carry a sideboard of ten*
- [x] Run `sideboard` and `review --plan` against the live deck
- [x] Regroup `sideboard` by answer rather than by threat — Decision 8
- [x] Surface `capabilities` in `review` output — Decision 9

### Validation

The gate is not "tests pass". It is: **run the new checks against `Ambessa — Ready` and
see whether they find the things already known to be wrong with it.**

✅ **Met.** `review --plan slow-hold` against the live deck returns **five findings**, and
`capabilities` now carries `defenders: 1` — the single `[Shield]` body on a holding plan.

| Severity | Finding on the live deck |
|---|---|
| `high` | **Rampage** charges beyond its printed cost — *"you may pay :rb_rune_body: as an additional cost"* |
| `medium` | 7 cards need up to `[Level 6]`; the deck prints **20 XP** across **12** XP-gaining cards |
| `medium` | **12 of 12** `[Empower]` cards read *"use only if not Empowered"* — one charge per body |
| `low` | 2 copies carry `[Ganking]`, stated because the objective is to hold |
| `low` | 3 copies pay off when your own unit dies |

> ⚠️ **A correction to this document.** An earlier draft set the gate as *"find the single
> `[Tank]`/`[Shield]` body on a hold plan"*, and that was **the wrong gate**. The defenders check
> fires at **zero only**, deliberately — [`0f53b60`](#) argued that no source publishes a target
> number of defenders, so a band would be doctrine authored inside a check. A deck with one
> defender is met with silence, and that silence is correct. The real gap was that the **count
> never reached the reader**, which Decision 9 fixes without inventing a threshold.

---

## 6. What the live runs found, and what to be sceptical of

**Green:** `npm run verify` passes — engine purity, typecheck across all four workspaces, and
**498 tests** (432 before, 66 new). `npm run check:docs` agrees.

All three tools have now been run against `Ambessa — Ready` (685 printings, one deck, no stored
plan — `--plan slow-hold` was passed, and **that pace is an assumption**, not something the deck
records).

### The three flaws the live runs exposed, and what each cost

Every one of these was invisible to the tests and visible in one real run. That ratio is the
argument for running the thing on a real deck before believing it.

| # | Symptom on live data | Cause | Fixed in |
|---|---|---|---|
| 1 | *"623 of the format's 626 units cannot be removed"* — of a deck that removes things fine | A ceiling counted from printed numbers reads `0` on *"kill target unit"*, and zero was rendered as helpless rather than as unmeasurable | [`advice/threats.ts`](../packages/engine/src/advice/threats.ts) |
| 2 | *"bomb and recursion and ambush threat and cheap Might swing"* | No list grammar — three `and`s | same |
| 3 | **14 lines, 45 suggestions for a board of 10**, `Riposte` four times | Keyed on the threat when a board slot holds a card | [`advice/sideboard.ts`](../packages/engine/src/advice/sideboard.ts), Decision 8 |

⚠️ **Flaw 1 was an over-claim, and it is the class to watch.** The other two were noise; that one
was a confident false statement with a number in it, which is precisely what a mouth repeats
verbatim. The fix makes the tool go **quiet** and say why in `unmodelled` — a shape worth reusing
whenever a computed zero could mean *"none"* or *"cannot tell"*.

### One number to be sceptical of

`npm run audit:knowledge` now reports **0 of 921 cards unmodelled, down from 185 (20%)**.
That is true in the sense the audit measures — every mechanic now has something that acts
on it — but the **depth varies a lot**: `additional-cost` and `level-threshold` get real
findings with quoted clauses, while `accelerate`/`repeat` get a single shared caveat about
the curve. ⚠️ **Do not report that 0% as though every mechanic is modelled equally.** The
audit's own docstring warns against congratulating ourselves for prose, and a headline
number is exactly where that would happen.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| A regex over printed text over-matches and flags a clean card | Every finding names the card and quotes the matched clause, so a false positive is visible in one read rather than trusted |
| The findings become noise and get ignored | Findings are capped and ordered by severity; `additional-cost` on a body in a hold plan outranks `predict` |
| `sideboard` invents a meta read | It is grounded in what the *identity can do* (`counter`'s output), and says so — [D-035](DECISIONS.md#d-035) |

> ✅ **The first mitigation was exercised on the live deck, and it worked.** The `high`-severity
> additional-cost finding fired on **Rampage** — whose clause is *"as you play this, you **may**
> pay :rb_rune_body: as an additional cost"*. That is an **optional rune payment**, not a
> `Cruel Patron` sacrifice, and the two are the same mechanic with very different consequences.
> The quoted clause makes the difference readable in one glance, which is the whole reason
> findings carry one. ⚠️ **The severity is on the mechanic, not on the card** — do not read
> `high` as *"this card is a problem"*.
>
> ⚠️ **Clauses arrive with the card data's own markup** — `[&gt;]`, `:rb_rune_body:`. That is
> Riot's data as Forge received it and rewriting it would be authoring card data
> ([D-034](DECISIONS.md#d-034)). Read through it; do not clean it up in the engine.
