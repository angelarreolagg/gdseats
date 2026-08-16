import { describe, expect, it } from 'vitest'
import { render, screen, setLocale } from '@/test/utils'
import { PriceHistoryTable } from '../components/PriceHistoryTable'
import type { PriceHistoryEntry } from '../types/listing.types'

/**
 * Epoch ms rather than the display strings this fixture used to hold — the whole
 * point of the change is that the table decides how a date reads, so a test that
 * supplied the finished words could not tell whether it did.
 *
 * `Date.UTC` and not `new Date(2026, 1, 9)`: the formatters pin `timeZone: 'UTC'`
 * so a calendar date cannot slip a day for a reader west of Greenwich, and a
 * local-time fixture would make this suite pass or fail on the machine's zone.
 */
const HISTORY: PriceHistoryEntry[] = [
  { dateMs: Date.UTC(2026, 1, 9), totalPrice: 13_000, pricePerSeat: 6_500, changePercent: null },
  { dateMs: Date.UTC(2026, 3, 22), totalPrice: 10_000, pricePerSeat: 5_000, changePercent: -0.23 },
  { dateMs: Date.UTC(2026, 4, 30), totalPrice: 11_500, pricePerSeat: 5_750, changePercent: 0.15 },
]

describe('PriceHistoryTable', () => {
  it('renders a fall in the critical tone and a rise in the good tone', () => {
    const { container } = render(<PriceHistoryTable history={HISTORY} />)

    const fell = container.querySelector('.lucide-trending-down')
    const rose = container.querySelector('.lucide-trending-up')

    expect(fell).toBeInTheDocument()
    expect(rose).toBeInTheDocument()
    expect(fell?.closest('span')?.className).toContain('text-over')
    expect(rose?.closest('span')?.className).toContain('text-good')
  })

  it('exposes direction as text, not colour alone', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('down')).toBeInTheDocument()
    expect(screen.getByText('up')).toBeInTheDocument()
  })

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

  it('formats dates for the active locale', () => {
    setLocale('ja')
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('2026/05/30')).toBeInTheDocument()
    expect(screen.queryByText('May 30, 2026')).not.toBeInTheDocument()
  })

  it('shows both total and per-seat prices', () => {
    render(<PriceHistoryTable history={HISTORY} />)

    expect(screen.getByText('$10,000')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })
})
