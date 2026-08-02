# The Riftbound Compendium

> Everything known about Riftbound, gathered in one place and cited to source.
> Built by reading the official rulebooks line by line, analysing all 1,180 card
> printings as data, and sweeping the public web.
>
> **Compiled:** 2026-08-02 · **Rules version:** Core Rules + Tournament Rules 2026-07-16 ·
> **Card data:** official gallery, `buildId` `HqBIi6LT2t74XpTktxUAo`
>
> **Authority order:** Core Rules PDF → Tournament Rules PDF → official Riot articles →
> card data → community. Where these disagree, the higher one wins and the disagreement
> is recorded rather than silently resolved.

**Related:** [`DATA-SOURCES.md`](DATA-SOURCES.md) (where data comes from) ·
[`../spec/LEGALITY.md`](../spec/LEGALITY.md) (what the validator enforces)

⚠️ **This document corrects several errors in the existing reference docs.**
See [Part VII](#part-vii--corrections-to-existing-forge-docs) for the list.

---

## Contents

| Part | Contents |
|---|---|
| [I](#part-i--orientation) | Orientation — what kind of game this is |
| [II](#part-ii--deck-construction-the-legality-critical-part) | **Deck construction** — every rule that gates legality |
| [III](#part-iii--how-the-game-is-played) | Turn structure, resources, combat, scoring — **and [§8, how games actually flow](#8-how-games-actually-flow)** |
| [IV](#part-iv--the-complete-keyword-glossary) | **All 25 keywords**, cited |
| [V](#part-v--the-card-universe-as-data) | The card universe measured as data |
| [VI](#part-vi--strategy-archetypes-and-the-competitive-landscape) | Strategy, archetypes, meta, ban list |
| [VII](#part-vii--corrections-to-existing-forge-docs) | **Corrections + new legality checks for Forge** |
| [VIII](#part-viii--maintenance) | Maintenance obligations |

---

# Part I — Orientation

**Riftbound: League of Legends Trading Card Game.** Riot Games, released 31 October 2025.
Game director Dave Guskin (previously Legends of Runeterra). English publisher UVS Games.

Riftbound is a **territory game, not a life-total game.** There is no player life total.
You win by accumulating **8 points** (CR 194.3), scored by taking and keeping
**Battlefields**.

Two consequences shape everything:

1. **You need bodies.** Points come from having units standing on locations. A deck that
   cannot physically occupy battlefields cannot win, regardless of card quality. Riot's
   own primer says *"prioritize units over spells/gear for board presence."*
2. **Resources are a two-axis system with a built-in tension.** Runes produce either
   Energy (by exhausting, rune stays) or Power (by recycling, rune leaves the board).
   Paying Power literally costs you board presence. See [§III.3](#3-resources--the-central-tension).

### The five sets

| Code | Set | Released |
|---|---|---|
| `OGN` | Origins | 31 Oct 2025 |
| `OGS` | Origins supplemental (in Proving Grounds) | — |
| `SFD` | Spiritforged | — |
| `UNL` | Unleashed | — |
| `VEN` | Vendetta | 31 July 2026 |

All five are Standard-legal (TR 601.3.c).

---

# Part II — Deck construction (the legality-critical part)

This is the part Forge must get exactly right. Everything here is cited.

## 1. What a deck is

A deck is **four separate things** (CR 103):

| Component | Casual (CR) | **Competition (TR)** | Citation |
|---|---|---|---|
| Champion Legend | exactly 1 | exactly 1 | CR 103.1 |
| Main Deck | **≥40** | **exactly 40** | CR 103.2 / TR 402.1, 601.1.b |
| — Chosen Champion | 1, counted **inside** the 40 | same | CR 103.2.a |
| Rune Deck | exactly 12 | exactly 12 | CR 103.3 |
| Battlefields | per Mode of Play | **exactly 3, unique names** | CR 103.4 / TR 402.1 |
| Sideboard | n/a | **≤10** | TR 601.1.c.1 |

> **TR 402.1 is the single most quotable line for Forge:**
> *"In a constructed event, players must register a Main Deck of exactly 40 cards
> (including a chosen champion), 1 Legend, 12 runes, and exactly 3 battlefields each with
> a unique name."*

⚠️ **Register 3 battlefields, play 1.** In 1v1 each player *brings* three battlefields but
only **one of each player's** is used per game — **2 on the board total** (CR 485.4, 486.4).
Deckbuilding validates 3; the board shows 2.

## 2. Domain Identity — CR 103.1.b

The Champion Legend's domains define the deck's **Domain Identity**. Then:

- A **single-domain** card is legal if that domain is in the identity (103.1.b.3)
- A **multi-domain** card is legal only if **all** its domains are in the identity (103.1.b.4)
- **Rune Deck cards must also comply** (CR 103.3.a.1)
- Effects that add cards irrespective of domain make those cards count **as** part of the
  identity (103.1.b.5)

✅ **Every Champion Legend carries exactly 2 domains** — verified across all 118 legend
printings. And **all 15 possible domain pairs exist** (C(6,2) = 15), so Domain Identity
space is completely covered.

**Colorless cards are legal in every identity.** All 66 battlefields are colorless, so
Domain Identity never constrains battlefield choice in practice — a useful simplification.

## 3. Copy limits — CR 103.2.b

- **Up to 3 copies of the same *named* card**
- **Includes the Chosen Champion** — Volibear, Furious as Chosen Champion *plus 2 more
  copies* in the Main Deck is legal (103.2.b.1)
- ⚠️ **"Cards have different names even if they represent the same character"** (103.2.b.2).
  `3× Yasuo, Remorseful` **and** `3× Yasuo, Windrider` is legal — 6 Yasuos.
- Name = `"[Short Name], [Subtitle]"` (CR 132.4). Kai'Sa, Evolutionary ≠ Kai'Sa, Survivor.
- **Language is irrelevant** — the same card in English and Chinese is the same name (CR 132.3)
- Limits span **Main Deck + sideboard combined** (TR 601.1.c.3, 403.3)

## 4. ⚠️ Unique — CR 825 — **THE MISSING RULE**

**`Unique` is a keyword that overrides the 3-copy limit.**

> CR 825.3.a — *"A deck can contain only one card of a given name if the card has Unique."*
>
> CR 825.3.b — *"If a card is a Signature card and is also Unique, then that deck can
> contain any combination of three Signature cards, but still only one of each named
> Unique card."*

Unique is a **Deck Constraint Permission** (825.1) with **no gameplay effect** (825.4) —
it exists purely to constrain deckbuilding.

**Exactly 3 cards in the game currently have it**, and all three are the same case:

| Card | Code | Type | Domains | Tags |
|---|---|---|---|---|
| Forgefire Cape | `SFD-190/221` | Gear | Calm/Mind | Ornn, Equipment |
| Rabadon's Deathcrown | `SFD-191/221` | Gear | Calm/Mind | Ornn, Equipment |
| Shurelya's Requiem | `SFD-192/221` | Gear | Calm/Mind | Ornn, Equipment |

All three are **Signature + Unique + Equipment gear tagged Ornn**. So an Ornn deck
(Fire Below the Mountain, Calm/Mind) may run **all three — one copy each** — which exactly
fills the 3-Signature allowance. It may **not** run 2 copies of any of them.

> This rule appears in **no community guide** and is **not in Forge's LEGALITY.md**.
> It is the second rule found only by reading the PDF directly — the first was Signature
> cards. Risk LR2 in `PLAN.md` is confirmed as real.

## 5. Chosen Champion — CR 103.2.a

- Must be a **champion unit** whose **champion tag matches the Legend's tag**
- *Rulebook example:* Loose Cannon has tag `Jinx`, so Jinx, Rebel or Jinx, Demolitionist qualify
- ⚠️ **Signature units are ineligible.** Tibbers has tag `Annie` but is a *signature* unit,
  not a champion unit — it cannot be the Chosen Champion even under an Annie Legend
  (103.2.a.2). Confirmed in data: **0 of 51 signature cards carry the champion supertype.**
- Signature cards **cannot occupy the Champion Zone** at all (103.2.d.3)
- In play, **any Champion Unit sharing the name** also counts as Chosen Champion (103.2.a.3)

✅ **Every legend champion tag has at least 2 distinct champion units available**, so a
legal Chosen Champion always exists. Distribution: 47 tags have 2 options, 6 have 3, 2 have 4.

### ⚠️ Champion tags vs ordinary tags — a data trap

CR 133.8.b: *"Tags used to link Legends, Champion Units, and Signature cards are known as
**Champion Tags**."* CR 133.8.a: *"Tags have no innate rules meaning."*

So a card's `tags` list mixes **champion tags** (Kennen, Ahri, Darius) with **species,
region and functional tags** (Yordle, Ionia, Equipment). **Only the champion tag gates the
Chosen Champion and Signature rules.** The gallery does **not** distinguish them — it
serves one flat list.

**One Legend in the entire game carries two tags:** `Heart of the Tempest` has
`['Yordle', 'Kennen']`. 116 of 118 legend printings carry exactly one. Its champion tag is
**Kennen**; Yordle is a species tag.

> 🔴 **This is a live bug risk.** Matching the Chosen Champion against *any* Legend tag
> would let Heart of the Tempest run **13** Yordle champion units — Teemo, Poppy, Vex,
> Fizz, Rumble, Heimerdinger — as its Chosen Champion. The correct pool is **2**:
> Kennen, Keeper of Balance and Kennen, Storm of Shuriken.

**Reliable derivation.** CR 103.2.d.2 requires every Signature card to carry the champion
tag of its Champion Legend. So:

> **A Legend's champion tag is the tag its Signature cards carry.**

Verified: this resolves **118 / 118** legend printings uniquely, with zero ambiguity.
(Kennen's signature `Lightning Rush` is tagged `['Kennen']` only; no signature card
anywhere carries `Yordle`.) Equivalently, the 76 tags that never appear on a Signature card
— Yordle, Ionia, Poro, Equipment, Recruit … — are provably **not** champion tags.

## 6. ⚠️ Signature cards — CR 103.2.d

- **3 Signature cards total, regardless of name** (103.2.d.1)
- All must carry the **Champion tag matching the Champion Legend** (103.2.d.2)
- They are **not** Champion units and **cannot** enter the Champion Zone (103.2.d.3)

A **separate, additional** limit from the 3-copies-per-name rule. Three *different*
Signature cards already exhausts the allowance.

**Measured:** 51 signature printings, 51 distinct names, **all 2-domain**, all tagged,
split 43 spells / 5 gear / 3 units.

## 7. Card legality — TR 601.2

- Legal if from a format-legal set **or sharing a name with a card from one** (601.2.a)
- Reprints numbered outside a set's normal range don't gain legality from it (601.2.c)
- **Banned cards excluded** (601.2.d)
- Low-OPL exception: an **exact** preconstructed configuration may use its banned cards.
  **Any** change or added sideboard voids this (601.2.d.2)

> 🔑 **Because 601.2.a grants legality by *name*, format legality collapses to a name
> lookup.** This is what makes the 128 out-of-range printings harmless — see
> [§V.6](#6-collector-numbers-and-variants).

## 8. Sideboarding — TR 403 / 601.1.c

- Exchanges are **1-for-1** with Main Deck cards (403.4)
- Deck size rules must still hold afterwards (403.4.c)
- Sideboard may contain **only valid Main Deck cards** (601.1.c.2)
- ⚠️ The **Chosen Champion may be swapped** for one matching the Legend whenever
  sideboarding is allowed (601.1.c.4, 403.4.a)
- 🔒 **Runes, Legend and Battlefields may NEVER change after registration** (403.4.b)
- None before game 1 (403.5); none after a draw (403.10)

## 9. Limited formats (out of Forge's scope, recorded for completeness)

Sealed and Draft change the rules substantially (TR 602.4):

| | Sealed | Draft |
|---|---|---|
| Pool | 6 packs | 3 packs (39 cards) |
| Main deck min | 25 | 20 |
| Domain Identity | **any three domains** | **any three domains** |
| Copy limits | **none** | **none** |
| `Unique` | **does not apply** | **does not apply** |
| Legend/Chosen Champion | **optional** (draw 1 extra if absent) | **optional** |

Forge validates **tournament constructed only** ([D-032](../DECISIONS.md#d-032)), so these
are non-goals — but note that "no copy limits" and "Unique doesn't apply" mean a limited
mode would need a genuinely different validator, not a relaxed one.

---

# Part III — How the game is played

## 1. Setup — CR 110–118

1. Legend → Legend Zone; Chosen Champion → Champion Zone
2. Battlefields set aside per Mode of Play
3. Shuffle Main and Rune decks **separately**
4. Determine turn order
5. **Each player draws 4** (CR 116)
6. **Mulligan:** set aside up to 2 cards, draw that many, then **recycle** the set-aside
   cards to the bottom of the deck (CR 117)

> ⚠️ **Opening hand is 4 cards, not 7.** Every opening-hand probability Forge computes
> depends on this. The mulligan is a *bottom-and-replace*, not a full redraw — so mulliganed
> cards remain in the deck.

## 2. Turn structure — CR 315–317

| Phase | What happens |
|---|---|
| **Awaken** | Ready all your game objects (CR 315.1) |
| **Beginning** | *Beginning Step* → start-of-phase effects; *Scoring Step* → **Hold** all controlled Battlefields (CR 315.2) |
| **Channel** | Channel **2 runes** (CR 315.3) |
| **Draw** | Draw 1 (CR 315.4) |
| **Main** | Rune Pool empties, then unstructured play (CR 316) |
| **Ending** | End-of-turn effects; heal all units; "this turn" effects expire; Rune Pool empties (CR 317) |

**First turn:** in 1v1 the player going **second channels an extra rune** on their first
Channel Phase (CR 485.7, 486.7). In FFA/2v2 the player going first skips their first draw.

## 3. Resources — the central tension

Runes live in a **separate 12-card Rune Deck**. A Rune is **not** a Main Deck card and
**not** a Permanent (CR 161.1).

**Every Basic Rune has exactly two abilities** (CR 164.2):

| Ability | Cost | Produces |
|---|---|---|
| `[E]: [Reaction] — Add [1]` | Exhaust it | **1 Energy** — generic, no domain |
| `Recycle this: [Reaction] — Add [C]` | Recycle it to the Rune Deck | **1 Power** of that rune's domain |

Both are `[Reaction]` — activatable **any time resources must be paid**, even outside
priority (CR 429.3, 444.2.c).

### 🔑 A rune can produce BOTH — exhaust it, *then* recycle it

These are **two separate abilities with two separate costs**, and nothing restricts a rune
to one of them. Verified against the rules:

- Exhausting requires the rune be **ready** — an exhausted object cannot be exhausted again
  (CR 414.1.b)
- Recycling has **no ready/exhausted requirement** — it simply moves the card to the bottom
  of the Rune Deck (CR 416.1.b)
- **No rule anywhere forbids using both abilities of the same rune**

> **So one ready rune yields `1 Energy` + `1 Power`** — exhaust for the Energy, then recycle
> the now-exhausted rune for the Power. The rune leaves the board, but you got both.

⚠️ **This is not an either/or choice, and modelling it as one understates a deck's real
resource ceiling.** The genuine trade-off is *"keep this rune on the board as a recurring
Energy source"* versus *"cash it out now for Energy **and** Power."* Rune feasibility
(D-023) must model the exhaust-then-recycle line or it will report decks as unable to pay
costs they can actually pay.

*Found by reading a community worked example of a real turn (Seal of Rage → Noxian
Guillotine), then verified against CR 164/414/416. It is not stated explicitly anywhere in
the rulebook — it falls out of two abilities and an absent restriction.*

**Resource ceiling** (cumulative, assuming no recycling):

| Turn | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Runes on board | 2 | 4 | 6 | 8 | 10 | **12 — deck empty** |

> ⚠️ **The Rune Pool empties at the start of each Main Phase and at end of turn** (CR 167,
> 316.3, 317.2.d). Unspent Energy and Power are **lost**. There is no floating between turns.

**Domain shorthands** (CR 134.2):

| Domain | Colour | Shorthand |
|---|---|---|
| Fury | red | `[R]` |
| Calm | green | `[G]` |
| Mind | blue | `[B]` |
| Body | orange | `[O]` |
| Chaos | purple | `[P]` |
| Order | yellow | `[Y]` |

Plus: `[A]` = Power of **any** domain (rainbow) · `[C]` = Power of **this card's** domain ·
`[E]` = exhaust · `[M]` = Might.

⚠️ **Shorthand changed.** CR 135.2.e.2–3 note that `[E]` was previously `[T]` and `[M]` was
previously `[S]`. The card gallery's accessibility text still uses the **old** `[S]`/`[T]`
on 475 cards. See [§V.7](#7-three-different-text-encodings).

## 4. Combat — CR 459–466

A Combat occurs when units of **exactly two** players occupy the same Battlefield
(CR 462). Three steps:

**Step 1 — Combat Showdown.** Attacker = the player who applied Contested status. Both
sides get priority windows; only `[Action]` and `[Reaction]` cards can be played.

**Step 2 — Combat Damage.** Sum each side's Might. Starting with the Attacker, each
assigns damage equal to their summed Might among the other's units, subject to:
- **Lethal damage must be assigned in full before moving to the next unit** (465.2.c.3)
- **No overkill** — you may not assign more than lethal unless no units remain (465.2.c.4)
- **`Tank` must be assigned first; `Backline` must be assigned last** (815, 826)
- Damage is **assigned** first and **dealt** simultaneously afterwards (465.2.c.1)

**Step 3 — Resolution.** Combat Cleanup heals all units and — critically —
**recalls Attackers if Defenders are still present** (466.1.a.2). The surviving side
establishes control; that's a **Conquer** if they hadn't yet scored it this turn.

> A **tie** is when both players still have units at the battlefield during combat cleanup
> step 3d (CR 740.3.a). Attackers are recalled and nobody takes the battlefield.

## 5. Scoring — CR 467–472

Two ways to score (CR 469):

- **Conquer** — gain control of a Battlefield you haven't yet scored this turn
- **Hold** — maintain control during your Beginning Phase, on a Battlefield you haven't
  yet scored this turn

**You may only score once per Battlefield per turn** (CR 470).

### ⚠️ The Final Point rule — CR 471.1.b

This is subtler than usually described:

> When a player tries to gain a point **through a Conquer** while at **1 point below the
> Victory Score or higher**:
> - If they have **scored every Battlefield this turn** → they gain the Final Point.
> - If not → **they draw a card instead.**

And crucially (471.1.a.1): **points gained from sources that are not Conquer are not
subject to this restriction.** So the 8th point *can* come from a Hold, from a card effect
(e.g. Ahri, Alluring), or from an opponent's Burn Out — only **Conquer** is gated.

Other ways to gain points (CR 194.1): holding, conquering, spell/ability effects, and an
opponent **Burning Out** (they choose an opponent to gain 1 point).

**Burn Out** (CR 431): when you must draw from an empty Main Deck, you recycle your trash
into your deck, an opponent gains 1 point, then you complete the draw. With an empty trash
this **loops**, handing out a point each time until someone wins — and those points
**cannot be prevented** (431.3.b).

## 6. Timing — the four states

The turn is always in one of four states (CR 310):

| | **Open** (no chain) | **Closed** (chain exists) |
|---|---|---|
| **Neutral** (no combat) | Normal play — turn player only | Only `[Reaction]` |
| **Showdown** (combat/showdown) | Only `[Action]` / `[Reaction]` | Only `[Reaction]` |

**Priority** is the right to act; **Focus** is the Showdown-specific permission. A player
with Focus also gains Priority (313.2). Chains resolve via **HOT FEPR** — Handle
Outstanding Tasks, then Finalize, Execute, Pass, Resolve (CR 334).

Units and Gear, and abilities that `Add` resources, **resolve immediately on finalization**
rather than waiting on the chain (CR 337.2, 400.2).

## 7. Subsystems the existing docs don't cover

### XP and Level — CR 728–733, 824
- **XP** is a per-player resource, publicly tracked, unlimited, **not shared** between allies
- `Hunt X` grants X XP when a unit **Conquers or Holds** (CR 823)
- `Level N` is a **dependent keyword**: the attached ability is active only while you have
  **N or more XP** (824.1.b.1). Levels seen in the card pool: **3, 6, 11, 16**
- XP is spent by some effects (e.g. "pay 2 XP")

### Empower / Empowered — CR 441, 442, 827, 828
The **tentpole mechanic of Vendetta** (per Riot's patch notes).
- `Empower [Cost]` is an **activated ability** that gives its own source the Empowered
  status; usable only if not already Empowered (827.1.c.1)
- `Empowered` is a **dependent keyword** — its ability is live while the source has the status
- Empowered is a **binary, persistent** status; `Disempower` removes it
- Applies to **units, gear and legends**

### Buffs — CR 701–705
- A Buff is a **counter**, worth **+1 Might** each
- **Maximum one Buff per unit** (702.3) unless an effect grants permission
- Buffs are **not targetable** (704.1) and are lost when the unit leaves play

### Mighty — CR 706–711
A unit **is Mighty** while its Might is **5 or greater**. It **becomes Mighty** at the
moment Might crosses from <5 to ≥5. Units in non-board zones use **printed** Might.

### Attachment / Equipment — CR 716–719, 818–819
- Attaching makes one card **Attached** and another the **Top-Most Card**
- The Attached card's **printed Rules Text goes Inactive**; its **Effect Text** is appended
  to the Top-Most Card, and its **Might Bonus** modifies that card's Might
- `Equip [Cost]` attaches; `Quick-Draw` grants Reaction timing; `Weaponmaster` lets a unit
  attach an Equipment at a discount as it enters

### Layers — CR 473–480
Effects apply in three layers, repeatedly until stable:
1. **Trait-Altering** (name, supertype, type, tags, controller, cost, domain, Might *assignment*, copies)
2. **Ability-Altering** (keywords, passives, appended/removed text)
3. **Arithmetic** (Might, Energy cost, Power cost — **increases first, then decreases**)

Ties within a layer resolve by **Dependency**, then by **Timestamp**.

---

## 8. How games actually flow

> ⚠️ **This section is different in kind from the rest of Part III.** Everything above is
> *what the rules say*. This is *what the rules produce* — patterns that only become
> visible from worked examples of real turns. Each item is marked **verified** (traced back
> to the PDF) or **community** (plausible, unverified).

### 8.1 ⭐ Defend triggers resolve BEFORE attack triggers — **verified**

Two rules combine into a fact that almost nobody states directly:

| Rule | Says |
|---|---|
| CR 464.2.e.1 | *"The Attacking player… places Triggered Abilities on the Chain **first**, followed by all non-Defender players in Turn Order, followed by the **Defending Player**."* |
| CR 340.1 | *"The **newest** Finalized Chain Item resolves."* — the chain is **LIFO** |

> **Therefore: the attacker's triggers go on first and so resolve LAST. The defender's go on
> last and resolve FIRST.**

This inverts the intuition that attacking gives initiative. In practice the defender's
`When I defend…` abilities fire *before* the attacker's `When I attack…` abilities — so a
defensive trigger can remove, shrink or relocate the attacker before its attack trigger
ever resolves.

**Consequence for EE:** any combat evaluation that resolves attack triggers first is
computing the wrong game.

### 8.2 The shape of a game — point pacing — **community**

Two scoring rhythms fall out of the Final Point rule (CR 471.1.b):

| Shape | Pace | Wins by |
|---|---|---|
| **Conqueror** | 2 → 4 → 6 | Taking **both** battlefields in one turn (6 → 8). Every battlefield scored that turn satisfies the Final Point restriction |
| **Holder** | Grinds to 7 | **Holding** — Hold is exempt from the Final Point restriction (CR 471.1.a.1), so it simply wins on the next Beginning Phase |

⚠️ **The non-obvious corollary:** a Conqueror sitting on 6 gains little from scoring a
single 7th point. At 7 a lone Conquer no longer scores — it draws a card instead — so the
deck still needs the double-conquer turn it needed at 6. Resources spent going 6 → 7 buy
nothing toward the actual win condition.

This gives a concrete model of game length: **conqueror games end around turns 4–6**;
holder games run longer and trail on the scoreboard by design.

### 8.3 Resource sequencing is a real skill — **verified**

A worked line from a real turn, with 4 runes available (3 Fury):

1. **Exhaust** a Fury rune → `+1 Energy`
2. **Recycle** that same rune → `+1 Fury Power` *(see §3 — both abilities, one rune)*
3. Play **Seal of Rage** (gear, 1 Fury Power); it enters **ready**
4. Activate Seal's `[Reaction]` → `+1 Fury Power`
5. **Exhaust** the remaining 3 runes → `+3 Energy`
6. Play **Noxian Guillotine** (4 Energy + 1 Power)
7. It is the **second Main Deck card** played this turn → **`Legion` is live** → kill a unit

**The insight:** the order you touch resources in determines what you can cast. This is not
flavour — it is the difference between a turn working and not working, and it is invisible
from a card list.

### 8.4 Sequencing traps that decide games

| Trap | Why it bites | Source |
|---|---|---|
| **`Legion` counts *any* Main Deck card** — including 0-cost gear | Cheap gear turns on Legion for free. Sequence it first | **verified** — CR 812.1.b.1 |
| **Rune Pool empties at the start of Main Phase and end of turn** | Resources generated in the Beginning/Channel phases are **gone** before you act. Never "bank" | **verified** — CR 167, 316.3 |
| **Damage clears at *two* separate moments** | End of **combat** (CR 466.1.a.1) *and* end of **turn** (CR 317.2.b). Cleanups in between do **not** clear it | **verified** |
| **Units enter exhausted** | A unit played this turn cannot Standard Move this turn. Playing at a battlefield and moving to one are very different tempo operations | **verified** — CR 143.4 |
| **A stalled attack recalls your units** | `STALL` sends attackers home and leaves the defender holding (CR 466.1.a.2). Attacking without lethal is worse than not attacking | **verified** |
| **Hidden cards die if you lose the battlefield** | Facedown cards at a battlefield you no longer control are trashed in the next cleanup (CR 107.3.d) | **verified** |

### 8.5 What the first two turns look like — **community**

From a beginner walkthrough, matching the rules:

- **T1 first player:** channel 2, draw (hand 5), play a unit, Standard Move it to a
  battlefield (exhausting it). A non-combat Showdown opens; both pass. Battlefield taken,
  uncontested.
- **T1 second player:** channel **3** (CR 485.7), play a unit, take the other battlefield.
- **T2 first player:** Awaken readies the unit; **Beginning scores 1 point** for the held
  battlefield; channel 2; draw; play a second unit and move it into the opponent's
  battlefield → **Combat**.

> The rhythm: **turn 1 claims, turn 2 starts scoring and contesting.** Points begin
> compounding immediately, which is why a slow first two turns is expensive.

---

# Part IV — The complete keyword glossary

**There are 25 keywords** (CR 804–829). The existing `GAME-RULES.md` lists 8, one of which
(`conquer`) is not a keyword at all.

| # | Keyword | CR | Kind | Meaning |
|---|---|---|---|---|
| 1 | **Accelerate** | 805 | Optional additional cost | *"As you play me, you may pay `[1][C]` as an additional cost. If you do, I enter ready."* |
| 2 | **Action** | 806 | Permissive | May be played during Showdowns, on any player's turn |
| 3 | **Ambush** | 822 | Passive | May be played to a battlefield where you control units; gains Reaction while doing so |
| 4 | **Assault X** | 807 | Passive | +X Might **while attacking**. X defaults to 1. Multiple instances **sum** |
| 5 | **Backline** | 826 | Passive | Must be assigned combat damage **last** |
| 6 | **Deathknell** | 808 | Triggered | *"When I die, [Effect]."* Each instance triggers separately |
| 7 | **Deflect X** | 809 | Passive | Opponents' spells/abilities targeting this cost **X more Power** per targeting. Power may be **any** domain. Instances **sum** |
| 8 | **Empower [Cost]** | 827 | Activated | Pay cost → this becomes Empowered. Only if not already |
| 9 | **Empowered** | 828 | Dependent | Ability active while this has the Empowered status |
| 10 | **Equip [Cost]** | 818 | Activated | Attach this Equipment to a unit you control |
| 11 | **Flow [Cost]** | 829 | Passive | Play this spell **from your trash** for the Flow cost, then **banish** it |
| 12 | **Ganking** | 810 | Passive | May Standard Move **battlefield → battlefield** |
| 13 | **Hidden** | 811 | Enabler | Pay `[A]` to hide facedown at a battlefield you control; from the next turn it gains Reaction and may be played **ignoring its base cost** |
| 14 | **Hunt X** | 823 | Triggered | *"When I Conquer or Hold, my controller gains X XP."* Instances **sum** |
| 15 | **Legion** | 812 | Dependent | Ability active **if you've played another card this turn**. One card satisfies **all** Legion instances |
| 16 | **Level N** | 824 | Dependent | Ability active while you have **N or more XP** |
| 17 | **Quick-Draw** | 819 | Triggered + permissive | Has Reaction; *"When you play this, attach it to a unit you control"* |
| 18 | **Reaction** | 813 | Permissive | Everything Action grants, **plus** playable during Closed States |
| 19 | **Repeat [Cost]** | 820 | Optional additional cost | Pay to execute the spell/ability's instructions **one additional time**. Choices may differ per execution |
| 20 | **Shield X** | 814 | Passive | +X Might **while defending**. X defaults to 1. Instances **sum** |
| 21 | **Tank** | 815 | Passive | Must be assigned lethal combat damage **first** |
| 22 | **Temporary** | 816 | Triggered | *"At the start of this permanent's controller's Beginning Phase, before scoring, kill this."* |
| 23 | **Unique** | 825 | **Deck constraint** | **Only one copy of this name per deck.** No gameplay effect |
| 24 | **Vision** | 817 | Triggered | *"When this is played, Predict."* Instances trigger separately |
| 25 | **Weaponmaster** | 821 | Triggered | On play, may pay an Equipment's Equip cost **reduced by `[A]`** to attach it, ignoring normal Equip timing |

### Keyword usage frequency in the card pool

Measured by counting bracket tokens across all 1,180 cards' rules text:

| Keyword | Instances | | Keyword | Instances |
|---|---|---|---|---|
| Reaction | 130 | | Weaponmaster | 20 |
| Action | 98 | | Flow | 18 |
| Empowered | 68 | | Legion | 15 |
| Hidden | 61 | | Vision | 15 |
| Deflect (all X) | 73 | | Hunt (all X) | 16 |
| Equip | 55 | | Level (all N) | 30 |
| Ganking | 54 | | Quick-Draw | 6 |
| Empower | 51 | | Backline | 6 |
| Accelerate | 41 | | **Unique** | **3** |
| Temporary | 35 | | Assault (all X) | 58 |
| Tank | 32 | | Shield (all X) | 36 |
| Deathknell | 29 | | Ambush | 23 |
| Repeat | 24 | | | |

**Game actions** also appear bracketed in card text but are **not keywords**:
`[Add]` 48 · `[Stun]` 18 · `[Buff]` 12 · `[Predict]` 9 · `[Burn N]` 9 · `[Mighty]` 14.
A parser must not confuse these with keywords.

`[>]` (rendered `&gt;`) marks a **dependent/permissive keyword's attached ability**
(CR 135.2.e.7); `[>>]` marks a second-level one. 113 and 3 instances respectively.

---

# Part V — The card universe as data

All figures measured directly from the official gallery on 2026-08-02.

## 1. Headline counts

| Measure | Count |
|---|---|
| Total printings | **1,180** |
| **Distinct names** (what copy limits count) | **935** |
| Main-deck-eligible printings | 978 |
| **Main-deck-eligible distinct names** | **814** |

| Set | Printings | Distinct names |
|---|---|---|
| OGN Origins | 352 | 298 |
| SFD Spiritforged | 288 | 235 |
| UNL Unleashed | 288 | 233 |
| VEN Vendetta | 228 | 189 |
| OGS Origins supplemental | 24 | 24 |

## 2. By type and supertype

| Type | Printings | | Supertype | Printings |
|---|---|---|---|---|
| Unit | 629 | | champion | 303 |
| Spell | 233 | | signature | 51 |
| Legend | 118 | | basic (runes) | 18 |
| Gear | 114 | | token | 14 |
| Battlefield | 66 | | | |
| Rune | 18 | | | |

⚠️ **Two data/rules mismatches worth knowing:**
- CR 133.7.a says **Champion is a supertype applying exclusively to units**, but the data
  marks **9 legends** with the champion supertype (294 of 303 are units).
- Vendetta patch notes say **"Token is now an intrinsic property, not a supertype"**, yet
  the gallery still serves `token` as a supertype on 14 cards.

Treat the **rulebook** as authoritative and the data as lagging.

## 3. Domains

| Domain | Cards | | Domains per card | Cards |
|---|---|---|---|---|
| Order | 216 | | 1 domain | 1,011 |
| Mind | 213 | | **2 domains** | **169** |
| Body | 213 | | | |
| Calm | 211 | | | |
| Fury | 210 | | | |
| Chaos | 208 | | | |
| Colorless | 78 | | | |

Remarkably even — no domain is materially larger than another.

## 4. The Legends — 118 printings, **49 distinct names**

> ⚠️ **The repo's "118 Legends" is a printing count.** There are only **49 distinct Champion
> Legends**, one per champion tag. This is the number that matters for deckbuilding.

All 118 carry **exactly 2 domains**, and **all 15 possible pairs are represented**:

| Pair | Printings | | Pair | Printings | | Pair | Printings |
|---|---|---|---|---|---|---|---|
| body/order | 11 | | calm/mind | 10 | | fury/mind | 8 |
| chaos/fury | 11 | | calm/order | 10 | | fury/order | 8 |
| body/fury | 10 | | mind/order | 9 | | body/mind | 2 |
| chaos/mind | 10 | | body/calm | 9 | | calm/fury | 2 |
| body/chaos | 8 | | calm/chaos | 8 | | chaos/order | 2 |

### Complete Legend roster

| Legend | Domains | Champion tag |
|---|---|---|
| Bashful Bloom | calm/mind | Lillia |
| Battle Mistress | body/chaos | Sivir |
| Blade Dancer | calm/chaos | Irelia |
| Blind Monk | body/calm | Lee Sin |
| Bloodharbor Ripper | chaos/fury | Pyke |
| Bounty Hunter | body/chaos | Miss Fortune |
| Butcher of the Sands | body/fury | Renekton |
| Chem-Baroness | mind/order | Renata Glasc |
| Curator of the Sands | calm/mind | Nasus |
| Dark Child – Starter | chaos/fury | Annie |
| Daughter of the Void | fury/mind | Kai'Sa |
| Deceiver | mind/order | LeBlanc |
| Defender of Tomorrow | body/mind | Jayce |
| Emperor of the Sands | calm/order | Azir |
| Eye of Twilight | calm/order | Shen |
| Fire Below the Mountain | calm/mind | Ornn |
| Gloomist | calm/chaos | Vex |
| Glorious Executioner | chaos/fury | Draven |
| Grand Duelist | body/order | Fiora |
| Grandmaster at Arms | body/calm | Jax |
| Green Father | calm/order | Ivern |
| Hand of Noxus | fury/order | Darius |
| **Heart of the Tempest** | chaos/order | **Kennen** (card also carries the species tag `Yordle`) |
| Herald of the Arcane | mind/order | Viktor |
| Keeper of the Hammer | body/order | Poppy |
| Lady of Luminosity – Starter | mind/order | Lux |
| Loose Cannon | chaos/fury | Jinx |
| Master of Shadows | chaos/fury | Zed |
| Matriarch of War | body/order | Ambessa |
| Mechanized Menace | fury/mind | Rumble |
| Might of Demacia – Starter | body/order | Garen |
| Nine-Tailed Fox | calm/mind | Ahri |
| Piltover Enforcer | fury/order | Vi |
| Pridestalker | body/fury | Rengar |
| Prodigal Explorer | chaos/mind | Ezreal |
| Purifier | body/fury | Lucian |
| Radiant Dawn | calm/order | Leona |
| Relentless Storm | body/fury | Volibear |
| Rogue Assassin | calm/fury | Akali |
| Scorn of the Moon | chaos/mind | Diana |
| Soul's Reflection | chaos/mind | Mel |
| Swift Scout | chaos/mind | Teemo |
| The Boss | body/order | Sett |
| Unforgiven | calm/chaos | Yasuo |
| Virtuoso | fury/mind | Jhin |
| Void Burrower | fury/order | Rek'Sai |
| Voidreaver | body/chaos | Kha'Zix |
| Wuju Bladesman – Starter | body/calm | Master Yi |
| Wuju Master | body/calm | Master Yi |

Note **Master Yi has two Legends** (both body/calm). `Master Yi, Wuju Bladesman` is
**banned in 2v2**.

## 5. 🔑 Legal card pool per Domain Identity

Computed by counting **distinct main-deck card names legal in each identity**, with banned
cards excluded:

| Identity | Legal names | dual-domain | signature |
|---|---|---|---|
| body/order | **268** | 5 | 5 |
| calm/order | 266 | 4 | 4 |
| fury/order | 265 | 3 | 3 |
| mind/order | 265 | 4 | 4 |
| fury/body | 264 | 4 | 4 |
| calm/mind | 264 | 6 | 6 |
| calm/body | 264 | 4 | 4 |
| fury/mind | 261 | 3 | 3 |
| fury/calm | 260 | 1 | 1 |
| fury/chaos | 260 | 5 | 5 |
| mind/body | 260 | 1 | 1 |
| body/chaos | 259 | 3 | 3 |
| chaos/order | 259 | 1 | 1 |
| calm/chaos | 258 | 3 | 3 |
| mind/chaos | **258** | 4 | 4 |

**Range 258–268, mean 262.** Every identity also gets the same **9 colorless** names.

> **This is a genuinely useful finding for Forge.** The legal pool is *almost perfectly
> flat* across identities — a 4% spread. No Domain Identity is card-starved. What
> differentiates identities is not pool size but the **1–6 dual-domain cards** and the
> **signature cards**, which are the only truly identity-exclusive cards. It also means a
> collection-constrained deckbuilder should never reject an identity for "not enough cards."

## 6. Collector numbers and variants

**17 distinct `publicCode` forms** — collection entry (D-013) must parse all of them:

| Form | Count | Meaning |
|---|---|---|
| `OGN-N/N` etc. | 996 | Standard |
| `XXX-Na/N` | 102 | `a` variant (alt art) |
| `XXX-N*/N` | 36 | `*` variant |
| `OGS-N/N` | 24 | Supplemental |
| `UNL-TN`, `SFD-TN`, `VEN-TN` | 10 | **Tokens** |
| `VEN-RN` | 6 | **Runes** (no `/N` denominator) |
| `VEN-SPN/N` | 6 | Special |

**179 names have more than one printing**; the maximum is **5** (Ahri, Inquisitive;
Irelia, Fervent; Sett, Brawler).

### ⚠️ 128 printings have collector numbers *exceeding their set size*

e.g. `OGN-299/298`, `VEN-174/166`. By set: SFD 42, VEN 31, UNL 31, OGN 24. By rarity:
showcase 66, rare 48, epic 8, common 6.

TR 601.2.c says these are **not automatically legal** in that set's standard format. But
TR 601.2.a grants legality to anything **sharing a name** with a format-legal card — and
every one of these 128 is a reprint of an in-range card.

> 🔑 **Conclusion: legality is a function of NAME, not printing.** Forge should resolve
> format legality on the collapsed-by-name unit and never on the printing. This makes the
> out-of-range population a non-issue, and confirms the DATA-MODEL's split between the
> *ownership unit* (printing) and the *legality unit* (name).

## 7. Three different text encodings

The same card text exists in three forms — Forge must pick one deliberately:

| Source | Encoding | Example |
|---|---|---|
| `text.richText.body` | HTML + `:rb_*:` symbol tokens | `+1 :rb_might: buff` |
| `cardImage.accessibilityText` | Plain text, **old** `[S]`/`[T]` shorthand | `+1 [S] buff` |
| Current rulebook | **New** `[M]`/`[E]` shorthand | `+1 [M]` |

**475 cards** carry the deprecated `[S]`/`[T]` in accessibility text. `richText` never uses
either bracket form — it uses **19 distinct symbol tokens**:

`:rb_might:` 426 · `:rb_rune_rainbow:` 233 (= `[A]`) · `:rb_energy_0..12:` 384 total ·
`:rb_exhaust:` 139 · `:rb_rune_{fury,body,order,calm,mind,chaos}:` 239 total

> **Recommendation:** render from `richText` and map the `:rb_*:` tokens to your own icon
> set. Do **not** use accessibility text as a data source — it encodes deprecated shorthand.

## 8. Curves — for deck statistics

**Energy cost** (main-deck cards, 978 printings):

| Energy | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | none |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cards | 13 | 59 | 199 | 201 | 185 | 139 | 94 | 29 | 24 | 5 | 12 | 6 | 12 |

**Power cost:** 1 → 392 · 2 → 72 · 3 → 16 · 4 → 4 · **none → 494**

> 🔑 **Roughly half of all main-deck cards have no Power cost at all**, and of those that
> do, **81% need only 1 Power**. This bounds the rune-feasibility problem sharply: the
> question is rarely "can I make 3 Fury?" but "can I make 1 Fury on curve?"

**Might** (629 units): peaks at 4 (161) and 3 (135), then 5 (96), 6 (78), 2 (76).
Median unit is Might 4. Note **Mighty is Might ≥ 5**, so 226 of 629 units (36%) are
natively Mighty.

**Total cost** (energy + power) peaks at 3 (182), 4 (162), 5 (153), 2 (157).

## 9. Battlefields and Runes

**66 battlefields, 66 distinct names, all colorless, all landscape orientation** — the only
landscape cards in the game. Because they're all colorless, Domain Identity never restricts
them (CR 103.4.b's "if applicable" never applies).

**18 rune printings, 6 distinct names** — one Basic Rune per domain, printed in OGN
(base + `a` variant) and VEN (`R01`–`R06`). The VEN runes have literal `[NO TEXT]` in their
rules text field, a data quirk.

## 10. Tags — 127 distinct

The rulebook's canonical list (CR 763.1) names ~110; the data carries **127**. Top tags:

| Tag | Cards | | Tag | Cards |
|---|---|---|---|---|
| Ionia | 107 | | Zaun | 32 |
| Noxus | 60 | | Piltover | 31 |
| Yordle | 48 | | The Void | 24 |
| Bilgewater | 46 | | Poro | 20 |
| Demacia | 45 | | Dragon | 20 |
| Shurima | 40 | | Fae | 19 |
| Mount Targon | 40 | | Mech | 18 |
| **Equipment** | 40 | | Dog | 18 |
| Bandle City | 38 | | Pirate | 17 |
| Shadow Isles | 36 | | Cat | 16 |
| Freljord | 35 | | Spirit | 16 |

Tags mix **regions** (Ionia, Noxus), **champions** (Ahri, Vi), **species** (Yordle, Poro,
Dragon) and **functional** tags (Equipment, Recruit, Elite). Only champion tags have rules
meaning, and only via the Chosen Champion / Signature rules — CR 133.8.a: *"Tags have no
innate rules meaning."*

---

# Part VI — Strategy, archetypes and the competitive landscape

## 1. Official domain philosophies

From Riot's **Deckbuilding Primer** — this is official, not community folklore:

| Domain | Colour | Identity |
|---|---|---|
| **Fury** | red | Aggression and conquest via **damage-based removal** |
| **Calm** | green | Defence and negation through **counterspells and stuns** |
| **Mind** | blue | **Card draw** and long-term planning |
| **Body** | orange | **Resource ramp** and efficient units |
| **Chaos** | purple | Unpredictability and **trash manipulation** |
| **Order** | yellow | **Token generation** and unit-death synergies |

## 2. 🔑 Official deckbuilding ratios

Also from the Primer — **this supersedes the "community, unverified" heuristic** currently
recorded in `GAME-RULES.md §8`:

> - **"Play 9+ small units"** in the 2–4 cost range, for reliable early battlefield presence
> - **"Play 6+ interactive spells"** for combat support and disruption
> - **Prioritise units over spells and gear** for board presence
> - **Reserve 3 slots** for your champion's signature cards
> - **Rune split: "Generally a good start is a 6-6 split across your two domains, and tweak
>   it as you play."** Skew toward the heavier domain (e.g. 8-4) when power costs are lopsided
> - **Battlefields:** pick three by asking which support your strategy, which would hurt you
>   in an opponent's hands, and which give a slight edge

**Forge's flagship rune-feasibility statistic should be positioned as replacing the 6-6
default with a computed answer** — but note the 6-6 default is *Riot's own advice*, so
Forge is improving on official guidance, not correcting community error.

## 3. The three archetypes

Riftbound's community and Riot's own framing converge on three:

| Archetype | Plan | Domain lean |
|---|---|---|
| **Aggro** | Conquer battlefields fast, overwhelm before stabilisation. Low curve, wide board | Fury; Jinx (Loose Cannon) |
| **Control** | Grind points by **holding** over time; deny space and outlast. Higher curve | Mind/Order; Viktor (Herald of the Arcane) |
| **Combo** | Build toward turns that swing multiple points at once. Trades consistency for explosiveness | Chaos/Order |
| *Midrange* | Balanced curve, flexible response | Ahri (Nine-Tailed Fox) is the archetypal flexible legend |

Legends like **Darius** and **Ahri** support multiple archetypes depending on curve —
which is precisely why an archetype→card mapping cannot be derived from card data.

> ⚠️ **Archetype→card mapping exists in no API and no official source.** This confirms the
> position in [`../spec/GENERATOR.md §5`](../spec/GENERATOR.md): define playstyle
> *mechanically* (by curve, unit count, power demands) rather than by archetype name.

## 4. Structural strategy notes derived from the rules

These follow from the rules rather than from community opinion, so they're durable:

- **Attackers get recalled on a tie** (CR 466.1.a.2). Attacking into an equal board is
  strictly worse than defending it — the defender keeps the battlefield. This creates a
  real defender's advantage and explains why `Shield` (defence) and `Assault` (attack) are
  balanced differently.
- **You can only score a battlefield once per turn** (CR 470), so overwhelming force at one
  location has sharply diminishing returns. Spreading across battlefields scales; stacking
  does not.
- **The Final Point cannot be taken by a partial Conquer** (CR 471.1.b). A player at 7
  points must either **Hold**, score **every** battlefield that turn, or find a non-Conquer
  point source. Defending at 7 is far stronger than it looks.
- **Recycling Power removes a rune from the board** (CR 164.2.b), so Power-heavy decks have
  structurally *lower* Energy ceilings than Energy-heavy decks from the same 12 runes. This
  is the single most under-appreciated deckbuilding constraint, and the one Forge's
  flagship statistic addresses.
- **Units enter exhausted** (CR 143.4) unless Accelerated. A unit played this turn cannot
  Standard Move this turn — so "playing a unit at a battlefield" and "moving a unit to a
  battlefield" are very different tempo operations.
- **Burn Out gives your opponent points** (CR 431.2.c), and repeated burnout **cannot be
  prevented**. Deck depth is a real resource in a 40-card deck that draws every turn.

## 5. The ban list — official, from Riot's Rules Hub

**Last updated 2026-07-16.** Source: [Rules Hub](https://playriftbound.com/en-us/rules-hub/).

### Constructed (1v1)

| Banned Cards | Banned Battlefields |
|---|---|
| Called Shot | The Arena's Greatest |
| Draven, Vanquisher | Aspirant's Climb |
| Fight or Flight | Dreaming Tree |
| Scrapheap | Obelisk of Power |
| Stealthy Pursuer | Reaver's Row |

### 2v2 Constructed

Same 5 cards and 5 battlefields, **plus a banned Legend: `Master Yi, Wuju Bladesman`.**

> ⚠️ **Community ban lists are unreliable.** Aggregator sites variously reported "8 banned
> cards", merged battlefields into the card list, or omitted the battlefield bans entirely.
> Only the Rules Hub is correct. This is a second, independent confirmation of
> [D-020](../DECISIONS.md#d-020) — *the rulebook is the only authority.*

> ⚠️ **`Dreaming Tree` does not appear in the official card gallery.** Nine of the ten
> banned names resolve against gallery data; this one does not. Cause unknown — it may be
> from a product the gallery doesn't serve. **Ban-list ingestion must not assume every
> banned name resolves to a card** (see Q10).

**Low-OPL precon exception** (TR 601.2.d.2): an *exact* preconstructed deck may use its
banned cards. The rulebook's own example is the **Jinx Champion Deck** containing
`Fight or Flight`, `Scrapheap` and `Reaver's Row`. Any change or added sideboard voids it.

## 6. The meta — and why it may not matter for Forge

**As of early August 2026** (community-sourced, low confidence):

- **Irelia, Blade Dancer** leads with roughly **10% metashare**, followed by
  **Kennen, Heart of the Tempest** and **Master Yi, Wuju Bladesman**
- **Diana** was widely expected to continue dictating the environment post-Vendetta
- Vendetta legends are only beginning to place; **Azir** won a notable early event
  (NovaRiftbound TCGArena Online $2K Showdown #3)

### 🔑 The sample-size problem — a new finding

Riftools reports, for the current set: **7 tournaments, 250 legal decklists, 325 total
games.** Its "top performers" are built on samples like **3 decks** and, in one case,
**1 deck** (Master Yi, Wuju Master — "100% top 25%", n=1).

> **This resolves the volume discrepancy flagged in `DATA-SOURCES.md`.** Riftools' figures
> are **scoped to the current set only**; RiftDecks' 194,271 decks are **all-time across
> all sets**. Neither is stale — they measure different things.
>
> **And it strengthens audit finding A8 considerably.** Meta data for a freshly-released
> set isn't merely hard to access — it is *statistically empty*. A Tier 3 "meta strength"
> statistic built on n=1 to n=3 would be actively misleading, which is exactly what
> [D-022](../DECISIONS.md#d-022)'s honesty principle forbids. **The case for omitting
> Tier 3 is now evidential, not just philosophical.**

### Access status (unchanged, re-verified 2026-08-02)

| Source | Status |
|---|---|
| **RiftDecks** | 🔴 403 Forbidden. `robots.txt` explicitly forbids competing-service scraping |
| **riftbound.gg** | 🔴 403 Forbidden |
| **Riftools** | 🟢 Fetchable. Self-describes data as *"incomplete, delayed, or corrected over time"* |
| **Piltover Archive** | 🟡 Crawlable, but `/api/` disallowed |

[D-010](../DECISIONS.md#d-010) — **no scraping** — remains non-negotiable and is now also
the practically enforced state.

## 7. Errata — the shape of the problem

Errata are published per set as **web articles plus PDFs** on the Rules Hub. The **Vendetta
errata (2026-07-23)** covers cards from SFD, UNL and VEN together — so errata are **not
scoped to their own set.**

| Card | Set | Change |
|---|---|---|
| Draven, Vanquisher | SFD | Templating |
| Emperor's Dais | SFD | Templating |
| Fizz, Trickster | SFD | Templating |
| Diana, Lunari | UNL | Templating |
| Stalking Wolf | UNL | Templating (Ambush clarification) |
| Astral Heron | VEN | Templating |
| Gangplank, Naval | VEN | Templating |
| **Resonating Strike** | VEN | ⚠️ **FUNCTIONAL** — Reaction timing expanded |

**7 of 8 are templating-only; 1 is functional.** The documents are human-readable prose
with old/new text labelled — **not machine-readable**, and there is no errata API.

> **This is the answer to Q10.** Errata ingestion cannot be automated from an API. The
> realistic approach is a **small, hand-maintained overlay file** keyed by card name,
> refreshed when Riot publishes — which is rare (once per set) and small (single digits of
> cards). The ban list is likewise a **hand-maintained list of 10 names**. Neither justifies
> a pipeline.

## 8. Vendetta rules changes (2026-07-24) — for the record

New mechanics: **Empower/Empowered/Disempower** (the set's tentpole), **Flow**, **Burn**,
**Skip**. Notable clarifications: resource payments are optional; signature cards need
domain-matching Power (not any Power); **"Token" became an intrinsic property rather than a
supertype**; damage-modifying replacement effects now apply at **assignment** rather than
resolution; best-of-5 battlefield reuse permitted.

**No changes to deck construction, sideboard size, or Standard legality.**

---

# Part VII — Corrections to existing Forge docs

## Corrections required

| # | Doc | Current text | Correct position |
|---|---|---|---|
| C1 | `GAME-RULES.md §7` | 8 keywords, including "conquer" | **25 keywords**; `conquer` is a scoring action, not a keyword. See [Part IV](#part-iv--the-complete-keyword-glossary) |
| C2 | `GAME-RULES.md §8` | 6-6 rune split is *"community, unverified"* | It is **official Riot guidance** in the Deckbuilding Primer |
| C3 | `GAME-RULES.md §6` | Battlefields *"count by Mode of Play (3 in 1v1)"* | **Register exactly 3 with unique names**; only **1 per player** is used in play (2 on board) |
| C4 | `DATA-SOURCES.md`, `PLAN.md` | "118 Legends" | 118 **printings**, **49 distinct Legends** |
| C5 | `GAME-RULES.md §1` | 8th point *"must come from holding, or conquering all Battlefields"* | Precisely: **only Conquer is restricted**. Hold, card effects and Burn-Out points are exempt (CR 471.1.a.1) |
| C6 | `DATA-SOURCES.md` | Riftools/RiftDecks volume discrepancy "unresolved" | **Resolved** — Riftools is current-set-scoped, RiftDecks is all-time |
| C7 | `DATA-SOURCES.md` | `tags.tags[]` implied to be objects | It is a **plain list of strings** |
| C8 | — | Opening hand size unrecorded | **4 cards**, mulligan up to 2 by bottom-and-replace |
| C9 | this doc, v1 | *"A Legend can carry more than one champion tag"* | **Wrong.** Only one Legend carries two *tags*, and only one of them (`Kennen`) is a **champion tag**; `Yordle` is a species tag. Corrected in [§II.5](#5-chosen-champion--cr-1032a) — thanks to a physical-card check |
| C10 | this doc, v1 · `DECK-STATS.md` | Rune abilities presented as an **either/or**: exhaust for Energy *or* recycle for Power | **Wrong.** They are two abilities with two costs and **no rule forbids using both**. One ready rune yields `1 Energy` **+** `1 Power` (exhaust, then recycle). Understating this makes rune feasibility report decks as unable to pay costs they can pay. See [§III.3](#3-resources--the-central-tension) |

## New legality checks required

✅ **All six were added to [`LEGALITY.md`](../spec/LEGALITY.md) on 2026-08-02**, taking it
from 27 checks to 33. Recorded here as the derivation:

| New | Check | Citation |
|---|---|---|
| **L28** | **Unique**: at most **1 copy** of any card whose text contains `[Unique]`, across Main Deck + sideboard. Currently affects Forgefire Cape, Rabadon's Deathcrown, Shurelya's Requiem | CR 825.3.a |
| **L29** | **Unique + Signature interaction**: the 3-Signature allowance is unaffected by Unique, but each Unique name is still capped at 1 | CR 825.3.b |
| **L30** | **Battlefield count is exactly 3 with 3 distinct names** — not "per Mode of Play" | TR 402.1 |
| **L31** | **Banned battlefields** are a separate list from banned cards. 5 of each | Rules Hub |
| **L32** | **Match the champion tag, not any tag.** The gallery's `tags` list mixes champion tags with species/region tags and does not distinguish them. Derive the champion tag as *the tag carried by the Legend's Signature cards* (118/118 unique). Matching any tag would wrongly allow 13 Yordle champions under Heart of the Tempest instead of 2 Kennen ones | CR 133.8.b, 103.2.d.2 |
| **L33** | Runes must be **Basic Runes of the Domain Identity**; only 6 distinct rune names exist | CR 103.3.a.1, 164.1 |

## Design implications

0. ⭐ **Resolve defend triggers before attack triggers.** CR 464.2.e.1 + CR 340.1 (LIFO) mean
   the attacker's triggers go on the chain first and therefore resolve **last**. An engine
   that fires attack triggers first is simulating a different game. See
   [§III.8.1](#81--defend-triggers-resolve-before-attack-triggers--verified).
1. **Resolve legality by name, never by printing.** TR 601.2.a makes name the legality unit;
   this neutralises all 128 out-of-range printings and all 179 multi-printing names.
   Confirms `DATA-MODEL.md §2`.
2. **Battlefield validation is trivial.** All 66 are colorless, so only three things matter:
   exactly 3, distinct names, not banned. No domain check needed.
3. **Don't reject a Domain Identity for pool size.** All 15 identities have 258–268 legal
   names. If a collection can't build in an identity, that's a *collection* fact, not a
   *format* fact — and Forge should say so.
4. **Render card text from `richText`, not accessibility text.** The latter uses deprecated
   `[S]`/`[T]` shorthand on 475 cards. Map the 19 `:rb_*:` tokens to your own icons.
5. **Parse collector numbers for all 17 code forms** — including `VEN-R01` (no denominator)
   and `UNL-T1` (tokens). Collection entry keyed on collector number (D-013) will hit these.
6. **Opening-hand statistics use a 4-card hand** with a bottom-and-replace mulligan — the
   mulliganed cards stay in the deck, so it is *not* a simple "draw 4 from 40".
7. **Power demand is shallow.** ~50% of main-deck cards need no Power; 81% of the rest need
   exactly 1. Rune feasibility should optimise for *"1 Power of the right domain, on curve"*.
8. **Errata and ban list are hand-maintained overlays**, not pipelines. ~10 banned names,
   ~8 errata per set, published as prose. Q10 is answerable with a small YAML/JSON file.

---

# Part VIII — Maintenance

Riftbound changes on four independent clocks. Each needs a different response.

| Clock | Cadence | What breaks | Response |
|---|---|---|---|
| **New sets** | ~quarterly (Vendetta 31 Jul 2026) | Card pool, Standard legality | Re-fetch gallery; refresh `buildId` |
| **Errata** | Per set, ~8 cards, mostly templating | Card text; occasionally function | Hand-maintained overlay keyed by name |
| **Rules updates** | With sets + patches | Legality, keywords, timing | **Re-read the changed sections of the PDF**, never summaries |
| **Ban list** | **Independent of sets** — changed 31 Mar, 24 Jul 2026 | Deck legality | Hand-maintained list of ~10 names |

**The `buildId` changes on every site deploy.** Always read it from the gallery page:

```
GET https://playriftbound.com/en-us/card-gallery/          → read "buildId"
GET https://playriftbound.com/_next/data/{buildId}/en-us/card-gallery.json
```

`robots.txt` is `Allow: /` with no exclusions. One request, ~3.2 MB, every card.

### Rebuilding this document's data

Every number in Part V is reproducible from `gallery.json` alone. The analysis used only
Python stdlib — no dependencies.

---

## Sources

**Official (authoritative)**
- [Core Rules PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/e9ac8e3d33e0f78cef296f5945aba7bc1313b086.pdf) — 2026-07-16, 120pp — read in full
- [Tournament Rules PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/503da65669ced10598d62925a6f6bc15111af726.pdf) — 2026-07-16, 50pp — read in full
- [Rules Hub](https://playriftbound.com/en-us/rules-hub/) — ban lists, errata, patch notes
- [Deckbuilding Primer](https://playriftbound.com/en-us/news/rules-and-releases/deckbuilding-primer/) — official ratios
- [Vendetta Errata](https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/) — 2026-07-23
- [Core Rules: Vendetta Patch Notes](https://playriftbound.com/en-us/news/announcements/core-rules-vendetta-patch-notes/) — 2026-07-24
- Official card gallery — 1,180 printings

**Community (low confidence, meta only)**
- [Riftools](https://www.riftools.app/) — fetchable; self-describes data as incomplete
- [RiftDecks](https://riftdecks.com/) · [riftbound.gg](https://riftbound.gg/) — both 403
- [Mobalytics Riftbound](https://mobalytics.gg/riftbound/) · [Fextralife wiki](https://riftbound.wiki.fextralife.com/)
- [Wikipedia](https://en.wikipedia.org/wiki/Riftbound)
