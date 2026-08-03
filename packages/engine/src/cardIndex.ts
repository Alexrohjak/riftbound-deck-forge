import type { CardIndex } from "./types.js";

/**
 * A `CardIndex` over an already-loaded printing → name map.
 *
 * **Loading is the caller's job, deliberately.** The browser fetches the static card
 * index; the CLI reads it from disk; tests pass a literal. Keeping the read outside this
 * package is what keeps the package pure (D-047).
 */
export function staticCardIndex(namesByCardId: Readonly<Record<string, string>>): CardIndex {
  return {
    nameOf(cardId) {
      return namesByCardId[cardId];
    },
  };
}
