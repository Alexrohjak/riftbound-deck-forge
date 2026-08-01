# Discovery — Forge

> **Status:** Discovery in progress. Not yet a locked BLUEPRINT.
> **Phase:** 1 (Discovery) of the 4-Phase SOP
> **Last updated:** 2026-08-02

---

## 1. Problem Statement

Riftbound is a physical trading card game. Cards are acquired through random pack
openings, which means **every published guide and netdeck assumes a card pool the
player does not have**. Deck guides are therefore aspirational rather than
actionable.

This project inverts the direction of deckbuilding:

> *Given the cards I actually own, what can I legally and effectively build?*

---

## 2. What Is Being Built

A personal, single-user deckbuilding **workbench** for Riftbound, consisting of:

1. **A collection layer** — catalogue of physically owned cards with quantities.
2. **A deckbuilding workbench** — browse, filter, and assemble decks by hand with
   live rules validation and deck statistics.
3. **A deck generator** *(hypothesis, not commitment)* — given an anchor and intent,
   propose complete deck candidates constrained to the owned collection.
   ⚠️ **Downgraded to a research spike** by the [assumption audit](AUDIT.md) —
   see [spec/GENERATOR.md](spec/GENERATOR.md).

### Design north star

[Piltover Archive](https://piltoverarchive.com/deckbuilder) — Riot's official card
database and deck builder. The target experience is *"Piltover Archive, plus an
owned-cards layer, plus a genuinely smart generator."*

Observed Piltover Archive UX (captured 2026-08-02):

| Region | Contents |
|---|---|
| **Left — Gallery** | Filters: ID, Colors, Set, Type, Supertype, Variant, Rarity. Range sliders: Energy 0–12, Power 0–4, Might 0–10. Live result count. Adjustable card size + column density (2/4/6/8/10). Filters collapse to a bottom sheet on mobile. |
| **Right — Deck** | Slot counters: Legend 0/1 · Champion 0/1 · Battlefields 0/3 · Runes 0/12 · Main Deck 0/40 · Sideboard 0/10 (opt). "Add to:" target selector. Sort by `Energy > Power > Name`. |
| **Tabs** | Deck Stats · Sample Hand (hand simulator) |
| **Actions** | Import · Export · Clear · Save Deck |
| **"The Bench"** | Staging area — *"Plan cards here (saved with deck)."* Cards under consideration, persisted with the deck. |

**"The Bench" is explicitly worth adopting.** It directly serves the stated goal of
long, enjoyable tinkering sessions.

---

## 3. Who It Is For

Alexander, alone.

- No other users, no accounts, no multi-tenancy, no sharing
- Not a product; a personal tool built to a high standard of craft

---

## 4. Usage Modes

| Mode | Context | Requirements |
|---|---|---|
| **Desktop (primary)** | At home with the full collection available. Long sessions researching, testing, planning and physically assembling decks. | Full workbench: browse, filter, build, generate, tune, save. Collection **entry** is desktop-oriented — keyboard, collector numbers, cards in hand |
| **Phone (full parity)** | While playing, away from home. Insight arrives mid-game and must be captured immediately. | **The same application, fully editable.** Not a viewer. See [D-018](DECISIONS.md#d-018) |

> ⚠️ **Changed 2026-08-02.** The phone was originally specified read-only; the user
> reversed this — *"should be able to edit decks on there as well, as I learn new
> things while playing."* This forces a **single source of truth reachable from
> anywhere** and makes responsive design a hard requirement across the entire
> workbench. See [D-018](DECISIONS.md#d-018).

> ✅ **Confirmed 2026-08-02:** "While playing" means **away from the home network**,
> so phone access cannot depend on LAN reachability. A local-only application is
> therefore ruled out as a complete solution. See [D-012](DECISIONS.md#d-012).

---

## 5. Quality Bar

Stated explicitly by the user:

> *"This isn't just some throw-it-together app. I want it to be really useful so that
> I can enjoy sitting for hours creating, putting together, sleeving and testing decks."*

Implications:

- Interaction smoothness is a **requirement**, not a nicety
- The tool must reward long sessions rather than merely tolerate them
- Rules must be applied thoroughly and correctly, including special interactions
- Adding newly acquired cards must be near-frictionless

---

## 6. Scope — Phased

### Phase A — The Workbench *(v1)*

Agreed priority. The generator's output is only valuable if there is somewhere good
to receive, inspect, edit and push back on it — and that place is the workbench.

- **Collection entry mode** — keyboard-driven, keyed on collector number, with
  preconstructed products added as known bundles. A first-class feature, not a
  one-off migration step (see [D-013](DECISIONS.md#d-013))
- Card gallery with full filtering
- Manual deck construction with live legality validation
- Deck statistics (curve, domain split, rune math, type ratios)
- Save / edit / iterate on decks, with the DRAFT/BUILT commitment model
- **Full phone parity** — the same app, fully editable ([D-018](DECISIONS.md#d-018))

### Phase B — The Generator *(research spike, not a commitment)*

⚠️ **Downgraded** following the [assumption audit](AUDIT.md), finding A9. The stated
goal is to *enjoy hours of tinkering*; a generator automates tinkering. What is
actually wanted may be a workbench that makes tinkering fast and well-informed —
which is Phase A. **Unanswerable until Phase A exists.**

Full specification, including kill conditions and the unresolved
objective-function contradiction: [spec/GENERATOR.md](spec/GENERATOR.md).

---

## 7. Generator Requirements *(Phase B — captured now, designed later)*

The generator must weigh **numerous factors**, not just legality:

- How similar decks have performed in **real tournaments**
- Average card cost / curve efficiency
- **Flexibility** of the resulting deck
- **Counterplay** against other decks and Legends
- **Early-game vs late-game** balance

It must also be **conversational**: when it recommends something the user dislikes,
that feedback is an input to the next iteration — not a dead end.

> ⚠️ This is a significant departure from the initial success criterion of
> "legal + coherent." See [DECISIONS.md](DECISIONS.md#d-001) — the reversal is
> recorded deliberately rather than absorbed silently.

---

## 8. Explicit Non-Goals

- ❌ Building our own card scanner / OCR
- ❌ Maintaining our own card database
- ❌ Multi-user, authentication, sharing, social features
- ❌ Collection valuation or price tracking
- ❌ Gameplay simulation beyond a sample-hand draw
- ❌ Support for any TCG other than Riftbound
- ❌ Scraping data sources that prohibit it

---

## 9. Non-Functional Requirements

| Concern | Position | Confidence |
|---|---|---|
| **Scale** | 1 user · **200–300 unique names owned** (of 767 in existence) · ~1,000 physical cards · dozens of decks. Entire card pool is 950 printings — cacheable in full. | **Measured** |
| **Performance** | Filtering and validation feel instant (<100 ms). Generation responsive (<2 s). Trivial at this data size. | Assumption |
| **Privacy** | No PII, no credentials, nothing sensitive. Worst case: someone sees a card list. | Assumption |
| **Reliability** | No uptime requirement. A day of downtime causes no harm. | Assumption |
| **Maintenance** | Solo maintainer. **Minimising moving parts is worth more than architectural elegance.** | Confirmed |

---

## 10. Open Questions

| # | Question | Status |
|---|---|---|
| ~~Q1~~ | Does phone access need to work away from home? | ✅ **Yes** — [D-012](DECISIONS.md#d-012), superseded by [D-018](DECISIONS.md#d-018) |
| ~~Q2~~ | Sideboard size: 0-or-8, or 0–10? | ✅ **0–10** (TR 601.1.c.1). Community guides were stale — [D-020](DECISIONS.md#d-020) |
| ~~Q3~~ | Are cards locked inside physically built decks? | ✅ **Yes — cards in decks are committed** — [D-017](DECISIONS.md#d-017) |
| Q4 | Can legitimate access to tournament/meta data be obtained? | 🟡 Open — mitigated by [D-009](DECISIONS.md#d-009). ⚠️ **Reframed:** also a *relevance* problem, not only access — see [AUDIT.md](AUDIT.md) A8 |
| **DM1** | ⚠️ **Does any source expose champion tags and the Signature supertype?** Five legality checks are unimplementable without them | 🔴 **Blocker** — [spec/LEGALITY.md](spec/LEGALITY.md#4-open-risks) |
| ~~Q5~~ | Is "playstyle" a fixed tag list, free text, or inferred from the anchor? | ✅ **Resolved in principle** — defined **mechanically** rather than by name, sidestepping the missing archetype data. [spec/GENERATOR.md §5](spec/GENERATOR.md) |
| ~~Q6~~ | Should the system help physically *locate* cards? | ⏸️ **Deferred** until the new organising box — [D-021](DECISIONS.md#d-021) |
| Q7 | Is best-of-three / sideboard play in scope? | 🟡 Open — rules now fully captured either way (RESEARCH §4.8) |

**New questions raised by the rulebook research:**

| # | Question | Status |
|---|---|---|
| Q8 | Casual (≥40) or competition (=40) as the default legality mode? Both must be supported. | 🔴 Open |
| ~~Q9~~ | Which statistics belong in the deck stats panel? | ✅ **Resolved** — three-tier confidence framework, [spec/DECK-STATS.md](spec/DECK-STATS.md) · [D-022](DECISIONS.md#d-022) |
| Q10 | How are per-set errata and the official ban list ingested and kept current? | 🟡 Open |
| Q11 | How does deck editing work well under touch, given full phone parity ([D-018](DECISIONS.md#d-018))? | 🔴 Open |

---

## 11. Deferred Dimensions

Raised during discovery, acknowledged, not yet designed:

1. ~~**Physical exclusivity**~~ — ✅ resolved, [D-017](DECISIONS.md#d-017)
2. **Coherence heuristics** — the actual numbers behind "a sensible deck" (Q9)
3. **Archetype→card mapping** — not present in any API; must be sourced or derived
4. **Anchor semantics** — arbitrary-card anchors require reverse-solving for a legal Legend
5. ~~**Variant collapsing**~~ — ✅ rule confirmed: the limit keys on the **name
   string**. Variants of one name collapse; different names of the same character
   do not (CR 103.2.b.2)
6. **Failure modes** — "you have 34/40, here are the 6 gaps" beats "no results"
7. **Deck lifecycle** — compare versions, mark as physically built
8. ~~**Physical retrieval**~~ — ⏸️ deferred, [D-021](DECISIONS.md#d-021)
9. **Signature card constraint** — newly discovered (CR 103.2.d); max 3 total
   Signature cards regardless of name, matching the Legend's Champion tag
10. **Touch-first deck editing** — new, from full phone parity (Q11)
