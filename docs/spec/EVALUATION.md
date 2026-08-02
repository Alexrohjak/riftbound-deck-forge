# Evaluation Engine — Forge

> How Forge answers *"what does this deck do well, what is it good against, where does it
> come up short, and what should I fear?"* — as an **interactive strategist**, grounded in
> a deterministic rules core.
>
> **Created:** 2026-08-02 · **Revised:** 2026-08-02 (v2 — interaction model) ·
> **Status:** specification, no code · **Phase:** Discovery

**Related:** [`../reference/COMPENDIUM.md`](../reference/COMPENDIUM.md) (rules + card data) ·
[`LEGALITY.md`](LEGALITY.md) · [`DECK-STATS.md`](DECK-STATS.md) (honesty tiers) ·
[`DATA-MODEL.md`](DATA-MODEL.md) · [`GENERATOR.md`](GENERATOR.md)

---

## 0. What changed in v2, and why

**v1 of this document was wrong in a way worth recording.**

It modelled a combat as arithmetic over a static board: sum Might, apply `Assault`/`Shield`,
compare. It then labelled the result a **FACT**.

It is not a fact. A Showdown is an **alternating sequence of priority windows** in which
both players may play cards, with chains resolving LIFO on top (CR 341–348, 464). The Might
figures are the *opening position*, not the outcome.

Concretely — v1's worked example claimed *"Blue Sentinel (4+2=6) beats Immortal Phoenix
(3+2=5) in both orientations, FACT."* Measured against the actual card pool:

> **66 cards in the format can flip or void that combat.** The cheapest is **`Stupefy`** —
> 1 Energy, Mind, `[Reaction]`, *"give a unit -1 Might"*. Sentinel drops 6 → 5, Phoenix's 5
> damage becomes lethal, and the "fact" inverts for one Energy.

The v1 claim was true only under an unstated assumption — *neither player holds a trick* —
and stating it as a FACT without that qualifier is the same class of error as conflating
tags with champion tags. **This document exists to make that assumption explicit and
computable, not to hide it.**

**The reframe:** the engine does not answer *"who wins?"*. It answers

> *"who wins, **unless** the opponent holds one of these N cards — costing this much, at
> this speed, available in these domains."*

That refutation set **is** the answer to *"where does this deck come up short?"*

---

## 1. The game is deeper than a damage calculation

