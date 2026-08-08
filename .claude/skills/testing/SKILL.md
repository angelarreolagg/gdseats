---
name: testing
description: Write or review tests in this repo (Vitest + React Testing Library). Use whenever adding a test file, adding cases to an existing one, reviewing a test in a diff, or deciding whether something is worth testing at all. Encodes the standard set in commit 260f713 — the Validates/Why-it-matters convention, which technique fits which kind of code, and the matcher and query rules that follow from it.
---

# Testing standard

The reference implementations are the four files annotated in commit `260f713`. When unsure, open the one that matches your situation and copy its shape:

| Situation | Read |
|---|---|
| A pure function with rules or thresholds | `src/domains/deal-analyzer/tests/pricing.service.test.ts` |
| A function that generates its own data | `src/domains/teams/tests/marketTrend.service.test.ts` |
| A component, especially one with async state | `src/domains/deal-analyzer/tests/AIInsightPanel.test.tsx` |
| A form or anything the user types into | `src/domains/listing/tests/MakeAnOfferCard.test.tsx` |

## Non-negotiables

**1. Every non-obvious test carries a `Validates: / Why it matters:` block.**

```ts
/**
 * Validates: <the behaviour pinned, one sentence>
 * Why it matters: <what breaks commercially if this stops being true>
 */
it('reads as a spec sentence', () => {
```

`Why it matters:` must state a *consequence* — money, trust, accessibility, or user behaviour. Never restate the mechanics. If the only honest answer is "so the function keeps working", the test is probably obvious and should be left bare; roughly 30-40% of tests here are, and that is correct. Never write the block for a smoke assertion just to satisfy the convention.

Good: *"A listing at exactly +10% wrongly labelled 'Overpriced' tells a buyer to walk away from a fairly priced seat, and the seller loses the sale."*
Bad: *"So that getDealStatus returns the right value."*

**2. Component tests import `render` from `@/test/utils`, never from `@testing-library/react`.**

The local helper wraps in `AppProviders`. Radix Tooltip throws outright without its provider, and the failure looks nothing like its cause. `screen`, `within`, `fireEvent` and `waitFor` are re-exported from there too. `userEvent` still comes from `@testing-library/user-event`.

**3. `describe` is named after the unit. `it` reads as a lowercase spec sentence.**

`describe('getMarketTrend')`, `describe('TeamCard')`. `it('is deterministic for a given team')`, `it('does not mutate the input array')`. English throughout — file names, blocks, comments, variables.

**4. Import `describe`/`it`/`expect` explicitly** even though `globals: true` is set, so a reader can see where they come from.

**5. Never mock a service to test a component that uses it.** `ListingRow` and `AIInsightPanel` both call the real `evaluateDeal`; that is what guarantees a row's badge cannot disagree with the detail it opens. Mocking it would delete the guarantee and keep the test.

## Pick the technique from the code

### Pure function with thresholds → boundary values

The realistic defect is `<` where `<=` was meant, and it is invisible to every input except the boundary itself. Pin **two values per edge**: exactly on it, and a hair past it.

```ts
expect(getDealStatus(-0.1)).toBe('fair')        // the boundary belongs to the middle
expect(getDealStatus(-0.1001)).toBe('undervalued')  // a hair past it does move
```

Then one value per band — **equivalence partitioning**. One per region, not fifty; inside a region every value hits the same branch.

**Import the threshold constant when testing the rule** (`MATERIAL_MOMENTUM`), so retuning the number does not fail the test. **Write the literal** only when the number itself is the thing being pinned.

Assert the *property the caller depends on*, not the value the implementation happens to produce. For a divide-by-zero guard, `Number.isFinite(...)` is right and pinning the clamped result is wrong.

### Function that generates data → properties, never values

There is no expected value to write down. Assert things that hold whatever the numbers are:

- **Determinism** — `expect(f(x)).toEqual(f(x))`. Looks tautological; it is the only thing that fails when someone swaps the seeded PRNG for `Math.random()`. Pair it with a "different inputs differ" test, or a function returning a constant would satisfy it.
- **Self-consistency** — recompute a derived field from the output and compare. The momentum test rebuilds `(series[14] - series[11]) / series[11]` by hand. Survives any reseed; fails only if the field measures something other than what it claims.
- **Invariants** — loop the real catalogue (`TEAMS`, `ALL_SECTIONS`) and assert a property of every element.
- **Coverage** — assert the generated set still exercises every branch (all three verdict bands appear; all three trend directions appear). Do **not** pin the counts: the exact mix is seed luck, and pinning it fails on a harmless reseed.

**Inject time rather than mocking a clock.** `getMarketTrend(team, now = new Date())` takes `now` as a parameter with a default. Tests pass a frozen `NOW`. One line, and no clock mocking anywhere in the suite.

### Component → query the accessibility tree

There is no `getByClassName` and that is the library's argument, not an oversight.

| Prefix | Behaviour | Use for |
|---|---|---|
| `getBy…` | throws if absent | "must be here now" |
| `queryBy…` | returns `null` | "must NOT be here" — the only one usable with `.not` |
| `findBy…` | Promise, retries ~1000ms | "will be here shortly" |

Prefer `getByRole('button', { name: /…/ })` and `getByLabelText(/…/)` over `getByText`. A labelled query only resolves if the element is genuinely labelled, so an accessibility regression fails the *functional* suite.

