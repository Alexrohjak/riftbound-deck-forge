# Decision Log — Riftbound Deck Forge

Every significant decision, the alternatives considered, and why. Append-only:
if a decision is reversed, add a new entry rather than editing the old one.

---

## D-001 — Success criteria: "legal + coherent" → "competitively tuned" ⚠️ REVERSED

**Date:** 2026-08-02
**Status:** Superseded by D-008

**Originally decided:** A good generated deck is one that is rule-legal with a sane
curve and rune split. The user judges strategy; the tool does the tedious legality
and consistency maths.

**Alternatives considered:** competitively tuned (synergy scoring, meta-informed);
pure idea generation / exploration; gap analysis ("you're 3 cards short").

**Why originally chosen:** It shrinks the build dramatically — no synergy engine,
no meta scraping, no ML — and keeps the user as the strategist.

**Why reversed:** See D-008. On seeing Piltover Archive, the user substantially
raised the ambition. Recorded as a reversal rather than silently absorbed, because
it changes the project's size and risk profile.

---

## D-002 — Card data comes from the RiftScribe public API

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** Consume [RiftScribe](https://riftscribe.gg/api-docs) as the card data
source. We never build or maintain card data ourselves.

**Alternatives considered:** Scrydex API; API TCG; the `RiftboundCardDatabase`
GitHub project; maintaining our own dataset.

**Why:** Verified live during discovery — free, public, no authentication, JSON.
Card objects carry everything a constraint solver needs: `faction`, `type`,
`rarity`, `stats {energy, might, power}`, **parsed `keywords` arrays**, collector
number, variant, and image URLs. Fuzzy typeahead search is available. All five sets
(OGN, OGS, SFD, UNL, VEN) are present.

**Risk:** It is an independent fan project and could disappear. Mitigation: cache
the full card set locally so the tool keeps working if the API goes away.

---

## D-003 — Collection ingestion: rent the scanner, build the importer

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** Seed the collection using an existing free OCR scanner app
(RiftScan / Rift TCG Scanner / TCG Stacked / OpenRift) → export CSV → import into
our system. Seed **box by box** in labelled batches. Preconstructed products are
added as **known bundles**, not scanned.

**Alternatives considered:**
- *Manual typeahead entry* — rejected: ~1,000 physical cards is hours of tedium
  with a real error rate; the user would resent the tool before it helped.
- *Building our own OCR/scanner* — rejected: the single largest engineering lift in
  the project. It would consume the entire effort and the generator would never ship.
- *Pack-opening entry mode* — deferred: genuinely good for **incremental** additions
  after the initial seed, and cheap to build on RiftScribe's typeahead. Phase A/B.

**Why:** Camera scanning is the only method that survives a collection this size,
but someone has already built and given away that capability. Box-by-box batching
makes verification tractable — per-set counts can be sanity-checked, and a bad batch
means rescanning one box rather than starting over.

**Unverified:** The CSV-export capability comes from app-store listings, not
first-hand testing. **Verify on one trial box before committing.**

---

## D-004 — Collection size established

**Date:** 2026-08-02
**Status:** Accepted

~64 packs × 14 cards ≈ 900, plus several preconstructed decks (~50+ cards each)
≈ **1,000+ physical cards**. Crucially, **unique** cards are far fewer —
roughly 250–400 — because 64 packs produce heavy duplication.

**Implication:** The data model is `card_id → quantity`, not a thousand rows.
Quantity is what drives legality (3-copy limit) and consistency.

---

## D-005 — Local-first, desktop-primary, phone read-only

**Date:** 2026-08-02
**Status:** Accepted (architecture pending Q1)

Desktop is the workbench for long planning sessions; phone is a **read-only**
view of saved decks during play. The user never builds decks on a phone.

**Why it matters:** Read-only mobile is dramatically cheaper than full mobile
editing, and it removes any need for conflict resolution or sync-merge logic.

---

## D-006 — Confirmed rules constraints

**Date:** 2026-08-02
**Status:** Accepted, with one open conflict

- Deck = **1 Legend + 1 Chosen Champion + 40+ main + exactly 12 runes + 3 Battlefields**
- **Maximum 3 copies** of any unique card name; the Chosen Champion counts within this
- The 3-copy limit spans **main deck + sideboard combined**
- Domain identity: the Legend defines **two domains**; every card and rune must comply
- Six domains: Fury, Chaos, Mind, Body, Order, Calm (+ `colorless`)
- Win condition: **8 points**; the 8th must come from *holding* a Battlefield or
  conquering all Battlefields in one turn

⚠️ **Unresolved conflict — sideboard size.** Official Piltover Archive displays
`Sideboard 0/10 (opt)`. Community guides state *exactly 0 or 8*. These are
incompatible. **Resolve against the official rulebook before encoding.**

**Standing rule:** source legality rules from official documents, never from blogs.

---

## D-007 — Build order: workbench first, generator second

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** Phase A is the workbench. Phase B is the generator.

**Alternatives considered:** generator-first, even in rough form.

**Why:** The generator's output is only useful if there is somewhere good to
*receive* it — to inspect, edit, and push back on it. The interactive refinement
loop the user wants **is a workbench feature**. Building the generator first would
produce deck lists with nowhere to land.

---

## D-008 — Generator must be multi-factor and conversational

**Date:** 2026-08-02
**Status:** Accepted (supersedes D-001)

**Decided:** The generator scores candidate decks on multiple factors — real
tournament performance of similar decks, average card cost, flexibility, counterplay
against other decks and Legends, and early- vs late-game balance. It accepts both
positive intent (cards to use, playstyle) and **negative constraints**. When the
user rejects a recommendation, that rejection feeds the next iteration.

**Why:** Directly stated by the user, and it is what makes the tool worth hours of
use rather than minutes.

**Cost:** Substantially larger and riskier than D-001. Accepted knowingly, and
mitigated by D-007 (phasing) and D-009 (pluggable meta source).

---

## D-009 — Meta data is a pluggable adapter, not a hard dependency

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** The generator computes card-level reasoning itself (curve, rune maths,
keyword synergy, domain coverage, early/late balance). **Tournament-informed scoring
sits behind a clean adapter interface** and slots in only if a legitimate data source
is secured. In parallel, ask Riftools and RiftDecks about API access for a personal,
non-published tool.

**Alternatives considered:** scraping the meta sites — **rejected on ethical
grounds**, see D-010.

**Why:** The ambitious vision stays fully available without holding the entire
project hostage to data we do not control. If the answer is "no", the project is
unharmed because nothing was built on top of it.

---

## D-010 — We will not scrape sources that prohibit it

**Date:** 2026-08-02
**Status:** Accepted — non-negotiable

**Decided:** No scraping of RiftDecks, Riftools, or Piltover Archive.

**Evidence:** RiftDecks' `robots.txt` opens with an explicit warning that scraping
is **not allowed** for named competing sites "and any other similar sites building a
competing service." Piltover Archive's `robots.txt` disallows `/api/`.

**Why:** It is their data and the request is unambiguous. Legitimate routes exist —
ask for access — and D-009 ensures the project functions without it.

---

## D-012 — Phone access must work away from the home network ✅ Q1 RESOLVED

**Date:** 2026-08-02
**Status:** Accepted

**Confirmed by the user:** read-only deck access on a phone must work **away from
home** — at a shop or a friend's place — not merely on the home LAN.

**Consequence:** a purely local-only application is **ruled out** as a complete
solution. Deck data must reach the phone by some route that survives leaving the
house. Candidate approaches, to be evaluated in the design phase:

1. **Fully hosted web app** — simplest mental model, but drags in hosting, a real
   database, and some access control for every part of the system
2. **Local workbench + hosted read-only deck view** — the heavy workbench stays
   local; only saved decks are published to a small static/hosted surface. Keeps
   the collection local and the hosted surface tiny
3. **PWA with offline caching** — install once, decks cached on-device, works with
   no signal at all. Attractive because deck data is small and read-only
4. **Export to phone-native artefacts** — deck codes, images, or PDFs pushed to the
   phone. Cheapest, but the least like "open the app and look"

**Leaning:** (2) or (3). Both preserve the local-first workbench while satisfying
the mobile requirement, and both keep the collection off any server. Not yet decided.

**Note:** this does *not* reopen D-005 — phone remains strictly read-only, so no
sync-conflict or merge logic is required in any of these options.

---

## D-011 — Repository: private, `riftbound-deck-forge`

**Date:** 2026-08-02
**Status:** Accepted

Private GitHub repository under `Alexrohjak`. Nothing here needs to be public today,
and private → public is a trivial change later, whereas the reverse is not.
