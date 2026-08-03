import { checkLegality, staticCardIndex, type Deck } from "@forge/engine";

/**
 * The `F1` walking skeleton (D-027): prove the deployed page runs the real engine.
 *
 * There is no card data here yet — that arrives at `F3` — so this uses a fixed deck
 * and a small name map. What it demonstrates is the thing `F1` exists to demonstrate:
 * **the same package that answers Claude Code is running in the browser** (D-047).
 */
const NAMES: Record<string, string> = {
  "legend-jinx": "Jinx, the Loose Cannon",
  "ogn-202-298": "Jinx, Rebel",
  "ogn-030-298": "Punching Poro",
  "rune-fury": "Fury Rune",
  "bf-001": "Noxus",
  "bf-002": "Piltover",
  "bf-003": "Ionia",
  // Twelve distinct filler names — see DEMO_DECK.
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [`filler-${i + 1}`, `Filler ${i + 1}`]),
  ),
};

const DEMO_DECK: Deck = {
  id: "demo",
  name: "Skeleton",
  state: "DRAFT",
  legendCardId: "legend-jinx",
  chosenChampionCardId: "ogn-202-298",
  slots: [
    { cardId: "ogn-030-298", zone: "MAIN", quantity: 3 },
    // 12 names x 3 = 36, not one name x 36. Padding with a single name breaks the
    // 3-copy limit (L13), which made the skeleton report a violation that said nothing
    // about the engine — only about lazy padding.
    ...Array.from({ length: 12 }, (_, i) => ({
      cardId: `filler-${i + 1}`,
      zone: "MAIN" as const,
      quantity: 3,
    })),
    { cardId: "rune-fury", zone: "RUNE", quantity: 12 },
    { cardId: "bf-001", zone: "BATTLEFIELD", quantity: 1 },
    { cardId: "bf-002", zone: "BATTLEFIELD", quantity: 1 },
    { cardId: "bf-003", zone: "BATTLEFIELD", quantity: 1 },
  ],
};

export function App() {
  const result = checkLegality(DEMO_DECK, staticCardIndex(NAMES));

  return (
    <main>
      <header>
        <h1>Forge</h1>
        <p className="sub">Walking skeleton · F1</p>
      </header>

      <section className="card">
        <h2>The engine is running in your browser</h2>
        <p>
          This page imports <code>@forge/engine</code> — the same package{" "}
          <code>apps/cli</code> exposes to Claude Code. One implementation, two consumers.
        </p>

        <dl className="rows">
          <div>
            <dt>Deck</dt>
            <dd>{DEMO_DECK.name}</dd>
          </div>
          <div>
            <dt>Implemented checks</dt>
            <dd>
              {result.coverage.implemented} of {result.coverage.specified}
            </dd>
          </div>
          <div>
            <dt>Verdict</dt>
            <dd className={result.legal ? "pass" : "fail"}>
              {result.legal ? "passes every implemented check" : `${result.violations.length} violation(s)`}
            </dd>
          </div>
        </dl>

        {result.violations.length > 0 && (
          <ul className="violations">
            {result.violations.map((v) => (
              <li key={`${v.check}-${v.message}`}>
                <b>{v.check}</b> <span className="cite">{v.citation}</span>
                <br />
                {v.message}
              </li>
            ))}
          </ul>
        )}

        {/* Omit rather than fake (D-022) applies to our own confidence too. */}
        <p className="caveat">⚠️ {result.coverage.caveat}</p>
      </section>

      <footer>
        Not a deckbuilder yet — that is <code>F2</code>. This exists to prove the pipeline:
        push, deploy, open on a phone.
      </footer>
    </main>
  );
}
