# Data Sources

> What external data exists, what is usable, and what is off-limits.
> **Compiled:** 2026-08-02

---

## 1. Card data — ✅ SOLVED

### RiftScribe API — chosen source ([D-002](../DECISIONS.md#d-002))

`https://riftscribe.gg` · JSON · **no authentication** · free · public.
Self-described as an independent fan project.

| Endpoint | Purpose |
|---|---|
| `GET /api/cards` | List, with filters |
| `GET /api/cards/search?q=` | Fuzzy typeahead — min 2 chars, max 20 results |
| `GET /api/cards/filters` | Distinct filter values |
| `GET /api/cards/{card_id}` | Full card detail |

**Verified live** — `GET /api/cards/filters`:

```json
{
  "sets": ["OGN","OGS","SFD","UNL","VEN"],
  "factions": ["body","calm","chaos","colorless","fury","mind","order"],
  "rarities": ["common","epic","rare","showcase","uncommon"],
  "types": ["Battlefield","Gear","Legend","Rune","Spell","Unit"]
}
```

**Verified card object** — `ogn-030-298`:

```json
{
  "id": "ogn-030-298",
  "name": "Jinx, Demolitionist",
  "set_id": "OGN", "collector_number": 30, "variant": "",
  "rarity": "rare", "faction": "fury", "type": "Unit",
  "stats": { "energy": 3, "might": 4, "power": 1 },
  "is_banned": false,
  "keywords": ["accelerate", "assault 2"],
  "tags": [],
  "description": "[Accelerate] … [Assault 2] … When you play me, discard 2."
}
```

**Strengths:** `keywords` arrives **pre-parsed**; `is_banned` provided; `stats`
separates energy/might/power. Close to ideal for a constraint engine.

> ⚠️ **Critical gap.** `tags` was **empty** on the inspected card. Champion tags
> (`Jinx`, `Annie`) and the **Signature** supertype are *required* for legality
> (CR 103.2.a, 103.2.d) and it is **unconfirmed** that RiftScribe exposes them.
> **Stage 4 hard blocker** — see [DATA-MODEL.md DM1](../spec/DATA-MODEL.md#7-open-items).

### Pagination quirks

- `limit` caps at **200** — `limit=500` returns 422 *"Input should be less than or
  equal to 200"*
- Page with `offset`
- ⚠️ The **`set` query parameter did not filter** in testing — every set returned the
  full pool. **Filter client-side on `set_id`** until the correct parameter is found

### The card universe is small — measured 2026-08-02

| Measure | Count |
|---|---|
| Total printings | **950** |
| **Distinct names** — what copy limits count | **767** |
| OGN | 352 printings → **298 names** |
| SFD · UNL · OGS | 288 · 286 · 24 |

OGN by type: Unit 166 · Spell 84 · Gear 30 · Legend 36 · Battlefield 24 · Rune 12

> This measurement caused the D-003 → D-013 reversal. **The entire pool caches
> trivially**, which also mitigates RiftScribe disappearing.

### Variant collapsing

`ogn-202-298` and `ogn-202a-298` are **both "Jinx, Rebel"**. Collection tracks
printings; legality collapses by **name**. See
[DATA-MODEL.md §2](../spec/DATA-MODEL.md#2-the-legality-unit-vs-the-ownership-unit).

### Alternatives — not chosen

- **Scrydex** — `scrydex.com/docs/riftbound/cards`
- **API TCG** — `apitcg.com`, open-source multi-TCG
- **RiftboundCardDatabase** — GitHub `vikkumar2021`, includes a Python fetcher

> Worth revisiting **if** RiftScribe lacks champion tags / Signature supertype.

---

## 2. Meta & tournament data — 🔴 BLOCKED, AND POSSIBLY IRRELEVANT

### The access problem

**RiftDecks** — `riftdecks.com` — **194,271 decks across 2,078 tournaments** (verified
live). No public API. Its `robots.txt` opens:

```
# WARNING: Scraping of this website is explity not allowed for:
# - riftbound.gg and its bots/crawlers
# - riftboundstats.com and its bots/crawlers
# - riftools.app and its bots/crawlers
# And any other similar sites building a competing service
```

**Riftools** — `riftools.app` — legend winrates, matchup matrices, card play-rate and
conversion stats. Unofficial, fan-made, data "may be incomplete, delayed, or corrected."

⚠️ **Unresolved volume discrepancy:** Riftools reported *5 tournaments, 209 decklists,
288 games* — orders of magnitude below RiftDecks. Different scopes, or one is stale.
**Confirm before treating either as a quality signal.**

**Piltover Archive** — `piltoverarchive.com` — Riot's official site. `robots.txt`
allows general crawling but **disallows `/api/`**.

### ⚠️ The relevance problem — raised by the [audit](../AUDIT.md), finding A8

Access is not the only obstacle. **Tournament decks are built from unlimited card
pools.** Their winrates describe what wins when you can play anything. Mapping that
onto a ~250-name personal collection may be close to meaningless — a top deck's
performance says nothing about the degraded version a constrained collection can
actually produce.

> **Q4 was framed as an access problem. It is also a relevance problem**, and the
> relevance question is answerable *without* obtaining any data.

### Position

[D-009](../DECISIONS.md#d-009) — pluggable adapter; the project is complete without it.
[D-010](../DECISIONS.md#d-010) — **no scraping**, non-negotiable.

**Cheap action available now:** ask Riftools and RiftDecks about API access for a
personal, non-published tool. They are fan projects and may simply agree.

---

## 3. Collection scanner apps — ❌ NOT USED

Investigated for D-003, abandoned in [D-013](../DECISIONS.md#d-013). Recorded so the
ground is not re-covered.

| App | Platform | Outcome |
|---|---|---|
| **Rift TCG Scanner** | iOS + Android | ❌ **Paid**, scan-limited. Trigger for the reversal |
| **RiftScan** | Android only | ❌ Not viable — user is on iPhone 13 |
| **TCG Stacked** | Web + mobile | Not pursued |
| **OpenRift** | Web | Not pursued for ingestion — but **open source, free, Piltover-compatible deck codes**. Worth revisiting for **interop/export** |

**Conclusion:** entry is built in-house, keyed on **collector number** — printed on
every card, faster and less ambiguous than OCR or name typing.

---

## 4. Sources

- [Riftbound official](https://riftbound.leagueoflegends.com/en-us/) · [Wikipedia](https://en.wikipedia.org/wiki/Riftbound)
- [Piltover Archive](https://piltoverarchive.com/) · [deck builder](https://piltoverarchive.com/deckbuilder)
- [RiftScribe API docs](https://riftscribe.gg/api-docs)
- [Rules Hub](https://playriftbound.com/en-us/rules-hub/)
- [Riftools](https://www.riftools.app/) · [RiftDecks](https://riftdecks.com/)
- [Fextralife wiki](https://riftbound.wiki.fextralife.com/) · [Mobalytics keywords](https://mobalytics.gg/riftbound/guides/keywords)
