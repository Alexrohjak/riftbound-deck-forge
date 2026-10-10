#!/usr/bin/env node
/**
 * Refresh `data/cards.json` from Riot's official card gallery ([D-034]).
 *
 * **Why this exists.** The cache was derived once, by hand, and the derivation was written
 * down only as "strip the image noise". A new set then meant re-inventing it, and the first
 * re-invention disagreed with the cache on 301 names. So the mapping lives here, and it is
 * checked the only way that means anything: run against the gallery, it reproduces every
 * printing already cached, field for field, except where Riot changed the card.
 *
 *     npm run cards                       # one request, ~3.8 MB
 *     npm run cards -- --from gallery.json   # a payload you already captured
 *     npm run cards -- --dry              # report, write nothing
 *
 * Then `node scripts/build-card-index.mjs` and `python3 tools/collection/build-index.py`.
 *
 * ⚠️ **The gallery is authoritative, and it is not always right.** Radiance went up with 30
 * cards carrying the wrong type or none (Supernova, "Deal 10 to a unit. Draw 2.", filed as a
 * Unit) and 25 carrying the wrong domain or none. Read as published, those cards fail
 * legality in decks they are legal in. Two repairs are made, each from **the same payload**
 * and each checked against the printed card image:
 *
 * - **Type** from the card image's alt text ("Riftbound Spell: Supernova. …"), and only when
 *   Might agrees with it — a Unit has Might, nothing else does.
 * - **Domain** from the collector number. A set prints its single-domain cards in six equal
 *   blocks, Fury · Calm · Mind · Body · Chaos · Order, ahead of the first two-domain card.
 *   That holds for all 847 such printings in Origins, Spiritforged, Unleashed and Vendetta
 *   with no exception, so a card that breaks it is a data-entry error, not a new layout.
 *   A set where under two thirds agree is left alone and reported instead.
 *
 * Every repair is recomputed on every run and listed in `data/cards-repairs.json`, so the
 * list empties itself as Riot corrects the gallery. Nothing else is inferred: a stat or a
 * rules text with no second witness in the payload is taken as published.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data/cards.json");
const REPAIRS = join(ROOT, "data/cards-repairs.json");
const GALLERY = "https://playriftbound.com/en-us/card-gallery/";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;

// ── fetch ────────────────────────────────────────────────────────────────────
// The `buildId` changes on every site deploy, so it is read from the page each time.
async function fetchGallery() {
  const get = async (url) => {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (forge card refresh)" } });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return res.text();
  };
  const buildId = (await get(GALLERY)).match(/"buildId":"([^"]+)"/)?.[1];
  if (!buildId) throw new Error("No buildId on the gallery page — the site's shape has changed.");
  return JSON.parse(await get(`https://playriftbound.com/_next/data/${buildId}/en-us/card-gallery.json`));
}

const payload = from ? JSON.parse(readFileSync(from, "utf8")) : await fetchGallery();
const raw = payload.pageProps?.page?.blades?.find((b) => b.cards?.items)?.cards.items;
if (!raw?.length) throw new Error("No card list in the payload — the gallery's shape has changed.");

// ── the mapping ──────────────────────────────────────────────────────────────
/**
 * Plain text keeps `:rb_*:` tokens and HTML entities exactly as cached — `[&gt;]` is what
 * the parsers match. Block tags become spaces: Riot now sets modal choices as `<ul><li>`
 * where it used `<br />`, and stripping those bare ran "chosen this turn —Ready 2 runes."
 */
