# Card Knowledge — Interactions, Patterns and Sequences

> Built by reading every card in release order and cross-referencing against the rulebook.
> **This is EE's design input.** It records what the cards *do together* — the sequences,
> locks, engines and rule-benders that no card list shows.
>
> **Started:** 2026-08-02 · **Method:** read set by set (Origins → Spiritforged → Unleashed
> → Vendetta), verifying every mechanical claim against the Core Rules PDF.

**Related:** [`COMPENDIUM.md`](COMPENDIUM.md) (rules + card universe) ·
[`../spec/EVALUATION.md`](../spec/EVALUATION.md) (EE) ·
[`../spec/DECK-STATS.md`](../spec/DECK-STATS.md)

---

## How to read this

| Marker | Meaning |
|---|---|
| ✅ **verified** | Traced to a specific Core/Tournament Rules citation |
| 🔎 **derived** | Follows from cards + rules by reasoning; not stated anywhere |
| ⚠️ **impacts spec** | Changes something already written in another Forge document |

---

# Part 1 — The resource economy is three-sided, not two

⚠️ **impacts spec** — `DECK-STATS.md` §2, the rune-feasibility flagship.

Everything written so far models resources as **rune → Energy or Power**. The card pool
adds a third source that changes the maths.

## 1.1 The Seals — Power without spending your board

**Origins prints one Seal per domain** (`Seal of Rage` Fury, `Seal of Focus` Calm,
`Seal of Insight` Mind, `Seal of Strength` Body, `Seal of Discord` Chaos,
`Seal of Unity` Order). Each is **gear costing `0E1P`**:

> `[E]: [Reaction] — Add [that domain's Power]`

| Source | Yields | Board cost |
|---|---|---|
| Exhaust a rune | 1 Energy | none — rune stays (exhausted) |
| Recycle a rune | 1 Power | ⚠️ **rune leaves the board** |
| **Exhaust a Seal** | **1 Power** | ✅ **none — the Seal stays** |

🔎 **derived — this is the answer to Riftbound's central tension.** Power normally costs
board presence; a Seal converts an exhaust into Power *every turn* without touching the
rune base. Riot's own Deckbuilding Primer hints at it (*"include Seal cards for domains
requiring repeated power recycling"*) without explaining why it matters.

**Consequence for rune feasibility:** a deck running 2–3 Seals has a fundamentally different
Power curve from its rune split alone. **A model that ignores Seals will report decks as
unable to pay costs they can comfortably pay.** Also note `Energy Conduit` (3E, Mind) does
the same for Energy at Reaction speed.

## 1.2 Ready runes are your interaction currency ✅ verified

- The Rune **Pool** empties at start of Main Phase and end of turn (CR 167) — Energy/Power
  never persist
- But only the **Turn Player** readies during Awaken (CR 315.1.b) — so a rune's *ready
  state* persists into the opponent's turn

🔎 **derived:** **if you tap out on your turn, you have zero interaction until your next
Awaken.** Holding ready runes is how you threaten `[Reaction]` cards. This is never stated
in the rulebook and it is one of the most important skills in the game.

**Cards that exploit it:** `Sona, Harmonious` (*ready 4 friendly runes at end of your
turn*), `Dark Child - Starter` legend (*ready 2 runes*), `Targon's Peak` battlefield
(*ready 2 runes at the end of this turn*), `Ekko, Recurrent` (*Deathknell — recycle me to
ready your runes*).

> A deck with `Sona` on board effectively plays with **4 extra mana on the opponent's
> turn**. EE must treat that as an interaction-density multiplier, not a rune-count stat.

## 1.3 Resource generation cannot be countered ✅ verified

CR 429.2.a — *"Priority and Focus will not pass from Add abilities being finalized or
resolving."* Every Seal, `Energy Conduit`, `Lux, Crownguard`, `Malzahar, Fanatic`,
`Daughter of the Void` and `Hand of Noxus` says so in reminder text.

🔎 **derived:** you can never be mana-screwed *by interaction*. Denial in Riftbound must
attack cards or board, never resources.

---

# Part 2 — Kill vs Damage: two different removal economies

⚠️ **impacts spec** — `EVALUATION.md` §5.3's answer-coverage curve measured **damage only**.

| | Cards | Dominant domains | Coverage |
|---|---|---|---|
| **Damage** (`Deal N`) | 56 | **Fury 30**, Mind 18 | Capped by Might — Deal 3 kills 42% of units |
| **Kill** (`Kill a unit`) | 57 | **Order 31**, Mind 10 | ✅ **100% — ignores Might entirely** |

🔎 **derived: Order answers big units; Fury answers small ones.** A 12-Might
`Volibear, Imposing` shrugs off every burn spell in the game but dies to a `4E2P Vengeance`.
This is the single most important removal fact in the format, and the coverage curve alone
actively misrepresents it.

