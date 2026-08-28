import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * **Both consumers must actually ask for the ownership checks.**
 *
 * ⚠️ This test exists because the drift it prevents actually happened, and it was invisible
 * from the outside. `checkLegality` gates L26/L27 on `options.ownership` existing at all
 * (`legality/index.ts`), so a call that omits it does not fail — it silently drops the two
 * checks from `checked` and reports **"31 of 33"**, which reads exactly like a documented
 * coverage limit rather than a bug.
 *
 * The browser passed ownership from the start. The CLI parsed `--collection`, used it for
 * `brief` / `skeletons` / `sideboard`, and then called `checkLegality(deck, index)` with no
 * options — so every headless legality answer was ownership-blind while looking complete.
 *
 * The second half is worse, and is what this file is really guarding. Ownership *without*
 * commitment reports every copy sleeved into a `BUILT` deck as available — **sideboards
 * included**, since a sideboard card is physically present (DATA-MODEL §4). That answer is
 * not incomplete, it is confidently wrong in the one direction that costs a deck at the
 * table: it tells you to build something you cannot build.
 *
 * `D-047`'s argument again — two implementations means one of them is wrong, and it is the
 * one nobody ran.
 */

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const read = (p: string) => readFileSync(here(p), "utf8");

const CLI = "../../../apps/cli/src/index.ts";
const API_COMMITMENTS = "../../../apps/api/src/commitments.ts";
const WEB = "../../../apps/web/src/App.tsx";

describe("ownership reaches checkLegality (L26/L27)", () => {
  it.each([
    ["the CLI", CLI],
    ["the browser", WEB],
  ])("%s passes an ownership context to checkLegality", (_who, path) => {
    const source = read(path);
    // The call and the context have to appear together; `checkLegality(deck, index)` alone
    // is the exact shape that dropped the checks.
    expect(source).toMatch(/checkLegality\([\s\S]{0,400}ownership/);
  });

  it("the CLI supplies commitments, not just a collection", () => {
    const source = read(CLI);
    expect(source).toContain("--commitments");
    // Without excluding the deck's own holdings, a BUILT deck conflicts with itself.
    expect(source).toContain("committedByPrinting");
  });

  it("the CLI derives holdings through the engine rather than re-walking decks", () => {
    const source = read(CLI);
    expect(source).toContain("holdingsOf");
  });
});

describe("commitment counts every zone that holds cardboard", () => {
  it("the API's commitments query excludes runes and nothing else", () => {
    const sql = read(API_COMMITMENTS);
    expect(sql).toContain("s.zone != 'RUNE'");
    // The regression: a query that also dropped the sideboard would free 10 sleeved cards
    // per built deck without changing a single visible number.
    expect(sql).not.toMatch(/zone\s*!=\s*'SIDEBOARD'/);
    expect(sql).not.toMatch(/zone\s*=\s*'MAIN'/);
  });

  it("the API still counts the Legend and Chosen Champion, which live in their own columns", () => {
    const sql = read(API_COMMITMENTS);
    expect(sql).toContain("chosen_champion_card_id");
    expect(sql).toContain("legend_card_id");
  });
});
