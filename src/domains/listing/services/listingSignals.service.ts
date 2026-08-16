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
    // Dates cross over as epoch ms and are shortened at render, which is what
    // removed the `date.split(',')[0]` that used to live here: it was an
    // assumption about US comma placement, and es/pt-BR have no comma to split
    // on while ja writes the year first — so the "short" date was the year.
    priceHistory: listing.priceHistory.map((entry) => ({
      dateMs: entry.dateMs,
      price: entry.totalPrice,
    })),
  }
}
