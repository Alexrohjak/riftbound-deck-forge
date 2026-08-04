import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  commitSnapshot,
  isUnchanged,
  type BackupEnv,
  type Snapshot,
} from "../src/backup.js";

/**
 * The backup's failure mode is not "it threw" — you would see that. It is "it ran nightly
 * for a month and the file was wrong", which you discover on the one day it matters. So
 * these tests are about **content and change detection**, not about GitHub's API.
 */

const COLLECTION = [
  { card_id: "ogn-030-298", quantity: 3 },
  { card_id: "ogn-202-298", quantity: 1 },
];
const DECKS = [
  {
    id: "main",
    name: "First deck",
    state: "DRAFT",
    legend_card_id: "ogn-301-298",
    chosen_champion_card_id: "ogn-030-298",
  },
];
const SLOTS = [
  { deck_id: "main", card_id: "ogn-004-298", zone: "MAIN", quantity: 3 },
  { deck_id: "other", card_id: "ogn-999-298", zone: "MAIN", quantity: 1 },
];

const snapshot = (takenAt = "2026-08-04T03:12:00.000Z") =>
  buildSnapshot(takenAt, COLLECTION, DECKS, SLOTS);

const MATCHES = [
  {
    id: "m1",
    deck_id: "main",
    deck_name: "Ahri Calm-Mind",
    deck_hash: "aaaaaaaaaaaaaaaa",
    played_at: "2026-08-01",
    opponent_legend: "ogn-002-298",
    opponent_note: null,
    result: "WIN",
    games: "2-1",
    symptoms: "[]",
    notes: null,
  },
];
const HISTORY = [
  { deck_id: "main", seq: 1, hash: "aaaaaaaaaaaaaaaa", contents: "{}", at: "2026-08-01 10:00:00" },
];

/**
 * The log is the part of the snapshot that cannot be reconstructed from anything else. A
 * collection can be re-entered from the boxes and a deck can be rebuilt from memory; a
 * record of what happened in a game on the 1st cannot.
 */
describe("the log in the snapshot", () => {
  it("carries matches and deck history", () => {
    const s = buildSnapshot("2026-08-04T03:12:00.000Z", COLLECTION, DECKS, SLOTS, MATCHES, HISTORY);
    expect(s.matches).toHaveLength(1);
    expect(s.matches[0]?.deck_hash).toBe("aaaaaaaaaaaaaaaa");
    expect(s.deckHistory[0]?.seq).toBe(1);
  });

  it("has no events field at all — crash noise is expendable by design", () => {
    const s = buildSnapshot("2026-08-04T03:12:00.000Z", COLLECTION, DECKS, SLOTS, MATCHES, HISTORY);
    expect(s).not.toHaveProperty("events");
  });

  it("defaults both to empty, so a caller that predates the log still builds", () => {
    const s = buildSnapshot("2026-08-04T03:12:00.000Z", COLLECTION, DECKS, SLOTS);
    expect(s.matches).toEqual([]);
    expect(s.deckHistory).toEqual([]);
  });

  it("announces the schema bump, so a restore knows what it is reading", () => {
    expect(snapshot().schema).toBe("forge.backup/2");
  });
});

describe("snapshot content", () => {
  it("writes the collection in the shape the restore endpoint accepts", () => {
    // PUT /collection takes `forge.collection/1`. If this drifts, restoring becomes a
    // migration written under pressure on the day the data is already gone.
    const { collection } = snapshot();
    expect(collection.schema).toBe("forge.collection/1");
    expect(collection.counts).toEqual({ "ogn-030-298": 3, "ogn-202-298": 1 });
    expect(collection.totals).toEqual({ printings: 2, copies: 4 });
  });

  it("keeps each deck's slots to that deck", () => {
    const [deck] = snapshot().decks;
    expect(deck?.slots).toEqual([{ cardId: "ogn-004-298", zone: "MAIN", quantity: 3 }]);
  });

  it("carries the singular fields, which are not slots", () => {
    const [deck] = snapshot().decks;
    expect(deck?.legendCardId).toBe("ogn-301-298");
    expect(deck?.chosenChampionCardId).toBe("ogn-030-298");
  });

  it("survives an empty database rather than writing nothing", () => {
    // The dangerous version of this bug writes an empty file over a good backup. It should
    // still be a *valid* snapshot that says, truthfully, that there was nothing.
    const empty = buildSnapshot("2026-08-04T03:12:00.000Z", [], [], []);
    expect(empty.collection.totals).toEqual({ printings: 0, copies: 0 });
    expect(empty.decks).toEqual([]);
  });
});

