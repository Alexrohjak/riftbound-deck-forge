# Legality Engine — Specification

> What the validator must check, and how we prove it correct.
> For *what the rules are*, see [reference/GAME-RULES.md](../reference/GAME-RULES.md).
>
> ⚠️ **Highest correctness risk in the project.** Everything downstream trusts this.
> A wrong legality engine produces decks that cannot be played, which destroys the
> tool's entire value.

---

## 1. Modes

Every validation runs in a mode. **Both must be supported** (Q8 decides only the
*default*).

| Mode | Main Deck | Source |
|---|---|---|
| `CASUAL` | **≥ 40** | CR 103.2 |
| `COMPETITION` | **exactly 40** | TR 601.1.b |

---

## 2. Checks

Each check is independently testable and carries its rule citation. A deck is legal
when **all** pass.

### Structural

| # | Check | Citation |
|---|---|---|
| L1 | Exactly 1 Champion Legend | CR 103.1 |
| L2 | Exactly 1 Chosen Champion | CR 103.2.a |
| L3 | Main Deck ≥40 (casual) / =40 (competition), **Chosen Champion counted within** | CR 103.2 / TR 601.1.b |
| L4 | Rune Deck exactly 12 | CR 103.3.a |
| L5 | Battlefields = count for Mode of Play (3 in 1v1) | CR 103.4.a |
| L6 | Battlefield names unique | CR 103.4.c |
| L7 | Sideboard ≤10, or absent | TR 601.1.c.1 |

### Domain Identity

| # | Check | Citation |
|---|---|---|
| L8 | Domain Identity = the Legend's domains | CR 103.1.b.2 |
| L9 | Single-domain cards: domain ∈ identity | CR 103.1.b.3 |
| L10 | ⚠️ Multi-domain cards: **all** domains ⊆ identity | CR 103.1.b.4 |
| L11 | Rune Deck cards comply with identity | CR 103.3.a.1 |
| L12 | `colorless` is permitted under any identity | — verify |

### Copy limits

| # | Check | Citation |
|---|---|---|
| L13 | ≤3 copies **per card *name***, not per printing | CR 103.2.b |
| L14 | Chosen Champion counts toward its name's 3 | CR 103.2.b.1 |
| L15 | ⚠️ Different names of one character have **separate** allowances | CR 103.2.b.2 |
| L16 | Limits span **Main Deck + sideboard combined** | TR 601.1.c.3 |

### Champion & Signature

| # | Check | Citation |
|---|---|---|
| L17 | Chosen Champion is a **champion unit** | CR 103.2.a.2 |
| L18 | Its champion tag matches the Legend's tag | CR 103.2.a.2 |
| L19 | ⚠️ **Signature units are ineligible** as Chosen Champion | CR 103.2.a.2 |
| L20 | ⚠️ **≤3 Signature cards total, regardless of name** | CR 103.2.d.1 |
| L21 | All Signature cards match the Legend's Champion tag | CR 103.2.d.2 |

### Format

| # | Check | Citation |
|---|---|---|
| L22 | All cards from format-legal sets, or sharing a name with one | TR 601.2.a |
| L23 | No banned cards | TR 601.2.d |
| L24 | Reprints numbered outside a set's range are not auto-legal | TR 601.2.c |
| L25 | Exact-preconstructed exemption at low OPL; voided by **any** change | TR 601.2.d.2 |

### Ownership *(Forge-specific, not a game rule)*

| # | Check |
|---|---|
| L26 | Every card is owned in sufficient quantity |
| L27 | No card conflicts with a `BUILT` deck's commitment — [DATA-MODEL.md §3](DATA-MODEL.md#3-commitment) |

> **L26/L27 are warnings, not legality failures.** A deck can be perfectly legal and
> unbuildable. **These must never be conflated** — the distinction is the point of
> the whole tool.

---

## 3. Test cases from the rulebook itself

The rulebook supplies worked examples. **Each becomes a test.** This is the cheapest
possible defence against misreading the rules.

| Test | Scenario | Expected | Rule |
|---|---|---|---|
| T1 | Volibear, Furious as Chosen Champion **+ 2 more copies** in Main Deck | ✅ legal | 103.2.b.1 |
| T2 | `3× Yasuo, Remorseful` **and** `3× Yasuo, Windrider` | ✅ legal — different names | 103.2.b.2 |
| T3 | Tibbers (tag `Annie`, **signature** unit) as Chosen Champion under an Annie Legend | ❌ illegal | 103.2.a.2 |
| T4 | Jinx, Rebel as Chosen Champion under a Legend with tag `Jinx` | ✅ legal | 103.2.a.2 |
| T5 | 4 copies of one name across Main Deck + sideboard | ❌ illegal | TR 601.1.c.3 |
| T6 | 3 **different** Signature cards + 1 more | ❌ illegal — cap is 3 total | 103.2.d.1 |
| T7 | Multi-domain card needing Fury+Mind, under a Fury/Calm Legend | ❌ illegal | 103.1.b.4 |
| T8 | 43-card Main Deck | ✅ casual · ❌ competition | CR 103.2 / TR 601.1.b |
| T9 | Two Battlefields sharing a name | ❌ illegal | 103.4.c |
| T10 | `ogn-202-298` + `ogn-202a-298` + one more "Jinx, Rebel" printing | 3 copies — ✅ legal; a 4th ❌ | 103.2.b |

---

## 4. Open risks

| # | Risk | Severity |
|---|---|---|
| **LR1** | **Champion tags and the Signature supertype may not be exposed by RiftScribe.** L17–L21 are unimplementable without them. `tags` was empty on the inspected card | 🔴 **Blocker** |
| **LR2** | **There are probably more rules like Signature cards.** It was found only by reading the PDF directly, after community sources had already been wrong about the sideboard | 🔴 High |
| LR3 | Errata may alter individual cards; the ban list is external and changes over time | 🟡 Medium |
| LR4 | `colorless` handling under Domain Identity is inferred, not explicitly confirmed (L12) | 🟡 Medium |
| LR5 | "Mode of Play" varies battlefield count for team formats — 1v1 assumed throughout | 🟢 Low |

### Mitigation for LR2

1. **Read CR 103 and TR 601 in full, line by line**, before implementing — not
   summaries, not this document
2. Encode **every** rulebook example as a test (§3)
3. Treat this specification as **incomplete by default** and re-verify against each
   rules update

---

## 5. Definition of done

- All checks L1–L27 implemented
- All tests T1–T10 passing
- LR1 resolved — champion tags and Signature supertype available from some source
- CR 103 and TR 601 read in full and this specification reconciled against them
- Errata and ban list ingestion working (Q10)
