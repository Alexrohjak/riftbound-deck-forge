# The log — matches, deck history, diagnostics

> Three things that all sound like "logging" and are not the same thing at all. They differ
> in who writes them, how long they are worth keeping, and what happens if they are lost.

| | Written by | Worth | If lost |
|---|---|---|---|
| **Match log** | You, after a game | Irreplaceable — it cannot be reconstructed | The whole point of the feature is gone |
| **Deck history** | The app, on every save | High — it is what makes the match log mean anything | Matches become unattributable |
| **Diagnostics** | The app, on a failure | Low individually, useful in aggregate for a week | Nothing. Expendable by design |

They therefore get **three tables, not one with a `kind` column**. Retention, backup and
privacy rules differ per row type, and a single table would have to take the strictest of
each — permanent retention for crash noise, or expiry for match records. Both are wrong.

---

## 1. Why deck history is not an optional extra

**A match record that references a deck *id* is nearly worthless.** The deck mutates. Six
weeks and forty edits later, *"4-1 with Ahri"* does not tell you which Ahri — and the whole
reason to keep a record is to learn which build was the good one.

So a match references the **deck's contents at the moment it was played**, and the mechanism
that provides that is the same one that provides history. One feature, two answers:

- *"What did this deck look like on the 4th?"* — read the timeline
- *"Which version went 4-1?"* — join the match to the version it names
- *"Have I tried exactly this list before?"* — a hash lookup, because versions are addressed
  by the content hash of their card list

The third one is the interesting one, and it falls out for free.

### `deck_history` — append-only

| Column | Meaning |
|---|---|
| `deck_id` + `seq` | The timeline, in order |
| `hash` | Content hash of the card list. **Identical lists hash identically**, whatever route you took to get there |
| `contents` | The list itself, as JSON — legend, champion, slots |
| `at` | When it was saved |

⚠️ **A row is written only when the hash differs from the previous row.** Saving is
idempotent, autosave fires constantly, and a timeline of ten thousand identical rows is not
history. This is the only trimming rule and it is applied on write, not by a cleanup job.

⚠️ **Contents are stored per row rather than deduped into a content store.** A 40-card list
is about a kilobyte; deduplication would buy nothing at personal scale and cost a join on
every read. The hash still gives the dedupe *query* — which is the part with value.

---

## 2. The match log

