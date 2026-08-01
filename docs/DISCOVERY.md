# Discovery — Riftbound Deck Forge

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
3. **A deck generator** *(phase 2)* — given an anchor and intent, propose complete
   deck candidates constrained to the owned collection.

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
| **Desktop (primary)** | At home with the full collection available. Long sessions researching, testing, planning and physically assembling decks. | Full workbench: browse, filter, build, generate, tune, save |
| **Phone (secondary)** | While playing — likely away from home. | **Read-only** access to saved decks |

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
- Save / edit / iterate on decks
- Read-only phone view of saved decks

### Phase B — The Generator *(v2)*

- Anchor-seeded deck generation (Legend / Champion / specific card)
- Positive intent (playstyle, archetype) and **negative constraints** ("not this")
- Multi-factor effectiveness scoring
- **Interactive refinement** — reject a suggestion, explain why, regenerate

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

| # | Question | Blocks |
|---|---|---|
| ~~Q1~~ | ~~Does phone access need to work away from the home network?~~ **RESOLVED: yes.** See [D-012](DECISIONS.md#d-012). | ~~Architecture~~ |
| Q2 | **Sideboard size: 0-or-8, or 0–10?** Sources conflict (see RESEARCH.md). Must resolve against the official rulebook. | Legality engine |
| Q3 | Are decks kept physically built between sessions? If so, cards are "committed" and unavailable to other decks. Changes the data model from `card → qty` to `card → qty owned / committed / free`. | Data model |
| Q4 | Can legitimate access to tournament/meta data be obtained? | Generator scoring |
| Q5 | Is "playstyle" a fixed tag list, free text, or inferred from the anchor? | Generator interface |
| Q6 | Does the system need to help physically *locate* cards in the boxes? | Collection UX |
| Q7 | Is best-of-three / sideboard play in scope? | Legality engine |

Q3 was raised and deliberately deferred by the user as "very loose for now —
we can introduce this later."

---

## 11. Deferred Dimensions

Raised during discovery, acknowledged, not yet designed:

1. **Physical exclusivity** — cards locked inside already-built decks (Q3)
2. **Coherence heuristics** — the actual numbers behind "a sensible deck"
3. **Archetype→card mapping** — not present in any API; must be sourced or derived
4. **Anchor semantics** — arbitrary-card anchors require reverse-solving for a legal Legend
5. **Variant collapsing** — `ogn-202-298` and `ogn-202a-298` are both "Jinx, Rebel"
6. **Failure modes** — "you have 34/40, here are the 6 gaps" beats "no results"
7. **Deck lifecycle** — compare versions, mark as physically built
8. **Physical retrieval** — optional box/location tagging
