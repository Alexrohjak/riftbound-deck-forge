# Riftbound — Game Rules Reference

> How the game works. Reference material, not a specification — for what the
> **validator must enforce**, see [spec/LEGALITY.md](../spec/LEGALITY.md).
>
> **Authority:** Riot's official rulebooks only ([D-020](../DECISIONS.md#d-020)).
> Community guides have already been wrong once.

| Document | Version | URL |
|---|---|---|
| **Core Rules** (CR) | 16 July 2026 | [PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/e9ac8e3d33e0f78cef296f5945aba7bc1313b086.pdf) |
| **Tournament Rules** (TR) | 16 July 2026 | [PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/503da65669ced10598d62925a6f6bc15111af726.pdf) |
| Rules Hub | — | https://playriftbound.com/en-us/rules-hub/ |

Per-set errata and patch notes exist (Origins, Spiritforged, Unleashed, Vendetta —
errata 23 July 2026) and **must** be folded in before legality is considered complete.

---

## 1. The game

**Riftbound: League of Legends Trading Card Game** — Riot Games.

| | |
|---|---|
| Released | 31 October 2025 |
| Game director | Dave Guskin (previously Legends of Runeterra) |
| English publisher | UVS Games |
| Sets | `OGN` Origins · `OGS` Origins supplemental · `SFD` Spiritforged · `UNL` Unleashed · `VEN` Vendetta |

### It is a territory game, not a life-total game

- Win at **8 points**, scored by conquering and holding **Battlefields**
- The **8th point must come from *holding***, or from conquering all Battlefields in
  one turn — not merely from a conquest
- There is no player life total

> **Design consequence:** you need *bodies* to hold locations. A Unit-light deck
> physically cannot contest three Battlefields regardless of card quality.

---

## 2. The resource system — two axes

Runes live in a **separate 12-card Rune Deck** (CR 161.2.a). A Rune is **not** a Main
Deck card and is **not** a Permanent (CR 161.1).

**Every Basic Rune has exactly two abilities** (CR 164.2):

| Ability | Produces | Side effect |
|---|---|---|
| `[E]` **Exhaust** | **1 Energy** — generic, no domain (CR 163.1.a/b) | Rune stays on board, exhausted |
| `Recycle this` | **1 Power** of that rune's domain (CR 164.2.b.1) | **Rune returns to the Rune Deck** (CR 161.2.b) |

- **2 runes channelled per turn** (CR 315.3.b.1); fewer if the deck is short
- Channelled runes **remain on the board** (CR 161.1.a)
- Some Power is **Universal**, paying costs of any domain (CR 163.2.b)
- The **Rune Pool empties** at the start of each Main Phase and at end of turn —
  **unspent resources are lost** (CR 167, 316.3)

**Resource ceiling** (cumulative, no recycling):

| Turn | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Runes on board | 2 | 4 | 6 | 8 | 10 | **12 — deck empty** |

> ⚠️ **The central tension.** Paying Power **costs board presence**: recycling removes
> the rune from the board, forfeiting that Energy source, while refilling the Rune Deck
> for future channelling. Power-heavy and Energy-heavy decks have structurally
> different curves from the same 12 runes.