| Column | Notes |
|---|---|
| `id` | Assigned by the client |
| `deck_id`, `deck_name`, `deck_hash` | **No foreign key** — see below |
| `played_at` | The date you played, not the date you typed it in |
| `format` | `1v1` / `1v1v1` / `2v2` — the shape of the table ([D-066](../DECISIONS.md#d-066)). Null reads as `1v1` |
| `opponent_legend` | Their Legend's `card_id`, when you know it. Null is a real answer. **Heads-up only** |
| `opponent_note` | Free text — *"Yasuo aggro, splashing Order"* |
| `result` | `WIN` / `LOSS` / `DRAW` |
| `games` | *"2-1"*, when a match was several games. **Yours first**, and it must agree with `result`. Null when it was one |
| `symptoms` | JSON array of [`Symptom`](EVALUATION.md) codes — the link to EE |
| `notes` | What actually happened, in your words |

### A match outlives its deck

`deck_id` carries **no foreign key**, and `deck_name` is stored on the row. Delete a deck and
the games you played with it are still games you played. A cascade would quietly destroy the
most irreplaceable data in the system to preserve referential tidiness.

This is the one place a name is denormalised, and it is not a violation of
[DATA-MODEL §2](DATA-MODEL.md): the rule there forbids copying **Riot's** card data, which
goes stale on the next set. A deck name is *your* data, and the name it had when you played
it is the historically correct answer — refreshing it would be the bug.

### A row must not contradict itself, and nothing may be pre-answered

The first two games ever logged both stored as **wins**. One had been lost, and its own notes
said so. Three separate things had to be wrong at once, and all three are now fixed:

| What happened | Why it was possible | The rule now |
|---|---|---|
| The result was never chosen | The form shipped with **`Won` pre-selected**. A required field that arrives pre-answered is not required — it is *guessed*, and a filled-in form looks finished | Nothing is pre-selected, and `Log it` stays disabled until you pick |
| Win and loss went in the **score** field as `1-0` / `0-1` | It was labelled *"Games"* with a `2-1` placeholder, which reads like a per-game score | Labelled *"Games, if several"*, placeholder *"2-1, yours first"* |
| The row disagreed with itself and was stored anyway | Nothing compared `games` against `result` | `validate()` rejects it. `games "0-1"` says LOSS; a `WIN` beside it is two claims about one game |

⚠️ **The validation is the load-bearing one.** The form was one of two writers (`D-047`) and
the CLI would have accepted the same contradiction. A fix that only changes the interface
leaves the invariant unstated, which is how it comes back.

### The record has to be readable, and correctable

For its whole existence the panel showed **only aggregates**. Every note written after a game
was stored and then invisible, and a row entered wrong could not be found — the first mistyped
result had to be corrected from a database console.

- **The games are listed**, newest first, with their notes and symptoms in full.
- **Tap one to correct it.** The same sheet, pre-filled, saved under **the same id** — which
  the API's `ON CONFLICT(id) DO UPDATE` turns into an update. No second endpoint writes to the
  one table that cannot be reconstructed.
- **Delete asks twice**, and only ever appears on a row that already exists.

⚠️ **An edit never restamps `deck_hash`.** The hash records which build you *played*; fixing a
typo two weeks later would otherwise reattribute the game to whatever the deck has become.

### Formats are read separately, never pooled

A record is read **one format at a time**, defaulting to `1v1`. This is not a filter for
convenience — pooling formats is the same error as reporting a rate from four games, wearing
a disguise that makes it harder to spot:

| | |
|---|---|
| Heads-up | You beat **one** deck. Par is **50%** |
| `1v1v1` | You beat **two**, and two people can decide between them who to attack. Par is **33%** |
| `2v2` | Your deck is **half** of what won. Par is **50%** |

A combined win rate describes none of those tables, and it arrives attached to a *larger* `n`
— so it looks more trustworthy than the honest figures it replaced. `read()` therefore reports
`baseline` beside the rate wherever it is not 50%, because **33% is par in a pod and a broken
deck heads-up**, and the number alone cannot tell you which.

Two consequences fall out and both are deliberate:

- **No matchup record outside `1v1`.** With a third player at the table, the result is not
  attributable to any one opponent, so `opponent_legend` is not even offered on the form —
  the others go in `opponent_note` as free text.
- **Symptoms aggregate within a format.** *"I couldn't hold"* against two opponents may be
  arithmetic rather than a fact about the deck, and letting it count toward a heads-up build
  problem would be reading a different game's evidence.

⚠️ **Games in other formats are always stated, never hidden.** A reading that says *"nothing
logged"* while four games sit in another bucket is the one failure this design could produce,
and it is what `elsewhere` and its test exist for.

⚠️ **Everything EE says is heads-up doctrine.** `threats`, `sideboard`, the battlefield reads
and the plan yardsticks all assume one opponent, and nothing in the engine models a pod. The
log records that you played one; it does not pretend to advise on it.

### `symptoms` is the point

[EE's feedback surface](EVALUATION.md) already turns *"I couldn't hold battlefields"* into a
`cannot-hold` symptom with a diagnosis and a stated cost. Recording that code on the match
turns a one-shot conversation into a **record**:

> Five of your eight losses were `cannot-hold`. That is not variance, it is the deck.

A single game is an anecdote. Eight games with the same complaint is a build problem, and no
amount of cleverness about one game can see that.

### ⚠️ What the log refuses to say

Win rates from small samples are noise dressed as evidence, and this project does not do
that ([D-016](../DECISIONS.md#d-016), [D-022](../DECISIONS.md#d-022)).

- **Below 10 matches, no rate is reported at all** — the record is shown, the percentage is
  not. At n=3 the difference between 33% and 67% is one game.
- **Per-matchup rates need 5 games against that Legend.** Otherwise the matchup is listed
  with its raw record and no verdict.
- Nothing composites into a "deck score". Never.

---

## 3. Diagnostics

**Cloudflare already logs the Worker.** What it cannot see is the browser, and every
interface bug of note so far has lived there — a CSS specificity trap, an invalid `sizes`
attribute, a grid collapsing to two pixels. So diagnostics are scoped to **client-side
failures and a few app events**, and nothing else.

| Column | Notes |
|---|---|
| `at`, `level` | `error` / `warn` / `info` |
| `code` | A **stable identifier**, not a sentence. Aggregation needs something to group by |
| `message` | The human-readable detail |
| `context` | Bounded JSON |

Rules, all of which exist because a diagnostic channel that misbehaves is worse than none:

1. **Never blocks.** Reporting is fire-and-forget. A logging failure must never surface as an
   application failure — the app has to work when the log does not.
2. **Carries no card or deck data of its own.** Context is a fault's *location*, never the
   state on screen — that is already in the database, and copying it into crash noise makes
   the noise big without making it informative. ⚠️ The limit worth stating: `message` is
   whatever a browser or library put in an `Error`, and the reporter cannot see inside it, so
   a thrown message that embeds a card name will be stored. Bounded, and behind Access.
3. **Bounded.** The table is trimmed to the newest 500 rows on write. A client error loop is
   a thing that happens, and it must not be able to fill the database.
4. **Not backed up.** The nightly snapshot ([D-051](../DECISIONS.md#d-051)) carries matches
   and deck history, which are irreplaceable, and skips events, which are not.

---

## 4. What this is not

| Not this | Why |
|---|---|
| Analytics | One user. There is no funnel and nobody to convert |
| A play tracker for live games | You are holding cards. Typing during a match is worse than remembering after it |
| Meta statistics | Sources have opted out and current-set n is 1–3 ([DATA-SOURCES](../reference/DATA-SOURCES.md)) |
| A deck rating | [D-016](../DECISIONS.md#d-016). The record is evidence; it is not a grade |
