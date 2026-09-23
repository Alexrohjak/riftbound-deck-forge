# Data

Cached game data. **Everything here except `field.json` is derived from official Riot sources** and is
regenerable — nothing is hand-authored except `banlist.json` and (later) errata.

| File | Contents | Source |
|---|---|---|
| `cards.json` | **All 1,180 printings / 935 distinct names**, full rules text and effect text | Riot's official card gallery |
| `classification.json` | Per-card derived tags — role, timing, produces, consumes, curve position | Computed from `cards.json` |
| `banlist.json` | Banned cards, battlefields and legends, with the name-alias map | [Rules Hub](https://playriftbound.com/en-us/rules-hub/), hand-maintained |
| `field.json` | **What the tournament field plays** — Legend matchup matrix and tiers, for one dated window | BoundRift + Hextech, captured into `field/*.txt` and built by `scripts/build-field.mjs` ([D-068](../docs/DECISIONS.md#d-068)). **Not Riot data** — attributed, and only from sources the register allows |

## Why this is cached in the repo

1. **The upstream `buildId` changes on every site deploy**, so the gallery URL is not stable.
   Caching the full payload is the mitigation already required by
   [D-034](../docs/DECISIONS.md#d-034).
2. **The data layer is meant to be complete.** [D-039](../docs/DECISIONS.md#d-039)
   (*synthesise, never enumerate*) governs **what EE says to a human** — not what Forge
   stores. Completeness here is what makes a good answer possible.

## Refreshing after a set release or errata

```bash
BUILD=$(curl -s https://playriftbound.com/en-us/card-gallery/ \
        | grep -o '"buildId":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -s -o gallery.json \
     "https://playriftbound.com/_next/data/$BUILD/en-us/card-gallery.json"
```

Then re-derive `cards.json` (strip the image dimension/colour/icon noise — it is ~3× the
size and carries nothing) and regenerate `classification.json`.

⚠️ **`robots.txt` is `Allow: /` with no exclusions**, so this is a permitted fetch. It is one
request of ~3.2 MB. Contrast the meta sites, which explicitly opt out — see
[DATA-SOURCES.md](../docs/reference/DATA-SOURCES.md).

## Field notes

- `text` is plain; `textRaw` keeps the HTML and `:rb_*:` symbol tokens for rendering
- `effectText` is the **Equipment-attached** ability (32 cards) — it is *appended to the
  equipped unit's rules text*, so any parser that reads only `text` will miss it
- `might`/`power`/`energy` are `null` where the card has no such stat
- Collector numbers exceeding the set size are **legal reprints** — legality resolves by
  **name**, not printing (TR 601.2.a)
