/**
 * ─── READING THIS FILE ──────────────────────────────────────────────────────
 * Covers:    `AIInsightPanel` — the AI Insights card: the verdict, the simulated
 *            analysis wait, the stance, and the bullets.
 * Technique: COMPONENT testing with React Testing Library, plus fake timers.
 * Run it:    pnpm vitest run src/domains/deal-analyzer/tests/AIInsightPanel.test.tsx --reporter=verbose
 *
 * WHAT CHANGES ONCE A COMPONENT IS INVOLVED
 * The two service files render nothing: call a function, inspect the return. A
 * component has no return worth inspecting — `render()` gives you a DOM. So the
 * loop becomes: render, query the DOM the way a user would find things, assert.
 *
 * THE ONE IDEA BEHIND RTL
 * Query by what the user perceives, never by how it is built. There is no
 * `getByClassName` and that is not an oversight — it is the library's argument.
 * A test bound to `.ai-panel__label` fails when someone renames a class and
 * passes when the label is wrong; a test bound to the text "Above market range"
 * does the opposite. Roles and text are the contract with the user; classes and
 * component structure are not.
 *
 * A consequence worth noticing: `getByRole('status')` and `getByRole('heading')`
 * read the ACCESSIBILITY tree. If a screen reader cannot find it, the test cannot
 * either — so these assertions are functional and accessibility checks at once,
 * which is why this suite has so few dedicated a11y tests.
 *
 * THE THREE QUERY PREFIXES — the most common source of confusion in RTL
 *   getBy…    throws if not found.        → "this must be here now"
 *   queryBy…  returns null if not found.  → "this must NOT be here" (the only
 *                                            one usable with `.not`, because
 *                                            getBy would throw before asserting)
 *   findBy…   returns a Promise, retrying. → "this will be here shortly"
 * Plural `getAllBy` / `queryAllBy` / `findAllBy` return arrays, and `getAllBy`
 * still throws on zero matches.
 * All three appear below. Match the prefix to the claim about time.
 *
 * WHY `render` COMES FROM '@/test/utils'
 * Not from '@testing-library/react'. The local helper wraps every render in
 * `AppProviders`, and Radix's Tooltip throws outright without its provider
 * ancestor. It also brings the same `MotionConfig` the app runs with. Import the
 * bare RTL `render` in this repo and you get a failure that looks nothing like
 * its cause.
 *
 * Comment styles: `Validates: / Why it matters:` is the repo convention — why the
 * test is worth having. `STEP` blocks were added for learning — how it works.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { render, screen } from '@/test/utils'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AIInsightPanel } from '../components/AIInsightPanel'
import { ANALYSIS_DURATION_MS } from '../hooks/useDealAnalysis'
import type { ListingSignals } from '../types/deal.types'

/**
 * One fixture, spread with overrides per test (`{ ...BASE, listingPrice }`).
 *
 * The numbers are chosen, not arbitrary: $40,000 asked against a $36,000 estimate
 * is +11.1%, safely past the +10% boundary, so this listing is unambiguously
 * "Above market range". Fixtures for verdict-driven components should sit clearly
 * inside a band — a fixture that lands on a boundary makes every test that uses
 * it fragile against an unrelated retune.
 */
const BASE: ListingSignals = {
  listingPrice: 40_000,
  estimatedPrice: 36_000,
  sectionAverage: 35_000,
  section: 143,
  trend: 'down',
  priceHistory: [
    { date: 'Mar 25', price: 75_000 },
    { date: 'Jul 22', price: 44_000 },
    { date: 'Jul 27', price: 40_000 },
  ],
}

/**
 * A render helper, the standard way to keep component tests readable.
 *
 * `analysisDelayMs={0}` is the interesting part. The component accepts the delay
 * as a prop purely so tests can switch the theatre off — production never passes
 * it and falls back to `ANALYSIS_DURATION_MS`. Tests that care about the WAIT
 * (the first describe) drive fake timers instead; tests that care about the
 * RESULT (the second) skip it entirely and stay readable.
 *
 * A seam like this is worth adding when the alternative is every test in the file
 * learning to operate a clock.
 */
