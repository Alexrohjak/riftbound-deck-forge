# Evaluation Engine — Forge

> How Forge answers *"what does this deck do well, what is it good against, where does it
> come up short, and what are its weaknesses?"* — **by derivation from the rules and the
> card pool, never by guessing.**
>
> **Created:** 2026-08-02 · **Status:** specification, no code · **Phase:** Discovery
>
> **Premise:** Riftbound combat is deterministic. Given two cards and the rulebook, who
> wins is *computed*, not estimated. This document specifies what is computed, how, and —
> equally importantly — what is deliberately **not** computed.

**Related:** [`../reference/COMPENDIUM.md`](../reference/COMPENDIUM.md) (rules + card data) ·
[`LEGALITY.md`](LEGALITY.md) (is it legal) · [`DECK-STATS.md`](DECK-STATS.md) (honesty tiers) ·
[`DATA-MODEL.md`](DATA-MODEL.md) (entities) · [`GENERATOR.md`](GENERATOR.md) (the deferred spike)

---

## 1. Why this is tractable

Most TCGs make deck evaluation a matter of opinion. Riftbound makes an unusual amount of it
arithmetic. Three properties do the work:

| Property | Citation | Consequence |
|---|---|---|
| **Combat resolution is fully deterministic** | CR 465 | No dice, no randomised resolution. Might sums; assignment order is rule-constrained; lethal is a threshold |
| **All damage heals at combat cleanup and end of turn** | CR 466.1.a.1, 317.2.b | **There is no attrition across turns.** Every combat is an independent, self-contained evaluation — no need to simulate a whole game to evaluate a trade |
| **The board is tiny** | CR 485.4 | 1v1 uses **2 battlefields**; victory at **8 points**. The state space is genuinely enumerable |

> The healing rule is the load-bearing one. In a game where damage persisted, evaluating a
> board would require simulating the whole game. Here, a combat is a pure function of the
> units present. That is what makes this engine honest rather than hand-wavy.

## 2. The output contract — claims, never scores

