import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEntry } from "../src/AddCards.js";
import { buildPool } from "../src/cards.js";

/**
 * The entry parser against the **real** index, rather than a fixture.
 *
 * ⚠️ **This exists because a fixture cannot catch the bug it was written for.** The six
 * `VEN-SP` promo Champions had no input that reached them — `SP3` did not parse, and `3`
 * was padded into `VEN-003`, a different card, registered without complaint. Every unit
 * test passed throughout, because every fixture used the code shape the parser already
 * handled. Only the shipped card data contains the shapes nobody thought of.
 *
 * It is deliberately coupled to the generated `cards.json`: a new set that prints a code
 * shape this parser cannot express is precisely the thing worth failing on.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
// The index's own shape, taken from the function that consumes it rather than restated here.
const index = JSON.parse(
  readFileSync(join(ROOT, "apps/web/public/cards.json"), "utf8"),
) as Parameters<typeof buildPool>[0];
const pool = buildPool(index);

/** What is printed in the collector slot — `VEN-SP3/006` → `SP3`, `VEN-R01` → `R01`. */
const designatorOf = (code: string) => {
  const head = code.split("/")[0]!;
  return head.slice(head.indexOf("-") + 1);
};

describe("entry against the shipped card index", () => {
  it("⚠️ every printing is reachable by typing what is printed on it", () => {
    // And reaches ITSELF — a printing shadowed by another is the same failure as one that
    // cannot be typed, except it registers a card you do not own rather than nothing.
    const unreachable = index.cards.flatMap((card) =>
      card.printings
        .filter((p) => {
          const hit = parseEntry(designatorOf(p.code), pool, p.set);
          return hit?.cands[0]?.printing.id !== p.id;
        })
        .map((p) => `${p.code} (${card.name})`),
    );
    expect(unreachable).toEqual([]);
  });

  it("finds the six Vendetta promo Champions, which live behind older base printings", () => {
    const found = [1, 2, 3, 4, 5, 6].map(
      (n) => parseEntry(`sp${n}`, pool, "VEN")?.cands[0]?.printing.code,
    );
    expect(found).toEqual([
      "VEN-SP1/006",
      "VEN-SP2/006",
      "VEN-SP3/006",
      "VEN-SP4/006",
      "VEN-SP5/006",
      "VEN-SP6/006",
    ]);
  });
});
