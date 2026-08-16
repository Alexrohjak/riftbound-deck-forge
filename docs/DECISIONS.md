# Decision Log — Forge

Every significant decision, the alternatives considered, and why. Append-only:
if a decision is reversed, add a new entry rather than editing the old one.

---

## Index

| # | Decision | Status |
|---|---|---|
| [D-001](#d-001) | Success criteria: "legal + coherent" → "competitively tuned" | ⚠️ reversed |
| [D-002](#d-002) | Card data comes from the RiftScribe public API | ⚠️ superseded |
| [D-003](#d-003) | Collection ingestion: rent the scanner, build the importer | ⚠️ reversed |
| [D-004](#d-004) | Collection size established |  |
| [D-005](#d-005) | Local-first, desktop-primary, phone read-only | ⚠️ reversed |
| [D-006](#d-006) | Confirmed rules constraints | ✅ |
| [D-007](#d-007) | Build order: workbench first, generator second |  |
| [D-008](#d-008) | Generator must be multi-factor and conversational |  |
| [D-009](#d-009) | Meta data is a pluggable adapter, not a hard dependency |  |
| [D-010](#d-010) | We will not scrape sources that prohibit it |  |
| [D-011](#d-011) | Repository: private, `riftbound-deck-forge` |  |
| [D-012](#d-012) | Phone access must work away from the home network | ✅ |
| [D-013](#d-013) | Collection ingestion: purpose-built fast entry, no scanner | ✅ |
| [D-014](#d-014) | Piltover Archive is inspiration, not a template |  |
| [D-015](#d-015) | Gallery shows owned cards by default | ✅ |
| [D-016](#d-016) | No single effectiveness grade — show a panel of stats | ✅ |
| [D-017](#d-017) | Cards in decks are committed and leave the available pool | ✅ |
| [D-018](#d-018) | Phone gets FULL parity with desktop, including editing | ↩️ reverses |
| [D-019](#d-019) | Architecture is deliberately deferred | ✅ fulfilled by [D-047](#d-047)–[D-049](#d-049) |
| [D-020](#d-020) | Official rulebook is the sole legality authority | ✅ |
| [D-021](#d-021) | Physical card-location system deferred until re-organisation |  |
| [D-022](#d-022) | Deck statistics use a three-tier confidence framework | ✅ |
| [D-023](#d-023) | Rune feasibility is the flagship statistic |  |
| [D-024](#d-024) | Two departures from the originally requested statistics |  |
| [D-025](#d-025) | The project is called **Forge**; documentation restructured |  |
| [D-026](#d-026) | Only `BUILT` decks commit cards — refines D-017 |  |
| [D-027](#d-027) | A walking skeleton precedes layered construction |  |
| [D-028](#d-028) | Premise verification precedes all construction |  |
| [D-029](#d-029) | The generator is downgraded to a research spike |  |
| [D-030](#d-030) | "Playstyle" is defined mechanically, not by archetype name | ✅ |
| [D-031](#d-031) | RiftScribe is insufficient for legality | ⚠️ partial |
| [D-032](#d-032) | Forge follows tournament rules and best-of-three | ✅ |
| [D-033](#d-033) | The project premise is confirmed | ✅ |
| [D-034](#d-034) | Riot's official card gallery is the primary data source | ✅ |
| [D-035](#d-035) | Official Riot sources govern, for rules *and* card data |  |
| [D-036](#d-036) | The rules and card universe live in one living **COMPENDIUM**; `GAME-RULES.md` retired | ✅ |
| [D-037](#d-037) | **EE** is a first-class phase, not a feature of the workbench | ✅ |
| [D-038](#d-038) | EE evaluates against the **whole legal format**, not modelled archetypes | ✅ |
| [D-039](#d-039) | ⭐ **EE synthesises; it never enumerates** |  |
| [D-040](#d-040) | EE's rules engine is **rules-as-data**, because cards rewrite rules |  |
| [D-041](#d-041) | ⭐ **The generator is reinstated and fused with EE** — reverses D-029 | ↩️ reverses |
| [D-042](#d-042) | **Advice is pull, never push** — Forge never volunteers suggestions | ✅ |
| [D-043](#d-043) | ⭐ **EE is a rules engine with a swappable mouth** — the mouth is Claude Code | ✅ |
| [D-044](#d-044) | **`S1` splits** — combat and legality ship without chain resolution | ✅ |
| [D-045](#d-045) | **Tier by answer-part**, not by answer — refines D-022 | ✅ |
| [D-046](#d-046) | 🔒 **`D2` is closed** — the interface is locked | ✅ |
| [D-047](#d-047) | ⭐ **One TypeScript rules package, two consumers** — the engine never deploys | ✅ |
| [D-048](#d-048) | **Nothing is always-on** — static + edge + D1 on Cloudflare, £0/mo | ✅ A6, X5 |
| [D-049](#d-049) | **Editing requires connectivity; offline is read-only** — corrects D-018 | ✅ |
| [D-050](#d-050) | **App ships as static assets on the Worker** — Pages is closed to new projects; amends D-048 | ✅ X7 |
| [D-051](#d-051) | **Backups leave Cloudflare** — nightly cron commits a JSON snapshot to the repo, not R2 | ✅ X8 |
| [D-052](#d-052) | **Domain colours come from the rulebook** — corrects four of six in the locked D2 palette; amends D-046 | ✅ |
| [D-053](#d-053) | **The chrome gets one accent** — brass for interface state only; colour still means domain on cards; amends D-046 | ✅ |
| [D-054](#d-054) | **The collection is a filter, not a second gallery** — one gallery, an Owned toggle over it | ✅ |
| [D-055](#d-055) | **A match names a build, not a deck** — and the record withholds any rate it has not earned | ✅ W5 |
| [D-056](#d-056) | **One key space: the printing id** — the collection tool exported public codes that Forge could not read | ✅ |
| [D-057](#d-057) | **EE's analytical surface reaches the app before `S6`** — the mouth stays Claude Code; the app renders engine output verbatim | ✅ |
| [D-058](#d-058) | **The collection is imported from inside the app** — `curl` cannot get past Access, and looks like it worked | ✅ |
| [D-059](#d-059) | **Card entry moves into Forge** — a workflow you have to rehearse is one you stop using | ✅ |
| [D-060](#d-060) | **Forge holds many decks** — starting one and destroying one were the same act | ✅ |
| [D-061](#d-061) | **Runes are not collected** — Forge believes you always have them | ✅ |
| [D-062](#d-062) | **`S6` re-gated off `S2`** — the deckbuilding questions need no rules core | ✅ |
| [D-063](#d-063) | **Rules text comes from the fullest printing** — promos drop the reminders that explain a keyword | ✅ |
| [D-064](#d-064) | **A deck is built to a plan** — and measured against it, not against universal thresholds | ✅ |
| [D-065](#d-065) | **Tokens are read off printed text, not off a token registry** — four of eleven were never printed | ✅ |
| [D-066](#d-066) | **A match records the shape of the table** — `1v1` / `1v1v1` / `2v2`, and formats are never pooled into one rate | ✅ |

> **Reading order for someone new:** [D-034](#d-034) and [D-035](#d-035) establish where data and rules come from; [D-032](#d-032) fixes the rules scope; [D-013](#d-013), [D-017](#d-017), [D-026](#d-026) define the collection model; [D-016](#d-016) and [D-022](#d-022) define what the tool claims to know.

---

<a id="d-001"></a>

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

<a id="d-002"></a>

## D-002 — Card data comes from the RiftScribe public API ⚠️ SUPERSEDED

**Date:** 2026-08-02
**Status:** Superseded by [D-034](#d-034) — RiftScribe demoted to secondary

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

> ❌ **Superseded by [D-034](#d-034).** Two claims above proved false on verification:
> RiftScribe does **not** contain all five sets — **Vendetta is entirely absent** — and
> it does **not** carry everything a constraint solver needs. It lacks champion tags,
> the Signature supertype, and any way to express a two-domain card. Riot's own card
> gallery supplies all of them. RiftScribe remains useful as a **secondary** source.


---

<a id="d-003"></a>

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

<a id="d-004"></a>

## D-004 — Collection size established

**Date:** 2026-08-02
**Status:** Accepted

~64 packs × 14 cards ≈ 900, plus several preconstructed decks (~50+ cards each)
≈ **1,000+ physical cards**. Crucially, **unique** cards are far fewer —
roughly 250–400 — because 64 packs produce heavy duplication.

**Implication:** The data model is `card_id → quantity`, not a thousand rows.
Quantity is what drives legality (3-copy limit) and consistency.


---

<a id="d-005"></a>

## D-005 — Local-first, desktop-primary, phone read-only ⚠️ REVERSED

**Date:** 2026-08-02
**Status:** Superseded by [D-018](#d-018) — the phone gained full editing parity

Desktop is the workbench for long planning sessions; phone is a **read-only**
view of saved decks during play. The user never builds decks on a phone.

**Why it matters:** Read-only mobile is dramatically cheaper than full mobile
editing, and it removes any need for conflict resolution or sync-merge logic.

> ❌ **Reversed by [D-018](#d-018).** The user requires full editing on the phone —
> *"I learn new things while playing."* Note the stated benefit survived anyway: with
> **one** app rather than two synchronised surfaces, no sync-merge logic is needed
> either.


---

<a id="d-006"></a>

## D-006 — Confirmed rules constraints ✅ CONFLICT RESOLVED

**Date:** 2026-08-02
**Status:** Accepted; the sideboard conflict was resolved by [D-020](#d-020)

- Deck = **1 Legend + 1 Chosen Champion + 40+ main + exactly 12 runes + 3 Battlefields**
- **Maximum 3 copies** of any unique card name; the Chosen Champion counts within this
- The 3-copy limit spans **main deck + sideboard combined**
- Domain identity: the Legend defines **two domains**; every card and rune must comply
- Six domains: Fury, Chaos, Mind, Body, Order, Calm (+ `colorless`)
- Win condition: **8 points**; the 8th must come from *holding* a Battlefield or
  conquering all Battlefields in one turn

✅ **Resolved by [D-020](#d-020) — the sideboard is ≤10** (TR 601.1.c.1). Piltover
Archive's `0/10` was correct; the community guides were stale. Two further corrections
arrived with it: main deck size is **exactly 40** in competition (TR 601.1.b), and
**Signature cards** are a separate constraint no community source mentioned
(CR 103.2.d).

**Standing rule:** source legality rules from official documents, never from blogs.


---

<a id="d-007"></a>

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

<a id="d-008"></a>

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

<a id="d-009"></a>

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

<a id="d-010"></a>

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

<a id="d-011"></a>

## D-011 — Repository: private, `riftbound-deck-forge`

**Date:** 2026-08-02
**Status:** Accepted

Private GitHub repository under `Alexrohjak`. Nothing here needs to be public today,
and private → public is a trivial change later, whereas the reverse is not.


---

<a id="d-012"></a>

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

<a id="d-013"></a>

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

> 📌 **Counts corrected 2026-08-02 by [D-034](#d-034).** These figures came from
> RiftScribe, which is missing the Vendetta set. Authoritative totals are **1,180
> printings / 935 distinct names**. The reasoning and conclusion are unaffected —
> entry still scales with unique names, and the pool is still small.

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

<a id="d-014"></a>

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

<a id="d-015"></a>

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

<a id="d-016"></a>

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

<a id="d-017"></a>

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

<a id="d-018"></a>

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

<a id="d-019"></a>

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

<a id="d-020"></a>

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

See [reference/COMPENDIUM.md](reference/COMPENDIUM.md) for the full authoritative rule set
(`GAME-RULES.md` was retired by [D-036](#d-036)).


---

<a id="d-021"></a>

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

<a id="d-022"></a>

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

<a id="d-023"></a>

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

<a id="d-024"></a>

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

<a id="d-025"></a>

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

<a id="d-026"></a>

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

<a id="d-027"></a>

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

<a id="d-028"></a>

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

<a id="d-029"></a>

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

<a id="d-030"></a>

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

<a id="d-031"></a>

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

<a id="d-032"></a>

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

<a id="d-033"></a>

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

<a id="d-034"></a>

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

<a id="d-035"></a>

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

---

<a id="d-036"></a>

## D-036 — One living reference: the COMPENDIUM ✅

**Date:** 2026-08-02
**Status:** Accepted

**Context:** both official rulebooks were read cover to cover (Core Rules 120pp,
Tournament Rules 50pp) and all 1,180 card printings analysed as data. This produced
findings that contradicted `reference/GAME-RULES.md` in eight places, including a keyword
list that was 8 entries where the glossary has **25**, and one entry (`conquer`) that is
not a keyword at all.

**Decided:** [`reference/COMPENDIUM.md`](reference/COMPENDIUM.md) is the **single living
reference** for rules and the card universe. `reference/GAME-RULES.md` is **retired** —
its content is superseded, and keeping a second rules document with known errors is
exactly the drift this project cannot afford.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep both, fix GAME-RULES | Two rules documents diverge. That is how the errors arose |
| Keep GAME-RULES as a summary | A summary of a rulebook is what community sources are, and they have been wrong twice |
| Delete without replacement | The orientation value was real; COMPENDIUM Part I absorbs it |

**Consequence:** git history preserves the retired file. All inbound links updated.

---

<a id="d-037"></a>

## D-037 — EE is a phase, not a feature ✅

**Date:** 2026-08-02
**Status:** Accepted

**User:** *"This aspect of the forge will be probably the main part of the whole system
except the actual card library of the player."*

**Decided:** the Evaluation Engine (**EE**) is **Phase B**, a first-class delivery track
running parallel to the workbench — not a panel inside Stage 8.

**Rationale:** EE's rules core needs only the cached card pool (Stage 4). It needs no UI,
no collection and no workbench, so it can be built and tested **headlessly in parallel**.
Burying it inside a statistics stage would have mis-sequenced the project's most valuable
component behind its least-coupled dependency.

**Consequence:** `PLAN.md` restructured into two tracks after Stage 4. Stage 1 grows —
it must now design how EE *speaks*, not just how the workbench looks.

---

<a id="d-038"></a>

## D-038 — EE evaluates against the whole legal format ✅

**Date:** 2026-08-02
**Status:** Accepted — answers *"good against what?"*

**Decided:** EE's opponent model is the **threat space** — every card the format can
legally field, bucketed by Domain Identity, cost, speed and role.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Modelled archetype decks per Legend | Constructing a "typical" list requires assumptions — the guessing EE exists to avoid |
| Tournament meta data | Inaccessible (403) *and* statistically empty — n = 1–3 for the current set |
| The user's own decks only | Says nothing about the wider field |

**What this buys:** matchup analysis needs **no external data**, so it is Tier 1/2 rather
than the omitted Tier 3. It answers *"what could I face"* — a weaker claim than *"what
will I face"*, but a **true** one.

**Layerable later:** entering specific rival decks is a refinement of this model, not a
replacement.

---

<a id="d-039"></a>

## D-039 — ⭐ EE synthesises; it never enumerates

**Date:** 2026-08-02
**Status:** Accepted — **the prime directive of EE**

**User:** *"I don't want to create a deck using this forge, then be told 'this works
unless your opponent has one of these 10000000 cards' — this is not the kind of
interaction and feedback one enjoys listening to and understands."*

**Context:** the v2 EE design computed *refutation sets* — every card that could flip a
given line — and proposed reporting them. Measured against the real pool, a single combat
had **66** refuting cards. Correct, and useless.

**Decided:** refutation sets, coverage percentages and card lists are **internal
computation**. EE's output is **at most a handful of named, actionable statements**, with
volume available only behind an explicit "show me the cards" affordance.

| ❌ Never | ✅ Always |
|---|---|
| "66 cards refute this attack" | "Fragile to cheap Mind interaction — attack when they're tapped out, or hold `Cleave`" |
| "Answer coverage 42% at cost 3–4" | "Your removal tops out at 4 damage; roughly a third of what you'll meet outclasses it" |

**Enforcement:** a **statement budget**, asserted by test (`EVALUATION.md` §10). This is
not a stylistic preference — an answer a human cannot hold in their head has failed,
regardless of correctness.

**Consequence:** a dedicated **synthesis layer** (Stage 11) sits between analysis and
conversation. Without it, EE is technically correct and practically worthless.

---

<a id="d-040"></a>

## D-040 — EE's rules engine is rules-as-data

**Date:** 2026-08-02
**Status:** Accepted

**Context:** a naive evaluator hardcodes the rules — `lethal = damage >= might`,
`Tank is assigned first`, `the board has 2 battlefields`. Analysis of the card pool found
**21 cards that rewrite exactly those rules**:

| Card | Overrides |
|---|---|
| **Elder Dragon** | *"Any amount of your damage is enough to kill enemy units"* — voids the lethal-damage threshold (CR 142.4.c) |
| **Dune Surfer** | *"You ignore `[Tank]` while assigning combat damage here"* |
| **Baron Nashor** | Adds a battlefield token to the board mid-game |
| **Endless Riches** | *"Skip your Draw Phase"* — turn structure is mutable |
| **Time Warp** | *"Take a turn after this one"* — turn order is mutable |

**Decided:** every rule EE applies — lethal threshold, assignment order, targeting
legality, phase sequence, board composition — is a **modifiable parameter of game state**,
overridable by an active effect.

**Rationale:** CR 002's Golden Rule — *"Card text supersedes rules text"* — is not a
footnote, it is an architectural requirement. An engine with the rules compiled in is
wrong the moment Elder Dragon resolves.

**Consequence:** Stage 9 is an **XL** stage and the largest single component in the
project. Mitigated by building vertically (one battlefield, 1v1, full fidelity) and by
using the rulebook's own worked examples as the test suite.

---

<a id="d-041"></a>

## D-041 — ⭐ The generator is reinstated, and fused with EE ↩️ REVERSES D-029

**Date:** 2026-08-02
**Status:** Accepted — reverses [D-029](#d-029), refines [D-007](#d-007), **resolves the
contradiction in [D-016](#d-016) vs generation**

**User:** *"the generator now looks to be pretty moot, I don't want this. I want the
generator to work hand in hand with the EE… I should also be able to generate a deck either
from scratch with keywords or ideas for playstyles or some inputs like 'I keep losing to this
deck what can I play to counter', and also choose a legend, unit or a few cards I want in my
new deck and generate ideas from that."*

**Decided:** generation is **not a separate feature and not a deferred spike.** It is EE
running in the *propose* direction instead of the *evaluate* direction, and it ships as part
of the Strategist track.

### ⭐ Why this resolves the objective-function contradiction

`GENERATOR.md` §3 recorded a genuine blocker: *"a generator needs an objective function, and
D-016 forbids a composite score."* Three candidate resolutions were listed and none was
satisfying.

**The user's framing dissolves it.** Every generation mode they described **supplies the
objective from outside the tool**:

| Mode | Where "good" comes from |
|---|---|
| **Seeded** — *"build around Ornn / these three cards"* | The seed. The tool satisfies constraints; it does not decide what is worth building |
| **Intent** — *"aggressive"*, *"I want to hold battlefields"* | The stated intent, expressed **mechanically** per [D-030](#d-030) — curve, unit density, interaction count |
| **Counter** — *"I keep losing to this deck, what beats it"* | ⭐ **A specific, computable target**: answer coverage against that deck's threats. This is EE's existing threat analysis run in reverse — not a vibe score |
| **Blank** — *"surprise me"* | Several **distinct** directions the collection supports, each explained |

> **The tool never decides which deck is best.** It proposes candidates that satisfy a
> user-supplied objective, then **explains each one's strengths and gaps** in EE's normal
> voice. The user chooses. **No composite score is computed anywhere**, so D-016 holds
> intact — and this is what [D-008](#d-008) asked for originally ("multi-factor and
> conversational").

### Why the earlier downgrade was still right at the time

[D-029](#d-029) downgraded the generator because the stated goal was *"to enjoy hours of
tinkering"* and a generator automates tinkering. That reasoning was sound **for a
one-shot generator that hands you a finished list.**

What is now specified is different: an **assistant inside the tinkering loop** — suggesting
cards while you build by hand, answering *"what beats this"*, and seeding ideas you then take
over. It **adds** to the hours rather than replacing them. The audit's finding A9 is answered
rather than ignored.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep it a post-Workbench spike | The user has now stated the need directly. The spike existed to discover whether it was wanted; that question is answered |
| Build it as a separate generator subsystem | It would duplicate EE's rules engine, synergy graph, collection awareness and explanation layer. Everything a generator needs, EE already has |
| One-shot generation | Explicitly not what was asked for. The **interactive loop is the product** |

**Consequences:**

- **L2 is dissolved.** `GENERATOR.md` is rewritten from a spike proposal into a
  specification of EE's generation modes
- **New step `S5` — Deck generation**, gated on `S3` (plain-English answers) and `W2`
  (collection), since generation is meaningless without knowing what you own
- The kill conditions in the old spec are retained as **design constraints** rather than
  cancellation triggers — K2 in particular ("if the collection can't support multiple decks,
  the right product is gap analysis") becomes the **failure mode**: *"you have 34 of 40 —
  here are the 6 gaps"*
- [D-007](#d-007) ("workbench first, generator second") still holds in **sequence** — W1/W2
  gate S5 — but no longer in **commitment**

---

<a id="d-042"></a>

## D-042 — Advice is pull, never push ✅

**Date:** 2026-08-02
**Status:** Accepted — resolves **G5**, extends [D-017](#d-017)

**User:** *"G5 shouldn't be live, only give feedback when requested."*

**Decided:** **Forge never volunteers advice.** Suggestions, recommendations, warnings about
deck quality and generation ideas appear **only when asked for**.

### The distinction that makes this workable

Not everything on screen is advice. The line is between **state** and **opinion**:

| Always visible — *state* | On request only — *advice* |
|---|---|
| Legality: is this deck legal, and which rule fails | *"Consider swapping X for Y"* |
| Ownership: do you own this, is it in another deck | *"Your curve is top-heavy"* |
| Statistics: curve, rune feasibility, coverage | *"This loses to Body/Fury"* |
| Counts: 38/40, 11/12 runes | Generated candidates |

**State is a fact about what you have built** and belongs on screen continuously — you
cannot build without it. **Advice is EE's opinion**, and it waits to be asked.

**Why:** the stated goal is *"to enjoy sitting for hours creating, putting together, sleeving
and testing decks."* A tool that interrupts with suggestions turns building into
**responding to a critic**. [D-017](#d-017) already flagged the same instinct for commitment
warnings — *"how does 'this card is in Jinx Aggro v2' appear **without nagging**"* — so this
generalises an existing principle rather than inventing one.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Live suggestions as you add cards | Turns a creative session into a critique. Directly attacks the stated goal |
| Live, but dismissible | Still interrupts; dismissal is itself friction, repeated dozens of times per session |
| Live only for "serious" problems | Requires Forge to judge severity — and *"serious"* is exactly the composite judgement [D-016](#d-016) forbids |

**Consequences:**

- EE needs an **explicit invocation** in the interface — a question box, an "ask" affordance,
  or a panel you open. **This is a D2 design requirement**, not an implementation detail
- Generation is always user-initiated
- ⚠️ **Legality and ownership remain live**, because they are state. A silently illegal deck
  would be a worse failure than a nagging one

---

<a id="d-043"></a>

## D-043 — ⭐ EE is a rules engine with a swappable mouth ✅ RESOLVES X1 + E1

**Date:** 2026-08-03
**Status:** Accepted — resolves **X1** and **E1**; retires `S3` and `S4` as build work

**User:** *"accept all three, lets close D2"* — on proposals raised 2026-08-02.

**Decided:** EE's deliverable is a **headless tool surface** over a deterministic rules core —
`legality()`, `duel()`, `coverage()`, `legendPool()` and their siblings. **The conversation
layer is not built.** Claude Code is the mouth, reading exported state and calling those tools.

### The tell that made this decision

`S1`'s done-when is *"every worked example in CR 355–359 passes as a fixture."* **You cannot
write that test against a chat interface** — only against an engine. Sort the `S` track by
whether its done-when is falsifiable and it splits cleanly:

| Milestone | Done-when | Falsifiable? |
|---|---|---|
| `S1` Rules engine | Rulebook worked examples pass as fixtures | ✅ Yes |
| `S2` Analysis | Q-CARD / Q-COMPARE / Q-LEGEND answered headlessly | ✅ Yes |
| `S3` Plain-English | *"No answer exceeds its statement budget"* | ⚠️ The **test** is real; the **budget** was always going to be picked, not derived |
| `S4` Conversation | Follow-ups work; no ungrounded number | ⚠️ Half a discipline, half a rebuild of something that exists |

Everything falsifiable describes the **engine**. Everything else describes the **voice** — and
the voice already exists, sitting in a terminal, holding the whole game in context.

**The corpus fits.** [`EVALUATION.md`](spec/EVALUATION.md) §9 measured it: 814 main-deck cards
with full text ≈ 38,700 tokens, +115 Legends/Battlefields ≈ 3,900, both rulebooks ≈ 75,000.
**Riftbound entire is ~118k tokens.** That measurement was taken to prove a conversation layer
*could* be built. It equally proves one doesn't need to be.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Build the in-app chat (`S3` + `S4` as specified) | Two milestones of work to reproduce, worse, a thing already open on the desktop. Its own spec called the conversation layer *"depends on the D3 architecture decision"* — it was never load-bearing, only assumed |
| Ship the engine with no voice at all | The engine's raw output is *"66 cards refute this"* — exactly what [D-039](#d-039) forbids. Something must synthesise |
| Both — engine now, in-app chat later if the mouth disappoints | Accepted as the **fallback**, not the plan. `S3`/`S4` stay in the log as retired-not-deleted for precisely this reason |

**Consequences:**

- ✅ **`X1` and `E1` dissolve.** Both asked *"where does the conversation layer run?"* It runs
  in Claude Code. This was never a `D3` architecture question — it was a late, reversible
  choice that had been promoted to a gate
- ✅ **Roughly a third of the `S` track stops being build work**
- 🆕 **New milestone `S6` — EE's mouth.** P1 makes the voice *cheap*, not *free*. The tool
  surface, the export contract, and the briefing document that makes Claude behave as EE
  are real work. Small, but real, and honesty demands it be a line in the plan
- ⚠️ **`S5` (generation) re-gates on `S2`**, not `S3` — its old gate no longer exists
- 🔻 **The cost, named:** `S3`'s budget test was going to be enforced by CI. Under this
  decision it is enforced by a **briefing document**, which is weaker. This is the real price
  of P1, and [D-045](#d-045) is what keeps it from being paid in honesty
- **The engine must be genuinely headless** — no assumption of a caller that can be
  reasoned with. It returns structured data or it fails

<a id="d-044"></a>

## D-044 — `S1` splits: combat and legality ship without chain resolution ✅

**Date:** 2026-08-03
**Status:** Accepted — supersedes `S1` as a single milestone

**Decided:** `S1` becomes two milestones:

| ID | Scope | Status |
|---|---|---|
| **`S1a`** | Game state · legal-action enumeration · combat damage under Tank/Backline/lethal-first/no-overkill · replacement effects · layers · rules-as-data overrides | The next engine work |
| **`S1b`** | **Chain resolution** (LIFO, `[Reaction]`-only when closed) and showdowns as alternating priority windows | **Deferred until `Q-LINE` is actually missed** |

**Why:** `S1` was the largest single component in the project and gated the entire `S` track.
Its two halves have very different value density. Of the eight questions EE answers, **seven
need combat and card evaluation; one needs chains** — `Q-LINE`, *"should I attack here?"*,
the only question requiring a fully-resolved priority window.

Deferring the half that serves one question unblocks the half that serves seven.

**The trigger is named, not vague:** `S1b` starts when you ask `Q-LINE` and get a refusal
you mind. Not on a date, not on a hunch — on a real miss.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep `S1` whole | The largest, riskiest component gating everything downstream is the shape the audit already flagged as time-to-first-value risk. Same mistake, one track over |
| Cut chains permanently | `Q-LINE` is a genuinely wanted question, and Riftbound's chain system is a real part of the game. Deferred, not abandoned |
| Build chains first (hardest-first) | Defensible for risk-retirement, but delivers nothing usable for the longest possible time |

**Consequences:**

- `S2` gates on **`S1a`**, so analysis starts far earlier
- ⚠️ **`S1a` must not make chains impossible.** The state model has to leave room for a
  priority stack even while nothing pushes to it. A flat "resolve immediately" model that
  can't be extended would convert a deferral into a rewrite
- `Q-LINE` returns an explicit *"not modelled yet"* — never a guess. [D-022](#d-022) applies

<a id="d-045"></a>

## D-045 — Tier by answer-part, not by answer ⭐ REFINES D-022

**Date:** 2026-08-03
**Status:** Accepted — resolves a contradiction between [D-022](#d-022) and
[`EVALUATION.md`](spec/EVALUATION.md)

### The contradiction

[D-022](#d-022) established three confidence tiers and the rule **omit rather than fake**:
Tier 3 is left out, not hedged. But EE's entire purpose is strategic advice — *"attack when
they're tapped out"*, *"hold Jinx rather than curving her out"* — and **all of that is Tier 3
inference.** Applied literally, D-022 requires EE to be silent about the only thing it exists
to say.

The `D2` prototype demonstrated the failure directly. It labelled *"Most games are decided by
which player holds two battlefields first"* and *"three swaps is usually the right size of
change"* as `LIKELY` — **Tier 2, measured-but-uncertain**. Neither is measured. Neither could
be. The prototype was laundering opinion as estimate, which is the exact dishonesty D-022 was
written to prevent.

**Decided:** confidence tiers apply **per answer-part**, not per answer.

| Answer part | Permitted tiers | What it may contain |
|---|---|---|
| **Grounding** | Tier 1 (`FACT`) and Tier 2 (`LIKELY`) **only** | Counts from your collection, rules the engine adjudicated, simulated frequencies. Nothing EE inferred |
| **Statement** | Unrestricted — but must be **derivable from the grounding shown** | The claim |
| **Lever** | Unrestricted — labelled **opinion** at the part level | What to do about it |

**The guarantee this preserves:** *everything under `Grounding` is something Forge measured.*
That is what D-022 was actually protecting — not silence, but the integrity of the evidence
line. A reader can discard EE's opinion entirely and still trust every fact beneath it.

**Labelling is per-part, not per-line.** The `Grounding` heading carries the tier badges; the
lever carries a single "EE's read" marker. **A per-line hedge on an opinion is noise** —
if the whole part is opinion, saying so once is more honest and less cluttered than saying
so four times.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Apply D-022 literally — EE gives no strategic advice | Deletes the product. `Q-DECK`, `Q-THREAT`, `Q-SIDEBOARD`, `Q-BUILD` and `Q-LINE` are all Tier 3 by nature |
| Add a Tier 3 badge and show it inline | Tested in the prototype and it reads as noise — four hedges in a six-line answer trains you to ignore all of them. Also invites the failure the prototype actually made: `LIKELY` used where nothing was measured |
| Drop the tier system for EE and keep it for statistics only | Loses the guarantee at exactly the point it matters most. Statistics are self-evidently measured; advice is where a reader needs to know what's underneath |

**Consequences:**

- The `D2` prototype's three mislabelled `LIKELY` lines move out of `Grounding`
- 🔻 **Under [D-043](#d-043) this is enforced by briefing, not by CI.** The `S3` budget test
  is gone. What replaces it: EE's grounding is assembled by **tool output only** — the mouth
  is never given the ability to author a grounding line. **Structural enforcement instead of
  a test**, which is the stronger of the two and available precisely because the engine is
  headless
- [D-022](#d-022) is unchanged for deck statistics, where it always applied cleanly

<a id="d-046"></a>

## D-046 — 🔒 `D2` is closed: the interface is locked ✅

**Date:** 2026-08-03
**Status:** Accepted — closes `D2`; `D3` is the remaining gate before `DESIGN LOCKED`

**User:** *"lets close D2"*

**Decided:** the [`D2` prototype](design/D2-workbench-prototype.html) is the locked interface
design, with [D-045](#d-045) applied and the two open questions answered below.

`D2` had to design three things ([D-042](#d-042) added the third). All three are settled:

| # | Thing | Resolution |
|---|---|---|
| 1 | **The workbench** — gallery, deck zones, The Bench, ownership language | Pips + zone rail, dock on phone / panel on desktop. Parity per [D-018](#d-018) |
| 2 | **How EE speaks** | Statement · lever · grounding, tiered per [D-045](#d-045) |
| 3 | **How EE is invoked** | A deliberate ask affordance. State is live, opinion waits ([D-042](#d-042)) |

### Q1 — Ownership pips: do they read instantly, or need numbers?

**Answered: pips alone, capped at three, with surplus shown separately.**

This turned out to be answerable on a rule rather than on taste. **[L13](spec/LEGALITY.md):
≤3 copies per card *name*, across main deck and sideboard.** A fourth copy is unplayable — so
a fourth pip encodes nothing a deckbuilder can act on.

- **Three pip slots**, always. Filled = free, hollow = committed elsewhere, empty = you don't
  own it. The row answers *"can I still put this in a deck?"* at a glance, which is the only
  question the gallery is asked
- **Surplus is a different fact and gets different treatment** — a `+2` marker, not more pips.
  Owning five copies matters for trading, never for building
- **No numbers in the gallery.** A three-item row is below the subitising threshold; a digit
  there costs a saccade to read something a shape already said

**Why not numbers:** the count you need while scanning is *free copies remaining*, and it is
never above three. Numbers earn their place where the range is unbounded — the card sheet's
ownership breakdown, and the deck counts — and both already use them.

### Q2 — Is EE's answer the right length?

**Answered: yes, and this becomes the budget.**

| Part | Budget |
|---|---|
| **Statement** | 1 sentence. The claim, no preamble |
| **Lever** | ≤2 sentences, naming ≤3 cards |
| **Grounding** | ≤3 lines, Tier 1/2 only ([D-045](#d-045)) |
| **Whole answer** | ~60 words before any "show me" affordance |

This is tighter than [`EVALUATION.md`](spec/EVALUATION.md) §5.2's *"3–5 statements per
answer"*, which was written before there was anything to look at. **The prototype makes the
case that one statement plus one lever is enough** — the second and third statements in an
answer are almost always the first one restated at lower salience. §5.2 is updated to match.

> ⚠️ **Both answers are my call, not yours** — you asked to close `D2` without settling them,
> and the reasoning above is what I'd defend. They are **cheap to reverse**: the pip cap is
> one function, the budget is a line in EE's briefing. **First real use overrides either.**

**Consequences:**

- `D3` is now the only thing between here and `DESIGN LOCKED`
- [D-014](#d-014) is confirmed in its narrow reading: Piltover Archive's **deck-zone structure**
  is adopted; its visual identity is not
- The prototype in [`docs/design/`](design/) is the reference. It is a **design artifact, not
  a starting codebase** — `D3` picks the stack without regard to how the prototype was built

---

<a id="d-047"></a>

## D-047 — ⭐ One TypeScript rules package, two consumers ✅

**Date:** 2026-08-03
**Status:** Accepted — the load-bearing decision of `D3`. Full reasoning in
[`ARCHITECTURE.md`](ARCHITECTURE.md) §2

**Decided:** the rules live in **one pure TypeScript package**, imported by both the web app and
the CLI that Claude Code calls. **The engine is never deployed** — it is a library, not a service.

### The collision that forced it

| Requirement | Source | Where rules must run |
|---|---|---|
| Legality and counts are **live on screen** — they are state, not advice | [D-042](#d-042) | **In the browser**, on every edit |
| EE answers **headlessly**, called by Claude Code | [D-043](#d-043) | **On the desktop**, outside any browser |

The same 33 legality checks are needed in both places. Two implementations would mean **two
bodies for the highest-correctness-risk component in the project** — `W1` is already the thing
everything downstream trusts, and two of it drifting apart is the worst available outcome.

**This is why the stack is TypeScript and not Python**, despite the card tooling already being
Python. Python cannot serve live in-browser legality without dragging in Pyodide. The Python in
`tools/` stays, because it is a **build step**, and build steps have no such constraint.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Rules on the server, browser asks over HTTP | Every keystroke becomes a round trip. Legality is live state ([D-042](#d-042)) — it cannot wait on a network |
| Python engine + a separate JS legality check for the UI | Two implementations of `W1`. The exact failure this decision exists to prevent |
| Python engine compiled to WASM via Pyodide | ~10 MB of runtime to avoid writing TypeScript. Disproportionate |

**Consequences:**

- The engine is **pure** — no network, no filesystem, no DOM — which is also what makes the
  `S1a` rulebook fixtures trivial to run
- `apps/cli` is a thin shell over the package; [`S6`](ROADMAP.md) gets smaller again
- ⚠️ **The engine must not import anything browser- or Node-specific.** A single `fetch` or
  `fs` call in it breaks one of the two consumers, and it will be the one nobody ran

<a id="d-048"></a>

## D-048 — Nothing is always-on ✅ RESOLVES A6 + X5

**Date:** 2026-08-03
**Status:** Accepted — resolves **A6** and **X5**. Verified costs in
[`ARCHITECTURE.md`](ARCHITECTURE.md) §5

**Decided:** a **static bundle on a CDN**, **one edge function**, and **managed SQLite**
(Cloudflare D1), behind **Cloudflare Access**. **£0/month**, verified against vendor
documentation on 2026-08-03.

### A6, answered

The audit flagged *"hosted, always-on"* as convention rather than fact. **The instinct was
right and the word it caught was "always-on."** Two ideas had been fused that are not the same:

- *"reachable from anywhere"* — **required**, by [D-018](#d-018) and [D-012](#d-012)
- *"a server I keep running"* — **never justified, and now not built**

Static files, per-request functions and managed SQLite have **no idle state**. Nothing is
running when Forge is not being used: no VM, no container, no process to restart, no patching
cadence, no bill that accrues while you sleep. A6 is upheld — not by abandoning hosting, but by
hosting something with nothing to keep on.

**Why Cloudflare:** the repo is private ([D-011](#d-011)), which is what ruled out GitHub Pages
at `D2`. Cloudflare deploys private repos on the free plan, and one account covers app, API,
database, access control **and the docs — so X5 resolves as a side effect** rather than as a
second decision. `PLAN.md` had asked for exactly that: *"one host can serve both, and picking
twice is waste."*

**D1 rather than Workers KV — consistency decides it.** KV is eventually consistent, taking
**up to 60 seconds** to propagate globally. The core journey is *edit on the phone at a shop,
open the desktop at home*; a store that can serve a minute-old collection turns *"where did that
card go?"* into a real bug on the one axis ([ownership, D-015](#d-015)) the product is organised
around. D1 is strongly consistent, relational — matching
[`DATA-MODEL.md`](spec/DATA-MODEL.md) directly — and allows **100× KV's daily writes.**

**Cloudflare Access for auth**, free to 50 users, **zero application code**. Forge never sees a
password and has no session logic to get wrong. Hand-rolled auth on a personal project is pure
downside risk.

**Consequences:**

- ⚠️ **The risk is terms changing, not usage growing.** Forge sits ~3 orders of magnitude below
  every limit that matters. **Mitigation: nothing here is lock-in** — a static bundle moves to
  any host, one small function is portable, and D1 exports to a `.sql` file
- The roadmap gets the bookmarkable URL X5 wanted
- ❌ **Rules out** Next.js and every SSR framework (nothing to server-render), Postgres and
  every always-on database, and hand-rolled authentication

<a id="d-049"></a>

## D-049 — Editing requires connectivity; offline is read-only ⚠️ CORRECTS D-018

**Date:** 2026-08-03
**Status:** Accepted — corrects a claim in [D-018](#d-018)

### The error being corrected

[D-018](#d-018) concluded that because there is one app rather than two synchronised surfaces,
**"no sync-conflict or merge logic is needed."** That holds only while the app always talks to
the server. **An offline-editing PWA breaks it:** edit a deck on the phone in a basement, edit
the same deck at home, and there are two divergent versions with no rule for combining them.

D-018 was right about its own case and wrong about the one it did not consider.

**Decided:**

- **Offline you can look.** Decks, collection and full card data are service-worker cached —
  the *"at a shop, no signal, what's in this deck?"* case works
- **Offline you cannot edit.** The affordances disable with a plain reason — never a silent
  failure, never an edit that appears to save and doesn't
- **D-018's conclusion survives**: still no merge logic, because there is still exactly one
  writable copy

**The cost, named.** D-018's reason for phone parity was *"I learn new things while playing."*
A shop with no signal is exactly when that happens, and this says: capture it in the app when
you have signal, on paper when you don't. **That is a real limitation, not a technicality.**

**The trigger for revisiting** — the same pattern as [D-044](#d-044)'s deferral of chains: if
you find yourself unable to record something at a table and mind it, build the queued-writes
flow (a per-deck version counter plus last-write-wins). **Not on speculation.**

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Full offline editing with CRDTs | Weeks of work and a permanent complexity tax, for one user who is never editing from two devices at the same moment |
| Offline editing, last-write-wins, silent | Silently discards work. The one outcome worse than not being able to edit |
| No offline capability at all | Throws away the read case, which is cheap, genuinely useful, and already how the collection tool's standalone build works |

<a id="d-050"></a>

## D-050 — The app ships as static assets on the Worker, not Cloudflare Pages ⚠️ AMENDS D-048

**Date:** 2026-08-03
**Status:** Accepted — amends the delivery half of [D-048](#d-048); forced by the vendor

### What changed underneath us

[D-048](#d-048) picked **Cloudflare Pages** for the app and a Worker for the API. Executing it
at `F1` on a fresh account, **the dashboard would not create a Pages project** — every "create"
flow routes to Workers. This is deliberate on Cloudflare's part: Pages is in maintenance, all
new work goes to Workers, and [static assets on Workers](https://developers.cloudflare.com/workers/static-assets/)
is the stated replacement.

**The vendor decision survives untouched.** D-048 chose Cloudflare on two constraints — private
repos on the free plan, and one host covering app, API, database, access and docs. Both still
hold. Only the product inside Cloudflare moved.

**Decided:** one Worker serves the built SPA *and* the API, from one origin.

- `[assets]` in `wrangler.toml` points at `apps/web/dist`; `not_found_handling` is
  `single-page-application`, so client-side routes work at `W3` without server config
- `run_worker_first = ["/health", "/collection"]` keeps the API paths with the Worker —
  without it the SPA fallback answers them with `index.html`, which is a 200 carrying the
  wrong body, the worst failure shape available
- The old `forge-api` Worker was deleted rather than left running, so there is exactly one
  endpoint on the database to put Access in front of

**What this buys, beyond being the only option.** Same origin means the app fetches
`/collection` relatively: no CORS, no build-time API URL, and **one** Access application
protecting everything. Two hostnames would have needed two.

**What it costs.** `npm run build` must run before `npm run deploy` — the Worker now carries
the app's build output, so a stale `dist/` ships silently. Automatic deploys from Git make
that a non-issue in practice, which is why `F1` is not done until they are wired.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Two Workers — one assets, one API | Two hostnames, so CORS, a build-time API URL, and two Access applications to keep in step. Pure cost, no benefit for a single user |
| Pages via the API, bypassing the dashboard | Only creates *direct-upload* projects — Git integration is browser-only. That trades the automatic deploys `F1` requires for a hand-built GitHub Action and a long-lived token on disk |
| A different host (Netlify, Vercel, Fly) | Would reopen D-048's whole comparison, including the £0/month verification, over a product rename inside a vendor that still meets every constraint |

<a id="d-051"></a>

## D-051 — Backups leave Cloudflare: the nightly snapshot commits to the repo, not R2 ✅ CLOSES X8

**Date:** 2026-08-04
**Status:** Accepted

### The question X8 actually asked

X8 was written as *"a Cron Trigger, or a manual export that genuinely gets done"*. The
manual option answers itself — it is the one that happens until the week you forget, and
the week you forget is uncorrelated with the week you need it. So: a cron. The real
question turned out to be **where the snapshot lands**.

**R2 was the obvious answer and is the wrong one.** An R2 bucket lives in the *same
Cloudflare account* as the D1 database it backs up. That protects against a bad write or
a dropped table; it does nothing about losing the account. Cloudflare already covers the
first case for free — **Time Travel is always on**, restoring to any minute in the last
**7 days on the free plan** (30 on paid). Paying a second time for the risk that is
already covered, while leaving the uncovered one uncovered, is not a backup strategy.

What this protects is **~1,000 cards entered by hand over an evening** (`W2`). The
failure that actually hurts is the one where Cloudflare is not there to ask.

**Decided:** a nightly Cron Trigger in the existing Worker reads D1 and commits a JSON
snapshot to **this repository**, on a dedicated `backups` branch.

- **A different vendor** — the point of the exercise. GitHub already holds the code, so
  no new account, no new billing surface, and R2's subscription (which bills against a
  card on file, even at £0) is not taken on
- **Git is the versioning** — one file, overwritten, committed **only when the content
  differs**. Every historical state is in the branch's history, and an unchanged night
  leaves no trace. "What changed in my collection last week" is a diff
- **Not `main`** — build watch paths on the Worker are `*`, so committing to `main` would
  trigger a Workers Build and redeploy a byte-identical Worker every night, burning
  free-tier build minutes for nothing
- **The restore path is the one already in daily use** — the snapshot's `collection` field
  is the same `forge.collection/1` shape `PUT /collection` accepts ([D-050](#d-050)'s
  origin), so restoring is a load, not a migration written under pressure on the day the
  data is already gone

**A6 is upheld.** Nothing here is always-on and nothing is billed: a cron firing once a
day is inside the free plan's 5-trigger limit, and its 10 ms CPU allowance is ample —
waiting on D1 and on GitHub is I/O, which does not count against it.

**What it costs.** A GitHub token lives as a Worker secret. It is fine-grained, scoped to
this one repository with contents-write and nothing else, so its blast radius is the file
it writes. That is a real key to manage, and it is the price of the backup being somewhere
Cloudflare cannot lose.

**The trigger for revisiting:** if the snapshot ever outgrows what belongs in git — the
full card pool, images, anything binary. Card data is not backed up here and never should
be; it is Riot's, cached in `data/`, and regenerable ([D-034](#d-034)).

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| R2 bucket in the same account | Does not survive the failure worth insuring against, and adds a billing subscription to avoid a risk Time Travel already covers for 7 days |
| Time Travel alone, no backup | 7 days on the free plan, and it dies with the account. Fine as a first line, not as the only one |
| A manual export when the collection changes | X8's own alternative. Depends on remembering, and gets skipped exactly when things are busy |
| Commit to `main` | Redeploys the Worker nightly via watch paths, and buries the code history under backup commits |
| A dated file per night | Thousands of near-identical blobs, and no diff. Git already stores history better than a filename convention does |

<a id="d-052"></a>

## D-052 — Domain colours come from the rulebook, correcting the locked `D2` palette ⚠️ AMENDS D-046

**Date:** 2026-08-04
**Status:** Accepted — corrects a factual error in the [`D2` prototype](design/D2-workbench-prototype.html)

### What was wrong

`D2`'s thesis is that **the interface is greyscale so that colour always means domain**
([D-046](#d-046)). It is a good thesis and it is now implemented. But the prototype's six
domain colours were **four-sixths wrong**, and the first build inherited the same error:

| Domain | Rulebook | `D2` prototype | First build |
|---|---|---|---|
| Fury | red | ✅ red | ✅ red |
| **Calm** | **green** | ❌ blue | ❌ blue |
| **Mind** | **blue** | ❌ purple | ❌ purple |
| **Body** | **orange** | ❌ green | ❌ green |
| **Chaos** | **purple** | ❌ magenta | ❌ orange |
| Order | yellow | ✅ amber | ✅ yellow |

**Decided:** the domain colours are Riot's, taken from
[COMPENDIUM §1](reference/COMPENDIUM.md) — Fury red, Calm green, Mind blue, Body orange,
Chaos purple, Order yellow — and the interface follows the game rather than the prototype.

### Why this is worth a decision rather than a quiet fix

Because it is the **one thing `D2` says colour is for**. A design whose central claim is
"colour always means domain" and which then shows Calm as blue is not merely inconsistent —
it is misinformation dressed as decoration, and the more faithfully the rest of the thesis
is implemented the more confidently it misleads.

**The mapping is confirmed three times over.** Riot's own Primer states it; the COMPENDIUM's
domain-identity table restates it with each domain's strategic role; and all three community
deckbuilding videos supplied on 2026-08-04 describe the same associations independently —
green for counterspells and fortification, blue for card draw and utility, orange for big
stats and ramp, purple for bounce and trash tricks, yellow for tokens and sacrifice. Three
independent sources agreeing is as close to certain as this project gets.

**What is kept from `D2`.** Everything else, and it is most of the design: greyscale chrome,
legality carried by **form** rather than red and green (which would collide with Fury and
Body), have/need counts instead of percentages or grades, ownership as a first-class
headline, and the deck never leaving the screen. Those are implemented in `theme.css` (named `tokens.css` until
[D-065](#d-065) gave *token* a game meaning) and `styles.css`.

**What deliberately diverges.** The gallery is **art-forward** — full card images in release
order — where `D2` drew text-forward cards carrying stat lines and ownership pips. That
change came from using the thing: the transcribed stats duplicated what is already printed
on every card. The pips remain the right answer for ownership and arrive with `W2`, when
there is a collection to show.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep the `D2` palette for fidelity to the locked design | Locks in a factual error about the game, in the one place the design says colour carries meaning |
| Drop domain colour entirely, go fully greyscale | Throws away the most useful signal in deckbuilding — Domain Identity is the most constraining rule there is |
| Re-do the prototype to match | The prototype is a dated design artefact, not a live document. Correcting the built interface and recording why is cheaper and more honest than editing history |

<a id="d-053"></a>

## D-053 — The chrome gets one accent; colour still means domain on cards ⚠️ AMENDS D-046

**Date:** 2026-08-04
**Status:** Accepted — amends the greyscale half of [D-046](#d-046)

### What went wrong with strict greyscale

[D-046](#d-046)'s thesis — *the interface is greyscale, so colour always means domain* — is
sound reasoning and produced a **dull** interface. Used on real card art, an all-neutral
chrome does not read as restraint; it reads as unfinished. That is a design failure whatever
the argument behind it, and it was reported twice: *"the forge looks the exact same"*, then
*"the whole page is a bit dull."*

**Decided:** the interface keeps **one accent — brass** — used strictly for *chrome state*:
the active tab, a section header, a primary action, a satisfied count. Never on a card, never
adjacent to a domain dot, never to encode legality.

### Why this does not break the thesis

The thesis protects a specific thing: that when you see colour **on or beside a card**, it
tells you a domain. That still holds absolutely.

- Brass appears only where no card is being described — tab bars, panel headers, the masthead
- The six domain colours remain the rulebook's, untouched ([D-052](#d-052))
- **Legality is still carried by form** — a solid rule when satisfied, dashed when short, a
  strike when over. Never red-and-green, which would collide with Fury and Body

Brass is also the only hue not effectively claimed: the domains own red, green, blue, orange,
purple and yellow. It sits closest to Order-yellow, which is why it is restricted to chrome
where no domain reading is possible. It happens to suit a thing called Forge.

### What else changed with it

The neutrals moved from blue-grey to **warm charcoal**. The blue cast was most of why the
interface felt cold next to saturated, warm card art — the palette was fighting the content.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep strict greyscale | Twice reported as dull. A principle that produces an interface nobody wants to look at has failed at its job |
| Use a domain colour as the accent | Exactly what D-046 forbids, and for good reason: an amber button beside an Order card is ambiguous |
| Accent per Domain Identity — the chrome takes the Legend's colours | Tempting and wrong. The chrome would change meaning between decks, and a red interface next to Fury cards is the collision the thesis exists to prevent |


---

<a id="d-054"></a>

## D-054 — The collection is a filter over the gallery, not a second gallery

**Date:** 2026-08-04
**Status:** Accepted

**Asked for:** *"a clear button or filter or something, whatever you prefer, that takes to a
different page or view where the gallery is only made up of the owned, registered cards and
the respective number of each."*

**Decided:** an **Owned** toggle in the existing toolbar. One gallery, one set of filters, one
grid — ownership narrows it the same way a domain or a type does.

### Why not a separate page

A second page would have to re-implement search, the type tabs, the domain and cost filters,
the sort, the size control and the click-to-add behaviour — or do without them. Both outcomes
are bad, and the second is worse: *"which of my Fury units cost 2 or less"* is the actual
question a collection view exists to answer, and it needs the filters that already exist.

Forking the gallery would also fork every future change to it. The battlefield-orientation fix
one commit earlier would have needed doing twice.

### What the toggle carries with it

- **Counts are summed across printings.** Ownership is keyed on printing, the gallery is keyed
  on name ([DATA-MODEL §2](spec/DATA-MODEL.md)) — three copies is three copies whether or not
  they are three different arts. Getting this wrong would hide cards you own.
- **A `Copies held` sort**, offered *only* while the toggle is on. Everywhere else every card
  is zero, and a sort that orders the pool by a column of zeroes is a trap. Turning the toggle
  off reverts the sort rather than leaving it meaninglessly active.
- **Brass, not the tab underline.** The type tabs are mutually exclusive; Owned is orthogonal
  and composes with them. Giving it their underline would claim membership in a group it does
  not belong to, so it takes the one chrome accent instead ([D-053](#d-053)).
- **An honest empty state.** Until `W2` it says so and names the tool that fills it, rather
  than rendering an empty grid that looks like a bug ([D-022](#d-022) — omit rather than fake).

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| A separate `/collection` route | Forks the gallery and everything that will ever be added to it; loses search and filters or duplicates them |
| An "owned" chip inside the Filters panel | Correct in structure, wrong in prominence. This is the answer to *"show me my cards"* — a question asked constantly, not a refinement |
| Dim unowned cards instead of hiding them | Considered and worth revisiting for deckbuilding, where knowing a card exists is useful. It is a different feature from *browsing the collection*, which is what was asked for |


---

<a id="d-055"></a>

## D-055 — A match names a build, not a deck; and the record withholds what it has not earned

**Date:** 2026-08-04
**Status:** Accepted · `W5`

### The thing that makes a log worth keeping

A match record that references a **deck id** is nearly worthless. The deck mutates: forty
edits later, *"4-1 with Ahri"* does not say which Ahri, and the entire reason to keep a
record is to find out which build was the good one.

So a match names a **content hash of the card list**, and the mechanism that supplies it is
the same one that supplies deck history. One feature, three answers:

| Question | Answered by |
|---|---|
| What did this deck look like on the 4th? | The timeline |
| Which version went 4-1? | The match's hash, joined to it |
| Have I tried exactly this list before? | A hash lookup — free, and the interesting one |

A history row is written **only when the hash differs from the previous row**. Autosave fires
constantly and ten thousand identical rows is not history.

### A match outlives its deck

`matches.deck_id` carries **no foreign key**, and the deck's name is copied onto the row.
Delete a deck and the games you played with it are still games you played; a cascade would
destroy the most irreplaceable data in the system to preserve referential tidiness.

The denormalised name is not a [DATA-MODEL §2](spec/DATA-MODEL.md) violation. That rule
forbids copying **Riot's** card data, which goes stale on the next set. A deck name is the
user's own, and the name it had when it was played is the historically correct answer —
refreshing it would be the bug.

### ⚠️ The thresholds are the feature

Counting wins is trivial. **Refusing to turn four games into a percentage is the part worth
building**, because a win rate is the most inviting way there is to launder a small sample
into something that looks like knowledge ([D-016](#d-016), [D-022](#d-022)).

- Below **10 matches**, no rate is reported at all. The record is shown; the percentage is
  withheld *with its reason attached*, so the interface can say why rather than show a blank
- A per-matchup rate needs **5 games** against that Legend
- **Draws stay out of the denominator** rather than counting as half. Half a win is a
  convention, not a fact, and inventing one would put a made-up number in a record
- A pattern in losses needs **4 losses, 3 occurrences, and a third of them**. Below that it
  was a bad night

### Three tables, not one with a `kind` column

| | Written by | Retained | Backed up |
|---|---|---|---|
| Matches | You | Forever | ✅ irreplaceable |
| Deck history | The app, on change | Forever | ✅ makes matches mean anything |
| Diagnostics | The app, on failure | Newest 500 | ❌ expendable by design |

One table would have to take the strictest rule of each: permanent retention for crash noise,
or expiry for match records. Both are wrong.

Diagnostics are scoped to the **browser** specifically. Cloudflare already logs the Worker;
what it cannot see is the client, which is where every interface bug in this project has
lived — a CSS specificity trap, an invalid `sizes` attribute, a grid collapsing to two
pixels. The endpoint always returns 200, because its caller is an error handler and an error
handler that gets an error back is how a page ends up in a loop.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Reference the deck id and accept the drift | Makes the log unable to answer the one question it exists for |
| Store versions in a deduplicated content store | A join on every read to save a kilobyte. The hash already gives the dedupe *query*, which is the part with value |
| Show a win rate from any sample, with a caveat | Caveats are not read; numbers are. Withholding it is the only version of this that works |
| Count a draw as half a win | Standard in some formats, but it is a convention rather than a fact, and this project does not invent numbers |
| Log to Workers Logs only | Cannot see the browser, which is where the bugs are |


---

<a id="d-056"></a>

## D-056 — One key space for a printing, and a build that fails when it drifts

**Date:** 2026-08-04
**Status:** Accepted — unblocks `W2`

### The failure this prevents

The collection tool exported its counts keyed by **public code** — `"OGN-001/298"`. D1's
`collection.card_id`, the app's Owned view and the [`L26`](spec/LEGALITY.md) ownership check
all key on the **printing id** — `"ogn-001-298"`.

Nothing anywhere reported a problem. Proven against the real API before it was fixed:

```
PUT /collection  →  {"ok": true, "printings": 2}
cards the Owned view would show:        0
copies the legality check would count:  0
```

`W2` is *"you sit down with your boxes and enter the actual collection"* — an evening of
typing that everything downstream depends on. The outcome would have been a success message
and an empty gallery, with no error to explain it and no obvious way to tell whether the
typing or the tool was at fault.

### Decided

**The printing id is the only key.** The tool stores it, exports it, and its index carries it
straight from `data/cards.json` — never derived from the public code, because a derivation
would match on almost every card and diverge silently on the ones it did not.

- **Both key spaces are accepted on import**, and browser storage converts on load. The one
  file here holds work nobody can reproduce, so it migrates rather than warns.
- **`build-index.py` fails** when any id is absent from the app's index. Verified by
  corrupting one id and watching it exit 1.

### Why the check, and not just the fix

This is the second time in one day that a comment failed to prevent the thing it warned
about — `wrangler.toml` documented the `run_worker_first` trap and the log routes fell into
it anyway. Both are now build-time failures. **A comment describes a rule; only a failing
build enforces one.**

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Translate codes → ids in the Worker | The API deliberately holds no card data ([D-034](#d-034)); giving it a card index to fix a key-space bug is a large concession to a small problem |
| A one-off conversion script | Converts today's data and leaves the trap armed for the next export |
| Key everything on public code instead | The code is Riot's presentation format and changes shape across 17 known variants; the id is stable and is already what the database stores |


---

<a id="d-057"></a>

## D-057 — EE reaches the app without becoming a chat interface

**Date:** 2026-08-04
**Status:** Accepted — does **not** complete [`S6`](PLAN.md)

### The mismatch worth naming

*"Get EE into the app"* and `S6` are not the same job. `S6` is the **tool surface, the export
contract and the briefing** that let Claude Code answer questions — and it gates on `S2`,
which needs ~153 hand-annotated card effects and 49 Legend abilities that do not exist yet.

But EE's analytical core was already built and reachable only from the CLI: archetype
reading, the doctrine notes, and complaint → diagnosis → candidates. Making *that* visible
needs no `S2` at all.

**Decided:** put the built surface on screen now; leave `S6`'s three deliverables untouched.

### The two rules that shape it

- **Pull, never push** ([D-042](#d-042)), where **the pull is opening the Analysis tab**.
  Nothing renders in the Deck view, where you are building — a builder mid-thought does not
  want to be corrected, and a tool that volunteers is one you learn to ignore. The counts and
  violations that stay on screen in every view are *state*, which is not advice.

  ⚠️ There was briefly a *"look this deck over"* button on top of the tab. It satisfied the
  same rule and made the feature unusable — two deliberate acts to get one opinion, reported
  as **"I can't tell how to use this."** One deliberate act is the pull; a second is
  ceremony.
- **The app authors nothing** ([D-043](#d-043)). Every sentence rendered comes out of a tool
  call carrying its own `source` and `confidence`; the component adds none of its own. This
  is the structural half of the swappable-mouth decision: **a mouth that cannot author a
  claim cannot invent one**, and a statement that looks wrong is wrong in the engine, where
  a test can reach it.

### The workshop had to be split first

EE landed at the bottom of a single scrolling column — bays, curve, EE, log, history — and
measured **2915px down a 3378px scroll**. Every panel added all week had gone to the bottom,
so *newest* had come to mean *furthest from the eye*.

The right panel now has three views — **Deck**, **Analysis**, **Log** — each one click away,
with the counts and violations pinned above them in all three because that is the state you
steer by. EE moved from 2915px to 546px: on screen without scrolling.

The general lesson, which has now cost time twice in a week: **appending is not a layout
decision, and it silently becomes one.** The same habit produced six competing `.slots`
rules in the CSS.

### What that buys, concretely

A plain-English complaint becomes a symptom, a symptom becomes a diagnosis of *this* deck —
with its evidence, its lever, **and its cost, always stated** — and only then a handful of
candidates, filtered to the deck's Domain Identity and the copy limit so nothing suggested is
illegal. Verified end to end: *"couldn't hold battlefields"* → `cannot-hold` → *"26 units in
41 Main Deck cards"* → pump-and-ready candidates at 3–5 Energy.

Confidence tiers are rendered as a control you can interrogate rather than a decoration,
because [the schools genuinely disagree](reference/DECKBUILDING.md) and flattening them into
one confident voice would misrepresent the state of the art.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Wait for `S2`, then do `S6` properly | Leaves a built, working analytical core reachable only from a terminal for the length of a large milestone |
| Build a chat box in the app | Exactly what [D-043](#d-043) declined. The engine would have to parse English, and the app would start authoring claims it cannot ground |
| Show the advice permanently in the workshop | Violates [D-042](#d-042), and the request that produced that decision was explicit: *"only give feedback when requested"* |


---

<a id="d-058"></a>

## D-058 — Importing happens in the app, because `curl` cannot reach production

**Date:** 2026-08-04
**Status:** Accepted — unblocks `W2`

### What was wrong

Two documents told you to upload your collection like this:

```bash
curl -X PUT https://forge.<...>.workers.dev/collection --data @collection.json
```

It does not work. Cloudflare Access ([D-048](#d-048)) sits in front of the origin, so an
unauthenticated request is answered by the login page:

```
HTTP/2 302
location: https://<team>.cloudflareaccess.com/cdn-cgi/access/login/...
service_token_status: false
```

The request never reaches the Worker. `curl` exits 0, prints an HTML redirect, and **writes
nothing** — after an evening of typing, with no error worth reading.

### Decided

**Import from inside Forge.** The *Owned* view has an *Import a collection file* button. It
is same-origin, so the Access cookie rides along automatically and the problem disappears.

- **Both key spaces are accepted.** An export predating [D-056](#d-056) is keyed by public
  collector code and is translated on the way in, so an old file on a phone still loads.
- **The outcome is reported** — copies saved, entries re-keyed, entries skipped — and it is
  held by the *caller*, because a successful import unmounts the empty state that hosts the
  button and would otherwise take the message with it.
- **An Access redirect is detected explicitly.** It arrives as HTML with a 200-shaped
  response, so the importer checks the content type: *"the server answered with a page rather
  than data — you may need to sign in again"* beats a silent no-op.

### Why not a service token

It would work, and it would mean a long-lived credential in a shell history or a file on
disk, created solely to authenticate a person who is already signed in three inches away in a
browser tab. The credential is the cost; the browser is free.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Cloudflare Access service token | A permanent credential on disk to work around a session that already exists |
| Bypass Access on `/collection` | Opens the one write endpoint that owns the irreplaceable data |
| `cloudflared access curl` | Works, but it is a per-machine tool install to paper over a missing button |


---

<a id="d-059"></a>

## D-059 — Entering cards belongs in Forge, not in a tool you have to remember to start

**Date:** 2026-08-04
**Status:** Accepted — amends [D-013](#d-013)'s *delivery*, not its entry model

### The objection that settled it

Adding a card meant: `cd tools/collection`, start a Python server, open a second URL, type,
export a file, come back to Forge, import it. That works. It is also six steps to record one
card, and *"how will I remember to do all those things every time"* is the correct response
to it. **A workflow you have to rehearse is one you stop using**, and a collection tool you
stop using leaves the collection wrong — which is worse than not having one, because the
shortfall warnings then lie in the reassuring direction.

**Decided:** an **+ Add cards** mode in Forge's toolbar. Adding a card is now the same act as
opening Forge, on any device, behind the same Access login, saving straight to D1.

### What was kept, and what it cost

The entry *model* is unchanged and was copied deliberately rather than redesigned — it was
the good part of the disposable tool ([D-013](#d-013)):

- **The field keeps focus**, so it is number → Enter → number → Enter without the mouse
- **Matches appear before you commit**, with the card image, so you catch the wrong card
  while it is still a keystroke rather than a correction
- `12 x3` for a playset · `12-` to take one back · `66a` for alternate art · `ogn 12` to jump
  set without leaving the row

**`PATCH /collection` was added for it.** `PUT` replaces the whole collection, which is wrong
for typing: sending nine hundred rows per keystroke is merely wasteful, but a stale tab
would silently undo everything a phone had just added — last write wins over data it never
saw. A delta only touches the printing you named.

⚠️ The `quantity > 0` CHECK made the obvious upsert wrong. `INSERT ... VALUES (?, MAX(?, 0))
ON CONFLICT DO UPDATE` fails the constraint on the *proposed* row before the conflict clause
can rescue it, so subtracting from a card you do not own crashed the endpoint. Removal and
adjustment are separate statements now, removal first.

### The standalone tool stays

For exactly one reason: **it works with no signal.** Forge cannot ([D-049](#d-049) — editing
requires connectivity), and a card shop with bad reception is a real place. It is no longer
the way in, and both READMEs now say so.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep the tool as the only entry path | The objection above. Six steps per card is a tool you abandon |
| Retire the tool entirely | Loses offline entry, which is the one thing the app genuinely cannot do |
| Rebuild entry from scratch in the app | The tool's ergonomics were already right; redesigning them would have been change for its own sake |


---

<a id="d-060"></a>

## D-060 — More than one deck, pulled forward because generation needs somewhere to land

**Date:** 2026-08-04
**Status:** Accepted — partly delivers [`W3`](PLAN.md), which stays open

### What was wrong

Forge held exactly one deck, at the hardcoded id `main`. **Starting a new deck and destroying
the old one were the same act.** That was defensible while `F2` was proving the loop; it stops
being defensible the moment anything proposes a deck.

It surfaced while describing how `S5` would work end to end: a generated deck you can only
accept by overwriting the deck you already liked is not a proposal. So `W3`'s core came first.

### Decided

- `GET /decks` lists them, with counts computed in SQL rather than by loading every deck —
  a list that has to read everything to say how big each thing is stops being usable exactly
  when a list becomes worth having
- `DELETE /decks/:id` cascades slots, bench and history. ⚠️ **Matches deliberately do not
  cascade** — a game you played is not the deck's to take with it ([LOG §2](spec/LOG.md))
- New · duplicate · rename · switch, with the open deck remembered **in the browser**: which
  deck you had open is a property of this device, and syncing it would make opening Forge on
  a phone yank the desktop to a different deck
- Duplicating copies contents, **not history or matches**. Inheriting another deck's record
  would be a lie about which list actually played those games

### ⚠️ Two bugs this exposed

Both were invisible while only one always-populated deck existed, and both appeared within
minutes of being able to make an empty one:

1. **`mainDeckCount` added 1 for the Chosen Champion unconditionally**, so a completely empty
   deck reported `1/40` and `L3` said *"found 1"* for zero cards.
2. Switching decks left the store's `loaded` flag true from the *previous* deck, so an edit
   made while the new deck was still arriving would have passed the "never save over a deck
   we failed to read" guard and written the old contents over it.

The second is the more instructive: [D-049](#d-049)'s guard was correct and complete for one
deck, and silently wrong for two. **A guard is only as good as the assumption it was written
under**, and adding a dimension is exactly when that assumption expires.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Wait and do all of `W3` at once | `S5` is blocked on the deck-slot half of it, and the rest of `W3` is not |
| Keep the active deck id on the server | Opening Forge on a phone would drag the desktop to a different deck mid-edit |
| Cascade matches when a deck is deleted | Destroys the one record that cannot be reconstructed, to tidy a foreign key |

---

<a id="d-061"></a>

## D-061 — Runes are not collected: Forge believes you always have them

**Date:** 2026-08-10
**Status:** Accepted — amends [DATA-MODEL §3](spec/DATA-MODEL.md) and the ownership half of
[LEGALITY](spec/LEGALITY.md)

### What was wrong

Discovered by building a complete deck end to end for the first time, against the real
collection. The deck came out **40/40, 12/12, 3/3, all 33 checks passing** — and carried a
warning it could never shed:

> `L26` 12 copies short across 2 names — Chaos Rune, Fury Rune.

**Nought of the 18 rune printings were ever entered**, and they never will be in a way that
helps: a Legend auto-fills twelve runes, there are six rune names in the entire game, and
they are a fixture of the format rather than something you hunt for. Every deck ever built
reported twelve copies short of cards nobody tracks.

[D-017](#d-017)'s commitment model then turned that cosmetic warning into a wall. Promotion
requires zero conflicts; a card you own none of is a conflict; so **`Mark as built` was
refused on every deck, permanently, with no action that could clear it.** The remedy a
conflict offers is *dismantle the holding deck* — and there is no holding deck, because
there is no card.

### Decided

**Runes are exempt from ownership entirely.** Everything else about them is unchanged — a
Legend still fills twelve in a 6-6 split, `L4` still demands exactly twelve, and `L8`–`L12`
still police what may go in the Rune Deck. What changes is that Forge stops asking whether
you have them.

- `L26`/`L27` skip rune entries, so no deck is ever short of a rune
- Commitment skips them on **both** sides: a sleeved rune is not a claim on the collection,
  and a deck never contends for one. Without the supply half, twelve runes per built deck
  would pile up against a collection holding none and fire the **over-commitment** alarm —
  the loudest signal in the system, about the one thing that cannot be wrong
- The copy cap already exempted them; the Owned filter now does too, so the Rune tab is not
  empty the moment you filter to what you own
- The card detail says **"always on hand"** rather than "none yet", which was a false
  statement about a card Forge had decided not to track

### ⚠️ Keyed on the zone, not the card type

`isCollected` tests `zone !== "RUNE"` rather than `types.includes("rune")`. The zone is
structural and always known; `types` depends on what the caller's `CardIndex` carries, so a
name-only index would silently start counting runes again — and it would be the CLI, the
consumer least likely to be watched. `L8`–`L12` already guarantee only runes reach the Rune
Deck, which is what makes the zone a safe proxy.

### What this costs

Forge can no longer tell you that you are physically out of runes. That is the honest trade,
and it is cheap: twelve of six names, supplied with the product, versus a warning on every
deck forever and a promotion gate that never opens.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Enter the 18 rune printings and change nothing | Fixes today's collection, not the model. Every new set's runes would re-open it, and the count would be fiction anyway — nobody counts their runes |
| Block promotion only on *contention*, warn on shortage | Right instinct, wrong layer — it would have hidden the rune problem behind a softer gate while leaving "12 copies short" on every deck forever |
| Treat runes as owned by writing rows into the collection | A lie in the one table that is supposed to describe physical reality, and it would corrupt the backup and the spot-check |

---

<a id="d-062"></a>

## D-062 — `S6` is re-gated off `S2`: the deckbuilding questions do not need a rules core

**Date:** 2026-08-10
**Status:** Accepted — re-gates [`S6`](PLAN.md), amends the dependency in
[`ROADMAP.md`](ROADMAP.md)

### What prompted it

A conversation about what the finished EE should be. The answer, in Alexander's words: *"a
conversation with a Riftbound professional"* — and the examples given were **all four
deckbuilding questions**:

> *"I want a deck that plays around this mechanic"* · *"I like this Legend, what sort of cards
> go into it"* · *"I have only 1 copy of this really cool card but I want a deck that plays
> around it"* · *"I hate playing into this Legend, what deck works against it"*

**Not one of them is a combat question.** That distinction is worth a year.

### The observation

`S6` was gated on `S2` (analysis) which is gated on `S1a` (the rules core) — the largest
single component in the project. That chain is correct for `Q-LINE` and for any answer that
**counts** refutations, because you cannot know what a card does to another card without
adjudicating the rules.

It is the wrong chain for deckbuilding. A professional asked *"what beats Diana"* answers
from identity, signature cards, known patterns and doctrine — **not** by enumerating ten
thousand cards, which [EVALUATION §2](spec/EVALUATION.md) forbids saying out loud anyway.
Everything that answer needs already exists: 39,000 words of reference read from primary
sources, all 49 Legends, all 814 main-deck cards classified, the synergy graph in
`produces`/`consumes`, legality, statistics, ownership, and the pattern vocabulary.

**What was missing was never knowledge. It was the seam.**

### Decided

- **`S6` is re-gated off `S2` and built now.** Its three deliverables are unchanged — tool
  surface, export contract, briefing.
- **Four question tools**: `legend`, `around`, `counter`, `mechanic`.
- **`npm run state`** pulls live D1 into `state/forge-state.json`, so no answer about
  ownership is ever built on a stale file or an invented number. Read-only by design: the
  collection is edited in Forge, where the copy cap lives.
- **[`EE-BRIEFING.md`](EE-BRIEFING.md)** binds the mouth — the answer budget, the tiering,
  the never-list, and the rule that matters most: **never author a number**.

### ⚠️ What this does *not* do

`S2` and `S1a` are not cancelled, and the answers that need them stay refused rather than
guessed:

| Question | Without the rules core |
|---|---|
| *"Should I attack here?"* | **Refused.** Already the plan for `S1b` |
| *"What beats this Legend?"* | Answered as **doctrine**, and labelled — a professional's read of a matchup they have not playtested |
| *"66 cards refute this"* | Not computable. Also not sayable (§2) |

### ⚠️ The risk this creates, and the control on it

Re-gating puts a language model in front of a rich card pool with no simulator behind it —
which is exactly the shape of a tool that sounds authoritative and is not. The control is
structural rather than aspirational: **grounding lines are assembled from tool output**
([D-045](#d-045)), the tools return data and never prose, and the briefing's first rule is
that every number in an answer comes from a call actually made.

`legendCounsel` is the clearest case. It deliberately has **no "what this Legend rewards"
field**, because Legends carry no `consumes` annotations — a computed answer there would be
a guess in the answer's most important sentence. The tool returns the Legend's printed text
and the mouth reads [`LEGEND-GUIDE.md`](reference/LEGEND-GUIDE.md).

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Build `S1a` first, as planned | A season of evenings before a single question is answerable, to serve questions that were not asked |
| Answer deckbuilding questions from the model's own knowledge | It is exactly the failure this project exists to avoid — plausible, ungrounded, and wrong about what is in the boxes |
| Wait for `S2` and give coarse answers meanwhile | The coarse answer *is* the professional answer for these four questions; `S2` makes a different set possible |

---

<a id="d-063"></a>

## D-063 — A card's rules text comes from its **fullest** printing, not its base printing

**Date:** 2026-08-14
**Status:** Accepted — changes `scripts/build-card-index.mjs`, amends the merge rule set by
[D-047](#d-047)'s one-index principle

### What prompted it

Alexander, on finding Vendetta's `SP` promos: *"Alternate arts contain short form tags,
without the explanations. For cards that have multiple arts like this, keep them separate,
but use the longest and most detailed card description for ease of indexing and
remembering."*

He is describing a real and consistent property of the data. Reprints and promos routinely
drop the parenthesised reminder that explains a keyword. `VEN-SP1` prints Kai'Sa as
*"[Accelerate] When I conquer, draw 1."*; `OGN-039` spells out what Accelerate costs. Same
card, fewer words.

### The observation

**82 of 935 names have printings whose text disagrees.** 64 of those differ *only* by the
parenthetical — precisely the short-form/long-form split described. The remaining 18 differ
in the rules sentence itself, and in every one of them the longer text is the more
informative, with no meaning lost.

The index took `text` from the base printing, which is the earliest set in release order.
That got the fullest wording **78 times out of 82 by luck** — the original printings usually
were the fullest. This makes it a rule instead, which is what matters when the next set
lands and the coincidence stops holding.

### What it changes

Four cards of 935, two of them outright corrections the old choice was missing:

| Card | Was | Now |
|---|---|---|
| **Sona, Harmonious** | *"ready 4 friendly runes"* | *"ready **up to** 4 friendly runes"* |
| **Void Burrower** | *"You may play one. Then recycle the rest."* | *"You may **banish** one, then play it."* |
| **Emperor of the Sands** | no reminder | gains the `[Equip]` reminder explaining Weaponmaster |
| **Gold** (token) | `[Reaction]` mid-sentence | newer templating, `[Reaction]` leads |

**Printings stay separate.** This decides only which wording the *card* carries; every art
remains individually selectable per deck slot, which is what makes the tray draw the
printing you picked.

### ⚠️ Why this is safe for the engine, checked rather than assumed

`text` is not decoration — it feeds `[Unique]`, which overrides L13's three-copy limit, and
`leadingKeywords`, which decides what a card *has*.

- **No name's printings disagree on `[Unique]` at all** — 0 of 935. The copy limits cannot move.
- **`leadingKeywords` reads only the opening run and steps over reminders** ([`text.ts`](../packages/engine/src/text.ts)), so the extra words cannot invent a keyword. Bloodharbor Ripper's longest printing quotes `[Reaction]` inside a parenthetical and is still correctly read as having none.
- Exactly **one** card's keywords change: the **Gold** token gains `[Reaction]`, because the newer templating leads with it. That is a correction, and Gold is a token, which can never be registered or decked.

### ⚠️ `[NO TEXT]` is a placeholder, not a rules text

Six printings — the Vendetta promo Runes `VEN-R01`–`R06` — carry the literal string
`[NO TEXT]`. It is nine characters long, so "the fullest wording" selects it over the blank
the card actually has, and every basic Rune would print a placeholder. It is normalised to
empty before any length is compared, and a test asserts no card in the shipped index carries
it.

**Alternatives considered:**

| Option | Rejected because |
|---|---|
| Keep taking text from the base printing | Silently ships superseded wording, and only worked by coincidence |
| Take text from the *newest* printing | The newest is often the promo, which is the one with the explanations stripped |
| Split short-form and long-form into separate cards | They are the same card. Splitting them doubles the copy-limit surface, which [DATA-MODEL §2](spec/DATA-MODEL.md) calls the worst failure available |
| Concatenate every printing's wording | Produces text no card has ever borne, in a project whose rule is that the rulebook and the print are the only authorities |

---

<a id="d-064"></a>

## D-064 — A deck is built to a **plan**, and measured against that plan

**Date:** 2026-08-14
**Status:** Accepted — rewrites [`GENERATOR.md`](spec/GENERATOR.md), resolves `G4`, adds a
`plan` column to `decks`, and amends [`EE-BRIEFING.md`](EE-BRIEFING.md) §3

### What prompted it

Alexander opened a deck EE had built for Grand Duelist:

> *"I see you've put heavy emphasis on utilising the Fiora legend ability which is great.
> However it feels like that is all the deck is trying to do… overall the deck had no proper
> design or structure from my perspective."*

Running the project's own `review` on that list confirmed it in numbers: curve
`[–, 4, 19, 9, 7, 0, 1]` — **nineteen of forty cards at cost 2**, nothing at 5, one card at 6.
Legal, registerable, and good at exactly one thing.

> ⚠️ **Amended the same day, by measurement.** Once `advice/packages.ts` existed the deck was
> read properly: `engine 15 · interaction 17 · closers 1 · coreUnits 6 · unassigned 1`.
> **Interaction is the largest package**, so *"all it does is the Legend ability"* was the
> right instinct with the wrong mechanism. The real failure is **one closer and six bodies** —
> a deck that can trigger its Legend and win fights, and has almost nothing to win *with*.
> The decision below is unchanged; the diagnosis underneath it is sharper, and the difference
> only appeared when the counts stopped being reasoned and started being counted.

### The observation, in three parts

**1. The quality tooling existed and was never in the loop.** `review()` and `readArchetype()`
measure removal, draw, tricks, unit share and opening odds. Both were wired into the web
Advisor and the `review` CLI command, and into **neither end of generation**. The loop is
`brief → propose → validate → push`, and `validateProposal` only answers *"is this
registerable?"*.

**2. `review()` would barely have caught it anyway.** Against that deck it produced one note —
*"23 early plays is more than the opening needs"*. It has **no curve-shape check**, so a 48%
single-bucket spike passes silently.

**3. The monomania was written down.** `brief.ts` carried the comment *"The Legend's ability,
called out because everything else is chosen to serve it"* — the first thing the model reads.

⚠️ **And the spec already said otherwise.** `GENERATOR.md` §4 has named **skeleton fill** —
*"start from a curve/role template implied by the intent"* — as the primary strategy since
2026-08-02, and §5 forbade one-shot single-answer generation. What shipped was one-shot,
single-candidate, with **no intent field on `Seed` at all**. This is spec drift, not a missing
idea: the Legend ability rushed into a plan-shaped hole.

### What was decided

| # | Decision | Rejected | Why |
|---|---|---|---|
| 1 | **Measure and disclose, always** — the loop forces the measurement and shows it; a shallow deck still ships | A hard quality gate that refuses | Thresholds like *"needs 6 removal"* are contested doctrine, not facts. Refusing on them puts opinion in the engine and edges toward the grading [D-016](#d-016) forbids |
| 2 | **Judge against the deck's own declared plan** | Universal thresholds | `review()`'s own note already admits draw matters far more to control than to aggro. One standard is wrong at every deliberate skew |
| 3 | **No intent → offer 2–3 distinct skeletons, the builder picks** | Infer and declare; ask one question; refuse | Keeps the objective with the user ([D-041](#d-041)) and matches §4.4's *"candidates, never one answer"* |
| 4 | **The plan is stored on the deck in D1** | A sidecar file; re-derive each time | Re-deriving judges a deck by what it **is** rather than what it was **meant to be** — which is decision 2 undone. A sidecar never reaches the Workbench or the backup |
| 5 | **Intent is `pace × objective`, not an archetype label** | A single aggro/control/combo choice | Riftbound supports aggressive *and* defensive versions of both conquer and hold, so the usual taxonomy does not map. [`LEGEND-GUIDE`](reference/LEGEND-GUIDE.md) §5 independently calls Hold-vs-Conquer the intent that matters most |

### The evidence base, and what it cost to get

The `community` tier of [`DECKBUILDING.md`](reference/DECKBUILDING.md) had cited nobody. The
source material turned out to be **~30,000 words of video transcript** pasted into a working
session on 2026-08-04 and never stored — recovered and committed to
[`reference/transcripts/`](reference/transcripts/) the same day as this decision.

**All three method sources converge on packages independently**, which is stronger evidence
than any one of them. They also **disagree sharply**, and the disagreement shaped this design
as much as the agreement did:

- `01` says start from a topping list and mix. `03` answers *"you are not those players"*.
  ⚠️ **[D-035](#d-035) closes that route to Forge entirely** — there is no meta data and there
  will not be. Recorded in §11 rather than quietly omitted.
- `03` runs **39 unique cards**, rejecting `01`'s 3-of/2-of/1-of ratios outright.
- `01` says weigh the Legend ability heavily *"unless it sucks"*; `04` makes it one of four
  layers. **Both are right** — this decision rebalances the ability into `packages.engine`
  rather than demoting it.

### ⭐ What the design adds that no source could

The flagship comes from combining `03`'s insight — *"the package separation isn't just for us
to understand our deck, but to understand our **hand**"* — with machinery Forge already has:
`simulateOpenings` runs 10,000 hands. So EE can report ***"in 23% of openings, three of your
four cards can't act before turn three"*** — Tier 2, computed, assumption attached. None of the
four videos can produce that number, and `DECKBUILDING.md` §4 had recorded the idea since
Discovery with nothing using it.

Also computable and better than the sources: the colour cheat sheet in `01` is one person's
recall of one format, where Forge holds all 935 cards and can compute the real distribution;
`01`'s *"vanilla two-drops don't count"* is detectable from absent tags and text; and rune
feasibility — whether a six-drop is castable on curve with this split — is a calculation no
other Riftbound tool can perform.

### ⚠️ The weak link, accepted knowingly

**Everything rests on assigning 40 cards to packages correctly.** Mis-bucket them and every
delta is confidently wrong. Assignment therefore follows the rule `feedsMeasured` already
enforces: **`counted` where the tags support it, `unmodelled` where they do not, never
silently zero** — learned when `mechanic --name mighty` answered `feeds: 0` against a
collection holding 60 cards that raise Might.

### Battlefields and the sideboard

Both were specified in this pass because both are part of the plan.

**Battlefields** resolve `G4` on a **class, not a score** — the floor is *"cannot hurt me"*
rather than *"might help me"*, which maps exactly onto
[`BATTLEFIELD-GUIDE`](reference/BATTLEFIELD-GUIDE.md) §1's one-sided class. A symmetric
battlefield requires a stated reason this deck exploits it harder, and **silence becomes a
refusal rather than a default**.

**The sideboard** is defined against `plan.winCondition` — insurance where a solid counter to
the win condition exists, plus named flexibility. ⚠️ Grounded in what the **identity can do**,
never in a meta read.


---

<a id="d-065"></a>

## D-065 — What to bring in the box: tokens read off **printed text**, never off a token registry

**Date:** 2026-08-16
**Status:** Accepted — adds `advice/tokens.ts`, a **Tokens** panel to the Analysis tab, and
renames `tokens.css` to [`theme.css`](../apps/web/src/theme.css)

### What prompted it

> *"Whenever I create a deck, based off the cards in the deck I want you to give me a list of
> tokens you recommend me to bring with that specific deck as well… like zed needs shadow
> clones, ambessa empowers."*

Forge had answered every question about the **55 cards you register** and none about the pile
you have to bring beside them. A decklist can be complete, legal and unplayable at the same
time, and the Workbench's own correctness made this worse rather than better: tokens are
created during play and are never registered ([DATA-MODEL §1](spec/DATA-MODEL.md)), so
`cards.ts` deliberately **excludes them from the collection**. Everything downstream inherited
that exclusion and nothing ever put it back.

### The finding that decided the implementation

The obvious build is to match deck cards against the names of the token *cards* in
`data/cards.json`. It is also wrong, and measurably:

| | |
|---|---|
| Token cards catalogued in `data/cards.json` | **14 printings, 8 names** |
| Tokens the pool's printed text actually creates | **11** |
| Names with **no token card at all** | **Mech · Sand Soldier · Shadow Clone · Tentacle** |

The four uncatalogued tokens are the newer sets'. A registry-driven version therefore answers
*"no tokens"* for **Zed** and for **Azir** — the two decks in the game most obviously defined
by their tokens, and one of them the example in the request that prompted this.

The creating card already prints everything needed: *"play a 0 :rb_might: **Shadow Clone unit
token**"* carries the name, the type and the Might. So tokens are read the way EE learned to
read everything else ([EE-COMPLETION](EE-COMPLETION.md)): **off the text, not off a tag or a
table**. The registry is demoted to what it is still good for — a picture.

### Mentioning a token is not making one

The naïve search is worse than useless in the other direction too. `Bird` appears on **17**
cards and only **7** of them make one; the rest are tribal (*"Bird, Cat, Dog, and Poro"*) or
lordly (*"Bird units here have +1 Might"*). The separator is grammatical and exact: a real
creation always prints the token's **type** between its name and the word `token` — `Bird unit
token`, `Gold gear token`, `Baron Pit battlefield token` — and a reference never does. That one
requirement takes Bird from 17 to 7 with **no false positives across all 1,180 printings**, and
`tokens.test.ts` asserts the resulting set of eleven **exactly**, so a twelfth token in a future
set fails the build rather than going quietly missing.

### Two categories, because the request spanned both

*"Zed needs shadow clones, Ambessa empowers"* names two different objects, and folding them
together would have been a mistake:

| | |
|---|---|
| **Tokens** | Cards you play. Have a printed card, usually. Shadow Clone, Recruit, Gold… |
| **Markers** | A state you must be able to *show*: `Buff`, `XP Tracker`, and `[Empowered]` |

`[Empowered]` has **no printed token anywhere in the pool**, and the panel says so. Listing it
beside Shadow Clone as though you could go and find one would send you searching a set list for
a card that was never made.

### What was decided

1. **`deckTokens()` reads printed text**, including the **Legend's** — which `deckEntries()`
   does not return, and Azir's entire plan is printed on the Legend.
2. **Facts and judgement stay separated** (D-045). Which tokens the deck creates is not
   arguable. *How many to bring* is a call — *enough for the largest single burst, and one for
   every copy that can make one, capped at 12* — and it is labelled as one, with the cards it
   came from listed underneath so it can be overruled at a glance.
3. **A repeatable source has no ceiling**, so its count renders as `×6+` rather than as a
   number pretending to be exact. `Baron Pit` reads its own text — *"if it's not there
   already"* — and pins itself to one.
4. **The panel is yellow**, and `--token` is its own variable. Order is a domain, Tier 2's
   amber is a confidence, and brass is the chrome accent; this is the fourth yellow in a
   six-colour language. What keeps it from becoming a fourth *meaning* is D-053's containment
   rule rather than the hue: it appears only on that panel's rule, badge and counts, **never
   on a card and never beside a domain dot**. A token is colourless on the table, so the one
   place the confusion would cost a game is the one place this colour never goes.

### The rename

`apps/web/src/tokens.css` became `theme.css`. *Token* now means a game object in this codebase,
and a file of design tokens sitting next to `Tokens.tsx` is a collision that would have cost
someone a wrong file open every few months for the life of the project.

### What was rejected

| Alternative | Why not |
|---|---|
| Match against the token cards in `data/cards.json` | Answers *"no tokens"* for Zed and Azir — 4 of 11 tokens were never printed |
| Tag creators in `classification.json` | A second hand-maintained list that goes stale silently; the text is already authoritative |
| Sum every copy's output for the count | A Gold deck asks for thirty. Past a dozen you are administering a board, not playing one |
| Put it in the Deck view beside the tray | Advice is pull, not push (D-042). Packing is the last thing you do, not something shouted mid-build |
| Add tokens to the collection so they can be "owned" | Reopens exactly what DATA-MODEL §1 and D-061 closed — a token is not a card you find |

---

<a id="d-066"></a>

## D-066 — A match records the **shape of the table**, and formats are never pooled

**Date:** 2026-08-16
**Status:** Accepted — adds `format` to `matches` (migration `002`), a format dimension to
[`read()`](../packages/engine/src/log/match.ts), and format chips to the log form

### What prompted it

> *"I only played 2 games today and they were both 1v1v1, so I can't really comment there."*

The evidence gate (`G7`) had been sitting on *"play a game and log a note"* for days. The first
real games arrived and **the log could not describe them.** That is the whole finding: the one
feature whose entire purpose is to record what actually happened had modelled a game shape
nobody had checked.

⚠️ **Nothing in the repository mentioned multiplayer at all** — not the schema, not the engine,
not one line of the specs or the reference docs. The assumption was never made; it was never
noticed. Meanwhile the project's own quotation of the Comprehensive Rules
([COMPENDIUM](reference/COMPENDIUM.md), CR 464.2.e.1) reads *"followed by all **non-Defender
players** in Turn Order"* — plural, which only means anything with three or more people at the
table. The rules were multiplayer-aware; Forge's doctrine was not.

### Why this is a correctness decision and not a field

The tempting move is to log the games anyway and sort it out later. It is wrong twice over,
and the second one is not obvious:

1. **`opponent_legend` would assert a matchup that never happened.** You did not lose *to* one
   of two people.
2. **A pooled win rate is the `n=4` error wearing a disguise.** Par heads-up is 50%; in a
   three-way pod it is **33%**. Averaging the two produces a figure describing no game anyone
   played — and it arrives with a *larger* sample, so it looks **more** trustworthy than the
   honest numbers it replaced. Every threshold in `log/match.ts` exists to stop a small sample
   from looking like knowledge ([D-016](#d-016), [D-022](#d-022)); merging formats smuggles the
   same error back in through `n`.

It had to land **before** the first row, not after. The log has no edit path — only an unwired
`DELETE` — so a row written wrong is written wrong permanently, and matches are the one thing
in the system that cannot be reconstructed from anything else.

### What was decided

1. **`format` is a shape, not a player count** — `1v1` · `1v1v1` · `2v2`. Counting heads would
   make `2v2` and a four-player free-for-all the same value, which they are not.
2. **Null means `1v1`**, resolved once in the engine (`DEFAULT_FORMAT`). Every row predating the
   column was heads-up, because heads-up was all the log could describe.
3. **`read()` covers one format at a time.** Matchups exist only in `1v1`; symptoms aggregate
   within a format; `baseline` travels with the reading so 33% is never mistaken for a verdict.
4. **Games elsewhere are always named.** `elsewhere` and the empty-state note exist so a reading
   can never answer *"Nothing logged yet"* while games sit in another bucket — the single most
   misleading sentence this design could produce, and it has its own test.

### What was rejected

| Alternative | Why not |
|---|---|
| A `players` integer | `2v2` and a four-way free-for-all both seat four people and are not the same game |
| `opponentLegends` as an array | Turns one row into a claim about several matchups; a three-way loss is not a loss to each of them |
| Log multiplayer games as `1v1` with a note | Puts two false facts in the one table that is permanent and has no edit path |
| Refuse to log non-`1v1` games at all | The notes are irreplaceable and decay within a day. The record is not only its rates |
| A combined "all formats" rate as well | The number nobody should read, offered next to the ones they should |
| Extend EE's advice to pods | `threats`, `sideboard` and the plan yardsticks are heads-up doctrine end to end. Recording a format is not modelling one, and pretending otherwise is how the deck would get worse |
