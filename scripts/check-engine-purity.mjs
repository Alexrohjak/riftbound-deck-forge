#!/usr/bin/env node
/**
 * Fail if `packages/engine` reaches for I/O.
 *
 * D-047 makes the engine a pure library imported by two consumers — the browser, for
 * live on-screen legality (D-042), and the CLI, for Claude Code (D-043). The decision
 * records the failure mode this guards against:
 *
 *   "A single `fetch` or `fs` call in it breaks one of the two consumers, and it will
 *    be the one nobody ran."
 *
 * That is a slow, confusing failure to debug months later, and a fast one to catch here.
 * `PLAN.md` §F1 asked for exactly this rule.
 *
 *     node scripts/check-engine-purity.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "packages", "engine", "src");

/** Each rule is a name, a matcher, and why it disqualifies the engine. */
const RULES = [
  { name: "node: builtin import", re: /\bfrom\s+["']node:/, why: "breaks the browser consumer" },
  {
    name: "bare Node builtin import",
    re: /\bfrom\s+["'](fs|path|crypto|os|http|https|child_process|worker_threads)["']/,
    why: "breaks the browser consumer",
  },
  { name: "require()", re: /\brequire\s*\(/, why: "not available to either consumer as ESM" },
  { name: "fetch()", re: /(?<![.\w])fetch\s*\(/, why: "the engine must not perform I/O" },
  { name: "XMLHttpRequest", re: /\bXMLHttpRequest\b/, why: "the engine must not perform I/O" },
  { name: "document/window", re: /(?<![.\w])(document|window)\s*\./, why: "breaks the CLI consumer" },
  { name: "localStorage", re: /\blocalStorage\b/, why: "breaks the CLI consumer" },
  { name: "process.*", re: /(?<![.\w])process\s*\./, why: "breaks the browser consumer" },
];

/** Comments explain the rules; they should not trip them. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith(".ts") ? [full] : [];
  });
}

const failures = [];
for (const file of walk(SRC)) {
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        failures.push(`${relative(ROOT, file)}:${index + 1}  ${rule.name} — ${rule.why}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ packages/engine is not pure — ${failures.length} violation(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nThe engine must run unchanged in a browser and in Node (D-047).");
  process.exit(1);
}

console.log(`✓ packages/engine is pure — ${walk(SRC).length} files, no I/O`);
