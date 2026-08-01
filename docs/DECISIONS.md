# Decision Log — Forge

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

## D-003 — Collection ingestion: rent the scanner, build the importer ⚠️ REVERSED

**Date:** 2026-08-02
**Status:** Superseded by D-013 — *the reasoning below contained an arithmetic error*

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

> ❌ **Reversed.** Rift TCG Scanner turned out to be **paid, with scan limits**. More
> importantly, the rejection of manual entry rested on a miscalculation — entry
> effort scales with **unique card names**, not physical card count. See D-013.

---

## D-013 — Collection ingestion: purpose-built fast entry, no scanner ✅

**Date:** 2026-08-02
**Status:** Accepted — supersedes D-003

**Decided:** Build a **keyboard-driven collection entry mode** into the tool.
No third-party scanner app, no CSV import dependency.

**Primary input is the collector number, not the card name.** Every Riftbound card
has its collector number printed on it, so entry is 2–3 keystrokes with zero
ambiguity about which printing was entered:

```
[30] → Jinx, Demolitionist  ⚡3 💪4 🔥1   →  [1][2][3] quantity
```

Name typeahead (RiftScribe `/api/cards/search`) remains as a fallback.
Preconstructed products are added as **known bundles** — zero entry effort.

**Why D-003 was wrong.** It costed manual entry against ~1,000 *physical* cards.
But entry is per **unique name + quantity**, and the card universe is small:

| Measure | Count |
|---|---|
| Total printings, all sets | 950 |
| **Distinct card names** (what the 3-copy rule counts) | **767** |
| Origins (OGN) printings → distinct names | 352 → **298** |

From ~64 packs the realistic holding is **200–300 unique names**, not 1,000 rows.
At 3–4 seconds each that is **15–20 minutes, once** — a paid third-party dependency
was being adopted to avoid twenty minutes of typing.

**Trigger for reversal:** the user reported the scanner app is paid and likely
scan-limited.

**Why this is strictly better:**

1. No cost, no scan limits, no paywall
2. No dependency on another company's app, pricing, or export format remaining stable
3. **Needed regardless** — every future pack requires an entry path forever; a
   scanner only ever solved day one
4. Eliminates the entire OCR error class: no misreads, no variant confusion, no
   silent drops
5. Under our control, so it can do Riftbound-specific things a generic scanner
   cannot — warn at the 3-copy ceiling, show what a card unlocks, suggest the next
   collector number in sequence

**Cost accepted:** ~20 minutes of one-time typing.

**Consequences:** removes the CSV-importer work item; removes the unverified
export-format risk; makes entry UX a **first-class Phase A feature** rather than a
one-off migration step.

---

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

---

## D-014 — Piltover Archive is inspiration, not a template

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"The workbench of Piltover Archive is beautiful, clean and interactive and
pleasant to look at. However, we can't just copy that but can for sure take
inspiration from it."*

**Decided:** Adopt the *qualities* — clean, interactive, pleasant, information-dense
without clutter — and the *concepts* that earn their place (notably The Bench).
Do **not** clone its layout. The interface is designed for our purpose, whose centre
of gravity is ownership, and Piltover Archive has no ownership concept at all.

---

## D-015 — Gallery shows owned cards by default ✅

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** The main gallery displays **only cards the user owns** by default.
Ownership is a **filter dimension**, so unowned cards remain reachable deliberately
rather than being hidden permanently.

Filter set (initial): set · collector number · domain · type · rarity · variant ·
energy · power · might · **owned / unowned** · and further dimensions as they prove
useful.

**Why:** it is the premise of the entire tool. Every other Riftbound tool shows the
whole card pool; this one starts from reality and treats the full pool as the
exception view.

---

## D-016 — No single effectiveness grade — show a panel of stats ✅

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"Effectiveness of a deck will be decided through so many factors. It will
also be an estimate, it can't be a for-sure grade given to a deck. Maybe we don't
have an effectiveness grade but just a bunch of different stats."*

**Decided:** The generator and workbench present **multiple independent statistics**.
There is **no composite score, grade, letter, or percentage.**

**Alternatives considered:** a single 0–100 effectiveness rating; a letter grade;
a star rating.

**Why:** a composite number implies a precision that does not exist. Deck strength
depends on meta, matchup, piloting and draw — none of which a static score can
capture. A single number invites trust in place of thought; a panel of honest stats
preserves the user as the strategist, consistent with the whole project's framing.

