import type { CardIndex, Deck } from "../types.js";
import { capabilities } from "./doctrine.js";
import { deckShape } from "./shape.js";

/**
 * What the deck is *trying to do* — inferred, and honest when it cannot tell.
 *
 * The archetype guides are unanimous on one point: **a deck without an identity loses to
 * decks that have one**, because it does several things at half strength. So naming the
 * identity is useful. But inferring it from a card list is genuinely hard, and a confident
 * wrong label is worse than none — it would have the reader tune towards a plan they are
 * not playing.
 *
 * ⚠️ So `unclear` is a real answer and appears often. The evidence always ships with the
 * verdict so the reader can overrule it, which they are usually better placed to do.
 */

export type Archetype = "aggro" | "midrange" | "control" | "combo" | "unclear";

export interface ArchetypeRead {
  archetype: Archetype;
  /** How much the signals agree. Low means the deck is doing two things. */
  confidence: "strong" | "weak" | "none";
  /** The numbers behind it, so the call can be argued with. */
  evidence: string[];
  /** What this archetype beats and loses to — the triangle, which is doctrine. */
  matchups?: string;
}

/**
 * Aggro beats combo; combo beats control; control beats aggro. Midrange trades both edges
 * for fewer weaknesses. Widely held across the guides, and useful precisely because it is
 * about *pace* rather than about cards.
 */
const TRIANGLE: Record<Exclude<Archetype, "unclear">, string> = {
  aggro: "Beats combo, which needs time to assemble. Loses to control once it stabilises.",
  control: "Beats aggro by answering it. Loses to combo, which wins without engaging.",
  combo: "Beats control by ignoring it. Loses to aggro, which kills you before assembly.",
  midrange:
    "Gives up both edges for fewer weaknesses — favoured nowhere, hopeless nowhere. The forgiving choice.",
};

export function readArchetype(deck: Deck, cards: CardIndex): ArchetypeRead {
  const shape = deckShape(deck, cards);
  const caps = capabilities(deck, cards);
  const evidence: string[] = [];

  if (shape.size < 20) {
    return { archetype: "unclear", confidence: "none", evidence: ["Too few cards to read."] };
  }

  const counted = shape.curve.reduce((n, c) => n + c, 0);
  const mean =
    counted > 0 ? shape.curve.reduce((sum, count, cost) => sum + count * cost, 0) / counted : 0;
  const unitShare = shape.units / shape.size;

  evidence.push(`Average Energy ${mean.toFixed(1)}`);
  evidence.push(`${shape.earlyPlays} playable on turn one`);
  evidence.push(`${Math.round(unitShare * 100)}% units`);
  evidence.push(`${caps.removal} removal, ${caps.draw} draw`);

  // Each signal votes. Deliberately crude: a precise-looking classifier on four numbers
  // would be false precision, and the reader knows their deck better than four numbers do.
  let aggro = 0;
  let control = 0;
  if (mean <= 3) aggro++;
  if (mean >= 4.2) control++;
  if (shape.earlyPlays >= 9) aggro++;
  if (shape.earlyPlays <= 5) control++;
  if (unitShare >= 0.6) aggro++;
  if (unitShare <= 0.45) control++;
  if (caps.removal >= 8) control++;
  if (caps.draw >= 6) control++;

  // A deck with a big payoff it must assemble reads as combo before it reads as anything.
  const combo = caps.danglingSynergies.length === 0 && shape.ratios.ones >= 6;
  if (combo) {
    evidence.push(`${shape.ratios.ones} singleton cards`);
    return {
      archetype: "combo",
      confidence: "weak",
      evidence,
      matchups: TRIANGLE.combo,
    };
  }

  const spread = Math.abs(aggro - control);
  if (spread === 0) {
    return {
      archetype: aggro > 0 ? "midrange" : "unclear",
      confidence: aggro > 0 ? "weak" : "none",
      evidence,
      ...(aggro > 0 ? { matchups: TRIANGLE.midrange } : {}),
    };
  }

  const archetype = aggro > control ? "aggro" : "control";
  // Two signals apart is a lean; three or more is a plan.
  const confidence = spread >= 3 ? "strong" : "weak";
  return { archetype, confidence, evidence, matchups: TRIANGLE[archetype] };
}
