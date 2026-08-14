# Deckbuilding doctrine — what good players advise, and who advises it

> **This is not a rulebook and must never be read as one.** For what is *legal*, see
> [`spec/LEGALITY.md`](../spec/LEGALITY.md); for what the game *does*, see
> [`COMPENDIUM.md`](COMPENDIUM.md). This file records what experienced players believe about
> building a good deck — which is a different kind of claim, held with different confidence,
> and **frequently contested**.

## Why this exists as its own document

EE gives advice. Advice that cannot say where it came from is indistinguishable from
assertion, and this game has no long-settled orthodoxy to fall back on — the format is
months old. So every judgement EE makes carries a **source** and a **confidence**, and this
file is where the sources live.

| Source | Weight | What it is |
|---|---|---|
| `rulebook` | Binding | Core / Tournament Rules. Not advice — a constraint |
| `official` | High | Riot's own Primer. Advice from the designers |
| `community` | Contested | Earned from play, widely held, disputed at the edges |
| `computed` | Exact, conditional | Arithmetic on *this* deck, correct given a stated assumption |

> ⚠️ **Where the `community` tier actually comes from.** Everything below marked `community` is
> drawn from **~30,000 words of transcribed video advice** now held in
> [`transcripts/`](transcripts/) — four people, who disagree with each other, one of whom
> names himself. Until 2026-08-14 this file said *"widely held"* and *"consensus across the
> guides"* while naming no guide, in a document whose first argument is that advice must name
> its source. It does now. ⚠️ The **source URLs are still missing** and have deliberately not
> been guessed — [`transcripts/README.md`](transcripts/README.md) explains what is and is not
> known.

| Confidence | Meaning |
|---|---|
| `fact` | Counted from the list. Not arguable |
| `probability` | Computed; correct **given** the assumption that travels with it |
| `doctrine` | What good players advise. They disagree, so it is attributed |

---

## 1. Riot's own guidance (`official`)

From the Primer, recorded in [COMPENDIUM §2](COMPENDIUM.md). **This outranks community
heuristics where they conflict.**

- **9+ small units** in the 2–4 cost range, for reliable early battlefield presence
- **6+ interactive spells** for combat support and disruption
- **Prioritise units over spells and gear** — you hold battlefields with bodies
- **Reserve 3 slots** for your Champion's Signature cards
- **Runes: a 6-6 split** across your two domains, tweaked as you play. Skew (8-4) when Power
  costs are lopsided
- **Battlefields:** pick three by asking which support your strategy, which would hurt you in
  an opponent's hands, and which give a slight edge

> Forge's rune-feasibility statistic is meant to *replace* the 6-6 default with a computed
> answer — improving on official guidance, not correcting community error.

## 2. The one piece of maths (`computed`)

**7–9 cards playable on turn one** gives roughly **78% / 83% / 87%** to open at least one,
assuming you see about seven cards by the end of turn one — open four, mulligan two when you
have no early play, draw for turn.

Forge computes this exactly and lands on 77 / 82 / 86, the same claim to the nearest point.
`packages/engine/test/advice.test.ts` pins it: if our model stops reproducing the number
every guide quotes, our model is wrong.

⚠️ **The assumption must travel with the number.** An unqualified percentage is how a
probability becomes folklore.

## 3. Archetypes (`community`)

A deck's archetype is its **game plan**. The consistent warning across every guide is that a
deck trying to do everything does several things at half strength.

| Archetype | Wants | Loses to |
|---|---|---|
| **Aggro** | Speed and pressure; punish slow starts | Control, once it stabilises |
| **Control** | Survive early, dominate late; removal and resources | Combo, which wins without engaging |
| **Tempo** | Stay slightly ahead every turn; make their next turn awkward | Being out-resourced |
| **Combo** | Assemble a payoff, win in one swing | Aggro, which kills you before assembly |
| **Midrange** | Balance; flexible, forgiving | Favoured nowhere, hopeless nowhere |

**The triangle:** aggro beats combo, combo beats control, control beats aggro. Midrange
trades both edges for fewer weaknesses.

**Relative speed** matters more than raw speed: be *much* faster or *slightly* slower than
the deck opposite. Marginally faster is the worst place to be.

## 4. Packages, not a card list (`community`)

Decks decompose into **core units**, **core interaction**, and **closers**. The decomposition
is not bookkeeping — it is what makes a hand readable. Opening three closers and a two-drop
looks fine and is a mulligan.

## 5. Ratios (`community`, contested)

- **3-of** — core to the plan; you want it every game and extra copies do not hurt
- **2-of** — important, not core; or costly, or matchup-dependent
- **1-of** — tech, or a late-game bomb; also the easiest cards to side out

## 6. Combat tricks (`community`)

Hidden until used, so they win fights the opponent thought they had. The kinds trade off
against each other: **might increases** concentrate value into one unit that removal then
punishes; **might decreases** invite a refight with a different unit and pay Deflect costs;
**removal** is strongest but expensive; **stuns** are weaker and more available; **movement**
preserves tempo and can steal a point.

## 7. Where the schools genuinely disagree

⚠️ **Recorded because EE must not flatten it.**

| Question | One school | Another |
|---|---|---|
| Where to start | Take a topping list and mix in what you like — evolutionary convergence means good lists are already good | Sieve the entire legal pool down to 40, so you understand every choice |
| What matters most | Understanding your own deck well enough to mulligan and sequence correctly | Getting the list right before you play |
| Theory vs testing | Testing beats theory; do not over-think the first build | Think in packages first, or you will test a deck with no plan |

All of these are held by people who win. **The disagreement is the content**, and a tool that
picks one and hides the rest is misrepresenting the state of the art.

## 8. Iteration (`community`, unanimous)

Deckbuilding is cooking, not baking. The first list is a hypothesis; play is the evidence.
This is the one point every source agrees on, and it is why Forge's feedback surface takes a
note about a real game rather than asking you to re-specify the deck.

---

## How EE uses this

- A **complaint is evidence about a capability**, never about a card. *"I couldn't hold
  battlefields"* is a board-presence problem; answering it with removal answers a different
  question confidently
- Every suggestion states **what it costs**. Every change is a trade, and hiding the trade
  makes decks worse
- Nothing composites into a **score** ([D-016](../DECISIONS.md#d-016)). A deck is a set of
  trade-offs and a number hides which ones you chose
- **Silence is a valid answer.** A tool that always has advice is not reading the deck
