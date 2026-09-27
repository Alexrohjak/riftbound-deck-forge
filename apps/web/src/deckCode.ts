import { getCodeFromDeck, getDeckFromCode } from "@piltoverarchive/riftbound-deck-codes";
import type { DeckSlot, Zone } from "@forge/engine";
import { zoneFor, type Card, type CardPool } from "./cards.js";

/**
 * Deck interchange with the rest of the Riftbound world: the **deck code** and the **text list**.
 *
 * **The deck code is Piltover Archive's format** ([RiftboundDeckCodes](https://github.com/Piltover-Archive/RiftboundDeckCodes),
 * Apache-2.0). Every deckbuilder that shares codes uses it, so it is taken as a dependency rather
 * than reimplemented: a second encoder would drift from the one everybody else runs.
 *
 * **The text list has no spec.** Piltover Archive exports `Legend:` / `Champion:` / `MainDeck:` /
 * `Battlefields:` / `Runes:` / `Sideboard:` sections of `3 Card Name` lines, and the official event
 * locator takes a paste of it; other sites write `Main Deck`, `Rune Pool`, `3x Name`, `Name x3`,
 * `Kai'Sa Survivor` for `Kai'Sa, Survivor`, `Rockfall Path (216)`. So reading is lenient (names
 * compared without punctuation, sections optional) and writing sticks to Piltover Archive's shape.
 *
 * ⚠️ **Two conventions differ from Forge's model, and both are handled here, not at the edges.**
 * - The code carries the Chosen Champion *twice*: in its trailer and as a copy inside the main
 *   deck, which it counts as 40. Forge holds the Champion outside the slots and counts `MAIN` to
 *   39 (L3). Export adds that copy back; import takes it out.
 * - The code has no Legend field. The Legend rides in the main deck as a single copy and is
 *   recovered by its card type. So are runes and battlefields.
 */

export interface DeckInterchange {
  format: "code" | "text";
  legendCardId: string;
  chosenChampionCardId: string;
  slots: DeckSlot[];
  /** Every entry the pool could not place, in the words the source used. Never dropped silently. */
  skipped: string[];
}

// ---------------------------------------------------------------------------------------------
// Codes
// ---------------------------------------------------------------------------------------------

/** `OGN-007a/298` → `OGN-007a`. The deck code has no set-size suffix. */
const shortCode = (code: string) => code.split("/")[0]!;

/** Whether the code format can express this printing (it has no token numbers, `UNL-T01`). */
function encodable(code: string): boolean {
  try {
    getCodeFromDeck([{ cardCode: code, count: 1 }]);
    return true;
  } catch {
    return false;
  }
}

/** The code for a printing, falling back to another printing of the same card when it has none. */
function codeFor(pool: CardPool, printingId: string): string | null {
  const card = pool.byPrinting.get(printingId);
  if (!card) return null;
  const own = card.printings.find((p) => p.id === printingId);
  const ordered = own ? [own, ...card.printings.filter((p) => p !== own)] : card.printings;
  for (const p of ordered) {
    const code = shortCode(p.code);
    if (encodable(code)) return code;
  }
  return null;
}

export interface Exported {
  text: string;
  /** Cards no printing of which the format can express. Named, so the export never lies by omission. */
  missing: string[];
}

interface ExportableDeck {
  legendCardId: string;
  chosenChampionCardId: string;
  slots: DeckSlot[];
}

export function exportCode(deck: ExportableDeck, pool: CardPool): Exported {
  const main = new Map<string, number>();
  const side = new Map<string, number>();
  const missing: string[] = [];

  const add = (into: Map<string, number>, id: string, n: number) => {
    const code = codeFor(pool, id);
    if (!code) {
      missing.push(pool.byPrinting.get(id)?.name ?? id);
      return;
    }
    into.set(code, (into.get(code) ?? 0) + n);
  };

  if (deck.legendCardId) add(main, deck.legendCardId, 1);
  // The champion's copy inside the 40 — the code counts it there as well as in its trailer.
  if (deck.chosenChampionCardId) add(main, deck.chosenChampionCardId, 1);
  for (const slot of deck.slots) add(slot.zone === "SIDEBOARD" ? side : main, slot.cardId, slot.quantity);

  const list = (m: Map<string, number>) => [...m].map(([cardCode, count]) => ({ cardCode, count }));
  const champion = deck.chosenChampionCardId ? codeFor(pool, deck.chosenChampionCardId) ?? undefined : undefined;
  return { text: getCodeFromDeck(list(main), list(side), champion), missing };
}

/** A deck code is one run of base32. Anything with spaces or lowercase words is a text list. */
export const looksLikeCode = (input: string) => /^[A-Z2-7]{16,}=*$/.test(input.trim());

