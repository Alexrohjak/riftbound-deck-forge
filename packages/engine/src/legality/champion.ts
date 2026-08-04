import type { CardIndex, Deck, Violation } from "../types.js";
import { countedEntries, has, isType } from "./entries.js";

/**
 * L1 · L2 · L17 · L18 · L19 · L20 · L21 — the Legend, the Chosen Champion, and Signatures.
 *
 * ⚠️ **This is where the rulebook caught us out.** The Signature-card cap (L20) was absent
 * from the original 27 checks and was found only by reading CR 103.2.d.1 directly, after
 * community sources had already been wrong about the sideboard and the ban list. The `[Unique]`
 * keyword was the second such find. LEGALITY.md's own risk note says there are probably more,
 * which is why every rule here carries its citation and every rulebook example is a test.
 */

export const CHAMPION_CHECKS = ["L1", "L2", "L17", "L18", "L19", "L20", "L21"] as const;

/** CR 103.2.d.1 — three Signature cards **in total**, not three of each name. */
export const MAX_SIGNATURE_CARDS = 3;

export function checkChampion(deck: Deck, cards: CardIndex): Violation[] {
  const violations: Violation[] = [];
  const legend = cards.factsOf?.(deck.legendCardId);
  const champion = cards.factsOf?.(deck.chosenChampionCardId);

  // ── L1 — exactly one Champion Legend ────────────────────────────────────────
  if (!deck.legendCardId || !legend) {
    violations.push({
      check: "L1",
      citation: "CR 103.1",
      message: "A deck needs exactly one Champion Legend; none is registered.",
    });
  } else if (!isType(legend, "legend")) {
    violations.push({
      check: "L1",
      citation: "CR 103.1",
      message: `"${legend.name}" is not a Legend, so it cannot be this deck's Legend.`,
    });
  }

  // ── L2 — exactly one Chosen Champion ────────────────────────────────────────
  if (!deck.chosenChampionCardId || !champion) {
    violations.push({
      check: "L2",
      citation: "CR 103.2.a",
      message: "A deck needs exactly one Chosen Champion; none is registered.",
    });
  }

  if (champion) {
    // ── L17 — the Chosen Champion is a champion *unit* ────────────────────────
    if (!isType(champion, "unit") || !has(champion, "champion")) {
      violations.push({
        check: "L17",
        citation: "CR 103.2.a.2",
        message: `"${champion.name}" is not a champion unit, so it cannot be the Chosen Champion.`,
      });
    }

    // ── L19 — Signature units are ineligible ─────────────────────────────────
    // Called out in the spec because it is counter-intuitive: a Signature unit carries the
    // right champion tag and looks eligible, and is not (T3 — Tibbers under Annie).
    if (has(champion, "signature")) {
      violations.push({
        check: "L19",
        citation: "CR 103.2.a.2",
        message: `"${champion.name}" is a Signature unit; Signature units cannot be the Chosen Champion.`,
      });
    }

    // ── L18 — its champion tag matches the Legend's ───────────────────────────
    // ⚠️ Against `championTag`, never `tags` (L32). Heart of the Tempest carries both
    // `Yordle` and `Kennen`; matching any tag would admit 13 Yordles instead of 2 Kennens.
    if (legend?.championTag) {
      if (!champion.tags?.includes(legend.championTag)) {
        violations.push({
          check: "L18",
          citation: "CR 103.2.a.2",
          message:
            `"${champion.name}" does not carry the ${legend.championTag} champion tag, ` +
            `which "${legend.name}" requires.`,
        });
      }
    }
  }

  // ── L20 · L21 — Signature cards ─────────────────────────────────────────────
  const entries = countedEntries(deck, cards);
  const signatures = entries.filter((e) => has(e.facts, "signature"));
  const signatureTotal = signatures.reduce((n, e) => n + e.quantity, 0);

  if (signatureTotal > MAX_SIGNATURE_CARDS) {
    violations.push({
      check: "L20",
      citation: "CR 103.2.d.1",
      message:
        `${signatureTotal} Signature cards are registered; the limit is ` +
        `${MAX_SIGNATURE_CARDS} in total, regardless of name.`,
    });
  }

  if (legend?.championTag) {
    const offTag = [
      ...new Set(
        signatures
          .filter((e) => !e.facts?.tags?.includes(legend.championTag as string))
          .map((e) => e.name),
      ),
    ].sort();
    if (offTag.length > 0) {
      violations.push({
        check: "L21",
        citation: "CR 103.2.d.2",
        message:
          `Signature cards must carry the ${legend.championTag} champion tag; ` +
          `${offTag.join(", ")} do not.`,
      });
    }
  }

  return violations;
}
