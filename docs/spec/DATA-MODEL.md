# Data Model — Forge

> Entities, relationships, and lifecycle. Written **before** architecture, because
> these are product decisions wearing implementation clothes.
>
> **Status:** Draft, 2026-08-02. Storage technology deliberately unspecified (D-019).

---

## 1. Entities

### `Card` — a printing

Cached wholesale from RiftScribe (D-002). Read-only; we never author card data.

```
Card
  id                "ogn-030-298"        unique printing identifier
  name              "Jinx, Demolitionist" ← THE LEGALITY UNIT (see §2)
  set_id            "OGN"
  collector_number  30                    ← primary key for collection entry (D-013)
  variant           ""                    "" | "a" | …
  rarity            "rare"
  faction           "fury"                domain
  type              "Unit"                Unit|Spell|Gear|Legend|Rune|Battlefield
  stats             { energy, might, power }
  keywords          ["accelerate", "assault 2"]
  tags              []                    ← champion tags live here; VERIFY
  is_banned         false
  images            { … }
```

⚠️ **Unverified:** the `tags` array was empty on the sample card inspected. Champion
tags (`Jinx`, `Annie`) and the Signature supertype are **required** for legality
(CR 103.2.a, 103.2.d) and it is **not yet confirmed** that RiftScribe exposes them.
**This is a Stage 4 blocker** — see [LEGALITY.md](LEGALITY.md#open-risks).

### `CardName` — derived, not stored

The unit the rules actually operate on. **All copy limits key on the name string**
(CR 103.2.b), so printings collapse and distinct names of one character do not:

```
"Jinx, Rebel"     ← ogn-202-298 AND ogn-202a-298 collapse here
"Jinx, Demolitionist"   ← a DIFFERENT name, own 3-copy allowance
```

### `CollectionEntry` — what is physically owned

Keyed on **printing**, because that is what sits in the box.

```
CollectionEntry
  card_id     "ogn-030-298"
  quantity    2
  finish      "normal" | "foil"     optional; irrelevant to legality
  added_at    timestamp
```

> Availability maths aggregates these **by name**; storage stays per printing.

### `Deck`

```
Deck
  id
  name              "Jinx Aggro v2"
  state             DRAFT | BUILT        ← see §3, this drives everything
  legend_card_id                          exactly 1
  chosen_champion_card_id                 exactly 1, must match Legend tag
  slots             DeckSlot[]
  bench             BenchEntry[]
  legality_mode     CASUAL | COMPETITION  ← CR 103.2 vs TR 601.1.b
  created_at / updated_at
```

### `DeckSlot`

```
DeckSlot
  deck_id
  card_id
  zone        MAIN | RUNE | BATTLEFIELD | SIDEBOARD
  quantity
```

Legend and Chosen Champion are **not** slots — they are singular fields, because
exactly one of each exists and they behave differently from quantities.

### `BenchEntry` — the tinkering surface

Cards under consideration, persisted with the deck. **Never committed, never
validated** — the Bench is explicitly a scratchpad, and validating it would defeat
its purpose.

```
BenchEntry
  deck_id · card_id · note (optional)
```

---

## 2. The legality unit vs the ownership unit

The single most error-prone relationship in the system:

| Concern | Keyed on | Why |
|---|---|---|
| **Ownership** | `card_id` (printing) | It is a physical object in a box |
| **Legality** | `name` (string) | CR 103.2.b counts names, not printings |
| **Entry** | `collector_number` | It is printed on the card (D-013) |

> Getting this wrong **breaks copy-limit maths silently** — the worst failure mode,
> because the deck looks legal and is not.

---

## 3. Commitment — how "cards in decks stop existing"

Implements D-017. **Refined here:** the original decision said cards in decks are
committed, but did not distinguish planning from reality.

### Only `BUILT` decks commit cards

```
DRAFT  — a plan. Commits nothing. Any number may exist.
BUILT  — physically sleeved. Commits its cards.
```

**Why this refinement matters:** the user will keep many speculative decks. If every
draft locked cards, the collection would appear exhausted after three ideas and the
tool would become unusable. Only sleeved cardboard is genuinely unavailable.

### Availability

```
owned(name)      = Σ quantity of all printings of that name
committed(name)  = Σ quantity across all BUILT decks
available(name)  = owned − committed
```

### Conflicts, not blocks

A DRAFT deck **may** exceed availability. Doing so raises a **conflict**, which is
surfaced as information, never as a wall:

> *"2 of 3 copies of Jinx, Demolitionist are in **Jinx Aggro v2**."*

D-017 requires the location always be shown. **An unavailable card is never a dead
end** — it is a card with an address.

### `DRAFT → BUILT` transition

The one real gate. Promotion requires zero conflicts. If conflicts exist, the user is
offered the explicit choice to dismantle the holding deck — which returns it to DRAFT
and releases its cards.

### `BUILT → DRAFT` — dismantling

Immediate, reversible, and the only way to reclaim committed cards. Models physically
un-sleeving a deck.

---

## 4. Lifecycle questions — answered

| Question | Answer |
|---|---|
| Is a BUILT deck immutable? | **No**, but editing one produces an immediate conflict check. The tool never silently lets the digital record drift from the sleeved reality |
| Does editing a BUILT deck release commitments? | Commitments are **derived**, never stored. They always equal current contents — nothing to release |
| What is a deck "version"? | An optional named **snapshot** of slots. Snapshots are inert: they never commit cards |
| What happens on deck deletion? | Commitments vanish with it, since they are derived. Deleting a BUILT deck is equivalent to dismantling |
| What if owned quantity drops below committed? *(traded away a sleeved card)* | An **over-commitment** state. **Surfaced loudly, never auto-corrected** — the tool must not silently decide which deck loses a card |
| Can two BUILT decks share a card? | **No.** That is precisely what commitment prevents |
| Do Bench cards commit? | **No.** The Bench is a scratchpad by design |
| Does the Sideboard commit? | **Yes** when BUILT — sideboard cards are physically present |

---

## 5. Derived, never stored

Recomputed on read to eliminate whole classes of drift bug:

- `committed(name)` and `available(name)`
- Legality validation results
- All deck statistics ([DECK-STATS.md](DECK-STATS.md))
- Conflict lists

At this scale — a few hundred names, dozens of decks — recomputation is free, and
correctness beats caching.

---

## 6. Backup and portability

The collection represents real hours of manual entry and lives on a hosted service
(D-018). **Loss is not catastrophic but is genuinely painful**, and it is the single
most irreplaceable data in the system.

**Requirements:**

- **Export everything to a plain, human-readable file** — collection, decks, bench,
  states. Not a proprietary blob
- Export must be **re-importable** into a fresh instance
- Automatic periodic export, not solely on demand
- Deck codes should target **Piltover-compatible** format where possible, for interop

> The card cache is deliberately excluded — it is reproducible from the API.

---

## 7. Open items

| # | Item | Blocks |
|---|---|---|
| DM1 | Does RiftScribe expose **champion tags** and the **Signature** supertype? | Stage 4 — **hard blocker** |
| DM2 | Snapshot granularity — full copy, or a diff chain? | Stage 7 |
| DM3 | Is `finish` (foil) worth tracking at all, given legality ignores it? | Stage 6 |
| DM4 | How the new-set refresh reconciles a cached card whose errata has changed | Stage 4 |