// ---------------------------------------------------------------------------------------------
// Placement — shared by both importers
// ---------------------------------------------------------------------------------------------

type Section = "legend" | "champion" | "sideboard" | "any";

class Builder {
  legend = "";
  champion = "";
  readonly slots: DeckSlot[] = [];
  readonly skipped: string[] = [];

  constructor(private readonly pool: CardPool) {}

  place(card: Card, printingId: string, count: number, section: Section, source: string) {
    const isLegend = card.types.includes("legend");
    if (section === "legend" || isLegend) {
      // One Legend per deck. A second is reported, never quietly swapped in.
      if (!isLegend || this.legend) this.skipped.push(source);
      else this.legend = printingId;
      return;
    }
    if (section === "champion") {
      if (this.champion) this.skipped.push(source);
      else this.champion = printingId;
      return;
    }
    if (card.superTypes.includes("token")) {
      this.skipped.push(source);
      return;
    }
    const zone: Zone = section === "sideboard" ? "SIDEBOARD" : zoneFor(card);
    const same = this.slots.find((s) => s.cardId === printingId && s.zone === zone);
    if (same) same.quantity += count;
    else this.slots.push({ cardId: printingId, zone, quantity: count });
  }

  /**
   * Take the Champion's copy out of the main deck. `always` for a code, which counts it there by
   * construction; for text, only when the list has one more main card than Forge's 39 would hold.
   */
  liftChampion(always: boolean) {
    if (!this.champion) return;
    const name = this.pool.byPrinting.get(this.champion)?.name;
    const main = this.slots.filter((s) => s.zone === "MAIN");
    const total = main.reduce((n, s) => n + s.quantity, 0);
    if (!always && total <= 39) return;
    const copy =
      main.find((s) => s.cardId === this.champion) ??
      main.find((s) => this.pool.byPrinting.get(s.cardId)?.name === name);
    if (!copy) return;
    copy.quantity -= 1;
    if (copy.quantity === 0) this.slots.splice(this.slots.indexOf(copy), 1);
  }

  result(format: DeckInterchange["format"]): DeckInterchange {
    return {
      format,
      legendCardId: this.legend,
      chosenChampionCardId: this.champion,
      slots: this.slots,
      skipped: this.skipped,
    };
  }
}

/** `OGN-007a` → printing id, built from every printing's public code. */
function codeIndex(pool: CardPool): Map<string, string> {
  const index = new Map<string, string>();
  for (const [code, id] of pool.byCode) index.set(shortCode(code).toUpperCase(), id);
  return index;
}

export function importCode(input: string, pool: CardPool): DeckInterchange {
  // `*` is the suffix Riot's own public codes use for signed printings, and so does the pool.
  const decoded = getDeckFromCode(input.trim(), { signedSuffix: "*" });
  const byCode = codeIndex(pool);
  const b = new Builder(pool);

  const resolve = (code: string) => {
    const id = byCode.get(code.toUpperCase());
    const card = id ? pool.byPrinting.get(id) : undefined;
    return id && card ? { id, card } : null;
  };

  if (decoded.chosenChampion) {
    const hit = resolve(decoded.chosenChampion);
    if (hit) b.place(hit.card, hit.id, 1, "champion", decoded.chosenChampion);
    else b.skipped.push(decoded.chosenChampion);
  }
  for (const [list, section] of [[decoded.mainDeck, "any"], [decoded.sideboard, "sideboard"]] as const) {
    for (const { cardCode, count } of list) {
      const hit = resolve(cardCode);
      if (hit) b.place(hit.card, hit.id, count, section, `${count} ${cardCode}`);
      else b.skipped.push(`${count} ${cardCode}`);
    }
  }
  for (const legend of decoded.additionalLegends ?? []) b.skipped.push(`additional Legend ${legend}`);
  b.liftChampion(true);
  return b.result("code");
}

// ---------------------------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------------------------

/** Names compared without case, accents or punctuation: `Kai'Sa Survivor` is `Kai'Sa, Survivor`. */
export const normalise = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const HEADERS: [RegExp, Section][] = [
  [/^(champion )?legends?$/, "legend"],
  [/^(chosen )?champions?$/, "champion"],
  [/^side ?(board|deck)$/, "sideboard"],
  [/^(main ?deck|main|deck)$/, "any"],
  [/^(battlefields?|runes?|rune (pool|deck))$/, "any"],
];

function sectionOf(header: string): Section | null {
  const key = normalise(header.replace(/\(\d+\)/g, ""));
  return HEADERS.find(([re]) => re.test(key))?.[1] ?? null;
}

