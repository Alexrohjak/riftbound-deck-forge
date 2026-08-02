# Collection tool

Enter and browse the cards you actually own. **This is the first working piece of Forge.**

> **Deliberately disposable.** No framework, no build step, no dependencies — one HTML file and a
> JSON index. The durable thing here is `collection.json`, which you export; the interface around it
> is meant to be thrown away when [`D3`](../../docs/ROADMAP.md) picks a real stack.

---

## Run it

**On a computer** — the page reads `cards-index.json` from the same folder, which browsers block
over `file://`, so serve it:

```bash
cd tools/collection
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

**On your phone, offline** — `collection-standalone.html` has the card data inlined, so it opens
straight from the filesystem with no server. Download it from GitHub, open it, add it to your home
screen. Regenerate it after a card-data update with:

```bash
python3 tools/collection/build-index.py --standalone
```

---

## Entering cards

Pick a set, then type collector numbers. **The field keeps focus**, so it's number → Enter →
number → Enter without touching the mouse.

| Type | Does |
|---|---|
| `142` | Add one copy of #142 in the selected set |
| `142*3` or `142x3` | Add three |
| `142-` | Remove one |
| `142*2-` | Remove two |
| `142a` | The `a` variant (showcase / alt art) rather than the base printing |
| `ven 12` | Reach into another set without switching tabs |
| `hextech` | Search by name when the number is unreadable |

**A bare number is never ambiguous.** All 1,020 set+number pairs have exactly one base printing —
`build-index.py` fails loudly if a future set breaks that assumption, rather than silently guessing.

`Esc` clears the field. **Undo last** reverses the previous entry, and the session log shows
everything you've added so you can catch a mistyped number.

---

## Where your data lives

Counts are held in this browser's `localStorage`, on that device only. **Nothing is uploaded
anywhere.** That also means clearing site data erases it — so export.

**Export** produces the file that matters:

```json
{
  "schema": "forge.collection/1",
  "exported": "2026-08-02T…",
  "totals": { "names": 214, "copies": 487 },
  "counts": { "OGN-142/298": 3 },
  "byName": { "Hextech Ray": 3 }
}
```

`counts` is keyed by printing and is what re-imports. `byName` is derived and included because
**deck legality works by name, not by printing** — so that's the shape the rest of Forge will
consume. Import skips codes it doesn't recognise and tells you how many, rather than failing.

---

## Card data

`cards-index.json` is generated from [`data/cards.json`](../../data/README.md) — the cached Riot
gallery, 1,180 printings across OGN, OGS, SFD, UNL and VEN. Regenerate after a data refresh:

```bash
python3 tools/collection/build-index.py
```

It strips the gallery to the fields the tool uses and turns Riot's `:rb_*:` symbol markup into
readable text. `collection-standalone.html` is generated and committed for convenience; treat
`index.html` as the source.

---

## What this deliberately doesn't do

No decks, no legality checking, no evaluation. Those need
[`W1`](../../docs/ROADMAP.md) and the rules engine, and neither is designed yet.

This tool exists to capture the collection — the one asset every later milestone depends on, and the
[biggest practical risk in the project](../../docs/ROADMAP.md).
