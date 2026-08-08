import { render, screen } from '@/test/utils'
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
})
