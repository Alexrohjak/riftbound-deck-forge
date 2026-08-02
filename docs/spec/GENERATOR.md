# Generation — EE in the Propose Direction

> How Forge proposes decks. **Not a separate subsystem** — this is EE running in the
> *propose* direction rather than the *evaluate* direction, using the same rules engine,
> synergy graph, collection awareness and explanation layer.
>
> **Created:** 2026-08-02 (as a deferred spike) · **Rewritten:** 2026-08-02 —
> reinstated and fused with EE by [D-041](../DECISIONS.md#d-041) · **Step:** `S5`

**Related:** [`EVALUATION.md`](EVALUATION.md) (EE) · [`OVERVIEW.md`](OVERVIEW.md) ·
[`LEGALITY.md`](LEGALITY.md) · [`DATA-MODEL.md`](DATA-MODEL.md) ·
[`../reference/LEGEND-GUIDE.md`](../reference/LEGEND-GUIDE.md)

---

## 1. ⭐ The objective-function problem, resolved

The previous version of this document recorded a genuine blocker:

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

This is also what [D-008](../DECISIONS.md#d-008) originally asked for: *multi-factor and
conversational.*

---

## 2. The four generation modes

### 2.1 Seeded — *"build around these"*

**Input:** a Legend, a Champion unit, or any set of cards you want in the deck.

1. **Resolve the identity.** A Legend fixes it directly. An arbitrary card requires
   *reverse-solving*: which Legends can legally include it? ([LEGEND-GUIDE](../reference/LEGEND-GUIDE.md)
   gives all 49 pools). If several, offer the choice — this is a decision the user should make.
2. **Read the Legend's reward** from the Legend Guide, and prioritise cards that supply it.
3. **Fill from the collection**, respecting `BUILT` commitments
   ([DATA-MODEL §3](DATA-MODEL.md#3-commitment)).

⚠️ **Hardest case:** seeding on a card with no Legend constraint (e.g. a colourless gear).
The identity is then unconstrained and the tool must *ask* rather than guess.

### 2.2 Intent — *"aggressive"*, *"I want to hold battlefields"*

Playstyle is expressed **mechanically, never by archetype name**
([D-030](../DECISIONS.md#d-030)) — no external taxonomy is needed:

| Intent | Mechanical target |
|---|---|
| Aggressive | High share of ≤2-cost units · `Assault` · early Might · short speed-to-first-score |
| Defensive / holding | `Tank`, `Shield`, `Backline` · Hold-triggered payoffs · high Might-per-cost at 3+ |
| Go-wide | Unit count · token production · per-unit payoffs |
| Reactive | `Action`/`Reaction` share · `Deflect` · `Hidden` |
| Value / grind | Draw, recursion, `Deathknell`, trash payoffs |

⚠️ **`Hold` vs `Conquer` is the intent that matters most.** They are opposite decks
(LEGEND-GUIDE §5), and getting the direction wrong silently halves a build.

### 2.3 ⭐ Counter — *"I keep losing to this deck, what beats it"*

**The mode that most justifies the fusion** — it is EE's threat analysis run backwards, and
it cannot be built without EE.

1. Take the opposing deck (entered by the user) or its Legend (→ the threat space of that
   identity, per [D-038](../DECISIONS.md#d-038))
2. Compute **what actually beats it**: units that win the duel in both orientations, removal
   that clears its key threats (⚠️ **`Kill` vs `Damage`** — see
   [CARD-KNOWLEDGE §2](../reference/CARD-KNOWLEDGE.md)), and cheap interaction that flips its
   combats
3. Filter to **cards you own**
4. Propose builds, and — importantly — say when the answer is **not a new deck**:
   *"you already have this covered; the problem is your battlefield choice"* or *"three
   sideboard swaps fix this matchup"*

### 2.4 Open — *"give me ideas"*

Propose **several distinct directions** the collection genuinely supports, each with a
one-line reason. Distinctness is measured by identity, curve shape and Legend reward — not by
a diversity score.

---

## 3. Constraints every mode obeys

| Constraint | Source |
|---|---|
| **Legal** — all 33 checks | [LEGALITY.md](LEGALITY.md) |
| **Owned** — only cards in the collection | [D-013](../DECISIONS.md#d-013) |
| **Uncommitted** — never propose cards held by a `BUILT` deck | [D-026](../DECISIONS.md#d-026) |
| **Negative constraints** — *"not this card"*, *"not this strategy"* | Original vision |
| **Multiple candidates, never one answer** | [D-008](../DECISIONS.md#d-008) |
| **Explained** — every proposal carries EE's normal reasoning | [D-039](../DECISIONS.md#d-039) |

### ⭐ Failure is a feature

If the collection cannot produce a legal deck, the correct output is **gap analysis**, never
"no results":

> *"You have 34 of 40. The gaps are: 2 more 2-drops in Calm, a second removal spell, and
> 4 more Calm runes. The closest you can get today is this 38-card list plus two off-plan
> cards."*

This was `K2` in the old kill-conditions list. It is now the **designed failure mode** — and
it is arguably the most valuable output for a collection-constrained player.

---

## 4. Search strategy

| Approach | Assessment |
|---|---|
| Exhaustive enumeration | ❌ Combinatorially impossible |
| **Skeleton fill** | 🟢 **Primary.** Start from a curve/role template implied by the intent, fill with owned cards ranked by Legend fit and synergy tags |
| **Local search** | 🟢 **For refinement.** Swap single cards, re-evaluate. This is the interactive loop |
| Constraint satisfaction (CSP/ILP) | 🟡 Legality maps cleanly to hard constraints; worth it only if skeleton-fill proves inadequate |

**The search space is small.** You own ~200–300 unique names, not 935 — and Domain Identity
cuts that further. This is a far more tractable problem than general deckbuilding.

> **The interactive loop *is* the product.** Reject a card, say why, re-derive. One-shot
> generation was explicitly not what was asked for.

---

## 5. What generation must not become

| Never | Why |
|---|---|
| A single "best deck" answer | [D-016](../DECISIONS.md#d-016) — and it removes the tinkering that is the point |
| A ranked list with scores | Same. Candidates are *distinct*, not *ordered* |
| A black box | Every proposal explains itself, or it is not shippable |
| A replacement for building by hand | ⚠️ Audit finding **A9** stands: the goal is to *enjoy hours of building*. Generation must **add** to that loop — suggestions while you build, answers when stuck — not shortcut it |

## 6. Open questions

| # | Question |
|---|---|
| **G1** | How many candidates is useful? Three feels right; more becomes a wall |
| **G2** | When seeding on a card with no identity constraint, how does the tool ask rather than guess? |
| **G3** | For counter-mode, does the user enter a full decklist, or just a Legend + a few cards they keep losing to? The latter is far less work and probably enough |
| **G4** | Does generation propose battlefields too? It should — they are a third of a registered deck and [asymmetry decides them](../reference/BATTLEFIELD-GUIDE.md) |
| **G5** | Should suggestions appear *live* while hand-building, or only on request? Live risks nagging ([D-017](../DECISIONS.md#d-017) worried about the same thing) |
