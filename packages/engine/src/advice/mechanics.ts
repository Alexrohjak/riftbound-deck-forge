/**
 * **What the cards in a deck actually say, as findings.**
 *
 * ⚠️ **This is the mechanism half of *"read the card, do not build from the tag."***
 *
 * That rule is written twice in [`EE-BRIEFING §3`](../../../../docs/EE-BRIEFING.md) and it was
 * broken both times. `Cruel Patron` reads *"as an additional cost to play me, **kill a friendly
 * unit**"* and three copies shipped in a deck whose plan was **holding battlefields with
 * bodies**. Nothing caught it, because nothing could: the tag said *4-cost 6-Might body, fills
 * the curve*, and the tag was true.
 *
 * [D-064](../../../../docs/DECISIONS.md#d-064) is the precedent for what to do about it:
 *
 * > *"This used to be an instruction and is now a mechanism. This section already told you to
 * > run `review` on any deck you proposed. A deck of nineteen two-drops shipped anyway, with
 * > every gate green — because an instruction is not a mechanism."*
 *
 * So these findings run inside `reviewAgainstPlan`, which `npm run deck` calls on every write.
 * You cannot propose a deck without them being printed.
 *
 * ## What this is not
 *
 * ⚠️ **Not a veto, and not a score.** Every finding names cards and **quotes the printed
 * clause**, and stops. `Cruel Patron` in a sacrifice deck is a fine card; the same card in a
 * hold deck is the mistake. Only the builder knows which deck this is, and
 * [D-016](../../../../docs/DECISIONS.md#d-016) forbids the composite judgement anyway.
 *
 * ⚠️ **The clause is the point.** A regex over prose over-matches eventually. Quoting the text
 * that matched turns a false positive into something visible in one glance, and keeps every
 * finding a statement about *what Riot printed* rather than about what Forge believes.
 */
import type { CardIndex, Deck } from "../types.js";
import { countedEntries, type Entry } from "../legality/entries.js";
import { hasKeyword } from "../text.js";
import {
  energyThresholds,
  hasMechanic,
  levelThresholds,
  makesDeployGear,
  mechanicsOf,
  xpGranted,
  xpSpent,
  type MechanicHit,
} from "../mechanics.js";
import type { Note } from "./doctrine.js";
import type { Objective } from "./skeleton.js";

/** One card behind a finding, with the words that put it there. */
export interface MechanicCard {
  cardId: string;
  name: string;
  copies: number;
  /** The printed clause that matched. Show it — see the module note. */
  clause: string;
}

export interface MechanicFinding {
  /** The mechanic id from `MECHANICS`. */
  mechanic: string;
  /**
   * ⚠️ **Ordering is by consequence, not by count.** An additional cost that kills your own
   * units outranks a `[Predict]` the opening-hand simulation cannot see, however many of each
   * the deck runs.
   */
  severity: "high" | "medium" | "low";
  cards: MechanicCard[];
  /** Total copies across the named cards — what the deck actually draws. */
  copies: number;
  note: Note;
}

/** Cards named in one finding before it stops listing and starts counting (§2, the directive). */
const NAME_CAP = 4;

