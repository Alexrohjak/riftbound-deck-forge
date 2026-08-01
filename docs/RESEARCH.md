# Research Findings

Everything established about Riftbound and its data ecosystem during Discovery.
Captured so it does not have to be rediscovered.

**Compiled:** 2026-08-02

---

## 1. The Game

**Riftbound: League of Legends Trading Card Game** — Riot Games' physical TCG.

| | |
|---|---|
| Released | 31 October 2025 |
| Game director | Dave Guskin (previously Legends of Runeterra) |
| English publisher | UVS Games |
| Chinese publisher | Shining Soul |
| Sets (per RiftScribe API) | `OGN`, `OGS`, `SFD`, `UNL`, `VEN` |
| Initial products | *Origins* booster · *Proving Grounds* learn-to-play box · Champion decks (Jinx, Viktor, Lee Sin) |

### What makes it structurally distinct

It is a **territory game, not a life-total game**.

- Win at **8 points**, scored by conquering and holding **Battlefields**
- The **8th point must come from holding** a Battlefield, or from conquering all
  Battlefields in a single turn — not merely from a conquest
- No player life total in the Magic/Pokémon sense

### Resource system — two axes

Runes live in a **separate 12-card Rune Deck**.

- **Exhaust** a rune (turn sideways) → generic **Energy**
- **Recycle** a rune (to the bottom of the Rune Deck) → coloured **Power**
- The *same rune* can be exhausted *and* recycled in one payment sequence
- Runes refresh at the start of your turn
- **Unspent pool empties each turn** — Energy and Power do not carry over

This two-axis cost model is why the API exposes `stats.energy` and `stats.power`
as separate fields, and why rune-deck composition is a real optimisation problem.

### Turn structure (A-B-C-D-A)

1. **Awaken** — ready all exhausted cards
2. **Beginning** — score points for Battlefields you control, resolve start-of-turn effects
3. **Channel** — draw 2 Runes (3 if second player on turn one)
4. **Draw** — draw 1 card from the Main Deck; the Rune Pool then empties
5. **Action** — play cards, move units, initiate combat, activate abilities

### Showdowns (combat)

Triggered when control of a Battlefield becomes **contested**. Both players get
priority windows to play cards and abilities; passing in sequence ends the Showdown.
Units deal damage per **Might**; the side left standing takes control. Taking control
of a Battlefield not already yours = a **conquest** = 1 point.

### The six domains

`fury` · `chaos` · `mind` · `body` · `order` · `calm` — plus `colorless`.
A Legend defines a **two-domain identity** gating the entire deck.

### Deck construction

> **See §4 for the authoritative, citation-backed rules.** The summary below is
> orientation only; §4 governs.

Rune split heuristic: start at **6/6**, skew (e.g. 8/4) toward whichever domain
carries the heavier Power costs. Add Seals for recycle-heavy or high-Power decks.

### Keywords observed

`accelerate` · `assault N` · `conquer` · `deflect` · `hidden` · `legion` · `tank` ·
`hunt` (earns XP on conquering/holding)

- **Accelerate** — pay an additional cost as you play; enter ready
- **Assault N** — +N Might *while attacking only*
- **Deflect** — raises the cost for opponents to target this unit
- **Hidden** — play face down at a controlled Battlefield; reveal and play free later
- **Legion** — triggers if you have already played another Main Deck card this turn
- **Tank** — damage must be assigned to Tank units first

### Named archetypes

| Champion | Archetype |
|---|---|
| Jinx | Aggro / Burn |
| Viktor | Token / Value |
| Lee Sin | Buff / Reposition |
| Yasuo | Mobility / Battlefield interaction |
| Ahri, Darius | Flexible — support multiple archetypes depending on curve |

⚠️ **Archetype→card mapping is not exposed by any API.** It must be sourced or
derived. This is a real gap for the Phase B generator.

---

## 2. Card Data — ✅ SOLVED

### RiftScribe API — **chosen source** (D-002)

Base URL `https://riftscribe.gg` · JSON · **no authentication** · free · public.
Self-described as an independent fan project.

