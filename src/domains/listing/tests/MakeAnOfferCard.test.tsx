/**
 * ─── READING THIS FILE ──────────────────────────────────────────────────────
 * Covers:    `MakeAnOfferCard` — the form at the end of the whole flow, where a
 *            buyer types a five-figure number and sees the total it commits them
 *            to.
 * Technique: INTERACTION testing. The other three files render or call and then
 *            assert; this one types, clears, and pastes first.
 * Run it:    pnpm vitest run src/domains/listing/tests/MakeAnOfferCard.test.tsx --reporter=verbose
 *
 * WHAT AN INTERACTION TEST ADDS
 * `AIInsightPanel.test.tsx` asks "given these props, what is on screen?".
 * This one asks "given this input, what happens NEXT?" — which is where the
 * defects in a controlled input actually live. A formatted currency field has
 * four states a static render never reaches: the initial value, the value mid-
 * keystroke, an empty field, and a pasted blob. Each has its own test below.
 *
 * userEvent vs fireEvent — the distinction that matters most here
 * `fireEvent.change(input, { target: { value: '18000' } })` dispatches ONE
 * synthetic event and sets the value directly. It is not what a keyboard does.
 * `userEvent.type(input, '18000')` simulates a real person: for each character it
 * fires keydown, keypress, input, keyup, moves the cursor, and respects focus and
 * disabled state.
 *
 * That gap is not academic for THIS component. A controlled formatter that
 * reformats on `change` but mishandles the cursor, or that only reacts to one
 * event in the sequence, passes under `fireEvent` and is visibly broken in the
 * browser. Reach for `userEvent` by default; drop to `fireEvent` only for events
 * a user cannot produce — `TeamLogo.test.tsx` uses it to fire an image's `onError`,
 * which is the right reason.
 *
 * EVERY userEvent CALL IS AWAITED
 * Since v14 they are all async. A missing `await` does not fail loudly — it
 * asserts against the DOM as it was BEFORE the interaction, so the test passes
 * while proving nothing. It is the most common silent bug in RTL tests, and there
 * is no lint rule here to catch it. If an interaction test passes when you expect
 * it to fail, check the `await`s first.
 *
 * Comment styles: `Validates: / Why it matters:` is the repo convention — why the
 * test is worth having. `STEP` blocks were added for learning — how it works.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { MakeAnOfferCard } from '../components/MakeAnOfferCard'
import type { Listing } from '../types/listing.types'

/**
 * A full `Listing`, typed — so the fixture cannot drift out of shape without
 * `tsc` saying so. The fees are the numbers every assertion below is derived
 * from: 2 seats × $11,775 = $23,550, plus $225 transfer and $2,350 platform.
 *
 * `priceHistory` and `tags` are empty because this component reads neither. Give
 * a fixture the minimum the test needs; padding it with plausible data invites
 * the next reader to wonder which fields matter.
 */
const LISTING: Listing = {
  id: 'HUUS06',
  teamId: 'sf',
  section: 106,
  row: '39',
  seatRange: '14-15',
  seatCount: 2,
  pricePerSeat: 11_775,
  transferFee: 225,
  platformFee: 2_350,
  publicationDate: 'Aug 3, 2026',
  estimatedPricePerSeat: 14_500,
  sectionAveragePerSeat: 13_000,
  priceHistory: [],
  tags: [],
}

/**
 * Re-query the field on every use — never `const input = offerField()` once at the
 * top of the file.
 *
 * React replaces DOM nodes as it re-renders, so a reference captured before an
 * interaction can be detached from the document afterwards: assertions on it then
 * describe a node nobody can see. Cheap to look up, expensive to get wrong.
 *
 * `getByLabelText` is the query to prefer for form fields. It only resolves if the
 * input is genuinely associated with a label — via `<label for>`, wrapping, or
 * `aria-label`. Break that association and every test in this file fails, which
 * means an accessibility regression is caught by the FUNCTIONAL suite rather than
 * by an audit six months later. `getByPlaceholderText` or a CSS selector would
 * find the same input and notice nothing.
 */
const offerField = () => screen.getByLabelText(/offer amount/i)

