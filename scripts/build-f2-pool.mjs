#!/usr/bin/env node
/**
 * Derive `F2`'s static card pool from `data/cards.json`.
 *
 * `F2` is deliberately crude (PLAN.md §4): one hardcoded Legend, card data from a static
 * file, a hand-written ~30-name collection. **"Hand-written" is not the same as
 * hand-authored** — every field here is copied from Riot's official gallery, because
 * D-034 says we never author card data. What this script hand-picks is *which* cards are
 * in the starter collection, not what they say.
 *
 * `F3` replaces this file with the full 1,180-printing pool. Until then it keeps the
 * browser bundle at a few tens of KB rather than 1 MB.
 *
 *     node scripts/build-f2-pool.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "apps/web/src/data/pool.json");

/** Loose Cannon — Jinx, Fury + Chaos. The flagship OGN Legend. */
const LEGEND_ID = "ogn-301-298";
/** Jinx, Demolitionist at 3 Energy — the cheaper of the two Jinx champion units. */
const CHAMPION_ID = "ogn-030-298";
const COLLECTION_NAMES = 30;
/** Three of each name is the copy limit (L13), so any legal 40 is reachable. */
const COPIES_OWNED = 3;

const cards = JSON.parse(readFileSync(join(ROOT, "data/cards.json"), "utf8"));
const banlist = JSON.parse(readFileSync(join(ROOT, "data/banlist.json"), "utf8"));

const byId = new Map(cards.map((c) => [c.id, c]));
const legend = byId.get(LEGEND_ID);
const champion = byId.get(CHAMPION_ID);
if (!legend || !champion) throw new Error("Legend or Champion id is not in data/cards.json");

const identity = new Set([...legend.domains, "colorless"]);
const inIdentity = (card) => (card.domains ?? []).every((d) => identity.has(d));

// Ban matching goes through the alias map, never string equality (banlist.json).
const aliases = banlist.aliases ?? {};
const resolve = (name) => aliases[name] ?? name;
const banned = new Set(
  [...banlist.constructed_1v1.cards, ...banlist.constructed_1v1.battlefields].map(resolve),
);

const championTag = legend.tags[0];
const is = (card, type) => card.types.includes(type);
const has = (card, superType) => card.superTypes.includes(superType);

/**
 * Signature cards must all match the Legend's champion tag (L21), so an off-tag Signature
 * is not merely bad, it is illegal. Keeping only Jinx's leaves the collection buildable.
 */
const eligible = cards.filter(
  (card) =>
    inIdentity(card) &&
    !banned.has(card.name) &&
    (is(card, "unit") || is(card, "spell") || is(card, "gear")) &&
    !has(card, "token") &&
    (!has(card, "signature") || card.tags.includes(championTag)) &&
    typeof card.energy === "number",
);

/** One printing per name — the cheapest id, so the choice is stable across re-runs. */
const oneEach = new Map();
for (const card of [...eligible].sort((a, b) => a.id.localeCompare(b.id))) {
  if (!oneEach.has(card.name)) oneEach.set(card.name, card);
}

/**
 * A curve, not a pile. Round-robin across Energy costs so the starter collection can
 * actually build a playable 40 — a collection of six-drops would make the one statistic
 * F2 ships (the energy curve) a picture of nothing.
 */
const picked = [];
const seen = new Set([champion.name]);
const byEnergy = new Map();
for (const card of oneEach.values()) {
  if (seen.has(card.name)) continue;
  const bucket = byEnergy.get(card.energy) ?? [];
  // Units first within a cost: you hold Battlefields with bodies (DECK-STATS §3).
  bucket.push(card);
  byEnergy.set(card.energy, bucket);
}
for (const bucket of byEnergy.values()) {
  bucket.sort((a, b) => {
    const unit = Number(is(b, "unit")) - Number(is(a, "unit"));
    return unit !== 0 ? unit : a.name.localeCompare(b.name);
  });
}

const costs = [...byEnergy.keys()].filter((e) => e <= 6).sort((a, b) => a - b);
for (let round = 0; picked.length < COLLECTION_NAMES - 1; round++) {
  let added = false;
  for (const cost of costs) {
    if (picked.length >= COLLECTION_NAMES - 1) break;
    const card = (byEnergy.get(cost) ?? [])[round];
    if (!card) continue;
    picked.push(card);
    added = true;
  }
  if (!added) break; // every bucket exhausted — fewer names than asked for, which is honest
}

const runes = ["Fury Rune", "Chaos Rune"].map((name) => {
  const rune = cards.find((c) => c.name === name && c.superTypes.includes("basic"));
  if (!rune) throw new Error(`No basic rune named ${name}`);
  return rune;
});

const battlefields = cards
  .filter((c) => is(c, "battlefield") && !banned.has(c.name))
  .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)
  .sort((a, b) => a.name.localeCompare(b.name))
  .slice(0, 6);

/** Only the fields the app and the engine actually read. */
const facts = (card) => ({
  name: card.name,
  domains: card.domains,
  energy: card.energy,
  power: card.power,
  might: card.might,
  types: card.types,
  superTypes: card.superTypes,
  text: card.text,
  imageUrl: card.imageUrl,
});

const inPool = [legend, champion, ...picked, ...runes, ...battlefields];
const pool = {
  _comment:
    "GENERATED by scripts/build-f2-pool.mjs from data/cards.json — do not edit by hand. " +
    "F2 only; F3 replaces this with the full 1,180-printing pool.",
  legendCardId: legend.id,
  chosenChampionCardId: champion.id,
  cards: Object.fromEntries(inPool.map((card) => [card.id, facts(card)])),
  collection: Object.fromEntries([
    ...[champion, ...picked].map((card) => [card.id, COPIES_OWNED]),
    // You own a full rune deck of each, so any 12-rune split is buildable.
    ...runes.map((rune) => [rune.id, 12]),
    ...battlefields.map((bf) => [bf.id, 1]),
  ]),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(pool, null, 1)}\n`);

const mainNames = 1 + picked.length;
console.log(
  `✓ ${OUT.replace(`${ROOT}/`, "")} — ${mainNames} main-deck names ` +
    `(${mainNames * COPIES_OWNED} cards), ${runes.length} runes, ` +
    `${battlefields.length} battlefields, under ${legend.name} (${legend.domains.join(" + ")})`,
);