const named = (cards: MechanicCard[]): string => {
  const shown = cards.slice(0, NAME_CAP).map((c) => (c.copies > 1 ? `${c.name} ×${c.copies}` : c.name));
  const rest = cards.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} and ${rest} more` : shown.join(", ");
};

const totalCopies = (cards: MechanicCard[]): number => cards.reduce((n, c) => n + c.copies, 0);

/** Every Main Deck entry carrying `mechanic`, with its clause. */
function carrying(entries: Entry[], mechanic: string): MechanicCard[] {
  const found: MechanicCard[] = [];
  for (const e of entries) {
    const hits: MechanicHit[] = mechanicsOf(e.facts?.text);
    const hit = hits.find((h) => h.id === mechanic);
    if (!hit) continue;
    found.push({ cardId: e.cardId, name: e.name, copies: e.quantity, clause: hit.clause });
  }
  // Most copies first: three of a thing is a plan, one of it is a card.
  return found.sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));
}

/**
 * Read a deck's printed text against its plan.
 *
 * ⚠️ **Returns `[]` for a deck with nothing worth saying, and that is the common case.**
 * [D-042](../../../../docs/DECISIONS.md#d-042) — a tool that always has a finding is not
 * reading the deck, it is filling a slot.
 */
export function readMechanics(deck: Deck, objective: Objective, cards: CardIndex): MechanicFinding[] {
  const main = countedEntries(deck, cards).filter((e) => e.zone === "MAIN");
  const findings: MechanicFinding[] = [];

  // ── additional costs — the Cruel Patron class ───────────────────────────────
  //
  // ⚠️ The highest-severity finding in this module, and the one it was written for. An
  // additional cost is paid *every time you play the card*, and it is invisible in every
  // count Forge already computes: the card still fills its curve slot and still counts as a
  // body in its package.
  const extra = carrying(main, "additional-cost");
  if (extra.length > 0) {
    const holding = objective === "hold";
    findings.push({
      mechanic: "additional-cost",
      severity: "high",
      cards: extra,
      copies: totalCopies(extra),
      note: {
        claim: `${totalCopies(extra)} ${totalCopies(extra) === 1 ? "copy charges" : "copies charge"} something beyond ${totalCopies(extra) === 1 ? "its" : "their"} printed cost — ${named(extra)}.`,
        because:
          "An additional cost is paid every time the card is played, and it is invisible to " +
          "every other count: the card still fills its curve slot and still counts inside its " +
          "package. Read the quoted clause and decide whether this deck can afford it" +
          (holding
            ? " — the objective here is to hold, and a cost paid in your own bodies works against exactly that."
            : ".") +
          " ⚠️ Named, never vetoed: the same card is correct in a deck built to pay it.",
        source: "computed",
        confidence: "fact",
        attribution:
          "Printed text, matched on 'as an additional cost' and quoted verbatim — see MechanicFinding.cards[].clause",
      },
    });
  }

  // ── [Level N] thresholds against the deck's own XP ──────────────────────────
  //
  // ⚠️ **The one finding EVALUATION §6.8 specifies word for word**: *"3 cards have [Level 6]
  // abilities; your deck produces 2 XP maximum. Those abilities can never activate. (This one
  // is a hard fact.)"* It stayed unbuilt because nothing could see a threshold.
  const gated = main.filter((e) => levelThresholds(e.facts?.text).length > 0);
  if (gated.length > 0) {
    const highest = Math.max(...gated.flatMap((e) => levelThresholds(e.facts?.text)));
    // Granted XP is printed and countable. [Hunt] is conditional — it needs a conquer — so it
    // is counted separately and never added in, or the deck would be credited with XP it has
    // to go and earn.
    const granted = main.reduce((n, e) => n + xpGranted(e.facts?.text) * e.quantity, 0);
    const hunters = main.filter((e) => hasMechanic(e.facts?.text, "xp-gain")).reduce((n, e) => n + e.quantity, 0);
    const gatedCards: MechanicCard[] = gated.map((e) => {
      const hit = mechanicsOf(e.facts?.text).find((h) => h.id === "level-threshold");
      return { cardId: e.cardId, name: e.name, copies: e.quantity, clause: hit?.clause ?? "" };
    });
    findings.push({
      mechanic: "level-threshold",
      severity: granted === 0 && hunters === 0 ? "high" : "medium",
      cards: gatedCards,
      copies: totalCopies(gatedCards),
      note: {
        claim: `${totalCopies(gatedCards)} ${totalCopies(gatedCards) === 1 ? "card needs" : "cards need"} up to [Level ${highest}], and the deck prints ${granted} XP outright across ${hunters} XP-gaining ${hunters === 1 ? "card" : "cards"}.`,
        because:
          "A Level ability does nothing until its threshold is crossed, so a deck can carry a " +
          "payoff it can never switch on. ⚠️ The two numbers are not addable: printed XP is " +
          "counted from the text, while [Hunt] has to be earned by conquering, and crediting " +
          "it in advance would be inventing the game that produced it.",
        source: "computed",
        confidence: "fact",
        attribution:
          "[Level N] matched in printed text; XP counted from 'gain N XP' only, with [Hunt] cards reported separately because their XP is conditional",
      },
    });
  }

  // ── the XP sink with no source, and the source with no sink ─────────────────
  const sinks = main.filter((e) => xpSpent(e.facts?.text) > 0);
  const sources = main.filter((e) => hasMechanic(e.facts?.text, "xp-gain"));
  if (sinks.length > 0 && sources.length === 0) {
    const sinkCards: MechanicCard[] = sinks.map((e) => {
      const hit = mechanicsOf(e.facts?.text).find((h) => h.id === "xp-spend");
      return { cardId: e.cardId, name: e.name, copies: e.quantity, clause: hit?.clause ?? "" };
    });
    findings.push({
      mechanic: "xp-spend",
      severity: "high",
      cards: sinkCards,
      copies: totalCopies(sinkCards),
      note: {
        claim: `${totalCopies(sinkCards)} ${totalCopies(sinkCards) === 1 ? "card spends" : "cards spend"} XP and nothing in the deck gains any.`,
        because:
          "A sink with no source is a dangling synergy — the card is live only if the game " +
          "hands you XP some other way. Either add a source or accept that these are worse " +
          "than they read.",
        source: "computed",
        confidence: "fact",
        attribution: "'spend N XP' against 'gain N XP' and [Hunt], both counted from printed text",
      },
    });
  }

  // ── the empower charge economy ──────────────────────────────────────────────
  //
  // ⚠️ This is the finding that drove a whole rebuild and could not be seen: `[Empower]` is
  // **once per unit** — *"use only if not Empowered"* — so an empower engine is far hungrier
  // than its payoff count suggests. Only fires when the deck is actually built on it.
  const onceOnly = carrying(main, "empower-once-only");
  const empowerers = main.filter((e) => hasMechanic(e.facts?.text, "empower"));
  if (onceOnly.length > 0 && empowerers.length > 0) {
    const bodies = empowerers.reduce((n, e) => n + e.quantity, 0);
    findings.push({
      mechanic: "empower-once-only",
      severity: "medium",
      cards: onceOnly,
      copies: totalCopies(onceOnly),
      note: {
        claim: `${totalCopies(onceOnly)} of the deck's ${bodies} [Empower] ${bodies === 1 ? "card" : "cards"} read "use only if not Empowered" — one charge per body.`,
        because:
          "An empower plan is limited by bodies to charge, not by charges to spend. Count the " +
          "units this deck expects on board rather than the empower cards in the list — they " +
          "are different numbers and only the first one is the ceiling.",
        source: "computed",
        confidence: "fact",
        attribution: "'use only if not [Empowered]' matched in printed text and quoted verbatim",
      },
    });
  }

  // ── [Deploy] — the gear a payoff asks for by name ───────────────────────────
  //
  // ⚠️ **`gear_matters` cannot see this.** It counts any gear as supply, and these cards read
  // *"a friendly gear with [Deploy]"* — so a deck of Equipment tells Overloaded Traveler it is
  // supplied nine times over while the card sits at its printed Might all game. The keyword is
  // read from the leading run, because every one of the payoffs *mentions* it too.
  const deployGear = main.filter((e) => hasKeyword(e.facts?.text, "Deploy"));
  const deployMakers = main.filter((e) => !hasKeyword(e.facts?.text, "Deploy") && makesDeployGear(e.facts?.text));
  const gearCopies = deployGear.reduce((n, e) => n + e.quantity, 0);
  const makerCopies = deployMakers.reduce((n, e) => n + e.quantity, 0);
  const deployPayoffs = carrying(main, "deploy-payoff");
  if (deployPayoffs.length > 0) {
    const n = totalCopies(deployPayoffs);
    findings.push({
      mechanic: "deploy-payoff",
      severity: gearCopies + makerCopies === 0 ? "high" : "low",
      cards: deployPayoffs,
      copies: n,
      note: {
        claim:
          `${n} ${n === 1 ? "copy needs" : "copies need"} a friendly gear with [Deploy], and the deck runs ${gearCopies} [Deploy] gear` +
          (makerCopies > 0 ? ` plus ${makerCopies} ${makerCopies === 1 ? "copy that makes" : "copies that make"} a [Deploy] token.` : "."),
        because:
          "Ordinary gear does not count: the clause names the keyword. " +
          (gearCopies + makerCopies === 0
            ? "With none in the deck these cards never read their own text."
            : "⚠️ The two numbers are not a ratio to hit — no source publishes one — and a [Deploy] gear only counts while it is still on its battlefield.") ,
        source: "computed",
        confidence: "fact",
        attribution:
          "'gear with [Deploy]' matched in printed text and quoted; supply is cards that lead with [Deploy], and token makers whose reminder reads 'It has [Deploy]'",
      },
    });
  }
  if (deployGear.length > 0) {
    const deployCards: MechanicCard[] = deployGear
      .map((e) => ({ cardId: e.cardId, name: e.name, copies: e.quantity, clause: "[Deploy] (Play this only to a battlefield. When an opponent holds here, kill this.)" }))
      .sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));
    findings.push({
      mechanic: "deploy",
      severity: "low",
      cards: deployCards,
      copies: gearCopies,
      note: {
        claim: `${gearCopies} ${gearCopies === 1 ? "copy is" : "copies are"} [Deploy] gear — played only to a battlefield, and killed when an opponent holds there.`,
        because:
          "These count as gear everywhere else in this review, and they are permanent only " +
          "for as long as the battlefield under them is not held against you. Counted, not " +
          "judged: whether that is a risk depends on which battlefields this deck expects to keep.",
        source: "computed",
        confidence: "fact",
        attribution: "[Deploy] read from the card's leading keywords; the clause is the keyword's printed reminder",
      },
    });
  }

  // ── "Energy cost [7] or more" — a payoff with a number on it ────────────────
  //
  // The `expensive` tag is supplied by anything costing 5 or more, which was right for the
  // three Legends that carried it and is wrong for every Radiance card that prints 7.
  const costly = carrying(main, "energy-threshold");
  if (costly.length > 0) {
    const need = Math.min(...main.flatMap((e) => energyThresholds(e.facts?.text)));
    const fed = main.filter((e) => (e.facts?.energy ?? 0) >= need).reduce((n, e) => n + e.quantity, 0);
    const n = totalCopies(costly);
    findings.push({
      mechanic: "energy-threshold",
      severity: fed === 0 ? "high" : "low",
      cards: costly,
      copies: n,
      note: {
        claim: `${n} ${n === 1 ? "copy pays" : "copies pay"} off on a card costing ${need} or more Energy, and the deck runs ${fed} ${fed === 1 ? "copy" : "copies"} that cost that much.`,
        because:
          fed === 0
            ? "Nothing in the Main Deck reaches the printed threshold, so these never trigger."
            : "Counted from printed Energy, not from the `expensive` tag, which starts at 5. " +
              "⚠️ A payoff that fires on *playing* the expensive card also needs the game to " +
              "last that long; the curve above is where to check that.",
        source: "computed",
        confidence: "fact",
        attribution: "'Energy cost N or more' matched in printed text and quoted; supply is Main Deck copies whose printed Energy is at least N",
      },
    });
  }

  const showOff = carrying(main, "show-off");
  if (showOff.length > 0) {
    const n = totalCopies(showOff);
    findings.push({
      mechanic: "show-off",
      severity: "low",
      cards: showOff,
      copies: n,
      note: {
        claim: `${n} ${n === 1 ? "copy has" : "copies have"} [Show Off] — reveal a matching card from hand, or pick a friendly one, as you play it.`,
        because:
          "The larger effect is printed as conditional on having shown something. Read the " +
          "quoted clause for what each one asks to see; where it names an Energy cost, the " +
          "finding above counts what the deck has to show.",
        source: "computed",
        confidence: "fact",
        attribution: "[Show Off] matched in printed text and quoted",
      },
    });
  }

  // ── capabilities a hold plan is actually made of ────────────────────────────
  const ganking = carrying(main, "ganking");
  if (ganking.length > 0 && objective === "hold") {
    findings.push({
      mechanic: "ganking",
      severity: "low",
      cards: ganking,
      copies: totalCopies(ganking),
      note: {
        claim: `${totalCopies(ganking)} ${totalCopies(ganking) === 1 ? "copy has" : "copies have"} [Ganking] — free movement between battlefields.`,
        because:
          "Stated because the objective is to hold, and holding two battlefields with one " +
          "board is a repositioning problem before it is a Might problem. Counted, not judged: " +
          "no source publishes a target.",
        source: "computed",
        confidence: "fact",
        attribution: "[Ganking] matched in printed text",
      },
    });
  }

  /**
   * ⚠️ **Death payoffs, read together with the additional costs above.**
   *
   * This is the pairing that makes the `Cruel Patron` finding a judgement rather than a
   * verdict. *"Kill a friendly unit"* is a cost in a hold deck and a **trigger** in a
   * `[Deathknell]` deck — the same clause, opposite conclusions. Reporting both and refusing
   * to combine them is what [D-016](../../../../docs/DECISIONS.md#d-016) actually requires.
   */
  const deathknell = carrying(main, "deathknell");
  if (deathknell.length > 0) {
    // ⚠️ Counted in copies, like the first half of the sentence. Counting cards here and
    // copies there put "3 copies … alongside 1 that kills" in one claim, where the two numbers
    // look comparable and are not.
    const sacrifices = extra.filter((c) => /kill|sacrifice/i.test(c.clause));
    const sacrificeCopies = totalCopies(sacrifices);
    findings.push({
      mechanic: "deathknell",
      severity: "low",
      cards: deathknell,
      copies: totalCopies(deathknell),
      note: {
        claim: `${totalCopies(deathknell)} ${totalCopies(deathknell) === 1 ? "copy pays" : "copies pay"} off when your own unit dies${sacrificeCopies > 0 ? `, alongside ${sacrificeCopies} ${sacrificeCopies === 1 ? "copy that kills" : "copies that kill"} a friendly unit as a cost` : ""}.`,
        because:
          sacrificeCopies > 0
            ? "Those two halves are the same engine, and the cost finding above should be read " +
              "with this one rather than against it — a friendly death is a price in one deck " +
              "and a trigger in another."
            : "A death payoff with nothing reliably feeding it is waiting on the opponent to " +
              "kill your units on your schedule. Counted, not judged.",
        source: "computed",
        confidence: "fact",
        attribution: "[Deathknell] matched in printed text; the sacrifice pairing is matched on 'kill'/'sacrifice' inside an additional-cost clause",
      },
    });
  }

  /**
   * ⚠️ **Optional extra costs — the ones that buy tempo rather than charge for it.**
   *
   * `[Accelerate]` and `[Repeat]` both read *"pay more to get more"*, which makes them
   * invisible to the curve: the card sits in its printed bucket and is played from a higher
   * one. On a fast plan that is the whole point; on a slow one it is a rune you did not budget.
   */
  const optional = [...carrying(main, "accelerate"), ...carrying(main, "repeat")];
  if (optional.length > 0) {
    findings.push({
      mechanic: "accelerate",
      severity: "low",
      cards: optional,
      copies: totalCopies(optional),
      note: {
        claim: `${totalCopies(optional)} ${totalCopies(optional) === 1 ? "copy has" : "copies have"} an optional extra cost — [Accelerate] or [Repeat] — and sits in the curve at its printed price.`,
        because:
          "The energy histogram counts these where they are printed, not where they are " +
          "actually played, so the real curve is heavier than the one above whenever you take " +
          "the option. ⚠️ Stated as a caveat on a number this review already showed, not as a " +
          "fault in the cards.",
        source: "computed",
        confidence: "fact",
        attribution: "[Accelerate] and [Repeat] matched in printed text; the curve in this same review buckets on printed energy",
      },
    });
  }

  // ── what the opening-hand simulation cannot see ─────────────────────────────
  const predict = carrying(main, "predict");
  if (predict.length > 0) {
    findings.push({
      mechanic: "predict",
      severity: "low",
      cards: predict,
      copies: totalCopies(predict),
      note: {
        claim: `${totalCopies(predict)} ${totalCopies(predict) === 1 ? "copy carries" : "copies carry"} [Predict], which the opening-hand simulation does not model.`,
        because:
          "Deck manipulation makes the real opening better than the simulated one, so treat " +
          "the mulligan number as a floor rather than an estimate. ⚠️ Said so that a modelled " +
          "number is not mistaken for a complete one.",
        source: "computed",
        confidence: "fact",
        attribution: "[Predict] matched in printed text; simulateMulligans draws uniformly and models no manipulation",
      },
    });
  }

  const rank = { high: 0, medium: 1, low: 2 } as const;
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
