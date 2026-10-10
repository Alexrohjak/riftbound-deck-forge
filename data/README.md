# Data

Cached game data. **Everything here except `field.json` is derived from official Riot sources** and is
regenerable — nothing is hand-authored except `banlist.json` and (later) errata.

| File | Contents | Source |
|---|---|---|
| `cards.json` | **All 1,380 printings / 1,080 distinct names** across six sets, full rules text and effect text | Riot's official card gallery, via `npm run cards` |
| `cards-repairs.json` | **Where `cards.json` departs from the gallery as published**, and on what evidence. Generated, and recomputed every run | `scripts/build-cards.mjs` |
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
npm run cards                              # fetch, map, repair, and print what changed
node scripts/build-card-index.mjs          # the app's index
python3 tools/collection/build-index.py    # the collection tool's index (+ --standalone)
```

`npm run cards` prints every printing added, removed and renamed, and refuses a payload that
would shrink the pool. A new set also needs its code in `SET_ORDER`
(`scripts/build-card-index.mjs`) and `SETS` (`tools/collection/index.html`), and its
main-deck cards and Legends classified in `classification.json`, which is authored by
reading the cards, not computed.

⚠️ **A new set arrives wrong.** Radiance went up on 2026-10-10 with 30 cards carrying the
wrong type or none, 25 the wrong domain or none, most plain cards untagged, and 25 of its 167
collector numbers absent. The first two are repaired from the same payload and listed in
`cards-repairs.json`; the script header says how. Re-run it after a week: the repair list
should shrink as Riot corrects the gallery, and the missing cards should appear.

⚠️ **`robots.txt` is `Allow: /` with no exclusions**, so this is a permitted fetch. It is one
request of ~3.8 MB. Contrast the meta sites, which explicitly opt out — see
[DATA-SOURCES.md](../docs/reference/DATA-SOURCES.md).

## Field notes

- `text` is plain; `textRaw` keeps the HTML and `:rb_*:` symbol tokens for rendering
- `effectText` is the **Equipment-attached** ability (32 cards) — it is *appended to the
  equipped unit's rules text*, so any parser that reads only `text` will miss it
- `might`/`power`/`energy` are `null` where the card has no such stat
- Collector numbers exceeding the set size are **legal reprints** — legality resolves by
  **name**, not printing (TR 601.2.a)
