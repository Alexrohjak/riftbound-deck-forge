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

## 4. Packages, not a card list (`community`, and the strongest claim here)

**All three method transcripts arrive at packages independently**, which is better evidence
than any single one of them. The clearest statement:

> *"Play style refers to the overall game plan and victory condition, while packages refer to
> the collection of cards that are being brought in to support your intended play style…
> the easiest way in my opinion is to start with play style."*
> — [`03`](transcripts/03-the-all-unique-deck.md)

| Package | What belongs in it | Who says so |
|---|---|---|
| `engine` | Cards supplying what the Legend and Champion reward | all three |
| `coreUnits` | Units played on curve to contest battlefields with bodies | `03`, Riot's Primer |
| `interaction` | Turn-to-turn answers — **~8, about a fifth of the deck** | [`04`](transcripts/04-archetypes-and-construction.md) |
| `closers` | Cards that win by being present. Heuristic: spells above 4 energy | `03` |
| `earlyPlays` | The 7–9 band (§2) | `01`, community |
| `spice` | An off-meta card the opponent will not play around | [`01`](transcripts/01-deckbuilding-is-cooking.md) |

⚠️ **`03` says split into "as many packages as we need"** — the set above is a default, not a
fixed five.

### ⭐ Packages exist to make your *hand* readable, not your deck

The most useful sentence in any of the four sources, and the reason this section is not
bookkeeping:

> *"The package separation isn't just for us to understand our deck, but to understand our
> **hand** when we start the game… Opening Time Warp, Thousand Tailed Watcher and Singularity
> alongside a two drop is seemingly nice, but three of those cards are sitting in your hand
> with no way to effectively utilize them in the first three turns."*
> — [`03`](transcripts/03-the-all-unique-deck.md)

Forge turns this into a number nobody in the videos can give, because it already simulates
10,000 openings — see [`GENERATOR §6.3`](../spec/GENERATOR.md).

### ⚠️ Two refinements the raw counts miss

- **A vanilla two-drop is not an early play.** `01` separates two-drops with a self-scoped
  effect or a real mid-game role from ones that are *"vanillas entirely"*, and says not to run
  the third kind.
- **Some decks legitimately skip the two-drop rule** — `01` names decks with other ways to
  play units on turn one, and control decks that *"don't really care about unit or point
  tempo"*. This is why measurement is plan-relative rather than universal.

### 🌶️ Spice is a slot Forge reserves and refuses to fill

`01` calls the off-meta card *"the most important part in your ingredients"*. Its value comes
entirely from what opponents expect — meta knowledge [D-035](../DECISIONS.md#d-035) says Forge
will never have. **The skeleton reserves the slot; the choice is the builder's.**

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
| Where to start | [`01`](transcripts/01-deckbuilding-is-cooking.md): take a three-star top-eight list and mix — *"the best deck converges"* | [`04`](transcripts/04-archetypes-and-construction.md): start from *"how do you want to win"* and sieve the pool down |
| Netdecking | `01`: fastest and usually correct | [`03`](transcripts/03-the-all-unique-deck.md), directly answering it: ***"You are not those players"*** — without knowing the packages you cannot mulligan |
| Consistency | `01`: 3-of core, 2-of important, 1-of tech | `03` runs **39 unique cards** and argues understanding beats redundancy |
| The Legend's weight | `01`: *"weigh it heavily… unless it sucks"* | `04`: one of **four** layers — legend, champion, main deck, battlefields |
| Theory vs testing | Testing beats theory; do not over-think the first build | Think in packages first, or you will test a deck with no plan |

All of these are held by people who win. **The disagreement is the content**, and a tool that
picks one and hides the rest is misrepresenting the state of the art.

> ⚠️ **One school's main advice is closed to Forge by design.** `01`'s primary route needs
> tournament results, and [D-035](../DECISIONS.md#d-035) means there is no meta data and there
> will not be. Recorded rather than omitted: it raises the bar on the sieve path instead of
> being a gap Forge is pretending not to have.
>
> ⚠️ **The Legend row is not a real contradiction, and EE must not treat it as one.** Heavy
> weight and *sole* focus are different things. The deck that prompted
> [D-064](../DECISIONS.md#d-064) had the Legend's ability at effectively 100% of the deck and
> every other package at zero — which neither school advises.

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
