import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * **Both consumers must map the card index through `cardFactsFrom`.**
 *
 * ⚠️ This test exists because the drift it prevents actually happened, in the seam it was
 * most expensive in. The browser and the CLI each hand-built the mapping from
 * `cards.json` to `CardFacts`, and the CLI's quietly omitted **`power`, `role` and
 * `timing`**. Nothing threw. What changed was only the answers:
 *
 * - 374 of 814 cards read at the wrong cost, so a 3-Energy / 1-Power card looked like a
 *   3-drop and never appeared in a search for cards costing 4 or more
 * - `cheap Might swing` reported **0** owned cards in an identity holding **10**
 * - `spot removal` reported **12** where the answer was **41**
 *
 * A comment saying "keep these in sync" was not going to hold, for the same reason
 * `route-coverage.test.ts` exists: a comment is not a control. `D-047`'s whole argument is
 * that two implementations means one of them is wrong and it is the one nobody ran.
 */

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const CONSUMERS = [
  ["the browser", "../../../apps/web/src/cards.ts"],
  ["the CLI", "../../../apps/cli/src/index.ts"],
] as const;

/** The shape of a hand-rolled mapping: assigning card facts key-by-key from a raw card. */
const HAND_ROLLED = /superTypes:\s*card\.|superTypes:\s*\(?raw/;

describe("one card mapping, two consumers (D-047)", () => {
  it.each(CONSUMERS)("%s builds card facts through cardFactsFrom", (_who, path) => {
    const source = readFileSync(here(path), "utf8");
    expect(source).toContain("cardFactsFrom");
  });

  it.each(CONSUMERS)("%s does not hand-roll the mapping alongside it", (_who, path) => {
    const source = readFileSync(here(path), "utf8");
    // ⚠️ Matches the *assignment* form, not the word — a comment explaining the history is
    // fine and a second implementation is not.
    expect(HAND_ROLLED.test(source)).toBe(false);
  });

  it("catches a reintroduced hand-rolled mapping, so this test cannot go vacuous", () => {
    expect(HAND_ROLLED.test("facts[id] = { name: card.name, superTypes: card.superTypes };")).toBe(
      true,
    );
  });
});
