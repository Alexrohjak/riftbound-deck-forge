# EE — The Evaluation Engine

> Forge's strategist. You ask it questions about your cards, your decks and your
> matchups; it answers in plain language, grounded in a deterministic rules core.
>
> **Created:** 2026-08-02 · **Revised:** 2026-08-02 (v3 — question-driven) ·
> **Status:** specification, no code

**Related:** [`OVERVIEW.md`](OVERVIEW.md) (system map) ·
[`../reference/COMPENDIUM.md`](../reference/COMPENDIUM.md) (rules + cards) ·
[`DECK-STATS.md`](DECK-STATS.md) (measurement) · [`LEGALITY.md`](LEGALITY.md) ·
[`DATA-MODEL.md`](DATA-MODEL.md)

---

## 1. What EE is

**EE answers questions about Riftbound.** Not "submit deck, receive report" — a
conversation, where every answer traces back to the rules and the real card pool.

> *"What's this card actually good at?"* · *"How do I play this deck?"* ·
> *"What should I fear?"* · *"What do I sideboard against Diana?"* ·
> *"Should I attack here?"* · *"What cards suit this Legend?"*

## 2. 🔴 Prime directive — synthesis, not enumeration

> ⚠️ **Scope: this governs what EE *says*, never what Forge *stores*.**
> The data layer should be **as complete as possible** — full card text, full classification,
> full refutation sets. Completeness downstairs is what makes a good answer upstairs
> possible. The directive applies only at the point a **human reads the output**.

**EE must never say *"this works unless your opponent has one of these 10,000 cards."***

That is a true statement and a useless one. It is what the *analysis layer* computes
internally; it is **not** what a person reads.

| ❌ Never output | ✅ Always output |
|---|---|
| "66 cards refute this attack" | "Fragile to cheap Mind interaction — a 1-cost Might swing beats it. Attack when they're tapped out, or hold `Cleave` to force through." |
| "Answer coverage 42% at cost 3–4" | "Your removal tops out at 4 damage. Roughly a third of the units you'll meet outclass it — you need to win those fights with combat, not spells." |
| A list of 200 legal cards | "Your Legend pays off on gear. You're running 4." |

**The rule:** every EE output is *at most* a handful of named, actionable statements.
Volume lives behind a "show me the cards" affordance, never in the answer itself.

**Why this is a hard requirement, not polish:** the value of this tool is *understanding*.
An answer a human can't hold in their head has failed, regardless of its correctness.

---

## 3. The questions EE answers

This taxonomy structures the whole engine. Adding a new question type is the primary
way EE grows — see [`OVERVIEW.md`](OVERVIEW.md) for the extension procedure.

