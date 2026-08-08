/**
 * ─── READING THIS FILE ──────────────────────────────────────────────────────
 * Covers:    `marketTrend.service.ts` — the Popularity Insight behind every team
 *            card: 12 seeded months of demand, a 3-month forecast, and the
 *            heating / steady / cooling verdict drawn from them.
 * Technique: testing GENERATED data. The function invents its own output, so
 *            there is no expected value to write down.
 * Run it:    pnpm vitest run src/domains/teams/tests/marketTrend.service.test.ts --reporter=verbose
 *
 * THE PROBLEM THIS FILE SOLVES
 * `pricing.service.test.ts` could assert `getDealStatus(-0.25) === 'undervalued'`
 * because the answer is knowable in advance. Nothing here is. `getMarketTrend`
 * runs a seeded random walk; asking "what is the Cowboys' demand in month 7"
 * has no answer except "whatever the generator produced". Copying today's number
 * into the test would pin an accident, and the test would break on any reseed
 * while catching nothing.
 *
 * So you test PROPERTIES that must hold whatever the numbers are. Four kinds are
 * used below, and between them they cover most generated-data testing anywhere:
 *
 *   1. DETERMINISM     — the same input yields the same output, twice
 *   2. SELF-CONSISTENCY— a derived field agrees with the data it came from
 *   3. INVARIANTS      — something true of every element (all values positive)
 *   4. COVERAGE        — the whole set still exercises every branch
 *
 * Notice what all four have in common: none of them names a number the generator
 * produced. That is what lets the seed change without the suite going red, while
 * still failing the moment the generator stops doing its job.
 *
 * TWO SEAMS THAT MAKE THIS TESTABLE AT ALL
 *   - The randomness is SEEDED (`createRandom('trend:' + team.id)`), not
 *     `Math.random()`. Determinism is a product requirement here, not a testing
 *     convenience — see the comment on the determinism test below.
 *   - `now` is an INJECTED PARAMETER with a default
 *     (`getMarketTrend(team, now = new Date())`, marketTrend.service.ts:91). The
 *     test passes a fixed `NOW`, so no clock has to be mocked. Passing time in
 *     rather than reading it inside is the cheapest testability decision in this
 *     codebase, and it is one line.
 *
 * Comment styles: `Validates: / Why it matters:` is the repo convention — why the
 * test is worth having. `STEP` blocks were added for learning — how it works.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { describe, expect, it } from 'vitest'
import {
  classifyMomentum,
  getMarketTrend,
  getTrendPresentation,
  MATERIAL_MOMENTUM,
} from '../services/marketTrend.service'
import { TEAMS, getTeamById } from '../data/teams'
import { TREND_ICON } from '../components/trendPresentation'

/**
 * Module-scope fixtures, SCREAMING_SNAKE by convention here.
 *
 * `TEAM` is real catalogue data pulled with `getTeamById`, not a hand-written
 * `{ id: 'dal', ... }` literal. Preferring real data over invented fixtures is a
 * deliberate habit in this suite: a fixture drifts from the type it copies, and a
 * test built on a stale shape passes while describing a team that no longer
 * exists. The `!` is the non-null assertion — 'dal' is in the catalogue, and if
 * it ever is not, this line throwing is the correct outcome.
 *
 * `NOW` is frozen. The month LABELS are derived from it, so a test using the real
 * clock would produce different labels tomorrow — the classic flaky test that
 * fails once a month and is impossible to reproduce.
 */
const TEAM = getTeamById('dal')!
const NOW = new Date('2026-08-07')