**Consequence:** the hard problem shifts from "compute a score" to "choose which
statistics genuinely inform a decision, and present them legibly." Better problem.

---

## D-017 — Cards in decks are committed and leave the available pool ✅ Q3 RESOLVED

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"Cards that are in decks shouldn't 'exist' anymore as they are technically
taken. We can have an indicator for this so we know where to find them if I want to
use them in another deck."*

**Decided:** Building a deck **commits** its cards. Committed copies are removed from
the pool available to other decks, modelling physical reality: a sleeved card is in
exactly one deck.

**Data model consequence** — supersedes the simple `card_id → quantity` of D-004:

```
card_id → { owned: n, committed: [{deck_id, qty}, ...], free: n - Σcommitted }
```

**Required UX:** when a card is unavailable, show **where it is** — which deck holds
it — so the user can decide whether to dismantle. Unavailability must never be a
dead end; it is always "this is in *Jinx Aggro v2*."

**Why this matters:** without it the tool would generate decks the user cannot
physically build, which would break trust immediately.

---

## D-018 — Phone gets FULL parity with desktop, including editing ⚠️ REVERSES D-005

**Date:** 2026-08-02
**Status:** Accepted — supersedes D-005 and reshapes D-012

**User:** *"I want the phone app or system to be the same as the desktop, should be
able to edit decks on there as well to be fair as I learn new things while playing."*

**Decided:** The phone is **not** a read-only viewer. It is the same application,
with full editing. Insight gained mid-game is captured immediately, at the table.

**What this invalidates:**

- ❌ D-005's read-only phone premise
- ❌ D-012 option 4 (export to static artefacts) — cannot be edited
- ❌ D-012 option 3 as originally framed (offline read-only cache)
- ❌ Any "local workbench, published deck view" split — two surfaces would diverge

**What it forces:**

1. **A single source of truth** reachable from anywhere — which points strongly at a
   **hosted web application** rather than a local-only one
2. **Responsive design as a hard requirement** across the *entire* workbench, not
   just a deck list
3. The collection itself must live server-side, not solely on the desktop machine

**Ironically simplifying:** it collapses D-012's four options to roughly one, and
because there is one app rather than two synchronised surfaces, **no sync-conflict
or merge logic is needed** — the reason read-only was attractive in the first place.

**Open:** touch-first interaction for deck editing is a genuine design problem.
Collection *entry* remains desktop-oriented (keyboard, collector numbers, cards in
hand); deck *editing* must work well on a phone.

---

## D-019 — Architecture is deliberately deferred

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"Architecture can come later once the full idea is planned and designed
properly."*

**Decided:** Complete the product design first. No stack, framework, hosting or
storage decisions until the design is settled.

**Why:** premature stack choices constrain the design to fit the tool. The design
should constrain the stack. Note that D-018 has already narrowed the space
considerably without a single technology being named.

---

