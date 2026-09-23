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
    plan: '{"origin":"slow-hold","pace":"slow","objective":"hold"}',
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
    format: "1v1",
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
    // The format travels too. Restoring a match without it would silently re-read a
    // three-way pod as a heads-up game, which is worse than losing the row (D-066).
    expect(s.matches[0]?.format).toBe("1v1");
    expect(s.deckHistory[0]?.seq).toBe(1);
  });

  it("has no events field at all — crash noise is expendable by design", () => {
    const s = buildSnapshot("2026-08-04T03:12:00.000Z", COLLECTION, DECKS, SLOTS, MATCHES, HISTORY);
    expect(s).not.toHaveProperty("events");
  });

  it("carries game plans, which nothing else in the snapshot could rebuild (D-067)", () => {
    const plan = { deck_id: "d1", body: '{"schema":"forge.gameplan/1"}', updated_at: "2026-09-23 12:00:00" };
    const s = buildSnapshot("2026-09-23T03:12:00.000Z", COLLECTION, DECKS, SLOTS, [], [], [plan]);
    expect(s.gameplans).toEqual([plan]);
    expect(buildSnapshot("2026-09-23T03:12:00.000Z", COLLECTION, DECKS, SLOTS).gameplans).toEqual([]);
  });

  it("defaults both to empty, so a caller that predates the log still builds", () => {
    const s = buildSnapshot("2026-08-04T03:12:00.000Z", COLLECTION, DECKS, SLOTS);
    expect(s.matches).toEqual([]);
    expect(s.deckHistory).toEqual([]);
  });

  /**
   * ⚠️ The regression this file did not catch for five weeks. `plan` arrived in
   * `migrations/001-deck-plan.sql` and neither the query nor this fixture followed it, so
   * every nightly snapshot restored plan-less decks and every test agreed. D-064 makes the
   * plan the thing a deck is built *to*; losing it turns a deck back into a pile.
   */
  it("carries each deck's plan, because a deck without one is a pile", () => {
    const s = snapshot();
    expect(s.decks[0]?.plan).toBe('{"origin":"slow-hold","pace":"slow","objective":"hold"}');
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

/**
 * What GitHub actually stores: base64 over UTF-8 **bytes**.
 *
 * ⚠️ This used to be `btoa(String.fromCharCode(...encode(text)))`, which is the same
 * one-liner the source had — so the fixture reproduced the bug it was meant to catch and
 * every change-detection test agreed with a broken decoder.
 */
const base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x2000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  }
  return btoa(binary);
};

/** Read back what was PUT, the way GitHub would hand it to the next night's run. */
const fromBase64 = (content: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(content), (c) => c.charCodeAt(0)));

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
    const decoded = fromBase64(calls[1]?.body.content);
    expect((JSON.parse(decoded) as Snapshot).collection.counts["Aatrox — Ωmega"]).toBe(1);
  });

  /**
   * ⚠️ **The size is the point, and it is why a month of green tests meant nothing.**
   * Encoding by spreading every byte into `String.fromCharCode` throws
   * `RangeError: Maximum call stack size exceeded` past roughly 125 kB. The real snapshot
   * crossed that line when `deck_history` went from 25 rows to 87 in one evening — 78 kB
   * to 197 kB — and the nightly backup then threw for five consecutive nights while every
   * fixture here, all of them a few hundred bytes, kept passing.
   */
  it("commits a snapshot far past the call-argument limit", async () => {
    const history = Array.from({ length: 90 }, (_, seq) => ({
      deck_id: "main",
      seq,
      hash: `hash-${seq}`,
      contents: JSON.stringify({
        slots: Array.from({ length: 60 }, (_, i) => ({
          cardId: `ogn-${String(i).padStart(3, "0")}-298`,
          zone: "MAIN",
          quantity: 3,
        })),
      }),
      at: "2026-08-31T00:00:00.000Z",
    }));
    const big = buildSnapshot("2026-08-31T03:12:00.000Z", COLLECTION, DECKS, SLOTS, [], history);
    expect(JSON.stringify(big).length).toBeGreaterThan(200_000);

    const { impl, calls } = stubFetch([{ status: 404 }, { status: 201, body: {} }]);
    expect(await commitSnapshot(ENV, big, impl)).toEqual({ status: "committed" });
    expect((JSON.parse(fromBase64(calls[1]?.body.content)) as Snapshot).deckHistory).toHaveLength(
      90,
    );
  });

  /**
   * ⚠️ Change detection reads the *stored* file back, and a bare `atob` returns one
   * character per byte — so a stored em-dash came back as three and never equalled itself.
   * Every night committed a byte-identical file, which is the quiet half of the same bug.
   */
  it("recognises an unchanged snapshot that contains non-ASCII", async () => {
    const counts = [{ card_id: "Aatrox — Ωmega", quantity: 1 }];
    const previous = base64(JSON.stringify(buildSnapshot("2026-08-03T03:12:00.000Z", counts, [], [])));
    const { impl, calls } = stubFetch([{ status: 200, body: { sha: "abc", content: previous } }]);

    const tonight = buildSnapshot("2026-08-04T03:12:00.000Z", counts, [], []);
    expect(await commitSnapshot(ENV, tonight, impl)).toEqual({ status: "unchanged" });
    expect(calls).toHaveLength(1); // read only — no PUT
  });
});
