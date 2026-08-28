#!/usr/bin/env node
/**
 * `F3` — build the full card index the app and the engine read.
 *
 * **One entry per card, printings stacked behind it.** 1,180 printings collapse to 935
 * names. Verified safe: only 5 names have printings that disagree on cost, might, power,
 * type or domain, and all 5 are the Legend supertype inconsistency handled below — so a
 * name never merges two genuinely different cards. Riot puts the distinguishing part *in*
 * the name: "Jinx, Demolitionist" (3E/4M/Fury) and "Jinx, Rebel" (5E/5M/Chaos) are two
 * names, not one name with two versions.
 *
 * ⚠️ **`superTypes` is unreliable on Legends.** Only 9 of 118 Legend printings carry
 * `champion`; 40 of the 49 Legends have none at all. Identifying a Champion Legend by that
 * field would be wrong four times in five. The reliable route is L32 — derive the champion
 * tag from the Legend's **Signature** cards, which resolves 49/49 uniquely, including
 * Heart of the Tempest (tags `Yordle, Kennen` → **Kennen**, not the 13 Yordles).
 *
 *     node scripts/build-card-index.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "apps/web/public/cards.json");

const cards = JSON.parse(readFileSync(join(ROOT, "data/cards.json"), "utf8"));
const banlist = JSON.parse(readFileSync(join(ROOT, "data/banlist.json"), "utf8"));

/**
 * The synergy graph, keyed by name: what a card **produces** (pump, kill, draw, token…) and
 * what it **consumes** (gear_matters, token_matters, trash_matters…).
 *
 * This is what lets EE answer "your deck has no removal" or "you have eleven cards that care
 * about gear and four gear" without anyone hand-writing a rule per card. Covers the 814
 * main-deck cards; runes, battlefields and tokens have no entry and need none.
 */
const classification = new Map(
  JSON.parse(readFileSync(join(ROOT, "data/classification.json"), "utf8")).map((c) => [c.name, c]),
);

/**
 * Release order, per COMPENDIUM §"The five sets". This is the order the gallery sorts in,
 * because it is the order the cards exist in the world — collector numbers only mean
 * anything within a set, and alphabetical order means nothing to anyone.
 *
 * `OGS` is the Origins supplemental in Proving Grounds, so it sits directly behind `OGN`.
 */
const SET_ORDER = ["OGN", "OGS", "SFD", "UNL", "VEN"];
const releaseRank = (card) => {
  const set = SET_ORDER.indexOf(card.set);
  if (set === -1) throw new Error(`Set "${card.set}" is not in SET_ORDER — add it, in release order.`);
  return set * 100000 + card.collectorNumber;
};

// ── the ban list ─────────────────────────────────────────────────────────────
// Matching goes through the alias map, never string equality: the official list does not
// always use the printed name ("Dreaming Tree" is printed "The Dreaming Tree").
const aliases = banlist.aliases ?? {};
const resolve = (name) => aliases[name] ?? name;
const banned = new Set(
  [...banlist.constructed_1v1.cards, ...banlist.constructed_1v1.battlefields].map(resolve),
);

// ── printing order: the base art first, alternates behind it ─────────────────
// The gallery marks showcase/foil printings with `*` in the public code, and alternate
// arts with a letter suffix on the collector number ("ogn-030a-298"). Neither is a
// different card — they are the same card wearing a different coat, which is exactly the
// distinction the deck slot needs so you can swap the look without swapping the card.
const isStar = (card) => card.publicCode.includes("*");
const isAltArt = (card) => /-\d+[a-z]-/.test(card.id);
const printingRank = (card) =>
  (isStar(card) ? 2 : 0) + (isAltArt(card) ? 1 : 0);

// ── group by name ────────────────────────────────────────────────────────────
const byName = new Map();
for (const card of cards) {
  if (!byName.has(card.name)) byName.set(card.name, []);
  byName.get(card.name).push(card);
}