**EE must report removal as two separate coverages**, never one number.

## 2.1 The base is a partial safe zone 🔎 derived

Most cheap removal reads *"a unit **at a battlefield**"* — a targeting restriction (CR
355.9.b). Units in **base** are not legal targets. Confirmed by the rulebook's own
`Void Seeker` example: moving the target to base makes the spell mistarget (CR 359.3.e.5).

- **53** removal cards are battlefield-restricted
- **59** can reach anywhere, including base

**So retreating dodges roughly half the removal in the format** — which is why `Flash`,
`Retreat`, `Fight or Flight` and `The Syren` exist. `Unchecked Power` (*deal 12 to ALL
units at battlefields*) is a one-sided wipe if your own board sits in base.

---

# Part 3 — Origins (OGN + OGS): the base game

**13 keywords debut here** — Accelerate, Action, Assault, Deathknell, Deflect, Ganking,
Hidden, Legion, Reaction, Shield, Tank, Temporary, Vision. Everything later is an addition
to this spine.

**Only 8 of 153 units are vanilla.** Combat is almost never pure Might vs Might.

## 3.1 Domain identities, as the cards actually play

| Domain | Identity | Signature tools |
|---|---|---|
| **Fury** | Direct damage, aggression | `Hextech Ray` 3 · `Void Seeker` 4 · `Firestorm` 3-to-all · `Icathian Rain` 2×6 · `Cleave` (Assault 3) |
| **Calm** | Counters, protection, defensive Might | `Wind Wall` (counter anything) · `Defy` (counter ≤4E) · `Mystic Reversal` (**steal a spell**) · `Block` (Shield 3 + Tank) · `Highlander` |
| **Mind** | Draw, Might reduction, big finishers | `Stupefy` −1 · `Smoke Screen` −4 · `Progress Day` (draw 4) · `Unchecked Power` (12 to all) · `Time Warp` |
| **Body** | Ramp, readying, fight effects | `Mobilize`/`Catalyst of Aeons` (channel) · `Confront` (units enter ready) · `Challenge` (fight) · `Primal Strength` +7 |
| **Chaos** | Bounce, trash recursion, disruption | `Gust`/`Rebuke` (bounce) · `Morbid Return`/`The Harrowing` (trash) · `Possession` (**steal a unit**) · `Flash` |
| **Order** | Kill effects, tokens, mass pump | `Vengeance`/`Blast of Power` (kill) · `Recruit the Vanguard` (4 tokens) · `Grand Strategem` (+5 to all) · `Imperial Decree` |

## 3.2 Lock pieces — cards that delete the interaction layer

🔎 **derived — these invalidate refutation analysis entirely and EE must special-case them.**

| Card | Effect |
|---|---|
| **`Brynhir Thundersong`** 6E M5 | *"When you play me, opponents can't play cards this turn."* **Total lockout** — every subsequent play that turn is uncounterable and every combat resolves at face value |
| **`Mageseeker Warden`** 6E1P M5 | *"Opponents can only play units to their base"* + *"spells and abilities can't ready enemy units and gear."* Shuts off flash-blockers and untap tricks |
| **`Noxus Saboteur`** 3E M3 | *"Your opponents' `[Hidden]` cards can't be revealed here"* — disables facedown threats at that battlefield |
| **`Decree of Rage`** (Fury) | *"This can't be countered"* |

## 3.3 Engines and loops

| Engine | How it works |
|---|---|
| ⭐ **`Heimerdinger, Inventor`** 3E1P M3 | *"I have all `[E]` abilities of all friendly legends, units, and gear."* **Doubles your Legend's activated ability** and every Seal and gear tap. The single most combo-relevant card in Origins |
| **Buff economy** | Buffs are a *spendable currency* (CR 702.2.b). Generate: `Pit Rookie`, `Kinkou Monk`, `Peak Guardian`. Spend: `Albus Ferros` (→channel runes), `Kraken Hunter` (→cost reduction), `Wallop`/`Call to Glory` (→ignore spell cost), `Sett, Brawler` (→+4 Might) |
| **Death engine** | `Viktor, Leader` (token per non-Recruit death) + `Machine Evangel` (3 tokens on death) + `Commander Ledros` (kill friendlies to reduce cost) + `Karthus, Eternal` (**Deathknell triggers twice**) |
| **Ready loops** | `First Mate`/`Wallop`/`Mistfall`/`Miss Fortune, Captain` ready units; `Magma Wurm` makes all units enter ready; `Sun Disc` (Legion) readies the next unit |
| **Hidden engine** | `Guerilla Warfare` (return 2 Hidden from trash, hide free) + `Ava Achiever` (play Hidden from hand free) + `Ember Monk` (+2 per Hidden played) + `Bandle Tree` (hide an extra) |
| **Reveal payoff** | `Nocturne, Horrifying` — *"when you look at cards from the top of your deck and see me, play me for `[A]`"* + `Gemcraft Seer` (**all friendly units have Vision**) |

