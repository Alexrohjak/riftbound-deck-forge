import { useRef, useState } from "react";
import type { CardPool } from "./cards.js";

/**
 * Load a `forge.collection/1` export into D1 — **from inside the app**.
 *
 * ⚠️ **This exists because `curl` cannot reach production.** Cloudflare Access sits in front
 * of the origin (D-048), so a request without a session is answered `302` by the login page
 * and never reaches the Worker at all. The documented *"export, then curl it up"* flow
 * returns a redirect that looks like a response, writes nothing, and gives no error worth
 * reading. There is no service token configured, and adding one would put a long-lived
 * credential on disk to work around a browser the user is already signed into.
 *
 * Uploading from the app is same-origin, so the Access cookie rides along automatically and
 * the whole problem disappears. It is also simply the better interaction: pick the file you
 * just exported, in the tool you are already looking at.
 */

interface Export {
  counts?: Record<string, unknown>;
}

export type Result =
  | { kind: "ok"; printings: number; copies: number; translated: number; dropped: number }
  | { kind: "fail"; message: string };

/**
 * ⚠️ The result is the **caller's** state, not this component's. A successful import empties
 * the "nothing registered yet" branch that hosts this button, unmounting it mid-sentence and
 * taking the outcome with it — so the one import that skipped nine unreadable entries
 * reported that to nobody.
 */
export function ImportCollection({
  pool,
  onLoaded,
  onResult,
}: {
  pool: CardPool;
  onLoaded: () => void;
  onResult: (result: Result) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (file: File) => {
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as Export;
      if (!parsed?.counts || typeof parsed.counts !== "object") {
        throw new Error("That file has no `counts` — is it a collection export?");
      }

      // Accepts both key spaces. Exports made before D-056 are keyed by public collector
      // code; translating here means an old file on a phone still loads years from now.
      const counts: Record<string, number> = {};
      let translated = 0;
      let dropped = 0;
      for (const [key, raw] of Object.entries(parsed.counts)) {
        const quantity = typeof raw === "number" ? Math.floor(raw) : 0;
        if (quantity <= 0) continue;
        const id = pool.byPrinting.has(key) ? key : pool.byCode.get(key);
        if (!id) {
          dropped += 1;
          continue;
        }
        if (id !== key) translated += 1;
        counts[id] = (counts[id] ?? 0) + quantity;
      }

      if (Object.keys(counts).length === 0) {
        throw new Error("Nothing in that file matched a known printing.");
      }

      const response = await fetch("/collection", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ schema: "forge.collection/1", counts }),
      });
      // ⚠️ An Access redirect arrives as an opaque-ish 200 from a *login page*, not JSON.
      // Checking the content type is what distinguishes "saved" from "you were logged out".
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("json")) {
        throw new Error(
          response.redirected || !type.includes("json")
            ? "The server answered with a page rather than data — you may need to sign in again."
            : `Upload failed (HTTP ${response.status}).`,
        );
      }
      const body = (await response.json()) as { printings?: number; error?: string };
      if (body.error) throw new Error(body.error);

      onResult({
        kind: "ok",
        printings: body.printings ?? Object.keys(counts).length,
        copies: Object.values(counts).reduce((a, b) => a + b, 0),
        translated,
        dropped,
      });
      onLoaded();
    } catch (error) {
      onResult({ kind: "fail", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="import">
      <button
        type="button"
        className="primary"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Loading…" : "Import a collection file"}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void load(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
