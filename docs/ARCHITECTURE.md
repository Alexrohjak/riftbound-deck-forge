# Architecture — Forge

> The `D3` output: the stack, where it runs, what it costs, and why. **Every cost figure here
> was verified against vendor documentation on 2026-08-03** — see §5.
>
> **Created:** 2026-08-03 · **Status:** decided. `D3` complete → `DESIGN LOCKED` lifts
>
> **Navigation:** [`ROADMAP.md`](ROADMAP.md) (status) · [`PLAN.md`](PLAN.md) (milestones) ·
> [`DECISIONS.md`](DECISIONS.md) ([D-047](DECISIONS.md#d-047)–[D-049](DECISIONS.md#d-049)) ·
> [`spec/DATA-MODEL.md`](spec/DATA-MODEL.md)

---

## 1. The shape

```
     ┌──────────────────────────────────────────────────────┐
     │  packages/engine  ·  TypeScript, pure, no I/O        │
     │  legality (33 checks) · rules core · analysis        │
     └───────────────┬──────────────────────┬───────────────┘
                     │ imported             │ imported
        ┌────────────┴──────────┐   ┌───────┴────────────────┐
        │ apps/web              │   │ apps/cli               │
        │ React + Vite, static  │   │ EE's tool surface      │
        │ PHONE + DESKTOP       │   │ CALLED BY CLAUDE CODE  │
        └────────────┬──────────┘   └────────────────────────┘
                     │ fetch                    runs locally,
        ┌────────────┴──────────┐               never deployed
        │ apps/api · one Worker │
        │  ↕ D1 (SQLite)        │
        └───────────────────────┘

     deployed: apps/web (static) + apps/api (edge function) + D1
     not deployed: the engine, the CLI, the card data pipeline
```

**Two consumers, one engine.** That is the whole architecture. Everything else follows.

## 2. Why one language, and why the engine is a package ⭐

This is the load-bearing decision ([D-047](DECISIONS.md#d-047)), and it comes from a collision
between two existing decisions:

| Requirement | Source | Where the rules must run |
|---|---|---|
| Legality and counts are **live on screen** — they are state, not advice | [D-042](DECISIONS.md#d-042) | **In the browser**, on every edit |
| EE answers **headlessly**, called by Claude Code | [D-043](DECISIONS.md#d-043) | **On the desktop**, outside any browser |

The same 33 legality checks are needed in both places. Implementing them twice — once in the
web app, once in whatever the engine is written in — means **two implementations of the
highest-correctness-risk component in the project**, drifting against each other.
[`W1` is already flagged as the place everything downstream trusts](PLAN.md); giving it two
bodies would be the worst available choice.

So: **one TypeScript package, imported by both.** The engine is pure — no network, no
filesystem, no DOM — which is also what makes the rulebook fixtures ([`S1a`](ROADMAP.md))
trivial to run.

> **This is why the stack is TypeScript rather than Python**, despite the card-data tooling
> already being Python. Python cannot run in the browser without dragging in Pyodide, and the
> live-legality requirement is non-negotiable. The Python in `tools/` stays — it is a **build
> step**, not runtime, and build steps have no such constraint.

## 3. Stack

| Layer | Choice | Why this, and not the obvious alternative |
|---|---|---|
| **Language** | TypeScript | §2. One implementation of the rules |
| **Web app** | React + Vite, static SPA | **Not Next.js.** Next's value is server rendering; §4 says there is no server. It would add a runtime to host for a benefit a single-user tool cannot use |
| **Styling** | Plain CSS with custom properties | The [`D2` prototype](design/D2-workbench-prototype.html) is already written this way and it holds up. A framework would be re-solving a solved problem |
| **State API** | One Cloudflare Worker | The whole API is *read my state* / *write my state*. It does not warrant a framework |
| **Database** | **Cloudflare D1** (SQLite) | **Not Workers KV** — see §4.2. Consistency decides it |
| **Engine** | `packages/engine`, pure TS | §2 |
| **EE's tools** | `apps/cli`, a local binary | Claude Code shells out to it. **Not MCP yet** — a CLI is the smaller thing that satisfies [`S6`](PLAN.md), and an MCP wrapper over the same package is a later, cheap addition if the CLI proves clunky |
| **Card data** | Static asset, built by the existing Python | `cards-index.json` is 372 KB and changes ~quarterly. It ships with the bundle; it is not database rows |
| **Repo** | npm workspaces, one repo | Three packages. Nx or Turborepo would be tooling in search of a problem |

## 4. Where it runs — and the answer to A6

> **A6 asked:** *"hosted, always-on" was recorded as convention, not fact. A permanently-online
> service for exactly one user was never justified.*

**A6 is upheld. There is no always-on server** — and there is also no local-only option, because
[D-018](DECISIONS.md#d-018) requires full editing parity from a phone, away from home
([D-012](DECISIONS.md#d-012)).

The resolution is that *"reachable from anywhere"* and *"a server I keep running"* were being
treated as the same thing, and they are not:

| What runs | Idle cost | Idle compute |
|---|---|---|
| Static bundle on a CDN | £0 | none — files |
| One edge function, invoked per request | £0 | none between requests |
| Managed SQLite | £0 | none |

**Nothing is running when you are not using Forge.** No VM, no container, no process to
restart, no security patching cadence, nothing to wake up to a bill for. The audit's instinct
was right — what it caught was the word *"always-on"*, and the correct fix is not to abandon
hosting but to host something that **has no idle state at all.**

### 4.1 Why Cloudflare

Two constraints picked the vendor almost by themselves. The repo is private
([D-011](DECISIONS.md#d-011)), which is what ruled GitHub Pages out at `D2`. And the docs
question ([X5](ROADMAP.md)) wanted a host anyway — *"decide this together with app hosting; one
host can serve both, and picking twice is waste."*

Cloudflare deploys **private** repositories on the free plan, and one account covers the app,
the API, the database, the access control and the docs. **X5 resolves as a side effect** rather
than as a separate decision.

### 4.2 D1, not KV — consistency decides it

The tempting answer was a JSON blob in Workers KV. It is wrong here:

| | Workers KV | **Cloudflare D1** |
|---|---|---|
| Consistency | **Eventually consistent — writes take up to 60 s to propagate** | **Strongly consistent** |
| Free writes/day | 1,000 | **100,000** |
| Free reads/day | 100,000 | 5,000,000 rows |
| Free storage | 1 GB | 5 GB |
| Shape | Opaque blob | SQL — matches [`DATA-MODEL.md`](spec/DATA-MODEL.md) entities directly |

**The 60 seconds is the disqualifier.** The core journey is *edit on the phone at a shop, open
the desktop at home* — and a store that can serve a minute-old version of your collection turns
"where did that card go?" into a real bug on the one axis
([ownership, D-015](DECISIONS.md#d-015)) the whole product is organised around.

KV's 1,000 writes/day would also have forced write-debouncing to be a correctness concern
rather than a courtesy. D1's budget makes it a non-issue.

### 4.3 Access control

**Cloudflare Access** in front of both the app and the API — Google or GitHub sign-in, free for
up to 50 users, and **zero application code.** Forge never sees a password, stores no
credentials, and has no session logic to get wrong.

This is the single highest-leverage choice in the document. Hand-rolled auth for a one-user app
is pure downside risk: it is the classic place a personal project leaks, and there is nothing to
gain by owning it.

## 5. What it costs — verified 2026-08-03

| Service | Free tier | What Forge needs | Headroom |
|---|---|---|---|
| **Pages** | 500 builds/mo · 20,000 files · 25 MiB/file · unmetered bandwidth | ~20 builds/mo · ~50 files · largest asset 1.1 MB | ~25× on builds |
| **Workers** | 100,000 requests/day | Hundreds on a heavy day | ~100× |
| **D1** | 100,000 row-writes/day · 5 M row-reads/day · 5 GB | A long deckbuilding session is thousands of writes at most; total data is **kilobytes** | ~1,000,000× on storage |
| **Access** | 50 users | 1 | 50× |
| **Total** | | | **£0/month** |

**The honest read on those numbers:** Forge is roughly three orders of magnitude below every
limit that matters. This is not a plan that free tiers barely accommodate — it is a plan whose
resource use rounds to zero, which is the correct shape for one person's card collection.

> ⚠️ **The risk is terms changing, not usage growing.** Free tiers are a commercial decision
> someone else makes. **Mitigation:** everything here is portable — a static bundle, one small
> function, and SQLite. D1 exports to a `.sql` file. If Cloudflare's terms change, the app moves
> to any static host and the database becomes a file. **Nothing in §3 is a lock-in.**

## 6. Data — what lives where

| Data | Size | Home | Backup |
|---|---|---|---|
| **Collection** — what you own | ~10 KB | D1 | Export JSON ([`schema forge.collection/1`](../tools/collection/README.md)), already implemented |
| **Decks** + bench | ~50 KB | D1 | Same export |
| **Card data** | 372 KB index (1.1 MB source) | **Static asset**, versioned in git | It *is* the backup — committed |
| **Errata + ban overlay** | ~2 KB | Static asset, hand-maintained | Committed |
| **Rules fixtures** | — | Test files | Committed |

**The split that matters: mutable data is measured in kilobytes; everything large is
immutable and ships with the build.** That is what makes §5's headroom real rather than
optimistic.

**Backup is not a feature to build later.** The collection tool's export already produces the
canonical format, and [`DATA-MODEL.md` §6](spec/DATA-MODEL.md) specifies portability. `F1`
wires a scheduled export; until then the manual one is genuine.

## 7. Offline, and a correction to D-018

[D-018](DECISIONS.md#d-018) claimed that because there is one app rather than two synchronised
surfaces, **"no sync-conflict or merge logic is needed."** That is true only while the app
always talks to the server. **An offline-editing PWA breaks it** — edit a deck on the phone in
a basement, edit the same deck at home, and there are two divergent versions with no rule for
combining them.

**Decided ([D-049](DECISIONS.md#d-049)): editing requires connectivity. Offline is read-only.**

- **Offline you can look** — decks, collection and full card data are service-worker cached.
  The "at a shop, no signal, what's in this deck?" case works
- **Offline you cannot edit** — the affordances disable, with a plain reason, never a silent
  failure or a lost edit
- D-018's conclusion survives intact: **still no merge logic**, because there is still exactly
  one writable copy

> **The cost, named.** D-018's reason for phone parity was *"I learn new things while playing."*
> A shop with no signal is exactly when that happens, and this decision says: capture it in the
> app when you have signal, on paper when you don't. **If that bites, the fix is a per-deck
> version counter and a queued-writes flow** — deferred with a trigger, the same way
> [`S1b`](ROADMAP.md) defers chains. Not built on speculation.

## 8. What this rules out

Recording these so they are not silently reopened:

| Ruled out | Why |
|---|---|
| Next.js, Remix, any SSR framework | §4 — nothing to server-render for; adds a runtime with no idle-free story |
| Postgres / Supabase / any always-on DB | §4 — idle cost and idle surface for kilobytes of data |
| Hand-rolled authentication | §4.3 — pure downside risk |
| Python for the rules engine | §2 — cannot serve live in-browser legality |
| A second legality implementation | §2 — the reason the architecture exists |
| Offline editing, for now | §7 — deferred with a named trigger |
| Local-only / LAN-only | [D-012](DECISIONS.md#d-012) — must work away from home |

## 9. Open items → `F1`

Deliberately not decided here; none blocks `DESIGN LOCKED`:

| # | Item | Decide at |
|---|---|---|
| **X6** | Custom domain, or is `forge.pages.dev` enough? Cosmetic and reversible | `F1` |
| **X7** | Does the docs site share the app's Pages project or get its own? One build vs one URL | `F1` |
| **X8** | Scheduled D1 → JSON backup: Cron Trigger, or a manual export that is genuinely done | `F1` |
| **X9** | Whether `apps/cli` gains an MCP wrapper | `S6`, on evidence |

---

*Stack chosen and justified; indefinite running cost verified at £0/month with named portability.
`D3` is complete — [`DESIGN LOCKED`](PLAN.md) lifts.*