| Endpoint | Purpose |
|---|---|
| `GET /api/cards` | List with filters (set, faction, rarity, type, name) |
| `GET /api/cards/search?q=` | Fuzzy typeahead — min 2 chars, max 20 results |
| `GET /api/cards/filters` | Distinct filter values |
| `GET /api/cards/{card_id}` | Full card detail |

**Verified live response** for `GET /api/cards/filters`:

```json
{
  "sets": ["OGN","OGS","SFD","UNL","VEN"],
  "factions": ["body","calm","chaos","colorless","fury","mind","order"],
  "rarities": ["common","epic","rare","showcase","uncommon"],
  "types": ["Battlefield","Gear","Legend","Rune","Spell","Unit"]
}
```

**Verified card object** (`ogn-030-298`):

```json
{
  "id": "ogn-030-298",
  "name": "Jinx, Demolitionist",
  "set_id": "OGN",
  "collector_number": 30,
  "variant": "",
  "rarity": "rare",
  "faction": "fury",
  "type": "Unit",
  "stats": { "energy": 3, "might": 4, "power": 1 },
  "image": "https://cdn.riftscribe.gg/cards/originals/...png",
  "image_thumb": { "small": "...", "medium": "...", "large": "..." },
  "is_banned": false,
  "description": "[Accelerate] ... [Assault 2] ... When you play me, discard 2.",
  "keywords": ["accelerate", "assault 2"],
  "tags": [],
  "prev_card_id": "ogn-029-298",
  "next_card_id": "ogn-030a-298"
}
```

**Notable:** `keywords` arrives **pre-parsed**, `is_banned` is provided, and
`stats` separates energy/might/power. This is close to ideal for a constraint solver.

### Pagination

`limit` is capped at **200** (`limit=500` returns a 422 with `"Input should be less
than or equal to 200"`). Use `offset` to page. The `set` query parameter did **not**
filter in testing — all sets returned the full pool — so **filter client-side on
`set_id`** until the correct parameter name is confirmed.

### ⚠️ The card universe is small — measured 2026-08-02

Full enumeration via paginated `GET /api/cards`:

| Measure | Count |
|---|---|
| Total card entries (printings) | **950** |
| **Distinct card names** — what the 3-copy limit counts | **767** |
| OGN (Origins) | 352 printings → **298 distinct names** |
| SFD | 288 |
| UNL | 286 |
| OGS | 24 |

OGN by type: Unit 166 · Spell 84 · Gear 30 · Legend 36 · Battlefield 24 · Rune 12

**This measurement directly caused the D-003 → D-013 reversal.** The whole card pool
fits comfortably in memory and can be cached locally in full, which also mitigates
the risk of RiftScribe disappearing (D-002).

### ⚠️ Variant collapsing

`ogn-202-298` and `ogn-202a-298` are **both "Jinx, Rebel"** — different printings of
the same card. The collection must track printings distinctly (for what you
physically own) while the legality engine collapses them **by name** (for the 3-copy
limit). Getting this wrong breaks copy-limit maths silently.

### Alternatives (not chosen)

- **Scrydex** — `scrydex.com/docs/riftbound/cards`
- **API TCG** — `apitcg.com`, open-source multi-TCG
- **RiftboundCardDatabase** (GitHub, `vikkumar2021`) — includes a Python fetcher

---

## 3. Meta / Tournament Data — 🔴 EXISTS, BUT ACCESS IS BLOCKED

The data underpinning the Phase B generator is real and substantial — but there is
**no legitimate programmatic route to it today**.

### RiftDecks — `riftdecks.com`

**194,271 decks across 2,078 tournaments** (verified from the live page, 2026-08-02).
Tournament decks, user decks, matchup analysis, country/relevance categorisation.

**No public API found.** Its `robots.txt` opens with:

```
# WARNING: Scraping of this website is explity not allowed for:
# - riftbound.gg and its bots/crawlers
# - riftboundstats.com and its bots/crawlers
# - riftools.app and its bots/crawlers
# And any other similar sites building a competing service
```

### Riftools — `riftools.app`

