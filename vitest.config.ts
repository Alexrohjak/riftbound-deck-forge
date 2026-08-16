import { defaultExclude, defineConfig } from "vitest/config";

/**
 * The only reason this file exists: keep the test run out of `.claude/worktrees`.
 *
 * ⚠️ **A worktree is a second copy of the whole repository, tests included.** Vitest's default
 * `include` walks everything under the root, so with one worktree on disk `npm run test` collected
 * 54 files and 931 tests where the repository has 29 and 499 — every assertion counted twice, half
 * of them against a checkout of a *different commit*. With two worktrees it read 87 and 1497.
 *
 * That is worse than noise. The duplicate half is stale by construction, so the gate could go green
 * on code nobody had written yet, or red on code already fixed on `main`, and the number printed at
 * the end — the number a session quotes as evidence — describes neither tree. It was found only
 * because a merge made the count drop.
 *
 * CI checks out clean and has no worktrees, so this changes nothing there. It matters locally,
 * which is exactly where the gate is read most often and trusted least carefully.
 */
export default defineConfig({
  test: {
    exclude: [...defaultExclude, "**/.claude/**"],
  },
});