describe('classifyMomentum', () => {
  /**
   * Validates: the ±3% band, including both boundaries.
   * Why it matters: this is where a flat market gets mislabelled as a trend. A
   * card that says "Cooling off" on a 3% wobble sends a buyer to the wrong
   * franchise expecting a discount that was never there.
   */
  /**
   * STEP 1 — Boundary value analysis again, exactly as in `getDealStatus` — the
   *   shapes rhyme because the problems do. Both functions cut a number line into
   *   three, and in both the realistic defect is `>` where `>=` was meant.
   *
   *   One thing here is better than the pricing version, and worth copying: the
   *   test imports `MATERIAL_MOMENTUM` from the service instead of typing `0.03`.
   *   So it asserts "the threshold, wherever it is set, counts as steady" — a
   *   statement about the RULE. Retune the band to 4% and this test still says
   *   something true. Hardcode `0.03` and it goes red on a deliberate product
   *   decision, which teaches people to distrust the suite.
   *
   *   Import the constant when you are testing the rule. Write the literal when
   *   the number itself is the thing being pinned.
   *
   * STEP 3 — `classifyMomentum(0)` is in here too. Zero is not a boundary; it is
   *   the ordinary middle. It earns its line because 0 is the value most likely
   *   to be special-cased by accident.
   */
  it('treats the exact thresholds as steady', () => {
    expect(classifyMomentum(MATERIAL_MOMENTUM)).toBe('steady')
    expect(classifyMomentum(-MATERIAL_MOMENTUM)).toBe('steady')
    expect(classifyMomentum(0)).toBe('steady')
  })

  it('classifies moves beyond the band', () => {
    expect(classifyMomentum(0.031)).toBe('heating')
    expect(classifyMomentum(-0.031)).toBe('cooling')
    expect(classifyMomentum(0.4)).toBe('heating')
    expect(classifyMomentum(-0.4)).toBe('cooling')
  })
})

describe('trend presentation', () => {
  /**
   * Validates: tone is relative to the BUYER, not to the number.
   * Why it matters: this pins the deliberate inversion. `insights.service` already
   * scores a falling ask as positive because it is leverage for the buyer. If
   * someone "corrects" this to the intuitive up-is-green, the same green would
   * mean "good deal" on a listing and "expensive" on a team card, in one product.
   */
  /**
   * STEP 2 — Three trivial-looking assertions, and the most important test in the
   *   file. It pins a decision that looks like a BUG to anyone reading the code
   *   cold: a market going UP is amber, a market going DOWN is green.
   *
   *   That is correct — a cooling market is where seats get cheaper, and the
   *   reader is a buyer — but nothing in the code says so, and the intuition
   *   "up is good" is strong enough that someone will eventually "fix" it. When
   *   they do, this test fails, and the `Why it matters:` block above tells them
   *   what they just broke and where the other half of the convention lives.
   *
   *   This is a use for tests that gets little attention: a test as the guardrail
   *   on a counter-intuitive decision. The assertion is worth almost nothing; the
   *   comment attached to it is worth a great deal. When you catch yourself
   *   writing "this looks wrong but is deliberate" in a code comment, that is the
   *   signal to also write the test that makes the comment enforceable.
   */
  it('paints a cooling market as good and a heating one as caution', () => {
    expect(getTrendPresentation('cooling').tone).toBe('good')
    expect(getTrendPresentation('heating').tone).toBe('fair')
    expect(getTrendPresentation('steady').tone).toBe('neutral')
  })

  /**
   * Validates: every direction ships an icon name and a label.
   * Why it matters: green vs amber measures CVD ΔE 7.0 under deuteranopia — too
   * close for colour to carry the meaning alone. The icon and label are the
   * required mitigation, so a missing one is an accessibility regression.
   */
  /**
   * STEP 2 — An EXHAUSTIVENESS test. It does not check what any label says; it
   *   checks that no direction is missing one. Add a fourth direction to the union
   *   type and forget its presentation entry, and this fails.
   *
   *   `TREND_ICON[presentation.iconName]` reaches across the layer boundary on
   *   purpose. Services in this repo must stay free of React, so they emit an icon
   *   NAME and the component layer maps it to a component. That split means a
   *   service can happily return `iconName: 'plummeting'` with nothing to render
   *   it — a break that neither side can see alone. This lookup is the only place
   *   the two halves are checked against each other.
   *
   * STEP 3 — `expect(...).toBeDefined()` on the lookup, and `.length > 0` on the
   *   strings. Weak assertions, chosen on purpose: the copy is product wording and
   *   will change. What must not change is that it EXISTS.
   */
  it('always carries an icon name and a text label', () => {
    for (const direction of ['heating', 'steady', 'cooling'] as const) {
      const presentation = getTrendPresentation(direction)
      expect(TREND_ICON[presentation.iconName]).toBeDefined()
      expect(presentation.label.length).toBeGreaterThan(0)
      expect(presentation.buyerImplication.length).toBeGreaterThan(0)
    }
  })
})

