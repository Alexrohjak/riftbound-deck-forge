import { describe, expect, it } from "vitest";
import { atLeastOne, CARDS_SEEN_BY_TURN_ONE, MAIN_DECK_SIZE, COMMUNITY } from "../src/index.js";

/**
 * The early-play curve, pinned.
 *
 * ⚠️ **Every number here was once prose.** `COMMUNITY`'s doc said 7–9 early plays gives
 * "roughly 78 / 83 / 87%", and a note said 8 takes you to "about 83%". Each was about a
 * point out, sitting inches from the function that computes the real value — the same
 * failure `DECK-STATS.md` recorded when it illustrated the flagship statistic with a figure
 * no model produces.
 *
 * The shape matters more than any single value, and it is the reason the band is 7–9 rather
 * than "as many as fit": the marginal card is worth ~6 points at seven and **less than a
 * tenth of a point** by twenty-three. A deck reporting 99.9% is not a deck that is good at
 * opening; it is a deck that paid fourteen slots for fourteen points.
 */
const p = (k: number) => atLeastOne(k, MAIN_DECK_SIZE, CARDS_SEEN_BY_TURN_ONE);

describe("the early-play curve", () => {
  it("matches the figures quoted beside the constants", () => {
    expect(Math.round(p(COMMUNITY.earlyPlaysMin) * 100)).toBe(77);
    expect(Math.round(p(COMMUNITY.earlyPlaysIdeal) * 100)).toBe(82);
    expect(Math.round(p(COMMUNITY.earlyPlaysMax) * 100)).toBe(86);
  });

  it("saturates — which is the entire argument for a band rather than a maximum", () => {
    const marginal = (k: number) => p(k) - p(k - 1);

    // Worth a card at the bottom of the band...
    expect(marginal(COMMUNITY.earlyPlaysMin)).toBeGreaterThan(0.05);
    // ...roughly half that by the top of it...
    expect(marginal(COMMUNITY.earlyPlaysMax)).toBeLessThan(0.045);
    // ...and indistinguishable from nothing well before you run out of two-drops.
    expect(marginal(23)).toBeLessThan(0.001);
  });

  it("prices the surplus the way a builder has to think about it", () => {
    // The real Draven build: 23 cards at 2 energy or less.
    const surplus = p(23) - p(COMMUNITY.earlyPlaysMax);
    expect(surplus).toBeGreaterThan(0.13);
    expect(surplus).toBeLessThan(0.15);

    // Fourteen extra cards bought fourteen points; the last five bought under one point
    // between them — 0.81, which is why this is asserted rather than eyeballed.
    const lastFive = p(23) - p(18);
    expect(lastFive).toBeGreaterThan(0.008);
    expect(lastFive).toBeLessThan(0.009);
  });

  it("never claims certainty it cannot have", () => {
    expect(p(0)).toBe(0);
    // Even a deck that is nothing but early plays is capped at 1, not above it.
    expect(p(MAIN_DECK_SIZE)).toBe(1);

    // ⚠️ And 23 early plays is NOT certainty, however it rounds. The note printed "100%"
    // for this deck, which asserts the opening cannot fail — a claim about a shuffled deck
    // that nothing here is entitled to make.
    expect(p(23)).toBeLessThan(1);
    expect(p(23)).toBeGreaterThan(0.995);
  });
});