| ID | Question | §  |
|---|---|---|
| **Q-CARD** | What is this card good at? Bad at? When do I play it? | [6.1](#61-q-card--what-is-this-card-good-at) |
| **Q-COMPARE** | How do these two cards compare? Which wins a fight? | [6.2](#62-q-compare--card-vs-card) |
| **Q-LEGEND** | What kind of cards suit this Legend's playstyle? | [6.3](#63-q-legend--what-suits-this-legend) |
| **Q-DECK** | What does this deck do? How should I pilot it? | [6.4](#64-q-deck--how-does-this-deck-want-to-be-played) |
| **Q-THREAT** | What should I look out for, and how do I handle it? | [6.5](#65-q-threat--what-should-i-fear) |
| **Q-SIDEBOARD** | What do I swap, against what, and for what? | [6.6](#66-q-sideboard--what-do-i-swap) |
| **Q-LINE** | Should I attack / hold / commit here? | [6.7](#67-q-line--should-i-attack-here) |
| **Q-BUILD** | What should I add or cut? | [6.8](#68-q-build--what-should-i-change) |

---

## 4. Architecture — four layers

```
┌──────────────────────────────────────────────────────────┐
│ 4. CONVERSATION   the voice. Open questions, follow-ups, │
│                   "why?", memory of what you asked       │
├──────────────────────────────────────────────────────────┤
│ 3. SYNTHESIS      turns computation into a few named,    │
│                   actionable statements  ← §2, §5        │
├──────────────────────────────────────────────────────────┤
│ 2. ANALYSIS       refutation search, coverage, pressure, │
│                   robustness, Legend fit  (deterministic)│
├──────────────────────────────────────────────────────────┤
│ 1. RULES CORE     state, legal actions, chain, showdown, │
│                   combat, rules-as-data  (deterministic) │
└──────────────────────────────────────────────────────────┘
```

**Layer 3 is the one that makes EE usable, and the one v2 was missing.**

**Discipline:** layers 1–2 are the only source of truth. Layer 4 never does arithmetic and
never adjudicates a rules interaction — it asks layer 2. Any statement layer 4 cannot
ground, it does not make.

---

## 5. The synthesis layer

### 5.1 Pattern vocabulary

Raw computation is clustered into a **curated vocabulary of named strategic patterns**.
Each has a computable definition, so the name is earned rather than asserted.

| Pattern | Computable definition |
|---|---|
| **Cheap Might swing** | `[Action]`/`[Reaction]`, total cost ≤2, alters Might by ≥1 |
| **Bounce** | Returns a unit from a battlefield to hand |
| **Hard counter** | Counters a spell or ability |
| **Sweep** | Damages or kills *all* units, or all at a location |
| **Spot removal** | Kills or deals lethal-capable damage to one unit |
| **Tempo denial** | Stun, exhaust, skip, or movement prevention |
| **Evasion** | Untargetability, `Deflect`, conditional protection |
| **Recursion** | Replays from trash — `Flow`, Deathknell value, trash-play |
| **Bomb** | Total cost ≥8 **and** board-dominant (§6.5) |
| **Ambush threat** | `Hidden` / `Ambush` — appears without warning at a battlefield |
| **Ramp** | Adds resources beyond the 2-rune baseline |
| **Go-wide** | Produces ≥2 bodies from one card |

Patterns are **the unit of communication.** EE says *"fragile to cheap Might swing"* and
offers 2–3 representative cards. It does not list 66.

### 5.2 Salience — what gets said

Computation produces many true statements. Synthesis must choose **few**. Ranking:

| Factor | Meaning |
|---|---|
| **Severity** | Does this lose the game, or cost a card? |
| **Likelihood of relevance** | How many reachable identities have access? |
| **Actionability** | Can the user *do* something about it? Prefer statements with a lever |
| **Non-obviousness** | Don't tell someone their 12-cost card is expensive |

**Default budget: 3–5 statements per answer.** Everything else is available on request.

### 5.3 Voice

Answers read as a knowledgeable teammate: direct, specific, and willing to say *"I don't
know"* or *"that depends on information I don't have."* Never breathless, never a wall of
numbers, never a grade.

---

## 6. Question specifications

### 6.1 Q-CARD — "what is this card good at?"

**Computed:** role classification · cost efficiency vs format median at that cost ·
combat profile in both orientations · timing class · activation conditions ·
anti-synergies · the line where it shines.

**Synthesised into:** what it beats, what beats it, when to play it, what makes it dead.

> **Immortal Phoenix** — 3E/1P, Might 3, `[Assault 2]`, Fury.
>
> A *proactive attacker*: 5 Might attacking, only 3 defending, so it wants to be the one
> initiating. It trades up against the format's 4-Might midrange when it attacks and loses
> to almost everything when it defends — don't leave it holding a battlefield.
>
> Its recursion (replay from trash when you kill with a spell) means it's cheap to lose,
> so it's a *good aggressive commitment* into open mana. **Dead when:** you have no
> spell-based removal to trigger the recursion.

### 6.2 Q-COMPARE — card vs card

Runs the rules core in **both orientations** (role-conditional Might — `Assault` applies
only attacking, `Shield` only defending), then reports the *conditions*, not a winner.

> **Immortal Phoenix vs Blue Sentinel.** Sentinel wins both ways — 6 defending beats your
> 5 attacking, and 4 attacking beats your 3 defending. You don't beat it in combat alone.
>
> **You need a Might swing.** `Cleave` (1E, `Action`, `Assault 3`) gets you to 8 and
> through. But this is a *fragile* line: Mind and Calm both have 1-cost answers, so expect
> it to be contested if they have runes up.

Note what is **not** said: no list of 66, no percentage, no verdict.

### 6.3 Q-LEGEND — "what suits this Legend?"

Each Legend's ability declares what it **rewards**. EE builds the producer/consumer link
and reports fit. This is pure derivation and one of EE's strongest features.

| Legend | Ability rewards | Therefore wants |
|---|---|---|
| **Fire Below the Mountain** (Ornn) | *"Add `[A]`. Use only to play gear or gear abilities"* | **Gear density** |
| **Daughter of the Void** (Kai'Sa) | *"Add `[A]`. Use only to play spells"* | **Spell density** |
| **Curator of the Sands** (Nasus) | Triggers on cost **≥7** | **Expensive top-end** |
| **Glorious Executioner** (Draven) | *"When you win a combat, draw 1"* | **Combat-winning units** |
| **Emperor of the Sands** (Azir) | Sand Soldiers gain `Weaponmaster` | **Equipment + tokens** |
| **Heart of the Tempest** (Kennen) | Triggers on playing from **non-hand zones** | **`Hidden` and `Flow`** |

> **Your Ornn deck runs 4 gear in 40.** The Legend's ability only pays off on gear, so
> it's idle most turns. Calm/Mind has 31 gear available — a gear-forward build turns the
> Legend from a rune into an engine.

⚠️ Requires hand-annotating **49 Legend abilities** — an afternoon, and stable.

### 6.4 Q-DECK — "how does this deck want to be played?"

**Computed:** curve vs rune ceiling · unit density at 2–4 · interaction count ·
speed-to-first-score vs speed-to-8 · contest capacity by turn · Legend fit · dead cards.

**Classified** by derived shape, not by borrowed archetype names:

| Shape | Signature |
|---|---|
| **Racer** | Contests by turn 2; speed-to-8 short; low interaction |
| **Grinder** | Slow first contest; high interaction; wants Hold points |
| **Setup** | Back-loaded curve; needs a specific assembly to function |
| **Flexible** | No dominant signature — plays to the matchup |

> **This is a Racer.** You contest by turn 2 and can reach 8 by turn 6 unopposed. You run
> **4 interactive spells** — Riot's own primer suggests 6+ — so you lose long showdowns.
> **Pilot it as the aggressor:** take battlefields early and force them to answer.
> Remember a stalled attack recalls your units, so only commit when you can actually clear.

### 6.5 Q-THREAT — "what should I fear?"

Threats are grouped into patterns and ranked by severity × reachability, **not listed.**

**Threat pressure classes:**

| Class | Test |
|---|---|
| **Must-answer** | Wins or compounds if unanswered |
| **Board-dominant** | Beats the format's median unit in both orientations |
| **Answer-asymmetric** | Costs more to remove than it cost to play |
| **Rule-warping** | Voids a rule your deck relies on (e.g. Elder Dragon voiding lethal thresholds) |

> **Three things beat this deck.**
> 1. **Sweeps.** 14 of your 40 cards are Might ≤3; a single `Deal 3`-to-all wipes your
>    board. Play around it by not over-committing once you're ahead on points.
> 2. **Big defenders.** Your removal caps at 4 damage, and Body/Order fields several
>    `Shield`+`Tank` units above that. You can't remove them — you have to go around them
>    to another battlefield.
> 3. **Cheap Might swing.** Most of your attacks win by exactly 1 Might, so a 1-cost trick
>    flips them. Attack when they're tapped out.

### 6.6 Q-SIDEBOARD — "what do I swap?"

Constrained by **TR 403.4**: 1-for-1 exchanges, deck stays exactly 40, and **runes, Legend
and Battlefields may never change after registration** (TR 403.4.b). The Chosen Champion
*may* be swapped (TR 601.1.c.4).

**Computed:** for a named threat pattern — which sideboard cards answer it, what they cost
you to bring in, and which main-deck cards are *least* useful in that matchup (dead cards,
redundant effects, cards whose targets don't exist).

> **Against a Body/Order grinder:** bring in both `Rebuke` for their `Shield`+`Tank` units.
> Cut 2× `Flurry of Blades` — their board is Might 4+, so 1 damage to all does nothing.
> Consider swapping your Chosen Champion to the defensive Kennen; you're not racing this
> matchup.

### 6.7 Q-LINE — "should I attack here?"

Runs the showdown model: alternating Focus, chains LIFO, `[Reaction]` only in closed
states. Reports the **decision**, its cost, and its fragility.

> **Yes, but only this turn.** You clear their board and take the battlefield. They have 3
> runes up and Calm has cheap counters, so there's real risk — but if you wait, their
> 6-drop lands next turn and you can't attack profitably again.
> **If it goes wrong** you lose two units and they keep the point.

### 6.8 Q-BUILD — "what should I change?"

**Computed:** dead cards (unmet dependencies) · Legend fit gaps · curve holes against the
rune ceiling · coverage gaps · deviation from Riot's published floors · rune-split
feasibility.

> - **3 cards have `[Level 6]` abilities; your deck produces 2 XP maximum.** Those
>   abilities can never activate. *(This one is a hard fact.)*
> - You have **no play on turn 1** in 60% of opening hands.
> - Your rune split is 6-6 but your Power demand is 9 Fury / 2 Calm. **8-4 fits better.**

---

## 7. What EE never does

| Never | Why |
|---|---|
| Enumerate large card lists in an answer | §2 — the prime directive |
| Emit a deck grade, rating or score | [D-016](../DECISIONS.md#d-016) |
| Predict what the opponent *will* play | Only what they *can*. No meta data exists — [COMPENDIUM §VI.6](../reference/COMPENDIUM.md#6-the-meta--and-why-it-may-not-matter-for-forge) |
| State a win percentage | Would require piloted-game data. Would be an ESTIMATE — [D-022](../DECISIONS.md#d-022) |
| Let the conversation layer invent a number | Layer 4 asks layer 2, always |
| Model pilot skill | Not a property of a deck |

**"I don't know" is a valid, and sometimes correct, answer.**

---

## 8. Grounding the depth — what the rules core must handle

EE is only as honest as its core. Non-negotiable (all cited in
[COMPENDIUM §III](../reference/COMPENDIUM.md#part-iii--how-the-game-is-played)):

| Requirement | Why |
|---|---|
| **Showdowns as alternating priority windows** | Both players act inside a combat (CR 341–348). **211 of 814 cards (26%)** are combat-speed |
| **Chains resolving LIFO, `[Reaction]`-only once closed** | CR 327–340 |
| ⭐ **Defend triggers resolve BEFORE attack triggers** | The attacker places triggers on the chain **first** (CR 464.2.e.1) and the chain is **LIFO** (CR 340.1), so attack triggers resolve **last**. A defensive trigger can remove or shrink the attacker before its attack trigger ever fires. **An engine that fires attack triggers first is simulating a different game** |
| ⭐ **A rune yields Energy *and* Power** | Exhaust for `[1]`, then recycle the exhausted rune for `[C]`. Two abilities, two costs, no rule forbidding both (CR 164.2, 414.1.b, 416). Modelling this as either/or understates every deck's resource ceiling |
| **Role-conditional Might** | `Assault` attacking only, `Shield` defending only (CR 807, 814) |
| **Four outcomes with the stall asymmetry** | `STALL` **recalls the attacker** (CR 466.1.a.2) — attacking and defending are different questions |
| **Hidden information on the board** | **43 `[Hidden]` cards** sit facedown and play later ignoring base cost (CR 811) |
| ⚠️ **Rules as data, not code** | **21 cards rewrite rules an engine would hardcode.** Elder Dragon voids the lethal-damage threshold; Dune Surfer voids `Tank`; Baron Nashor adds a battlefield mid-game. CR 002 — *card text supersedes rules text* — is a design requirement |

---

## 9. Implementation

| Component | Effort |
|---|---|
| Structured card fields | ✅ Trivial — typed JSON, 814 cards |
| Keyword extraction | ✅ Proven — 498 cards (61%) machine-readable |
| Effect annotation | ⚠️ **~153 cards (19%)** — hand-annotate, don't parse |
| Legend ability annotation | ⚠️ **49 Legends** — hand-annotate |
| Pattern vocabulary | 🟡 Curated definitions over the above |
| Rules core with overrides | 🔴 **The bulk of the work** |
| Synthesis layer | 🟡 Ranking + templating; the quality bar is editorial |
| Conversation layer | 🟡 Depends on the D3 architecture decision |

**Corpus fits in context.** Measured: 814 main-deck cards with full text ≈ **38,700
tokens**; +115 Legends/Battlefields ≈ **3,900**; both rulebooks ≈ **75,000**. The entire
game is **~118k tokens** — a conversational layer can genuinely hold all of Riftbound.

> **Scale honesty:** the rules core is comparable to the rest of the Workbench combined. Build it
> **vertically** — one battlefield, 1v1, full fidelity — then widen.

## 10. Testing

| Layer | Approach |
|---|---|
| Rules core | Every worked example in CR 355–359, 370–375, 465.2 as a fixture. The rulebook is a test suite |
| Chain / showdown | Property tests: LIFO, Reaction-only when closed, pass-pass termination |
| Rule overrides | A named regression test per rule-warping card |
| Analysis | Golden files per Domain Identity; card-pool drift fails the build |
| **Synthesis** | ⭐ **Budget tests** — assert no answer exceeds its statement budget or names more than 3 example cards. *This is how §2 stays true under pressure* |
| Conversation | Adversarial: assert no number appears that didn't come from a tool call |

## 11. Open questions

| # | Question | Blocks |
|---|---|---|
| **E1** | Where does the conversation layer run — in-app, or Claude Code against an exported deck state? | D3 architecture |
| **E2** | Battlefield abilities modify combat. v1, or evaluate neutral and flag the simplification? | Rules core |
| **E3** | Legend abilities are always-on. v1 or later? | Rules core |
| **E4** | Refutation search depth — single card, or card-answers-card chains? | Analysis |
| **E5** | How are facedown `Hidden` cards modelled — ignored, worst-case, or a distribution? | Rules core |
| **E6** | Multi-unit boards: full enumeration or bounded heuristics? | Rules core |
| **E7** | Does EE model multi-battlefield turns, or one combat at a time? | Rules core |
