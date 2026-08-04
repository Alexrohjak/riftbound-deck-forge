import type { D1Database } from "@cloudflare/workers-types";

/**
 * X8 — the nightly backup.
 *
 * **Why not R2, which is the obvious answer.** An R2 bucket lives in the same Cloudflare
 * account as the D1 database it is backing up. That insures a bad write; it does not
 * insure losing the account. The data this protects is ~1,000 cards entered by hand over
 * an evening, so the insurance worth having is held by a *different vendor* — see
 * [D-051](../../../docs/DECISIONS.md#d-051).
 *
 * **The restore path is the one you already use.** The snapshot's `collection` field is
 * the same `forge.collection/1` shape `PUT /collection` accepts, so restoring is a load
 * rather than a migration — and it is exercised every time you save. A backup whose
 * restore path is never run is a backup you find out about at the worst moment.
 */

export interface BackupEnv {
  DB: D1Database;
  /** Fine-grained token, contents:write on this repo only. Set with `wrangler secret put`. */
  GITHUB_TOKEN?: string;
  /** "owner/repo". A var, not a secret — it is in the git remote already. */
  BACKUP_REPO?: string;
  /** Deliberately not `main` — see `commitSnapshot`. */
  BACKUP_BRANCH?: string;
  BACKUP_PATH?: string;
}

export const DEFAULTS = {
  branch: "backups",
  path: "backups/forge-state.json",
} as const;

export interface Snapshot {
  schema: "forge.backup/1";
  takenAt: string;
  collection: {
    schema: "forge.collection/1";
    totals: { printings: number; copies: number };
    counts: Record<string, number>;
  };
  decks: Array<{
    id: string;
    name: string;
    state: string;
    legendCardId: string | null;
    chosenChampionCardId: string | null;
    slots: Array<{ cardId: string; zone: string; quantity: number }>;
  }>;
}

interface CollectionRow {
  card_id: string;
  quantity: number;
}
interface DeckRow {
  id: string;
  name: string;
  state: string;
  legend_card_id: string | null;
  chosen_champion_card_id: string | null;
}
interface SlotRow {
  deck_id: string;
  card_id: string;
  zone: string;
  quantity: number;
}

/**
 * Assemble the snapshot from rows already read.
 *
 * Pure and separately tested: everything that could get the *content* wrong lives here,
 * where it needs no network and no database to check.
 */
export function buildSnapshot(
  takenAt: string,
  collection: CollectionRow[],
  decks: DeckRow[],
  slots: SlotRow[],
): Snapshot {
  const counts: Record<string, number> = {};
  let copies = 0;
  for (const row of collection) {
    counts[row.card_id] = row.quantity;
    copies += row.quantity;
  }

  return {
    schema: "forge.backup/1",
    takenAt,
    collection: {
      schema: "forge.collection/1",
      totals: { printings: collection.length, copies },
      counts,
    },
    decks: decks.map((deck) => ({
      id: deck.id,
      name: deck.name,
      state: deck.state,
      legendCardId: deck.legend_card_id,
      chosenChampionCardId: deck.chosen_champion_card_id,
      slots: slots
        .filter((slot) => slot.deck_id === deck.id)
        .map((slot) => ({ cardId: slot.card_id, zone: slot.zone, quantity: slot.quantity })),
    })),
  };
}

/** Read everything worth keeping. Ordered, so an unchanged database serialises identically. */
export async function readState(db: D1Database, takenAt: string): Promise<Snapshot> {
  const [collection, decks, slots] = await Promise.all([
    db.prepare("SELECT card_id, quantity FROM collection ORDER BY card_id").all<CollectionRow>(),
    db
      .prepare(
        "SELECT id, name, state, legend_card_id, chosen_champion_card_id FROM decks ORDER BY id",
      )
      .all<DeckRow>(),
    db
      .prepare("SELECT deck_id, card_id, zone, quantity FROM deck_slots ORDER BY deck_id, zone, card_id")
      .all<SlotRow>(),
  ]);

  return buildSnapshot(takenAt, collection.results, decks.results, slots.results);
}

/**
 * Everything in a snapshot except when it was taken.
 *
 * `takenAt` changes every night, so comparing whole files would commit an identical
 * backup daily — noise that buries the one diff you would ever want to read.
 */
export function isUnchanged(previous: string, next: Snapshot): boolean {
  try {
    const before = JSON.parse(previous) as Snapshot;
    return JSON.stringify({ ...before, takenAt: "" }) === JSON.stringify({ ...next, takenAt: "" });
  } catch {
    return false; // unreadable or absent — write a good one over it
  }
}

const GITHUB = "https://api.github.com";

/** GitHub's contents API returns base64 with newlines; and the Worker has no Buffer. */
const decodeBase64 = (content: string): string => atob(content.replace(/\n/g, ""));
const encodeBase64 = (text: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)));

export interface CommitResult {
  status: "committed" | "unchanged" | "skipped";
  reason?: string;
}

/**
 * Commit the snapshot, but only when its content differs.
 *
 * ⚠️ **Never to `main`.** Build watch paths on this Worker are `*`, so a commit to `main`
 * would trigger a Workers Build and redeploy the Worker every night — burning free-tier
 * build minutes to deploy a byte-identical Worker. A dedicated branch also keeps the code
 * history readable.
 */
export async function commitSnapshot(
  env: BackupEnv,
  snapshot: Snapshot,
  fetchImpl: typeof fetch = fetch,
): Promise<CommitResult> {
  const token = env.GITHUB_TOKEN;
  const repo = env.BACKUP_REPO;
  if (!token || !repo) {
    // Loud in the logs, but not an exception: a Worker whose cron throws every night is a
    // Worker whose alerts you learn to ignore.
    return { status: "skipped", reason: "GITHUB_TOKEN or BACKUP_REPO is not configured" };
  }

  const branch = env.BACKUP_BRANCH ?? DEFAULTS.branch;
  const path = env.BACKUP_PATH ?? DEFAULTS.path;
  const url = `${GITHUB}/repos/${repo}/contents/${path}`;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "user-agent": "forge-backup",
    "content-type": "application/json",
  };

  const existing = await fetchImpl(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  let sha: string | undefined;
  if (existing.ok) {
    const body = (await existing.json()) as { sha?: string; content?: string };
    sha = body.sha;
    if (body.content && isUnchanged(decodeBase64(body.content), snapshot)) {
      return { status: "unchanged" };
    }
  } else if (existing.status !== 404) {
    throw new Error(`GitHub read failed: ${existing.status} ${await existing.text()}`);
  }

  const written = await fetchImpl(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Backup ${snapshot.takenAt} — ${snapshot.collection.totals.printings} printings, ${snapshot.decks.length} deck(s)`,
      content: encodeBase64(`${JSON.stringify(snapshot, null, 1)}\n`),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!written.ok) {
    throw new Error(`GitHub write failed: ${written.status} ${await written.text()}`);
  }
  return { status: "committed" };
}

/** The cron entry point. */
export async function runBackup(
  env: BackupEnv,
  takenAt: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CommitResult> {
  const snapshot = await readState(env.DB, takenAt);
  const result = await commitSnapshot(env, snapshot, fetchImpl);
  console.log(
    `[backup] ${result.status}${result.reason ? ` — ${result.reason}` : ""}: ` +
      `${snapshot.collection.totals.printings} printings, ${snapshot.collection.totals.copies} copies, ${snapshot.decks.length} deck(s)`,
  );
  return result;
}
