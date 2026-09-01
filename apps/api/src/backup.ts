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
  /**
   * ⚠️ Bumped from `/1` when the log arrived. Additive only — the two new arrays default to
   * empty, so a `/1` file still restores exactly as it did.
   */
  schema: "forge.backup/2";
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
  /**
   * Games played. **Irreplaceable** — a collection can be re-entered from the boxes and a
   * deck can be rebuilt, but a record of what happened cannot be reconstructed from
   * anything. It is the single most valuable thing in the snapshot.
   */
  matches: MatchRow[];
  /** What each deck looked like over time, so a match can still name the build it was. */
  deckHistory: DeckHistoryRow[];
}

/** ⚠️ `events` are deliberately absent — crash noise is expendable by design (LOG §3). */

export interface MatchRow {
  id: string;
  deck_id: string | null;
  deck_name: string | null;
  deck_hash: string | null;
  played_at: string;
  /** The shape of the table (D-066). Null reads as `1v1`. */
  format: string | null;
  opponent_legend: string | null;
  opponent_note: string | null;
  result: string;
  games: string | null;
  symptoms: string | null;
  notes: string | null;
}

export interface DeckHistoryRow {
  deck_id: string;
  seq: number;
  hash: string;
  contents: string;
  at: string;
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
  matches: MatchRow[] = [],
  deckHistory: DeckHistoryRow[] = [],
): Snapshot {
  const counts: Record<string, number> = {};
  let copies = 0;
  for (const row of collection) {
    counts[row.card_id] = row.quantity;
    copies += row.quantity;
  }

  return {
    schema: "forge.backup/2",
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
    matches,
    deckHistory,
  };
}

/** Read everything worth keeping. Ordered, so an unchanged database serialises identically. */
export async function readState(db: D1Database, takenAt: string): Promise<Snapshot> {
  const [collection, decks, slots, matches, history] = await Promise.all([
    db.prepare("SELECT card_id, quantity FROM collection ORDER BY card_id").all<CollectionRow>(),
    db
      .prepare(
        "SELECT id, name, state, legend_card_id, chosen_champion_card_id FROM decks ORDER BY id",
      )
      .all<DeckRow>(),
    db
      .prepare("SELECT deck_id, card_id, zone, quantity FROM deck_slots ORDER BY deck_id, zone, card_id")
      .all<SlotRow>(),
    db.prepare("SELECT * FROM matches ORDER BY played_at, id").all<MatchRow>(),
    db
      .prepare("SELECT deck_id, seq, hash, contents, at FROM deck_history ORDER BY deck_id, seq")
      .all<DeckHistoryRow>(),
  ]);

  return buildSnapshot(
    takenAt,
    collection.results,
    decks.results,
    slots.results,
    matches.results,
    history.results,
  );
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

/**
 * GitHub's contents API returns base64 with newlines; and the Worker has no Buffer.
 *
 * ⚠️ **Both directions cross the UTF-8 boundary explicitly, and neither may spread.**
 * `atob`/`btoa` speak *bytes*, not text, and a snapshot is not ASCII — deck names carry
 * em-dashes. Two separate failures came out of the one-line versions these replaced:
 *
 * 1. **The nightly backup stopped, silently, for five nights.**
 *    `String.fromCharCode(...bytes)` passes every byte as its own argument, so it throws
 *    `RangeError: Maximum call stack size exceeded` once the snapshot passes roughly
 *    125 kB. `deck_history` grew from 25 rows to 87 in one evening's deckbuilding and took
 *    the snapshot from 78 kB to 197 kB — the cron kept firing and kept throwing, and the
 *    only visible symptom was a backup branch that stopped moving. The threshold is a
 *    function of *data*, so no fixture smaller than a real snapshot would ever have found
 *    it. Chunked below the argument limit, it has no size ceiling worth stating.
 *
 * 2. **`isUnchanged` never matched, so every night committed a byte-identical file.**
 *    Decoding with bare `atob` yields one character per *byte*, so a stored em-dash came
 *    back as three mojibake characters and never equalled the snapshot it was compared
 *    against. Decoding through `TextDecoder` is what makes that comparison mean anything.
 */
const CHUNK = 0x2000;
const decodeBase64 = (content: string): string =>
  new TextDecoder().decode(
    Uint8Array.from(atob(content.replace(/\n/g, "")), (c) => c.charCodeAt(0)),
  );
const encodeBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

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
      message: `Backup ${snapshot.takenAt} — ${snapshot.collection.totals.printings} printings, ${snapshot.decks.length} deck(s), ${snapshot.matches.length} match(es)`,
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
      `${snapshot.collection.totals.printings} printings, ${snapshot.collection.totals.copies} copies, ${snapshot.decks.length} deck(s), ${snapshot.matches.length} match(es)`,
  );
  return result;
}