describe("change detection", () => {
  it("ignores the timestamp, so an unchanged night commits nothing", () => {
    const yesterday = JSON.stringify(snapshot("2026-08-03T03:12:00.000Z"));
    expect(isUnchanged(yesterday, snapshot("2026-08-04T03:12:00.000Z"))).toBe(true);
  });

  it("notices a real change", () => {
    const yesterday = JSON.stringify(snapshot());
    const changed = buildSnapshot("2026-08-04T03:12:00.000Z", [...COLLECTION, { card_id: "x", quantity: 1 }], DECKS, SLOTS);
    expect(isUnchanged(yesterday, changed)).toBe(false);
  });

  it("treats an unreadable previous file as changed, rather than skipping forever", () => {
    expect(isUnchanged("{ not json", snapshot())).toBe(false);
  });
});

/** A fetch stand-in that records calls and replays canned responses. */
function stubFetch(responses: Array<{ status: number; body?: unknown }>) {
  const calls: Array<{ url: string; method: string; body?: any }> = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    const next = responses.shift() ?? { status: 200, body: {} };
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => next.body,
      text: async () => JSON.stringify(next.body ?? ""),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

const ENV: BackupEnv = {
  DB: {} as never,
  GITHUB_TOKEN: "test-token",
  BACKUP_REPO: "owner/repo",
  BACKUP_BRANCH: "backups",
  BACKUP_PATH: "backups/forge-state.json",
};

describe("committing", () => {
  it("creates the file when it does not exist yet (404)", async () => {
    const { impl, calls } = stubFetch([{ status: 404 }, { status: 201, body: {} }]);
    expect(await commitSnapshot(ENV, snapshot(), impl)).toEqual({ status: "committed" });
    expect(calls[1]?.method).toBe("PUT");
    expect(calls[1]?.body.sha).toBeUndefined(); // no sha on create, or GitHub rejects it
  });

  it("passes the sha when replacing, and never commits to main", async () => {
    const previous = base64(JSON.stringify(snapshot("2026-08-01T03:12:00.000Z")));
    const changed = buildSnapshot("2026-08-04T03:12:00.000Z", [], DECKS, SLOTS);
    const { impl, calls } = stubFetch([
      { status: 200, body: { sha: "abc123", content: previous } },
      { status: 200, body: {} },
    ]);

    expect(await commitSnapshot(ENV, changed, impl)).toEqual({ status: "committed" });
    expect(calls[1]?.body.sha).toBe("abc123");
    // Build watch paths are `*`. A commit to main would redeploy the Worker every night.
    expect(calls[1]?.body.branch).toBe("backups");
    expect(calls[1]?.body.branch).not.toBe("main");
  });

  it("writes nothing when only the timestamp moved", async () => {
    const previous = base64(JSON.stringify(snapshot("2026-08-03T03:12:00.000Z")));
    const { impl, calls } = stubFetch([{ status: 200, body: { sha: "abc", content: previous } }]);

    expect(await commitSnapshot(ENV, snapshot(), impl)).toEqual({ status: "unchanged" });
    expect(calls).toHaveLength(1); // read only — no PUT
  });

  it("skips quietly when unconfigured, rather than throwing every night", async () => {
    // A cron that fails nightly is a cron whose failures you stop reading.
    const { impl, calls } = stubFetch([]);
    // Omit the key rather than set it undefined — `exactOptionalPropertyTypes` is on, and
    // "absent" is the state a Worker with no secret actually has.
    const { GITHUB_TOKEN: _unset, ...unconfigured } = ENV;
    const result = await commitSnapshot(unconfigured, snapshot(), impl);
    expect(result.status).toBe("skipped");
    expect(calls).toHaveLength(0);
  });

  it("throws on a genuine GitHub failure, so it shows up in the logs", async () => {
    const { impl } = stubFetch([{ status: 500, body: { message: "boom" } }]);
    await expect(commitSnapshot(ENV, snapshot(), impl)).rejects.toThrow(/GitHub read failed: 500/);
  });

  it("round-trips through base64 without mangling non-ASCII card names", async () => {
    // "Kai'Sa", "Rek'Sai", "Brynhir Thundersong" are fine; a UTF-8 name is not guaranteed
    // to be, and btoa alone throws on it. Worth pinning.
    const withName = buildSnapshot("2026-08-04T03:12:00.000Z", [{ card_id: "Aatrox — Ωmega", quantity: 1 }], [], []);
    const { impl, calls } = stubFetch([{ status: 404 }, { status: 201, body: {} }]);
    await commitSnapshot(ENV, withName, impl);
    const written = atob(calls[1]?.body.content) as string;
    const decoded = new TextDecoder().decode(Uint8Array.from(written, (c) => c.charCodeAt(0)));
    expect((JSON.parse(decoded) as Snapshot).collection.counts["Aatrox — Ωmega"]).toBe(1);
  });
});
