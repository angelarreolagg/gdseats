/**
 * ─── READING THIS FILE ──────────────────────────────────────────────────────
 * Covers:    `pricing.service.ts` — the ±10% verdict that the whole AI layer
 *            rests on.
 * Technique: the pure unit test. No React, no DOM, no mocks, no async, no
 *            fixtures. Import a function, call it, check what came back.
 * Run it:    pnpm vitest run src/domains/deal-analyzer/tests/pricing.service.test.ts --reporter=verbose
 *
 * ANATOMY — every test file in this repo has these four parts, in this order:
 *   1. imports          — the test framework, then the thing under test
 *   2. fixtures         — shared input data (this file needs none: numbers only)
 *   3. describe(...)    — one block per exported function, named after it
 *   4. it(...)          — one behaviour per test, named as a sentence
 *
 * `describe` and `it` come from Vitest. `vite.config.ts` sets `globals: true`, so
 * they would exist without the import on line below — we import them anyway, so
 * that a reader can see where they come from and so an editor can resolve them.
 *
 * WHY THIS FILE IS THE ONE TO READ FIRST
 * `pricing.service.ts` is a *pure* module: same inputs, same outputs, no clock,
 * no network, no random, no globals. That is what makes these tests four lines
 * long. Most of the difficulty in the rest of the suite comes from testing things
 * that are not pure — a component that renders over time, a generator that
 * invents its own data. Notice how much of that difficulty simply is not here,
 * and you have the argument for pushing logic out of components and into
 * services in the first place.
 *
 * THE TWO COMMENT STYLES BELOW
 *   `Validates: / Why it matters:`  — the repo convention. WHY the test earns its
 *                                     place: what breaks commercially without it.
 *   `STEP 1 / 2 / 3`                — added for learning. HOW the test works:
 *                                     what runs, and why that matcher.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { describe, expect, it } from 'vitest'
import {
  calculatePercentageDiff,
  evaluateDeal,
  getDealStatus,
  getRecommendation,
} from '../services/pricing.service'

describe('calculatePercentageDiff', () => {
  /**
   * Validates: the sign convention — below the estimate is negative.
   * Why it matters: every status and recommendation in the product reads this
   * sign. Inverting it would tell buyers to Wait on bargains and Buy overpriced
   * listings, with no visible error anywhere.
   */
  /**
   * STEP 1 — Arrange. Nothing to set up. The inputs are two literals written
   *   inline, which is possible only because the function reads nothing else.
   *   `36_000` is JavaScript's numeric separator: identical to `36000`, easier to
   *   scan at a glance. No relation to testing; it is just how this repo writes
   *   money.
   *
   * STEP 2 — Act. `calculatePercentageDiff(36_000, 40_000)` calls the REAL
   *   implementation in `../services/pricing.service`. Nothing is stubbed. When a
   *   test imports the thing it is testing and calls it directly, every line that
   *   runs is production code — so a passing test is evidence about the shipped
   *   product, not about the test's own scaffolding.
   *
   * STEP 3 — Assert. `toBeCloseTo(-0.1)` rather than `toBe(-0.1)`, and this is
   *   the single most common trip-up in numeric tests. `(36000 - 40000) / 40000`
   *   is exactly -0.1 in decimal, but floating-point arithmetic is binary, and a
   *   great many decimal fractions have no exact binary form — the classic
   *   demonstration being `0.1 + 0.2 === 0.30000000000000004`. `toBe` is
   *   `Object.is`, an exact bit-for-bit comparison, so it will eventually fail on
   *   an arithmetic change that is entirely correct. `toBeCloseTo` compares to a
   *   number of decimal places (5 by default). The optional second argument is
   *   that count, NOT a tolerance: `toBeCloseTo(0.1111, 4)` below means "agree to
   *   four decimal places".
   *
   *   Two assertions in one `it` because they are one idea — the sign flips with
   *   the operands. Split them and you get two tests that fail together and are
   *   read together, which is noise rather than precision.
   */
  it('returns a negative value when the listing sits below the estimate', () => {
    expect(calculatePercentageDiff(36_000, 40_000)).toBeCloseTo(-0.1)
    expect(calculatePercentageDiff(40_000, 36_000)).toBeCloseTo(0.1111, 4)
  })

  /**
   * Validates: the ratio is relative to the estimate, not the listing.
   * Why it matters: dividing by the wrong operand shifts the number just enough
   * to look plausible while silently moving listings across the ±10% bands.
   */
  /**
   * STEP 1 — Choosing the input is the whole test. $44,000 against $40,000 is
   *   +10% of the estimate and +9.09% of the listing. Those two readings differ,
   *   so this input can tell them apart.
   *
   *   Contrast with $40,000 against $40,000, where both readings are 0%, or
   *   $50,000 against $25,000, where an operand swap gives 100% vs 50% — also
   *   distinguishable, but far from any boundary and therefore less useful.
   *
   *   Picking inputs that can distinguish the right implementation from a
   *   plausible wrong one is most of what writing a good test is. A test that
   *   passes under both is not a test; it is a line of code that runs.
   *
   * STEP 3 — The inline comment on the assertion states the arithmetic. Do that
   *   whenever a number in a test is derived rather than obvious: the next reader
   *   needs to know whether `0.1` is the correct answer or the current answer.
   */
  it('expresses the difference as a fraction of the estimate', () => {
    // $44,000 against a $40,000 estimate is +10% of the estimate, not +9.09%.
    expect(calculatePercentageDiff(44_000, 40_000)).toBeCloseTo(0.1)
  })

  /**
   * Validates: a zero or missing estimate cannot produce Infinity or NaN.
   * Why it matters: the estimate arrives from the host page. If an upstream feed
   * ever sends 0, an unguarded divide would render "Infinity%" to a real buyer.
   */
  /**
   * STEP 2 — This is a *guard clause* test, and guard clauses are where bugs
   *   live: the path is never taken in normal use, so it is never exercised by
   *   hand. Division by zero in JavaScript does not throw — it returns `Infinity`
   *   (or `NaN` for `0/0`), so the failure is silent and travels all the way to
   *   the screen as the string "Infinity%".
   *
   * STEP 3 — The assertion is `Number.isFinite(...)` rather than a specific
   *   value, and that restraint is deliberate. The requirement is "must not blow
   *   up"; `pricing.service.ts` currently satisfies it by clamping the divisor to
   *   1, but returning 0, or the listing price, would satisfy it equally. Pinning
   *   the exact number would freeze an implementation detail nobody promised, and
   *   the next person changing the clamp would get a red test with no defect.
   *
   *   Rule of thumb: assert the property the caller depends on, not the value the
   *   implementation happens to produce.
   */
  it('guards against a zero estimate', () => {
    expect(Number.isFinite(calculatePercentageDiff(40_000, 0))).toBe(true)
  })

  it('reports an exact match as no difference', () => {
    expect(calculatePercentageDiff(36_000, 36_000)).toBe(0)
  })
})

