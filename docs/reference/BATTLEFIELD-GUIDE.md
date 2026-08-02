# Battlefield Guide — All 66

> Every battlefield, judged on the one axis that decides whether to run it: **does it help
> you more than it helps your opponent?**
>
> **Created:** 2026-08-02

**Related:** [`LEGEND-GUIDE.md`](LEGEND-GUIDE.md) · [`CARD-KNOWLEDGE.md`](CARD-KNOWLEDGE.md) ·
[`COMPENDIUM.md`](COMPENDIUM.md)

---

## 1. Why battlefields are unlike every other card

**You register 3 and present 1 — and *both* players' battlefields are on the board**
(CR 485.4, TR 402.1). So a battlefield is **the only card you bring that your opponent also
gets to use.** Riot's own primer says to pick partly by *"which would harm you in an
opponent's hands."*

Three consequences:

| Fact | Consequence |
|---|---|
| Only **1 of your 3** is used per game (you choose in bo3, random in bo1) | Register 3 *different* answers, not 3 copies of a plan |
| Uncontrolled battlefield abilities are run by the **Turn Player** (CR 190.6.b) | *"At the start of each player's…"* triggers for **both** players |
| ⭐ **Asymmetry beats magnitude** | Proven: `Trifarian War Camp` (+1 to **everything**) flips **0.0%** of combats; `Forbidding Waste` (−2 to a **lone defender**) flips **40.8%** ([CARD-KNOWLEDGE §8.2](CARD-KNOWLEDGE.md#82--symmetric-battlefields-barely-matter-asymmetric-ones-decide-games)) |

**So the classification that matters is who the text says "you" is:**

- 🟢 **One-sided** — *"when **you** hold/conquer here"*, *"while **you** control"*. Only the
  controller benefits. **Safest to register.**
- 🟡 **Symmetric** — *"units here"*, *"each player"*, *"a player"*. Helps whoever exploits it
  better. **Only register if your deck exploits it harder.**
- 🔴 **Restriction** — constrains both players. **Register as a tax on the opponent's plan.**

⚠️ **`Baron Pit` and `Brush` are tokens** — created in play by `Baron Nashor` and
`Green Father`. You cannot register them (`Baron Pit` says so explicitly). That leaves
**59 registerable** battlefields after the 5 bans.

---

## 2. 🚫 Banned — all five are Origins cards

| Battlefield | Text |
|---|---|
| `The Arena's Greatest` | *Each player gains 1 point on their first Beginning Phase* |
| `Aspirant's Climb` | *Increase the points needed to win by 1* |
| `The Dreaming Tree` | *First friendly unit chosen by a spell each turn → draw 1* |
| `Obelisk of Power` | *Each player channels 1 rune on their first Beginning Phase* |
| `Reaver's Row` | *When you defend here, move a friendly unit here to base* |

⚠️ The official ban list writes **`Dreaming Tree`**; the card is **`The Dreaming Tree`** — a
real string-matching trap ([L31](../spec/LEGALITY.md)).

---

## 3. 🟢 One-sided — value only the controller gets

**The default choice.** These pay you for scoring and give the opponent nothing unless they
take the battlefield off you.

### 3.1 Hold payoffs — reward the Holder plan

| Battlefield | Effect | Best with |
|---|---|---|
| `Grove of the God-Willow` | Draw 1 | Any Holder. The cleanest card-advantage battlefield |
| `Altar to Unity` | A Recruit token in base | Viktor, Garen — go-wide |
| `Navori Fighting Pit` | Buff a unit here | Lee Sin, The Boss — buff economies |
| `Startipped Peak` | Channel 1 rune exhausted | Ramp; compounds every turn |
| `Hallowed Tomb` | Return Chosen Champion from trash | Any deck whose Champion is the plan (CR 108.3.c.1 — Champion Zone must be empty) |
| ⭐ `Reckoner's Arena` | **Activate the conquer effects of units here** (CR 383.4.g) | Rek'Sai, Vi, Draven — turns Hold into Conquer triggers |
| `The Papertree` | **Each** player channels 1 — 🟡 symmetric, but you also get the Hold | Ramp decks that use runes better |
| `Amateur Recital` | Move an enemy unit at a battlefield to base | Tempo denial |
| `Shadow Temple` | `Burn 3` | ⚠️ Only good with Flow/trash payoffs — otherwise it mills you for nothing |
| `Power Nexus` | Pay 4 `[A]` → **score 1 point** | Renata Glasc, Chem-Baroness — an alternate point route |
| `The Academy` | Next spell gains `[Repeat]` equal to base cost | Spell decks — effectively doubles a bomb |
| `Vaults of Helia` | ⚠️ **Your** non-token units cost 1 **more** | 🔴 **A self-harming card you bring to punish the opponent.** Only for token decks that ignore it |

### 3.2 Conquer payoffs — reward the aggressive plan

| Battlefield | Effect | Best with |
|---|---|---|
| `Targon's Peak` | **Ready 2 runes at end of turn** — interaction mana | Any deck holding `[Reaction]` cards |
| `Sigil of the Storm` | Recycle a rune | Power-hungry curves; Sivir (recycle trigger) |
| `Zaun Warrens` | Discard 1, draw 1 | Jinx — discard is upside |
| `The Candlelit Sanctum` | Predict 2 with ordering | Consistency; Nocturne (reveal payoff) |
| `Monastery of Hirana` | Spend a buff → draw 1 | Buff decks with surplus |
| `Seat of Power` | Draw 1 **per other battlefield you control** | ⚠️ Only 2 battlefields exist in 1v1 — this draws **1**, not many |
| `Sunken Temple` | Conquer with a Mighty unit → draw 1 | Volibear, Fiora |
| `Treasure Hoard` | Pay 1 → a Gold token | Gold/ramp decks |
| `Veiled Temple` | Ready a friendly gear; detach an Equipment | Ornn, Jax, Jayce |
| `Hall of Legends` | Pay 1 → **ready your legend** | ⭐ Any `[E]`-gated Legend — a second activation every turn |
| `Emperor's Dais` | Bounce your own unit → a Sand Soldier | Azir; also rebuys play effects |
| `Minefield` | Put your top 2 into your trash | ⚠️ Self-mill — only with Flow/trash payoffs |
| `Protective Sands` | If you control ≤4 runes, pay 1 → draw | ⚠️ Anti-synergy with ramp; a **low-curve aggro** card |
| `Trapping Grounds` | 3+ excess damage → a Bird token | Vi, Tryndamere, Sivir — the excess-damage cluster |

### 3.3 Control-conditional statics

| Battlefield | Effect | Best with |
|---|---|---|
| `Forge of the Fluft` | Your legends gain *"`[E]`: attach an Equipment"* | ⭐ Effectively a free Equip every turn — Ornn, Jax, Lucian |
| `Ornn's Forge` | First non-token gear each turn costs 1 less | Gear decks |
| `Piltovan Forge` | First gear **activated ability** each turn costs 1 less | Jayce (tap-engines), Seal decks |
| `Marai Spire` | Your `[Repeat]` costs cost 1 less | Spiritforged Repeat shells |
| `Forgotten Library` | Spell costing 4+ → `[Predict]` | Lux, Jhin, Kai'Sa |
| `Risen Altar` | **Your** units' `[Empower]` costs cost less | Vendetta Empower decks |

---

## 4. 🟡 Symmetric — only register if you exploit it harder

**These help both players.** The test is whether your deck uses the effect more than a
typical opponent will.

| Battlefield | Effect | Who wins the exchange |
|---|---|---|
| `Trifarian War Camp` | Units here **+1 Might** | ⚠️ **Nearly irrelevant to combat** — flips 0.0% of duels because both sides get it. It *does* matter for **removal thresholds** (a 4-Might unit becomes 5 and dodges `Deal 4`). Bring it for that, not for fights |
| `Kinkou Temple` | `Tank` units **+1** | Tank decks — Shen, Poppy. Flips 2.4% |
| `Brush` (token) | Bird/Cat/Dog/Poro/Ivern **+1** | Ivern tribal only. Flips 6.1% |
| `Black Flame Altar` | `Temporary` units have `Shield` | Lillia, LeBlanc — nobody else has Temporary units |
| `Void Gate` | Spells/abilities here deal **+1 Bonus Damage** | ⭐ Burn decks. Turns `Deal 2` into `Deal 3`, which crosses a real coverage step (19% → 42% of units) |
| `Windswept Hillock` | Units here have `Ganking` | Mobility decks — Miss Fortune, Yasuo. ⚠️ Also lets the **opponent** leave |
| `Gardens of Becoming` | Units here have *"`[E]`: gain 1 XP"* | ⭐ Master Yi, Poppy, Kha'Zix — XP decks exploit this enormously; nobody else uses it at all |
| `Valley of Idols` | Pay 1 → buff a unit played here | Buff decks — Lee Sin, The Boss |
| `Abandoned Hall` | Play a spell → +1 Might to a unit here | Spell-dense decks. The rulebook uses this for ability control (CR 190.6.c) |
| `Frozen Fortress` | **1 damage to each unit here** each Beginning Phase | ⚠️ **Punishes going wide** — a tax on token decks. Bring it *against* swarm, avoid it *with* swarm |
| `Altar of Blood` | Pay 3 `[A]` to save a dying unit | Decks with spare Power and expensive units |
| `Ripper's Bay` | Unit returned to hand → channel a rune | Pyke, bounce decks |
| `Star Spring` | First non-token unit played here → move another of yours to base | Tempo/evasion decks |
| `Threshold of the Gray` | Combat starts → **both** players Add 1 Energy | ⚠️ Helps whoever holds more `[Reaction]` cards. Genuinely two-edged |
| `Sandswept Tomb` | Spells choosing your own units here cost `[A]` less | Irelia (choose-friendly), buff/pump decks |
| `Dragon Roost` | Any player may pay 2 `[A]` to play a Dragon here | Dragon tribal only — otherwise blank |
| `Back-Alley Bar` | Unit moving **from** here gets +1 | Hit-and-run — Akali, Miss Fortune |
| `Fortified Position` | Defender here gains `Shield 2` this combat | ⚠️ Helps **whoever is defending**, which is usually whoever holds it — mildly one-sided in practice |
| `Bandle Tree` | Hide an **additional** card here | ⭐ Teemo/Hidden decks. Raises Facedown occupancy (CR 107.3.b.1) |
| `Baron Pit` (token) | Units can move here **from anywhere** | Created by `Baron Nashor`. Breaks normal movement restrictions |

---

## 5. 🔴 Restrictions — bring these as a tax on the opponent

These constrain **both** players. You register them because your deck minds the restriction
*less* than a typical opponent does.

| Battlefield | Restriction | Bring it when |
|---|---|---|
| ⭐ `Forbidding Waste` | Lone defender has **−2 Might** | **The single most impactful battlefield in the format — flips 40.8% of combats** and pushes attacker conquest from 43% to 72.6%. A hard, printed answer to `Wuju Bladesman`, `Wielder of Water` and every solo-defender plan. If you attack, register this |
| `Vilemaw's Lair` | Units **can't move from here to base** | Against evasion decks (Yasuo, Akali, Flash shells). ⚠️ Does **not** stop the combat recall — a Recall isn't a Move (CR 456.3) |
| `Rockfall Path` | **Units can't be played here** | Against `[Ambush]`, `Rengar, Pouncing`, `Shen, Kinkou` and every flash-blocker. Forces everything to walk |
| `Forgotten Monument` | **No scoring here until turn 3** | Against fast Conqueror decks. Buys a Holder two full turns |
| `Mystic Vortex` | `[Reaction]` cards cost `[A]` more in showdowns here | ⭐ Against trick-heavy decks. Directly taxes the layer that flips 30–50% of combats |
| `Heisho, Shell of the World` | Players **ignore `Deflect`** when paying here | Against `Deflect` shells — Volibear, Ruin Runner, Hexdrinker |

---

## 6. 🏆 The outlier

**`The Grand Plaza`** — *"When you hold here, if you have **7+ units here, you win the
game**."*

An outright win condition (CR 195), not points. Realistic only for **`Herald of the Arcane`
(Viktor)** and other token engines that can physically assemble seven bodies in one place —
and it survives the Final Point restriction entirely, because it isn't a point.

⚠️ **It is symmetric.** If you register it and your opponent is the swarm deck, you have handed
them the game.

---

## 7. How to choose your three

1. **Take one that pays your plan.** A Hold payoff if you hold, a Conquer payoff if you
   conquer — §3 is one-sided and therefore the safe slot.
2. **Take one restriction that taxes what beats you.** `Forbidding Waste` if you attack,
   `Forgotten Monument` if you're slow, `Mystic Vortex` against tricks, `Rockfall Path`
   against flash-blockers.
3. **Take one flexible or symmetric card you exploit harder** — `Void Gate` in burn,
   `Gardens of Becoming` in XP, `Bandle Tree` in Hidden.

**And check the mirror every time:** *"if my opponent were standing on this, would it be
worse for me than it is good for me?"* That single question kills most bad battlefield
choices — `Windswept Hillock` in a deck that wants the opponent pinned, `Trifarian War Camp`
in a deck whose removal caps at 4 damage, `The Grand Plaza` opposite a swarm deck.

> ⭐ **The one-line rule:** *symmetric buffs barely change combat; conditional debuffs decide
> it.* Bring the asymmetry.
