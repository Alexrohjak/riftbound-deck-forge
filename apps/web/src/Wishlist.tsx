import { useCallback, useEffect, useState } from "react";
import { wishlist, type Deck, type WishlistRow } from "@forge/engine";
import { ownedCount } from "./filters.js";
import type { CardPool } from "./cards.js";

/**
 * **What to look for when you are trading** — every deck on the shelf, read at once.
 *
 * ⚠️ **This is the only view that reads more than one deck**, and it exists because a copy
 * shortfall is invisible from inside any single one. Two decks each legally running two
 * copies of a card you own two of both pass all 33 checks and **cannot be sleeved at the same
 * time**. The legality layer is not wrong about that — the rules are per deck, and the
 * constraint is per shelf. Nothing else in the app was ever going to notice.
 *
 * ⚠️ **The arithmetic is the engine's** (`advice/wishlist.ts`), not this component's — the
 * same rule the Advisor follows. This file fetches, sums ownership across printings, and
 * renders. It decides nothing, so there is nothing here for a test to fail to reach.
 *
 * ⚠️ **It never suggests a card you do not own.** "You should acquire X" needs a plan and a
 * pool read; that is `legend`/`counter`/`sideboard` work. This counts copies of cards already
 * chosen and stops (D-042).
 */
export function Wishlist({
  pool,
  owned,
}: {
  pool: CardPool;
  owned: Readonly<Record<string, number>>;
}) {
  const [rows, setRows] = useState<WishlistRow[] | null>(null);
  /**
   * ⚠️ A failed read is not an empty wishlist. The two render identically otherwise, and
   * "nothing to buy" is exactly the answer you would act on — see the same note in `useDecks`.
   */
  const [failed, setFailed] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      try {
        const listing = await fetch("/decks");
        const type = listing.headers.get("content-type") ?? "";
        if (!listing.ok || !type.includes("json")) {
          throw new Error(`the deck list answered ${listing.status}`);
        }
        const summaries = (await listing.json()) as { decks?: Array<{ id: string; name: string }> };
        const ids = summaries.decks ?? [];

        const loaded = await Promise.all(
          ids.map(async ({ id, name }) => {
            const response = await fetch(`/decks/${encodeURIComponent(id)}`);
            if (!response.ok) throw new Error(`${name} answered ${response.status}`);
            const body = (await response.json()) as { deck?: Deck } & Deck;
            return { id, name, deck: (body.deck ?? body) as Deck };
          }),
        );

        // Summed across printings, because copy limits are per name (L13, L16) and an
        // alternate art is a second copy of one card rather than one copy of two.
        const ownedByName = new Map<string, number>();
        for (const card of pool.cards) ownedByName.set(card.name, ownedCount(card, owned));

        setRows(wishlist(loaded, pool.index, ownedByName));
        setFailed(null);
      } catch (error) {
        setFailed((error as Error).message || "the network did not answer");
      }
    })();
  }, [owned, pool]);

  useEffect(refresh, [refresh]);

  if (failed) {
    return (
      <div className="wishlist">
        <p className="caveat">⚠️ Could not read your decks — {failed}. This is not an empty list.</p>
      </div>
    );
  }
  if (!rows) return <div className="wishlist"><p className="quiet">Reading every deck…</p></div>;

  const blocking = rows.filter((r) => r.kind === "blocking");
  const spare = rows.filter((r) => r.kind === "spare");
  const upgrades = rows.filter((r) => r.kind === "upgrade");

  return (
    <div className="wishlist">
      <Section
        title="Cannot sleeve together"
        hint="Your decks want more copies than you own. Until these are found, one deck cannot be built while the other is."
        rows={blocking}
        empty="Nothing — every deck can be built at the same time."
        tone="blocking"
      />
      <Section
        title="Already yours — could play more"
        hint="Copies sitting in the boxes that no deck plays. Costs nothing and needs no trade."
        rows={spare}
        empty="Nothing idle — every spare copy is either in a deck or already at the limit."
        tone="spare"
      />
      <Section
        title="Would like more"
        hint="A deck plays every copy it owns and owns fewer than three. Nothing is broken; it would simply rather draw the card."
        rows={upgrades}
        empty="Nothing — no deck is running short of a card it maxes out."
        tone="upgrade"
      />
      <p className="caveat">
        ⚠️ Counts copies of cards your decks already use, summed across printings. It does not
        suggest cards you do not own — that needs a plan, not arithmetic.
      </p>
    </div>
  );
}

function Section({
  title,
  hint,
  rows,
  empty,
  tone,
}: {
  title: string;
  hint: string;
  rows: WishlistRow[];
  empty: string;
  tone: "blocking" | "spare" | "upgrade";
}) {
  return (
    <section className={`wants ${tone}`}>
      <h3>
        {title} <span className="count">{rows.length}</span>
      </h3>
      <p className="quiet">{hint}</p>
      {rows.length === 0 ? (
        <p className="quiet">{empty}</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.name}>
              <span className="want">+{r.short}</span>
              <span className="who">{r.name}</span>
              <span className="have">
                own {r.owned}
                {r.kind === "blocking" ? ` · decks want ${r.needed}` : r.kind === "spare" ? ` · decks play ${r.needed}` : ""}
              </span>
              <span className="decks">{r.decks.map((d) => `${d.name} ×${d.copies}`).join(" · ")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