This is the basis of the flagship statistic — see
[spec/DECK-STATS.md](../spec/DECK-STATS.md) and [D-023](../DECISIONS.md#d-023).

---

## 3. Turn structure — A·B·C·D·A

1. **Awaken** — ready all exhausted cards
2. **Beginning** — score points for controlled Battlefields; start-of-turn effects
3. **Channel** — channel 2 Runes (3 if second player on turn one)
4. **Draw** — draw 1; the Rune Pool then empties
5. **Action / Main** — play cards, move units, initiate combat, activate abilities

## 4. Showdowns — combat

Triggered when control of a Battlefield becomes **contested**. Both players receive
priority windows; passing in sequence ends the Showdown. Units deal damage per
**Might**; the surviving side takes control. Taking a Battlefield not already yours is
a **conquest** — 1 point.

## 5. The six domains

`fury` · `chaos` · `mind` · `body` · `order` · `calm`, plus `colorless`.

✅ **Every Champion Legend carries exactly 2 domains** — verified across all 118
Legends in the official card gallery, and confirmed by the user from physical cards.
Domain Identity is therefore always a **pair**.

**169 non-Legend cards also carry 2 domains**, and per CR 103.1.b.4 those are legal
only where **both** appear in the identity.

---

## 6. Deck construction — CR 103 / TR 601

| Component | Rule | Citation |
|---|---|---|
| Champion Legend | Exactly 1. **Dictates Domain Identity** | CR 103.1 |
| Main Deck | **≥40** casual · **=40** competition | CR 103.2 / TR 601.1.b |
| Chosen Champion | 1 Champion Unit, counted **within** the 40 | CR 103.2.a |
| Rune Deck | Exactly **12**, matching Domain Identity | CR 103.3 |
| Battlefields | Count by **Mode of Play** (3 in 1v1); unique names | CR 103.4 |
| Sideboard | **≤10 cards** | TR 601.1.c.1 |

### 6.1 Domain Identity — CR 103.1.b

- Dictated by the **Champion Legend's domains** (103.1.b.2)
- A **single-domain** card is permitted where that domain is present (103.1.b.3)
- A **multi-domain** card is permitted **only** where **all** its domains are
  present (103.1.b.4)
- Rune Deck cards must also comply (CR 103.3.a.1)
- Effects may add cards irrespective of domain; those then **count as** part of the
  Domain Identity (103.1.b.5)

### 6.2 Copy limits — CR 103.2.b

- **Up to 3 copies of the same *named* card**
- **Includes the Chosen Champion** — Volibear, Furious as Chosen Champion **plus 2
  more copies** is legal (103.2.b.1)
- ⚠️ **"Cards have different names even if they represent the same character"**
  (103.2.b.2) — `3× Yasuo, Remorseful` **and** `3× Yasuo, Windrider` is legal
- Limits span **Main Deck + sideboard combined** (TR 601.1.c.3)

### 6.3 Chosen Champion — CR 103.2.a

- A **champion unit** whose **champion tag matches** the Legend's tag
- *Example:* Loose Cannon has tag `Jinx`, so Jinx, Rebel or Jinx, Demolitionist qualify
- ⚠️ **Signature units are ineligible.** Tibbers has tag `Annie` but is a *signature*
  unit — not a champion unit — even under an Annie Legend
- In play, **any Champion Unit sharing the name** also counts as Chosen Champion (103.2.a.3)

### 6.4 ⚠️ Signature cards — CR 103.2.d

- **3 Signature cards total, regardless of name** (103.2.d.1)
- All must carry the **Champion tag matching the Champion Legend** (103.2.d.2)
- They are **not** Champion units and **cannot** occupy the Champion Zone (103.2.d.3)

> A **separate, additional** limit from the 3-copies-per-name rule. Three *different*
> Signature cards already exhausts the allowance. This rule was discovered only by
> reading the PDF directly — no community guide mentioned it.

### 6.5 Card legality — TR 601.2

- Legal if from a format-legal set **or sharing a name** with one (601.2.a)
- Reprints numbered outside a set's normal range (e.g. `300/250`) are **not**
  automatically legal (601.2.c)
- **Banned cards** excluded (601.2.d)
- Exception: at low OPL an **exact** preconstructed configuration may use its banned
  cards — **any** change or added sideboard voids this (601.2.d.2)

### 6.6 Standard format — TR 601.3

Current year's sets plus the previous year's. **Currently:**
`OGS` · `OGN` · `SFD` · `UNL` · `VEN` (Vendetta released 31 July 2026).

### 6.7 Sideboarding — TR 403 / 601.1.c

- Exchanges are **1-for-1** with Main Deck cards (403.4)
- Deck size rules must still hold afterwards (403.4.c)
- Sideboard may contain **only valid Main Deck cards** (601.1.c.2)
- ⚠️ The **Chosen Champion may be swapped** for one matching the Legend whenever
  sideboarding is allowed (601.1.c.4)
- None before game 1 (403.5); none after a draw (403.10)

---

## 7. Keywords

`accelerate` · `assault N` · `conquer` · `deflect` · `hidden` · `legion` · `tank` · `hunt`

- **Accelerate** — pay an additional cost as you play; enters ready
- **Assault N** — +N Might **while attacking only**
- **Deflect** — raises opponents' cost to target this unit
- **Hidden** — play face down at a controlled Battlefield; reveal and play free later
- **Legion** — triggers if another Main Deck card was already played this turn
- **Tank** — damage must be assigned to Tank units first
- **Hunt** — earns XP on conquering or holding

---

## 8. Named archetypes — community-sourced, not official

| Champion | Archetype |
|---|---|
| Jinx | Aggro / Burn |
| Viktor | Token / Value |
| Lee Sin | Buff / Reposition |
| Yasuo | Mobility / Battlefield interaction |
| Ahri, Darius | Flexible across archetypes depending on curve |

⚠️ **Archetype→card mapping exists in no API.** See
[spec/GENERATOR.md §5](../spec/GENERATOR.md) for the proposal to sidestep this by
defining playstyle mechanically rather than by name.

### Rune split heuristic *(community, unverified)*

Start at **6/6**; skew (e.g. 8/4) toward the domain carrying heavier Power costs.
**Forge should replace this folk heuristic with computed rune feasibility.**
