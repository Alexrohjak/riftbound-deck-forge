#!/usr/bin/env python3
"""Fail when the docs contradict themselves.

Counts stated in prose have drifted from reality four times now — "Code: none yet"
survived in two files after the collection tool shipped, PLAN said D2 designs two things
where ROADMAP said three, and roadmap.html carried a stale status board for a day. Every
one was found by hand. This is the ten-line check PLAN.md §F1 asked for, built early
because the error kept recurring.

    python3 tools/check-docs.py

Exits non-zero with a list of contradictions. Checks only invariants that are cheap to
state and expensive to notice: milestone arithmetic, the two status boards agreeing,
declared decision counts, and relative links.
"""
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as fh:
        return fh.read()


def check(condition, message):
    if not condition:
        fails.append(message)


roadmap = read("docs", "ROADMAP.md")
html = read("docs", "roadmap.html")
plan = read("docs", "PLAN.md")
decisions = read("docs", "DECISIONS.md")
readme = read("README.md")


# ── milestones ────────────────────────────────────────────────────────────────
# A row in a track table starts with an ID, optionally struck through when retired.
rows = re.findall(r"^\| (~~)?`([A-Z]\d[ab]?)`(~~)?\s*\|", roadmap, re.M)
live = {m[1] for m in rows if not m[0]}
retired = {m[1] for m in rows if m[0]}

check(live & retired == set(),
      f"IDs both live and retired in ROADMAP.md: {sorted(live & retired)}")

board = re.search(r"\*\*(\d+) of (\d+)\*\* milestones", roadmap)
check(board is not None, "ROADMAP.md status board has no '**N of M** milestones' line")
if board:
    done, total = int(board.group(1)), int(board.group(2))
    check(total == len(live),
          f"status board says {total} milestones; the track tables list {len(live)} "
          f"live ones ({', '.join(sorted(live))})")
    # ✅ appears in the Status column of completed rows
    complete = len(re.findall(r"^\| `[A-Z]\d[ab]?`.*\| ✅ \|", roadmap, re.M))
    check(done == complete,
          f"status board says {done} complete; {complete} rows carry a ✅ status")

    # The ASCII ledger must add up to the same total.
    ledger = re.findall(r"^[A-Z] ─ \w+\s+[▓░]+\s+(\d+)/(\d+)", roadmap, re.M)
    check(len(ledger) == 5, f"expected 5 ledger rows in ROADMAP.md, found {len(ledger)}")
    if len(ledger) == 5:
        check(sum(int(a) for a, _ in ledger) == done,
              "ledger completed counts do not sum to the status board's completed count")
        check(sum(int(b) for _, b in ledger) == total,
              "ledger totals do not sum to the status board's milestone total")

# ── the two status boards must agree ──────────────────────────────────────────
# roadmap.html is a hand-maintained view of ROADMAP.md. Two files carrying the same
# status is how GAME-RULES.md drifted; the mitigation is that disagreement fails here.
if board:
    hb = re.search(r"(\d+) of (\d+)</strong> milestones", html)
    check(hb is not None, "roadmap.html has no 'N of M milestones' progress row")
    if hb:
        check((int(hb.group(1)), int(hb.group(2))) == (done, total),
              f"roadmap.html says {hb.group(1)} of {hb.group(2)}; "
              f"ROADMAP.md says {done} of {total}")
    hm = re.search(r"<span>(\d+) milestones</span>", html)
    check(hm is not None and int(hm.group(1)) == total,
          f"roadmap.html header milestone count disagrees with ROADMAP.md ({total})")
    for rid in sorted(retired):
        check(f'<span class="code">{rid}</span>' not in html,
              f"{rid} is retired in ROADMAP.md but still a live card in roadmap.html")

# ── the legality spec and the engine must agree on how many checks exist ──────
# The spec numbers its checks L1..L33; the engine hard-codes 33 as the denominator every
# verdict is reported against. If a rule is ever added to one and not the other, Forge
# starts quoting a coverage fraction that is quietly wrong — which is exactly the
# silent-wrongness W1 exists to prevent, so it is worth a machine check rather than care.
legality = read("docs", "spec", "LEGALITY.md")
engine = read("packages", "engine", "src", "legality", "index.ts")

spec_ids = {int(n) for n in re.findall(r"^\| \*{0,2}L(\d+)\*{0,2} \|", legality, re.M)}
check(spec_ids == set(range(1, 34)),
      f"LEGALITY.md should define L1-L33; missing {sorted(set(range(1, 34)) - spec_ids)}, "
      f"unexpected {sorted(spec_ids - set(range(1, 34)))}")

declared = re.search(r"SPECIFIED_CHECK_COUNT = (\d+)", engine)
check(declared is not None, "packages/engine has no SPECIFIED_CHECK_COUNT")
if declared and spec_ids:
    check(int(declared.group(1)) == len(spec_ids),
          f"engine reports {declared.group(1)} specified checks; LEGALITY.md defines "
          f"{len(spec_ids)}")

# Every rulebook example the spec lists must exist as a test.
rulebook = read("packages", "engine", "test", "rulebook.test.ts")
for t_id in re.findall(r"^\| \*{0,2}(T\d+)\*{0,2} \|", legality, re.M):
    check(re.search(rf'it\("{t_id} ', rulebook) is not None,
          f"LEGALITY.md lists {t_id} but no test in rulebook.test.ts starts with it")


# ── decision count ────────────────────────────────────────────────────────────
anchors = re.findall(r'<a id="(d-\d+)">', decisions)
check(len(anchors) == len(set(anchors)), "duplicate decision anchors in DECISIONS.md")
index = re.findall(r"^\| \[D-(\d+)\]\(#d-\d+\)", decisions, re.M)
check(len(index) == len(anchors),
      f"DECISIONS.md index lists {len(index)} rows but has {len(anchors)} anchors")

for label, text in (("ROADMAP.md", roadmap), ("README.md", readme)):
    for claimed in re.findall(r"(\d+) decisions(?:,| with)", text):
        check(int(claimed) == len(anchors),
              f"{label} claims {claimed} decisions; DECISIONS.md has {len(anchors)}")

# ── every referenced milestone exists ─────────────────────────────────────────
known = live | retired
for label, text in (("ROADMAP.md", roadmap), ("PLAN.md", plan), ("README.md", readme)):
    for mid in set(re.findall(r"`([A-Z]\d[ab]?)`", text)):
        if mid[0] in "DFWSL" and mid not in known:
            fails.append(f"{label} references milestone {mid}, which no track table defines")

# ── relative links resolve ────────────────────────────────────────────────────
for base, _, files in os.walk(ROOT):
    if ".git" in base or "node_modules" in base:
        continue
    for name in files:
        if not name.endswith(".md"):
            continue
        path = os.path.join(base, name)
        for lineno, line in enumerate(open(path, encoding="utf-8"), 1):
            for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", line):
                if target.startswith(("http", "mailto:", "#")):
                    continue
                rel = urllib.parse.unquote(target.split("#")[0])
                if rel and not os.path.exists(os.path.normpath(os.path.join(base, rel))):
                    fails.append(f"{os.path.relpath(path, ROOT)}:{lineno} → {target}")

# ── report ────────────────────────────────────────────────────────────────────
if fails:
    print(f"✗ {len(fails)} contradiction(s):\n")
    for f in fails:
        print(f"  {f}")
    sys.exit(1)

print(f"✓ docs consistent — {len(live)} live milestones ({len(retired)} retired), "
      f"{len(anchors)} decisions, both status boards agree")