## D-020 — Official rulebook is the sole legality authority ✅ Q2 RESOLVED

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** Legality rules are sourced **exclusively** from Riot's official
documents — Core Rules and Tournament Rules, both dated **16 July 2026** — obtained
from the [official Rules Hub](https://playriftbound.com/en-us/rules-hub/). Community
guides are not a source of truth.

**Q2 resolved — sideboard is 0–10, not 0-or-8.**

> **TR 601.1.c.1** — *"A player's sideboard can include 10 or fewer cards."*

Piltover Archive's `Sideboard 0/10` was correct; the community guides were **stale**,
describing rules superseded by the July 2026 update. This vindicates the standing
rule and demonstrates why it exists.

**Also corrected — main deck size is mode-dependent:**

> **CR 103.2** — *"A Main Deck of **at least 40** cards"*
> **TR 601.1.b** — *"In competitions, a player's Main Deck must be **exactly 40** cards"*

Both are true in their own context. **The legality engine therefore needs a
casual/competition mode switch**, which neither the community guides nor my earlier
notes had surfaced.

**New constraint discovered — Signature cards.** A rule we had no knowledge of:

> **CR 103.2.d.1** — *"Regardless of name, a deck may only contain a sum total of 3
> Signature cards."*
> **CR 103.2.d.2** — Signature cards must carry the Champion tag matching the deck's
> Champion Legend.
> **CR 103.2.d.3** — Signature cards are **not** Champion units and cannot occupy the
> Champion Zone.

See [reference/GAME-RULES.md](reference/GAME-RULES.md) for the full authoritative rule set.

---

## D-021 — Physical card-location system deferred until re-organisation

**Date:** 2026-08-02
**Status:** Deferred — Q6

**User:** *"We can put the system for finding the cards to the side. Once I have my new
organising box we can implement this system as it'll be better organised."*

Physical location tracking is postponed until the collection is re-housed. Designing
a location model against a storage scheme that is about to change would be wasted
work. Revisit once the new box exists.

Note this is **distinct** from D-017's "where is this card" indicator, which points
at a *deck*, not a physical location, and is in scope now.

---

## D-022 — Deck statistics use a three-tier confidence framework ✅ Q9 RESOLVED

**Date:** 2026-08-02
**Status:** Accepted — full specification in [spec/DECK-STATS.md](spec/DECK-STATS.md)

**Decided:** Statistics are organised by **epistemic confidence**, and the tier is
encoded in the visual language rather than footnoted.

| Tier | Nature | Guarantee |
|---|---|---|
| 🟢 1 — Facts | Deterministic, from the decklist | Exactly correct |
| 🟡 2 — Probabilities | Computed or simulated | Correct given stated assumptions |
| 🔴 3 — Estimates | Requires external data | Uncertain; **omitted rather than faked** |

**Why:** D-016 removed the composite grade but relocated the problem — three
misleading statistics are worse than one misleading grade, because they take longer
to discredit themselves. Tiering makes the tool's own uncertainty legible.

**Non-negotiable:** a Tier 3 estimate must never be able to pass for a Tier 1 fact.

---

## D-023 — Rune feasibility is the flagship statistic

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** The headline statistic is **P(can pay a given cost, by turn, by domain)** —
not the energy curve.

**Rationale, from the Core Rules:** the Rune Deck is exactly 12 (CR 161.2.a) and
channels 2 per turn (CR 315.3.b.1). Paying a domain Power cost requires **recycling a
rune of that domain currently on the board** (CR 164.2.b), which simultaneously
removes it from the board and returns it to the Rune Deck (CR 161.2.b). Whether such
a rune is available on turn *N* is a hypergeometric problem over 12 cards,
complicated by recycling.

**Why it is the flagship:** it is genuinely impossible to compute by hand at the
table, and **no other Riftbound tool can produce it**, because none holds the rune
split and the deck's Power demands together. It is the strongest single argument for
this project existing.

**Method:** closed-form hypergeometric for the pre-recycling case; Monte Carlo for
the general case.

---

## D-024 — Two departures from the originally requested statistics

**Date:** 2026-08-02
**Status:** Accepted

**❌ "Average card cost" — dropped.** A mean is actively misleading: an all-3-drops
deck and a 1-drop/6-drop split deck share a mean of 3 and play nothing alike. The
histogram conveys everything the mean does, honestly.

**✅ "Flexibility" — defined as *playable options per turn*.** Given expected
resources on turn *N*, how many **distinct** cards could actually be cast. Left
undefined it would have become decoration; this version is computable from data
already held.

Both were proposed as pushback and explicitly accepted by the user.

---

## D-025 — The project is called **Forge**; documentation restructured

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** "Forge" is the project name in all documentation. The repository keeps
its existing slug (`riftbound-deck-forge`) — renaming it would break the remote for
no benefit.

Documentation is reorganised by **purpose**, because a flat `docs/` folder had begun
mixing process, specification and external reference:

```
docs/
  PLAN.md         delivery plan — the entry point
  DISCOVERY.md    problem, scope, non-goals, open questions
  DECISIONS.md    this log
  AUDIT.md        assumption audit
  spec/           what we are building
    DATA-MODEL.md · LEGALITY.md · DECK-STATS.md · GENERATOR.md
  reference/      external facts we do not control
    GAME-RULES.md · DATA-SOURCES.md
```

`RESEARCH.md` is retired, split into `reference/GAME-RULES.md` (how the game works)
and `reference/DATA-SOURCES.md` (what data exists and what is off-limits). The split
matters because the two change for entirely different reasons and at different rates.

---

## D-026 — Only `BUILT` decks commit cards — refines D-017

**Date:** 2026-08-02
**Status:** Accepted — refines, does not reverse, D-017

**Decided:** Decks have a state. **`DRAFT` commits nothing; `BUILT` commits its cards.**

**Why the refinement was needed:** D-017 established that cards in decks are taken,
but did not distinguish planning from physical reality. Without the distinction, every
speculative deck would lock cards, the collection would appear exhausted after three
ideas, and the tool would become unusable for exactly the exploratory tinkering it
exists to support.

**Only sleeved cardboard is genuinely unavailable.** Full model in
[spec/DATA-MODEL.md §3](spec/DATA-MODEL.md#3-commitment).

Corollary: a DRAFT deck **may** exceed availability, producing a *conflict* — surfaced
as information showing which deck holds the cards, never as a wall. Promotion to BUILT
requires zero conflicts, or an explicit choice to dismantle the holder.

---

## D-027 — A walking skeleton precedes layered construction

**Date:** 2026-08-02
**Status:** Accepted — from [AUDIT.md](AUDIT.md) finding A12 (risk 20)

**Decided:** Insert **Stage 3.5** — an end-to-end, deliberately crude vertical slice —
before the layered stages.

**Problem it solves:** the original plan built horizontally (card data → legality →
collection → workbench → statistics), meaning **nothing worked end-to-end until Stage
7**. For a project whose entire purpose is enjoyment, and whose dominant risk is
enthusiasm decaying before value arrives, that sequencing was backwards.

**Alternatives considered:** keeping the layered build and relying on the "Phase A
stands alone" hedge — rejected, because Phase A *is* the large part.

**Consequence:** every later stage becomes *"replace the crude part with the real
one"* rather than *"build a layer and hope it fits."* Design mistakes surface in week
three rather than month four.

---

## D-028 — Premise verification precedes all construction

**Date:** 2026-08-02
**Status:** Accepted — from [AUDIT.md](AUDIT.md) finding A13 (risk 20)

**Decided:** Add **Stage 0.5** — a manual, no-code check of whether the collection can
actually produce complete legal decks for two different Legends.

**Why:** the project rests on the assumption that the bottleneck is *information*, not
*cards*. But the collection holds ~250–300 of 767 names, and Domain Identity restricts
any deck to 2 of 6 domains — so the usable pool per Legend may be only 80–100 names.
**If a legal deck cannot be assembled, Forge is a tool that mostly says "no."**

**Cost:** about two hours of counting. **Value:** either de-risks or redirects the
entire project before a line of code exists.

---

## D-029 — The generator is downgraded to a research spike

**Date:** 2026-08-02
**Status:** Accepted — from [AUDIT.md](AUDIT.md) finding A9 (risk 16)

**Decided:** The generator ceases to be a planned stage. It becomes a **hypothesis
with explicit kill conditions** — [spec/GENERATOR.md](spec/GENERATOR.md).

**Why:** the audit surfaced a direct contradiction between the stated goal and the
feature. The goal is *"to enjoy sitting for hours creating, putting together, sleeving
and testing decks."* A generator produces a finished deck, removing the activity the
user says they want to spend hours doing. It was reached for because *"the computer
figures it out"* is the obvious shape for software — a **convention**, not an
established requirement.

**Second, independent reason:** it carries an unresolved design contradiction. **A
generator requires an objective function; [D-016](#d-016) forbids a composite score.**
Leading resolution is multi-objective Pareto selection — return only candidates not
strictly worse on every axis, so the tool never says which is *best*. Unvalidated.

**Nothing in Phase A depends on this.** Cancellation costs nothing already built.

**Note:** this does **not** reverse D-008. The requirements captured there remain
accurate descriptions of what the generator would do *if built*.

---

## D-030 — "Playstyle" is defined mechanically, not by archetype name ✅ Q5

**Date:** 2026-08-02
**Status:** Accepted

**Decided:** Express generator intent as **mechanical axes computable from data we
already hold**, rather than as named archetypes:

| Intent | Mechanical expression |
|---|---|
| Aggressive | High share of ≤2-energy Units; Assault; high early Might |
| Defensive | Tank; high Might-per-energy at 3+; late Might curve |
| Board-wide | Unit count and token generation |
| Reactive | Spell share; Deflect; Hidden |
| Resource-hungry | High Power demand relative to rune split |

**Problem solved:** archetype→card mapping exists in **no API**. The previous answer —
"must be sourced or derived" — restated the problem rather than solving it.

**Why this is better:** requires no external data; is honest about being a mechanical
proxy rather than a claim about strategy; and composes with the existing statistics
framework instead of inventing a parallel vocabulary.

---

## D-031 — RiftScribe is insufficient for legality ⚠️ PARTIALLY INVALIDATES D-002

**Date:** 2026-08-02
**Status:** Accepted — verified, not speculative

**Finding.** Full enumeration of all 950 cards plus detail-endpoint inspection
confirms RiftScribe **cannot support the legality engine**:

| Gap | Evidence | Breaks |
|---|---|---|
| No champion tags | `tags` empty on **0 / 950** cards | L17 · L18 · L19 · L20 · L21 |
| Domains single-valued | `faction` has 7 values, **none compound** — multi-domain cards, which CR 103.1.b.4 explicitly anticipates, cannot be represented | L8 · L10 |
| No Signature supertype | No field distinguishes Signature cards | L19 · L20 · L21 |

**The decisive example:** CR 103.2.a.2 uses **Loose Cannon** to illustrate a Legend
carrying the tag `Jinx`. RiftScribe returns Loose Cannon with `tags: []`.

**Workaround investigated and rejected:** domains are not recoverable from
`description` text. Of six Legends sampled, one contained a rune symbol, and it was
`:rb_rune_rainbow:`.

**What survives of D-002.** RiftScribe remains the right source for the **gallery,
browsing, collection entry and statistics** — it has stats, parsed keywords, images,
collector numbers, ban flags, and typeahead. **7 of 27 legality checks** require data
it does not carry.

**Decided:** add **Stage 0.6** — evaluate Scrydex, API TCG and RiftboundCardDatabase;
if none suffice, hand-author the supplement. The scope is **bounded**: ~100 Legends
with their champion tags and domains, plus Signature card identification. Tedious,
not hard.

**Why this is pre-work rather than part of Stage 4:** if hand-authoring is required it
materially changes Stage 4's size and shape, and that is better known **before** the
architecture is chosen.

**Secondary finding — an unresolved factual question.** Community sources state every
Champion Legend has **two** domains. RiftScribe reports **one**. The rulebook states
neither — CR 103.1.b.2 says only "the domains of your Champion Legend." Those same
community sources were already wrong once, about the sideboard. **Verify against
physical cards** during Stage 0.6.

**Lesson, consistent with D-020:** verifying a dependency's *availability* is not the
same as verifying its *sufficiency*. D-002 confirmed the API worked; it never
confirmed the API carried every field the rules require.

---

## D-032 — Forge follows tournament rules and best-of-three ✅ Q7 + Q8 RESOLVED

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"I play just casually with friends, but for the sake of this app we are
making, we will follow tournament rules and bo3 game structure."*

**Decided:**

| Rule | Value | Citation |
|---|---|---|
| Main deck | **exactly 40** | TR 601.1.b |
| Sideboard | **0–10 cards**, in scope for Phase A | TR 601.1.c.1 |
| Copy limits | span main deck **+ sideboard** | TR 601.1.c.3 |
| Chosen Champion swapping | permitted whenever sideboarding is | TR 601.1.c.4 |

**This simplifies rather than complicates.** [spec/LEGALITY.md](spec/LEGALITY.md)
previously required a **casual / competition mode switch** — two code paths, two sets
of tests, and a mode-selection UI. **Only `COMPETITION` is now implemented.** The
casual rule (CR 103.2, "at least 40") stays *documented* so it can be added cheaply if
ever wanted, but it is not built. YAGNI.

**Cost accepted:** a 43-card kitchen-table deck will be reported illegal. The user
chose this deliberately — building to the stricter standard means decks are always
tournament-valid, and the rule is simpler to reason about.

**Consequence:** sideboard support moves **out of** deferred features and **into**
Phase A. Deck zones become: Legend · Champion · Main (40) · Runes (12) ·
Battlefields (3) · Sideboard (0–10).

---

## D-033 — The project premise is confirmed ✅ A13 CLOSED

**Date:** 2026-08-02
**Status:** Accepted — **resolved by direct evidence, not by testing**

**User:** *"See if I actually can make any legal decks — yes I can. I have over a
thousand cards … and I have made numerous decks already."*

**What this closes.** [AUDIT.md](AUDIT.md) finding **A13** was the project's highest-risk
assumption (fragility 4 × impact 5 = **20**): *that the bottleneck is information, not
cards.* If the collection could not produce complete legal decks, Forge would have been
a tool that mostly says "no."

**It is settled empirically.** The user has already built multiple real decks from this
collection. The experiment the audit proposed had, in effect, already been run — in
the physical world, repeatedly, with a positive result.

**Consequence:** Stage 0.5's counting checks (runes, battlefields, main deck) are
**cancelled as unnecessary.** Only the unrelated question embedded in Check 1 survives
— how many domains a Champion Legend carries — which is a *rules* question, not a
collection question.

**Lesson:** the audit was right to demand verification and wrong about the cost. The
answer was available by **asking the user about their own experience**, not by having
them count cardboard. Direct testimony from someone who has done the thing beats a
designed experiment to prove the thing is possible.

---

## D-034 — Riot's official card gallery is the primary data source ✅ SUPERSEDES D-002

**Date:** 2026-08-02
**Status:** Accepted — **resolves DM1 / LR1 and closes Stage 0.6**

**Decided:** Card data comes from **Riot's official card gallery**, not RiftScribe.

```
https://playriftbound.com/_next/data/{buildId}/en-us/card-gallery.json
```

The `buildId` is read from the page source of
`https://playriftbound.com/en-us/card-gallery/`. **`robots.txt` is `Allow: /` with no
exclusions.**

### Verified 2026-08-02 — it carries everything RiftScribe lacked

| Requirement | Official gallery | RiftScribe |
|---|---|---|
| Total cards | **1,180** | 950 |
| Vendetta (`VEN`) | ✅ 228 cards | ❌ **absent entirely** |
| **Domains** | `domain.values[]` — **an array**. 169 cards have 2 | ❌ single string, multi-domain inexpressible |
| **Champion tags** | ✅ **826 / 1,180** tagged | ❌ empty on **all 950** |
| **Signature supertype** | ✅ `cardType.superType` — **51** identified | ❌ absent |
| Set breakdown | OGN 352 · SFD 288 · UNL 288 · VEN 228 · OGS 24 | missing VEN |

### It also settled a foundational rule

**All 118 Legends carry exactly 2 domains** — confirming the user's answer
independently, and refuting RiftScribe's single-valued representation. Sample:

```
Bashful Bloom     domains=['Calm', 'Mind']    tags=['Lillia']
Battle Mistress   domains=['Body', 'Chaos']   tags=['Sivir']
```

### What this unblocks

**All 7 previously-unimplementable legality checks** — L8, L10, L17, L18, L19, L20,
L21. [spec/LEGALITY.md](spec/LEGALITY.md) is now fully implementable.

### What survives of D-002

RiftScribe remains useful as a **secondary** source — it offers pre-parsed `keywords`,
convenient `stats {energy, might, power}`, an `is_banned` flag, thumbnail sizes, and a
fuzzy typeahead endpoint. **But it is no longer the primary**, and it is **missing an
entire set**, which alone disqualifies it from that role.

**Why this is strictly better, beyond the fields:** it is **first-party**. It cannot
drift from the physical cards, it gains new sets on release day, and it aligns with the
standing rule that official sources govern — see [D-020](#d-020) and [D-035](#d-035).

**Risk:** the `buildId` changes on every site deploy, so it must be re-read rather than
hard-coded. Mitigated by caching the full payload locally (~3.2 MB).

---

## D-035 — Official Riot sources govern, for rules *and* card data

**Date:** 2026-08-02
**Status:** Accepted — **standing instruction**, extends [D-020](#d-020)

**User:** *"You are to strictly refer to the official rulebook whenever considering,
looking at or implementing game rules as this is official and what we will consider
correct. What I have of cards will never deviate from the official cards or rulebook."*

**Decided:** Official Riot publications are the **sole authority** for both game rules
and card data. Community wikis, guides, aggregators and fan APIs may be used for
convenience or cross-checking, but **never as the source of truth**, and never where
they conflict.

| Domain | Authority |
|---|---|
| Rules | Core Rules + Tournament Rules PDFs, [Rules Hub](https://playriftbound.com/en-us/rules-hub/) |
| Card data | Official card gallery — [D-034](#d-034) |
| Errata / bans | Official errata and ban list |

**Track record justifying this:** community sources were wrong about the **sideboard**
(claimed 0-or-8; actually ≤10), silent on **Signature cards** entirely, and the leading
fan API was **missing a whole set** and could not represent **two-domain Legends** —
despite every Legend having two.

**Corollary:** the user's physical collection is guaranteed to match official data, so
any mismatch between Forge and a physical card is **a Forge bug**, never a card
variance.
