import type { CardIndex, Deck, Domain, Violation } from "../types.js";

/**
 * L8 · L9 · L10 · L11 · L12 — Domain Identity.
 *
 * The identity is **the Legend's domains**, and every other card must fit inside it
 * (CR 103.1.b.2). Confirmed across all 118 Legend printings: **the identity is always a
 * pair** — there is no mono-domain or tri-domain Legend, so a Legend that resolves to
 * anything other than two domains means the card data is wrong, not that the deck is
 * exotic. That is worth reporting rather than swallowing (L8).
 *
 * **`colorless` is not a seventh domain** — it is the absence of one, and is legal under
 * every identity (L12). This is inferred rather than quoted from the rulebook
 * (LEGALITY.md LR4), but it is load-bearing: all 66 battlefields are colorless, so
 * without it every battlefield in the game would report as illegal.
 */

export const DOMAIN_IDENTITY_CHECKS = ["L8", "L9", "L10", "L11", "L12"] as const;

/** Legal under any identity (L12). */
export const UNIVERSAL_DOMAIN: Domain = "colorless";

/** Every Champion Legend carries exactly two domains — all 118, per the official gallery. */
export const IDENTITY_SIZE = 2;

/**
 * The deck's Domain Identity, or `undefined` when the caller supplied no domain data for
 * the Legend.
 *
 * ⚠️ `undefined` is the signal that **these checks cannot run** — never that the deck
 * passed them. `checkLegality` uses it to decide what to put in `checked`, so a caller
 * can always tell "no violations" from "not examined".
 */
export function domainIdentity(deck: Deck, cards: CardIndex): readonly Domain[] | undefined {
  return cards.domainsOf?.(deck.legendCardId);
}

/** The check a card in this zone fails when it falls outside the identity. */
function checkIdFor(zone: string, domainCount: number): { check: string; citation: string } {
  if (zone === "RUNE") return { check: "L11", citation: "CR 103.3.a.1" };
  // L10 is called out in the spec because it is the one people get backwards: a
  // two-domain card needs **both** domains inside the identity, not either one.
  return domainCount > 1
    ? { check: "L10", citation: "CR 103.1.b.4" }
    : { check: "L9", citation: "CR 103.1.b.3" };
}

export function checkDomainIdentity(deck: Deck, cards: CardIndex): Violation[] {
  const identity = domainIdentity(deck, cards);
  if (!identity) return [];

  const violations: Violation[] = [];

  if (identity.length !== IDENTITY_SIZE) {
    violations.push({
      check: "L8",
      citation: "CR 103.1.b.2",
      message:
        `Domain Identity comes from the Legend, and every Legend has exactly ` +
        `${IDENTITY_SIZE} domains; this one has ${identity.length}` +
        `${identity.length > 0 ? ` (${identity.join(", ")})` : ""}.`,
    });
  }

  const allowed = new Set<Domain>(identity);

  // Every card in the deck, the Chosen Champion included — it is a Main Deck card that
  // happens to live in its own field (DATA-MODEL §1), and forgetting it here would let
  // an off-identity Champion through the one check meant to catch it.
  const entries: Array<{ cardId: string; zone: string }> = [
    ...deck.slots.map((slot) => ({ cardId: slot.cardId, zone: slot.zone })),
    { cardId: deck.chosenChampionCardId, zone: "MAIN" },
  ];

  const seen = new Set<string>();
  for (const { cardId, zone } of entries) {
    if (seen.has(cardId)) continue;
    seen.add(cardId);

    const domains = cards.domainsOf?.(cardId);
    if (!domains) continue; // unknown printing — under-report rather than invent a verdict

    const offending = domains.filter((d) => d !== UNIVERSAL_DOMAIN && !allowed.has(d));
    if (offending.length === 0) continue;

    const { check, citation } = checkIdFor(zone, domains.length);
    const name = cards.nameOf(cardId) ?? cardId;
    violations.push({
      check,
      citation,
      message:
        `"${name}" is ${domains.join(" + ")}; ` +
        `${offending.join(" and ")} ${offending.length > 1 ? "are" : "is"} outside the ` +
        `${identity.join(" + ")} identity.`,
    });
  }

  return violations.sort((a, b) => a.message.localeCompare(b.message));
}