describe('getMarketTrend', () => {
  /**
   * Validates: the same team always produces the same series.
   * Why it matters: the sparkline and the percentage printed beside it are two
   * views of one array. An unseeded walk would let the chart and the number
   * disagree between renders — a contradiction the user sees but cannot explain.
   */
  /**
   * STEP 2 — PROPERTY 1: DETERMINISM. This line looks like it proves nothing —
   *   surely `f(x)` equals `f(x)`? For a pure function, yes. `getMarketTrend` is
   *   not obviously one: it runs a random walk. The test asserts that its
   *   randomness comes from a SEED rather than from `Math.random()`, and it is the
   *   only thing in the suite that would notice the difference.
   *
   *   Swap `createRandom` for `Math.random` in the service and every other test
   *   here still passes — the values would still be positive, the series would
   *   still be 15 long, momentum would still agree with the curve. This one fails
   *   immediately.
   *
   *   And the requirement is real, not academic. React may render a component any
   *   number of times; unseeded data would redraw a different curve next to an
   *   unchanged percentage, and the user sees two numbers that disagree with no
   *   way to explain it.
   *
   * STEP 3 — `toEqual`, not `toBe`. This is the matcher pair worth memorising:
   *     toBe    → Object.is. Same primitive, or literally the same object.
   *     toEqual → deep structural walk. Same shape and same leaf values.
   *   Two separate calls return two different array objects, so `toBe` would fail
   *   on every implementation, correct or not. Reach for `toEqual` for objects and
   *   arrays; `toBe` for numbers, strings, booleans, and identity checks.
   */
  it('is deterministic for a given team', () => {
    expect(getMarketTrend(TEAM, NOW)).toEqual(getMarketTrend(TEAM, NOW))
  })

  /**
   * STEP 2 — The counterpart, and it needs stating. Determinism alone is
   *   satisfied by a function that returns the same constant for everybody. This
   *   pins that the seed actually varies with the team.
   *
   *   A pattern to carry: a property test often needs a partner asserting the
   *   degenerate case is excluded. "Always the same" plus "not always the same as
   *   each other" is a much tighter specification than either alone.
   *
   * STEP 3 — `.map((p) => p.value)` narrows the comparison to the numbers.
   *   Comparing whole objects would also succeed, but for the wrong reason —
   *   month labels are shared, so a difference there would be no evidence about
   *   the walk. Assert on the field that carries the claim.
   */
  it('produces different markets for different teams', () => {
    const a = getMarketTrend(TEAM, NOW).series.map((p) => p.value)
    const b = getMarketTrend(getTeamById('jax')!, NOW).series.map((p) => p.value)
    expect(a).not.toEqual(b)
  })

  /**
   * Validates: exactly the last three points are the forecast.
   * Why it matters: the dashed segment is what tells the reader "this part has
   * not happened yet". A miscount presents prediction as recorded history.
   */
  /**
   * STEP 3 — PROPERTY 3: INVARIANTS over the SHAPE rather than the values. The
   *   numbers are unknowable; the structure is fully specified — 12 recorded
   *   months, then 3 projected, in that order.
   *
   *   Read the four assertions as one sentence: there are 15 points, 3 of them
   *   projected, and the split falls at index 12 — none before, all after.
   *   The last two are what make it airtight. Drop them and a generator that
   *   marked points 0, 5 and 9 as projected would pass with 15 and 3.
   *
   *   `.every(...)` is the idiom for "all of them", and it reads naturally inside
   *   `expect(...).toBe(true)`. The cost is the failure message: `expected false
   *   to be true` names no element. Acceptable when the assertion above it has
   *   already localised the problem.
   */
  it('returns 12 actual months followed by 3 projected', () => {
    const { series } = getMarketTrend(TEAM, NOW)

    expect(series).toHaveLength(15)
    expect(series.filter((point) => point.projected)).toHaveLength(3)
    expect(series.slice(0, 12).every((point) => !point.projected)).toBe(true)
    expect(series.slice(12).every((point) => point.projected)).toBe(true)
  })

  /**
   * Validates: momentum describes the forecast horizon and agrees with the series.
   * Why it matters: the card's headline number must be derivable from the curve
   * drawn next to it, or the two are just separate claims sitting side by side.
   */
  /**
   * STEP 2 — PROPERTY 2: SELF-CONSISTENCY, and the sharpest technique in this
   *   file. The expected value is not written down — it is RECOMPUTED from the
   *   output the function just returned, using the formula the product promises,
   *   and the two are compared.
   *
   *   Read it as the claim on the card: "momentum is the change from the last
   *   recorded month to the last projected one". Indices 11 and 14. The test
   *   restates that in arithmetic and checks the service agrees with itself.
   *
   *   What this buys: the test cannot be broken by a reseed, by retuning the
   *   drift, or by changing any value in the walk. It fails on exactly one thing
   *   — momentum measuring something other than what it claims. For instance,
   *   measuring across the 12 months of HISTORY instead of the forecast, which is
   *   a plausible reading of the code and would make the card answer "what
   *   already happened" while its label promises "what is about to".
   *
   *   Generalise it: when you cannot know the output, check that the outputs are
   *   consistent with each other. Nearly every generator has some field derivable
   *   from another, and that relationship is the assertion.
   *
   * STEP 3 — `toBeCloseTo(x, 2)` — floating point again, two decimal places,
   *   plenty for a percentage the UI rounds to a whole number anyway.
   */
  it('measures momentum from the last actual to the last projected point', () => {
    const { series, momentum } = getMarketTrend(TEAM, NOW)
    const lastActual = series[11].value
    const lastProjected = series[14].value

    expect(momentum).toBeCloseTo((lastProjected - lastActual) / lastActual, 2)
  })

  /**
   * STEP 2 — Self-consistency again, now ACROSS MODULES and across all 24 teams.
   *   The direction on the card must be what `classifyMomentum` would return for
   *   the momentum printed beside it, and the tone must be what
   *   `getTrendPresentation` gives that direction.
   *
   *   Both are computed inside `getMarketTrend` already, so this looks circular.
   *   It is not: it pins that the service uses the shared classifier rather than
   *   an inlined copy of the rule. An inlined `momentum > 0.03` would pass every
   *   other test in this file and then drift the day someone retunes
   *   `MATERIAL_MOMENTUM` in one place only.
   *
   *   Looping the real `TEAMS` catalogue rather than one fixture is deliberate:
   *   24 real inputs, free, and they include whatever edge case the catalogue
   *   happens to contain.
   */
  it('reports a direction consistent with its own momentum', () => {
    for (const team of TEAMS) {
      const trend = getMarketTrend(team, NOW)
      expect(trend.direction).toBe(classifyMomentum(trend.momentum))
      expect(trend.tone).toBe(getTrendPresentation(trend.direction).tone)
    }
  })

  /**
   * Validates: the catalogue actually exercises all three states.
   * Why it matters: a grid where every card reads "Steady" makes the feature look
   * broken rather than informative. This is the same reason the listing generator
   * pins a mix of verdicts.
   */
  /**
   * STEP 2 — PROPERTY 4: COVERAGE, and this one is a PRODUCT test wearing a unit
   *   test's clothes. Everything above could pass on a catalogue where all 24
   *   franchises read "Steady" — every value positive, every series 15 long,
   *   momentum consistent throughout, and a feature that shows the user nothing.
   *
   *   So it asserts the demo is worth looking at: across the whole catalogue, all
   *   three directions still appear. Retune the drift too tightly, or reseed
   *   unluckily, and the grid flattens — visible here, invisible everywhere else.
   *
   *   The current split is 5 heating / 8 steady / 11 cooling. The test does NOT
   *   pin those counts, and that restraint is the point: the exact mix is seed
   *   luck, not design. Pinning it would fail on a harmless reseed. Only the
   *   property that matters commercially — all three are represented — is fixed.
   *
   *   Ask this of any test you write: what is the smallest true statement that
   *   still catches the failure I care about?
   *
   * STEP 3 — `Set` comparison with `toEqual`. Vitest compares Sets by membership,
   *   so this reads "exactly these three, no more, no fewer" without any concern
   *   for order or duplicates.
   */
  it('covers every direction across the catalogue', () => {
    const directions = new Set(TEAMS.map((team) => getMarketTrend(team, NOW).direction))
    expect(directions).toEqual(new Set(['heating', 'steady', 'cooling']))
  })

  /**
   * STEP 2 — The last property, and the humblest: a demand value is a level, so
   *   zero or negative is meaningless — it would divide by zero in the momentum
   *   formula and draw the sparkline off its own baseline.
   *
   *   Nested loops over the real catalogue: 24 teams × 15 points = 360 assertions
   *   for four lines. Cheap, broad, and the kind of test that catches a random
   *   walk drifting somewhere nobody thought to look. The service clamps with
   *   `Math.max(4, ...)`; this is what proves the clamp is actually reached
   *   everywhere it needs to be.
   */
  it('never produces a non-positive demand value', () => {
    for (const team of TEAMS) {
      for (const point of getMarketTrend(team, NOW).series) {
        expect(point.value).toBeGreaterThan(0)
      }
    }
  })
})
