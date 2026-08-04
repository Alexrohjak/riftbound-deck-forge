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
| `opponent_legend` | Their Legend's `card_id`, when you know it. Null is a real answer |
| `opponent_note` | Free text — *"Yasuo aggro, splashing Order"* |
| `result` | `WIN` / `LOSS` / `DRAW` |
| `games` | *"2-1"*, when a match was several games. Null when it was one |
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
2. **Never carries card or deck data.** It is already in the database, and copying it into
   crash noise makes the noise big without making it informative.
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