Legend winrates, matchup matrices, card play-rate and conversion stats, tier lists.
Self-described as unofficial and fan-made, with data that "may be incomplete,
delayed, or corrected over time."

⚠️ **Volume discrepancy to resolve.** Riftools' own page reported *5 tournaments,
209 decklists, 288 games* — orders of magnitude below RiftDecks' figures. Either
they cover different scopes or one figure is stale. **Confirm before relying on
either as a quality signal.**

### Piltover Archive — `piltoverarchive.com`

Riot's official site: card gallery, deck builder, hand simulator, proxy creation,
community decklists, tournament champion lists. `robots.txt` allows general
crawling but **disallows `/api/`**.

### Position

See **D-009** and **D-010**. No scraping. Meta scoring sits behind a pluggable
adapter; legitimate access is requested in parallel; the project functions fully
without it.

---

## 4. ✅ AUTHORITATIVE RULES — from the official rulebooks

**Sources — the only legality authority (D-020):**

| Document | Version | URL |
|---|---|---|
| **Core Rules** (CR) | 16 July 2026 | [PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/e9ac8e3d33e0f78cef296f5945aba7bc1313b086.pdf) |
| **Tournament Rules** (TR) | 16 July 2026 | [PDF](https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/503da65669ced10598d62925a6f6bc15111af726.pdf) |
| Rules Hub | — | https://playriftbound.com/en-us/rules-hub/ |

Errata and patch notes exist per set (Origins, Spiritforged, Unleashed, Vendetta —
Vendetta errata 23 July 2026) and **must** be folded in before the legality engine
is considered complete.

### 4.1 Deck composition — CR 103

| Component | Rule | Citation |
|---|---|---|
| Champion Legend | Exactly 1. Placed in the Legend Zone. **Dictates Domain Identity.** | CR 103.1 |
| Main Deck | **At least 40** (casual) · **exactly 40** (competition) | CR 103.2 / TR 601.1.b |
| Chosen Champion | 1 Champion Unit, counted **within** the 40 | CR 103.2.a |
| Rune Deck | Exactly **12**, shuffled, kept separate from the Main Deck | CR 103.3 |
| Battlefields | Count **dictated by Mode of Play** (3 in 1v1). Names must be unique | CR 103.4 |
| Sideboard | **10 or fewer cards** — *not* 0-or-8 | TR 601.1.c.1 |

> ⚠️ **Main deck size is mode-dependent.** The legality engine needs a
> **casual / competition** switch. Casual permits >40; competition demands exactly 40.

### 4.2 Domain Identity — CR 103.1.b

- Domain Identity is dictated by the **domains of the Champion Legend** (CR 103.1.b.2)
- A **single-domain** card is permitted in a Domain Identity containing that domain (103.1.b.3)
- A **multi-domain** card is permitted **only** in a Domain Identity containing
  **all** of that card's domains (103.1.b.4)
- Rune Deck cards must also match Domain Identity (CR 103.3.a.1)
- Some Game Effects allow cards in irrespective of domain; those cards then **count
  as** part of the deck's Domain Identity (103.1.b.5)

### 4.3 Copy limits — CR 103.2.b

- **Up to 3 copies** of the same **named** card
- **Includes the Chosen Champion** — e.g. Volibear, Furious as Chosen Champion **plus
  2 more copies** in the Main Deck is legal (103.2.b.1)
- ⚠️ **"Cards have different names even if they represent the same character"**
  (103.2.b.2). A deck may run **3× Yasuo, Remorseful *and* 3× Yasuo, Windrider.**
- Copy limits apply to **Main Deck + sideboard combined** (TR 601.1.c.3)

> **Implementation:** the limit keys on the **card name string**, not the character,
> and not the printing. Variants of one name (`ogn-202-298` / `ogn-202a-298`,
> both "Jinx, Rebel") **collapse together**; different names of the same character
> **do not**.

### 4.4 Chosen Champion — CR 103.2.a

- Must be a **champion unit** whose **champion tag matches** the Champion Legend's tag
- *Example (103.2.a.2):* Loose Cannon has tag `Jinx`, so Jinx, Rebel or
  Jinx, Demolitionist may be the Chosen Champion