describe('getDealStatus', () => {
  /**
   * Validates: the three bands map to the right verdict.
   * Why it matters: this is the single classification the whole widget exists to
   * make; everything else is presentation.
   */
  /**
   * STEP 1 — Three inputs for three bands. Not thirty.
   *
   *   This is EQUIVALENCE PARTITIONING. `getDealStatus` splits the number line
   *   into three regions, and inside a region every value is handled by the same
   *   branch. So -0.25 tests exactly what -0.9 and -0.31 would test; running all
   *   three adds runtime and reading time and no information.
   *
   *   The partition tells you how many tests you need: one per region, plus the
   *   edges between them — which is the next test, and the reason these two are
   *   separate. This one proves the mapping; that one proves the borders.
   */
  it('classifies each band', () => {
    expect(getDealStatus(-0.25)).toBe('undervalued')
    expect(getDealStatus(0)).toBe('fair')
    expect(getDealStatus(0.25)).toBe('overpriced')
  })

  /**
   * Validates: the ±10% boundaries themselves are fair — only strictly beyond
   * them moves the verdict.
   * Why it matters: this is where an off-by-one comparison does commercial
   * damage. A listing at exactly +10% wrongly labelled "Overpriced" tells a buyer
   * to walk away from a fairly priced seat, and the seller loses the sale.
   */
  /**
   * STEP 1 — BOUNDARY VALUE ANALYSIS, and the most valuable four lines in the
   *   file. `getDealStatus` is four lines of `<` and `>` (pricing.service.ts:33).
   *   The realistic defect is not "wrong branch" — it is `<` written where `<=`
   *   was meant. That mistake is invisible to every input except one: the
   *   boundary itself.
   *
   *   Feed it -0.25 and both versions answer "undervalued". Feed it exactly -0.1
   *   and they disagree. So the test pins two values per edge:
   *     -0.1     → must be 'fair'          (the boundary belongs to the middle)
   *     -0.1001  → must be 'undervalued'   (a hair past it does move)
   *   and the mirror image on the positive side. Together they fix the edge in
   *   place from both sides — one alone would leave the other free to drift.
   *
   * STEP 3 — `toBe` is right here where `toBeCloseTo` was right above: these are
   *   strings, compared exactly. Match the matcher to the type, not to habit.
   *
   *   Whenever you read a service with a threshold in it, look for the test that
   *   sits ON the threshold. If there isn't one, the threshold is not tested —
   *   whatever else is.
   */
  it('treats the exact boundaries as fair', () => {
    expect(getDealStatus(-0.1)).toBe('fair')
    expect(getDealStatus(0.1)).toBe('fair')
    expect(getDealStatus(-0.1001)).toBe('undervalued')
    expect(getDealStatus(0.1001)).toBe('overpriced')
  })
})

