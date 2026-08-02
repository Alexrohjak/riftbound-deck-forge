#!/usr/bin/env python3
"""Regenerate cards-index.json from the cached Riot gallery.

The collection tool needs a small, fast index — not the full 1.08 MB gallery dump.
This strips it to the fields the tool actually uses and normalises the symbol
markup into something renderable as plain text.

    python3 tools/collection/build-index.py

Reads  data/cards.json          (committed, see data/README.md)
Writes tools/collection/cards-index.json

Also supports a self-contained build for offline phone use, which inlines the
index into the HTML so it works from file:// with no server:

    python3 tools/collection/build-index.py --standalone
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "data", "cards.json")
HERE = os.path.join(ROOT, "tools", "collection")
OUT = os.path.join(HERE, "cards-index.json")


def clean(text):
    """Turn Riot's :rb_*: symbol markup into plain readable text."""
    if not text:
        return ""
    t = re.sub(r":rb_energy_(\d+):", r"{\1}", text)
    t = t.replace(":rb_exhaust:", "↻").replace(":rb_ready:", "↺")
    t = t.replace(":rb_rune_rainbow:", "◈")
    t = re.sub(r":rb_rune_(\w+):", lambda m: "◈" + m.group(1)[0].upper(), t)
    t = re.sub(r":rb_power_?\w*:", "⚡", t)
    t = re.sub(r":rb_(\w+):", lambda m: "[" + m.group(1) + "]", t)
    t = re.sub(r"<[^>]+>", "", t)
    return t.replace("&quot;", '"').replace("&#39;", "'").replace("&amp;", "&").strip()


# Every gallery image lives under this prefix; storing only the filename and
# rebuilding the URL in the browser keeps ~75 KB out of the index.
IMG_PREFIX = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/"


def image_id(url):
    """Filename part of a gallery image URL, or "" if it isn't the expected host."""
    if not url or not url.startswith(IMG_PREFIX):
        return ""
    return url[len(IMG_PREFIX):].split("?")[0]


def build():
    with open(SRC, encoding="utf-8") as fh:
        src = json.load(fh)

    out = [
        {
            "c": c["publicCode"],
            "n": c["name"],
            "s": c["set"],
            "cn": c["collectorNumber"],
            "e": c["energy"],
            "p": c["power"],
            "m": c["might"],
            "d": c["domains"],
            "t": c["types"],
            "st": c["superTypes"],
            "r": c["rarity"],
            "x": clean(c["text"]),
            "i": image_id(c.get("imageUrl")),
        }
        for c in src
    ]
    out.sort(key=lambda k: (k["s"], k["cn"], k["c"]))

    noimg = [c["c"] for c in out if not c["i"]]
    if noimg:
        print(f"  note: {len(noimg)} printings have no usable image ({noimg[:3]})")

    # The entry flow types a bare collector number and expects one hit.
    # Verify that assumption still holds rather than trusting it.
    bare = {}
    for c in out:
        m = re.match(r"^[A-Z]+-(\d+)([A-Za-z*]*)/", c["c"])
        if m and m.group(2) == "":
            bare.setdefault((c["s"], c["cn"]), []).append(c)
    clashes = {k: v for k, v in bare.items() if len(v) > 1}
    if clashes:
        sys.exit(f"FATAL: {len(clashes)} set+number pairs have >1 base printing: "
                 f"{list(clashes)[:3]} — bare-number entry would be ambiguous.")

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"), ensure_ascii=False)

    names = len({c["n"] for c in out})
    print(f"wrote {OUT}")
    print(f"  {len(out)} printings · {names} distinct names · {os.path.getsize(OUT)/1024:.0f} KB")
    print(f"  bare-number entry unambiguous for all {len(bare)} set+number pairs")
    return out


def standalone(index):
    """Emit a single self-contained HTML file — no server, works offline."""
    with open(os.path.join(HERE, "index.html"), encoding="utf-8") as fh:
        html = fh.read()
    blob = json.dumps(index, separators=(",", ":"), ensure_ascii=False)
    marker = "<script id=\"cards\" type=\"application/json\"></script>"
    if marker not in html:
        sys.exit("FATAL: index.html is missing the inline-data marker.")
    html = html.replace(marker, f'<script id="cards" type="application/json">{blob}</script>')
    dest = os.path.join(HERE, "collection-standalone.html")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(html)
    print(f"wrote {dest} ({os.path.getsize(dest)/1024:.0f} KB) — open directly, no server needed")


if __name__ == "__main__":
    idx = build()
    if "--standalone" in sys.argv:
        standalone(idx)
