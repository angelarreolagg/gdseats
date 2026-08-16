import type { ListingSignals, Trend } from '@/domains/deal-analyzer/types/deal.types'
import type { Listing } from '../types/listing.types'
import { getEstimatedTotal, getSectionAverageTotal, getTotalPrice } from '../types/listing.types'

function inferTrend(listing: Listing): Trend {
  const history = listing.priceHistory
  if (history.length < 2) return 'flat'

  const change = history[history.length - 1].pricePerSeat - history[0].pricePerSeat
  if (change < 0) return 'down'
  if (change > 0) return 'up'
  return 'flat'
}

/**
 * Adapter to the analyzer's input shape. Everything crosses as a TOTAL: the
 * comparison is per seat, but the buyer offers a total. The only place the two
 * units meet.
 */
export function toListingSignals(listing: Listing): ListingSignals {
  return {
    listingPrice: getTotalPrice(listing),
    estimatedPrice: getEstimatedTotal(listing),
    sectionAverage: getSectionAverageTotal(listing),
    section: listing.section,
    trend: inferTrend(listing),
    // Epoch ms, shortened at render — this replaced a `split(',')[0]` that only
    // made sense in one locale.
    priceHistory: listing.priceHistory.map((entry) => ({
      dateMs: entry.dateMs,
      price: entry.totalPrice,
    })),
  }
}