## 3.4 Alternate win conditions and off-curve points

🔎 **derived — these bypass the Final Point restriction, which only gates *Conquer*
(CR 471.1.a.1). EE must not assume 8 points always arrives via battlefields.**

| Card | Effect |
|---|---|
| ⭐ **`The Grand Plaza`** (battlefield) | *"When you hold here, if you have 7+ units here, **you win the game**."* Not points at all — a direct win (CR 195) |
| **`Ahri, Alluring`** 5E1P M4 | *"When I hold, you score 1 point"* — a second point per turn, and Hold is exempt from the Final Point rule |
| **`Yasuo, Windrider`** | *"The third time I move in a turn, you score 1 point"* — with Ganking + ready effects this is repeatable |
| **`Tryndamere, Barbarian`** | *"When I conquer after an attack, if you assigned 5+ excess damage, you score 1 point."* The Tournament Rules use this exact card in a judge-question example (TR 204.5.a.1.a) |

## 3.5 Combat-shaping cards

| Card | Why it matters |
|---|---|
| ⭐ **`Shen, Kinkou`** 3E1P M3 | A **`[Reaction]` unit** with Shield 2 + Tank. The defender can **add a body mid-showdown**. Units becoming present after designation still join the combat (CR 464.2.c.3.a) |
| ⭐ **`Symbol of the Solari`** 1E gear | *"If a combat where you are the attacker ends in a tie, recall **ALL** units instead."* **Directly cancels the attacker-recall asymmetry** (CR 466.1.a.2) — removes the structural defender advantage |
| **`Kayn, Unleashed`** | *"If I have moved twice this turn, I don't take damage."* CR 465.2.c.10 — such a unit is **exempt from lethal-damage assignment** entirely |
| **`Caitlyn, Patrolling`** | *"I must be assigned combat damage last"* — literal Backline before the keyword existed (UNL). CR 465.2.c.8 uses her for the Tank+Backline conflict example |
| **`Vilemaw's Lair`** (battlefield) | *"Units can't move from here to base"* — but ✅ **does not stop the combat recall**, because a Recall is not a Move and can't be blocked by movement restrictions (CR 456.3) |
| **`Imperial Decree`** 5E2P | *"When any unit takes damage this turn, kill it."* + `Flurry of Blades` (1 to all, 1E) = **full board wipe for 6E2P** |

## 3.6 Battlefields are a shared, deck-built layer

Each player registers **3** and presents **1**; both are in play, so **your battlefield helps
your opponent too**. Riot's primer says to pick partly by *"which would harm you in an
opponent's hands."*

Uncontrolled battlefield abilities are run by the **Turn Player** (CR 190.6.b), so
*"At the start of each player's first Beginning Phase"* triggers for **both** players.

| Battlefield | Effect worth knowing |
|---|---|
| `Trifarian War Camp` | *Units here have +1 Might* — **symmetric**, changes all combat maths there |
| `Void Gate` | *Spells and abilities affecting units here deal 1 Bonus Damage* — symmetric |
| `Reckoner's Arena` | *When you hold here, **activate the conquer effects** of units here* (CR 383.4.g) |
| `Startipped Peak` / `Targon's Peak` / `Sigil of the Storm` | Rune manipulation — Targon's grants ready runes for opponent-turn interaction |
| `Bandle Tree` | Raises Facedown Zone occupancy (CR 107.3.b.1) |
| `Hallowed Tomb` | Returns Chosen Champion from trash — legal only if the zone is empty (CR 108.3.c.1) |

### ⚠️ All five banned battlefields are Origins cards

`The Arena's Greatest`, `Aspirant's Climb`, `Dreaming Tree`, `Obelisk of Power`,
`Reaver's Row` — the entire banned-battlefield list comes from the base set.

> 🔴 **Ban-list ingestion bug found.** The official list says **`Dreaming Tree`**; the card
> is named **`The Dreaming Tree`**. 4 of 5 names match exactly; this one does not.
> **Ban-list matching cannot be a plain string equality** — it needs normalisation or a
> curated alias map. This resolves the open question flagged in COMPENDIUM §VI.5.

---

# Part 4 — Spiritforged (SFD): the Equipment set

**Debuts:** `Equip`, `Quick-Draw`, `Weaponmaster`, `Repeat`, `Unique`. 49 gear — the most
of any set.

## 4.1 The Attachment subsystem

