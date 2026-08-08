import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/utils'
import { PriceHistoryTable } from '../components/PriceHistoryTable'
import type { PriceHistoryEntry } from '../types/listing.types'

const HISTORY: PriceHistoryEntry[] = [
  { date: 'Feb 9, 2026', totalPrice: 13_000, pricePerSeat: 6_500, changePercent: null },
  { date: 'Apr 22, 2026', totalPrice: 10_000, pricePerSeat: 5_000, changePercent: -0.23 },
  { date: 'May 30, 2026', totalPrice: 11_500, pricePerSeat: 5_750, changePercent: 0.15 },
]

describe('PriceHistoryTable', () => {
  /**
   * Validates: this column uses the DIRECTION convention — red when the number
   * fell — which is the opposite of the AI panel's verdict badge.
   *
   * Why it matters: the two conventions sit on one screen and look contradictory
   * out of context. Without this test the next person "harmonises" the table with
   * the badge above it and silently breaks the match with the reference site,
   * where a price cut has always read red.
   */
  it('renders a fall in the critical tone and a rise in the good tone', () => {
    const { container } = render(<PriceHistoryTable history={HISTORY} />)

    const fell = container.querySelector('.lucide-trending-down')
    const rose = container.querySelector('.lucide-trending-up')

    expect(fell).toBeInTheDocument()
    expect(rose).toBeInTheDocument()
    expect(fell?.closest('span')?.className).toContain('text-over')
    expect(rose?.closest('span')?.className).toContain('text-good')
  })

  /**
   * Validates: direction is readable without colour.
   * Why it matters: red vs green is this app's CVD-worst pair — ΔE 1.2 under
   * deuteranopia in light mode. The arrow icon and the sr-only word are the only
   * things carrying direction for a red-green colourblind or screen-reader user.
   */
  it('exposes direction as text, not colour alone', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('down')).toBeInTheDocument()
    expect(screen.getByText('up')).toBeInTheDocument()
  })

  /**
   * Validates: the arrow carries the sign, so the figure is unsigned.
   * Why it matters: an arrow beside "-23%" reads as a double negative.
   */
  it('prints the percentage unsigned', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('23%')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.queryByText('-23%')).not.toBeInTheDocument()
  })

  it('renders the oldest row with no change and newest first', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('--')).toBeInTheDocument()
    const dates = screen.getAllByText(/2026$/).map((node) => node.textContent)
    expect(dates[0]).toBe('May 30, 2026')
  })

  it('shows both total and per-seat prices', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('$10,000')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })
})