Three structural facts the engine must model. All were documented in
[COMPENDIUM §III](../reference/COMPENDIUM.md#part-iii--how-the-game-is-played); v1 failed
to use them.

### 1.1 Showdowns — both players act inside a combat

| Step | Rule | Consequence |
|---|---|---|
| Combat opens as a Showdown | CR 464.1 | Attacker gains **Focus** |
| Player with Focus may play a card or pass | CR 347 | Only `[Action]` / `[Reaction]` |
| Playing a card opens a **Chain** → Closed state | CR 328, 309.1 | Now **only `[Reaction]`** may be added |
| Chain resolves **LIFO** | CR 340.1 | Last played resolves first |
| Chain empties → Focus **passes** | CR 346 | The other player now acts |
| Both pass consecutively | CR 347.2.a | Showdown closes → damage step |

So a combat is a **turn-taking game with a stack**, not a comparison. Either player may
invest resources to change the outcome, and each investment can itself be answered.

**Measured interaction surface:**

| Class | Cards | Meaning |
|---|---|---|
| `[Action]` | 87 | Playable in showdowns, on any player's turn |
| `[Reaction]` | 98 | Playable in **closed** states — on top of a chain |
| `[Hidden]` | 43 | Facedown at a battlefield, later played **ignoring base cost** |
| **Union** | **211 of 814 (26%)** | Over a quarter of the pool is combat interaction |

Of the Reaction spells, **49 cost ≤3 total** — `Stupefy`, `Gust`, `Retreat`, `En Garde`,
`Combat Experience`, `Abandon`, `Crumbling Sands`… Cheap interaction is abundant, which
means *no* combat evaluation is unconditional.

### 1.2 Hidden information is on the board, not just in hand

`Hidden` (CR 811) lets a player pay `[A]` to place a card **facedown at a battlefield they
control**, then play it from there on a later turn **ignoring its base cost**, with
`[Reaction]` timing.

43 cards can do this. So the board carries **known-unknowns**: a visible facedown card whose
identity is private (CR 128.4). The engine must model *"there is a facedown card here"* as a
first-class state with a probability distribution over its contents — not ignore it.

### 1.3 ⚠️ Cards rewrite the rules the engine would hardcode

**21 cards alter rules a naive engine would treat as constants.** Examples:

| Card | Rule it overrides |
|---|---|
| **Elder Dragon** | *"Any amount of your damage is enough to kill enemy units"* — **voids the lethal-damage threshold** (CR 142.4.c) |
| **Dune Surfer** | *"You ignore `[Tank]` while assigning combat damage here"* — voids assignment ordering (CR 815) |
| **Decree of Insight** | *"Ignore `[Deflect]`"* — voids the additional-cost tax (CR 809) |
| **Baron Nashor** | Adds a **battlefield token** to the board mid-game — the board is not fixed |
| **Endless Riches** | *"Skip your Draw Phase"* — turn structure is mutable (CR 443) |
| **Corrupted Dragon** | *"If your score is not within 3 of the Victory Score, I enter ready"* — score-conditional entry |
| **Time Warp** | *"Take a turn after this one"* — turn order is mutable (CR 734) |
| **Akali, Silent** | *"I can't be chosen unless I'm in combat"* — conditional untargetability (CR 756) |

> 🔑 **Architectural consequence: rules must be data, not code.** CR 002's Golden Rule —
> *"Card text supersedes rules text"* — is not a footnote; it is a design requirement. Every
> rule the engine applies (lethal threshold, assignment order, targeting legality, phase
> sequence) must be a **modifiable parameter of game state**, overridable by an active
> effect. An engine with `if damage >= might: die` hardcoded is wrong the moment Elder
> Dragon resolves.

---

## 2. Output contract — conditional claims with refutations

v1's contract stands, with one addition that changes everything: **a claim must carry its
refutation set.**

```
Claim {
  statement    : "Your Phoenix attack kills Blue Sentinel"
  baseline     : REPELLED           # with neither player investing
  derivation   : "3+2 Assault = 5 vs 4+2 Shield = 6; 5 < 6, not lethal"
  citations    : [CR 807, 814, 465.2, 142.4.b]
  assumptions  : ["no cards played during the showdown", "neutral battlefield",
                  "no legend abilities active"]
  refutations  : [ {card: "Stupefy",  cost: "1E", speed: Reaction, domains: [mind],
                    effect: "defender -1 Might → 5, your 5 becomes lethal"}, … ]
  robustness   : { refuting_cards: 66, cheapest: 1, domains_with_answer: 5 }
  tier         : CONDITIONAL
}
```

**Revised tiers:**

| Tier | Meaning |
|---|---|
| **FACT** | True regardless of any legal play. Rare and precious. *"Your deck contains 0 cards that produce XP, so `[Level 6]` abilities can never activate."* |
| **CONDITIONAL** | True unless refuted; ships **with** its refutation set. Most combat claims |
| **PROBABILITY** | Computed with stated uncertainty. *"72% to hold a Fury source by turn 3"* |
| ~~ESTIMATE~~ | **Not produced**, per [D-022](../DECISIONS.md#d-022) |

**Still forbidden:** any grade, rating, score, or star count ([D-016](../DECISIONS.md#d-016)).

### 2.1 🔑 Robustness — the metric that actually matters

For any line of play, **robustness** = how hard it is to refute:

| Dimension | Question |
|---|---|
| **Breadth** | How many format cards refute it? |
| **Cost** | What's the cheapest refutation? |
| **Speed** | Does refuting need `[Action]`, `[Reaction]`, or a whole turn? |
| **Reach** | How many Domain Identities have access to a refutation? |
| **Frequency** | Is the refutation a common playable or a niche card? |

A line refuted only by one 6-cost card in one domain is **robust**. A line refuted by
1-Energy commons across five domains is **fragile** — and that is precisely the "where does
this deck come up short" answer the user wants, stated without guessing.

---

## 3. Opponent model — the whole legal format

**Decided 2026-08-02.** Evaluate against the **threat space**: every card the format can
legally field, bucketed by Domain Identity, cost, speed and role.

Rejected: modelled archetype decks (requires assuming typical lists), tournament meta data
(403-blocked and n=1–3), user's own decks only (says nothing about the field).

**Refutation search runs over this space.** For a given line, enumerate every legal opposing
card that could change the outcome, filtered by what that identity can actually run. No
assumptions about what they *will* play — only what they *can*.

---

## 4. The rules core — a real engine, not a calculator

### 4.1 Game state

```
GameState {
  battlefields : [ {id, abilities, units[], facedown[], controller, scored_this_turn} ]
  bases        : { player: [permanents, runes(ready|exhausted)] }
  players      : { points, xp, hand_size, hand(private), trash, banishment,
                   rune_pool{energy, power_by_domain}, legend(+empowered) }
  chain        : [ items… ]                # LIFO
  turn         : { player, phase, state: Neutral|Showdown × Open|Closed,
                   priority, focus, cards_played_this_turn }
  rule_overrides : { lethal_threshold_fn, assignment_order_fn,
                     targeting_fn, phase_sequence, … }   # ← §1.3
}
```

### 4.2 What the core must do

| Capability | Rules |
|---|---|
| Enumerate **legal actions** for a player in a given state | CR 307–313, 349, 398 |
| Resolve the **chain** LIFO, with Reaction-only in closed states | CR 327–340 |
| Run a **Showdown** to closure (alternating Focus, pass-pass termination) | CR 341–348 |
| Assign combat damage under Tank/Backline/lethal-first/no-overkill | CR 465.2.c |
| Apply **replacement effects** and **layers** in correct order | CR 367–375, 473–480 |
| Execute **cleanups** including recall-attackers-on-stall | CR 318–324, 466 |
| Apply **rule overrides** from active card effects | CR 002 |

> This is genuinely a rules engine. It is the largest single piece of work in the project
> and should be scoped as such — see §7.

### 4.3 Combat outcomes — four, with the stall asymmetry

| Outcome | Consequence |
|---|---|
| `CONQUEST` | Defenders wiped, attacker survives → battlefield taken, **+1 point** if unscored (CR 466.5.d) |
| `REPELLED` | Attackers wiped → material lost for nothing |
| `TRADE` | Both wiped → battlefield **uncontrolled** (CR 466.5.b) |
| `STALL` | Both have survivors → ⚠️ **attackers RECALLED** (CR 466.1.a.2), defender keeps it |

`STALL` favouring the defender means *"can I attack profitably?"* and *"can I defend
profitably?"* are separate questions with separate refutation sets.

---

## 5. The analysis layer

Runs the core repeatedly over enumerated opponent options.

### 5.1 Refutation search

```
evaluate(line, my_state, opposing_identity):
    baseline = core.resolve(line, opponent_invests=NOTHING)
    refutations = []
    for card in threat_space(opposing_identity):
        if not playable_at(card, combat_timing): continue
        if not affordable(card, plausible_opponent_resources): continue
        if core.resolve(line, opponent_plays=card) != baseline:
            refutations.append(card, cost, speed, domains)
    return Claim(baseline, refutations, robustness(refutations))
```

**Bounded by construction:** only 211 cards are combat-speed, and affordability prunes
further. This is a search over hundreds, not millions.

### 5.2 Threat pressure — "units the opponent must respect"

The user's *"heavy units that cause disruptions the other player needs to respect"* is
derivable. A card exerts **pressure** if leaving it unanswered is losing.

| Class | Test | Example |
|---|---|---|
| **Must-answer** | Generates points or compounding advantage each turn if unanswered | point-scoring triggers |
| **Board-dominant** | Beats the format's median unit in both orientations, and few units beat it | Volibear, Imposing — M10, `Shield 3`, `Tank` |
| **Answer-asymmetric** | Costs the opponent more to remove than it cost to play | high Might + `Deflect` |
| **Rule-warping** | Changes a rule the opponent's deck depends on | Elder Dragon voiding lethal thresholds |

For each, compute the **answer set** — who in the format can deal with it, at what cost.
"Respect" becomes: *how many of my cards can answer this, and what do they cost me?*

### 5.3 Deck-level outputs

| Output | Derivation |
|---|---|
| **Contest capacity by turn N** | Rune ceiling (2/turn, +1 on the draw) vs curve |
| **Speed to first score / to 8** | Shortest legal point path |
| **Answer coverage** | % of threat space answerable, per cost bucket *(see COMPENDIUM §V — Deal 2 = 19%, Deal 3 = 42%, Deal 4 = 64% of 472 units)* |
| **Refutation exposure** | Which of *your* key lines are cheaply refuted, and by which domains |
| **Interaction density** | Your `[Action]`/`[Reaction]` count vs format norms — can you contest a showdown at all? |
| **Rune feasibility** | Existing flagship (PROBABILITY) |
| **Dead-card detection** | Unmet dependent-keyword requirements — e.g. `[Level 6]` with 2 max XP (**FACT**) |
| **Sweep fragility** | Fraction of your board lost to Deal-2/3 sweeps, and to `The Ruination` |

### 5.4 Official baselines

From Riot's Deckbuilding Primer (COMPENDIUM §VI.2) — report deviation as attributed fact,
never as verdict: **9+ small units (2–4 cost)**, **6+ interactive spells**, units prioritised
over spells/gear.

---

## 6. The interactive strategist

The user's ask: *"another Oracle, specifically catered to be a Riftbound know-it-all, super
strategist, who I can ask questions to about my deck."*

### 6.1 🔑 Feasibility — the whole game fits in context

Measured over the real corpus:

| Content | Size |
|---|---|
| 814 distinct main-deck cards (name, cost, Might, domains, tags, **full rules text**) | 139,373 chars ≈ **38,700 tokens** |
| 115 Legends + Battlefields with text | 14,060 chars ≈ **3,900 tokens** |
| **Total card corpus** | **≈ 42,600 tokens** |
| Core Rules + Tournament Rules (full text) | ≈ 75,000 tokens |

> **The entire game — every card and both rulebooks — is ~118k tokens.** That fits
> comfortably in a modern context window. A strategist agent can *genuinely* hold all of
> Riftbound in working memory. This is not aspirational; it is measured.

### 6.2 Proposed architecture — grounded agent

```
┌─────────────────────────────────────────────────────┐
│  STRATEGIST  (LLM, conversational)                  │
│  • holds the full card corpus + rules               │
│  • answers open questions, explains, suggests lines │
│  • NEVER adjudicates rules or computes arithmetic   │
└───────────────┬─────────────────────────────────────┘
                │ tool calls only
┌───────────────▼─────────────────────────────────────┐
│  ANALYSIS LAYER  (deterministic)                    │
│  refutation search · robustness · coverage ·        │
│  threat pressure · deck stats                       │
└───────────────┬─────────────────────────────────────┘
┌───────────────▼─────────────────────────────────────┐
│  RULES CORE  (deterministic, rules-as-data)         │
│  state · legal actions · chain · showdown · combat  │
└─────────────────────────────────────────────────────┘
```

### 6.3 The discipline that keeps it honest

| Rule | Why |
|---|---|
| **The LLM never does arithmetic.** All numbers come from tool calls | LLMs miscount; this project's whole ethos is honesty |
| **The LLM never adjudicates rules.** Interactions resolve in the core | 120 pages of rules with card-level overrides is not a vibes problem |
| **Every claim carries provenance** — engine output or quoted card text | Ungrounded claims are the failure mode |
| **"I don't know" is a valid answer** | Better than a confident wrong line, per D-022 |

**Why an LLM at all, rather than pure UI?** Because *"what should I fear in this matchup and
how do I play around it?"* is open-ended reasoning over facts — exactly what the deterministic
layer cannot express and a human wants in prose. The engine supplies truth; the strategist
supplies explanation.

**Why not LLM-only?** Because it would be confidently wrong about combat maths and rules
interactions, which is the one thing this project refuses to be.

### 6.4 Example interaction

> **You:** Should I attack into their board with Phoenix?
>
> **Strategist:** Not profitably as it stands. Phoenix attacks at 5 (3 + `Assault 2`);
> Blue Sentinel defends at 6 (4 + `Shield 2`), so you're `REPELLED` — Phoenix dies, they
> keep the battlefield. *(core: CR 807/814/465.2)*
>
> You need +1 Might or −1 on theirs. You run 2 `Cleave` (1E, `[Action]`, `Assault 3`) —
> that puts you at 8 and kills through. **But** they're Mind/Calm with 3 runes untapped,
> and that identity has 11 refutations at ≤2 cost, including `Stupefy` and `Retreat`.
> Cheapest counter-refutation you hold is… *(analysis: refutation search)*
>
> Attacking costs you Phoenix if they hold any of 11 cards. Holding it costs you tempo.
> Robustness of this line: **fragile** — 11 refuters, cheapest 1E, in 4 identities.

---

## 7. What is NOT computed

| Not computed | Why |
|---|---|
| **Win probability / matchup winrate** | Needs piloted-game data — 403-blocked, n=1–3. Would be an ESTIMATE (D-022) |
| **What the opponent *will* play** | Only what they *can*. Refutation sets, never predictions |
| **Deck grade / power rating** | D-016. Never |
| **Pilot skill** | Not a property of a deck |
| **Bluffing and `Hidden` mind-games** | Modelled as a distribution over facedown contents, not as psychology |

---

## 8. Implementation risk

| Component | Difficulty |
|---|---|
| Structured fields (cost, Might, domain, type, tags) | ✅ Trivial — typed JSON, 814 cards |
| Keyword extraction (`Assault N`, `Shield N`, `Level N`…) | ✅ Proven working — 498 cards (61%) |
| Free-text effect annotation | ⚠️ **~153 cards (19%)** — hand-annotate, don't parse |
| **Rules-as-data core with override support** | 🔴 **The real work.** 21 cards actively rewrite rules |
| Chain / showdown sequencing | 🔴 Genuinely intricate — CR 327–348 |
| Refutation search | 🟡 Bounded (211 combat-speed cards) but needs the core to be right |

> **Honest scale note.** v1 implied this was mostly arithmetic. It is not. The rules core is
> comparable in size to the rest of Phase A combined. It should be built **incrementally,
> vertically** — full fidelity for 1v1 single-battlefield combat first, then widen —
> mirroring the walking-skeleton logic that already reshaped the plan.

## 9. Test strategy

| Layer | Approach |
|---|---|
| **Rules core** | Every worked example in CR 465.2.c, 355–359, 370–375 encoded as a fixture — the rulebook is a test suite |
| **Chain/showdown** | Property tests: LIFO ordering, Reaction-only in closed states, pass-pass termination |
| **Rule overrides** | Each of the 21 rule-warping cards gets a named regression test |
| **Refutation search** | Golden files per identity; drift in the card pool surfaces as failure |
| **Claims** | Structurally enforced: no claim ships without derivation, citations **and** either a refutation set or a proof of unconditionality |
| **Strategist** | Adversarial: assert it never emits a number absent from tool output |

## 10. Open questions

| # | Question | Blocks |
|---|---|---|
| **E1** | Does the strategist run locally, via API, or is it a non-goal for v1 (engine + UI only)? | §6 |
| **E2** | Battlefield abilities modify combat. In v1, or evaluate neutral and flag? | §4 |
| **E3** | Legend abilities are always-on and shape every combat — v1 or later? | §4 |
| **E4** | How deep does refutation search go — single card, or chains of card-answers-card? | §5.1 |
| **E5** | How are facedown `Hidden` cards modelled — ignored, worst-case, or distribution? | §1.2 |
| **E6** | Multi-unit boards: full n-vs-m enumeration, or bounded heuristics? | §4 |
| **E7** | Does the engine model **multi-battlefield** turns (move + combat sequencing), or one combat at a time? | §4 |