const plain = (html) =>
  (html ?? "")
    .replace(/<\/?(p|br|ul|li)\b[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const value = (field) => field?.value?.id ?? null;

/**
 * Riot split the name in two after the cache was first taken, and the subtitle means three
 * different things. On a Champion unit it is half the name — "Ahri, Alluring" and "Ahri,
 * Inquisitive" are different cards. On a Signature card it is only the champion it belongs
 * to — the card is "Bullet Time", not "Bullet Time, Miss Fortune". On a Legend it marks the
 * starter printing, which has different rules text and so must not merge with the real one.
 */
const fullName = (card, types, superTypes) => {
  if (!card.subtitle || superTypes.includes("signature")) return card.name;
  return types.includes("legend") ? `${card.name} - ${card.subtitle}` : `${card.name}, ${card.subtitle}`;
};

/**
 * Names the gallery has misspelt since the cache last had them right. The name is the
 * legality key and the interchange key, so a typo here is a card no other deckbuilder knows.
 * An entry that no longer matches anything is reported, so this cannot quietly rot.
 */
const NAME_CORRECTIONS = { "Sky Crusier": "Sky Cruiser" };

const TYPES = new Set(["unit", "spell", "gear", "legend", "rune", "battlefield"]);
const repairs = [];

const seen = new Map();
const cards = [];
for (const card of raw) {
  const json = JSON.stringify(card);
  if (seen.has(card.id)) {
    // The gallery lists one printing twice. Identical twins are dropped; anything else is
    // two cards claiming one key, and ownership is stored under that key.
    if (seen.get(card.id) !== json) throw new Error(`"${card.id}" appears twice with different data.`);
    continue;
  }
  seen.set(card.id, json);

  let types = (card.cardType?.type ?? []).map((t) => t.id);
  const superTypes = (card.cardType?.superType ?? []).map((t) => t.id);
  const mightBonus = value(card.mightBonus);

  const alt = card.cardImage?.accessibilityText?.match(/^Riftbound ([A-Za-z]+): /)?.[1].toLowerCase();
  const hasMight = card.might != null && mightBonus == null;
  if (TYPES.has(alt) && (types.length !== 1 || types[0] !== alt) && (alt === "unit") === hasMight) {
    repairs.push({ id: card.id, name: card.name, field: "types", published: types, used: [alt], evidence: "image alt text, Might agrees" });
    types = [alt];
  }

  let name = fullName(card, types, superTypes);
  if (NAME_CORRECTIONS[name]) {
    repairs.push({ id: card.id, name: NAME_CORRECTIONS[name], field: "name", published: name, used: NAME_CORRECTIONS[name], evidence: "the gallery's own earlier spelling" });
    name = NAME_CORRECTIONS[name];
  }

  const textRaw = card.text?.richText?.body ?? "";
  cards.push({
    id: card.id,
    name,
    publicCode: card.publicCode,
    collectorNumber: card.collectorNumber,
    set: card.set.value.id,
    setName: card.set.value.label,
    rarity: card.rarity.value.id,
    types,
    superTypes,
    domains: (card.domain?.values ?? []).map((d) => d.id),
    tags: card.tags?.tags ?? [],
    energy: value(card.energy),
    power: value(card.power),
    // Equipment publishes its bonus in both fields. It has no Might of its own.
    might: mightBonus == null ? value(card.might) : null,
    mightBonus,
    orientation: card.orientation,
    illustrator: (card.illustrator?.values ?? []).map((i) => i.label),
    text: plain(textRaw),
    textRaw,
    effectText: plain(card.effect?.richText?.body),
    imageUrl: card.cardImage.url,
  });
}

// ── domain repair: the collector-number blocks ───────────────────────────────
const BLOCKS = ["fury", "calm", "mind", "body", "chaos", "order"];
const numbered = (card) => /^[a-z]+-\d+[a-z]?-\d+$/.test(card.id);
for (const set of new Set(cards.map((c) => c.set))) {
  const inSet = cards.filter((c) => c.set === set && numbered(c));
  const firstPair = Math.min(...inSet.filter((c) => c.domains.length === 2).map((c) => c.collectorNumber));
  const size = (firstPair - 1) / 6;
  if (!Number.isInteger(size) || size < 1) continue; // no block layout — the starter set
  const singles = inSet.filter((c) => c.collectorNumber < firstPair);
  const block = (c) => BLOCKS[Math.floor((c.collectorNumber - 1) / size)];
  const off = singles.filter((c) => c.domains.length !== 1 || c.domains[0] !== block(c));
  if (off.length * 3 > singles.length) {
    console.warn(`⚠ ${set}: ${off.length} of ${singles.length} cards sit outside the domain blocks — left as published.`);
    continue;
  }
  for (const card of off) {
    repairs.push({ id: card.id, name: card.name, field: "domains", published: card.domains, used: [block(card)], evidence: `collector number ${card.collectorNumber} is in the ${block(card)} block` });
    card.domains = [block(card)];
  }
}

for (const typo of Object.keys(NAME_CORRECTIONS)) {
  if (!repairs.some((r) => r.published === typo)) console.warn(`⚠ NAME_CORRECTIONS: "${typo}" no longer appears — remove it.`);
}

// ── what changed ─────────────────────────────────────────────────────────────
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const old = new Map(before.map((c) => [c.id, c]));

/**
 * ⚠️ **A printing that leaves the gallery is kept.** Riot edits the gallery live: two
 * fetches fifteen minutes apart dropped `SFD-230*` and then, having restored it, dropped
 * `UNL-022`. Neither card stopped existing, and ownership is stored under the printing's id
 * — deleting the record would turn a card on the shelf into a row that resolves to nothing.
 * So an absent printing keeps its cached record and is named in the report every run.
 */
const fetched = new Set(cards.map((c) => c.id));
const held = before.filter((c) => !fetched.has(c.id));
cards.push(...held);

// A truncated payload parses fine, and holding a tenth of the pool over is not a refresh.
if (held.length > before.length * 0.1) {
  throw new Error(`The gallery is missing ${held.length} of ${before.length} cached printings — refusing to treat that as a refresh.`);
}

const tally = (list, key) => {
  const out = {};
  for (const item of list) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return Object.entries(out).map(([k, n]) => `${k} ${n}`).join(" · ") || "none";
};
const added = cards.filter((c) => !old.has(c.id));
const changed = [];
for (const card of cards) {
  const was = old.get(card.id);
  if (!was) continue;
  for (const field of Object.keys(card)) {
    if (JSON.stringify(was[field]) !== JSON.stringify(card[field])) changed.push({ id: card.id, field, was: was[field], now: card[field] });
  }
}

const names = new Set(cards.map((c) => c.name));
console.log(`${cards.length} printings · ${names.size} names (was ${before.length} · ${new Set(before.map((c) => c.name)).size})`);
console.log(`  by set   ${tally(cards, (c) => c.set)}`);
console.log(`  added    ${added.length} — ${tally(added, (c) => c.set)}`);
console.log(`  absent   ${held.length}${held.length ? ` — kept from the cache: ${held.map((c) => `${c.id} (${c.name})`).join(", ")}` : ""}`);
console.log(`  changed  ${tally(changed, (c) => c.field)}`);
for (const c of changed.filter((c) => c.field === "name")) console.log(`    renamed  ${c.id}  ${c.was} → ${c.now}`);
console.log(`  repaired ${tally(repairs, (r) => r.field)} — see data/cards-repairs.json`);

if (dry) {
  console.log("--dry: nothing written.");
} else {
  // Byte-compatible with the file as first cached: one-space indent, no trailing newline.
  writeFileSync(OUT, JSON.stringify(cards, null, 1));
  writeFileSync(
    REPAIRS,
    `${JSON.stringify(
      {
        note:
          "GENERATED by scripts/build-cards.mjs — do not edit by hand. Where data/cards.json " +
          "departs from Riot's gallery as published, and on what evidence. Recomputed every run.",
        repairs: repairs.sort((a, b) => a.id.localeCompare(b.id) || a.field.localeCompare(b.field)),
      },
      null,
      1,
    )}\n`,
  );
  console.log(`✓ data/cards.json · data/cards-repairs.json`);
}
