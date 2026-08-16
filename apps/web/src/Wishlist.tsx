import { useCallback, useEffect, useState } from "react";
import { wishlist, type Deck, type WishlistRow } from "@forge/engine";
import { ownedCount } from "./filters.js";
import { hd, srcSet, type Card, type CardPool } from "./cards.js";

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
        byName={pool.byName}
      />
      <Section
        title="Spare copies, no trade needed"
        hint={
          "These decks already play the card but run fewer copies than you own. You could add more today for free. " +
          "⚠️ Possible, not recommended — a deck running two of something usually chose to, and the list cannot tell " +
          "a deliberate two from an accidental one. Read it as “here is what is available”, not a to-do list."
        }
        rows={spare}
        empty="Nothing idle — every spare copy is either in a deck or already at its legal limit."
        tone="spare"
        byName={pool.byName}
      />
      <Section
        title="Would like more"
        hint="A deck plays every copy it owns and owns fewer than three. Nothing is broken; it would simply rather draw the card."
        rows={upgrades}
        empty="Nothing — no deck is running short of a card it maxes out."
        tone="upgrade"
        byName={pool.byName}
      />
      <p className="caveat">
        ⚠️ Counts copies of cards your decks already use, summed across printings. It does not
        suggest cards you do not own — that needs a plan, not arithmetic.
      </p>
    </div>
  );
}

/**
 * The card's face, at a size you can match against the one in your hand.
 *
 * ⚠️ **The whole point of this view is standing in a shop holding a card**, and a name in a
 * list does not answer *"is this the one?"* — the art does, instantly and without reading.
 * It is drawn larger than a bare list needs for exactly that reason.
 *
 * Battlefields are landscape and must not be squeezed into a portrait box (the same trap the
 * gallery documents), so the box follows the card's own shape.
 */
function Art({ card, name }: { card: Card | undefined; name: string }) {
  const printing = card?.printings[0];
  // A card the pool no longer carries still gets a row — the shortfall is real either way.
  if (!card || !printing) return <div className="shopart missing" aria-hidden="true" />;
  return (
    <img
      className={card.landscape ? "shopart wide" : "shopart"}
      src={hd(printing, card.landscape ? 240 : 140)}
      srcSet={srcSet(printing)}
      sizes={card.landscape ? "15rem" : "9rem"}
      alt={name}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * One sentence saying what this row is asking of you, in the terms of its own kind.
 *
 * ⚠️ **The three kinds are three different errands** and a shared format hid that. "own 5 ·
 * decks play 1" is true for a spare row and tells you nothing about what to do with it; the
 * blocking row wants you to go and find copies, and the spare row wants you to open a box.
 */
function summarise(r: WishlistRow): string {
  const most = r.decks[0];
  if (r.kind === "blocking") return `own ${r.owned}, your decks want ${r.needed} between them`;
  if (r.kind === "spare") {
    return most
      ? `own ${r.owned} · ${most.name} plays ${most.copies}, could play ${most.copies + r.short}`
      : `own ${r.owned}`;
  }
  return `own ${r.owned} of a possible ${r.owned + r.short} — every copy is in a deck`;
}

function Section({
  title,
  hint,
  rows,
  empty,
  tone,
  byName,
}: {
  title: string;
  hint: string;
  rows: WishlistRow[];
  empty: string;
  tone: "blocking" | "spare" | "upgrade";
  byName: Map<string, Card>;
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
              <Art card={byName.get(r.name)} name={r.name} />
              <div className="detail">
                <span className="want">+{r.short}</span>
                <span className="who">{r.name}</span>
                {/* ⚠️ Each kind gets its own sentence. A single shared format ("own 5 · decks
                    play 1") made the reader work out what the row was asking of them, which is
                    the opposite of what a list you read one-handed in a shop should do. */}
                <span className="have">{summarise(r)}</span>
                <span className="decks">{r.decks.map((d) => `${d.name} ×${d.copies}`).join(" · ")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