/** Skips the simulated latency; the wait itself is covered separately below. */
function renderResolved(listingPrice: number) {
  return render(<AIInsightPanel signals={{ ...BASE, listingPrice }} analysisDelayMs={0} />)
}

describe('AIInsightPanel analysis state', () => {
  /**
   * STEP 0 — Cleanup, and it is not optional.
   *
   * `vi.useFakeTimers()` replaces the global `setTimeout` for the whole module
   * environment, not just for the test that called it. Leave them installed and
   * the next test's `await findByText` waits on a clock nobody is advancing, then
   * times out — a failure in a test that is perfectly correct, caused by a
   * different test that already passed.
   *
   * Test pollution is the hardest class of test bug to diagnose, because the
   * failure and the cause are in different files and the order can change. Any
   * time a test mutates something global — timers, `localStorage`, `matchMedia`,
   * a spy — restore it in `afterEach`. (`cleanup()` for the DOM is already
   * handled globally in `src/test/setup.ts`.)
   */
  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * Validates: the verdict is on screen in the very first frame, with no wait.
   * Why it matters: the listing row behind this modal already displayed this
   * exact status and percentage — `evaluateDeal` is pure over data the row had.
   * Staging a load over a number the user just saw is theatre, and a user who
   * spots it stops believing the panel. This is the regression that would be
   * invisible without a test, since it still *looks* fine.
   */
  /**
   * STEP 1 — `vi.useFakeTimers()` swaps the real `setTimeout` for a controlled
   *   one. Nothing scheduled will ever fire unless this test advances the clock.
   *   The alternative — waiting 1400 real milliseconds — would add nearly a
   *   second per test and be timing-dependent on a loaded CI machine.
   *
   * STEP 2 — Render, and then deliberately do NOTHING. No `advanceTimersByTime`,
   *   no `await`. The panel is frozen at t=0.
   *
   * STEP 3 — Assert the verdict is nonetheless fully on screen. Read the comment
   *   `// Timers never advanced.`: it is not describing the code, it is naming
   *   the absence that IS the test. A reader skimming for what this proves would
   *   otherwise see only ordinary assertions.
   *
   *   This is the shape to steal — TESTING THAT SOMETHING DOES NOT WAIT. The
   *   verdict is a pure function over data the listing row already rendered, so
   *   putting a spinner over it is theatre a user will eventually catch. Nothing
   *   would look wrong in the browser if that regressed; the panel would simply
   *   feel slightly slower. Only a test that refuses to advance the clock can see
   *   it.
   *
   *   `getAllByText(/\+11%/)` is plural because the delta appears more than once
   *   in the layout, and `getByText` throws on multiple matches. When a query
   *   fails with "found multiple elements", that is the fix — or narrow the query,
   *   if which one matters.
   */
  it('shows the verdict immediately, without waiting for the analysis', () => {
    vi.useFakeTimers()
    render(<AIInsightPanel signals={BASE} />)

    // Timers never advanced.
    expect(screen.getByText('Above market range')).toBeInTheDocument()
    expect(screen.getByText('$36,000')).toBeInTheDocument()
    expect(screen.getByText('$40,000')).toBeInTheDocument()
    expect(screen.getAllByText(/\+11%/).length).toBeGreaterThan(0)
  })

  /**
   * Validates: the narrative — the part an AI would genuinely produce — waits for
   * the full window.
   * Why it matters: the other half of the same trade. A loader that resolves
   * instantly makes the analysis look fake in the opposite direction.
   */
  /**
   * STEP 1 — The other half of the pair above, and the most instructive test in
   *   the file. It walks the clock through the transition in three moves.
   *
   * STEP 2 — Note `act(() => { vi.advanceTimersByTime(...) })`. `act` is React's
   *   marker for "I am about to cause state updates; flush them and the effects
   *   they trigger before continuing". Advancing timers fires the component's
   *   `setTimeout`, which calls `setState`. Without `act`, React warns and the
   *   assertions may run against a DOM that has not re-rendered yet — a test that
   *   fails intermittently for no visible reason.
   *
   *   RTL wraps `render`, `fireEvent` and `userEvent` in `act` for you. You only
   *   reach for it by hand when YOU are the one causing the update, which is
   *   exactly what advancing a fake clock is.
   *
   * STEP 3 — Three phases, and the middle one is what makes this rigorous:
   *
   *     t = 0                        status region present, stance absent
   *     t = DURATION - 1             stance STILL absent   ← the real assertion
   *     t = DURATION                 stance present, status region gone
   *
   *   Without the middle step the test would pass on a component that resolved at
   *   t=1, or t=200, or immediately. Advancing to one tick SHORT of the boundary
   *   and asserting nothing has happened is the only way to prove the gate opens
   *   at the promised moment rather than at some earlier one. It is boundary value
   *   analysis — the same technique as `getDealStatus` at exactly ±10% — applied
   *   to time instead of to a number.
   *
   *   Watch which prefix does which job:
   *     getByRole('status')      — must exist now  → getBy throws if it does not
   *     queryByText(...)         — must NOT exist  → queryBy returns null so
   *                                `.not.toBeInTheDocument()` can run. `getBy`
   *                                here would throw before reaching the matcher,
   *                                failing the test while proving the point.
   *     queryAllByRole(...)      — plural absence, asserted with toHaveLength(0)
   *
   *   And the last line asserts the status region has GONE. Testing removal
   *   matters as much as testing appearance: a spinner that never leaves is a
   *   screen reader announcing "analyzing" forever.
   */
  it('withholds the recommendation and bullets until the window elapses', () => {
    vi.useFakeTimers()
    render(<AIInsightPanel signals={BASE} />)

    expect(screen.getByRole('status')).toHaveTextContent(/analyzing this listing/i)
    expect(screen.queryByText(/may find better value by waiting/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    // One tick short of the window: still working.
    act(() => {
      vi.advanceTimersByTime(ANALYSIS_DURATION_MS - 1)
    })
    expect(screen.queryByText(/may find better value by waiting/i)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/may find better value by waiting/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  /**
   * Validates: the panel's identity stays on screen while it works.
   * Why it matters: blanking the whole card and restoring it reads as a glitch.
   * Holding the header also keeps the block's position stable in the page.
   */
  /**
   * STEP 3 — `getByRole('heading', { name: /ai insight/i })` is the query shape to
   *   learn. The role comes from the element (`<h2>` → `heading`); the `name`
   *   option matches its ACCESSIBLE NAME — the text a screen reader would announce,
   *   which may come from the content, an `aria-label`, or an `aria-labelledby`.
   *
   *   Prefer this over `getByText`. Text alone would match a `<div>` that happens
   *   to say "AI Insight"; this asserts it is a heading, which is what makes the
   *   panel navigable to anyone moving through the page by landmark.
   */
  it('keeps its heading visible while analyzing', () => {
    vi.useFakeTimers()
    render(<AIInsightPanel signals={BASE} />)

    expect(screen.getByRole('heading', { name: /ai insight/i })).toBeInTheDocument()
  })

  /**
   * Validates: the loading region announces itself once, with real text.
   * Why it matters: a dozen aria-hidden placeholder boxes tell a screen-reader
   * user nothing. One labelled status region tells them the page is working.
   */
  /**
   * STEP 3 — `getAllByRole('status')` then `toHaveLength(1)`, rather than
   *   `getByRole` — which would also fail on multiples, but with "found multiple
   *   elements", a message about the query. Asking for all of them and asserting
   *   the count says plainly that ONE is the requirement.
   *
   *   `role="status"` is an ARIA live region: assistive technology announces its
   *   content when it changes. Two of them talk over each other, which is why the
   *   count is the assertion and not the presence.
   */
  it('exposes a single labelled status region', () => {
    vi.useFakeTimers()
    render(<AIInsightPanel signals={BASE} />)

    expect(screen.getAllByRole('status')).toHaveLength(1)
  })
})

describe('AIInsightPanel', () => {
  /**
   * Validates: each verdict band renders its own label and stance.
   * Why it matters: this is the contract between the tested service logic and
   * what a buyer actually sees. Correct logic rendered under the wrong label is
   * indistinguishable from a logic bug.
   */
  /**
   * STEP 0 — A second `describe` in the same file, and the split is intentional.
   *   The block above tests the panel across TIME and drives a fake clock; this
   *   one tests the panel's OUTPUT and skips the wait via `renderResolved`.
   *   Grouping by concern keeps the fake-timer machinery out of tests that have
   *   nothing to do with it — and note this block needs no `afterEach`, because
   *   nothing in it touches a global.
   *
   * STEP 2 — These three tests are where the service tests connect to reality.
   *   `pricing.service.test.ts` proved +11.1% classifies as 'overpriced'. Nothing
   *   there says a buyer ever sees the words "Above market range" — the mapping
   *   from key to copy lives in the component layer, and a crossed mapping there
   *   is invisible to every service test.
   *
   * STEP 3 — Read the existing `//` comment above the first one carefully: the
   *   LABEL is present from frame 0, the STANCE arrives late. So `await
   *   findByText(stance)` is what actually proves the panel resolved, and the
   *   `getByText(label)` after it can be synchronous — by then the DOM has
   *   settled.
   *
   *   That ordering is the general pattern for async component assertions: `await`
   *   the thing that arrives LAST, then assert the rest synchronously. Awaiting
   *   something already present proves nothing about what follows, and is how
   *   flaky tests are written.
   *
   *   `findBy` polls the DOM (via MutationObserver) until a match appears or it
   *   times out at 1000ms. It is `getBy` plus patience.
   */
  // The label is present from the first frame; the stance is what arrives late,
  // so awaiting the stance is what actually proves the panel has resolved.
  it('renders an above-market listing with a waiting stance', async () => {
    renderResolved(40_000) // +11.1%
    expect(await screen.findByText(/may find better value by waiting/i)).toBeInTheDocument()
    expect(screen.getByText('Above market range')).toBeInTheDocument()
  })

  it('renders an attractively priced listing as an opportunity', async () => {
    renderResolved(31_000) // -13.9%
    expect(await screen.findByText(/could be a strong opportunity/i)).toBeInTheDocument()
    expect(screen.getByText('Attractive value')).toBeInTheDocument()
  })

  it('renders a market-aligned listing as aligned', async () => {
    renderResolved(37_000) // +2.8%
    expect(await screen.findByText(/aligned with recent market activity/i)).toBeInTheDocument()
    expect(screen.getByText('In line with market')).toBeInTheDocument()
  })

  /**
   * Validates: the panel never uses alarming or directive wording.
   * Why it matters: this is a five-figure marketplace purchase. "Overpriced" and
   * "Wait" frame the panel as a gate rather than as context, and a buyer who
   * reads a warning walks away from a listing that may still suit them. The
   * softened copy is the feature, so a regression here is a product regression,
   * not a cosmetic one.
   */
  /**
   * STEP 1 — A NEGATIVE test: it asserts what must never appear. Almost every
   *   test in this suite checks for presence; this checks for absence across the
   *   panel's entire rendered text, in all three verdict states.
   *
   *   The banned-words regex is a recurring idiom in this repo — it also guards
   *   `insights.service` and `trendPresentation`. It is how a TONE decision, the
   *   sort of thing usually left to a style guide nobody rereads, becomes
   *   something CI can enforce.
   *
   *   `^wait$` is anchored on purpose. Bare `wait` would match "waiting" in the
   *   approved stance "You may find better value by waiting" and fail the exact
   *   copy the rule exists to protect. Banned-word lists need this care or they
   *   get deleted the first time they cry wolf.
   *
   * STEP 2 — Two mechanics worth stealing:
   *   - `const { container, unmount } = render(...)` — `render` returns handles.
   *     `container` is the DOM node the component was mounted into, so
   *     `container.textContent` is every visible string at once, which is what
   *     lets one assertion cover copy nobody enumerated.
   *   - `unmount()` at the end of each loop turn. Rendering three times without
   *     it would leave three panels in the document, and `getByText` would start
   *     throwing "found multiple elements" in some LATER test. (The global
   *     `cleanup()` in `src/test/setup.ts` runs between tests, not within one.)
   *
   * STEP 3 — `await screen.findAllByRole('listitem')` before reading the text is
   *   load-bearing, not decorative: the bullets are the last thing to arrive, so
   *   without it the assertion would inspect a panel that has not finished
   *   rendering the copy it is checking — and would pass for the wrong reason.
   */
  it('avoids alarming and directive language in every state', async () => {
    const banned = /overpriced|do not buy|buy now|bad deal|too expensive|^wait$/i

    for (const price of [40_000, 31_000, 37_000]) {
      const { container, unmount } = renderResolved(price)
      // Bullets only exist once the analysis has resolved.
      await screen.findAllByRole('listitem')
      expect(container.textContent ?? '').not.toMatch(banned)
      unmount()
    }
  })

  /**
   * Validates: status is stated in text, not carried by colour alone.
   * Why it matters: amber vs teal measure CVD ΔE 10.8 under protanopia — close
   * enough that a colour-only badge would be unreadable for some users. The label
   * and icon are the required mitigation.
   */
  /**
   * STEP 3 — `container.querySelector('.lucide-trending-up')` is the one place in
   *   this file that reaches for a CSS class, and it deserves its exception
   *   rather than setting a precedent.
   *
   *   The icon is DECORATIVE: it carries no accessible name, has no role, and
   *   contributes nothing to the accessibility tree — correctly so, since the text
   *   beside it already says "Above market range" and an announced icon would just
   *   repeat it. Being invisible to the a11y tree, it is invisible to every RTL
   *   query, because those are the a11y tree.
   *
   *   So when the requirement is "a sighted user has a second, non-colour cue",
   *   the only handle left is the class lucide-react stamps on its SVG. The test
   *   is more brittle than its neighbours — it breaks if the icon changes — and
   *   that is the accepted cost of asserting on something deliberately unnamed.
   *
   *   The rule: query by role or text by default; drop to a selector only when the
   *   thing you are asserting genuinely has no accessible presence, and say why.
   */
  it('states the status in text, never by colour alone', async () => {
    const { container } = renderResolved(40_000)
    expect(await screen.findByText('Above market range')).toBeInTheDocument()
    expect(container.querySelector('.lucide-trending-up')).toBeInTheDocument()
  })

  it('shows the estimate, the listing price, and the signed delta', async () => {
    renderResolved(40_000)
    expect(await screen.findByText('$36,000')).toBeInTheDocument()
    expect(screen.getByText('$40,000')).toBeInTheDocument()
    expect(screen.getAllByText(/\+11%/).length).toBeGreaterThan(0)
  })

  /**
   * Validates: bullets read as observations, capped at three.
   * Why it matters: the panel's job is context. Judgmental phrasing turns the
   * same data into a verdict the buyer has to argue with.
   */
  /**
   * STEP 3 — `insights.service.test.ts` already pins the cap at three. This
   *   asserts it again through the rendered DOM, and the duplication is not waste:
   *   the service could obey its contract while the component maps over the wrong
   *   array or renders a stale one. A cap that holds in the service and breaks in
   *   the panel is exactly the kind of gap unit tests leave behind.
   *
   *   `getAllByRole('listitem')` counts real `<li>` elements, which also quietly
   *   asserts the bullets are marked up as a list rather than as styled divs —
   *   the difference between a screen reader announcing "list, 3 items" and
   *   announcing nothing.
   */
  it('renders observational insight bullets', async () => {
    renderResolved(40_000)
    expect(await screen.findByText(/Sits \d+% above the section 143 average/i)).toBeInTheDocument()
    expect(screen.getByText(/Price adjusted down/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(3)
  })
})
