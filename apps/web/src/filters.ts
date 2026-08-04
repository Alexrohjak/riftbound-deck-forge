import type { Domain } from "@forge/engine";
import { isDeckable, search, zoneFor, type Card } from "./cards.js";

/**
 * What the gallery is showing, and in what order.
 *
 * Kept out of the component because it is the part with rules in it: the guided flow reads
 * the same predicate the manual tabs do, so "show me what I can pick next" and "show me
 * battlefields" cannot drift apart.
 */

export type Tab = "all" | "legend" | "main" | "battlefield" | "rune";

export type SortKey = "release" | "cost" | "might" | "name";
export interface Sort {
  key: SortKey;
  /** `release` ascending is the order the cards were printed, which is the sane default. */
  desc: boolean;
}

export interface Filters {
  tab: Tab;
  query: string;
  /** Empty means "any". Otherwise a card must sit entirely inside the chosen domains. */
  domains: Domain[];
  /** Empty means "any". `unit`, `spell`, `gear`, `battlefield`, `rune`. */
  types: string[];
  /** Restrict to a Legend's Domain Identity — the guided flow sets this. */
  identity?: readonly Domain[] | undefined;
  /** Restrict to champion units carrying this tag — the guided flow sets this. */
  championTag?: string | undefined;
  sort: Sort;
}

export const NO_FILTERS: Filters = {
  tab: "all",
  query: "",
  domains: [],
  types: [],
  sort: { key: "release", desc: false },
};

const inTab = (card: Card, tab: Tab): boolean => {
  if (tab === "all") return true;
  if (tab === "legend") return card.types.includes("legend");
  if (tab === "rune") return card.types.includes("rune");
  if (tab === "battlefield") return card.types.includes("battlefield");
  return isDeckable(card) && zoneFor(card) === "MAIN";
};

/** `colorless` is legal under every identity (L12), so it never excludes a card. */
const insideIdentity = (card: Card, identity: readonly Domain[]): boolean =>
  card.domains.every((d) => d === "colorless" || identity.includes(d));

const compare = (a: Card, b: Card, sort: Sort): number => {
  const dir = sort.desc ? -1 : 1;
  switch (sort.key) {
    case "cost":
      // Cards with no cost sort last either way rather than pretending to be free.
      return dir * ((a.energy ?? 99) - (b.energy ?? 99)) || a.release - b.release;
    case "might":
      return dir * ((a.might ?? -1) - (b.might ?? -1)) || a.release - b.release;
    case "name":
      return dir * a.name.localeCompare(b.name);
    default:
      return dir * (a.release - b.release);
  }
};

export function apply(cards: Card[], f: Filters): Card[] {
  const picked = cards.filter((card) => {
    if (!inTab(card, f.tab)) return false;
    if (f.identity && !insideIdentity(card, f.identity)) return false;
    if (f.championTag) {
      // L18 + L19 — the tag must match, and Signature units are ineligible.
      if (!card.types.includes("unit")) return false;
      if (!card.superTypes.includes("champion")) return false;
      if (card.superTypes.includes("signature")) return false;
      if (!card.tags.includes(f.championTag)) return false;
    }
    if (f.types.length > 0 && !f.types.some((t) => card.types.includes(t))) return false;
    if (f.domains.length > 0 && !insideIdentity(card, f.domains)) return false;
    return true;
  });

  // Search ranks by relevance, so it decides the order when there is a query at all.
  const found = f.query.trim() ? search(picked, f.query) : picked;
  return f.query.trim() ? found : [...found].sort((a, b) => compare(a, b, f.sort));
}

export const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "release", label: "Set order" },
  { key: "cost", label: "Energy" },
  { key: "might", label: "Might" },
  { key: "name", label: "Name" },
];

export const TYPES = ["unit", "spell", "gear", "battlefield", "rune"];
export const DOMAIN_LIST: Domain[] = ["fury", "calm", "mind", "body", "chaos", "order"];