/** Every card by normalised name, Legends also as `Champion, Title` — which is how lists write them. */
function nameIndex(pool: CardPool): Map<string, Card> {
  const index = new Map<string, Card>();
  for (const card of pool.cards) {
    index.set(normalise(card.name), card);
    if (card.types.includes("legend")) {
      for (const tag of card.tags) {
        if (!index.has(normalise(`${tag} ${card.name}`))) index.set(normalise(`${tag} ${card.name}`), card);
      }
    }
  }
  return index;
}

/** `3 Name`, `3x Name`, `Name x3`, `Name (216)` — the count and the name, whatever the order. */
function entry(line: string): { count: number; name: string } {
  const clean = line.replace(/\s*\(\d+\)\s*$/, "").trim();
  const lead = clean.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
  if (lead) return { count: Number(lead[1]), name: lead[2]!.trim() };
  const trail = clean.match(/^(.+?)\s+[x×]\s*(\d+)$/i);
  if (trail) return { count: Number(trail[2]), name: trail[1]!.trim() };
  return { count: 1, name: clean };
}

export function importText(input: string, pool: CardPool): DeckInterchange {
  const byName = nameIndex(pool);
  const byCode = codeIndex(pool);
  const b = new Builder(pool);
  let section: Section = "any";

  const take = (raw: string) => {
    const { count, name } = entry(raw);
    if (!name || count <= 0) return;
    const codeHit = /^[A-Z]{3}-\S+$/i.test(name) ? byCode.get(shortCode(name).toUpperCase()) : undefined;
    const card = codeHit ? pool.byPrinting.get(codeHit) : byName.get(normalise(name));
    if (!card) {
      b.skipped.push(raw.trim());
      return;
    }
    // A name is a card, not an object in a box: the base printing stands in for it.
    const id = codeHit ?? card.printings[0]?.id;
    if (!id) b.skipped.push(raw.trim());
    else b.place(card, id, count, section, raw.trim());
  };

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;

    // `Legend: Daughter of the Void` or `Runes: 5 Fury Rune, 7 Mind Rune` — a header with its
    // cards on the same line. Split only on commas that start a new counted entry, because
    // card names carry commas of their own.
    const colon = line.indexOf(":");
    const header = colon > 0 ? sectionOf(line.slice(0, colon)) : sectionOf(line);
    if (header !== null) {
      section = header;
      const rest = colon > 0 ? line.slice(colon + 1).trim() : "";
      if (rest) for (const part of rest.split(/,\s*(?=\d+\s*[x×]?\s)/i)) take(part);
      continue;
    }
    take(line);
  }

  b.liftChampion(false);
  return b.result("text");
}

/** Either format, detected. A code that fails to decode is an error, not a text list of one line. */
export const importDeck = (input: string, pool: CardPool): DeckInterchange =>
  looksLikeCode(input) ? importCode(input, pool) : importText(input, pool);

/**
 * Piltover Archive's text shape: the Champion on its own, `MainDeck` holding the other 39.
 * Printings of the same card are merged — a list names cards, not arts.
 */
export function exportText(deck: ExportableDeck, pool: CardPool): string {
  const label = (id: string) => {
    const card = pool.byPrinting.get(id);
    if (!card) return id;
    const tag = card.tags[0];
    return card.types.includes("legend") && tag && !card.name.includes(tag) ? `${tag}, ${card.name}` : card.name;
  };
  const block = (title: string, entries: [string, number][]) =>
    entries.length ? `${title}:\n${entries.map(([name, n]) => `${n} ${name}`).join("\n")}` : "";
  const zone = (z: Zone) => {
    const counts = new Map<string, { n: number; card: Card | undefined }>();
    for (const s of deck.slots.filter((s) => s.zone === z)) {
      const name = label(s.cardId);
      const seen = counts.get(name);
      counts.set(name, { n: (seen?.n ?? 0) + s.quantity, card: pool.byPrinting.get(s.cardId) });
    }
    return [...counts]
      .sort(([a, x], [b, y]) => (x.card?.energy ?? 99) - (y.card?.energy ?? 99) || a.localeCompare(b))
      .map(([name, { n }]) => [name, n] as [string, number]);
  };

  return [
    block("Legend", deck.legendCardId ? [[label(deck.legendCardId), 1]] : []),
    block("Champion", deck.chosenChampionCardId ? [[label(deck.chosenChampionCardId), 1]] : []),
    block("MainDeck", zone("MAIN")),
    block("Battlefields", zone("BATTLEFIELD")),
    block("Runes", zone("RUNE")),
    block("Sideboard", zone("SIDEBOARD")),
  ]
    .filter(Boolean)
    .join("\n\n");
}
