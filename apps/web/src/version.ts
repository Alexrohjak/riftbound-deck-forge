/**
 * Notice when a new Forge has been deployed under a page that is still running the old one.
 *
 * ⚠️ **This exists because of a real hour lost.** A bug was fixed and deployed in under a
 * minute; the tab kept running the bundle it had loaded before, so the fix appeared not to
 * work, and the next twenty minutes went on diagnosing a bug that no longer existed. The API
 * updates the instant a deploy lands. The page's code does not, and nothing said so.
 *
 * **The build identifies itself by its own asset filename.** Vite content-hashes the bundle,
 * so `assets/index-Bt2xlf5h.js` *is* the version — no build-time plumbing, no version file to
 * forget to bump, and it cannot drift from what is actually running because it is read from
 * the running document.
 *
 * ⚠️ **It never reloads for you.** Reloading a page mid-entry would throw away whatever is
 * half-typed, which is precisely the moment this is most likely to fire. It offers; you
 * decide.
 */

const CHECK_MS = 5 * 60 * 1000;

/** The bundle this page is running, read from the document rather than from a constant. */
function current(): string | null {
  const script = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]');
  return script ? new URL(script.src, location.href).pathname : null;
}

/** The bundle the server would serve now. `null` when it cannot be determined. */
async function deployed(): Promise<string | null> {
  try {
    // `cache: "no-store"` matters: the whole point is to bypass the cached copy that is
    // making the page look up to date.
    const response = await fetch("/", { cache: "no-store" });
    if (!response.ok) return null;
    const html = await response.text();
    return /\/assets\/index-[A-Za-z0-9_-]+\.js/.exec(html)?.[0] ?? null;
  } catch {
    // Offline, or Access has expired. Either way this is not the moment to say anything —
    // a "new version" prompt when the network is down would be a lie about the cause.
    return null;
  }
}

/**
 * Watch for a newer build. Calls `onStale` once, the first time one is found.
 *
 * Checks on an interval and whenever the tab regains focus, because coming back to a tab is
 * exactly when a deploy is most likely to have happened while you were not looking.
 */
export function watchForUpdates(onStale: () => void): void {
  const mine = current();
  if (!mine) return; // dev server, or a build that does not hash — nothing to compare

  let told = false;
  const check = async () => {
    if (told) return;
    const live = await deployed();
    if (live && live !== mine) {
      told = true;
      onStale();
    }
  };

  setInterval(() => void check(), CHECK_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
}