Equipment is a **three-part card** (CR 136, 137, 716):

| Part | Effect while attached |
|---|---|
| **Might Bonus** | Modifies the Top-Most Card's Might |
| **Effect Text** | **Appended to the unit's rules text** — the unit literally gains the ability |
| **Equip [Cost]** | Activated ability that attaches it |

🔎 **derived — Effect Text appending is the combo engine.** Because the *unit* gains the
text, anything that reads the unit's abilities sees it.

| Card | Interaction |
|---|---|
| ⭐ **`Svellsongur`** 3E1P | *"copy that unit's text to this Equipment's effect text"* → the unit's own abilities are **appended to itself**, i.e. **doubled** |
| ⭐ **`Gearhead`** 5E M3 | *"Each Equipment attached to me gives **double** its base Might bonus"* |
| **`The Zero Drive`** | Attached: `[Deathknell] — Banish me`. Unattached: *"Banish this: **Play all units banished with this**, ignoring costs."* The rulebook's own Linked Abilities example (CR 393–397) |
| **`Shady Spectacles`** (VEN) | *"the equipped unit **becomes a copy** of another friendly unit"* |
| **`Skyfall of Areion`** | *"My hold effects are also conquer effects, and vice versa"* — **doubles every score trigger** |

## 4.2 Gold — a bankable third resource

**`Gold`** is a 0-cost gear token: *"Kill this, `[E]`: `[Reaction]` — Add `[A]`."*
Produced by ~15 cards (`Battle Mistress`, `Chem-Baroness`, `Treasure Hunter`, `World Atlas`,
`Trove Golem` (four at once), `Blood Money`, `Wages of Pain`, `Treasure Hoard`…).

🔎 **derived:** Gold is **stored, transferable resource** — unlike a Rune Pool, it persists
across turns and can be spent **on the opponent's turn**. Most sources make it *exhausted*,
so it is usable the turn **after** it appears (gear readies in Awaken).

> Combined with the Seals (Part 1) and the converters below, Riftbound's economy is far
> richer than "12 runes."

## 4.3 Resource converters break the Energy/Power wall

| Card | Effect |
|---|---|
| **`Ancient Henge`** 2E1P | `[E]: [Reaction]` — Pay any Energy → **Add that much `[A]`** |
| **`Hextech Anomaly`** 3E1P | `[E]: [Reaction]` — Pay any `[A]` → **Add that much Energy** |

🔎 **derived — with either on board, Energy and Power become fungible**, and rune-split
feasibility largely stops mattering. EE must treat these as feasibility-solving cards.

## 4.4 Notable SFD interactions

| Card | Why it matters |
|---|---|
| ⭐ **`Tianna Crownguard`** 7E2P M4 | *"While I'm at a battlefield, **opponents can't score points**."* A hard lock on the win condition |
| **`Minotaur Reckoner`** 5E M5 | *"Units can't move to base"* — symmetric; combines with attacking to deny retreat |
| **`Ruin Runner`** 6E M5 | *"I can't be chosen by enemy spells and abilities"* — total untargetability (CR 756) |
| **`Renata Glasc, Mastermind`** | `[4][Mind ×4], [E]: **Score 1 point**` — repeatable point purchase |
| **`Draven, Audacious`** | *First combat win each turn scores 1 point*; **but on death in combat an opponent scores 1** |
| **`Fiora, Peerless`** | *"When I attack or defend **one on one**, double my Might"* — "one on one" is defined (CR 740.2.b): both units alone |
| **`Temporal Portal`** 3E | Grants **`[Repeat]` equal to cost** to your next spell — doubles anything |
| **`Rengar, Pouncing`** | A `[Reaction]` unit that *"can be played to a battlefield you're **attacking**"* — the **attacker** can add bodies mid-combat too |
| **`Not So Fast`** / **`Repulse`** | Counters restricted to spells that *choose your stuff* — cheap, conditional protection |
| **`Riposte`** ★ | Counter a spell **and** give a unit +Might equal to its Energy cost — a 2-for-1 |

---

# Part 5 — Unleashed (UNL): XP, Level and positioning

**Debuts:** `Hunt`, `Level`, `Ambush`, `Backline`.

## 5.1 The XP economy

