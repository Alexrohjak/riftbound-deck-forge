# Forge — backups

**Machine-written. Do not edit by hand, and do not merge this branch into `main`.**

`forge-state.json` is a nightly snapshot of the Forge D1 database, committed by the
`scheduled` handler in `apps/api/src/backup.ts` at 03:12 UTC. It appears here **only when
the content changed** — an unchanged night leaves no commit, so every commit on this
branch is a real change to the collection or a deck.

This branch is an **orphan**: it shares no history with `main`, so backups never mix with
the code, and a commit here never triggers a Workers Build.

## Why the snapshot is here rather than in R2

An R2 bucket would live in the same Cloudflare account as the database it backs up, so it
would not survive losing the account — and Cloudflare's Time Travel already covers a bad
write for 7 days on the free plan. See `docs/DECISIONS.md#d-051` on `main`.

## Restoring

The `collection` field is exactly the `forge.collection/1` shape that `PUT /collection`
accepts, so a restore is a load rather than a migration:

```bash
jq '.collection' backups/forge-state.json > restore.json
curl -X PUT https://forge.alexander-rohde-jakobsen.workers.dev/collection \
     -H 'content-type: application/json' --data @restore.json
```