**Every output is a claim carrying its own derivation.** This is not a softened version of
[D-016](../DECISIONS.md#d-016) (*no composite score*) — it is the same principle applied to
a new surface.

```
Claim {
  statement   : "Immortal Phoenix loses to Blue Sentinel in both orientations"
  derivation  : "attacking 3+2=5 vs 4+2=6 → dies; defending 3+0=3 vs 4+0=4 → dies"
  citations   : [CR 807, CR 814, CR 465.2]
  tier        : FACT
  scope       : "this card pair, no other units present"
}
```

**Forbidden outputs:** a deck grade, a power rating, a 0–100 score, a star count, or any
number that composites independent measurements. If a user wants "is this deck good", Forge
answers with *the specific things it does and does not do*, and lets them judge.

**Tiers** map onto the existing three-tier scheme in [`DECK-STATS.md`](DECK-STATS.md):

| Tier | Meaning | Example |
|---|---|---|
| **FACT** | Provable from rules + card data. Deterministic | "Deal 3 kills 42% of the format's units" |
| **PROBABILITY** | Computed with stated uncertainty | "72% chance to hold a Fury source by turn 3" |
| ~~ESTIMATE~~ | **Not produced.** Omitted entirely, per D-022 | — |

---

## 3. Opponent model — the whole legal format

**Decided 2026-08-02.** Forge evaluates against the **threat space**: every card the format
can legally field, bucketed by Domain Identity, cost and role.

**Why this and not the alternatives:**

| Rejected | Why |
|---|---|
| Modelled archetype decks per Legend | Requires assuming what a "typical" list looks like — that is the guessing this engine exists to avoid |
| Tournament meta data | Inaccessible (403) and statistically empty (n=1–3 for the current set) — see COMPENDIUM §VI.6 |
| Only the user's own decks | Says nothing about the wider field |

The threat space needs **no meta data and no assumptions**. It answers *"what could I face"*
rather than *"what will I face"* — a weaker claim, but a true one.

> **Layerable later.** Entering specific rival decks (for a known playgroup) is a strict
> refinement of this model, not a replacement. Build the threat space first; it makes the
> rival-deck feature a filter rather than a new engine.

---

## 4. Primitive: the Duel Resolver

The atom everything else is built from.

### 4.1 Effective Might

```
effective_might(unit, role, context):
    m  = printed_might
    m += Assault(unit)  if role == ATTACKER      # CR 807
    m += Shield(unit)   if role == DEFENDER      # CR 814
    m += buff_count(unit)                        # CR 703, max 1 buff (CR 702.3)
    m += static_modifiers_from(context)          # other units, battlefield, legend
    return m
```

⚠️ `Assault` and `Shield` are **role-conditional**. The same two cards produce different
outcomes depending on who initiated. Any evaluation that compares printed Might alone is
wrong — see the worked example in §4.4.

### 4.2 Combat resolution — CR 465

```
resolve(attackers, defenders):
    A = Σ effective_might(u, ATTACKER)  for u in attackers
    D = Σ effective_might(u, DEFENDER)  for u in defenders
    attacker_casualties = assign(D, attackers)   # defenders' damage onto attackers
    defender_casualties = assign(A, defenders)
```

`assign(pool, units)` obeys, in order:
1. **Tank** units must receive lethal first (CR 815)
2. **Backline** units must receive lethal last (CR 826)
3. Lethal must be completed on one unit before starting the next (CR 465.2.c.3)
4. **No overkill** — never more than lethal unless no units remain (CR 465.2.c.4)
5. Lethal = damage ≥ effective Might, and non-zero (CR 142.4.b)

### 4.3 Outcomes — four, not two

| Outcome | Condition | Consequence |
|---|---|---|
| `CONQUEST` | all defenders die, ≥1 attacker lives | Attacker takes the battlefield; **+1 point** if not already scored there this turn (CR 466.5.d) |
| `REPELLED` | all attackers die, ≥1 defender lives | Attacker loses material for nothing |
| `TRADE` | both sides wiped | Battlefield becomes **uncontrolled** (CR 466.5.b) |
| `STALL` | both sides have survivors | ⚠️ **Attackers are RECALLED** (CR 466.1.a.2); defender keeps the battlefield |

> 🔑 **`STALL` favours the defender.** An attack that fails to clear the board is a wasted
> tempo cycle — your units go home, theirs stay. This asymmetry means *"can I profitably
> attack here?"* and *"can I profitably defend here?"* are different questions and must be
> reported separately. Most naive evaluators collapse them.

### 4.4 Worked example (verified against real cards)

**Immortal Phoenix** `OGN-037` — 3E/1P, Might 3, `[Assault 2]`
**Blue Sentinel** `UNL-087` — 4E/1P, Might 4, `[Shield 2]`

| Orientation | Attacker | Defender | Outcome |
|---|---|---|---|
| Phoenix attacks | 3 + 2 = **5** | 4 + 2 = **6** | `REPELLED` — Phoenix dies |
| Sentinel attacks | 4 + 0 = **4** | 3 + 0 = **3** | `CONQUEST` — Phoenix dies |

**Blue Sentinel beats Immortal Phoenix in both orientations** despite a 1-point Might gap
and Phoenix having the larger keyword. Printed Might (3 vs 4) does not reveal this;
role-conditional evaluation does.

---

## 5. Card-level evaluation

For each card, derived against the threat space:

### 5.1 Units

| Measure | Derivation | Tier |
|---|---|---|
| **Offensive reach** | Set of format units this kills when attacking | FACT |
| **Defensive hold** | Set of format units this survives when defending | FACT |
| **Kill threshold** | Damage needed to remove it (Might, +Shield while defending) | FACT |
| **Answerability** | Which format removal kills it | FACT |
| **Cost efficiency** | Might ÷ (energy + power), vs format median at that cost | FACT |
| **Tempo class** | Enters exhausted by default (CR 143.4); `Accelerate` enters ready | FACT |
| **Reach class** | Base-only vs `Ganking` (battlefield→battlefield) vs `Ambush` | FACT |
| **Mighty** | Might ≥ 5 (CR 708) — gates a real set of card effects | FACT |

### 5.2 Removal and interaction

| Measure | Derivation | Tier |
|---|---|---|
| **Answer coverage** | % of format units this kills, per cost bucket | FACT |
| **Timing class** | neither / `Action` (showdowns) / `Reaction` (closed states) | FACT |
| **Conditionality** | `Legion`, `Level N`, `Empowered` gates that must be live | FACT |

### 5.3 🔑 The answer-coverage curve — a worked format fact

Computed over all **472 distinct unit names**:

| Removal | Kills | Coverage | Cards printed at this value |
|---|---|---|---|
| Deal 1 | 29 | **6%** | 7 |
| Deal 2 | 90 | **19%** | 25 |
| Deal 3 | 198 | **42%** | 14 |
| Deal 4 | 300 | **64%** | 11 |
| Deal 5 | 375 | **79%** | 5 |
| Deal 6 | 431 | **91%** | 4 |
| Deal 7+ | 447+ | **95%+** | 3 |

> **Riftbound's removal is structurally shallow.** 39 of 56 damage cards deal only 2–3,
> answering 19–42% of the unit pool, while the **median unit is Might 4** and **36% of units
> are Mighty (≥5)**. A deck leaning on Deal-2 effects has a *provable* ceiling on what it can
> remove. This single curve turns "my removal feels bad" into a number with a citation.

---

## 6. Deck-level evaluation

### 6.1 What this deck does well

| Measure | Derivation | Tier |
|---|---|---|
| **Contest capacity by turn N** | Given the rune ceiling (2/turn, +1 if on the draw) and the curve, how many battlefields can be occupied by turn N | FACT |
| **Speed to first score** | Earliest turn a `CONQUEST` is deployable | FACT |
| **Speed to 8 points** | Shortest legal point path given contest capacity | FACT |
| **Offensive reach profile** | Distribution of format units the deck's units beat *when attacking* | FACT |
| **Defensive hold profile** | Same, *when defending* — reported separately (§4.3) | FACT |
| **Interaction density** | Count of `Action` / `Reaction` cards — can you act on their turn at all? | FACT |
| **Rune feasibility** | Existing flagship — P(paying cost C on turn T) given the split | PROBABILITY |
| **Resilience** | `Deathknell` value, `Flow` recursion, trash-replay effects | FACT |

**Official floors to check against** (from Riot's Deckbuilding Primer — see COMPENDIUM §VI.2):
- **9+ small units** at 2–4 cost
- **6+ interactive spells**
- Units prioritised over spells/gear

These are the only published baselines that exist. Forge should report deviation from them
as a **fact with attribution** — *"6 small units; Riot's primer recommends 9+"* — not as a
verdict.

### 6.2 Where it comes up short — the weakness finder

A weakness is a **coverage gap**: a threat class the deck provably cannot answer.

```
for each cost bucket c in threat_space:
    threats  = units the format fields at cost c in reachable identities
    answered = threats killable by (my removal) ∪ (my units, defending) ∪ (my units, attacking)
    gap[c]   = threats \ answered
```

Reported as, e.g.:

> ⚠️ **No answer to Might ≥ 6.** The format fields 41 such units across the identities you
> can face. Your highest removal is Deal 4 (64% coverage) and your largest unit is Might 5,
> which loses to all of them on defence. *(FACT — CR 465, answer-coverage curve.)*

**Weakness classes Forge computes:**

| Class | Question it answers |
|---|---|
| **Removal ceiling** | What is too big for you to kill? |
| **Board-wipe fragility** | What fraction of your units die to Deal-2 / Deal-3 sweeps? |
| **Tempo gap** | Turns where you can deploy nothing (curve holes vs rune ceiling) |
| **Interaction blindness** | Can you respond during a showdown at all, or only on your own turn? |
| **Contest shortfall** | Can you physically occupy enough battlefields to reach 8 points? |
| **Rune infeasibility** | Costs your split cannot reliably pay on curve |
| **Recursion vulnerability** | Opponents' `Flow` / trash-replay you cannot interact with |

### 6.3 Matchup evaluation — "good against / short against"

For each opposing Domain Identity (15 of them, all pools 258–268 names):

```
matchup(my_deck, opposing_identity):
    their_threats = legal units in that identity, bucketed by cost
    my_answers    = removal ∪ units(defending) ∪ units(attacking)
    → answer coverage per bucket
    → their answer coverage against MY units
    → tempo comparison: speed-to-first-score, both directions
```

Output shape:

> **vs Body/Fury** — you answer **78%** of their 3–4 cost threats but only **31%** of their
> 5+ threats; they answer **64%** of yours. They reach first score on turn 3, you on turn 4.
> *(FACT — derived from the legal pool, not from match results.)*

⚠️ **This is a statement about the card pool, not a win prediction.** Forge must label it as
such. It says what *can* be fielded and what *can* answer it — not what a piloted deck will
do.

---

## 7. Synergy — a producer/consumer graph, not a vibe

Mechanical synergy is derivable because Riftbound's dependent keywords declare their inputs.

| Consumer | Requires | Produced by |
|---|---|---|
| `Legion` (CR 812) | another card played this turn | any cheap card; low curve |
| `Level N` (CR 824) | N or more XP | `Hunt X` (CR 823) on conquer/hold |
| `Empowered` (CR 828) | the Empowered status | `Empower [Cost]` (CR 827) |
| `Weaponmaster` (CR 821) | an Equipment you control | cards with the `Equipment` tag |
| `Flow` (CR 829) | the spell in your trash | discard, `Burn`, self-mill |
| `Mighty` (CR 708) | Might ≥ 5 | buffs, `Assault`/`Shield` in role, Might-setting effects |
| Attack-triggers | gaining the Attacker designation | moving into an occupied battlefield |

Forge builds this graph from keyword extraction (**498 of 814 cards — 61% — carry at least
one machine-readable keyword**) and reports **unmet dependencies** as facts:

> ⚠️ **3 cards have `[Level 6]` abilities; your deck produces 2 XP maximum.** Those abilities
> are inactive in every reachable game state. *(FACT — CR 824.)*

That is a real, provable deckbuilding bug — and exactly the kind of thing a human misses.

---

## 8. What is NOT computed

Stated plainly, so nobody expects it later:

| Not computed | Why |
|---|---|
| **Win probability / matchup winrate** | Requires piloted-game data. Inaccessible (403) and statistically empty (n=1–3). Would be an ESTIMATE, which D-022 forbids |
| **Pilot sequencing and decision quality** | Not a property of the deck |
| **"Is this combo good"** | Mechanical *linkage* is derivable; *value* is judgment |
| **Deck power rating / grade** | D-016. Never |
| **Mulligan and draw-order decisions** | Belongs to play, not construction |
| **Bluffing, `Hidden` mind-games** | Information-theoretic, not mechanical |

> The engine's honesty rests on this list being enforced, not aspirational.

---

## 9. Implementation risk — the effect-parsing boundary

The combat maths is trivial. The risk is understanding *card text*.

**Measured over 814 distinct main-deck names:**

| Category | Count | Difficulty |
|---|---|---|
| Structured fields (might, energy, power, domain, type, tags) | 814 | ✅ Trivial — typed JSON |
| Keywords with values (`Assault N`, `Shield N`, `Level N`…) | 498 (61%) | ✅ Regex on `richText` — **already proven working** |
| No rules text at all | 8 | ✅ Free |
| **Free-text effects needing interpretation** | **~153 (19%)** | ⚠️ **The real work** |

The 153 breaks down as `Deal N` 56 · `Kill` 79 · `Stun` 25 (overlapping).

> 🔑 **Recommendation: hand-annotate, don't build a parser.** 153 cards is an afternoon of
> structured data entry, and it grows by roughly 30 per set. A general effect parser for a
> game with a 120-page rulebook is a multi-month project that would be wrong at the edges
> anyway. An annotation overlay keyed by card name is bounded, auditable, correctable, and
> versioned alongside the errata overlay Q10 already requires.

**Annotation schema (proposed):**

```yaml
- name: Void Seeker
  effects:
    - kind: damage        # damage | kill | stun | buff | move | draw | ...
      amount: 4
      target: unit
      zone: battlefield
      conditions: []
```

## 10. Test strategy

| Layer | Approach |
|---|---|
| **Duel resolver** | Exhaustive. Every combat outcome class (`CONQUEST`/`REPELLED`/`TRADE`/`STALL`) in both orientations; every damage-assignment constraint (Tank, Backline, no-overkill, lethal-first) as a named test |
| **Rulebook examples as fixtures** | CR 465.2.c.3–c.9 contain worked damage-assignment examples. **Encode every one as a test**, as LEGALITY.md does for deck rules |
| **Answer coverage** | Property tests: coverage must be monotonic in damage; bounded 0–100%; Deal N ≥ Deal N−1 |
| **Threat space** | Golden-file test against the 15 identity pools (258–268 names) so card-pool drift surfaces as a failure |
| **Effect annotations** | Schema validation + a completeness check that every card matching `Deal|Kill|Stun` has an annotation |
| **Claims** | Every emitted claim must carry a non-empty derivation and ≥1 citation. Enforced structurally, not by review |

## 11. Where this sits in the plan

This subsystem is **larger than SPIKE G (the generator)** and, unlike it, is **wanted** —
it is the stated reason the tool exists, second only to the collection itself.

**Proposed sequencing changes:**

1. **Stage 1 (interface) must now display claims**, not just statistics. A claim has a
   statement, a derivation and a citation — that is a different UI component from a stat
   tile, and it needs designing now rather than retrofitting.
2. **The duel resolver can be built and tested with zero UI**, against the cached card pool.
   It is pure logic with no dependencies — a natural, low-risk early Development task.
3. **The effect-annotation overlay should start early** and grow incrementally; it gates
   everything in §5.2 and §6.
4. **SPIKE G is further weakened.** A generator needs an objective function; this engine
   deliberately refuses to produce one. If the workbench can explain a deck's strengths and
   gaps precisely, the case for auto-generation weakens further.

## 12. Open questions

| # | Question | Blocks |
|---|---|---|
| **E1** | Does evaluation consider only the user's **owned** cards as the opponent pool, or the whole format? (Default: whole format — the opponent's collection is not ours to constrain) | §6.3 |
| **E2** | Battlefield abilities modify combat (e.g. *"units here have +1 Might"*). Does v1 model them, or evaluate on a neutral battlefield and flag the simplification? | §4.1 |
| **E3** | How are multi-unit boards enumerated? Full n-vs-m is combinatorial; 1v1 and "my board vs their board" may be sufficient for v1 | §4.2 |
| **E4** | Legend abilities are always-on and shape every combat. Do they enter the model in v1? | §4.1 |
| **E5** | Should claims be cached per (deck, format-version) or recomputed live? Affects the <2s target in DECK-STATS | §2 |
