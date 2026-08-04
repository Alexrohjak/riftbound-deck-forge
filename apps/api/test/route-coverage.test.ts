import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * **Every route the Worker answers must be listed in `run_worker_first`.**
 *
 * The Worker serves the app as well as the API (D-050), and the asset router runs first for
 * anything not on that list. A missing entry does not error — the SPA fallback returns
 * `index.html` with a 200, so a `POST` appears to succeed against an HTML page and the data
 * is silently discarded.
 *
 * ⚠️ This test exists because a comment warning about exactly this failure was already in
 * `wrangler.toml`, and the log routes were added without updating the list anyway. A comment
 * is not a control.
 */

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const config = readFileSync(here("../wrangler.toml"), "utf8");
const router = readFileSync(here("../src/index.ts"), "utf8");

/** The literal paths the router compares against, e.g. `pathname === "/matches"`. */
const exact = [...router.matchAll(/pathname === "(\/[^"]*)"/g)].map((m) => m[1]!);
/** Prefix matches, e.g. `pathname.startsWith("/decks/")`. */
const prefixes = [...router.matchAll(/pathname\.startsWith\("(\/[^"]*)"\)/g)].map((m) => m[1]!);

const listed = (() => {
  const block = /run_worker_first\s*=\s*\[([\s\S]*?)\]/.exec(config);
  return block ? [...block[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!) : [];
})();

/** `"/decks/*"` covers `/decks/` and everything under it. */
const covers = (pattern: string, path: string) =>
  pattern.endsWith("/*") ? path.startsWith(pattern.slice(0, -1)) : pattern === path;

describe("the Worker actually receives the routes it implements", () => {
  it("finds routes in both files, so a rename cannot make this test vacuous", () => {
    expect(exact.length).toBeGreaterThan(2);
    expect(listed.length).toBeGreaterThan(2);
  });

  it.each([...new Set(exact)])("serves %s from the Worker, not the SPA fallback", (path) => {
    expect(listed.some((pattern) => covers(pattern, path))).toBe(true);
  });

  it.each([...new Set(prefixes)])("serves %s* from the Worker, not the SPA fallback", (prefix) => {
    expect(listed.some((pattern) => covers(pattern, prefix))).toBe(true);
  });

  it("keeps the SPA fallback, which is what makes the list necessary", () => {
    expect(config).toContain("single-page-application");
  });
});