**`container.querySelector('.some-class')` is allowed in exactly one case**: the thing being asserted is decorative, has no role and no accessible name, and therefore no RTL query can reach it. Say why in a comment. Today that is the lucide icon in `AIInsightPanel.test.tsx` and nowhere else.

**Async ordering**: `await` the thing that arrives **last**, then assert the rest synchronously. Awaiting something already present proves nothing and is how flaky tests get written.

### Time-dependent component → fake timers with a near-miss

```ts
afterEach(() => { vi.useRealTimers() })   // required — fake timers are global
```

Advance to **one tick short** of the boundary and assert nothing has happened, *then* advance the last tick. Without the near-miss the test passes on a component that resolved immediately.

Wrap advancement in `act()` — you are the one causing the state update. RTL wraps `render`/`fireEvent`/`userEvent` for you; it cannot wrap your clock.

Also assert the loading state **disappears**. A spinner that never leaves is a live region announcing "analyzing" forever.

### Form or input → `userEvent`, always awaited

`userEvent.type` fires the full keydown/keypress/input/keyup sequence per character; `fireEvent.change` sets the value in one shot and would pass on a controlled formatter that is visibly broken in a browser.

Every call is `await`ed. A missing `await` does not fail loudly — it asserts against the pre-interaction DOM and passes while proving nothing. There is no lint rule catching it here.

`clear()` before `type()` on a pre-filled field; `type` appends at the cursor.

Re-query through a helper (`const offerField = () => screen.getByLabelText(/offer amount/i)`) rather than holding a node across an interaction — React replaces DOM nodes as it re-renders.

Cover empty, zero, and one. The empty state is where formatted fields break.

Assert a derived value **before and after** the interaction. One observation proves the value is correct; two prove it is computed.

## Matchers

| Use | For |
|---|---|
| `toBe` | primitives, exact strings, identity |
| `toEqual` | objects and arrays — deep structural |
| `toBeCloseTo(x, digits)` | any float. The 2nd arg is decimal **places**, not a tolerance |
| `toHaveValue` | input contents — they are a property, not text content |
| `toBeInTheDocument` / `toBeDisabled` / `toHaveAccessibleName` | jest-dom, already wired in `src/test/setup.ts` |

Floats need `toBeCloseTo`. `(36000-40000)/40000` is exactly -0.1 in decimal and not in binary.

Some DOM state exists only as a property and has no attribute: assert `video.muted`, never `toHaveAttribute('muted')`.

Ordering idiom: `expect(arr).toEqual([...arr].sort(cmp))`.

## Fixtures

- Module scope, `SCREAMING_SNAKE` (`LISTING`, `TEAM`, `NOW`, `BASE`), spread with overrides per test.
- **Prefer real data over invented literals** — `getTeamById('lv')!`, `generateListingsForTeam(...)`. A hand-written fixture drifts from the type it copies and then passes while describing something that no longer exists.
- Type the fixture (`const LISTING: Listing = {...}`) so `tsc` catches the drift.
- Give it the minimum the component reads. Padding with plausible data makes the next reader guess which fields matter.
- Choose values that sit **clearly inside** a band, not on its boundary, unless the boundary is the point.

## Copy and tone are testable

Product tone is enforced, not left to a style guide. The banned-words idiom:

```ts
const banned = /overpriced|do not buy|buy now|bad deal|too expensive|^wait$/i
expect(container.textContent ?? '').not.toMatch(banned)
```

Anchor patterns that would otherwise match approved copy — `^wait$` exists because bare `wait` matches "waiting" in the approved stance. A banned-word list that cries wolf gets deleted.

Treat a failure in `AIInsightPanel.test.tsx`, `insights.service.test.ts` or `trendPresentation.test.ts` as a **product regression**, not a cosmetic one.

## Test the decisions that look like bugs

When a code comment says "this looks wrong but is deliberate", that is the signal to write the test that makes the comment enforceable. The assertion may be worth almost nothing; the `Why it matters:` block attached to it tells whoever breaks it what they just broke.

Live examples: the buyer-relative colour inversion in `marketTrend.service.test.ts`, the two opposite colour conventions in `PriceHistoryTable.test.tsx`, the "verdict must not wait" test in `AIInsightPanel.test.tsx`.

## Don't

- Snapshot tests. None in this repo; none wanted.
- Assert on CSS classes, except the one decorative-icon case above.
- Test implementation details — internal state, hook call counts, private helpers.
- Pin counts that are seed luck (5 heating / 8 steady / 11 cooling).
- Pin product copy that will be tuned. Assert it *exists*, or that it *avoids* a banned pattern.
- Use `test()`. Always `it()`.
- Add `beforeEach`/`afterEach` unless something global is being mutated. `cleanup()` is already global.

## Before finishing

1. `pnpm vitest run <path> --reporter=verbose` — read the `it` names as a spec. Do they describe the feature?
2. Break the code on purpose and confirm the test fails. A test that cannot fail is a line of code that runs.
3. Every non-obvious `it` has `Validates: / Why it matters:`, and the second half names a consequence.
4. Any derived number in the test has its arithmetic in an inline comment (`// 23,550 + 225 + 2,350`).
5. `pnpm test` — the whole suite, since the pre-commit hook runs it whole anyway.
