# Card Index — All 814 Main-Deck Cards, Classified

> Every main-deck card in the format, classified by **what it produces**, **what it
> consumes**, its **role**, its **timing**, and whether it is **above or below curve** for
> its cost.
>
> **Created:** 2026-08-02 · **Coverage:** all **814** distinct main-deck names (banned
> included, marked). Legends and battlefields are covered separately in
> [`LEGEND-GUIDE.md`](LEGEND-GUIDE.md) and [`BATTLEFIELD-GUIDE.md`](BATTLEFIELD-GUIDE.md).

**Related:** [`CARD-KNOWLEDGE.md`](CARD-KNOWLEDGE.md) (interactions) ·
[`../spec/EVALUATION.md`](../spec/EVALUATION.md) (EE consumes this directly)

---

## Why classification rather than prose

⚠️ **Not because completeness is bad.** [D-039](../DECISIONS.md#d-039) governs what **EE
says to a human**, not what Forge stores — the data layer should be **as complete as
possible**, and the full card corpus (every card, every field, full rules text) is cached at
[`../../data/`](../../data/).

Classification is used here because **prose per card would carry less information than
structure**, not less volume. What EE needs per card is machine-usable: what it makes, what
it wants, when it can be played, and whether its stats or its text is the card.

**Prose is reserved for cards where structure is insufficient** — the locks, engines and
rule-benders, which live in [`CARD-KNOWLEDGE.md`](CARD-KNOWLEDGE.md).

**Two axes do the work:**

- **Produces** — a behaviour or resource the card *creates* (`buff`, `token`, `xp`, `gold`,
  `rune`, `draw`, `empower`, `discard`, `banish`, `burn`, `damage`, `kill`, `stun`, `move`,
  `ready`, `bounce`, `temporary`, `pump`, `shrink`, `counter`, `trashplay`, `ramp`, `point`)
- **Consumes** — a condition the card *rewards* (`legion`, `level`, `empowered`,
  `buff_spend`, `xp_spend`, `mighty`, `gear_matters`, `trash_matters`, `hidden`,
  `token_matters`, `conquer`, `hold`, `attack`, `defend`, `move_trigger`, `spell_played`,
  `unit_played`, `death`, `discard_matters`, `flow`)

A deck works when its **producers cover its consumers**. That is the whole synergy model,
and it is computable rather than judged.

---

## 1. What the format is made of

| Role | Cards | | Role | Cards |
|---|---|---|---|---|
| **body** (stats-first) | **328** | | token-maker | 6 |
| utility | 56 | | counter | 8 |
| body+removal | 55 | | gear+ramp | 12 |
| gear | 55 | | body+ramp | 15 |
| body+draw | 47 | | tempo | 25 |
| combat-trick | 42 | | card-draw | 26 |
| equipment | 40 | | body+tokens | 27 |
| removal-damage | 39 | | removal-kill | 33 |

**Timing** — the interaction layer measured precisely:

| Timing | Cards | Meaning |
|---|---|---|
| — | 603 (74%) | Your turn, open state only |
| `[Action]` | 87 | Playable in showdowns |
| `[Reaction]` | 98 | Playable in closed states, on top of a chain |
| `[Hidden]` | 26 | Facedown, later played ignoring base cost |

> **Only 26% of the format can act inside a combat.** That is the pool EE's refutation search
> runs over — a few hundred cards, not thousands.

## 2. ⭐ The synergy graph — how well-supported each payoff is

For every "consumer" mechanic, how many cards **want** it versus how many **feed** it. The
ratio is the deckbuilding difficulty.

| Payoff (consumer) | Cards wanting it | Cards feeding it | Support ratio | Verdict |
|---|---|---|---|---|
| `mighty` | 7 | 208 (pump + buff) | **29.7×** | Trivially satisfied — never build around it |
| `buff_spend` | 7 | 37 | 5.3× | Comfortable |
| `discard_matters` | 4 | 21 | 5.2× | Comfortable |
| `move_trigger` | 30 | 110 | 3.7× | Comfortable |
| `xp_spend` | 10 | 27 | 2.7× | Workable |
| `trash_matters` | 52 | 108 | 2.1× | Workable |
| `death` | 39 | 80 | 2.1× | Workable |
| `level` | 15 | 27 (XP) | **1.8×** | ⚠️ Tight — XP income must be deliberate |
| `flow` | 17 | 28 (burn/discard) | **1.6×** | ⚠️ Tight |
| `token_matters` | 52 | 52 | **1.0×** | ⚠️ Exactly balanced |
| ⭐ `empowered` | **40** | **43** | 🔴 **1.1×** | **The tightest build-around in the format** |

🔎 **The Empower finding.** 40 cards pay off the `Empowered` status but only 43 can grant it —
**and most of those grant it only to themselves.** So a Vendetta Empower deck cannot simply
include payoffs; it must run the specific *external* enablers (`Matriarch of War`,
`Soul's Reflection`, `Hextech Formula`, `Sanction`, `Risen Altar`) or the payoffs never switch
on. **This is the highest-risk archetype to misbuild in the game**, and the ratio proves it.

Contrast `mighty` at 29.7× — a deck literally cannot avoid turning it on. Any card that says
*"if a unit is Mighty"* is effectively unconditional.

## 3. Build-arounds — cards that need deliberate support

Cards consuming a **scarce** mechanic. Including one without the matching package makes it a
blank.

| Needs | Cards |
|---|---|
| **`flow`** (17) | `Lightning Rush`, `Twilight Shroud`, `Dredge Up`, `Shuriken Flip`, `Brittle Steel`, `Death Mark`, `Dragon Form`, `Lacerate`, `Public Execution`, `Shadow Dash`, `Twilight Step`, `Up from the Deep`, `Iterative Design`, `Onslaught`, `Perfect Execution` |
| **`level`** (15) | `Combat Experience`, `Soul Sword`, `Honeyfruit`, `Wuju Apprentice`, `Skyward Strike`, `Concentrate`, `XP Tracker` |
| **`xp_spend`** (10) | `Blood Rose`, `Shepherd's Heirloom`, `Insightful Investigator`, `Kha'Zix, Evolving Hunter`, `Safety Inspector`, `Conscription` |
| **`hold`** (18) | `Trevor Snoozebottom`, `World Atlas`, `Trinity Force`, `Blue Sentinel`, `Ivern, Nurturer`, `Ornn, Blacksmith`, `Rumble, Scrapper`, `Shen, Scourge of Shadows`, `Dunebreaker`, `Vilemaw` |

⚠️ **`hold` is the one to watch.** Eighteen cards reward *holding*, which requires surviving a
full turn cycle on a battlefield. In an aggressive deck they are close to blank — and
`hold`-payoff cards look deceptively like ordinary value cards.

## 4. Stats vs text — which is the card?

Measured against the **Might median for each total cost**:

| | Units | Meaning |
|---|---|---|
| Above curve | ~130 | Stats *are* the card. `Cruel Patron` (4E, **M6** — pays with a friendly unit), `Galio, Indefatigable` (3E1P, **M6**, `Deflect`), `Mountain Drake` (9E, **M10**, vanilla) |
| Par | ~365 | Balanced |
| **Below curve** | **134 (21%)** | **The text is the card.** `Cithria of Cloudfield` (2E, M1), `Keeper of Masks` (2E, M1), `Carrion Dredger` (2E, M1) |

🔎 **derived:** a fifth of all units are *paying* Might for their ability. This is the cleanest
signal EE has for *"is this card doing something, or is it a body?"* — and it separates
"filler" from "engine piece" without any judgement call.

⚠️ **Caveat:** below-curve is not bad. It means the card is bought for its text, so its value
depends entirely on whether the deck can use that text. A below-curve card whose consumer
tag is unsupported is the worst card in a deck; the same card in the right shell is the best.

## 5. How EE uses this

| EE question | Uses |
|---|---|
| **Q-CARD** (*what's this good at?*) | role + produces + consumes + curve position |
| **Q-DECK** (*how do I pilot this?*) | aggregate role distribution + timing count |
| **Q-BUILD** (*what should I change?*) | **unmet consumers** — a card wanting `flow` in a deck producing no `burn`/`discard` is a **FACT**-tier dead card |
| **Q-LEGEND** (*what fits?*) | match the Legend's consumer tag against pool producers |
| **Q-THREAT** / refutation search | the **211** `Action`/`Reaction`/`Hidden` cards, nothing else |
| **Q-SIDEBOARD** | swap by consumer tag — bring `gear_matters` removal against gear decks |

## 6. Reproducibility

The classification is generated from the cached gallery by a documented regex-based
classifier over each card's `richText` **plus** its `effect` text (Equipment abilities live in
the latter and would otherwise be missed). Every tag is a pure function of card text, so the
index regenerates from scratch whenever the card pool updates — no hand-maintenance beyond the
~153 effect annotations noted in [`../spec/EVALUATION.md`](../spec/EVALUATION.md) §9.

⚠️ **Known limits of the automated pass:**
- Regexes classify *presence*, not *magnitude* — `Deal 1` and `Deal 12` both tag `damage`
- Conditional text is not distinguished from unconditional
- The `mighty` and `gear_matters` tags over-match slightly (reminder text mentions them)

These are acceptable for **shortlisting**; the duel resolver and the effect annotations
supply exact values where precision matters.

---

## 7. The index

Full per-card classification follows, **grouped by role** and sorted by cost. Every one of the
814 names appears exactly once.

Format: `cost` · `Might` · **name** · `[domains]` · produces → consumes

### removal-kill (33)

- `1E0P`    **Sacrifice** `[order]` `Reaction` — rune,draw,kill → mighty
- `2E0P`    **Blood Money** `[order]` `Action` — token,gold,kill → gear_matters,token_matters
- `2E0P`    **Deathgrip** `[order]` `Reaction` — draw,kill,pump → -
- `1E1P`    **Detonate** `[fury]` — kill → gear_matters
- `2E0P`    **Shadow's Call** `[order]` — draw,kill,temporary → -
- `2E0P`    **Turn to Dust** `[mind]` — kill,temporary → gear_matters
- `2E1P`    **Brittle Steel** `[fury]` — banish,kill,trashplay → gear_matters,trash_matters,flow
- `2E1P`    **Decree of Unity** `[order]` — kill → gear_matters
- `3E0P`    **Fox-Fire** ★ `[calm/mind]` `Action` — kill → hidden
- `2E1P`    **Heedless Resurrection** `[chaos]` `Reaction` — kill,trashplay → trash_matters
- `2E1P`    **Hidden Blade** `[order]` `Action` — kill → hidden
- `2E1P`    **Ki Barrier** `[order]` `Reaction` — kill → -
- `2E1P`    **Lacerate** `[order]` — banish,kill,trashplay → empowered,trash_matters,flow
- `2E1P`    **Public Execution** ★ `[body/order]` — banish,kill,trashplay → trash_matters,flow
- `2E1P`    **Salvage** `[order]` `Action` — draw,kill → gear_matters
- `2E1P`    **Soul Harvest** `[order]` — kill → -
- `3E0P`    **Sprite Call** `[mind]` `Action` — token,kill,ready,temporary → hidden,token_matters
- `4E0P`    **Deadly Flourish** `[mind]` `Reaction` — token,gold,damage,kill,ramp_power → gear_matters,token_matters,death
- `3E1P`    **Last Stand** `[calm]` `Action` — kill,temporary → -
- `4E1P`    **Death from Below** ★ `[chaos/fury]` — kill,trashplay → trash_matters
- `4E1P`    **Fading Memories** `[chaos]` — kill,temporary → gear_matters
- `3E2P`    **Mirror Image** ★ `[mind/order]` — token,kill,ready,temporary → token_matters
- `4E1P`    **Noxian Guillotine** ★ `[fury/order]` `Action` — kill → legion
- `4E1P`    **Rocket Barrage** `[mind]` — damage,kill → gear_matters
- `5E0P`    **Sprite Burst** `[mind]` — kill,ready,temporary → -
- `5E1P`    **Drag Under** `[order]` `Action` — kill → -
- `4E2P`    **Vengeance** `[order]` — kill → -
- `6E1P`    **Blast of Power** `[order]` `Action` — kill → -
- `5E2P`    **Imperial Decree** `[order]` `Action` — kill → -
- `5E2P`    **Thermo Beam** `[fury]` `Action` — kill → gear_matters
- `6E2P`    **King's Edict** `[order]` — kill → -
- `8E3P`    **Cataclysmic Duel** `[body]` — kill → -
- `9E3P`    **The Ruination** `[order]` — kill → -

### removal-damage (39)

- `1E0P`    **Flurry of Blades** `[body]` `Reaction` — damage → -
- `1E1P`    **Bellows Breath** `[mind]` `Action` — damage → -
- `2E0P`    **Consuming Curse** `[fury]` `Action` — damage → trash_matters
- `1E1P`    **Decree of Rage** `[fury]` `Action` — damage → -
- `1E1P`    **Hextech Ray** `[fury]` `Action` — damage → -
- `2E0P`    **Incinerate** `[fury]` `Action` — damage → -
- `1E1P`    **Monster Harpoon** `[fury]` `Action` — damage → hidden
- `1E1P`    **Shuriken Flip** ★ `[calm/fury]` — banish,damage,move,trashplay → trash_matters,flow
- `2E1P`    **Cannon Barrage** `[body]` `Reaction` — damage → -
- `2E1P`    **Challenge** `[body]` `Action` — damage → -
- `2E1P`    **Dancing Grenade** `[fury]` — damage → -
- `3E0P`    **Marching Orders** `[body]` `Action` — damage → -
- `2E1P`    **Piercing Light** `[fury]` — damage → -
- `3E0P`    **Rampage** `[body]` — damage,pump → -
- `3E0P`    **Ruthless Strike** `[fury]` `Action` — discard,damage → -
- `2E1P`    **Shakedown** `[fury]` `Reaction` — draw,damage → -
- `2E1P`    **Smite** `[fury]` `Action` — banish,damage → death
- `3E0P`    **Sudden Storm** `[fury]` `Action` — damage → hidden
- `3E0P`    **Wages of Pain** `[mind]` `Action` — token,gold,damage → gear_matters,hidden,token_matters
- `3E1P`    **Arcane Shift** ★ `[chaos/mind]` `Action` — banish,damage → -
- `3E1P`    **Crescent Strike** `[mind]` `Action` — damage → -
- `4E0P`    **Curtain Call** ★ `[fury/mind]` — draw,damage,shrink → -
- `4E0P`    **Disintegrate** `[fury]` `Action` — draw,damage → -
- `2E2P`    **Falling Star** `[fury]` — damage → -
- `3E1P`    **Shock Blast** `[mind]` `Action` — damage → empowered
- `4E0P`    **Siphoning Strike** ★ `[calm/mind]` — rune,damage → death
- `3E1P`    **Void Seeker** `[fury]` `Action` — draw,damage → -
- `4E1P`    **Dragon's Rage** ★ `[body/calm]` — damage,move → -
- `5E0P`    **Falling Comet** `[mind]` `Action` — damage → -
- `4E1P`    **Super Mega Death Rocket!** ★ `[chaos/fury]` — discard,damage,trashplay → trash_matters,conquer
- `6E1P`    **Firestorm** `[fury]` — damage → -
- `6E1P`    **Gentlemen's Duel** `[body]` `Action` — damage,pump → -
- `6E2P`    **Clash of Giants** `[body]` — damage → -
- `8E0P`    **Final Spark** ★ `[mind/order]` `Action` — damage → -
- `6E2P`    **Singularity** `[mind]` — damage → -
- `6E2P`    **Stormbringer** ★ `[body/fury]` — damage,move → -
- `8E1P`    **Sky Splitter** `[fury]` `Action` — damage → -
- `7E2P`    **Unchecked Power** `[mind]` — damage → -
- `7E3P`    **Icathian Rain** ★ `[fury/mind]` — damage → -

### counter (8)

- `2E0P`    **Abandon** `[chaos]` `Reaction` — bounce,counter → -
- `1E1P`    **Crumbling Sands** `[calm]` `Reaction` — counter → -
- `1E1P`    **Defy** `[calm]` `Reaction` — counter → -
- `2E0P`    **Hard Bargain** `[chaos]` `Reaction` — counter → -
- `2E2P`    **Lilting Lullaby** ★ `[calm/mind]` `Reaction` — counter → -
- `2E2P`    **Riposte** ★ `[body/order]` `Reaction` — pump,counter → -
- `3E2P`    **Wind Wall** `[calm]` `Reaction` — counter → -
- `4E2P`    **Flurry of Feathers** `[calm]` `Reaction` — counter → -

### combat-trick (42)

- `1E0P`    **Blood Rush** `[fury]` `Action` — pump → -
- `1E0P`    **Cleave** `[fury]` `Action` — pump → -
- `1E0P`    **Combat Experience** `[calm]` `Reaction` — pump → level
- `1E0P`    **Decree of Focus** `[calm]` `Reaction` — pump → -
- `1E0P`    **Decree of Insight** `[mind]` `Reaction` — shrink → -
- `1E0P`    **En Garde** `[calm]` `Reaction` — pump → -
- `1E0P`    **Friendship** `[calm]` `Reaction` — pump → -
- `1E0P`    **Stupefy** `[mind]` `Reaction` — draw,shrink → -
- `1E0P`    **Twilight Shroud** `[calm]` — banish,pump,trashplay → trash_matters,flow
- `2E0P`    **Against the Odds** `[fury]` `Reaction` — pump → -
- `2E0P`    **Block** `[calm]` `Action` — pump → hidden
- `2E0P`    **Bonds of Strength** `[order]` `Reaction` — pump → -
- `1E1P`    **Danger Zone** ★ `[fury/mind]` `Reaction` — pump → -
- `1E1P`    **Defiant Dance** ★ `[calm/chaos]` `Reaction` — pump,shrink → -
- `2E0P`    **Discipline** `[calm]` `Reaction` — draw,pump → -
- `2E0P`    **Feral Strength** `[calm]` `Reaction` — pump → -
- `2E0P`    **Frigid Touch** `[mind]` `Reaction` — shrink → -
- `2E0P`    **Grim Resolve** `[body]` `Action` — xp,pump → -
- `2E0P`    **Guttural Roar** `[body]` `Action` — pump → empowered
- `1E1P`    **Mesmerize** `[mind]` `Reaction` — bounce,shrink → -
- `2E0P`    **Rally the Troops** `[order]` `Action` — buff,draw,pump → -
- `1E1P`    **Showstopper** ★ `[body/order]` — buff,move,pump → -
- `1E1P`    **Vault Breaker** `[fury]` `Action` — move,pump → -
- `3E0P`    **Back to Back** `[order]` `Reaction` — pump → -
- `3E0P`    **Call to Glory** `[order]` `Reaction` — buff,pump → buff_spend
- `3E0P`    **Eclipse** `[mind]` `Reaction` — shrink → -
- `3E0P`    **Heroic Charge** `[order]` `Action` — stun,pump → -
- `1E2P`    **Punch First** `[body]` `Action` — pump → -
- `2E1P`    **Resonating Strike** `[calm]` `Reaction` — move,pump → hidden
- `2E1P`    **Shadow Dash** ★ `[calm/order]` — banish,move,pump,trashplay → trash_matters,flow
- `2E1P`    **Siphon Power** ★ `[mind/order]` `Reaction` — pump,shrink → -
- `2E1P`    **Smoke Screen** `[mind]` `Reaction` — shrink → -
- `3E0P`    **Stand United** `[calm]` `Action` — buff,pump → hidden
- `3E1P`    **Moonfall** ★ `[chaos/mind]` `Action` — move,shrink → -
- `4E0P`    **Onslaught** `[body]` — banish,pump,trashplay → trash_matters,flow
- `3E1P`    **Perfect Execution** `[fury]` — banish,ready,pump,trashplay → trash_matters,flow
- `4E0P`    **Square Up** `[fury]` — discard,pump → -
- `4E1P`    **Primal Strength** `[body]` `Action` — pump → -
- `5E1P`    **Decisive Strike** ★ `[body/order]` `Action` — pump → -
- `7E0P`    **Moonlight Affliction** `[mind]` `Reaction` — shrink → -
- `5E2P`    **Overt Operation** `[body]` `Action` — buff,ready,pump → buff_spend
- `6E3P`    **Grand Strategem** `[order]` `Action` — pump → -

### tempo (25)

- `1E0P`    **Factory Recall** `[chaos]` `Action` — bounce → gear_matters
- `1E0P`    **Gust** `[chaos]` `Reaction` — bounce → -
- `1E0P`    **Retreat** `[mind]` `Reaction` — bounce → -
- `1E1P`    **Charm** `[calm]` — move → -
- `2E0P`    **Emperor's Divide** `[calm]` `Action` — move → hidden
- `1E1P`    **Existential Dread** `[chaos]` `Action` — stun,bounce → -
- `2E0P`    **Fight or Flight** 🚫 `[chaos]` `Action` — move → hidden
- `2E0P`    **Flash** `[chaos]` `Reaction` — move → -
- `2E0P`    **Stare Down** `[body]` — xp,move → -
- `2E0P`    **Tactical Retreat** `[order]` `Reaction` — move → -
- `2E0P`    **Temptation** `[chaos]` — move → -
- `3E0P`    **Call to Battle** `[body]` — move → -
- `2E1P`    **Relentless Pursuit** ★ `[body/fury]` `Action` — move → gear_matters,conquer
- `2E1P`    **Ride the Wind** `[chaos]` `Action` — move,ready → -
- `2E1P`    **Skyward Strike** `[calm]` — stun,move → level
- `2E1P`    **Twilight Step** `[chaos]` — banish,move,trashplay → trash_matters,flow
- `2E1P`    **Void Assault** ★ `[body/chaos]` — move → -
- `4E0P`    **Highlander** ★ `[body/calm]` `Reaction` — move → -
- `2E2P`    **Rebuke** `[chaos]` `Action` — bounce → -
- `3E1P`    **Whirlwind** `[chaos]` — bounce → -
- `3E1P`    **Wind and Ghosts** `[chaos]` `Action` — banish,bounce → -
- `4E1P`    **Tricksy Tentacles** `[calm]` — move → -
- `3E2P`    **Zenith Blade** ★ `[calm/order]` `Action` — stun,move → -
- `5E2P`    **Hostile Takeover** ★ `[mind/order]` `Hidden` — move,ready → hidden
- `8E3P`    **Possession** `[chaos]` `Action` — move → -

### card-draw (26)

- `1E0P`    **Lightning Rush** ★ `[chaos/order]` — draw,banish,trashplay → trash_matters,flow
- `2E0P`    **Angle Shot** `[fury]` `Reaction` — draw → gear_matters
- `2E0P`    **Confront** `[body]` `Action` — draw,ready → -
- `2E0P`    **Disposal Order** `[body]` `Reaction` — draw → -
- `2E0P`    **Double Trouble** `[calm]` — draw → -
- `2E0P`    **Downstage Dramatics** `[mind]` `Reaction` — draw → -
- `2E0P`    **Dredge Up** `[mind]` — draw,banish,trashplay → trash_matters,flow
- `2E0P`    **Isolate** `[chaos]` — draw,move → -
- `2E0P`    **Meditation** `[calm]` `Reaction` — draw → -
- `2E0P`    **Mobilize** `[body]` — rune,draw → -
- `2E0P`    **Smoke and Mirrors** `[mind]` `Action` — draw,move,temporary → hidden
- `3E0P`    **Back Off** `[calm]` `Action` — draw,stun → hidden
- `2E1P`    **Counter Strike** ★ `[body/calm]` `Reaction` — draw → -
- `3E0P`    **Find Your Center** `[calm]` `Action` — rune,draw → -
- `3E0P`    **Lunar Boon** `[chaos]` `Reaction` — draw,discard → -
- `3E0P`    **Party Favors** `[calm]` — rune,draw → -
- `2E1P`    **Show of Strength** `[body]` `Reaction` — draw → mighty
- `4E0P`    **Catalyst of Aeons** `[body]` — rune,draw → -
- `4E0P`    **Consult the Past** `[mind]` `Reaction` — draw → hidden
- `3E1P`    **Right of Conquest** `[fury]` — draw → -
- `5E0P`    **Concentrate** `[body]` — draw → level
- `2E3P`    **Premonition** `[mind]` `Reaction` — draw → -
- `4E1P`    **Production Surge** `[mind]` — token,draw → token_matters
- `4E1P`    **Spoils of War** `[body]` `Reaction` — draw → -
- `7E0P`    **Clairvoyance** `[mind]` `Reaction` — draw → -
- `6E1P`    **Progress Day** `[mind]` — draw → -

### token-maker (6)

- `2E0P`    **Desert's Call** `[calm]` — token → token_matters
- `2E1P`    **Bushwhack** `[fury]` `Hidden` — token,gold,ready → gear_matters,hidden,token_matters
- `2E1P`    **Death Mark** ★ `[chaos/fury]` — token,banish,burn,trashplay → trash_matters,token_matters,attack,flow
- `3E0P`    **Guards!** `[order]` `Hidden` — token,ready → hidden,token_matters
- `4E0P`    **Iterative Design** `[mind]` — token,banish,trashplay → trash_matters,token_matters,flow
- `6E1P`    **Arise!** ★ `[calm/order]` — token,ready → gear_matters,token_matters

### equipment (40)

- `1E0P`    **Cloth Armor** `[mind]` `Reaction` — pump → gear_matters
- `1E0P`    **Cull** `[chaos]` — token,gold → gear_matters,token_matters,conquer
- `1E0P`    **Doran's Ring** `[chaos]` — draw,discard → gear_matters,conquer
- `1E0P`    **Doran's Shield** `[calm]` — - → gear_matters
- `1E0P`    **Experimental Hexplate** `[mind]` — - → gear_matters
- `1E0P`    **Eye of the Herald** `[order]` — token,move → gear_matters,token_matters,move_trigger
- `1E0P`    **Serrated Dirk** `[fury]` — pump → gear_matters
- `1E0P`    **Soul Sword** `[calm]` — pump → level,gear_matters
- `1E0P`    **Warmog's Armor** `[body]` — buff,pump → gear_matters,conquer
- `2E0P`    **Brutalizer** `[calm]` — pump → gear_matters
- `2E0P`    **Doran's Blade** `[body]` — - → gear_matters
- `2E0P`    **Guardian Angel** `[calm]` — kill → gear_matters,death
- `2E0P`    **Hand Hammer** `[calm]` — pump → gear_matters
- `2E0P`    **Hexdrinker** `[body]` — - → gear_matters
- `2E0P`    **Recurve Bow** `[fury]` — damage → gear_matters,attack
- `2E0P`    **Shepherd's Heirloom** `[order]` — xp → xp_spend,gear_matters
- `3E0P`    **Boneshiver** `[body]` — rune → gear_matters,conquer
- `3E0P`    **Boots of Swiftness** `[chaos]` — move → gear_matters
- `3E0P`    **Edge of Night** `[chaos]` `Hidden` — - → gear_matters,hidden
- `3E0P`    **Hextech Gauntlets** ★ `[fury/order]` — draw → gear_matters,conquer
- `3E0P`    **Hunter's Machete** `[body]` — xp → gear_matters,conquer
- `3E0P`    **Jagged Cutlass** `[body]` — - → -
- `3E0P`    **Last Rites** `[chaos]` — trashplay → gear_matters,trash_matters,conquer
- `2E1P`    **Long Sword** `[fury]` `Reaction` — - → gear_matters
- `3E0P`    **Pendulum Blade** `[fury]` — move,pump → gear_matters,move_trigger
- `2E1P`    **Sacred Shears** `[order]` — draw → gear_matters,death
- `3E0P`    **Skyfall of Areion** `[fury]` — - → gear_matters
- `2E1P`    **Spinning Axe** ★ `[chaos/fury]` `Reaction` — kill,temporary → gear_matters
- `3E0P`    **The Zero Drive** `[mind]` — banish → gear_matters,death
- `3E0P`    **World Atlas** `[mind]` — gold → gear_matters,hold
- `4E0P`    **B.F. Sword** `[order]` — - → gear_matters
- `3E1P`    **Blade of the Ruined King** `[order]` — kill → gear_matters
- `4E0P`    **Blighted Battleaxe** `[fury]` — damage → gear_matters
- `4E0P`    **Shady Spectacles** `[order]` — - → gear_matters
- `3E1P`    **Svellsongur** `[calm]` — - → gear_matters
- `4E0P`    **Trinity Force** `[body]` — point → gear_matters,hold
- `3E2P`    **Sterak's Gage** `[calm]` `Reaction` — - → gear_matters
- `4E2P`    **Forgefire Cape** ★ `[calm/mind]` — damage → gear_matters,attack
- `4E2P`    **Rabadon's Deathcrown** ★ `[calm/mind]` — damage → gear_matters
- `4E2P`    **Shurelya's Requiem** ★ `[calm/mind]` — move,ready → gear_matters

### gear (55)

- `1E0P`    **Blood Rose** `[body]` — xp,ready → xp_spend,unit_played
- `1E0P`    **Chemtech Cask** `[mind]` — token,gold → gear_matters,token_matters,spell_played
- `1E0P`    **Orb of Regret** `[mind]` — shrink → -
- `1E0P`    **Scryer's Bloom** `[chaos]` — xp,draw,kill → -
- `1E0P`    **Symbol of the Solari** `[order]` — move → -
- `1E0P`    **The List** `[chaos]` — shrink → -
- `2E0P`    **Altar of Memories** `[order]` — draw → death
- `2E0P`    **Divining Shells** `[order]` `Action` — kill,pump → -
- `2E0P`    **Forge of the Future** `[order]` — token,kill,trashplay → token_matters
- `2E0P`    **Forgotten Signpost** `[calm]` `Action` — move → -
- `2E0P`    **Fresh Beans** `[fury]` — draw → unit_played
- `2E0P`    **Frigid Jewel** `[mind]` — pump → -
- `2E0P`    **Garbage Grabber** `[mind]` — draw,trashplay → trash_matters
- `2E0P`    **Glowstone** `[order]` — empower,damage,kill → -
- `2E0P`    **Hextech Formula** `[mind]` — empower → gear_matters
- `2E0P`    **Mask of Foresight** `[calm]` — pump → -
- `2E0P`    **Mushroom Pouch** `[mind]` — draw → hidden
- `2E0P`    **Pack of Wonders** `[chaos]` `Hidden` — bounce → gear_matters,hidden
- `2E0P`    **Petricite Monument** `[body]` — kill,temporary → -
- `1E1P`    **Poro Snax** `[calm]` — draw,kill → -
- `2E0P`    **Scrapheap** 🚫 `[chaos]` — draw → -
- `2E0P`    **Spirit Wheel** `[chaos]` — draw → -
- `2E0P`    **Sumpworks Map** `[mind]` `Reaction` — draw,kill,temporary → -
- `2E0P`    **The Syren** `[chaos]` — move → -
- `2E0P`    **Treasure Trove** `[chaos]` — rune,draw,kill → -
- `2E0P`    **Unlicensed Armory** `[fury]` — discard,move → -
- `2E0P`    **Vanguard Helm** `[order]` — buff,pump → death
- `2E0P`    **Zhonya's Hourglass** `[calm]` `Hidden` — kill,move → hidden,death
- `3E0P`    **Arena Bar** `[body]` — buff,pump → -
- `3E0P`    **Baited Hook** `[order]` — banish,kill → -
- `3E0P`    **Iron Ballista** `[fury]` — damage → -
- `3E0P`    **Mistfall** `[body]` — buff,ready → -
- `3E0P`    **Pirate's Haven** `[body]` — ready,pump → -
- `3E0P`    **Questionable Tome** `[mind]` — draw,empower → -
- `3E0P`    **Ravenborn Tome** `[fury]` — - → -
- `3E0P`    **Solari Shrine** `[calm]` — draw,kill → -
- `2E1P`    **Spirit's Refuge** `[calm]` — buff,pump → -
- `2E1P`    **Sprite Fountain** `[mind]` — token,kill,ready,temporary → gear_matters,token_matters,death
- `2E1P`    **Sun Disc** `[fury]` — ready → legion
- `3E0P`    **Temporal Portal** `[mind]` — - → -
- `4E0P`    **Assembly Rig** `[fury]` — token,trashplay → trash_matters,token_matters
- `4E0P`    **Gutter Palace** `[mind]` — token,discard,point → token_matters
- `3E1P`    **Heart of Dark Ice** `[calm]` — pump → -
- `4E0P`    **Tools of Empire** `[body]` — empower,pump → empowered
- `4E1P`    **Blast Cone** `[chaos]` — stun,move → move_trigger
- `4E1P`    **Cursed Sarcophagus** `[chaos]` — banish,trashplay → trash_matters
- `5E0P`    **Forgotten Relic** `[chaos]` — burn,pump → -
- `4E1P`    **Helm of Suppression** `[calm]` — empower → empowered
- `4E1P`    **Hextech Disc** `[body]` — token,empower → token_matters
- `4E1P`    **Rage Amplifier** `[fury]` — empower,pump → empowered
- `5E1P`    **Endless Riches** `[fury]` — banish,burn,trashplay → trash_matters
- `6E0P`    **Shard of Undoing** `[order]` — kill → -
- `7E1P`    **Vanguard Armory** `[order]` — - → -
- `9E2P`    **Dazzling Aurora** `[body]` — - → -
- `10E2P`    **Bottled Constellation** `[mind]` — kill,point → gear_matters

### gear+ramp (12)

- `0E0P`    **Gold** `[colorless]` `Reaction` — kill,ramp_power → -
- `0E1P`    **Seal of Discord** `[chaos]` `Reaction` — ramp_power → -
- `0E1P`    **Seal of Focus** `[calm]` `Reaction` — ramp_power → -
- `0E1P`    **Seal of Insight** `[mind]` `Reaction` — ramp_power → -
- `0E1P`    **Seal of Rage** `[fury]` `Reaction` — ramp_power → -
- `0E1P`    **Seal of Strength** `[body]` `Reaction` — ramp_power → -
- `0E1P`    **Seal of Unity** `[order]` `Reaction` — ramp_power → -
- `2E0P`    **Honeyfruit** `[calm]` `Reaction` — ramp_energy,ramp_power → level
- `2E1P`    **Ancient Henge** `[body]` `Reaction` — - → -
- `3E0P`    **Energy Conduit** `[mind]` `Reaction` — ramp_energy → -
- `3E0P`    **Platewyrm Egg** `[body]` `Reaction` — empower,ramp_energy → empowered
- `3E1P`    **Hextech Anomaly** `[mind]` `Reaction` — - → -

### utility (56)

- `0E0P`    **Buff** `[colorless]` — buff → -
- `0E0P`    **XP Tracker** `[colorless]` — - → level
- `1E0P`    **Acceptable Losses** `[chaos]` `Action` — - → gear_matters
- `1E0P`    **Bullet Time** ★ `[body/chaos]` `Action` — - → -
- `0E1P`    **Called Shot** 🚫 `[chaos]` `Action` — - → -
- `1E0P`    **Decree of Strength** `[body]` — - → -
- `1E0P`    **Stacked Deck** `[chaos]` `Action` — - → -
- `1E1P`    **Decree of Discord** `[chaos]` — - → -
- `2E0P`    **Facebreaker** `[order]` `Action` — stun → hidden
- `2E0P`    **Lotus Trap** `[fury]` `Reaction` — - → hidden
- `2E0P`    **Morbid Return** `[chaos]` `Action` — trashplay → trash_matters
- `1E1P`    **Rebuttal** ★ `[chaos/mind]` `Reaction` — - → -
- `1E1P`    **Repulse** `[body]` `Reaction` — - → -
- `1E1P`    **Sabotage** `[body]` — - → -
- `2E0P`    **Thwonk!** `[calm]` `Action` — stun → -
- `1E1P`    **Unyielding Spirit** `[body]` `Reaction` — - → -
- `2E0P`    **Upstage Comedy** `[fury]` — ready → -
- `2E0P`    **Wallop** `[body]` `Action` — buff,ready → buff_spend
- `2E1P`    **Bone Skewer** `[chaos]` `Hidden` — stun → hidden
- `2E1P`    **Convergent Mutation** `[mind]` `Reaction` — - → -
- `2E1P`    **Cull the Weak** `[order]` — - → -
- `3E0P`    **Dragon Form** `[order]` — banish,trashplay → trash_matters,flow
- `2E1P`    **Get Excited!** `[fury]` `Action` — discard → -
- `2E1P`    **Guerilla Warfare** ★ `[chaos/mind]` `Hidden` — trashplay → trash_matters,hidden
- `2E1P`    **Here to Help** `[body]` `Action` — - → hidden
- `2E1P`    **Not So Fast** `[calm]` `Reaction` — - → gear_matters
- `1E2P`    **On the Hunt** ★ `[body/chaos]` — ready → -
- `2E1P`    **Rune Prison** `[calm]` `Action` — stun → -
- `2E1P`    **Temporal Breach** `[mind]` `Hidden` — banish → hidden
- `2E1P`    **Thrill of the Hunt** ★ `[body/fury]` `Reaction` — banish → -
- `2E1P`    **Undying Loyalty** `[order]` — trashplay → trash_matters
- `3E0P`    **Up from the Deep** `[chaos]` — banish,trashplay → trash_matters,flow
- `2E1P`    **Void Rush** ★ `[fury/order]` — - → -
- `3E1P`    **Acceleration Gate** ★ `[body/mind]` — ready → gear_matters
- `3E1P`    **Alpha Strike** ★ `[body/calm]` `Action` — xp → -
- `4E0P`    **Dominus** ★ `[body/fury]` `Action` — ready → -
- `3E1P`    **Invert Timelines** `[chaos]` — - → -
- `2E2P`    **Keeper's Verdict** ★ `[body/order]` `Action` — - → -
- `3E1P`    **Portal Rescue** `[mind]` `Action` — banish → -
- `3E1P`    **Sanction** `[calm]` `Reaction` — empower → empowered
- `3E1P`    **Shadows of the Past** `[chaos]` — trashplay → -
- `3E1P`    **Star-Crossed** `[chaos]` `Reaction` — - → -
- `3E1P`    **Strike Down** `[body]` — - → gear_matters
- `2E2P`    **Switcheroo** `[chaos]` `Action` — - → hidden
- `3E2P`    **Last Breath** ★ `[calm/chaos]` `Action` — ready → -
- `5E0P`    **Reinforce** `[calm]` — banish → -
- `4E2P`    **Blind Fury** `[fury]` `Action` — banish → -
- `5E1P`    **Promising Future** `[mind]` — - → -
- `6E0P`    **Recruit the Vanguard** `[order]` `Action` — - → -
- `5E2P`    **Conscription** `[chaos]` — - → xp_spend
- `4E3P`    **Mystic Reversal** `[calm]` `Reaction` — - → -
- `6E2P`    **The Harrowing** `[chaos]` — trashplay → trash_matters
- `7E1P`    **Wild Claw** `[body]` — empower,banish → gear_matters
- `7E2P`    **Divine Judgment** `[order]` — - → gear_matters
- `8E2P`    **Downwell** `[chaos]` — - → gear_matters
- `10E4P`    **Time Warp** `[mind]` — banish → -

### body+removal (55)

- `0E0P` M3 **Sprite** `[colorless]` — kill,temporary → -
- `2E0P` M2 **Blast Corps Cadet** `[fury]` — damage → -
- `2E0P` M1 **Keeper of Masks** `[mind]` `Hidden` — kill,temporary → hidden
- `2E0P` M2 **Mischievous Marai** `[fury]` `Hidden` — damage → hidden
- `2E0P` M1 **Noxian Demolitionist** `[body]` — kill → gear_matters,conquer
- `2E0P` M2 **Overzealous Fan** `[chaos]` — kill,move → defend
- `3E0P` M3 **Akali, Deadly Weapon** `[fury]` — empower,damage,move,pump → empowered,move_trigger
- `3E0P` M3 **Crackshot Corsair** `[body]` — damage → attack
- `3E0P` M3 **Escaped Grayback** `[order]` — empower,kill,pump → empowered
- `3E0P` M3 **Lillia, Fae Fawn** `[mind]` — token,kill,move,ready,temporary → token_matters,move_trigger
- `3E0P` M2 **Lucian, Gunslinger** `[fury]` — damage,pump → attack
- `3E0P` M3 **Pickpocket** `[mind]` — token,gold,kill → gear_matters,token_matters
- `2E1P` M2 **Teemo, Strategist** `[mind]` `Hidden` — damage → hidden,defend
- `3E0P` M3 **Trevor Snoozebottom** `[calm]` — token,kill,ready,temporary,pump → token_matters,hold
- `3E0P` M3 **Zaun Punk** `[order]` — kill → gear_matters
- `4E0P` M3 **Adaptatron** `[calm]` — buff,kill,pump → gear_matters,conquer
- `3E1P` M3 **Caitlyn, Patrolling** `[calm]` — damage → -
- `4E0P` M6 **Cruel Patron** `[order]` — kill → -
- `3E1P` M2 **Disarming Rake** `[calm]` — kill → gear_matters
- `3E1P` M3 **Immortal Phoenix** `[fury]` — kill,pump,trashplay → trash_matters
- `4E0P` M4 **Jayce, Man of Progress** `[mind]` — kill → gear_matters
- `3E1P` M1 **Kog'Maw, Caustic** `[chaos]` — damage → death
- `4E0P` M3 **Malzahar, Fanatic** `[mind]` `Action` — kill,ramp_power → gear_matters
- `3E1P` M3 **Riven, Shattered** `[calm]` — damage → gear_matters,attack
- `4E0P` M4 **Tomb-Raider Barbara** `[calm]` — kill → empowered,gear_matters
- `4E0P` M4 **Twisted Fate, Gambler** `[chaos]` — draw,damage,stun → attack
- `5E0P` M5 **Ambessa, Respected and Feared** `[order]` — empower,kill → empowered,attack
- `4E1P` M3 **Ezreal, Dashing** `[mind]` `Action` — damage,move → attack
- `4E1P` M3 **Sky Cruiser** `[mind]` — damage → gear_matters
- `4E1P` M3 **Sprite Mother** `[mind]` — token,kill,ready,temporary → token_matters
- `4E1P` M6 **Stalking Wolf** `[order]` `Reaction` — kill → -
- `5E0P` M5 **Xerath, Freed** `[fury]` — damage → -
- `5E1P` M4 **Annie, Fiery** `[fury]` — damage → -
- `5E1P` M5 **Katarina, Reckless** `[fury]` — damage,ready → hidden
- `5E1P` M5 **Kha'Zix, Evolving Hunter** `[body]` — xp,damage → xp_spend,attack
- `6E0P` M6 **Renekton, Rage Fueled** `[fury]` — damage,ready → attack
- `5E1P` M3 **Safety Inspector** `[order]` — kill → xp_spend
- `5E1P` M4 **Solari Chief** `[order]` — kill,stun → -
- `6E0P` M6 **Yeti Brawler** `[fury]` `Reaction` — gold,kill,ramp_power → gear_matters,conquer
- `5E1P` M5 **Yone, Blademaster** `[body]` — damage → gear_matters,conquer
- `5E2P` M6 **Carnivorous Snapvine** `[body]` — damage → -
- `6E1P` M6 **Ruined Rex** `[mind]` — damage → death
- `5E2P` M6 **Sandshifter** `[order]` — kill → -
- `6E1P` M6 **Udyr, Wildman** `[body]` — buff,damage,stun,ready → buff_spend
- `6E1P` M5 **Warwick, Hunter** `[body]` — kill,ready → attack
- `6E2P` M6 **Riptide Rex** `[mind]` — damage → -
- `7E1P` M6 **Sprite Queen** `[mind]` — token,kill,ready,temporary → token_matters
- `6E2P` M6 **Yasuo, Remorseful** `[calm]` — damage → attack
- `7E2P` M8 **Anivia, Primal** `[body]` — damage → attack
- `6E4P` M8 **Commander Ledros** `[order]` — kill,move → -
- `8E2P` M6 **Harnessed Dragon** `[order]` — kill → -
- `8E2P` M7 **Tibbers** ★ `[chaos/fury]` — damage → -
- `10E2P` M9 **Volibear, Furious** `[fury]` — damage → attack
- `10E3P` M7 **Atakhan** `[order]` — kill,move → attack
- `12E4P` M10 **Elder Dragon** `[body]` — damage,kill → -

### body+draw (47)

- `2E0P` M2 **Apprentice Smith** `[calm]` — draw,move → gear_matters,move_trigger
- `2E0P` M2 **Clockwork Keeper** `[calm]` — draw → -
- `2E0P` M2 **Lonely Poro** `[calm]` — draw → death
- `2E0P` M2 **Otterpus** `[mind]` — draw,point → -
- `2E0P` M2 **Patched Porobot** `[mind]` — draw → gear_matters
- `2E0P` M0 **Scuttle Crab** `[calm]` — xp,draw → hidden,death
- `2E0P` M2 **Traveling Merchant** `[chaos]` — draw,discard,move → move_trigger
- `2E0P` M2 **Unsung Hero** `[order]` — draw → mighty,death
- `2E0P` M1 **Watchful Sentry** `[mind]` — draw → death
- `2E0P` M2 **Wuju Apprentice** `[calm]` — xp,draw → level,conquer
- `3E0P` M3 **Affectionate Poro** `[calm]` — draw → -
- `3E0P` M3 **Diana, Lunari** `[mind]` — draw → -
- `3E0P` M3 **Evershade Stalker** `[chaos]` — draw,discard → -
- `3E0P` M3 **Insightful Investigator** `[chaos]` — draw → xp_spend
- `3E0P` M3 **Kinkou Initiate** `[body]` — draw → -
- `3E0P` M2 **Lecturing Yordle** `[mind]` — draw → -
- `3E0P` M3 **Loyal Poro** `[order]` — draw → death
- `3E1P` M3 **Buhru Captain** `[body]` — buff,draw,pump → -
- `3E1P` M4 **Corrupt Enforcer** `[chaos]` — draw,discard,move → move_trigger
- `3E1P` M4 **Covert Informant** `[mind]` — draw,empower,move → empowered,move_trigger
- `3E1P` M3 **Ezreal, Prodigy** `[chaos]` — draw,discard → -
- `4E0P` M4 **Kai'Sa, Survivor** `[fury]` — draw → conquer
- `3E1P` M3 **LeBlanc, Fragmented** `[order]` — draw,pump → death
- `3E1P` M4 **Nidalee, Cat Form** `[body]` `Reaction` — draw → -
- `3E1P` M3 **Poro Herder** `[calm]` — buff,draw,pump → -
- `4E0P` M3 **Stellacorn Herder** `[calm]` — draw,move → move_trigger
- `4E0P` M4 **Yordle Explorer** `[body]` — draw → -
- `5E0P` M4 **Fate Weaver** `[mind]` — draw → -
- `4E1P` M3 **Jax, Unrelenting** `[body]` — draw → gear_matters
- `4E1P` M4 **Mel, Newly Awakened** `[mind]` — draw,empower,shrink → empowered
- `5E0P` M4 **Pakaa Protector** `[calm]` — draw,move,pump → trash_matters,move_trigger
- `5E0P` M4 **Renata Glasc, Mastermind** `[mind]` — draw,point → -
- `6E0P` M5 **Cloud Drake** `[mind]` — draw → -
- `5E1P` M5 **Hwei, Brooding Painter** `[mind]` — draw,discard,move,ready,pump → gear_matters,move_trigger
- `5E1P` M4 **Ivern, Nurturer** `[calm]` — buff,draw → hold
- `5E1P` M5 **Ornn, Blacksmith** `[calm]` — draw → gear_matters,hold
- `5E1P` M5 **Scrapyard Champion** `[fury]` — draw,discard → legion
- `5E1P` M6 **Shen, Scourge of Shadows** `[calm]` — draw → hold
- `5E1P` M5 **Undercover Agent** `[chaos]` — draw,discard → death
- `5E2P` M5 **Jae Medarda** `[chaos]` — draw → -
- `6E1P` M5 **Wraith of Echoes** `[mind]` — draw → -
- `7E1P` M7 **Dunebreaker** `[fury]` — draw,ready → hold
- `8E0P` M8 **Eclipse Dragon** `[fury]` — draw,move,ready → move_trigger
- `8E1P` M7 **Rift Herald** `[order]` — draw,move → move_trigger,death
- `8E2P` M8 **Vilemaw** `[calm]` `Reaction` — draw → hold
- `9E2P` M9 **Kadregrin the Infernal** `[fury]` — draw → mighty
- `12E2P` M10 **Volibear, Imposing** `[body]` — draw,pump → -

### body+tokens (27)

- `2E0P` M1 **Carrion Dredger** `[order]` — token → token_matters,death
- `2E0P` M2 **Honest Broker** `[order]` — token,gold → gear_matters,token_matters,death
- `2E0P` M2 **Plundering Poro** `[mind]` — token,gold → gear_matters,token_matters,conquer
- `2E0P` M1 **Treasure Hunter** `[chaos]` — token,gold,move → gear_matters,token_matters,move_trigger
- `3E0P` M3 **Black Market Broker** `[chaos]` — token,gold → gear_matters,hidden,token_matters
- `3E0P` M3 **Card Sharp** `[mind]` — token,gold → gear_matters,token_matters
- `3E0P` M2 **Faithful Manufactor** `[order]` — token → token_matters
- `3E0P` M3 **Noxian Drummer** `[order]` — token,move → token_matters,move_trigger
- `3E0P` M3 **Pyke, Returned** `[chaos]` `Hidden` — token,gold → gear_matters,hidden,token_matters,death
- `4E0P` M4 **Azir, Sovereign** `[order]` — token,move,ready → token_matters,attack
- `4E0P` M4 **Draven, Vanquisher** 🚫 `[fury]` — token,gold,pump → gear_matters,token_matters,attack
- `4E0P` M3 **Frisky Hunter** `[calm]` — token → token_matters
- `4E0P` M2 **Royal Guard** `[order]` — token → token_matters
- `5E0P` M4 **Lillia, Protector of Dreams** `[calm]` — token,pump → token_matters
- `5E0P` M3 **Soul Shepherd** `[mind]` — token,pump → token_matters
- `4E1P` M3 **Viktor, Innovator** `[mind]` — token → token_matters
- `4E1P` M4 **Viktor, Leader** `[order]` — token → token_matters,death
- `5E0P` M6 **Walking Roost** `[chaos]` — token → token_matters
- `4E1P` M4 **Zed, From the Shadows** `[fury]` — token,discard,banish,trashplay → trash_matters,token_matters,attack
- `5E0P` M5 **Zed, Without a Sound** `[chaos]` `Action` — token,banish,move,trashplay → trash_matters,token_matters,conquer,attack
- `6E0P` M4 **Illaoi, Prophet of the Great Kraken** `[chaos]` — token,pump → token_matters
- `5E1P` M4 **Rumble, Scrapper** `[mind]` — token,pump → token_matters,hold
- `5E1P` M5 **Zilean, Time Mage** `[mind]` — token → token_matters
- `6E1P` M6 **Jayce, Brilliant Inventor** `[mind]` — token,ready → gear_matters,token_matters
- `6E1P` M6 **Swain, Visionary** `[mind]` — token,point → gear_matters,token_matters,conquer
- `7E1P` M7 **Fae Dragon** `[body]` — buff,token,gold,pump → buff_spend,gear_matters,token_matters
- `10E3P` M12 **Baron Nashor** `[chaos]` — token,pump → token_matters

### body+ramp (15)

- `2E0P` M1 **Dragonsoul Sage** `[body]` `Reaction` — ramp_energy → -
- `2E0P` M1 **Soaring Scout** `[order]` — rune → death
- `3E0P` M2 **Black Rose Dignitary** `[order]` — rune,pump → death
- `4E0P` M3 **Albus Ferros** `[order]` — buff,rune → -
- `4E0P` M4 **Baccai Witherclaw** `[body]` — rune,empower,pump → empowered,death
- `4E0P` M2 **Lux, Crownguard** `[order]` `Reaction` — ramp_energy → -
- `4E1P` M4 **Aphelios, Exalted** `[calm]` — buff,rune,ready → gear_matters
- `4E1P` M4 **Blue Sentinel** `[mind]` — pump,ramp_power → hold
- `4E1P` M4 **Jhin, Murderous Artist** `[fury]` — move,ramp_energy → move_trigger
- `4E1P` M4 **Qiyana, Victorious** `[body]` — rune,draw → conquer
- `5E1P` M6 **Nasus, Guardian of Knowledge** `[mind]` — rune → death
- `7E0P` M6 **Stormclaw Ursine** `[body]` — rune → -
- `7E0P` M6 **Tasty Faefolk** `[calm]` — rune,draw,ready → death
- `6E1P` M5 **Undertitan** `[order]` — pump,ramp_energy → -
- `7E2P` M8 **Sandstone Chimera** `[calm]` — rune → -

### body (328)

- `0E0P` M1 **Bird** `[colorless]` — - → -
- `0E0P` M1 **Recruit (DE)** `[colorless]` — - → -
- `0E0P` M1 **Recruit (NX)** `[colorless]` — - → -
- `0E0P` M1 **Recruit (ZN)** `[colorless]` — - → -
- `0E0P` M0 **Reflection** `[colorless]` — - → -
- `1E0P` M1 **Determined Sentry** `[body]` — move → -
- `1E0P` M0 **Steel Paws** `[calm]` — empower,pump → empowered
- `2E0P` M2 **Chemtech Enforcer** `[fury]` — discard,pump → -
- `2E0P` M1 **Cithria of Cloudfield** `[body]` — buff,pump → unit_played
- `2E0P` M2 **Daring Poro** `[order]` — pump → -
- `2E0P` M2 **Demacian Diplomat** `[body]` — xp → -
- `2E0P` M1 **Disciple of Shen** `[order]` `Hidden` — pump → hidden
- `2E0P` M2 **Enthralling Protector** `[order]` — buff,xp,pump → xp_spend,conquer
- `2E0P` M2 **Evelynn, Entrancing** `[chaos]` `Hidden` — move → hidden
- `2E0P` M2 **Forecaster** `[mind]` — - → -
- `2E0P` M2 **Forsaken Baccai** `[fury]` — pump → -
- `2E0P` M2 **Gem Jammer** `[fury]` — move → -
- `2E0P` M2 **Gemhand Hunter** `[body]` — xp,pump → level,conquer
- `2E0P` M2 **Gust Monk** `[chaos]` — banish,pump → -
- `2E0P` M2 **Icevale Archer** `[mind]` — shrink → attack
- `2E0P` M1 **Inferna** `[fury]` `Reaction` — pump → -
- `2E0P` M1 **Irresistible Faefolk** `[body]` — move → move_trigger
- `2E0P` M2 **Legion Marauder** `[body]` — empower,pump → empowered
- `2E0P` M2 **Legion Rearguard** `[fury]` — ready → -
- `2E0P` M1 **Mister Root** `[chaos]` — xp,move,ready → move_trigger
- `2E0P` M2 **Mournful Witness** `[calm]` — empower,pump → empowered
- `2E0P` M1 **Mutated Mouser** `[calm]` — pump → -
- `2E0P` M2 **Mystic Poro** `[chaos]` — - → -
- `2E0P` M2 **Noxian Emissary** `[order]` — empower → empowered,death
- `2E0P` M4 **Ol' Poro** `[calm]` — - → -
- `2E0P` M2 **Petal Pixie** `[mind]` — temporary,pump → -
- `2E0P` M2 **Pit Rookie** `[body]` — buff,pump → -
- `2E0P` M2 **Pouty Poro** `[fury]` — - → -
- `2E0P` M2 **Punching Poro** `[fury]` — empower,discard,pump → empowered
- `2E0P` M2 **Ravenbloom Student** `[mind]` — pump → spell_played
- `2E0P` M2 **Sea Monkey** `[body]` — buff,pump → -
- `2E0P` M2 **Shadow Fiend** `[fury]` — empower,pump → empowered
- `2E0P` M2 **Shadow Order Disciple** `[chaos]` — burn,move,pump → move_trigger
- `2E0P` M2 **Stalwart Poro** `[calm]` — pump → -
- `2E0P` M1 **Teemo, Scout** `[chaos]` `Hidden` — pump → hidden
- `2E0P` M2 **Tideturner** `[chaos]` `Hidden` — move → hidden
- `2E0P` M2 **Trifarian Gloryseeker** `[order]` — buff,pump → legion
- `2E0P` M2 **Trusty Ramhound** `[order]` — pump → -
- `2E0P` M2 **Veteran Poro** `[body]` — - → gear_matters
- `2E0P` M2 **Void Hatchling** `[fury]` — - → -
- `2E0P` M1 **Windsinger** `[chaos]` — bounce → -
- `3E0P` M3 **Allay, Eager Admirer** `[calm]` — - → -
- `3E0P` M3 **Apprentice Mage** `[mind]` — empower,pump → empowered
- `3E0P` M2 **Bewitching Spirit** `[chaos]` — discard → -
- `2E1P` M2 **Blastcone Fae** `[mind]` `Hidden` — shrink → hidden
- `3E0P` M3 **Bubble Bot** `[mind]` — ready → -
- `3E0P` M3 **Chakram Dancer** `[mind]` `Reaction` — pump → -
- `3E0P` M3 **Crimson Pigeons** `[order]` — pump → -
- `3E0P` M3 **Crowd Favorite** `[body]` — buff,xp,pump → xp_spend,conquer
- `3E0P` M3 **Dangerous Duo** `[fury]` — pump → legion
- `3E0P` M3 **Dune Surfer** `[fury]` — - → -
- `3E0P` M3 **Eager Apprentice** `[mind]` — - → spell_played
- `3E0P` M2 **Enthusiastic Promoter** `[calm]` — buff,pump → hold
- `2E1P` M3 **Fallen Feline** `[order]` — - → -
- `3E0P` M3 **Fiora, Worthy** `[order]` — ready → mighty
- `3E0P` M3 **First Mate** `[body]` — ready → -
- `3E0P` M3 **Flame Chompers** `[fury]` — - → discard_matters
- `3E0P` M3 **Frostcoat Cub** `[mind]` — shrink → -
- `3E0P` M3 **Frostcoat Mother** `[calm]` — empower,pump → empowered
- `3E0P` M3 **Grim Apothecary** `[fury]` `Reaction` — bounce → -
- `3E0P` M3 **Kayle, Justified** `[order]` — empower,pump → empowered
- `3E0P` M2 **Kennen, Keeper of Balance** `[order]` `Hidden` — stun,pump → hidden
- `3E0P` M3 **Laurent Bladekeeper** `[body]` — move → -
- `3E0P` M4 **Legion Quartermaster** `[calm]` — bounce → gear_matters
- `3E0P` M3 **Loyal Pup** `[chaos]` — move → defend
- `3E0P` M3 **Lucian, Merciless** `[body]` — ready → gear_matters
- `3E0P` M3 **Mask Mother** `[chaos]` — pump → discard_matters
- `3E0P` M3 **Nami, Headstrong** `[calm]` — buff,stun,ready → hold
- `3E0P` M3 **Noxus Saboteur** `[fury]` `Hidden` — - → hidden
- `3E0P` M3 **Pakaa Cub** `[body]` `Hidden` — - → hidden
- `3E0P` M3 **Pit Crew** `[mind]` — ready → gear_matters
- `3E0P` M1 **Prepared Neophyte** `[fury]` — pump → -
- `3E0P` M2 **Pyke, Dockside Butcher** `[fury]` `Hidden` — ready,pump → hidden
- `3E0P` M3 **Ravenbloom Prefect** `[chaos]` — banish → gear_matters
- `3E0P` M3 **Rek'Sai, Breacher** `[fury]` — ready,pump → -
- `3E0P` M3 **Repair Specialist** `[body]` — pump → gear_matters
- `3E0P` M3 **Ribbon Dancer** `[calm]` — move,pump → move_trigger
- `3E0P` M3 **Sentinel Adept** `[fury]` — - → gear_matters
- `3E0P` M3 **Serene Ascetic** `[calm]` — empower,pump → empowered
- `3E0P` M3 **Shadow** ★ `[calm/chaos]` `Action` — stun,ready → -
- `3E0P` M1 **Sharkling** `[fury]` — ready,pump → -
- `3E0P` M3 **Shipyard Skulker** `[chaos]` — - → -
- `2E1P` M1 **Sinister Poro** `[chaos]` — move → attack
- `3E0P` M2 **Sneaky Deckhand** `[chaos]` — - → -
- `3E0P` M2 **Solari Shieldbearer** `[calm]` — stun → -
- `3E0P` M3 **Solari Sunhawk** `[order]` — empower,pump → empowered
- `3E0P` M3 **Soulspinner** `[order]` `Reaction` — - → -
- `3E0P` M1 **Spiderling** `[chaos]` `Hidden` — pump → hidden
- `3E0P` M3 **Sunlit Guardian** `[calm]` — pump → -
- `3E0P` M3 **Tornado Warrior** `[chaos]` `Hidden` — empower → hidden
- `3E0P` M3 **Twilight Reveler** `[fury]` — ready → attack
- `3E0P` M3 **Undying Legion** `[fury]` — trashplay → legion,trash_matters
- `2E1P` M3 **Vi, Destructive** `[fury]` — pump,trashplay → trash_matters
- `3E0P` M3 **Void Drone** `[fury]` — - → -
- `3E0P` M2 **Wielder of Water** `[calm]` — pump → -
- `3E1P` M3 **Ahri, Inquisitive** `[mind]` — shrink → attack
- `4E0P` M4 **Akshan, Mischievous** `[body]` — move → gear_matters
- `4E0P` M4 **Ambessa, The Wolf** `[body]` — empower,pump → empowered
- `4E0P` M4 **Applied Researchers** `[mind]` — empower → empowered
- `3E1P` M3 **Aspiring Engineer** `[mind]` — trashplay → gear_matters,trash_matters
- `3E1P` M4 **Baccai Reaper** `[fury]` — pump → attack
- `4E0P` M4 **Blade Twirler** `[fury]` — burn,move → -
- `3E1P` M4 **Brutal Hunter** `[body]` — empower,move,pump → empowered
- `3E1P` M3 **Cemetery Attendant** `[chaos]` — trashplay → trash_matters
- `4E0P` M4 **Crescent Guardian** `[chaos]` — ready → -
- `4E0P` M4 **Dramatic Visionary** `[mind]` — - → death
- `4E0P` M4 **Dropboarder** `[mind]` — ready → gear_matters
- `3E1P` M3 **Eager Drakehound** `[fury]` — ready → -
- `4E0P` M4 **Ember Monk** `[chaos]` `Hidden` — pump → hidden
- `4E0P` M4 **Fae Porter** `[chaos]` — move → move_trigger
- `4E0P` M3 **Field Musicians** `[calm]` — pump → -
- `3E1P` M3 **Fiora, Peerless** `[body]` — - → attack
- `4E0P` M4 **Fiora, Victorious** `[order]` — - → mighty
- `3E1P` M3 **Fizz, Trickster** `[chaos]` — trashplay → trash_matters
- `3E1P` M6 **Galio, Indefatigable** `[order]` — - → -
- `3E1P` M3 **Gemcraft Seer** `[mind]` — - → -
- `4E0P` M4 **Grumpy Rockbear** `[mind]` — empower,pump → empowered
- `3E1P` M3 **Gustwalker** `[mind]` — xp,move,pump → level,conquer
- `4E0P` M4 **Harpoon Squad** `[chaos]` — move,pump → move_trigger
- `3E1P` M3 **Heimerdinger, Inventor** `[mind]` — - → gear_matters
- `4E0P` M3 **Herald of Scales** `[body]` — - → -
- `4E0P` M4 **Hungry Wolf** `[order]` — ready,pump → -
- `3E1P` M3 **Janna, Savior** `[calm]` `Reaction` — move → -
- `4E0P` M4 **Jhin, Meticulous Killer** `[mind]` — - → -
- `3E1P` M4 **Jinx, Demolitionist** `[fury]` — discard → -
- `3E1P` M3 **Karthus, Eternal** `[order]` — - → death
- `3E1P` M4 **Kennen, Storm of Shuriken** `[chaos]` — banish,burn,trashplay → trash_matters,conquer,flow
- `4E0P` M4 **Kinkou Lifeblade** `[chaos]` — empower,move,pump → empowered
- `4E0P` M3 **Laurent Duelist** `[order]` — pump → -
- `4E0P` M4 **LeBlanc, Everywhere at Once** `[mind]` — temporary → -
- `4E0P` M4 **Mageseeker Investigator** `[order]` — move → -
- `4E0P` M4 **Masa, Crashing Thunder** `[order]` — stun → -
- `4E0P` M4 **Master Yi, Tempered** `[body]` — xp → level
- `3E1P` M3 **Mosstomper** `[calm]` — xp,pump → level,conquer
- `4E0P` M4 **Navori Scout** `[calm]` — - → -
- `3E1P` M4 **Nilah, Joyful Ascetic** `[body]` — xp,move,ready → move_trigger
- `4E0P` M4 **Noxus Hopeful** `[fury]` — - → legion
- `4E0P` M4 **Oasis Raider** `[fury]` — move,pump → -
- `4E0P` M5 **Perched Grimwyrm** `[fury]` — - → -
- `4E0P` M4 **Profiteer** `[body]` — empower → gear_matters
- `4E0P` M4 **Raging Soul** `[fury]` — move,pump → discard_matters
- `4E0P` M4 **Rell, Magnetic** `[fury]` — - → gear_matters,attack
- `3E1P` M3 **Rengar, Pouncing** `[fury]` `Reaction` — pump → -
- `3E1P` M4 **Royal Entourage** `[calm]` — ready → -
- `4E0P` M4 **Rumble, Hotheaded** `[fury]` — pump,trashplay → trash_matters,conquer
- `3E1P` M3 **Scorchclaw** `[fury]` — xp,ready,pump → level,conquer
- `3E1P` M3 **Shen, Kinkou** `[order]` `Reaction` — pump → -
- `4E0P` M4 **Tail-Cloaked Matriarch** `[chaos]` — empower → empowered,trash_matters
- `4E0P` M3 **Towering Combatant** `[body]` — pump → -
- `3E1P` M3 **Vanguard Captain** `[order]` — - → legion
- `4E0P` M4 **Vanguard Sergeant** `[order]` — - → -
- `4E0P` M4 **Vex, Apathetic** `[chaos]` — stun,move → -
- `4E0P` M3 **Vi, Hotheaded** `[fury]` — - → -
- `4E0P` M3 **Wildclaw Shaman** `[body]` — buff,ready,pump → buff_spend
- `4E0P` M4 **Wily Newtfish** `[body]` — move,pump → -
- `4E0P` M4 **Wizened Elder** `[calm]` — pump → -
- `3E1P` M4 **Xin Zhao, Vigilant** `[order]` — ready → -
- `3E1P` M1 **Yuumi, Magical Cat** `[calm]` — pump → attack
- `4E1P` M4 **Akali, Silent** `[calm]` — move,pump → move_trigger
- `5E0P` M4 **Ancient Warmonger** `[chaos]` — ready,pump → -
- `4E1P` M3 **Annie, Stubborn** `[chaos]` — trashplay → trash_matters
- `5E0P` M3 **Arena Kingpin** `[fury]` — ready,pump → -
- `5E0P` M5 **Aurok General** `[order]` — empower,pump → empowered
- `5E0P` M4 **Ava Achiever** `[mind]` `Hidden` — - → hidden,attack
- `4E1P` M5 **Bandle Soldier** `[order]` — ready → level
- `4E1P` M4 **Bard, Mercurial** `[mind]` — move → -
- `5E0P` M5 **Battering Ram** `[fury]` — - → -
- `5E0P` M5 **Blazing Scorcher** `[fury]` — ready → -
- `4E1P` M5 **Captain Farron** `[fury]` — pump → -
- `5E0P` M5 **Combat Chef** `[body]` — - → gear_matters
- `5E0P` M5 **Dame the Despoiler** `[body]` — empower,pump → empowered,attack
- `4E1P` M4 **Dauntless Vanguard** `[body]` — - → -
- `4E1P` M3 **Diana, No Longer Human** `[chaos]` — pump → spell_played
- `5E0P` M5 **Dune Drake** `[body]` — ready,pump → attack
- `5E0P` M5 **Esteemed Hierophant** `[calm]` — - → -
- `5E0P` M3 **Gearhead** `[mind]` — ready → gear_matters
- `4E1P` M4 **Herald of Spring** `[calm]` — xp → conquer
- `5E0P` M5 **Imposing Challenger** `[body]` — move → move_trigger
- `5E0P` M4 **Irelia, Fervent** `[calm]` — ready,pump → -
- `4E1P` M4 **Irelia, Graceful** `[chaos]` — - → -
- `4E1P` M5 **Jayce, Hammer in Hand** `[body]` — move,ready,pump → -
- `5E0P` M5 **Jeweled Colossus** `[mind]` — pump → -
- `4E1P` M3 **Kato the Arm** `[body]` — move,pump → move_trigger
- `4E1P` M4 **Kha'Zix, Mutating Horror** `[chaos]` `Reaction` — xp,pump → attack
- `4E1P` M4 **Kinkou Monk** `[body]` — buff,pump → -
- `3E2P` M5 **Kraken Hunter** `[body]` — buff,ready,pump → -
- `4E1P` M4 **Leona, Determined** `[order]` — stun → attack
- `5E0P` M4 **Maddened Marauder** `[chaos]` — move → -
- `5E0P` M4 **Mel, Defiant Soul** `[chaos]` — empower,banish → empowered
- `5E0P` M5 **Minotaur Reckoner** `[fury]` — move → -
- `4E1P` M4 **Miss Fortune, Buccaneer** `[chaos]` — - → -
- `4E1P` M4 **Nocturne, Horrifying** `[chaos]` — move → -
- `5E0P` M5 **Petty Officer** `[order]` — pump → -
- `5E0P` M5 **Playful Phantom** `[calm]` — - → -
- `5E0P` M5 **Poppy, Paragon** `[body]` — xp,ready → -
- `4E1P` M3 **Prize of Progress** `[mind]` — pump → gear_matters
- `4E1P` M4 **Red Brambleback** `[fury]` — buff,ready,pump → conquer
- `4E1P` M3 **Reluctant Leader** `[order]` — pump → unit_played
- `4E1P` M4 **Renata Glasc, Industrialist** `[order]` — ready → -
- `5E0P` M4 **Renekton, Brute** `[body]` — empower,pump → empowered
- `4E1P` M4 **Rengar, Unseen** `[fury]` — - → -
- `4E1P` M6 **Sacred Protector** `[order]` — - → -
- `4E1P` M5 **Sett, Kingpin** `[order]` — pump → -
- `5E0P` M5 **Shadow Assassin** `[fury]` — ready → trash_matters
- `4E1P` M5 **Shadow Watcher** `[calm]` — ready → -
- `5E0P` M5 **Shadowblade Lurker** `[chaos]` — - → trash_matters
- `4E1P` M4 **Sivir, Mercenary** `[chaos]` — move,ready,pump → -
- `4E1P` M4 **Sona, Harmonious** `[calm]` — ready → -
- `4E1P` M4 **Soraka, Wanderer** `[order]` — move → death
- `5E0P` M4 **Stargazer** `[chaos]` — trashplay → trash_matters,flow
- `4E1P` M4 **Stealthy Pursuer** 🚫 `[chaos]` — - → move_trigger
- `4E1P` M4 **Taric, Protector** `[calm]` — pump → -
- `5E0P` M5 **Ultrasoft Poro** `[order]` — - → -
- `4E1P` M2 **Vayne, Hunter** `[fury]` — ready,pump → conquer
- `5E0P` M5 **Vicious Snapjaws** `[chaos]` — xp → death
- `5E0P` M5 **Voracious Gromp** `[body]` — xp → conquer
- `5E1P` M4 **Ahri, Alluring** `[calm]` — point → hold
- `5E1P` M5 **Angler Beast** `[chaos]` — - → -
- `5E1P` M4 **Ashe, Focused** `[order]` — banish → -
- `6E0P` M6 **Baccai Sandspinner** `[fury]` — empower,pump → empowered
- `6E0P` M6 **Bilgewater Bully** `[body]` — move → -
- `5E1P` M5 **Blitzcrank, Impassive** `[calm]` — move → hold
- `6E0P` M5 **Brazen Buccaneer** `[fury]` — discard → -
- `6E0P` M5 **Brynhir Thundersong** `[fury]` — - → -
- `5E1P` M5 **Darius, Trifarian** `[fury]` — ready,pump → -
- `5E1P` M3 **Draven, Showboat** `[fury]` — - → -
- `5E1P` M5 **Ekko, Recurrent** `[mind]` — ready → death
- `6E0P` M5 **Eminent Benefactor** `[order]` — gold → gear_matters,hold
- `6E0P` M5 **Fretful Feline** `[body]` — ready,pump → -
- `6E0P` M6 **Gangplank, Naval** `[body]` — empower,stun,pump,shrink → empowered
- `5E1P` M5 **Glasc Mixologist** `[order]` — trashplay → trash_matters,death
- `6E0P` M6 **Guardian of the Passage** `[calm]` — trashplay → gear_matters,trash_matters,hold
- `6E0P` M6 **Horns of the Dragon** `[order]` — - → -
- `6E0P` M6 **Ivern, Friend to All** `[order]` — point → conquer
- `5E1P` M5 **Jax, Unmatched** `[calm]` `Reaction` — - → gear_matters
- `5E1P` M5 **Jinx, Rebel** `[chaos]` — ready,pump → discard_matters
- `5E1P` M5 **Keeper of Law** `[order]` — - → -
- `6E0P` M5 **Kharox** `[chaos]` — empower,burn → empowered
- `5E1P` M5 **Lee Sin, Ascetic** `[calm]` — buff,pump → -
- `6E0P` M6 **Lee Sin, Centered** `[body]` — ready,pump → -
- `5E1P` M5 **Lord Broadmane** `[fury]` `Reaction` — pump → -
- `5E1P` M4 **Machine Evangel** `[order]` — - → death
- `6E0P` M6 **Master Bingwen** `[chaos]` — - → gear_matters
- `6E0P` M6 **Megatusk** `[chaos]` — move → xp_spend
- `5E1P` M5 **Miss Fortune, Captain** `[body]` — move,ready → -
- `6E0P` M6 **Monch** `[calm]` — ready → -
- `5E1P` M5 **Morgana, Vindictive** `[fury]` `Reaction` — - → -
- `6E0P` M4 **Ornn, Forge God** `[mind]` — pump → gear_matters
- `5E1P` M5 **Rek'Sai, Swarm Queen** `[order]` — - → attack
- `5E1P` M6 **Rengar, Trophy Hunter** `[body]` — - → -
- `6E0P` M5 **Ruin Runner** `[body]` — - → -
- `6E0P` M5 **Sai Scout** `[chaos]` — - → -
- `6E0P` M6 **Scrutinizing Sergeant** `[order]` — xp → -
- `5E1P` M4 **Sett, Brawler** `[body]` — buff,pump → buff_spend,conquer
- `5E1P` M5 **Simian Ancestor** `[calm]` — buff,ready → -
- `6E0P` M5 **Spectral Centaur** `[mind]` — pump → death
- `4E2P` M4 **Spectral Matron** `[order]` — trashplay → trash_matters
- `5E1P` M6 **Starhound** `[order]` — trashplay → trash_matters
- `6E0P` M6 **Targonian Visionary** `[body]` — pump → level
- `6E0P` M6 **Towering Pairofant** `[fury]` — ready,pump → -
- `5E1P` M5 **Vex, Cheerless** `[chaos]` — - → -
- `5E1P` M5 **Vex, Mocking** `[calm]` — stun,move,pump → -
- `5E1P` M5 **Vi, Peacekeeper** `[order]` `Reaction` — stun → attack
- `5E1P` M4 **Yasuo, Windrider** `[chaos]` — move,point → -
- `5E1P` M4 **Yi, Meditative** `[calm]` — pump → -
- `4E2P` M2 **Zaunite Bouncer** `[chaos]` — bounce → -
- `6E1P` M6 **Arachnoid Horror** `[body]` — xp → conquer
- `6E1P` M6 **Armed Assailant** `[fury]` — ready → gear_matters
- `7E0P` M7 **Astral Heron** `[calm]` — - → -
- `6E1P` M6 **Azir, Ascendant** `[calm]` `Action` — move → gear_matters
- `6E1P` M6 **Darius, Executioner** `[order]` — ready,pump → legion
- `7E0P` M7 **Direwing** `[body]` — ready → -
- `6E1P` M6 **Draven, Audacious** `[chaos]` — point → -
- `6E1P` M6 **Ferrous Forerunner** `[fury]` — - → death
- `6E1P` M5 **Garen, Commander** `[order]` — pump → -
- `6E1P` M5 **Garen, Rugged** `[body]` — pump → -
- `6E1P` M6 **Kai'Sa, Evolutionary** `[mind]` — move,trashplay → trash_matters,conquer
- `6E1P` M6 **Karma, Channeler** `[order]` — buff,pump → -
- `6E1P` M6 **Kayn, Unleashed** `[chaos]` — move → -
- `6E1P` M6 **Leona, Zealot** `[calm]` — ready,shrink → -
- `6E1P` M5 **Lux, Illuminated** `[mind]` — pump → spell_played
- `6E1P` M5 **Mageseeker Warden** `[calm]` — ready → gear_matters
- `7E0P` M8 **Mega-Mech** `[mind]` — - → -
- `6E1P` M6 **Minah Swiftfoot** `[chaos]` — move → move_trigger
- `6E1P` M5 **Peak Guardian** `[order]` — buff,pump → -
- `6E1P` M5 **Poppy, Defender of the Meek** `[order]` — - → xp_spend
- `6E1P` M4 **Raging Firebrand** `[fury]` — - → -
- `6E1P` M6 **Syndra, Transcendent** `[chaos]` — - → -
- `6E1P` M5 **Vanguard Attendant** `[order]` — ready → -
- `6E1P` M6 **Zephyr Sage** `[calm]` — pump → -
- `6E2P` M7 **Alpha Wildclaw** `[calm]` — - → -
- `7E1P` M6 **Corina Veraza** `[order]` — move,ready → move_trigger
- `7E1P` M7 **Eclipse Herald** `[calm]` — stun,ready,pump → -
- `8E0P` M8 **Gentle Gemdragon** `[body]` — ready → -
- `7E1P` M6 **Iascylla** `[calm]` — move → hold
- `7E1P` M6 **Maduli the Gatekeeper** `[chaos]` — move → -
- `7E1P` M7 **Revna the Lorekeeper** `[fury]` — move,ready → spell_played
- `6E2P` M7 **Shen, Leader of the Kinkou Order** `[order]` — pump,point → hold
- `7E1P` M7 **Thousand-Tailed Watcher** `[mind]` — ready,shrink → -
- `7E1P` M6 **Yi, Honed** `[body]` — move,ready → -
- `7E2P` M8 **Beast Below** `[chaos]` — - → -
- `7E2P` M6 **Jaull-Fish** `[body]` — ready → mighty
- `8E1P` M8 **Magma Wurm** `[fury]` — ready → -
- `7E2P` M7 **Mindsplitter** `[chaos]` — - → -
- `9E0P` M10 **Mountain Drake** `[body]` — - → -
- `8E1P` M8 **Nasus, Ascended** `[calm]` — empower,point → empowered,conquer
- `6E3P` M7 **Sivir, Ambitious** `[body]` — - → conquer
- `7E2P` M4 **Tianna Crownguard** `[calm]` — - → -
- `7E2P` M8 **Tryndamere, Barbarian** `[fury]` — point → conquer
- `8E2P` M7 **Breakneck Mech** `[mind]` — move,ready → -
- `8E2P` M8 **Deadbloom Predator** `[body]` — - → -
- `8E2P` M6 **Dr. Mundo, Expert** `[mind]` — trashplay → trash_matters
- `8E2P` M8 **Inviolus Vox** `[fury]` — pump → conquer
- `8E2P` M7 **Ocean Drake** `[chaos]` — bounce → -
- `10E0P` M8 **Plaza Guardian** `[mind]` — - → gear_matters
- `8E2P` M5 **Soulgorger** `[chaos]` — trashplay → trash_matters
- `8E2P` M9 **Trove Golem** `[order]` — gold → gear_matters
- `8E2P` M8 **Whiteflame Protector** `[calm]` — pump → -
- `9E2P` M8 **Daisy!** ★ `[calm/order]` — stun,ready → attack
- `10E1P` M6 **Rhasa the Sunderer** `[chaos]` — - → trash_matters
- `10E2P` M10 **Corrupted Dragon** `[body]` — move,ready → attack
- `10E3P` M5 **Needlessly Large Yordle** `[calm]` — pump → -
- `12E3P` M12 **Master Yi, Unstoppable** `[calm]` — - → level