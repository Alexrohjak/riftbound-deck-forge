import { useCallback, useEffect, useState } from "react";
import type { Holding } from "@forge/engine";

/**
 * What is already in sleeves — D-017, DATA-MODEL §3.
 *
 * ⚠️ **Read, never written.** There is no "commit a card" call, because promoting a deck to
 * `BUILT` is the only thing that creates a commitment and dismantling it is the only thing
 * that releases one. Commitments are derived from deck state on every read, so this hook has
 * nothing to keep in sync — it just re-reads when the thing they are derived *from* changes.
 */
export function useCommitments() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  /**
   * ⚠️ Absent is not the same as empty. Until the first read lands, "no deck holds this card"
   * is a guess — and drawing a card as available when it may not be is the one direction this
   * feature must not fail in. `null` lets the UI stay quiet rather than assert.
   */
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    fetch("/commitments")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: { holdings?: Holding[] }) => {
        setHoldings(body.holdings ?? []);
        setLoaded(true);
      })
      // A failed read leaves the previous answer standing rather than claiming nothing is
      // committed. Being briefly stale is recoverable; declaring sleeved cards free is not.
      .catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  return { holdings, loaded, refresh };
}
