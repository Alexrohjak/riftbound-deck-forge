import type { CardIndex, Deck, Violation } from "../types.js";
import { deckEntries } from "./entries.js";

/**
 * L22 · L23 · L24 · L25 · L30 · L33 — format legality.
 *
 * Four of these six are satisfied **structurally** rather than by a runtime test, and saying
 * so plainly is better than pretending they each run a loop:
 *
 * - **L33** — legality resolves by card *name*, never by printing (TR 601.2.a). Everything
 *   here counts names, which is the check.
 * - **L24** — because of L33, a reprint numbered outside its set's range is neither
 *   specially legal nor specially illegal; all 128 out-of-range collector numbers are
 *   neutralised by keying on name (TR 601.2.c).
 * - **L30** — banned battlefields are a *separate list* from banned cards, and both are
 *   folded into the same `banned` flag by the index generator, so battlefield bans are
 *   caught by the same pass. The separateness is a data-sourcing rule, not a runtime one.
 * - **L25** — the exact-preconstructed exemption is **never granted**. It applies only to an
 *   unmodified registered precon, and any deck assembled in Forge is by definition modified
 *   (TR 601.2.d.2). Conservative in the only safe direction: we never call a banned card
 *   legal.
 */

export const FORMAT_CHECKS = ["L22", "L23", "L24", "L25", "L30", "L33"] as const;

export function checkFormat(deck: Deck, cards: CardIndex): Violation[] {
  const violations: Violation[] = [];
  const entries = deckEntries(deck, cards);

  // ── L22 — every card is from a format-legal set ─────────────────────────────
  // All five sets are Standard-legal (TR 601.3.c), so this cannot fail for a card we can
  // resolve. It fails for one we cannot: an unknown printing is a card whose legality we
  // are unable to confirm, and reporting that is more useful than assuming the best.
  const unknown = [...new Set(entries.filter((e) => !e.facts).map((e) => e.cardId))].sort();
  if (unknown.length > 0) {
    violations.push({
      check: "L22",
      citation: "TR 601.2.a",
      message:
        `Not in the card pool, so format legality cannot be confirmed: ${unknown.join(", ")}.`,
    });
  }

  // ── L23 · L30 — nothing banned, cards and battlefields alike ────────────────
  const banned = [...new Set(entries.filter((e) => e.facts?.banned).map((e) => e.name))].sort();
  if (banned.length > 0) {
    violations.push({
      check: "L23",
      citation: "TR 601.2.d",
      message: `Banned in Constructed 1v1: ${banned.join(", ")}.`,
    });
  }

  return violations;
}
