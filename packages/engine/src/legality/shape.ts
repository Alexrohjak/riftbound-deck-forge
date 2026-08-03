import type { CardIndex, Deck, Violation, Zone } from "../types.js";

/** Total quantity registered in a zone. */
export function zoneCount(deck: Deck, zone: Zone): number {
  return deck.slots
    .filter((s) => s.zone === zone)
    .reduce((total, s) => total + s.quantity, 0);
}

/**
 * L3 — Main Deck is **exactly 40, with the Chosen Champion counted within** (TR 601.1.b).
 *
 * The Champion is a singular field rather than a slot (DATA-MODEL §1), so it has to be
 * added back here. Forgetting this is an off-by-one that makes a legal deck report as 39,
 * which is exactly the kind of silent wrongness `W1` exists to prevent.
 */
export function mainDeckCount(deck: Deck): number {
  return zoneCount(deck, "MAIN") + 1;
}

/** L3 · L4 · L5 · L6 · L7 — the checks that need only counts and names. */
export function checkShape(deck: Deck, cards: CardIndex): Violation[] {
  const violations: Violation[] = [];

  const main = mainDeckCount(deck);
  if (main !== 40) {
    violations.push({
      check: "L3",
      citation: "TR 601.1.b",
      message: `Main Deck must be exactly 40 including the Chosen Champion; found ${main}.`,
    });
  }

  const runes = zoneCount(deck, "RUNE");
  if (runes !== 12) {
    violations.push({
      check: "L4",
      citation: "CR 103.3.a",
      message: `Rune Deck must be exactly 12; found ${runes}.`,
    });
  }

  const battlefields = zoneCount(deck, "BATTLEFIELD");
  if (battlefields !== 3) {
    violations.push({
      check: "L5",
      citation: "TR 402.1",
      message: `Exactly 3 Battlefields must be registered; found ${battlefields}.`,
    });
  }

  // L6 — registered Battlefields must be distinct BY NAME, so three printings of one
  // Battlefield is illegal even though it is three cards.
  const battlefieldNames = deck.slots
    .filter((s) => s.zone === "BATTLEFIELD")
    .flatMap((s) => Array.from({ length: s.quantity }, () => cards.nameOf(s.cardId) ?? s.cardId));
  const duplicated = [...new Set(battlefieldNames.filter((n, i) => battlefieldNames.indexOf(n) !== i))];
  if (duplicated.length > 0) {
    violations.push({
      check: "L6",
      citation: "CR 103.4.c / TR 402.1",
      message: `Battlefield names must be unique; repeated: ${duplicated.join(", ")}.`,
    });
  }

  const sideboard = zoneCount(deck, "SIDEBOARD");
  if (sideboard > 10) {
    violations.push({
      check: "L7",
      citation: "TR 601.1.c.1",
      message: `Sideboard must be 10 or fewer; found ${sideboard}.`,
    });
  }

  return violations;
}