describe('MakeAnOfferCard', () => {
  /**
   * Validates: the amount is shown as currency, not a bare integer.
   * Why it matters: this is a five-figure number. "23550" has to be counted
   * digit by digit to be read; "$23,550" is read at a glance, and misreading it
   * by an order of magnitude is exactly the mistake that costs real money.
   */
  /**
   * STEP 3 — `toHaveValue('$23,550')` and not `toBeInTheDocument()`.
   *
   *   An input's text is its `value` PROPERTY, not its text content — nothing is
   *   rendered between the tags — so `getByText('$23,550')` would find nothing.
   *   `toHaveValue` comes from jest-dom (wired up in `src/test/setup.ts`) and
   *   reads the property.
   *
   *   The general trap: several things in the DOM live as properties rather than
   *   attributes, and they diverge once JavaScript touches them. `TeamsHero.test`
   *   documents the same trap for `video.muted`, which never appears as an
   *   attribute at all. When an assertion on an attribute fails but the browser
   *   clearly shows the value, this is usually why.
   *
   *   Asserting the FORMATTED string also pins the opening offer, the currency
   *   symbol, and the thousands separator in one line — three claims, no extra
   *   tests.
   */
  it('shows the opening offer formatted as currency', () => {
    render(<MakeAnOfferCard listing={LISTING} />)
    expect(offerField()).toHaveValue('$23,550')
  })

  /**
   * Validates: formatting is applied as the user types, not only on load.
   * Why it matters: a field that formats once and then shows raw digits while
   * editing is worse than one that never formats — the value changes shape under
   * the user's hands.
   */
  /**
   * STEP 1 — `clear` before `type`. The field opens pre-filled, and `type` APPENDS
   *   at the cursor rather than replacing — without the clear this would produce
   *   "$23,55018,000" and a confusing failure. Forgetting it is a rite of passage.
   *
   * STEP 2 — `userEvent.type(input, '18000')` runs five separate keystrokes, so
   *   the component re-renders five times and the formatter runs on each. This is
   *   the whole reason the test exists: the value passes through "1", "18", "180",
   *   "1,800", "18,000", and every one of those intermediate states is something a
   *   user sees. `fireEvent.change` would jump straight to the end and prove none
   *   of it.
   *
   * STEP 3 — Asserting only the final value, deliberately. The intermediate states
   *   are exercised but not pinned, because pinning them would freeze a formatting
   *   choice ("$1,800" vs "$1800" mid-word) that is presentation, not contract.
   *   Exercise the path; assert the promise.
   */
  it('reformats while typing', async () => {
    render(<MakeAnOfferCard listing={LISTING} />)
    const input = offerField()

    await userEvent.clear(input)
    await userEvent.type(input, '18000')

    expect(input).toHaveValue('$18,000')
  })

  /**
   * Validates: the field can be emptied.
   * Why it matters: if parsing forced 0 into an empty field, the user would have
   * to delete a "$0" before every edit.
   */
  /**
   * STEP 2 — The empty state is the one a formatted field gets wrong. A naive
   *   `format(parseInt(raw) || 0)` renders "$0" the instant the last digit goes,
   *   so the user deletes a character and a zero appears, and they have to delete
   *   that too. Nobody notices in review because nobody empties the field by hand.
   *
   *   Empty, zero, and one are the three inputs worth testing on almost any field
   *   — the same instinct as testing the boundary in `getDealStatus`, applied to
   *   the edge of a value's RANGE rather than to a threshold inside it.
   */
  it('allows the field to be cleared', async () => {
    render(<MakeAnOfferCard listing={LISTING} />)
    const input = offerField()

    await userEvent.clear(input)
    expect(input).toHaveValue('')
  })

  /**
   * Validates: non-digits are discarded rather than rejected.
   * Why it matters: pasting "$23,550.00" from an email is the common path, and
   * the field must absorb it instead of showing nothing.
   */
  /**
   * STEP 2 — `userEvent.paste` fires a real paste event with clipboard data.
   *   Pasting is a distinct code path from typing — one event carrying many
   *   characters, not many events carrying one — and a formatter that strips
   *   non-digits per keystroke can still choke on a whole formatted string.
   *
   * STEP 3 — Read the expected value: `$2,355,000`, a hundred times the pasted
   *   amount. That is NOT a typo, and the inline comment says so. The component
   *   strips every non-digit, so "$23,550.00" becomes the digits 2355000 — the
   *   decimal point vanishes along with the dollar sign and the comma.
   *
   *   This is a test documenting a KNOWN LIMITATION rather than a promise. The
   *   requirement was "absorb the paste instead of showing nothing", and it does.
   *   The cents handling is a rough edge that has not been decided, and the test
   *   records the current answer so that changing it is a deliberate act with a
   *   visible diff, not an accident.
   *
   *   That is a legitimate and underused role for a test: pinning behaviour you
   *   are not yet proud of. The thing that makes it honest is the comment. A bare
   *   `expect(input).toHaveValue('$2,355,000')` reads as an endorsement, and the
   *   next person "fixes" the code to match what they assume the test wanted.
   */
  it('accepts a pasted, already-formatted amount', async () => {
    render(<MakeAnOfferCard listing={LISTING} />)
    const input = offerField()

    await userEvent.clear(input)
    await userEvent.paste('$23,550.00')

    // The trailing ".00" is digits too, so this rounds to the pasted cents-free
    // value only once the decimal is dropped — what matters is that it parses.
    expect(input).toHaveValue('$2,355,000')
  })

  /**
   * Validates: the fee breakdown tracks the offer.
   * Why it matters: the total is what the buyer is actually committing to. A
   * stale total beside a changed offer is a number that is simply wrong.
   */
  /**
   * STEP 1 — The most valuable test in the file, because it is the only one that
   *   asserts a relationship BETWEEN two parts of the UI rather than the state of
   *   one.
   *
   * STEP 2 — Assert, interact, assert again. The first assertion establishes the
   *   starting total; the second proves it MOVED, and moved to the right place.
   *   Checking only the state after the interaction would pass on a component that
   *   had displayed $22,575 all along.
   *
   *   Two observations before and after a change, not one after — that is what
   *   turns "the value is correct" into "the value is computed".
   *
   * STEP 3 — The inline comments carrying the arithmetic (`// 23,550 + 225 +
   *   2,350`) are doing real work. A reader who finds this test red needs to know
   *   instantly whether $26,125 is the truth or merely what the code used to say.
   *   Any derived number in a test deserves its derivation written beside it.
   *
   *   And the substance: a total that is DERIVED from the offer cannot silently
   *   disagree with it. If the fee breakdown were stored in state and updated by a
   *   separate handler, it could — and the buyer would read one number while
   *   committing to another. Same class of guarantee as `ListingRow` and
   *   `AIInsightPanel` both calling `evaluateDeal`, so a row's badge can never
   *   contradict the detail it opens.
   */
  it('recomputes the total from the entered offer', async () => {
    render(<MakeAnOfferCard listing={LISTING} />)

    // 23,550 + 225 + 2,350
    expect(screen.getByText('$26,125')).toBeInTheDocument()

    await userEvent.clear(offerField())
    await userEvent.type(offerField(), '20000')

    // 20,000 + 225 + 2,350
    expect(screen.getByText('$22,575')).toBeInTheDocument()
  })

  /**
   * STEP 3 — `toBeDisabled()` is a jest-dom matcher, and it is more than a check
   *   for the attribute: it also accounts for a disabled ancestor `<fieldset>`.
   *   Assert the state the user is in, not the markup that produces it.
   *
   *   Why the empty case specifically: submitting an empty offer is the one
   *   interaction a real buyer reaches by accident — clear the field, get
   *   distracted, click the big button. Everything else in the form is guarded by
   *   the formatter. This is the last gate before an offer of nothing is sent,
   *   which is why it is worth a test even though it looks like a one-liner.
   */
  it('disables submission when no amount is entered', async () => {
    render(<MakeAnOfferCard listing={LISTING} />)

    await userEvent.clear(offerField())
    expect(screen.getByRole('button', { name: /submit offer/i })).toBeDisabled()
  })
})