XP is a **player-level resource** (CR 728–733): public, unlimited, not shared with allies,
and **not** a Game Object (can't be targeted).

| Produce | Spend |
|---|---|
| `Hunt X` on conquer/hold · `Voidreaver` (win a combat) · `Keeper of the Hammer` (hold) · `Stare Down` · `Alpha Strike` (per kill) · `Grim Resolve` · `Scryer's Bloom` · `Blood Rose` · `Gardens of Becoming` battlefield | `[Level N]` thresholds (**3, 6, 11, 16** exist) · `Conscription` (5 XP to steal any unit) · `Voidreaver` abilities |

⚠️ **`Wuju Master`** (Master Yi legend) has **no activated ability at all** — it is pure XP
payoff: `[Level 6]` your units have +1 Might; `[Level 11]` **your units enter ready**.

🔎 **derived — dead-card detection is real and checkable.** A deck with `[Level 6]` cards
but only 2 XP of production has cards that can *never* activate. EE flags this as a **FACT**.

## 5.2 A second alternate win condition

**`Gutter Palace`** (4E gear, Mind): *"At the start of your Beginning Phase, if you have
**exactly 4 cards in hand and exactly 4 units at battlefields**, you win the game."*

With `The Grand Plaza` (Origins), that is **two non-point win conditions** in the format.
EE must never assume victory arrives via 8 points.

## 5.3 Notable UNL interactions

| Card | Why it matters |
|---|---|
| **`Lilting Lullaby`** ★ | *Counter a spell. **Its controller can't play spells this turn.*** Counter + lockout |
| **`Keeper's Verdict`** ★ | *"Its owner places it on the **top or bottom of their Main Deck**"* — removal with **no trash recursion** |
| **`Moonlight Affliction`** 7E | −10 Might. Might below 0 is treated as 0 (CR 143.2.b) — doesn't kill alone, but **1 damage then does** |
| **`Lotus Trap`** | *Double all damage dealt to it this turn* — the rulebook's damage-assignment ordering example (CR 465.2.c.5) |
| **`The Ruination`** 9E3P | **Kill all units** — ignores Might entirely |
| **`Honeyfruit`** | `[Level 6][>][>>][Reaction][>]` — a **double-dependent keyword**; *all* conditions must hold (CR 727.1.b.3) |
| **`Vaults of Helia`** (battlefield) | *"When you hold here, your non-token units cost 1 **more**"* — a self-harming battlefield you bring to punish the opponent |
| **`Forbidding Waste`** (battlefield) | *"While a unit here is defending **alone**, it has −2 Might"* — direct tech against solo-defender decks |

---

# Part 6 — Vendetta (VEN): Empower, Flow, Burn

**Debuts:** `Empower`, `Empowered`, `Flow` (+ the `Burn` and `Skip` actions).

## 6.1 Empower — a paid, persistent status

`Empower [Cost]` is an **activated ability that targets its own source** (CR 827); the
`Empowered` status then switches on `[Empowered][>]` abilities. It persists until removed or
the card leaves play.

**Costs are highly varied** — Energy, Power, discard, **killing a friendly unit**
(`Escaped Grayback`), or scaling (`Frostcoat Mother`/`Grumpy Rockbear`: *12 Energy, −1 per
rune you control*).

| Card | Note |
|---|---|
| ⭐ **`Kayle, Justified`** | *"I can be Empowered **up to three times**"* — explicitly overrides the once-only rule (CR 441.1.c.1). +2 Might per stack |
| ⭐ **`Mel, Newly Awakened`** | `[Empowered][>]` **"Your spells and abilities can't be countered"** — switches off the entire Calm counter suite |
| **`Ambessa, The Wolf`** | `[Empowered][>]` *"can't be dealt damage unless I'm in combat"* — immune to burn outside combat |
| **`Nasus, Ascended`** | `[Empowered][>]` *"When I conquer, you **score 1 point**"* |
| **`Aurok General`** | *Your Empowered units have +2 Might* — a payoff for going wide on Empower |
| **`Renekton, Brute`** | *"When my Might becomes 10 or more, empower me"* — self-empowering via pumps |

**Enablers:** `Matriarch of War` and `Soul's Reflection` (*"when you empower something else,
empower me"*), `Hextech Formula` (empower another gear), `Risen Altar` battlefield (Empower
costs less), `Sanction` (empower **or disempower** at Reaction speed).

## 6.2 Flow + Burn — the trash becomes a second hand

`Flow [Cost]` (CR 829) lets you **play a spell from your trash** for an alternate cost, then
banish it. **`Burn N`** puts cards from deck to trash — so **self-mill is now resource
generation**.

| Card | Role |
|---|---|
| **`Stargazer`** 5E M4 | *Spells with `[Flow]` you play from your trash cost 2 less* |
| **`Kennen, Storm of Shuriken`** | *When I conquer, give a spell in your trash `[Flow]` equal to its cost* — grants Flow to **anything** |
| **`Death Mark`** ★ | Burn 3, make a Shadow Clone, and has Flow itself |
| **`Endless Riches`** 5E1P | *Banish your hand and trash, `[Burn 7]`, **skip your Draw Phase**, you may play cards from your trash* — an entire alternate game plan |
| **`Forgotten Relic`** | Burn 1 each turn; a burned **unit** gives +Might equal to its Might |

## 6.3 ⭐ The Decree cycle — printed sideboard tech

Vendetta prints a **one-per-domain cycle of cheap anti-domain cards**:

| Card | Domain | Hates |
|---|---|---|
| `Decree of Rage` | Fury | *Deal 4 to an enemy **Calm** unit* — **and can't be countered** |
| `Decree of Focus` | Calm | +4 Might vs an enemy **Fury** unit or Fury spell |
| `Decree of Insight` | Mind | −5 Might to an enemy **Body** unit, **ignoring Deflect** |
| `Decree of Strength` | Body | Strip a **Mind** card from their hand |
| `Decree of Discord` | Chaos | Bounce enemy **Order** units, total Might ≤5 |
| `Decree of Unity` | Order | Kill an enemy **Chaos** unit or gear |

🔎 **derived — this is explicitly designed sideboard tech, and it is a gift to EE.**
`Q-SIDEBOARD` can name a concrete, format-legal answer for any opposing Domain Identity,
grounded in printed cards rather than heuristics.

## 6.4 Battlefields that tax the interaction layer

| Battlefield | Effect |
|---|---|
| **`Mystic Vortex`** | *During showdowns here, `[Reaction]` cards cost `[A]` more* — **taxes the whole trick layer** |
| **`Heisho, Shell of the World`** | *Players ignore `[Deflect]` while paying for spells choosing something here* |
| **`Threshold of the Gray`** | *When combat starts here, attacker **and** defender each Add 1 Energy* — free trick mana for both |
| **`Sandswept Tomb`** | Spells choosing your own units there cost `[A]` less |

---

# Part 7 — Cross-cutting patterns for EE

## 7.1 Interaction cannot be assumed away

Any evaluation of a combat must account for these classes, because they change the maths
*after* attackers are declared:

| Class | Examples |
|---|---|
| **Might swing (cheap)** | `Stupefy` −1 · `Combat Experience` +1 · `Frigid Touch` −2 · `Feral Strength` +2 · `Defiant Dance` ±2 |
| **Might swing (large)** | `Primal Strength` +7 · `Punch First` +5 · `Moonlight Affliction` −10 · `Smoke Screen` −4 · `Eclipse` −4 |
| **Removal mid-combat** | `Hidden Blade` · `Vengeance` · `Deathgrip` · `Soul Harvest` |
| **Body addition** | `Shen, Kinkou` · `Janna, Savior` · `Rengar, Pouncing` (Reaction **units**) |
| **Removal denial** | `Zhonya's Hourglass` · `Guardian Angel` · `Highlander` · `Tactical Retreat` · `Counter Strike` · `Ki Barrier` |
| **Evasion** | `Flash` · `Retreat` · `Fight or Flight` · `Emperor's Divide` — **and base dodges ~half of all removal** |
| **Counters** | `Wind Wall` (unconditional) · `Defy` (≤4E) · `Hard Bargain` (tax) · `Crumbling Sands` (conditional) · `Riposte` · `Lilting Lullaby` |
| **Counter-proof** | `Decree of Rage` · `Mel, Newly Awakened` |

## 7.2 The lock/prison list — cards that void whole analyses

⚠️ **EE must special-case these; while active, normal reasoning about refutations, scoring
or combat is wrong.**

| Card | What it voids |
|---|---|
| `Brynhir Thundersong` | **All opposing plays this turn** |
| `Tianna Crownguard` | **Opponent scoring entirely** |
| `Mageseeker Warden` | Enemy units to battlefields; readying enemy units/gear |
| `Mel, Newly Awakened` (Empowered) | **All counterplay against your spells** |
| `Lilting Lullaby` | Their spells for the turn |
| `Minotaur Reckoner` / `Vilemaw's Lair` | Retreat to base (**but not** combat recall — CR 456.3) |
| `Rockfall Path` | Playing units at that battlefield |
| `Forgotten Monument` | Scoring there before turn 3 |
| `Elder Dragon` | **The lethal-damage threshold itself** (CR 142.4.c) |
| `Dune Surfer` | `Tank` ordering at its battlefield |
| `Ruin Runner` / `Akali, Silent` | Being targeted at all |

## 7.3 Every way to gain a point that isn't Conquer or Hold

🔎 **Critical for EE, because the Final Point restriction gates only Conquer**
(CR 471.1.a.1). All of these can deliver the winning 8th point:

`Ahri, Alluring` (hold→extra point) · `Yasuo, Windrider` (3rd move) ·
`Tryndamere, Barbarian` (5+ excess damage) · `Draven, Audacious` (win a combat) ·
`Trinity Force` (equipment, on hold) · `Nasus, Ascended` (Empowered conquer) ·
`Renata Glasc, Mastermind` (pay 4E + 4 Mind) · `Power Nexus` battlefield (pay 4 `[A]`) ·
`Bottled Constellation` (kill 3 friendlies) · **opponent Burn Out** (CR 431.2.c)

**Plus two outright wins:** `The Grand Plaza` (7+ units held there) and `Gutter Palace`
(exactly 4 cards in hand and 4 units at battlefields).

## 7.4 Engine archetypes visible in the pool

| Engine | Core pieces |
|---|---|
| **Buff economy** | Generate (`Pit Rookie`, `Kinkou Monk`, `Fae Dragon`) → spend (`Albus Ferros`, `Kraken Hunter`, `Wallop`, `Sett`) |
| **Death value** | `Viktor, Leader` + `Machine Evangel` + `Karthus, Eternal` (**Deathknells trigger twice**) + `Commander Ledros` |
| **Equipment** | `Ornn`/`Jax`/`Azir` legends + Weaponmaster units + `Gearhead` + `Svellsongur` |
| **Trash / Flow** | `Burn` effects → `Stargazer` + `Kennen` + `Endless Riches` + `The Harrowing` + `Soulgorger` |
| **Token swarm** | `Herald of the Arcane` + `Recruit the Vanguard` + `Corina Veraza` + `Renata Glasc, Industrialist` (**tokens enter ready**) |
| **Mech tribal** | `Rumble` legend + `Breakneck Mech` + `Production Surge` + `Forecaster` |
| **XP / Level** | `Hunt` gear + `Voidreaver`/`Keeper of the Hammer` → `Wuju Master` `[Level 11]` |
| **Empower** | `Matriarch of War`/`Soul's Reflection` chaining + `Aurok General` + `Risen Altar` |
| ⭐ **Untap loop** | `Heimerdinger, Inventor` (**has every friendly `[E]` ability**) + `Shurelya's Requiem` (ready your units) + `Acceleration Gate` + `Magma Wurm` |

## 7.5 What I could not learn this way

Read honestly, so EE never overclaims:

- **What players actually do** — which of these lines are common, which are traps
- **Frequency** — how often a given refutation is actually held
- **Pacing in practice** — how long real games run, how often they end on the Final Point
- **Which engines are good** — I can see what *combines*; I cannot see what *wins*

Everything above is **mechanically derived**. It describes the possibility space, not the
meta.

---

# Part 8 — Exhaustive pairwise combat analysis

> Computed, not read. **222,312 ordered unit pairs** resolved under the real damage rules
> (role-conditional Might, Tank/Backline ordering, lethal-first, no overkill), re-run across
> the combat-modifying battlefields. This is a working prototype of EE's rules core.
>
> ⚠️ **Model scope:** clean combat with no tricks played. Cards, abilities and legends are
> excluded deliberately — this measures the *baseline* the trick layer then modifies.

## 8.1 ⚠️ STALL is not a real outcome — I over-weighted it

`EVALUATION.md` treats the attacker-recall asymmetry (CR 466.1.a.2) as a headline structural
fact. The exhaustive run says otherwise:

| Outcome | 1v1 (222,312 pairs) | 2v2 (200,000 samples) |
|---|---|---|
| `CONQUEST` | 43.0% | 45.6% |
| `REPELLED` | 41.4% | 43.7% |
| `TRADE` | 15.6% | 10.8% |
| **`STALL`** | **0.003%** (6 pairs) | **0.002%** |

🔎 **derived — STALL is mathematically near-impossible in a clean combat.** In a duel,
`attacker dies ⟺ D ≥ A` and `defender dies ⟺ A ≥ D`; for *neither* to die you would need
`A < D` **and** `D < A`. The only exceptions are the three **0-Might** units in the format
(`Reflection`, `Scuttle Crab`, `Steel Paws`), because lethal damage must be non-zero
(CR 142.4.b). In multi-unit combat it needs *both* sides to partially clear, which
lethal-first/no-overkill assignment makes rare.

> **Correct framing:** the recall rule is a **deterrent, not an outcome.** It is the reason
> you don't attack without lethal — not a state you commonly reach. EE should present it as
> a *risk of committing*, not as a likely result.

⚠️ **Selection-bias caveat:** these are *random* pairings. Real combats are **chosen** by an
attacker who commits only when favourable, so the observed distribution in real games will
skew far more toward `CONQUEST`. This model measures the possibility space, not play.

## 8.2 ⭐ Symmetric battlefields barely matter; asymmetric ones decide games

Re-running all 222,312 pairs on each combat-modifying battlefield, counting **outcome
flips versus neutral**:

| Battlefield | Effect | Outcomes flipped |
|---|---|---|
| **`Forbidding Waste`** | Defender alone has **−2 Might** | 🔴 **90,594 — 40.8%** |
| `Brush` | Bird/Cat/Dog/Poro/Ivern **+1** | 13,615 — 6.1% |
| `Kinkou Temple` | `Tank` units **+1** | 5,399 — 2.4% |
| **`Trifarian War Camp`** | **All** units +1 | 🟢 **6 — 0.0%** |

🔎 **derived — this is the most useful battlefield principle in the game.**
`Trifarian War Camp` gives **+1 Might to everything**, and changes essentially **nothing**
about who wins a fight, because both sides get it. `Forbidding Waste` gives **−2 to a lone
defender** and flips **two fifths of all combats**, pushing attacker conquest from 43% to
**72.6%**.

> **Rule for EE and for deckbuilding: judge a battlefield by its *asymmetry*, not its
> magnitude.** A big symmetric buff is nearly irrelevant to combat; a small conditional one
> is decisive. (Symmetric buffs *do* still matter for **removal thresholds** — a 4-Might
> unit becoming 5 dodges `Deal 4`.)

## 8.3 ⭐ Quantifying the trick layer — how fragile is a combat?

For each cheap trick, how many of the 222,312 duels change outcome, and how many *losses
become conquests*:

| Trick | Cost | Outcomes flipped | Losses → `CONQUEST` |
|---|---|---|---|
| `Stupefy` (def −1) | 1E | **29.7%** | 34,581 |
| `Combat Experience` (def +1) | 1E | **29.9%** | 0 — *defensive; converts conquests into repels* |
| `Frigid Touch` (def −2) | 2E | **40.8%** | 65,901 |
| `Cleave` (att +3) | 1E | **48.2%** | 90,600 |
| `Smoke Screen` (def −4) | 2E1P | **52.4%** | 106,539 |
| `Grand Strategem` (att +5 all) | 6E3P | **54.7%** | 116,572 |
| `Primal Strength` (att +7) | 4E1P | **56.4%** | 124,062 |
| `Moonlight Affliction` (def −10) | 7E | **56.9%** | 124,963 |

🔎 **derived — a single 1-Energy card decides roughly a third of all possible combats, and
`Cleave` alone decides nearly half.**

> **This is the number that justifies EE's whole design.** A combat evaluation that ignores
> the trick layer is wrong ~30–50% of the time. It is also why the answer must be *"fragile
> to cheap Mind interaction"* rather than a verdict — the verdict genuinely depends on a
> card you cannot see.

Note the asymmetry in the last column: **defensive tricks never create conquests**, they
only deny them. Offensive and defensive interaction are not mirror images, and EE should
report *"can they stop me?"* and *"can I stop them?"* as separate questions.

## 8.4 What `Tank` actually does

22 units have `Tank`. Forcing damage into them first does **not** produce stalls — it
shifts the outcome distribution toward the defender:

| Defending board | `CONQUEST` | `REPELLED` |
|---|---|---|
| No Tank | 46.4% | 43.0% |
| **Has a Tank** | **37.4%** | **52.2%** |

🔎 **derived:** `Tank` is worth roughly **9 percentage points** of conquest denial. It works
by absorbing damage inefficiently, not by creating ties.

## 8.5 The combat ceiling

| | Unit | Profile | Beats |
|---|---|---|---|
| **Best attacker** | `Baron Nashor` · `Master Yi, Unstoppable` | M12 | **469 / 471** |
| **Best defender** | ⭐ **`Volibear, Imposing`** | M10 + `Shield 3` = **13** | **471 / 471 — everything** |
| Best cheap defender | `Needlessly Large Yordle` | M5 + `Shield 5` = 10 | 465 / 471 |
| **Beat nothing** | `Reflection`, `Scuttle Crab`, `Steel Paws` | M0 | 0 |

🔎 **derived — no unit in the format beats `Volibear, Imposing` in combat.** It can only be
answered by `Kill` effects, bounce, or stealing it. That is the clearest possible
illustration of Part 2: **combat has a ceiling; `Kill` effects don't.**

## 8.6 What this prototype proves for EE

1. **The rules core is buildable and fast.** 222k duels resolve in under a second in pure
   Python; the full battlefield sweep is trivial. Refutation search over a few hundred
   combat-speed cards is comfortably within budget.
2. **The baseline must be computed, then modified by the trick layer** — never reported
   alone, because tricks flip 30–50% of results.
3. **Battlefield modelling is cheap and worth doing** (EE open question E2 — answer: yes,
   include it in v1). Only a handful of battlefields alter combat maths, and one of them
   changes 40% of outcomes.
4. **Selection bias must be stated.** Random pairings are not real combats; EE should say
   *"if you commit here"*, never *"you will win 43% of fights."*
