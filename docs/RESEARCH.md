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

### Deck construction (confirmed)

| Zone | Requirement |
|---|---|
| Legend | exactly 1 — defines domain identity |
| Chosen Champion | exactly 1 — champion tag must match the Legend |
| Main Deck | minimum 40 |
| Rune Deck | exactly 12 |
| Battlefields | exactly 3, distinct |
| Copy limit | **max 3** per unique card name, Chosen Champion included |
| Sideboard | ⚠️ **conflicting sources — see §4** |

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

## 4. ⚠️ Unresolved Rules Conflict — Sideboard Size

| Source | Claim |
|---|---|
| Piltover Archive (official) | `Sideboard 0/10 (opt)` — "Optional: 0-10 cards" |
| Community guides | **Exactly 0 or 8** — no intermediate value |

Both agree the 3-copy limit spans main deck **+** sideboard.

**Action:** resolve against the official rulebook before encoding legality.
**Standing rule:** legality rules come from official documents, never from blogs.

---

## 5. Collection Scanner Apps

Candidates for D-003 ingestion. **CSV export is claimed by store listings but has
not been verified first-hand** — test on one box before committing.

| App | Platform | Notes |
|---|---|---|
| **Rift TCG Scanner** | iOS + Android | Named collections, quantities, variants (Base/Foil/Promo), export to text or CSV |
| **RiftScan** | Android | OCR; auto-identifies card ID/number and assigns to the correct set; file export |
| **TCG Stacked** | Web + mobile | CSV upload **and** scanning |
| **OpenRift** | Web | Open source and free; imports from various platforms, exports CSV |

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
