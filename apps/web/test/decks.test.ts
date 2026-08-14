import { describe, expect, it } from "vitest";
import { readDecks } from "../src/Decks.js";

/**
 * ⚠️ **The bug this pins is a failure that looked like an answer.** The deck list used to
 * `catch` every error into an empty array, so "your sign-in expired" and "you have no decks"
 * rendered as the same empty shelf. One expired Cloudflare Access session then read as data
 * loss for three days.
 *
 * The nasty case is not an error at all: Access answers an unauthenticated request with a
 * `302` to its login page, `fetch` follows it, and the reply arrives as **HTTP 200 carrying
 * HTML**. Every status check passes. Only the content type gives it away.
 */

const JSON_TYPE = "application/json; charset=utf-8";

describe("reading the deck list", () => {
  it("returns the decks when the server actually answered", () => {
    const body = { decks: [{ id: "a" }, { id: "b" }] };
    const result = readDecks(200, JSON_TYPE, body);
    expect(result.ok).toBe(true);
    expect(result.ok && result.decks).toHaveLength(2);
  });

  it("⚠️ treats a 200 of HTML as a lapsed sign-in, not as an empty shelf", () => {
    const result = readDecks(200, "text/html; charset=utf-8", null);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.why).toBe("your sign-in has expired");
  });

  it("an empty list is a real answer and must stay distinguishable from a failure", () => {
    const result = readDecks(200, JSON_TYPE, { decks: [] });
    expect(result.ok).toBe(true);
    expect(result.ok && result.decks).toEqual([]);
  });

  it("names the status rather than swallowing it", () => {
    expect(readDecks(500, JSON_TYPE, null)).toEqual({ ok: false, why: "the server said 500" });
  });

  it("calls 401 and 403 what they are, since the fix is different", () => {
    expect(readDecks(401, JSON_TYPE, null)).toEqual({ ok: false, why: "you are signed out" });
    expect(readDecks(403, JSON_TYPE, null)).toEqual({ ok: false, why: "you are signed out" });
  });

  it("refuses a well-formed reply that is missing the decks", () => {
    // A JSON body with no `decks` array would otherwise spread into `undefined` and render
    // as nothing — the same empty shelf by a different route.
    expect(readDecks(200, JSON_TYPE, {}).ok).toBe(false);
    expect(readDecks(200, JSON_TYPE, null).ok).toBe(false);
  });
});
