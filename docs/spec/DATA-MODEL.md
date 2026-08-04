# Data Model — Forge

> Entities, relationships, and lifecycle. Written **before** architecture, because
> these are product decisions wearing implementation clothes.
>
> **Status:** Draft, 2026-08-02. Storage technology deliberately unspecified (D-019).

---

## 1. Entities

### `Card` — a printing

Cached wholesale from **Riot's official card gallery** ([D-034](../DECISIONS.md#d-034)).
Read-only; we never author card data.

**1,180 printings · 935 distinct names · 5 sets** (verified 2026-08-02).

```
Card
  id                "ven-150-166"          unique printing identifier
  name              "Acceleration Gate"    ← THE LEGALITY UNIT (see §2)
  collectorNumber   150                    ← primary key for entry (D-013)
  publicCode        "VEN-150/166"
  set.value         { id: "VEN", label: "Vendetta" }
  rarity.value      { id: "epic", label: "Epic" }

  domain.values[]   [{id:"calm"}, {id:"mind"}]   ← ARRAY. Legends always have 2
  cardType.type[]   [{id:"spell", label:"Spell"}]
  cardType.superType[]  [{id:"signature", label:"Signature"}]   ← 51 cards
  tags.tags[]       ["Lillia"]             ← champion tags; 826 / 1,180 cards

  text.richText.body   HTML with :rb_might: symbol tokens
  cardImage.url        Sanity CDN, with dimensions and extracted colours
  orientation          "portrait" | "landscape"
```

**Type distribution:** Unit 629 · Spell 233 · Gear 114 · Legend 118 · Battlefield 66 ·
Rune 18

> ⚠️ **`buildId` changes on every site deploy.** Resolve it from the gallery page at
> fetch time; never hard-code it. See
> [DATA-SOURCES.md §1](../reference/DATA-SOURCES.md).

**Optional secondary enrichment** from RiftScribe: pre-parsed `keywords` arrays,
convenient `stats {energy, might, power}`, `is_banned`, and multiple thumbnail sizes.
Not required — and it is missing the Vendetta set entirely.

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
                    (no legality_mode — COMPETITION only, D-032)
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

<a id="2-the-legality-unit-vs-the-ownership-unit"></a>

## 2. The legality unit vs the ownership unit

The single most error-prone relationship in the system:

| Concern | Keyed on | Why |
|---|---|---|
| **Ownership** | `card_id` (printing) | It is a physical object in a box |
| **Legality** | `name` (string) | CR 103.2.b counts names, not printings |
| **Entry** | `collector_number` | It is printed on the card (D-013) |

> Getting this wrong **breaks copy-limit maths silently** — the worst failure mode,
> because the deck looks legal and is not.

### ⚠️ Stored per printing, *compared* per name

The table above says where each fact lives. It does **not** say how a shortfall is worked
out, and reading it as though it did produced a real bug: `L26` compared printing to
printing, so owning three copies of a card across three different arts reported as *three
short* — while the sentence directly above that code said the opposite.

**A deck slot demands a card, not a particular picture of one.** The arts are interchangeable
in a sleeve, and the gallery records whichever printing it happened to pick, which is rarely
the one in your box. So:

- **Ownership rows** stay keyed on printing — that is what a physical object is
- **`L26` / `L27` sum owned copies across a name's printings** before comparing
- **Copy limits** remain keyed on name, unchanged (CR 103.2.b)

The practical consequence for [`W2`](../PLAN.md): it does not matter which printing of a card
you register. Enter the one in front of you.

---

<a id="3-commitment"></a>

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

<a id="6-backup-and-portability"></a>

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

<a id="7-open-items"></a>

## 7. Open items

| # | Item | Blocks |
|---|---|---|
| ~~DM1~~ | ✅ **RESOLVED** — Riot's official gallery supplies champion tags, domain arrays and Signature supertypes ([D-034](../DECISIONS.md#d-034)) | — |
| DM2 | Snapshot granularity — full copy, or a diff chain? | W3 |
| DM3 | Is `finish` (foil) worth tracking at all, given legality ignores it? | W2 |
| DM4 | How the new-set refresh reconciles a cached card whose errata has changed | F3 |
