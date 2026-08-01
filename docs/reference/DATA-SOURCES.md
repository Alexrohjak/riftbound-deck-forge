# Data Sources

> What external data exists, what is usable, and what is off-limits.
> **Compiled:** 2026-08-02

---

## 1. Card data — ✅ SOLVED (official source)

### 🏆 Riot official card gallery — **primary source** ([D-034](../DECISIONS.md#d-034))

```
1. GET https://playriftbound.com/en-us/card-gallery/     → read "buildId" from page source
2. GET https://playriftbound.com/_next/data/{buildId}/en-us/card-gallery.json
```

**~3.2 MB, one request, every card.** `robots.txt` is `Allow: /` with **no exclusions**.

**Verified 2026-08-02 — 1,180 cards:**

| Set | Cards |
|---|---|
| OGN Origins | 352 |
| SFD Spiritforged | 288 |
| UNL Unleashed | 288 |
| VEN Vendetta | 228 |
| OGS Origins supplemental | 24 |

**Fields that make it authoritative for legality:**

| Field | Shape | Enables |
|---|---|---|
| `domain.values[]` | **Array.** 169 cards carry 2 domains; **all 118 Legends carry exactly 2** | L8 · L10 |
| `tags.tags[]` | Champion tags — **826 / 1,180** cards tagged | L18 · L21 |
| `cardType.superType[]` | `{"id":"signature","label":"Signature"}` — **51 cards** | L19 · L20 · L21 |
| `cardType.type[]` | Unit · Spell · Gear · Legend · Rune · Battlefield | L17 |
| `collectorNumber` · `publicCode` | e.g. `150`, `"VEN-150/166"` | Collection entry (D-013) |
| `set.value` · `rarity.value` | — | Format legality, filters |
| `text.richText.body` | HTML with `:rb_might:`-style symbol tokens | Card display |
| `cardImage.url` | Sanity CDN, with dimensions and extracted colours | Gallery |
| `orientation` | `portrait` / `landscape` | Layout |

**Sample:**

```
Bashful Bloom     domains=['Calm','Mind']    tags=['Lillia']
Battle Mistress   domains=['Body','Chaos']   tags=['Sivir']
```

> ⚠️ **`buildId` changes on every site deploy.** Read it from the gallery page each
> time; never hard-code it. Mitigated by caching the full payload locally.

---

### RiftScribe — **secondary / convenience only**

`https://riftscribe.gg` · JSON · no auth · free. An independent fan project.

**Demoted from primary ([D-034](../DECISIONS.md#d-034)).** Three disqualifying gaps,
measured across all 950 cards it serves:

| Gap | Evidence | Would break |
|---|---|---|
| **Missing an entire set** | 950 cards; **Vendetta absent** | Format legality |
| **No champion tags** | `tags` empty on **0 / 950** | L17–L21 |
| **Domains single-valued** | `faction` has 7 values, none compound — **cannot express a two-domain Legend**, and every Legend has two | L8 · L10 |
| **No Signature supertype** | no such field | L19–L21 |

**The decisive example:** CR 103.2.a.2 illustrates champion tags using **Loose Cannon**,
a Legend tagged `Jinx`. RiftScribe returns it with `tags: []`.

**Still genuinely useful for:** pre-parsed `keywords` arrays, convenient
`stats {energy, might, power}`, an `is_banned` flag, multiple thumbnail sizes, and
`GET /api/cards/search?q=` fuzzy typeahead.

| Endpoint | Purpose |
|---|---|
| `GET /api/cards` | List |
| `GET /api/cards/search?q=` | Fuzzy typeahead — min 2 chars, max 20 results |
| `GET /api/cards/filters` | Distinct filter values |
| `GET /api/cards/{card_id}` | Full card detail |

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
