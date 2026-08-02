# Legend Guide — What Fits, What Doesn't, and Why

> All **49 Legends**, each analysed against the cards its own Domain Identity can legally
> field. For every Legend: what its ability *rewards*, which cards **produce** that, which
> cards **actively fight it**, and the deck shape that results.
>
> **Created:** 2026-08-02 · **Method:** for each Legend, query its legal pool (258–268
> names, banned excluded) and evaluate fit against the ability's mechanical hook.

**Related:** [`CARD-KNOWLEDGE.md`](CARD-KNOWLEDGE.md) (interactions) ·
[`COMPENDIUM.md`](COMPENDIUM.md) (rules) · [`../spec/EVALUATION.md`](../spec/EVALUATION.md)
(this is EE's **Q-LEGEND** dataset)

---

## How to read an entry

**Rewards** — the behaviour the Legend pays you for. This is the *consumer*; deckbuilding is
about supplying the *producer*.

**❌ Doesn't fit** matters as much as ✅. Two kinds appear repeatedly:
- **Dead weight** — cards that simply never trigger the Legend
- ⚠️ **Tension** — cards that *compete for the same resource* as the Legend

## 🔴 Read "doesn't fit" as a cost, not a ban

**Synergy is a gradient, not a gate.** A card that doesn't trigger your Legend is not
unplayable — it just isn't doing double duty. The only question is whether its **standalone
rate is good enough** to earn the slot anyway.

**And a listed tension is frequently a trade worth making:**

| Example | Why the "anti-synergy" is often correct anyway |
|---|---|
| `The Boss` spends a buff that `Sett, Kingpin` wanted | You lose +1 Might — and **keep a 5-Might body that was about to die**. That is a good trade almost every time |
| `Grand Duelist` (Fiora) wants units *becoming* Mighty | She can still run heavy units. They just aren't **Legend fuel** — you need *some* threshold-crossers, not *only* them |
| `Loose Cannon` (Jinx) wants an empty hand | Drawing cards is still drawing cards. You're trading a conditional Legend draw for a guaranteed one |

> **The distinction that actually matters is card-level vs deck-level.**
>
> - **Card-level tension is normal** and often correct. Weigh it, don't avoid it.
> - **Deck-level mismatch is the real misbuild** — a Kai'Sa deck with 25 units, an Ornn deck
>   with 4 gear, a Master Yi deck that spends XP faster than it earns. There the Legend
>   becomes a blank rune for the whole game.
>
> Everything marked ⚠️ below is a **thing to weigh**, not a rule. Only the cases explicitly
> called **deck-level** are close to hard constraints.

> **Universal facts.** Every Legend's ability is `[E]`-gated or triggered, so it readies each
> Awaken — treat it as **one free effect per turn**. Every pool is 258–268 legal names, so
> **no Legend is card-starved**; what differs is what the pool *rewards*.

---

# Part 1 — Origins-era Legends (16)

## Blind Monk — Lee Sin · Body/Calm
`1E, [E]: Buff a friendly unit` · CC: **Lee Sin, Ascetic** / **Lee Sin, Centered** · Sig: `Dragon's Rage`

**Rewards:** buff *volume* — one free buff per turn, forever.

✅ **Fits.** ⭐ **`Lee Sin, Ascetic`** is the key card: *"I can have any number of buffs"*
explicitly overrides the one-buff cap (CR 702.3), turning the Legend into a stacking Might
engine. **`Mistfall`** converts each buff into a **ready** — a repeatable untap. **`Albus
Ferros`** and **`Kraken Hunter`** convert buffs into runes and cost reduction, so buffs
become currency rather than stats. **`Wizened Elder`**, **`Bilgewater Bully`** pay off *being*
buffed.

❌ **Doesn't fit.** ⚠️ **Buff-generating units are largely redundant** — `Pit Rookie`,
`Kinkou Monk`, `Peak Guardian` all compete with a Legend that already buffs for free every
turn, and **the one-buff cap wastes the overflow**. Take *spenders*, not *generators*.
**`Lee Sin, Centered`** wants *other* buffed units, which pulls toward width — the opposite
of Ascetic's stacking plan. **Pick a lane.**

**Shape:** tall single-threat with an untap engine, or a buff-as-currency ramp deck.

## Bounty Hunter — Miss Fortune · Body/Chaos
`[E]: Give a unit Ganking this turn` · CC: **Miss Fortune, Buccaneer** / **Captain** · Sig: `Bullet Time`

**Rewards:** *movement* — battlefield-to-battlefield repositioning.

✅ **Fits.** Move-triggered payoffs are the whole deck: **`Treasure Hunter`** (move → Gold),
**`Traveling Merchant`** (move → loot), **`Harpoon Squad`** (move → +2 Might),
**`Corrupt Enforcer`**, **`Fae Porter`** (drags a second unit along). ⭐ **`Miss Fortune,
Captain`** readies something else the first time she moves each turn — Legend grants Ganking,
she moves, you untap. **`Blitzcrank, Impassive`** pulls enemies into your fights.

❌ **Doesn't fit.** Static defensive shells — `Sunlit Guardian`, `Stormclaw Ursine` — gain
nothing; Ganking on a Tank is wasted. ⚠️ **`Minotaur Reckoner`** (*units can't move to base*)
is an **anti-synergy in your own deck**: it's symmetric and shuts off your own repositioning.

**Shape:** mobile skirmish deck that wins by being where the opponent isn't.

## Dark Child – Starter — Annie · Fury/Chaos
`At the end of your turn, ready 2 runes` · CC: **Annie, Fiery** / **Annie, Stubborn** · Sig: `Tibbers`

**Rewards:** **acting on the opponent's turn.** Per
[CARD-KNOWLEDGE §1.2](CARD-KNOWLEDGE.md#12-ready-runes-are-your-interaction-currency--verified),
ready runes *are* interaction.

✅ **Fits.** Cheap `[Reaction]` cards you can hold up: **`Gust`**, **`Flash`**,
**`Shakedown`**, **`Get Excited!`**, **`Stupefy`**. **`Annie, Fiery`** (+1 Bonus Damage to all
your spells and abilities) turns every cheap burn into a real answer. **`Tibbers`** (signature,
8E2P, *deal 3 to all units at battlefields*) is the payoff the ramp builds toward.

❌ **Doesn't fit.** ⚠️ **Tap-out decks waste the entire Legend.** If you spend everything on
your own turn, readying 2 runes at end of turn does nothing. This Legend punishes greedy
curves specifically — big sorcery-speed units are the wrong build.

**Shape:** flash/interaction deck that holds mana and punishes.

## Daughter of the Void — Kai'Sa · Fury/Mind
`[E]: [Reaction] — Add [A]. Use only to play spells` · CC: **Kai'Sa, Evolutionary** / **Survivor** · Sig: `Icathian Rain`

**Rewards:** **spell density.** The mana is *literally unusable* on units and gear.

✅ **Fits.** Fury/Mind is the burn/draw pair, so the pool cooperates: **`Icathian Rain`**
(signature, 7E3P, six instances of 2 damage), **`Falling Comet`**, **`Singularity`**,
**`Unchecked Power`**, **`Void Seeker`**. **`Lux, Illuminated`** and **`Ravenbloom Student`**
grow on spell casts. **`Eager Apprentice`** discounts spells — and note **it does not turn off
"costs 5 or more" checks**, because those read the *printed* cost (CR 206).

❌ **Doesn't fit.** ⚠️ **Unit-heavy or gear builds strand the Legend's mana entirely** — this
is the sharpest "wrong build" in the format. `Kai'Sa, Evolutionary` (replay a spell from trash
on conquer) reinforces spells; `Kai'Sa, Survivor` is just a body. **Take Evolutionary.**

**Shape:** spell-slinger. Minimum viable unit count, maximum burn.

## Hand of Noxus — Darius · Fury/Order
`[E]: [Reaction], [Legion] — Add [1]` · CC: **Darius, Executioner** / **Trifarian** · Sig: `Noxian Guillotine`

**Rewards:** **playing a second card each turn** (Legion, CR 812).

✅ **Fits.** Cheap cards that make Legion trivially live — and remember **0-cost gear counts**.
**`Noxus Hopeful`** (costs 2 less under Legion), **`Trifarian Gloryseeker`**,
**`Vanguard Captain`** (two Recruits), **`Battering Ram`** (cheaper per card played),
**`Sun Disc`**. ⭐ **`Darius, Trifarian`** — *"when you play your second card in a turn, +2
Might and **ready me**"* — is the same trigger, doubled.

❌ **Doesn't fit.** ⚠️ **A top-heavy curve is self-defeating.** If your turn is one 6-drop,
Legion is off and the Legend produces nothing. This Legend demands a **low curve with card
volume**, not power per card.

**Shape:** wide, cheap, two-spells-a-turn aggro.

## Herald of the Arcane — Viktor · Mind/Order
`1E, [E]: Play a 1 Might Recruit token` · CC: **Viktor, Innovator** / **Leader** · Sig: `Siphon Power`

**Rewards:** **bodies** — a free unit every turn.

✅ **Fits.** Go-wide payoffs: **`Garen, Commander`** and **`Darius, Executioner`** (+1 Might to
others there), **`Peak Guardian`**, **`Grand Strategem`** (+5 to all), **`Recruit the
Vanguard`**. Sacrifice outlets convert the stream into value: ⭐ **`Commander Ledros`** (kill
friendlies to reduce cost), **`Cruel Patron`**, **`Bottled Constellation`** (kill 3 → score a
point). **`Viktor, Leader`** makes a Recruit whenever a non-Recruit dies.

❌ **Doesn't fit.** ⚠️ Single-big-threat builds — `Volibear, Imposing`-style decks — waste a
Legend producing 1-Might bodies. Also note **`The Grand Plaza`** (win with 7+ units held) is a
*real* win condition here, and almost nowhere else.

**Shape:** token swarm. The only Legend with a credible Grand Plaza plan.

## Lady of Luminosity – Starter — Lux · Mind/Order
`When you play a spell that costs 5 or more, draw 1` · CC: **Lux, Crownguard** / **Illuminated** · Sig: `Final Spark`

**Rewards:** **expensive spells**, specifically.

✅ **Fits.** **`Final Spark`** (8E, signature), **`Progress Day`**, **`Singularity`**,
**`Unchecked Power`**, **`Recruit the Vanguard`**, **`Blast of Power`**. ⭐ **`Lux,
Illuminated`** triggers on the *same* condition (+3 Might on a 5+ spell), so the Legend and
the Chosen Champion share one trigger. **`Lux, Crownguard`** adds spell-only mana.

⚠️ **Key nuance:** cost-reduction (`Eager Apprentice`) **does not break this**. Effects that
check a card's cost use its **printed** cost (CR 206) — so you get the discount *and* the draw.

❌ **Doesn't fit.** Cheap interactive builds. A deck of 1–2 cost Reaction spells never triggers
the Legend at all.

**Shape:** slow, expensive control that draws its way to a big finisher.

## Loose Cannon — Jinx · Fury/Chaos
`At start of your Beginning Phase, draw 1 if you have ≤1 card in hand` · CC: **Jinx, Demolitionist** / **Rebel** · Sig: `Super Mega Death Rocket!`

**Rewards:** ⚠️ **an empty hand** — an unusual and easily-misbuilt condition.

✅ **Fits.** Discard outlets are *upside*, not cost: **`Chemtech Enforcer`**,
**`Jinx, Demolitionist`** (discard 2), **`Get Excited!`**, **`Square Up`**,
**`Brazen Buccaneer`**. Discard payoffs turn it into value: **`Flame Chompers`** (*when you
discard me, pay Fury to play me*), ⭐ **`Jinx, Rebel`** (*when you discard, ready me and +1*),
**`Raging Soul`** (*if you've discarded this turn, Assault and Ganking*).
**`Super Mega Death Rocket!`** returns itself from trash on conquer.

❌ **Doesn't fit.** ⚠️ **Card draw is an anti-synergy with your own Legend.** `Progress Day`,
`Consult the Past` and friends *refill your hand and switch the Legend off*. This is the
clearest case in the format where a normally-good effect is actively wrong.

**Shape:** empty-hand aggro that treats discard as a resource.

## Might of Demacia – Starter — Garen · Body/Order
`When you conquer, if you have 4+ units at that battlefield, draw 2` · CC: **Garen, Commander** / **Rugged** · Sig: `Decisive Strike`

**Rewards:** **conquering with a crowd** — four bodies in one place.

✅ **Fits.** Mass token production: **`Corina Veraza`** (three Recruits on move),
**`Vanguard Captain`**, **`Machine Evangel`**, **`Recruit the Vanguard`**, **`Azir,
Sovereign`** (move all your tokens in when attacking). **`Garen, Commander`** and
**`Decisive Strike`** (+2 to all) make the crowd actually win the fight.

❌ **Doesn't fit.** ⚠️ Anything that *spreads* you across battlefields — the Legend requires
4 units **at one battlefield**. Ganking and mobility packages actively work against the
condition. Also poor with `Wuju Bladesman`-style "alone" bonuses, obviously.

**Shape:** one big stack, walked into a single battlefield.

## Nine-Tailed Fox — Ahri · Calm/Mind
`When an enemy unit attacks a battlefield you control, give it −1 Might this turn (min 1)` · CC: **Ahri, Alluring** / **Inquisitive** · Sig: `Fox-Fire`

**Rewards:** **defending** — it is purely reactive and only works on battlefields you already
hold.

✅ **Fits.** Hold-and-tax: **`Sunlit Guardian`**, **`Taric, Protector`** (gives others Shield),
**`Blue Sentinel`**, **`Zephyr Sage`**. Stack the Might reduction to reach lethal thresholds:
**`Stupefy`**, **`Frigid Touch`**, **`Smoke Screen`**, **`Ahri, Inquisitive`** (−2 more).
⭐ **`Ahri, Alluring`** (*when I hold, you score 1 point*) converts successful defence directly
into the win — and Hold points are **exempt from the Final Point restriction** (CR 471.1.a.1).

❌ **Doesn't fit.** ⚠️ **Aggression.** The Legend does literally nothing when you attack. A
Calm/Mind tempo build that takes battlefields and moves on is playing without its Legend.

**Shape:** the archetypal Holder — take one battlefield, never give it up, score every turn.

## Radiant Dawn — Leona · Calm/Order
`When you stun one or more enemy units, buff a friendly unit` · CC: **Leona, Determined** / **Zealot** · Sig: `Zenith Blade`

**Rewards:** **stun**, and Calm/Order is where stun lives.

✅ **Fits.** Stun sources at every cost: **`Solari Shieldbearer`**, **`Rune Prison`**,
**`Facebreaker`**, **`Thwonk!`**, **`Back Off`**, **`Heroic Charge`**, **`Zenith Blade`**
(signature), **`Leona, Determined`** (stun on attack). Payoffs compound it: ⭐ **`Eclipse
Herald`** (*when you stun, ready me and +1*), **`Solari Chief`** (*stun it, or **kill** it if
already stunned*), **`Solari Shrine`** (kill a stunned unit → draw), ⭐ **`Leona, Zealot`**
(*stunned enemies here have −8 Might*).

❌ **Doesn't fit.** Builds without stun density — the Legend is a dead card. Note stun does
**not** stop damage *to* the unit (CR 423.1.c: it still needs full Might in damage to die), so
stun is tempo, not removal, unless paired with `Solari Chief` or `Leona, Zealot`.

**Shape:** stun-lock tempo that turns denial into permanent Might.

## Relentless Storm — Volibear · Body/Fury
`When you play a Mighty unit, you may exhaust me to channel 1 rune exhausted` · CC: **Volibear, Furious** / **Imposing** · Sig: `Stormbringer`

**Rewards:** **playing units with 5+ Might** (CR 708).

✅ **Fits.** Body/Fury is the big-body pair, so the pool is deep: **`Volibear, Imposing`**
(M10, `Shield 3`, `Tank` — *no unit in the format beats it in combat*), **`Magma Wurm`** (M8,
others enter ready), **`Kadregrin the Infernal`** (M9, draw per Mighty unit), **`Anivia,
Primal`** (M8). **`Jaull-Fish`** costs 2 less *per* Mighty unit. **`Show of Strength`** draws
per Mighty unit; **`Unsung Hero`** draws 2 if it died Mighty.

❌ **Doesn't fit.** ⚠️ **Cheap aggressive curves switch the Legend off entirely** — nothing
under 5 Might triggers it. This is a ramp Legend that wants to *arrive*, not race. Note that
`Grand Duelist` (Fiora) rewards *becoming* Mighty, which pumps can fake; **Relentless Storm
requires it on the card as played**.

**Shape:** ramp into unanswerable bodies.

## Swift Scout — Teemo · Mind/Chaos
`Hide for 1E instead of [A]` + `1E, [E]: Return a Teemo from Champion Zone or board to hand` · CC: **Teemo, Scout** / **Strategist** · Sig: `Guerilla Warfare`

**Rewards:** **`Hidden`** — the facedown-threat game.

✅ **Fits.** 43 cards have Hidden; Mind/Chaos holds many: **`Consult the Past`**,
**`Fox-Fire`**, **`Bone Skewer`**, **`Smoke and Mirrors`**, **`Sprite Call`**.
Payoffs: ⭐ **`Teemo, Strategist`** (reveal 5, damage per Hidden revealed),
**`Ember Monk`** (+2 per Hidden played), **`Black Market Broker`** (Gold per facedown play),
**`Ava Achiever`**, **`Mushroom Pouch`**, **`Guerilla Warfare`** (signature — rebuy two Hidden
from trash **and hide free**). **`Bandle Tree`** battlefield allows a second facedown.

❌ **Doesn't fit.** ⚠️ **`Noxus Saboteur`** is the *mirror-breaker* — opposing Hidden can't be
revealed at its battlefield. Also, low-Hidden builds make the whole Legend cosmetic.
The second ability rebuys **play effects**, so vanilla bodies waste it.

**Shape:** facedown tempo with repeatable play-effect abuse.

## The Boss — Sett · Body/Order
`Spend a buffed unit's buff + [A] + [E] to recall it instead of dying` · `When you conquer, ready me` · CC: **Sett, Brawler** / **Kingpin** · Sig: `Showstopper`

**Rewards:** buffs **as insurance**, and conquering (which resets the Legend).

✅ **Fits.** Cheap wide buffs so protection is always available: **`Rally the Troops`**,
**`Pit Rookie`**, **`Vanguard Helm`** (*when a buffed unit dies, buff another* — chains the
insurance), **`Showstopper`** (buff + move, signature). **`Sett, Brawler`** self-buffs on play
*and* on conquer, feeding the Legend both ways.

⚖️ **Tension, not a ban.** **`Sett, Kingpin`** gets +1 Might per **buffed** unit, so he wants
buffs to *stay* — while the Legend **spends** them. But spending a buff to **save Kingpin
himself** is a fine trade: you lose +1 Might and keep a 5-Might `Tank`. Run him; just know the
two effects draw on one pool, so **buff volume is the real constraint**. `Brawler` is the
lower-friction pairing because he re-buffs himself on play *and* on conquer.

**Shape:** resilient midrange where every buff is a saved unit.

## Unforgiven — Yasuo · Calm/Chaos
`2E, [E]: Move a friendly unit to or from its base` · CC: **Yasuo, Remorseful** / **Windrider** · Sig: `Last Breath`

**Rewards:** **moves** — and note it moves *to or from* base, so it both saves and deploys.

✅ **Fits.** ⭐ **`Yasuo, Windrider`** — *"the third time I move in a turn, you score 1
point"* — with Ganking plus the Legend plus `Ride the Wind`, that is a repeatable
non-Conquer point (and therefore **can win at 7**). Evasion synergy is strong in Calm/Chaos:
**`Flash`**, **`Emperor's Divide`**, and the fact that **base dodges ~half of all removal**.
**`Yasuo, Remorseful`** hits for his Might on attack.

❌ **Doesn't fit.** ⚠️ **`Vilemaw's Lair`** and **`Minotaur Reckoner`** forbid moving to base —
they turn your Legend off. Static Tank shells also gain nothing.

**Shape:** slippery tempo that scores through movement rather than combat.

## Wuju Bladesman – Starter — Master Yi · Body/Calm
`While a friendly unit defends alone, it gets +2 Might` · CC: 4 options · Sig: `Alpha Strike`, `Highlander`

**Rewards:** **defending with exactly one unit** ("alone" = no other friendly unit at that
location, CR 740.2.a).

✅ **Fits.** Stack the same condition: **`Wielder of Water`** (*+2 while attacking or
defending alone*) reaches +4 with the Legend; **`Mask of Foresight`** (+1 alone);
**`Lonely Poro`** (draw if it died alone). Big single defenders: **`Master Yi,
Unstoppable`** (M12), **`Needlessly Large Yordle`** (M5 + `Shield 5`). **`Highlander`**
(signature) saves the lone defender from a bad trade.

❌ **Doesn't fit.** ⚠️ **Every go-wide card is an anti-synergy** — a second unit at the
battlefield *cancels* the bonus. Tokens, Recruits and swarm payoffs are actively wrong here,
which is unusual and easy to misbuild.
⚠️ **Hard counter to know about:** **`Forbidding Waste`** (battlefield) gives a lone defender
**−2 Might** — a direct, printed answer that flips 40.8% of combats
([CARD-KNOWLEDGE §8.2](CARD-KNOWLEDGE.md#82--symmetric-battlefields-barely-matter-asymmetric-ones-decide-games)).

**Shape:** one enormous defender per battlefield; never double up.

---

# Part 2 — Spiritforged Legends (12)

Spiritforged is the **Equipment** set, and five of its twelve Legends are built around gear.

## Battle Mistress — Sivir · Body/Chaos
`When you recycle a rune, [E]: play a Gold token exhausted` · `When enemy units die, ready me` · CC: **Sivir, Ambitious** / **Mercenary** · Sig: `On the Hunt`

**Rewards:** ⚠️ **paying Power costs** — recycling a rune is what triggers it. It converts the
game's central cost (losing a rune from board) into a Gold token, i.e. **Power back later**.

✅ **Fits.** Power-hungry curves — the more `[C]` costs you pay, the more Gold you bank.
**`Sivir, Mercenary`** (*if you've spent 2+ Power this turn, +2 Might and Ganking*) triggers on
the same behaviour. The ready-clause makes the Legend reusable in any removal-heavy build.
**`On the Hunt`** (signature, ready all your units) converts a Gold-fuelled turn into a second
attack.

❌ **Doesn't fit.** ⚠️ **Seal-heavy builds actively undercut it.** Seals produce Power
*without* recycling runes ([CARD-KNOWLEDGE §1.1](CARD-KNOWLEDGE.md#11-the-seals--power-without-spending-your-board)) — that's normally excellent, but here it
**bypasses the Legend's trigger entirely.** A rare case where the format's best resource
tech is wrong for the deck.

**Shape:** Power-heavy midrange that turns rune attrition into stored value.

## Blade Dancer — Irelia · Calm/Chaos
`When you choose a friendly unit, [E] + [A]: ready it` · `On conquer, 1E: ready me` · CC: **Irelia, Fervent** / **Graceful** · Sig: `Defiant Dance`

**Rewards:** ⚠️ **targeting your own units** — an unusual trigger. Any friendly-targeting
spell becomes a free untap.

✅ **Fits.** Cheap self-targeting effects are the engine, and they're everywhere in Calm:
**`Discipline`**, **`En Garde`**, **`Combat Experience`**, **`Feral Strength`**,
**`Defiant Dance`** (signature). ⭐ **`Irelia, Fervent`** (*when you **choose or ready** me,
+1 Might*) triggers twice off one spell. **`Irelia, Graceful`** makes those spells cheaper.
**`Spirit Wheel`** and **`Jae Medarda`** also pay off being chosen.

❌ **Doesn't fit.** ⚠️ Spells that target *enemies* — the bulk of removal — don't trigger it at
all. This Legend inverts the normal instinct that interaction should point at the opponent.

**Shape:** untap-combo tempo; attack, ready, attack again.

## Chem-Baroness — Renata Glasc · Mind/Order
`When you hold, [E]: play a Gold token exhausted` · `While within 3 points of victory, your Gold adds +1 Energy` · CC: **Renata Glasc, Industrialist** / **Mastermind** · Sig: `Hostile Takeover`

**Rewards:** **holding** (not conquering), and it **scales as you approach victory**.

✅ **Fits.** A Holder shell that grinds points and banks Gold: defensive units, `Tank`/`Shield`
bodies. ⭐ **`Renata Glasc, Mastermind`** (*4E + 4 Mind, [E]: **score 1 point***) is the
natural finisher — and the Legend's late-game Gold bonus helps pay that enormous cost.
**`Renata Glasc, Industrialist`** (*your tokens enter ready*) makes the Gold usable
immediately instead of next turn.

❌ **Doesn't fit.** ⚠️ Aggressive conquer-based builds get **nothing** — the trigger is
specifically **hold**. The bonus clause also only switches on at 5+ points, so early-game
value is thin; don't build a deck that needs the Legend on turn 3.

**Shape:** grindy Holder that converts board stability into an alternate point win.

## Emperor of the Sands — Azir · Calm/Order
`Your Sand Soldiers have Weaponmaster` · `1E, [E]: play a 2 Might Sand Soldier — only if you've played an Equipment this turn` · CC: **Azir, Ascendant** / **Sovereign** · Sig: `Arise!`

**Rewards:** ⚠️ **a conjunction — Equipment *and* tokens.** The Legend is off unless you played
an Equipment that turn.

✅ **Fits.** Cheap Equipment purely as an enabler: **`Doran's Shield`**, **`Doran's Blade`**,
**`Cloth Armor`**, **`Serrated Dirk`** (1E each). Then the Sand Soldiers arrive *with*
Weaponmaster, letting each one re-attach a piece for `[A]` less. ⭐ **`Arise!`** (signature —
*a Sand Soldier for each Equipment you control, then ready two*) is an explosive payoff.
**`Azir, Sovereign`** moves all your tokens into the attack.

❌ **Doesn't fit.** ⚠️ **An equipment-light build makes the Legend's token ability dead most
turns.** This is the strictest conditional Legend in the format — treat "play an Equipment
every turn" as a deckbuilding requirement, not a nice-to-have.

**Shape:** equipment-fuelled token swarm.

## Fire Below the Mountain — Ornn · Calm/Mind
`[E]: [Reaction] — Add [A]. Use only to play gear or gear abilities` · CC: **Ornn, Blacksmith** / **Forge God** · Sig: `Forgefire Cape`, `Rabadon's Deathcrown`, `Shurelya's Requiem`

**Rewards:** **gear density** — the mana is unusable on anything else.

✅ **Fits.** The only Legend with **three signature cards**, all `[Unique]` Equipment
(⚠️ one copy each — see [L28](../spec/LEGALITY.md)): **`Rabadon's Deathcrown`** (+3 Bonus
Damage to all your spells and abilities) is the strongest of the three by a distance.
**`Ornn, Forge God`** gets +1 Might per friendly gear; **`Ornn, Blacksmith`** digs for gear on
play *and* on hold. **`Gearhead`** doubles Might bonuses; **`Svellsongur`** copies the
equipped unit's text.

❌ **Doesn't fit.** ⚠️ **Spell-heavy or unit-heavy builds strand the mana**, exactly as with
Kai'Sa. The Legend also can't pay for the *card* if it isn't gear — so a 20-spell build is
playing a blank.

**Shape:** the format's dedicated Equipment deck.

## Glorious Executioner — Draven · Fury/Chaos
`When you win a combat, draw 1` · CC: **Draven, Audacious** / **Showboat** · Sig: `Spinning Axe`

**Rewards:** ⚠️ **winning combats — not conquering.** "You win if only your units remain"
(CR 466.3.a), so it also pays when you *defend* successfully.

✅ **Fits.** Units that reliably win fights, plus tricks to guarantee it: **`Cleave`**,
**`Blood Rush`**, **`Against the Odds`**. ⭐ **`Draven, Audacious`** *also* scores a point the
first time he wins a combat each turn — Legend and Champion share the trigger. **`Draven,
Showboat`** grows with your score, so the deck snowballs.

❌ **Doesn't fit.** ⚠️ **Removal-based plans are anti-synergistic.** Killing the blocker with a
spell *before* combat means there's no combat to win. This Legend wants you to fight, not to
clear the way.
⚠️ Also note **`Draven, Audacious`'s** downside: when he dies in combat, an **opponent** scores
a point.

**Shape:** aggressive combat deck that draws its way through attrition.

## Grand Duelist — Fiora · Body/Order
`When one of your units becomes Mighty, [E]: channel 1 rune exhausted` · CC: **Fiora, Peerless** / **Victorious** / **Worthy** · Sig: `Riposte`

**Rewards:** ⚠️ **units *becoming* Mighty** — crossing from <5 to ≥5 Might (CR 709). Crucially,
**pumps count**, unlike `Relentless Storm` which needs it printed.

✅ **Fits.** Cheap 3–4 Might bodies plus pump effects, so you cross the threshold on demand:
**`Discipline`** (+2), **`Bonds of Strength`**, **`Grand Strategem`**, buffs.
⭐ **`Fiora, Worthy`** (*when a unit becomes Mighty, pay Order to **ready** it*) is the same
trigger again. **`Fiora, Victorious`** (M4) turns on `Deflect`, `Ganking` and `Shield` the
moment she becomes Mighty — a single buff transforms her.

⚖️ **Tension, not a ban.** **Natively-Mighty units (5+ printed) never *become* Mighty** — they
arrive that way, so they don't trigger the Legend. That doesn't make them bad cards; heavy
bodies are still heavy bodies. It means you need **some** threshold-crossers in the curve, not
that you need **only** them. The deck-level failure is a build where *nothing* crosses 5 Might
mid-turn. **Note the contrast with `Relentless Storm`, which wants the exact opposite** — same
stat, opposite triggers.

**Shape:** midrange with a pump package that ramps off threshold-crossing.

## Grandmaster at Arms — Jax · Calm/Body
`1E, [E]: attach a detached Equipment` · `[E]: attach an attached Equipment` · CC: **Jax, Unmatched** / **Unrelenting** · Sig: `Counter Strike`

**Rewards:** **moving Equipment around** — effectively free re-equipping every turn.

✅ **Fits.** High-value single pieces worth relocating: **`Blade of the Ruined King`** (+4),
**`B.F. Sword`** (+3), **`Sterak's Gage`**. ⭐ **`Jax, Unmatched`** gives every Equipment in
hand `Quick-Draw` — Reaction-speed attachment, so you can equip *mid-combat*.
**`Jax, Unrelenting`** draws when you attach to him. **`Angle Shot`** and **`Veiled Temple`**
add more attach/detach at instant speed.

❌ **Doesn't fit.** ⚠️ **A wide board of cheap Equipment wastes the Legend** — it moves *one*
piece, so quality beats quantity. This is the opposite of Azir, who wants many cheap pieces.

**Shape:** single-carry Equipment deck with instant-speed combat tricks.

## Mechanized Menace — Rumble · Fury/Mind
`Your Mechs have Shield` · CC: **Rumble, Hotheaded** / **Scrapper** · Sig: `Danger Zone`

**Rewards:** **Mech tribal**, purely.

✅ **Fits.** The Mech package is self-contained: **`Production Surge`**, **`Iterative Design`**,
**`Assembly Rig`**, **`Ferrous Forerunner`** (two Mechs on death), **`Breakneck Mech`**
(*Mechs have Deflect and Ganking*), **`Forecaster`** (Mechs have Vision),
**`Experimental Hexplate`** (*makes the equipped unit a Mech*). ⭐ **`Rumble, Scrapper`**
(+1 Might to all Mechs) and **`Rumble, Hotheaded`** (Mechs have Assault) stack with the
Legend's Shield to make Mechs good on both sides of combat. **`Danger Zone`** (signature)
pumps all Mechs at Reaction speed.

❌ **Doesn't fit.** ⚠️ **Any non-Mech body is off-plan** — the Legend is a blank for it. Tribal
Legends are the least flexible in the format; **count your Mechs before committing.**

**Shape:** the format's cleanest tribal deck.

## Prodigal Explorer — Ezreal · Mind/Chaos
`[E]: [Reaction] — Draw 1. Only if you've chosen enemy units/gear twice this turn` · CC: **Ezreal, Dashing** / **Prodigy** · Sig: `Arcane Shift`

**Rewards:** ⚠️ **two separate targeting events per turn** — volume of cheap interaction, not
power.

✅ **Fits.** Cheap enemy-targeting spells, doubled up: **`Stupefy`**, **`Frigid Touch`**,
**`Gust`**, **`Eclipse`**, **`Mesmerize`**. ⭐ **`[Repeat]` cards count as separate
choices** where they re-choose — `Frigid Touch` with Repeat can satisfy the Legend by itself.
**`Ezreal, Prodigy`** discounts optional additional costs (so Repeat and Accelerate get
cheaper); **`Ezreal, Dashing`** pings on attack *and* defence.

❌ **Doesn't fit.** ⚠️ **One expensive removal spell per turn fails the condition.** A single
`Vengeance` chooses once. This Legend explicitly rewards *two cheap* over *one big* — the
opposite of Lux.

**Shape:** cheap-interaction control that draws off its own tempo plays.

## Purifier — Lucian · Fury/Body
`Your Equipment each give [Assault]` · CC: **Lucian, Gunslinger** / **Merciless** · Sig: `Relentless Pursuit`

**Rewards:** ⚠️ **Equipment *count* on an attacker** — Assault stacks (CR 807.2), so three
pieces on one unit is +3 attacking **on top of** their Might bonuses.

✅ **Fits.** Stack cheap Equipment on a single carry: **`Serrated Dirk`**, **`Long Sword`**,
**`Doran's Blade`**. **`Weaponmaster`** units attach on arrival — **`Lucian, Merciless`**
(readies on first conquer each turn), **`Combat Chef`**, **`Sentinel Adept`**,
**`Armed Assailant`**. ⭐ **`Lucian, Gunslinger`** deals damage equal to his **Assault** on
attack, so every Equipment doubles as burn. **`Relentless Pursuit`** moves + attaches +
gives a free retreat.

❌ **Doesn't fit.** ⚠️ **Defensive builds waste it entirely** — `Assault` only applies while
attacking (CR 807.1.c). Pairing this Legend with `Shield`/`Tank` bodies is a contradiction.

**Shape:** single-carry aggro; pile Equipment on one attacker and swing.

## Void Burrower — Rek'Sai · Fury/Order
`When you conquer, [E]: reveal top 2, banish one and play it, recycle the rest` · CC: **Rek'Sai, Breacher** / **Swarm Queen** · Sig: `Void Rush`

**Rewards:** **conquering**, paid in free cards off the top.

✅ **Fits.** Reliable early conquest — cheap `Assault` bodies and reach. ⭐ **`Rek'Sai,
Breacher`** is the key synergy: *"friendly units played from anywhere other than a player's
hand have `[Accelerate]`"* — so the unit the Legend flips into play **enters ready** and can
act immediately. **`Void Drone`** and **`Drag Under`** cost 2 less from non-hand zones.
**`Rek'Sai, Swarm Queen`** repeats the effect on attack.

❌ **Doesn't fit.** ⚠️ **A top-heavy deck makes the flip unreliable** — you're revealing 2
random cards and must play one, so expensive misses are wasted. Also fails against Holder
decks that never let you conquer.

**Shape:** aggressive tempo that snowballs off free cards.

---

# Part 3 — Unleashed Legends (12)

Unleashed Legends have **no activated cost line** — they are XP engines or free triggers.

## Voidreaver — Kha'Zix · Body/Chaos
`When you win a combat, gain 1 XP` · `Spend 1 XP, [E]: Buff a unit` · `Spend 2 XP, [E]: Move an exhausted unit to base` · CC: **Kha'Zix, Evolving Hunter** / **Mutating Horror** · Sig: `Void Assault`

**Rewards:** **winning combats**, converted into a flexible XP pool.

✅ **Fits.** Combat-winning bodies plus tricks that guarantee the win — `Cleave`,
`Against the Odds`, `Deathgrip`. The 2-XP mode (retreat an *exhausted* unit) is quietly
strong: it rescues an attacker that would otherwise sit exposed. Other XP producers stack
into the same pool: **`Hunter's Machete`** (`Hunt`), **`Stare Down`**, **`Grim Resolve`**.

❌ **Doesn't fit.** ⚠️ **Removal-heavy plans** — same trap as Draven. If you kill the blocker
first there is no combat to win, and the Legend produces nothing. Also note **`Alpha Strike`**
and other XP sinks compete with the Legend's own modes for the same currency.

**Shape:** attrition midrange that banks combat wins into utility.

## Keeper of the Hammer — Poppy · Body/Order
`When you hold, gain 1 XP` · `Spend 3 XP, [E]: Draw 1` · CC: **Poppy, Defender of the Meek** / **Paragon** · Sig: `Keeper's Verdict`

**Rewards:** **holding** — the slowest, most inevitable XP source in the format.

✅ **Fits.** A Holder shell: `Tank`/`Shield` bodies, **`Xin Zhao, Vigilant`**, **`Soraka,
Wanderer`**. Because XP accumulates passively, it pairs well with **`[Level]`** cards that
want a big number — this is one of the few Legends that reaches `[Level 11]` reliably.
**`Keeper's Verdict`** (signature) tucks a threat to the top or bottom of the deck, with **no
trash recursion** available to answer it.

❌ **Doesn't fit.** ⚠️ **Aggro.** Conquering does not trigger it — only *holding* does, which
means surviving a full turn cycle. A deck that trades battlefields back and forth never gains
XP. The 3-XP-for-1-card rate is also poor on its own; you want `[Level]` payoffs, not the draw.

**Shape:** defensive grind that turns board stability into scaling XP payoffs.

## Wuju Master — Master Yi · Calm/Body
`[Level 6]: your units have +1 Might` · `[Level 11]: your units enter ready` · CC: 4 options · Sig: `Alpha Strike`, `Highlander`

**Rewards:** ⚠️ **raw XP totals, with nothing else.** The only Legend in the format with **no
usable ability at 0 XP** — it is a blank until turn 4–6.

✅ **Fits.** Maximum XP production, because the thresholds are steep: **`Hunter's Machete`**,
**`Shepherd's Heirloom`**, **`Blood Rose`**, **`Scryer's Bloom`**, **`Gardens of Becoming`**
(battlefield — *units here have "`[E]`: gain 1 XP"*), **`Stare Down`**, **`Alpha Strike`**
(signature — XP per kill). ⭐ `[Level 11]` (*units enter ready*) is a genuine game-ender,
effectively giving your whole board haste permanently.

⚖️ **The sharpest tension in the format — but still a trade.** Levels check a **current
total**, not lifetime earnings, so every XP spender (`Conscription` at 5 XP, `Concentrate`'s
discount) **temporarily switches the Legend off**. That is a real cost — but spending 5 XP to
steal a game-winning threat can obviously be right. The **deck-level** failure is a build that
spends faster than it earns and therefore never reaches `[Level 6]` at all. Budget XP like
mana: know your income before you commit to a sink.

**Shape:** slow XP accumulation; never spend, just climb.

## Gloomist — Vex · Calm/Chaos
`When you or an ally hold, [E]: draw 1` · CC: **Vex, Apathetic** / **Cheerless** / **Mocking** · Sig: `Shadow`

**Rewards:** **holding**, paid immediately in cards (no XP threshold to reach).

✅ **Fits.** The most straightforward Holder Legend — hold one battlefield, draw an extra card
every turn. Defensive Calm bodies plus Chaos evasion to protect the holder:
**`Sunlit Guardian`**, **`Taric, Protector`**, **`Flash`**, **`Emperor's Divide`**.
⭐ **`Vex, Cheerless`** (*while I'm in combat, your spells cost less and enemy spells cost
more*) makes defending fights lopsided.

❌ **Doesn't fit.** Conquer-focused aggro. Also ⚠️ note the Legend competes for the `[E]` with
nothing else — it is pure value, so **cheap and reliable beats clever** here.

**Shape:** the cleanest low-complexity Holder. A good first deck.

## Bashful Bloom — Lillia · Calm/Mind
`4E, [E]: Play a ready 3 Might Sprite with Temporary. Costs 1 less per friendly unit with Temporary` · CC: **Lillia, Fae Fawn** / **Protector of Dreams** · Sig: `Lilting Lullaby`

**Rewards:** ⚠️ **having `Temporary` units already on board** — the ability discounts itself,
so it snowballs but starts expensive.

✅ **Fits.** Other `Temporary` sources to prime the discount: **`Sprite Call`**,
**`Sprite Burst`**, **`Sprite Fountain`**, **`Sprite Mother`**, **`Mirror Image`**,
**`Shadow's Call`**. ⭐ **`Black Flame Altar`** (battlefield — *Temporary units here have
Shield*) and **`Smoke and Mirrors`** (needs a Temporary unit) reward the density directly.
Sprites enter **ready**, so they can move and contest the same turn.

❌ **Doesn't fit.** ⚠️ **`Temporary` units die at the start of your Beginning Phase, *before*
scoring** (CR 816.1.b). **They cannot Hold.** A Sprite army scores by **conquering only** —
building a Holder deck with this Legend is a fundamental misread.

**Shape:** conquer-focused token tempo. Never plan to hold.

## Green Father — Ivern · Calm/Order
`When you conquer or hold, [E]: replace that battlefield with a Brush token` · CC: **Ivern, Friend to All** / **Nurturer** · Sig: `Daisy!`

**Rewards:** ⚠️ **terraforming** — it *replaces* the battlefield (CR 438), which is unique.

✅ **Fits.** `Brush` gives **+1 Might to Bird, Cat, Dog, Poro and Ivern units**, so the Legend
is only worth playing with that tribal density: **`Friendship`** (+1 per tribe you have),
**`Undying Loyalty`** (cheaper for those tags), **`Ultrasoft Poro`**, Bird tokens.
⭐ Strategically, replacing a battlefield is **removal for an opposing battlefield's ability** —
if the opponent brought `Vaults of Helia` or `Forgotten Monument`, you can delete it.

❌ **Doesn't fit.** ⚠️ Without the tribal tags, Brush is a **downgrade** — you're replacing a
battlefield that may have had a useful ability with one that does nothing for you. Also
⚠️ **`Brush` can be swapped back when scored**, so it isn't permanent.

**Shape:** tribal go-wide with a battlefield-denial angle.

## Pridestalker — Rengar · Fury/Body
`When you play a unit, give a unit +1 Might this turn` · CC: **Rengar, Pouncing** / **Trophy Hunter** / **Unseen** · Sig: `Thrill of the Hunt`

**Rewards:** **playing units** — no cost, no exhaust, triggers every single time.

✅ **Fits.** The cheapest, widest unit curve you can build; every body is also a combat trick.
⭐ **`Rengar, Pouncing`** is a **`[Reaction]` unit that can be played to a battlefield you're
attacking** — so you can add a body *and* pump mid-combat, in one card. **`Thrill of the
Hunt`** (signature) banishes a friendly unit and replays it to **any** battlefield, ignoring
cost — which re-triggers the Legend.

❌ **Doesn't fit.** ⚠️ **Spell-heavy control.** The Legend is a blank if your turn is
`Vengeance`. It also gives only +1 *this turn*, so it rewards **playing units during combat**,
not pre-committing them.

**Shape:** low-curve aggro that ambushes fights with extra bodies.

## Bloodharbor Ripper — Pyke · Fury/Chaos
`1E, [E]: Return a friendly unit at a battlefield to hand. Play a Gold token exhausted` · CC: **Pyke, Dockside Butcher** / **Returned** · Sig: `Death from Below`

**Rewards:** ⚠️ **re-using play effects** — bouncing your own unit is the point, and you get
paid a Gold for it.

✅ **Fits.** Units whose value is in *arriving*: **`Riptide Rex`** (6 damage on play),
**`Sandshifter`**, **`Zaunite Bouncer`**, **`Harnessed Dragon`** (kill on play),
**`Beast Below`**. Also rescues a unit about to die. **`Ripper's Bay`** (battlefield) channels
a rune when a unit is returned to hand.

❌ **Doesn't fit.** ⚠️ **Vanilla bodies and stat-based threats** — bouncing a `Volibear,
Imposing` just wastes tempo. Also ⚠️ **anti-synergy with Holder plans**: returning your unit
gives up the battlefield you were holding.

**Shape:** value-engine tempo built on repeated enter-the-board effects.

## Virtuoso — Jhin · Fury/Mind
`When you play a spell, if you spent 4+, you may banish it. At four banished: put each in trash, channel 4 runes, draw 1` · CC: **Jhin, Meticulous Killer** / **Murderous Artist** · Sig: `Curtain Call`

**Rewards:** ⚠️ **four expensive spells over the course of a game** — a slow, explicit
four-step payoff.

✅ **Fits.** Mid-to-high-cost spells that you were casting anyway: **`Void Seeker`**,
**`Falling Comet`**, **`Singularity`**, **`Icathian Rain`**, **`Curtain Call`** (signature,
with three `[Repeat]` modes). Note the condition is **Energy *spent***, not printed cost —
so cost reduction can turn the Legend off, unlike Lux.

❌ **Doesn't fit.** ⚠️ **Cheap interaction builds never reach the threshold.** And banishing
your spells means **no trash recursion** — so `Fizz, Trickster`, `The Harrowing` and Flow
packages actively conflict with the Legend's own engine.

**Shape:** big-spell control that pays off once, hugely, around turn 6–8.

## Piltover Enforcer — Vi · Fury/Order
`When you conquer, if you assigned 3+ excess damage, [E]: ready a unit` · CC: **Vi, Destructive** / **Hotheaded** / **Peacekeeper** · Sig: `Hextech Gauntlets`

**Rewards:** ⚠️ **overkill** — you must assign **3 or more excess damage**, which requires
attacking with far more Might than the defenders have.

✅ **Fits.** Oversized attackers and pump: `Cleave`, `Primal Strength`, `Blood Rush`,
`Square Up`. ⭐ **`Tryndamere, Barbarian`** scores a **point** on 5+ excess damage and
**`Sivir, Ambitious`** converts excess into damage — the same condition, thrice.
**`Hextech Gauntlets`** (signature) and **`Trapping Grounds`** (battlefield) also key off
excess damage.

❌ **Doesn't fit.** ⚠️ **Efficient, on-curve trading is the wrong plan.** Excess damage is by
definition *wasted* Might — this Legend asks you to overcommit deliberately, which is the
opposite of how most decks want to attack. ⚠️ Note **no-overkill assignment rules**
(CR 465.2.c.4) mean excess only exists when total attacker Might exceeds *all* defenders.

**Shape:** deliberately oversized attacks that convert waste into tempo.

## Scorn of the Moon — Diana · Mind/Chaos
`[Reaction], [E]: Add 1 Energy. Spend only during showdowns` · CC: **Diana, Lunari** / **No Longer Human** · Sig: `Moonfall`

**Rewards:** **acting inside combat.** The mana is unusable outside a showdown.

✅ **Fits.** `[Action]`/`[Reaction]` density — this Legend is a dedicated trick deck.
Mind/Chaos is rich in it: **`Stupefy`**, **`Eclipse`**, **`Gust`**, **`Star-Crossed`**,
**`Frigid Touch`**, **`Moonfall`** (signature). Combined with holding ready runes
([CARD-KNOWLEDGE §1.2](CARD-KNOWLEDGE.md#12-ready-runes-are-your-interaction-currency--verified)),
you can operate a full turn ahead of the opponent.

❌ **Doesn't fit.** ⚠️ **Sorcery-speed decks waste it completely.** If your cards say neither
Action nor Reaction, the Energy is unspendable. This is the strictest timing restriction of
any Legend — **check every card's timing keyword before including it.**

**Shape:** pure instant-speed control. The most "hold up mana" deck in the format.

## Deceiver — LeBlanc · Mind/Order
`When you conquer or hold, discard 1 + [E]: play a ready Reflection token there, copying another unit there, with Temporary` · CC: **LeBlanc, Everywhere at Once** / **Fragmented** · Sig: `Mirror Image`

**Rewards:** **scoring** (either way), converted into a copy of your best unit.

✅ **Fits.** One high-value body to clone — the copy arrives **ready**, so it can immediately
fight or move. **`Mirror Image`** (signature) does the same at instant speed.
⚠️ The copy has **`Temporary`**, so it dies before your next scoring step — it's a burst, not a
board. Discard fodder is a cost, so cards that *want* to be discarded help: **`Flame
Chompers`**, **`Lunar Boon`**.

❌ **Doesn't fit.** ⚠️ **Token-swarm builds** — copying a 1-Might Recruit is pointless.
⚠️ And because the Reflection is `Temporary`, **it cannot Hold for you next turn**, so this
does not compound into a Holder plan the way it first appears.

**Shape:** midrange with one premium threat, doubled on the turn it matters.

---

# Part 4 — Vendetta Legends (9)

Six of nine are built on **Empower** — a paid, persistent status (CR 827–828).

## Matriarch of War — Ambessa · Body/Order
`When you empower something else, empower me` · `Disempower me, [A], [E]: Ready a unit` · CC: **Ambessa, Respected and Feared** / **The Wolf** · Sig: `Public Execution`

**Rewards:** ⚠️ **empowering *anything else*** — the Legend is a free rider on your Empower
package, then cashes the status for an untap.

✅ **Fits.** Cheap Empower costs so the trigger is repeatable: **`Legion Marauder`** (1E *or*
1 Body), **`Punching Poro`** (discard 1), **`Escaped Grayback`** (kill a friendly),
**`Hextech Formula`** (empower another gear). **`Risen Altar`** (battlefield) discounts Empower
costs. ⭐ **`Aurok General`** (*your Empowered units have +2 Might*) turns the whole package
into a payoff.

❌ **Doesn't fit.** ⚠️ **`Ambessa, The Wolf`** is a trap as Chosen Champion here: her Empower
costs `3E + Body` and gives *herself* +3 — she is an Empower **sink**, not a source, and the
Legend wants cheap sources. **Respected and Feared** is the better pairing.

**Shape:** Empower-chaining midrange with repeated untaps.

## Curator of the Sands — Nasus · Calm/Mind
`When you play a unit, gear, or activated ability with Energy cost 7+, [E]: ready up to 2 runes` · CC: **Nasus, Ascended** / **Guardian of Knowledge** · Sig: `Siphoning Strike`

**Rewards:** ⚠️ **expensive *non-spell* cards** — note it excludes spells, unlike Lux and Jhin.

✅ **Fits.** Big units and gear: **`Needlessly Large Yordle`** (10E), **`Nasus, Ascended`**
(8E1P), **`Trove Golem`**, **`Vanguard Armory`** (7E1P), **`Bottled Constellation`** (10E2P).
Because it **readies runes**, it partially refunds the very card that triggered it — and it
converts a slow turn into opponent-turn interaction. ⭐ **`Nasus, Ascended`** Empowered scores
a point on conquer.

❌ **Doesn't fit.** ⚠️ **Spells never trigger it**, no matter how expensive — `Final Spark`
does nothing here. Cheap curves obviously fail it too. This Legend demands genuine top-end.

**Shape:** ramp control that gets its mana back when it lands a bomb.

## Eye of Twilight — Shen · Calm/Order
`[Action], [E]: Give a friendly unit Tank this turn` · CC: **Shen, Kinkou** / **Leader of the Kinkou Order** / **Scourge of Shadows** · Sig: `Shadow Dash`

**Rewards:** **damage redirection at instant speed** — `Action` timing means you can do it
*during* the showdown, after the attack is declared.

✅ **Fits.** A cheap expendable body to absorb the hit, protecting a real threat — the Legend
is essentially free `Tank` every turn. ⭐ **`Shen, Kinkou`** is a **`[Reaction]` unit** with
`Shield 2` + `Tank` — flash him in as a blocker *and* Tank something else.
**`Kinkou Temple`** (battlefield) gives Tank units +1 Might.
[Tank is worth ~9 points of conquest denial](CARD-KNOWLEDGE.md#84-what-tank-actually-does).

❌ **Doesn't fit.** ⚠️ **Aggro.** `Tank` only affects **combat damage assignment**, so it does
nothing on your own attacks. ⚠️ Also note **`Dune Surfer`** (*you ignore Tank while assigning
combat damage here*) is a printed hard answer.

**Shape:** defensive Holder that protects one key unit indefinitely.

## Butcher of the Sands — Renekton · Fury/Body
`[Reaction], [A][A], [E]: Add 2 Energy. Spend only to play units or unit activated abilities` · CC: **Renekton, Brute** / **Rage Fueled** · Sig: `Dominus`

**Rewards:** **unit density**, at Reaction speed. Note the conversion: **2 Power → 2 Energy**,
so it is a [resource converter](CARD-KNOWLEDGE.md#43-resource-converters-break-the-energypower-wall) as well as a ramp.

✅ **Fits.** Units with `[Reaction]`/`[Ambush]` you can deploy on the opponent's turn —
**`Rengar, Pouncing`**, **`Shen, Kinkou`** (not in this identity, but the pattern) — and
expensive bodies the extra Energy actually reaches. ⭐ **`Renekton, Brute`** (*1E: +1 Might;
when my Might hits 10, empower me*) is exactly the "unit activated ability" the mana is
restricted to. **`Dominus`** doubles a unit's Might and grants a ready ability.

❌ **Doesn't fit.** ⚠️ **Spell-based control.** The Energy cannot pay for spells at all — a
Fury burn deck is the wrong build despite the domain.

**Shape:** unit-centric tempo that deploys at instant speed.

## Rogue Assassin — Akali · Fury/Calm
`[Empower] 3E[A]` · `[Action], [E]: move a friendly unit in a showdown to base; if Empowered, ready it` · CC: **Akali, Deadly Weapon** / **Silent** · Sig: `Shuriken Flip`

**Rewards:** **pulling units out of combat** — a hit-and-run Legend.

✅ **Fits.** Attack, trigger play/attack effects, then withdraw before damage. Pairs with
attack-triggered units: **`Yasuo, Remorseful`**-style hitters, **`Lucian, Gunslinger`**.
Empowered, it also **readies** the retreating unit, letting it attack a *second* battlefield.
⭐ **`Akali, Silent`** *"can't be chosen by enemy spells unless I'm in combat"* — she is nearly
untouchable outside a fight.

❌ **Doesn't fit.** ⚠️ **`Vilemaw's Lair` and `Minotaur Reckoner`** forbid moving to base and
shut the Legend off. ⚠️ Also note the Legend requires **your turn** and a **showdown in
progress** — it is dead on defence.

**Shape:** hit-and-run tempo that never leaves units exposed.

## Master of Shadows — Zed · Fury/Chaos
`When you banish a card you own, empower me` · `[Action], [E]: Disempower me, discard 1 then draw 1` · CC: **Zed, From the Shadows** / **Without a Sound** · Sig: `Death Mark`

**Rewards:** ⚠️ **banishing your own cards** — an unusual trigger that most decks never do.

✅ **Fits.** `[Flow]` spells **banish themselves after being played from trash** (CR 829.1.b),
so every Flow cast empowers the Legend: **`Death Mark`** (signature), **`Onslaught`**,
**`Perfect Execution`**, **`Brittle Steel`**, **`Dredge Up`**. **`Burn`** effects fill the
trash to enable Flow — **`Forgotten Relic`**, **`Kennen, Storm of Shuriken`**.
**`The Zero Drive`** and **`Smite`** also banish.

❌ **Doesn't fit.** ⚠️ **Ordinary trash recursion is the *wrong* engine** — `Morbid Return` and
`The Harrowing` return cards without banishing, so they don't trigger the Legend. The
distinction between *trash* and *banish* matters enormously here and is easy to conflate.

**Shape:** Flow/Burn deck that treats the trash as a second hand.

## Defender of Tomorrow — Jayce · Body/Mind
`[Empower] 2E[A][A]` · `1E, [E]: Ready a gear` · `[Empowered]: 1E, [E]: Ready 2 gear` · CC: **Jayce, Brilliant Inventor** / **Hammer in Hand** / **Man of Progress** · Sig: `Acceleration Gate`

**Rewards:** **gear with activated abilities** — readying them is only worth mana if they
*do* something when tapped.

✅ **Fits.** Tap-gear engines: **`Iron Ballista`** (deal 2), **`Seal of Strength`**/
**`Seal of Insight`** (Power), **`Ancient Henge`**, **`Hextech Anomaly`**, **`Arena Bar`**,
**`Vanguard Armory`**. ⭐ Doubling a Seal's activation is effectively **+1 Power per turn**.
**`Acceleration Gate`** (signature — ready up to 4 units/gear/runes) and **`Piltovan Forge`**
(battlefield) extend the theme.

❌ **Doesn't fit.** ⚠️ **Equipment is largely wrong here.** Equipment's value is in being
*attached*, not in being *readied* — so an Ornn-style gear deck and a Jayce gear deck want
**different gear entirely**. This is the subtlest fit distinction among the gear Legends.

**Shape:** tap-engine combo that generates value every turn.

## Soul's Reflection — Mel · Mind/Chaos
`When you empower something else, empower me` · `Disempower me, [E]: Give a unit at a battlefield −2 Might` · CC: **Mel, Defiant Soul** / **Newly Awakened** · Sig: `Rebuttal`

**Rewards:** the same free-rider pattern as Ambessa, cashed for **repeatable −2 Might**.

✅ **Fits.** Cheap Empower sources to re-arm each turn, plus Might-reduction stacking —
Mind is the −Might domain: **`Stupefy`**, **`Frigid Touch`**, **`Eclipse`**,
**`Moonlight Affliction`**. ⭐ **`Mel, Newly Awakened`** Empowered gives **−Might effects an
extra −1** *and* makes your spells **uncounterable** — the single strongest Empower payoff in
the format. **`Rebuttal`** (signature) counters or **steals** a spell.

❌ **Doesn't fit.** ⚠️ The Legend's own ability is `[Action]`-less — it's sorcery speed, so it
can't save a unit mid-combat. Don't rely on it as combat interaction; use it proactively.

**Shape:** Empower-fuelled control that shrinks the board a little every turn.

## Heart of the Tempest — Kennen · Chaos/Order
`When you play a card from anywhere other than your hand, empower me` · `[Action], [E]: Disempower me, give a unit Assault 2` · CC: **Kennen, Keeper of Balance** / **Storm of Shuriken** · Sig: `Lightning Rush`

**Rewards:** ⚠️ **playing cards from non-hand zones** — trash, facedown, or deck.

✅ **Fits.** Three separate packages all trigger it: **`[Hidden]`** cards played from facedown,
**`[Flow]`** spells from trash, and reveal-based plays (**`Void Rush`**, **`Rek'Sai, Swarm
Queen`**, **`Nocturne, Horrifying`**). ⭐ **`Kennen, Storm of Shuriken`** grants `[Flow]` to any
spell in your trash on conquer — manufacturing the trigger on demand.
**`Void Drone`** and **`Drag Under`** cost 2 less from non-hand zones.

❌ **Doesn't fit.** ⚠️ **A normal hand-based curve never triggers it once.** This is the most
build-around Legend in the format — if you can't reliably play from trash or facedown, pick a
different Legend.

⚠️ **Deckbuilding note:** this Legend carries **two tags** (`Yordle`, `Kennen`). Only **Kennen**
is the champion tag — the Chosen Champion pool is 2 units, **not** the 13 Yordles
([L32](../spec/LEGALITY.md)).

**Shape:** the format's dedicated "cast from anywhere but hand" deck.

---

# Part 5 — Patterns across all 49

**Legends cluster into six reward types:**

| Type | Legends | Deckbuilding consequence |
|---|---|---|
| **Restricted mana** | Kai'Sa (spells), Ornn (gear), Renekton (units), Diana (showdowns), Lux Crownguard | ⚠️ The mana is **dead** if the deck's composition doesn't match. Highest misbuild risk |
| **Behaviour triggers** | Darius (Legion), Irelia (choose friendly), Vi (excess damage), Jhin (4+ spent), Kennen (non-hand plays) | Require a *habit*, not a card type |
| **Scoring triggers** | Ahri, Gloomist, Chem-Baroness, Poppy, Ivern, LeBlanc, Rek'Sai | Split cleanly into **Hold** vs **Conquer** — these are opposite decks |
| **Resource engines** | Annie, Nasus, Sivir, Jayce, Pyke | Convert one resource into another; care about *timing*, not composition |
| **Tribal / type** | Rumble (Mech), Ivern (Brush tags), Azir (Sand Soldiers) | Least flexible; count your enablers first |
| **Stat payoffs** | Volibear (Mighty), Fiora (becomes Mighty), Master Yi (XP), Lee Sin (buffs) | ⚠️ Threshold effects — verify you can actually reach them |

**The three most common misbuilds** — note all three are **deck-level**, not card-level:

1. ⚠️ **Restricted mana with the wrong card mix** — a Kai'Sa deck with 25 units, an Ornn deck
   with 4 gear. The Legend becomes a blank rune *for the whole game*. This is the only
   near-absolute constraint in the format.
2. ⚠️ **A resource budget that never reaches its threshold** — `Master Yi` spending XP faster
   than he earns it. Individual sinks are fine; a deck with no net income is not.
3. ⚠️ **Hold vs Conquer confusion** — `Bashful Bloom`'s Temporary units **die before scoring**
   and can never Hold; `Poppy` and `Gloomist` gain nothing from conquering. Getting the
   *direction* backwards silently halves the deck.

> **What is *not* on this list:** individual cards that don't trigger the Legend. A good card
> is a good card. Forty cards that all fail the Legend is the problem — one is not.
