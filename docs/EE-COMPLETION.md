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
- [ ] ⚠️ **Fix two flaws the live run exposed** — §7
- [ ] ⚠️ **Tests.** Nothing new has a test yet; the 432 that pass are the pre-existing suite
- [ ] ⚠️ Update `EE-BRIEFING.md` §5 with the three new questions and how to read them
- [ ] ⚠️ Run `sideboard` and `review --plan` against the live deck — only `threats` has been run

### Validation

The gate is not "tests pass". It is: **run the new checks against `Ambessa — Ready` and
see whether they find the two things already known to be wrong with it** — the single
`[Tank]`/`[Shield]` body on a hold plan, and any additional-cost card in the list.

⚠️ **That gate has not been met yet.** `threats` has been run against the live deck and
found three real things (§7); `sideboard` and the plan-relative mechanics findings have
not been run at all.

---

## 7. ⚠️ Where this was interrupted — read this first

**The state is green and committed**: `npm run verify` passes — purity, typecheck, 432
tests — and the engine builds. Nothing here is half-applied. What follows is *unfinished*,
not *broken*.

### The live run, and what it found

`threats` against `Ambessa — Ready` (685 printings, snapshot 2026-08-15T03:12Z) returned
three findings, and they look right:

| Class | Finding |
|---|---|
| `must-answer` | A single *"deal 4 to all"* clears **18 of your 28 bodies** |
| `board-dominant` | The deck prints **no damage number at all** |
| `answer-asymmetric` | **No hard counter** — the published answer to four threat classes |

### The two flaws that run exposed

1. **The `board-dominant` read is degenerate at a ceiling of zero.** It compared against
   `Might > 0`, which every unit satisfies, and produced *"623 of the format's 626 units
   cannot be removed"* — technically true of **damage** removal and misleading as
   written, because the deck may still hold kill effects that print no number. **Fix:**
   when the ceiling is 0, only speak if the deck also has no `spot-removal` pattern, and
   say *damage-based removal* explicitly.
2. **List grammar.** *"bomb and recursion and ambush threat and cheap Might swing"* —
   should be comma-separated with a single final *and*.

Both are in [`advice/threats.ts`](../packages/engine/src/advice/threats.ts).

### What has never been executed

`sideboard` and the new mechanics findings inside `review --plan`. The deck's **plan is
not in the backup snapshot** (`plan` is absent from the deck object), so a plan file has
to be written from the README's description — pace × objective, objective `hold` — or a
`--plan <skeletonId>` passed, before the plan-relative half can be exercised at all.

### One thing to be sceptical of

`npm run audit:knowledge` now reports **0 of 921 cards unmodelled, down from 185 (20%)**.
That is true in the sense the audit measures — every mechanic now has something that acts
on it — but the **depth varies a lot**: `additional-cost` and `level-threshold` get real
findings with quoted clauses, while `accelerate`/`repeat` get a single shared caveat about
the curve. ⚠️ **Do not report that 0% as though every mechanic is modelled equally.** The
audit's own docstring warns against congratulating ourselves for prose, and a headline
number is exactly where that would happen.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| A regex over printed text over-matches and flags a clean card | Every finding names the card and quotes the matched clause, so a false positive is visible in one read rather than trusted |
| The findings become noise and get ignored | Findings are capped and ordered by severity; `additional-cost` on a body in a hold plan outranks `predict` |
| `sideboard` invents a meta read | It is grounded in what the *identity can do* (`counter`'s output), and says so — [D-035](DECISIONS.md#d-035) |