const entries = [...byName].map(([name, group]) => {
  // ⚠️ **Set first, and only then the collector number.** A number means nothing outside
  // its own set, so comparing them across sets picked the wrong base printing for 17 of the
  // 42 reprinted cards — every basic Rune took its VEN promo (`VEN-R01`, number 1) over its
  // OGN original (`OGN-007`), and Darius took `SFD-236` over `OGN-243`. The base printing
  // decides the card's `release`, so those cards then sat in the wrong set block in the
  // gallery, and displayed the wrong art as their own.
  const ordered = [...group].sort(
    (a, b) =>
      SET_ORDER.indexOf(a.set) - SET_ORDER.indexOf(b.set) ||
      printingRank(a) - printingRank(b) ||
      a.collectorNumber - b.collectorNumber ||
      a.id.localeCompare(b.id),
  );

  // The base printing carries the card's facts. Where printings disagree on `superTypes`
  // — the 5 Legends — the union wins: the rare printing simply has the more complete
  // record, and dropping `champion` would lose information no other printing carries.
  const base = ordered[0];
  const superTypes = [...new Set(group.flatMap((c) => c.superTypes))].sort();

  /**
   * ⚠️ **`[NO TEXT]` is a placeholder, not rules text.** Six printings carry it — the
   * Vendetta promo Runes — and it is nine characters long, so "the fullest wording" would
   * otherwise print it on every basic Rune in place of the blank the card actually has.
   */
  const rules = (card) => (/^\s*\[no text\]\s*$/i.test(card.text ?? "") ? "" : card.text ?? "");

  /**
   * **Text comes from the fullest printing, not the base one.**
   *
   * Reprints and promos routinely drop the parenthesised reminder that explains a keyword —
   * `VEN-SP1` prints Kai'Sa as "[Accelerate] When I conquer, draw 1." where `OGN-039` spells
   * out what Accelerate costs. The short form is the same card wearing fewer words, and the
   * long form is the one worth indexing and worth remembering.
   *
   * It changes 4 of 935 cards, because the original printings usually *were* the fullest —
   * this makes that a rule rather than a coincidence, which is what matters when the next
   * set lands. Two of the four are outright corrections the old choice was missing: Sona
   * reads "ready **up to** 4 friendly runes", and Void Burrower "banish one, **then play
   * it**".
   *
   * ⚠️ **Safe for the engine, and checked rather than assumed.** `text` feeds `[Unique]`
   * (L13's copy-limit override) and `leadingKeywords`. No name's printings disagree on
   * `[Unique]` at all, and `leadingKeywords` reads only the leading run and steps over
   * reminders — so the extra words cannot invent a keyword. Exactly one card's keywords
   * change: the **Gold** token gains `[Reaction]`, because the newer templating leads with
   * it. That one is a correction too.
   */
  const fullest = ordered.reduce((best, c) => (rules(c).length > rules(best).length ? c : best), base);

  const entry = {
    name,
    // Where this card sits in the sequence of everything ever printed.
    release: releaseRank(base),
    energy: base.energy,
    power: base.power,
    might: base.might,
    types: base.types,
    superTypes,
    domains: base.domains,
    tags: base.tags,
    text: rules(fullest),
    /**
     * ⚠️ **What a piece of Equipment grants lives in `effectText`, not `text`.** A gear's
     * `text` is only how you attach it — `Serrated Dirk` reads "[Equip] :rb_rune_fury:" and
     * nothing else — while the thing it actually does, "[Assault 2]", sits in `effectText`
     * with its `mightBonus` alongside. Dropping them made all 32 Equipment cards read as
     * blanks that cost a rune and pay nothing, so a gear deck could not be measured at all
     * and `review` scored one as if the gear were not there.
     *
     * Carried from `base` rather than `fullest`: no name's printings disagree on either
     * field, which is checked rather than assumed.
     */
    ...(base.effectText?.trim() ? { effectText: base.effectText.trim() } : {}),
    ...(base.mightBonus ? { mightBonus: base.mightBonus } : {}),
    // Battlefields are the only landscape cards — 66 of 1,180. Carried explicitly rather
    // than inferred from the type, so a future landscape non-battlefield does not silently
    // get drawn cropped in half.
    ...(base.orientation === "landscape" ? { landscape: true } : {}),
    ...(() => {
      const c = classification.get(name);
      if (!c) return {};
      return {
        ...(c.role && c.role !== "-" ? { role: c.role } : {}),
        ...(c.timing && c.timing !== "-" ? { timing: c.timing } : {}),
        ...(c.produces?.length ? { produces: c.produces } : {}),
        ...(c.consumes?.length ? { consumes: c.consumes } : {}),
      };
    })(),
    printings: ordered.map((card) => ({
      id: card.id,
      code: card.publicCode,
      set: card.set,
      n: card.collectorNumber,
      img: card.imageUrl,
      ...(isStar(card) ? { star: true } : {}),
      ...(isAltArt(card) ? { alt: true } : {}),
    })),
  };

  // Present only when true — 10 flags cost less than 935 `false`s.
  if (banned.has(name)) entry.banned = true;
  return entry;
});

// Release order is the gallery's order, so the file ships in it — the app never re-sorts
// 935 entries on load just to display them the way they are meant to be displayed.
entries.sort((a, b) => a.release - b.release);

// ── L32: the champion tag, derived from Signature cards ──────────────────────
const signatureTags = new Set(
  cards.filter((c) => c.superTypes.includes("signature")).flatMap((c) => c.tags),
);
let resolved = 0;
for (const entry of entries) {
  if (!entry.types.includes("legend")) continue;
  const candidates = entry.tags.filter((tag) => signatureTags.has(tag));
  if (candidates.length !== 1) {
    // Loud, not silent. Champion eligibility (L18) and the Signature limits (L20, L21)
    // all key on this, so an unresolved Legend is a correctness problem, not a cosmetic one.
    throw new Error(
      `Champion tag for "${entry.name}" resolves to ${candidates.length} candidates ` +
        `(${entry.tags.join(", ")}). L32 requires exactly one.`,
    );
  }
  entry.championTag = candidates[0];
  resolved++;
}

const index = {
  schema: "forge.cards/1",
  note:
    "GENERATED by scripts/build-card-index.mjs from data/cards.json — do not edit by hand. " +
    "One entry per card name; `printings` are the same card's alternate arts.",
  counts: {
    names: entries.length,
    printings: cards.length,
    legends: resolved,
    banned: entries.filter((e) => e.banned).length,
    classified: entries.filter((e) => e.role).length,
  },
  cards: entries,
};

mkdirSync(dirname(OUT), { recursive: true });
const json = `${JSON.stringify(index)}\n`;
writeFileSync(OUT, json);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(
  `✓ ${OUT.replace(`${ROOT}/`, "")} — ${index.counts.names} names / ` +
    `${index.counts.printings} printings, ${index.counts.legends} Legends tagged, ` +
    `${index.counts.banned} banned, ${index.counts.classified} classified · ` +
    `${kb(json.length)} raw, ${kb(gzipSync(json).length)} gzip`,
);
