import type { ListingSignals, Trend } from '@/domains/deal-analyzer/types/deal.types'
import type { Listing } from '../types/listing.types'
import { getEstimatedTotal, getSectionAverageTotal, getTotalPrice } from '../types/listing.types'

/** Short label for insight copy — "Jul 22, 2026" reads long inside a bullet. */
function shortDate(date: string): string {
  return date.split(',')[0]
}

function inferTrend(listing: Listing): Trend {
  const history = listing.priceHistory
  if (history.length < 2) return 'flat'

  const change = history[history.length - 1].pricePerSeat - history[0].pricePerSeat
  if (change < 0) return 'down'
  if (change > 0) return 'up'
  return 'flat'
}

/**
 * Adapter from the host's listing record to the analyzer's input shape.
 *
 * Everything crosses over as a TOTAL for this listing's seat count: comparison is
 * done per seat, but the buyer offers a total, so the panel speaks in totals.
 * This is the only place the two units meet.
 */
export function toListingSignals(listing: Listing): ListingSignals {
  return {
    listingPrice: getTotalPrice(listing),
    estimatedPrice: getEstimatedTotal(listing),
    sectionAverage: getSectionAverageTotal(listing),
    section: listing.section,
    trend: inferTrend(listing),
    priceHistory: listing.priceHistory.map((entry) => ({
      date: shortDate(entry.date),
      price: entry.totalPrice,
    })),
  }
}
