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

  it('shows the opened listing’s section, row, and id', () => {
    renderOverlay()

    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      new RegExp(`${LISTING.id}.*section ${LISTING.section}`, 'i'),
    )
    expect(screen.getByText(LISTING.id)).toBeInTheDocument()
    expect(screen.getByText(String(LISTING.row))).toBeInTheDocument()
  })

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

  it('keeps the offer form inline when there is room for the aside', () => {
    renderOverlay()

    expect(screen.getByLabelText(/offer amount/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^make an offer$/i })).not.toBeInTheDocument()
  })
})

const offerCta = () => screen.getByRole('button', { name: /^make an offer$/i })

describe('ListingDetailOverlay on a compact viewport', () => {
  it('withholds the offer form until the sheet is opened', () => {
    setViewport('mobile')
    renderOverlay()

    expect(screen.queryByLabelText(/offer amount/i)).not.toBeInTheDocument()
    expect(offerCta()).toBeInTheDocument()
  })

  it('opens the offer sheet from the sticky call to action', async () => {
    setViewport('mobile')
    renderOverlay()

    await userEvent.click(offerCta())

    expect(screen.getByLabelText(/offer amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit offer/i })).toBeInTheDocument()
  })

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
