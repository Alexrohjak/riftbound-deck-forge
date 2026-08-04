/**
 * Client-side failure reporting.
 *
 * **Cloudflare already logs the Worker.** What it cannot see is the browser, and every
 * interface bug of note in this project has lived there: a CSS specificity trap, an invalid
 * `sizes` attribute that fetched 2492px images, a grid that collapsed to two pixels. All
 * three were found by staring at the screen. This is the channel that would have said so.
 *
 * ⚠️ **Three rules, each because a misbehaving diagnostic channel is worse than none:**
 *
 * 1. **It never blocks and never throws.** Reporting is fire-and-forget, and every failure
 *    path here swallows. An error reporter that raises an error is how a page ends up in a
 *    loop that fills a database.
 * 2. **It carries no deck or card data of its own.** Context is the *location* of a fault,
 *    never the state on screen — that is already in D1, and copying it into crash noise
 *    makes the noise big without making it informative.
 *
 *    ⚠️ The honest limit: `message` is whatever the browser or a library put in an `Error`,
 *    and this code cannot see inside it. A thrown message that happens to embed a card name
 *    will be stored. Bounded and behind Access, so the exposure is a longer row rather than
 *    a leak — but "never carries card data" would be a stronger claim than the code can
 *    keep, so it is not made.
 * 3. **It is deduplicated and capped per session.** One broken render in a React tree fires
 *    on every frame, and 500 identical rows would push out everything else worth reading.
 *
 * See `docs/spec/LOG.md` §3.
 */

export type Level = "error" | "warn" | "info";

interface Event {
  level: Level;
  /** A **stable identifier**, not a sentence — aggregation needs something to group by. */
  code: string;
  message?: string;
  context?: unknown;
}

/** Per page load. A single broken component can otherwise report indefinitely. */
const SESSION_CAP = 25;
/** Coalesce a burst into one request without delaying a lone report noticeably. */
const FLUSH_MS = 2000;

let sent = 0;
const seen = new Set<string>();
let queue: Event[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  timer = null;
  const batch = queue;
  queue = [];
  if (batch.length === 0) return;

  // `keepalive` so a report made during unload still leaves — which is exactly when the
  // interesting failures happen.
  void fetch("/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
  }).catch(() => {
    // Deliberately empty. If reporting a failure fails, there is nowhere left to say so,
    // and trying harder is how this becomes the bug.
  });
}

/**
 * Record something that went wrong. Safe to call from anywhere, including an error handler.
 *
 * Deduplication is by `code` plus the first line of the message, so the same fault reported
 * a hundred times becomes one row — but a *different* fault with the same code still gets
 * through.
 */
export function report(event: Event): void {
  try {
    if (sent >= SESSION_CAP) return;
    const key = `${event.code}|${(event.message ?? "").slice(0, 120)}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;

    queue.push(event);
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
  } catch {
    // See above: this function may never throw into its caller.
  }
}

/**
 * Attach to the two places a browser reports an unhandled failure. Called once, from
 * `main.tsx`, before the app mounts — a crash during the first render is the one most worth
 * catching.
 */
export function watchForFailures(): void {
  window.addEventListener("error", (e) => {
    report({
      level: "error",
      code: "uncaught",
      message: e.message,
      // Where, not what: enough to find the line, nothing about the deck on screen.
      context: { source: e.filename, line: e.lineno, column: e.colno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e as PromiseRejectionEvent).reason as unknown;
    report({
      level: "error",
      code: "unhandled-rejection",
      message: reason instanceof Error ? reason.message : String(reason),
    });
  });

  // A report queued but not yet flushed would otherwise be lost on navigation.
  window.addEventListener("pagehide", flush);
}