- ⚠️ **Signature units cannot be the Chosen Champion.** Tibbers has tag `Annie` but
  is a *signature* unit, not a champion unit — ineligible even under an Annie Legend
- During play, **any Champion Unit sharing the name** of the selected card also counts
  as the Chosen Champion (103.2.a.3)

### 4.5 ⚠️ Signature cards — CR 103.2.d — *previously unknown constraint*

- A deck may contain **a sum total of 3 Signature cards, regardless of name** (103.2.d.1)
- All Signature cards must carry the **Champion tag matching the Champion Legend** (103.2.d.2)
- Signature cards are **not** Champion units and **cannot** occupy the Champion Zone (103.2.d.3)

> This is a **separate, additional** limit from the 3-copies-per-name rule. Three
> *different* Signature cards already exhausts the allowance. Missing this would
> have produced illegal decks with no warning.

### 4.6 Card legality — TR 601.2

- A card is legal if it is from a format-legal set **or shares a name** with a card
  from a format-legal set (601.2.a)
- Reprints with collector numbers outside a set's normal numbering (e.g. `300/250`)
  are **not** automatically format-legal (601.2.c)
- **Banned cards** may not be included (601.2.d)
- Exception: at low OPL, an **exact** preconstructed deck configuration may use its
  banned cards — but **any** change or added sideboard voids the exemption (601.2.d.2)

> The RiftScribe API exposes `is_banned`, but format-specific banning must be
> verified against the official ban list.

### 4.7 Standard format — TR 601.3

Most recent 5–8 sets; current year plus previous year. **Current Standard:**
`OGS` · `OGN` · `SFD` · `UNL` · `VEN` (Vendetta released 31 July 2026).

### 4.8 Sideboarding procedure — TR 403 / 601.1.c

- Sideboard cards exchange **1-for-1** with Main Deck cards (403.4)
- Main Deck must still satisfy deck-size rules after sideboarding (403.4.c)
- A sideboard may contain **only valid Main Deck cards** (601.1.c.2)
- ⚠️ The **Chosen Champion may be swapped** for one from the sideboard or main deck
  matching the Legend, whenever sideboarding is allowed (601.1.c.4)
- No sideboarding before game 1 (403.5); none after a draw (403.10)

---

## 5. Collection Scanner Apps — ❌ NOT USED

Investigated for D-003, then **abandoned** in D-013. Recorded so the ground is not
re-covered.

| App | Platform | Outcome |
|---|---|---|
| **Rift TCG Scanner** | iOS + Android | ❌ **Paid**, with scan limits. Trigger for the D-013 reversal. |
| **RiftScan** | Android only | Not viable — user is on iPhone 13 |
| **TCG Stacked** | Web + mobile | Not pursued |
| **OpenRift** | Web | Not pursued for ingestion, but **open source, free, and uses Piltover-compatible deck codes** — worth revisiting as an interop/export reference |

**Conclusion:** collection entry is built in-house (D-013), keyed on **collector
number**. Every Riftbound card prints its collector number, making numeric entry
faster and less ambiguous than either OCR or name typing.

---

## Sources

- [Riftbound official](https://riftbound.leagueoflegends.com/en-us/) · [Wikipedia](https://en.wikipedia.org/wiki/Riftbound)
- [Piltover Archive](https://piltoverarchive.com/) · [deck builder](https://piltoverarchive.com/deckbuilder)
- [RiftScribe API docs](https://riftscribe.gg/api-docs)
- [Fextralife wiki — Deck Construction](https://riftbound.wiki.fextralife.com/Deck_Construction) · [How To Play](https://riftbound.wiki.fextralife.com/How_To_Play)
- [Rift Watcher core rules](https://riftwatcher.com/rules/)
- [Riftools](https://www.riftools.app/) · [RiftDecks](https://riftdecks.com/)
- [Mobalytics keywords](https://mobalytics.gg/riftbound/guides/keywords)
- [Riftbound.gg archetypes](https://riftbound.gg/riftbound-tcg-deck-archetypes-how-to-find-your-playstyle/)