describe('getRecommendation', () => {
  /**
   * Validates: every status maps to its intended stance.
   * Why it matters: the recommendation is the part a buyer acts on. A crossed
   * mapping would be confidently, specifically wrong advice about real money.
   */
  it('maps each status to its stance', () => {
    expect(getRecommendation('undervalued')).toBe('opportunity')
    expect(getRecommendation('fair')).toBe('aligned')
    expect(getRecommendation('overpriced')).toBe('patience')
  })

  /**
   * Validates: the service returns keys, never display copy.
   * Why it matters: the wording is a conversion-sensitive product decision that
   * gets tuned by non-engineers. If a phrase leaked into pricing logic, changing
   * it would mean editing the module the verdict maths lives in.
   */
  /**
   * STEP 2 — A loop inside a test, which is fine when the body is one assertion
   *   applied to a small closed set. `as const` makes the array a readonly tuple
   *   of literal types instead of `string[]`, so TypeScript accepts each element
   *   as a `DealStatus` — this is a typing device, not a testing one, but it
   *   shows up constantly in this suite.
   *
   *   Watch the trade: a loop reports ONE failure for the whole set and its
   *   message names no element, so a red test tells you less. Worth it for three
   *   iterations of one line; not worth it once the body grows or the cases
   *   differ. Vitest offers `it.each` when you want per-case reporting.
   *
   * STEP 3 — This asserts an ARCHITECTURAL rule, not a value: "the return is a
   *   key, not a sentence". `not.toMatch(/\s/)` — no whitespace — is a cheap
   *   proxy for it, since 'opportunity' passes and 'You may find better value by
   *   waiting' does not.
   *
   *   It is a proxy, and an imperfect one: 'Wait' would slip through. That is
   *   acceptable, because it catches the realistic mistake (someone pastes the
   *   product copy in here) rather than the adversarial one. Tests are written
   *   against the mistakes people actually make.
   */
  it('returns semantic keys rather than user-facing phrases', () => {
    for (const status of ['undervalued', 'fair', 'overpriced'] as const) {
      expect(getRecommendation(status)).not.toMatch(/\s/)
    }
  })
})

describe('evaluateDeal', () => {
  /**
   * Validates: the composed pipeline agrees with its parts.
   * Why it matters: the panel calls only this function. If composition drifted
   * from the units, the tested behaviour above would stop describing what ships.
   */
  /**
   * STEP 1 — Everything above tests a unit in isolation. Isolated tests can all
   *   pass while the product is broken, because none of them exercises the wiring
   *   between the units. `evaluateDeal` IS the wiring, and `AIInsightPanel` calls
   *   only this — so if it drifted, every green test above would be describing
   *   code nobody runs.
   *
   * STEP 3 — Read the last assertion closely. It does not hardcode 'patience';
   *   it recomputes the answer by hand — `getRecommendation(getDealStatus(diff))`
   *   — and checks the composition agrees with its own parts.
   *
   *   That is a different KIND of assertion. The three lines above it pin
   *   specific values, so they fail if the numbers change. This one pins a
   *   RELATIONSHIP, so it survives any change to the thresholds or the copy and
   *   fails only if composition itself breaks. Both belong here: the literals
   *   catch a wrong answer, the relationship catches a wrong structure.
   */
  it('composes diff, status, and recommendation consistently', () => {
    const verdict = evaluateDeal(40_000, 36_000)

    expect(verdict.percentageDiff).toBeCloseTo(0.1111, 4)
    expect(verdict.status).toBe('overpriced')
    expect(verdict.recommendation).toBe('patience')
    expect(verdict.recommendation).toBe(getRecommendation(getDealStatus(verdict.percentageDiff)))
  })

  it('reads the demo listing as overpriced', () => {
    // The screenshot's numbers: $40,000 asked against a $36,000 estimate.
    expect(evaluateDeal(40_000, 36_000).status).toBe('overpriced')
  })
})
