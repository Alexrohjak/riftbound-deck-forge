# Generation — EE in the Propose Direction

> How Forge proposes decks. **Not a separate subsystem** — this is EE running in the
> *propose* direction rather than the *evaluate* direction, using the same rules engine,
> synergy graph, collection awareness and explanation layer.
>
> **Created:** 2026-08-02 (as a deferred spike) · **Rewritten:** 2026-08-02 —
> reinstated and fused with EE by [D-041](../DECISIONS.md#d-041) · **Rewritten again:**
> 2026-08-14 — the **plan** ([D-064](../DECISIONS.md#d-064)) · **Step:** `S5`

**Related:** [`EVALUATION.md`](EVALUATION.md) (EE) · [`OVERVIEW.md`](OVERVIEW.md) ·
[`LEGALITY.md`](LEGALITY.md) · [`DATA-MODEL.md`](DATA-MODEL.md) ·
[`../reference/DECKBUILDING.md`](../reference/DECKBUILDING.md) ·
[`../reference/transcripts/`](../reference/transcripts/) ·
[`../reference/BATTLEFIELD-GUIDE.md`](../reference/BATTLEFIELD-GUIDE.md)

---

## 0. ⚠️ What this document is fixing

The first build of `S5` shipped `brief → propose → validate → push`. Every step works. The
gap is that **not one of them ever asks whether the deck functions.** `validateProposal`
answers *"is this registerable?"* — legality, counts, and whether the card ids were invented.
Nothing else.

`review()` and `readArchetype()` — which do measure removal, draw, tricks, unit share and
opening odds — were wired into the web Advisor and the `review` CLI command, and into
**neither end of the generation loop**. The briefing asked the mouth to remember to run them.

The result, found by Alexander opening a deck EE built for Grand Duelist:

> Curve `[–, 4, 19, 9, 7, 0, 1]`. **Nineteen of forty cards at cost 2**, nothing at 5, one
> card at 6. Legal, registerable, and only good at switching the Legend's ability on.

⚠️ **And `review()` would barely have caught it.** Run against that list it produced a single
note — *"23 early plays is more than the opening needs"*. It has **no curve-shape check at
all**, so a 48% single-bucket spike passes silently.

**This document adds the missing middle: a deck is built to a *plan*, and measured against
that plan.**

---

## 1. ⭐ The objective-function problem, resolved

The original blocker:

> *"A generator needs an objective function. [D-016](../DECISIONS.md#d-016) forbids a
> composite score."*

**The resolution is that the objective comes from the user, not the tool.** Every generation
mode is *seeded* with intent, so nothing has to invent a definition of "good":

| Mode | Where "good" comes from |
|---|---|
| **Seeded** | The cards you named. *"Build around Ornn"* — the tool satisfies constraints, it doesn't decide what's worth building |
| **Intent** | Your stated playstyle, expressed **mechanically** ([D-030](../DECISIONS.md#d-030)) |
| **Counter** | ⭐ A **computable target** — answer coverage against a specific deck's threats |
| **Open** | Several *distinct* directions your collection supports, each explained |

> **Forge never says which deck is best.** It proposes candidates satisfying your objective,
> explains each one's strengths and gaps in EE's normal voice, and lets you choose.
> **No composite score is computed anywhere.**

---

## 2. ⭐ The plan — what a deck is built to do

**Stored on the deck** ([D-064](../DECISIONS.md#d-064)), written *before* the cards are
chosen and checked against afterwards. This is the object that stops the Legend ability from
becoming the whole deck.

| Field | Holds | Comes from |
|---|---|---|
| `winCondition` | How this deck actually ends the game, named | The skeleton you pick |
| `pace` | `fast` \| `slow` — the tempo-vs-value lean | Intent |
| `objective` | `conquer` \| `hold` | Intent |
| `packages` | Target counts per role (§3) | The skeleton |
| `curve` | A target **shape**, never a mean | Derived from `pace` + `packages` |
| `battlefields` | One line per pick and the class it met (§7) | §7's floor |
| `sideboard` | One line per card: which counter it answers, or which flexibility it buys | §8 |

### ⚠️ Two axes, not one archetype label

The obvious modelling — "pick aggro/control/combo" — is **wrong for this game**, and the
clearest statement of why comes from the archetype transcript:

> *"Riftbound is actually pretty interesting in that you can play aggressive conquer and
> aggressive hold builds as well as more defensive conquer and hold builds. So it doesn't
> really map onto traditional card game discussions about aggressive or controlling
> strategies."*
> — [`04-archetypes-and-construction.md`](../reference/transcripts/04-archetypes-and-construction.md)

So intent is **`pace × objective`**, expressed mechanically per [D-030](../DECISIONS.md#d-030),
and the archetype name is a **read on the result** — what `readArchetype()` already does —
rather than an input. [`LEGEND-GUIDE`](../reference/LEGEND-GUIDE.md) §5 independently calls
Hold-vs-Conquer the intent that matters most, and says getting the direction wrong silently
halves a build.

### The structural fix, in one line

**The Legend's ability is an input to `packages.engine` — one bucket — not the organising
principle for all forty cards.**

⚠️ This section first said the Grand Duelist deck was *"`engine` at effectively 100%"*. It was
not — see §6.1. The measured failure is `closers 1 · coreUnits 6`: a deck that can trigger its
Legend and win fights, with almost nothing to win *with*.

⚠️ This is a **rebalance, not a demotion.** The method transcript is explicit that the Legend
ability *should* be weighted heavily — *"usually your gameplay will revolve around your legend
ability as it's the most important and consistent part of your deck… unless it sucks"*. Heavy
weight and sole focus are different things, and only the second one built that deck.

---

## 3. Packages — the layer the first build had no concept of

**All three method transcripts converge on packages independently**, which is much better
evidence than any one of them. The most explicit:

> *"My own system is to break decks and deck building into their packages and play style.
> Play style refers to the overall game plan and victory condition, while packages refer to
> the collection of cards that are being brought in to support your intended play style… the
> easiest way in my opinion is to start with play style."*
> — [`03-the-all-unique-deck.md`](../reference/transcripts/03-the-all-unique-deck.md)

| Package | What belongs in it | Attribution |
|---|---|---|
| `engine` | Cards that supply what the Legend and Champion reward | All three |
| `coreUnits` | Units played on curve to contest battlefields with bodies | `03`; Riot's Primer |
| `interaction` | Turn-to-turn answers. `04` lands on **~8, about a fifth of the deck** | `04` |
| `closers` | Cards that win the game by being present. `03`'s heuristic: spells above 4 energy | `03` |
| `earlyPlays` | The 7–9 band, already computed exactly | `01`; community |
| `spice` | ⚠️ **Reserved and deliberately left empty by EE** — see below | `01` |

⚠️ **`03` says split into "as many packages as we need"**, so the set above is a **default,
not a fixed universal five**. A plan may name its own.

### ⚠️ Two refinements Forge must model that the counts alone miss

**A vanilla two-drop is not an early play.** `01` separates two-drops with a self-scoped
effect or a real mid-game role from ones that are *"vanillas entirely"*, and says not to run
the third kind. `earlyPlays` currently counts cost alone. A card with no `produces`, no
`consumes` and no text is detectable, and should not be credited to the package.

**Some decks legitimately skip the rule.** `01` names the exception — decks with other ways
of playing units on turn one, or control decks that *"don't really care about unit or point
tempo"*. This is precisely why the measurement is **plan-relative** (§6) rather than universal.

### 🌶️ Why EE does not pick the spice

`01` calls the off-meta card *"the most important part in your ingredients"* — a card the
opponent will not play around **because they do not expect it**. That value comes entirely
from what your opponents expect, which is meta knowledge Forge does not have and
[D-035](../DECISIONS.md#d-035) says it will never have.

**So the skeleton reserves the slot and leaves it to you.** Naming a card as "spicy" would be
Forge inventing a meta read — the failure the whole project is built to avoid.

---

## 4. The four generation modes

### 4.1 Seeded — *"build around these"*

**Input:** a Legend, a Champion unit, or any set of cards you want in the deck.

1. **Resolve the identity.** A Legend fixes it directly. An arbitrary card requires
   *reverse-solving*: which Legends can legally include it?
2. **Read the Legend's reward** — `rewards`, computed, all 49 Legends annotated.
3. **Pick a skeleton** (§5), then fill from the collection, respecting `BUILT` commitments.

⚠️ **Hardest case:** seeding on a card with no Legend constraint. The identity is then
unconstrained and the tool must *ask* rather than guess.

### 4.2 Intent — *"aggressive"*, *"I want to hold battlefields"*

Playstyle is expressed **mechanically, never by archetype name**
([D-030](../DECISIONS.md#d-030)):

| Intent | Mechanical target |
|---|---|
| Aggressive | High share of ≤2-cost units · `Assault` · early Might · short speed-to-first-score |
| Defensive / holding | `Tank`, `Shield`, `Backline` · Hold-triggered payoffs · high Might-per-cost at 3+ |
| Go-wide | Unit count · token production · per-unit payoffs |
| Reactive | `Action`/`Reaction` share · `Deflect` · `Hidden` |
| Value / grind | Draw, recursion, `Deathknell`, trash payoffs |

### 4.3 ⭐ Counter — *"I keep losing to this deck, what beats it"*

EE's threat analysis run backwards. Take the opposing deck or its Legend, compute what
answers it, filter to what you own — and **say when the answer is not a new deck**:
*"three sideboard swaps fix this matchup"*.

### 4.4 Open — *"give me ideas"*

Propose **several distinct directions**. Distinctness is measured by identity, curve shape and
Legend reward — **not by a diversity score**.

---

## 5. Search strategy — skeleton fill, specified

**Skeleton fill was always the primary strategy in this document. It was never built.** What
follows is the missing detail.

### 5.1 `skeletons` — before any cards are chosen

Returns **2–3 plans this collection can actually support**, one line each plus package
targets. The split that keeps [D-016](../DECISIONS.md#d-016) and
[D-043](../DECISIONS.md#d-043) intact:

- **The templates are doctrine, held as data.** A small set of `pace × objective` skeletons
  with package ratios, each carrying `source` and `attribution` exactly as `Note` does.
  *"About a fifth of the deck is interaction"* becomes a number with a name on it rather than
  a constant somebody typed.
- **The feasibility is computed.** For each template, how many owned cards inside this
  identity could fill each package. **A skeleton the collection cannot support is reported as
  a gap, never hidden** — §6's designed failure mode.

> ⚠️ **Measured 2026-08-14, and feasibility turns out not to be a filter.** Against the real
> collection under Grand Duelist — **232 of 320 legal names owned** — *all four skeletons pass
> every floor*, with headroom of roughly `engine 76 · interaction 56 · closers 90 ·
> coreUnits 94`. Nothing is discriminated.
>
> That does not break the design, but it changes what the menu is **for**. Gap analysis still
> matters for a narrow identity or an early collection; for a mature one the useful output is
> the **headroom and the shape** — *"this is what a fast-conquer build would look like out of
> your boxes"* — not a pass/fail nobody fails. ⚠️ **A menu where every option is ✅ is a menu
> that has told you nothing**, and presenting it as a filter would imply a discrimination that
> was never made.

You pick one. **Stating intent directly skips the menu**; the objective is yours either way
([D-041](../DECISIONS.md#d-041)).

### 5.2 What the brief hands over

Unchanged: the whole legal pool, nothing pre-filtered. **Added: the pool bucketed by package,
with counts, against the plan's targets.**

⚠️ Today the model sees 321 undifferentiated cards and five numbers from Riot's Primer. It
should see *"interaction: 41 owned · closers: 12 · early bodies: 58"*. That alone makes a
nineteen-card two-drop spike visibly wrong **while the deck is being built** rather than after.

### 5.3 Local search

Swap single cards, re-measure. **The interactive loop *is* the product** — one-shot generation
was explicitly not what was asked for, and the first build shipped exactly that.

---

## 6. The measurement — facts against a doctrinal target

**The measurement is always a `fact`; only the target is `doctrine`.** `interaction: 3` is
counted. `interaction: target 8` carries a source and an attribution. This preserves
[`DECK-STATS`](DECK-STATS.md)'s tiering with no new machinery — plan notes reuse `review()`'s
existing `Note` contract (`claim` · `because` · `source` · `confidence` · `attribution`), which
also satisfies the standing instruction that **every EE output carries a why**.

### 6.1 Package deltas

Per package, target versus actual, signed.

⚠️ **Measured, once `packages.ts` existed — and it corrected this document.** The first draft
illustrated Grand Duelist as `engine +11 · interaction −5 · closers −4`, reasoning from the
curve. Reading the real deck says otherwise:

```
engine 15 · interaction 17 · closers 1 · coreUnits 6 · unassigned 1 · unmodelled 0
```

**Interaction is the largest package, not engine.** The deck is not monomaniacal in the way
the curve suggested. It has fifteen cards feeding `becomes_mighty` and seventeen cheap answers
— and then **one closer and six bodies.** It can switch the Legend on and it can win fights.
It has almost nothing to win *with*, which is why it flattened into two-drops.

That is a better diagnosis than the one this document was written with, and it arrived the
moment the counts became real rather than reasoned. **The illustrative figures above were
authored, which is the thing [`EE-BRIEFING`](../EE-BRIEFING.md) §3 forbids** — recorded here
because a spec that fakes its own example teaches the habit it is trying to prevent.

### 6.2 Curve shape — the check that does not exist today

Two facts, neither needing doctrine to state:

- **Largest single-bucket share** — Grand Duelist: 19 of 40, **48% at cost 2**
- **Empty buckets inside the plan's own intended range** — nothing at 5, one card at 6

⚠️ **Never a mean.** [`DECK-STATS`](DECK-STATS.md) §6 forbids it and is right to.

### 6.3 ⭐ Mulligan legibility — the flagship

The best idea in the transcripts, and Forge already has the machinery:

> *"The package separation isn't just for us to understand our deck, but to understand our
> **hand** when we start the game… Opening Time Warp, Thousand Tailed Watcher and Singularity
> alongside a two drop is seemingly nice, but three of those cards are sitting in your hand
> with no way to effectively utilize them in the first three turns."*
> — [`03`](../reference/transcripts/03-the-all-unique-deck.md)

[`DECKBUILDING`](../reference/DECKBUILDING.md) §4 has recorded that sentence since Discovery
and nothing ever used it — **while `simulateOpenings` already runs 10,000 hands.**

So: the distribution of opening hands by how many cards cannot act before turn three. Not
*"you have too many closers"* but ***"in 23% of openings, three of your four cards can't act
before turn three."*** Tier 2, computed, assumption travelling with it — and **nothing any of
the four sources can produce.**

### 6.4 Disclosure is structural

The check runs **inside `npm run deck`**, not as a command the mouth may forget. That was the
existing failure and an instruction cannot fix it.

It refuses **illegal** decks. It **never refuses an ugly one** — a quality gate would put
contested doctrine into the engine and edge toward the grading
[D-016](../DECISIONS.md#d-016) forbids.

### ⭐ Failure is a feature

If the collection cannot produce a legal deck, the correct output is **gap analysis**, never
"no results":

> *"You have 34 of 40. The gaps are: 2 more 2-drops in Calm, a second removal spell, and
> 4 more Calm runes. The closest you can get today is this 38-card list plus two off-plan
> cards."*

---

## 7. Battlefields — ✅ `G4` resolved

**Battlefields are a third of a registered deck and generation must propose them.** The rule
is a **class, not a score**, which is why it fits the no-grading constraint —
[`BATTLEFIELD-GUIDE`](../reference/BATTLEFIELD-GUIDE.md) §1 already encodes it:

| Class | Text says | Downside risk |
|---|---|---|
| 🟢 **One-sided** | *"when **you** hold here"* | **None.** The opponent gets nothing |
| 🟡 **Symmetric** | *"units here"*, *"each player"* | **The class that hurts you** — it helps whoever exploits it harder |
| 🔴 **Restriction** | constrains both | A tax; you must name whose plan it taxes |

### ⚠️ The floor: cannot-hurt-me beats might-help-me

Alexander's rule, and the one that decides the common case:

> *"There may not be amazing battlefields for every deck. Then EE should consider
> battlefields the deck may not benefit massively from, but most certainly won't be hurt by."*

**That floor is the 🟢 class.** So:

- A **one-sided** battlefield needs no justification beyond its class.
- A **symmetric** one requires a stated reason that this deck exploits it harder — and
  **if EE cannot state that reason, it is not registered.** Silence becomes a refusal rather
  than a default.

Two facts from the guide sharpen it:

- ⭐ **Asymmetry beats magnitude, proven.** `Trifarian War Camp` (+1 to *everything*) flips
  **0.0%** of combats; `Forbidding Waste` (−2 to a *lone defender*) flips **40.8%**.
- **Only 1 of your 3 is used per game**, so the plan must record **three different answers,
  not three copies of one idea** — itself a checkable property.

---

## 8. The sideboard — part of the plan

Ten slots (TR 601.1.c.1), and Alexander's rule makes them checkable for the first time by
defining them **against `plan.winCondition`**:

| Purpose | What earns a slot |
|---|---|
| **Insurance** | A solid counter exists to this deck's win condition — carry the answer |
| **Flexibility** | A line the main deck cannot take, named |

⚠️ **The honest limit.** Forge cannot know what your opponents actually play
([D-035](../DECISIONS.md#d-035)). So *"a solid counter exists"* must be grounded in what the
**identity can do** — `counter`'s `theirPatterns` and `theirEngine` — never in a meta read.
That is a real weakening of the rule and EE must say so rather than paper over it.

⚠️ **Copy limits span Main Deck and sideboard combined (L16).** ⚠️ **A sideboard card need not
be owned** — ownership is a warning, never a violation — but say plainly which ones are not
held, with the count.

---

## 9. Constraints every mode obeys

| Constraint | Source |
|---|---|
| **Legal** — all 33 checks | [LEGALITY.md](LEGALITY.md) |
| **Owned** — only cards in the collection | [D-013](../DECISIONS.md#d-013) |
| **Uncommitted** — never propose cards held by a `BUILT` deck | [D-026](../DECISIONS.md#d-026) |
| **Negative constraints** — *"not this card"*, *"not this strategy"* | Original vision |
| **Multiple candidates, never one answer** | [D-008](../DECISIONS.md#d-008) |
| **Explained** — every proposal carries its reasoning | [D-039](../DECISIONS.md#d-039) |
| **Built to a plan, and measured against it** | [D-064](../DECISIONS.md#d-064) |

---

## 10. ⚠️ The weak link

**Everything above rests on assigning 40 cards to packages correctly.** Mis-bucket them and
every delta in §6 is confidently wrong — which is the exact failure this project keeps
finding in itself.

So assignment follows the pattern `mechanic` and `rewards` already established:

- **Explainable per card.** Why this card is in this package must be answerable.
- **`counted` where the tags support it; `unmodelled` where they do not — never silently
  zero.** A package Forge cannot measure says so, rather than reporting a delta it invented.

This is the same rule that `feedsMeasured` exists to enforce, learned the hard way when
`mechanic --name mighty` answered `feeds: 0` against a collection holding **60** cards that
raise Might.

---

## 11. What generation must not become

| Never | Why |
|---|---|
| A single "best deck" answer | [D-016](../DECISIONS.md#d-016) — and it removes the tinkering that is the point |
| A ranked list with scores | Same. Candidates are *distinct*, not *ordered* |
| A black box | Every proposal explains itself, or it is not shippable |
| A replacement for building by hand | ⚠️ Audit finding **A9**: the goal is to *enjoy hours of building* |
| A netdeck engine | ⚠️ See below |

### ⚠️ The loudest advice in the sources is closed to Forge, on purpose

`01`'s primary recommendation is to take a three-star top-eight list and mix from there, on an
evolutionary-convergence argument. **[D-035](../DECISIONS.md#d-035) forbids the meta data that
route needs**, so Forge cannot take it.

Recorded rather than quietly omitted, because it raises the bar on the sieve path — and
because `03` answers `01` directly on the merits:

> *"You are not those players. Understanding your deck and how it's built is what allows you
> to figure out how you might like to play your first three turns."*

---

## 12. Open questions

| # | Question |
|---|---|
| **G1** | How many candidates is useful? Three feels right; more becomes a wall |
| **G2** | When seeding on a card with no identity constraint, how does the tool ask rather than guess? |
| **G3** | For counter-mode, does the user enter a full decklist, or just a Legend + a few cards they keep losing to? |
| ~~G4~~ | ✅ **RESOLVED — §7.** Battlefields are proposed, classified by asymmetry, with cannot-hurt-me as the floor |
| ~~G5~~ | ✅ **RESOLVED — on request only.** [D-042](../DECISIONS.md#d-042) |
| **G6** | Does the plan enter `deck_history.contents`, so *"which plan was this version built to"* survives a revision? Probably yes |
| **G7** | The feedback loop — *"I played into X and lost because of Y"* — writes to `matches.symptoms`, which exists in the schema and has never been wired to the plan. A note about a real game is evidence about a **package**, not about a card |
