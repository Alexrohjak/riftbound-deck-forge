/**
 * `@forge/engine` — the rules, as a pure library.
 *
 * **Two consumers, one implementation** (D-047): `apps/web` imports this for live
 * on-screen legality, and `apps/cli` imports it so Claude Code can ask headlessly.
 * Implementing the checks twice would mean two bodies for `W1`, the component
 * everything downstream trusts.
 *
 * ⚠️ **Nothing in this package may touch I/O** — no `fetch`, no `node:*`, no DOM.
 * A single such import breaks one of the two consumers, and it will be the one nobody
 * ran. `scripts/check-engine-purity.mjs` enforces this in CI.
 */
export * from "./types.js";
export * from "./legality/index.js";

/** Statistics. Tier 1 only so far — facts about the list, with no assumptions in them. */
export { energyCurve, type EnergyCurve } from "./stats/energyCurve.js";

/** In-memory `CardIndex`, sufficient for tests and for the static `F2` pool. */
export { staticCardIndex, type CardEntry } from "./cardIndex.js";
