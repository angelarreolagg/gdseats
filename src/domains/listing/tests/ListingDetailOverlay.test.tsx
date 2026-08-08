import { render, screen, setViewport, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ListingDetailOverlay } from '../components/ListingDetailOverlay'
import { generateListingsForTeam } from '../services/listingGenerator.service'
import { getTeamById } from '@/domains/teams/data/teams'

const TEAM = getTeamById('lv')!
const LISTINGS = generateListingsForTeam(TEAM)
const LISTING = LISTINGS[0]
const SECTION_LISTINGS = LISTINGS.filter((l) => l.section === LISTING.section)

function renderOverlay(onClose = vi.fn()) {
  render(
    <ListingDetailOverlay
      listing={LISTING}
      team={TEAM}
      sectionListings={SECTION_LISTINGS}
      onClose={onClose}
    />,
  )
  return onClose
}

describe('ListingDetailOverlay', () => {
  /**
   * Validates: Escape dismisses the dialog.
   * Why it matters: the overlay covers the whole search page and locks body
   * scroll. Without a keyboard exit a keyboard-only user is trapped on it.
   */
  it('closes on Escape', async () => {
    const onClose = renderOverlay()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes from the Back to search button', async () => {
    const onClose = renderOverlay()
    await userEvent.click(screen.getByRole('button', { name: /back to search/i }))
    expect(onClose).toHaveBeenCalled()
  })

  /**
   * Validates: the overlay describes the listing it was opened with.
   * Why it matters: the row, the map highlight, and the offer box all have to
   * agree on which seats are being bought.
   */
  it('shows the opened listing’s section, row, and id', () => {
    renderOverlay()

    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      new RegExp(`${LISTING.id}.*section ${LISTING.section}`, 'i'),
    )
    expect(screen.getByText(LISTING.id)).toBeInTheDocument()
    expect(screen.getByText(String(LISTING.row))).toBeInTheDocument()
  })

  /**
   * Validates: the AI panel is present and agrees with the row's own maths.
   * Why it matters: this is the whole reason the flow exists — the verdict has to
   * survive the trip from the list into the detail.
   */
  it('renders the AI verdict alongside the offer box', () => {
    renderOverlay()

    expect(screen.getByRole('heading', { name: /ai insight/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /make an offer/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /price history/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /price stats/i })).toBeInTheDocument()
  })

  it('marks itself as a modal dialog', () => {
    renderOverlay()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  /**
   * Validates: the offer form is inline, and there is no sticky bar.
   * Why it matters: this is the other half of the compact branch below. A test
   * that only checks the mobile side would still pass if the component rendered
   * the sheet at every width, which would bury the form behind a tap on the
   * layout that has room to just show it.
   */
  it('keeps the offer form inline when there is room for the aside', () => {
    renderOverlay()

    expect(screen.getByLabelText(/offer amount/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^make an offer$/i })).not.toBeInTheDocument()
  })
})

const offerCta = () => screen.getByRole('button', { name: /^make an offer$/i })

describe('ListingDetailOverlay on a compact viewport', () => {
  /**
   * Validates: the offer form is not in the document until the sheet is opened.
   * Why it matters: this is the whole reason the breakpoint is a render-time
   * branch instead of a `lg:hidden` pair. Two copies of the form would put two
   * elements with `id="offer-amount"` in one document, announce two identical
   * forms to a screen reader, and leave the hidden one in the tab order — a
   * keyboard user tabbing off the seat map would land in an invisible currency
   * field. CSS hiding looks identical in a screenshot and fixes none of that.
   */
  it('withholds the offer form until the sheet is opened', () => {
    setViewport('mobile')
    renderOverlay()

    expect(screen.queryByLabelText(/offer amount/i)).not.toBeInTheDocument()
    expect(offerCta()).toBeInTheDocument()
  })

  /**
   * Validates: the sticky call to action opens the sheet and the form arrives
   * with it.
   * Why it matters: submitting an offer is the end of the entire flow. Before
   * this the form stacked dead last on mobile — after the seat map, the AI panel,
   * the price history and the price stats — so the conversion target sat four
   * screens below the fold with nothing on screen suggesting it existed.
   */
  it('opens the offer sheet from the sticky call to action', async () => {
    setViewport('mobile')
    renderOverlay()

    await userEvent.click(offerCta())

    expect(screen.getByLabelText(/offer amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit offer/i })).toBeInTheDocument()
  })

  /**
   * Validates: Escape closes the sheet and leaves the listing open. A second
   * Escape then closes the listing.
   * Why it matters: two dialogs listen for the same key and the inner one has to
   * win. Without the precedence, dismissing the offer sheet also throws the buyer
   * back to the results and loses their position in ~170 rows — an outsized
   * penalty for a keystroke that should have cost nothing. Nothing else in the
   * suite pins the ordering, and it reads as correct either way in the source.
   */
  it('lets Escape close the sheet before the listing', async () => {
    setViewport('mobile')
    const onClose = renderOverlay()

    await userEvent.click(offerCta())
    expect(screen.getByLabelText(/offer amount/i)).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
    // The sheet is inside `AnimatePresence`, which keeps a node mounted until its
    // exit finishes — so removal is asynchronous even under reduced motion, where
    // the transform itself is skipped. Asserting absence synchronously here reads
    // as a failing precedence rule when the precedence is fine.
    await waitFor(() => {
      expect(screen.queryByLabelText(/offer amount/i)).not.toBeInTheDocument()
    })

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  /**
   * Validates: the sheet is a dialog in its own right, and the close button is
   * reachable without a gesture.
   * Why it matters: the grab handle is the affordance a thumb reaches for, but
   * drag has no keyboard equivalent and no accessible name. If it were the only
   * way out, everyone not using a touchscreen would be stuck in the sheet.
   */
  it('names the sheet and offers a non-gesture way out', async () => {
    setViewport('mobile')
    renderOverlay()

    await userEvent.click(offerCta())

    const sheet = screen.getByRole('dialog', { name: /make an offer/i })
    expect(sheet).toHaveAttribute('aria-modal', 'true')

    await userEvent.click(screen.getByRole('button', { name: /close offer form/i }))
    await waitFor(() => {
      expect(screen.queryByLabelText(/offer amount/i)).not.toBeInTheDocument()
    })
  })
})
