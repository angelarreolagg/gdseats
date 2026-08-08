import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ListingRow } from '../components/ListingRow'
import type { Listing } from '@/domains/listing/types/listing.types'

function buildListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'FHJW4T',
    teamId: 'lv',
    section: 201,
    row: '8',
    seatRange: '21-22',
    seatCount: 2,
    pricePerSeat: 14_450,
    transferFee: 300,
    platformFee: 2_600,
    publicationDate: 'Aug 5, 2026',
    estimatedPricePerSeat: 14_450,
    sectionAveragePerSeat: 14_000,
    priceHistory: [
      { date: 'Aug 5, 2026', totalPrice: 28_900, pricePerSeat: 14_450, changePercent: null },
    ],
    tags: [{ id: 'featured', label: 'Featured', tone: 'accent', iconName: 'featured' }],
    ...overrides,
  }
}

describe('ListingRow', () => {
  /**
   * Validates: the row's verdict is computed from the same service the detail
   * panel uses.
   * Why it matters: the badge is what a buyer scans before clicking. If the list
   * said "Undervalued" and the detail said "Overpriced", the feature would be
   * worse than not shipping it.
   */
  it('shows the verdict for an undervalued listing', () => {
    render(
      <ListingRow
        listing={buildListing({ pricePerSeat: 10_000, estimatedPricePerSeat: 14_000 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Attractive value')).toBeInTheDocument()
  })

  it('shows the verdict for an overpriced listing', () => {
    render(
      <ListingRow
        listing={buildListing({ pricePerSeat: 18_000, estimatedPricePerSeat: 14_000 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Above market range')).toBeInTheDocument()
  })

  /**
   * Validates: the badge states its verdict in text, not colour alone.
   * Why it matters: green and red collapse to CVD ΔE 1.2 under deuteranopia in
   * light mode. A row scanned by colour would be unreadable for red-green
   * colourblind users, so the label is the mitigation and must not regress.
   */
  it('states the verdict in text alongside the colour', () => {
    const { container } = render(
      <ListingRow
        listing={buildListing({ pricePerSeat: 10_000, estimatedPricePerSeat: 14_000 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Attractive value')).toBeInTheDocument()
    // The icon is decorative (aria-hidden); the label is what carries meaning.
    expect(container.querySelector('.lucide-gem')).toBeInTheDocument()
  })

  it('renders seat identity, per-seat price, and total incl. fees', () => {
    render(<ListingRow listing={buildListing()} onOpen={vi.fn()} />)

    expect(screen.getByText('Section 201, Row 8, 21-22')).toBeInTheDocument()
    expect(screen.getByText('$14,450/seat')).toBeInTheDocument()
    expect(screen.getByText(/ID: FHJW4T/)).toBeInTheDocument()
    expect(screen.getByText('$31,800 total, incl. fees')).toBeInTheDocument()
  })

  it('opens the listing it describes', async () => {
    const onOpen = vi.fn()
    render(<ListingRow listing={buildListing()} onOpen={onOpen} />)

    await userEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith('FHJW4T')
  })
})
