export type DealStatus = 'undervalued' | 'fair' | 'overpriced'

export type Recommendation = 'Buy' | 'Neutral' | 'Wait'

export type Trend = 'up' | 'down' | 'flat'

/** How an insight reads for the buyer — rendered with a glyph, never colour alone. */
export type InsightTone = 'positive' | 'neutral' | 'caution'

export interface PriceHistoryPoint {
  /** Display label, e.g. "Jul 27". */
  date: string
  price: number
}

export interface DealVerdict {
  status: DealStatus
  /** Signed fraction: (listing - estimate) / estimate. -0.12 means 12% under. */
  percentageDiff: number
  recommendation: Recommendation
}

export interface Insight {
  id: string
  text: string
  tone: InsightTone
  /** Absolute magnitude of the underlying signal; used to rank. */
  weight: number
}

/**
 * Everything the panel needs, all of it already known to the host listing page.
 * The widget evaluates these signals — it does not produce them.
 */
export interface ListingSignals {
  listingPrice: number
  estimatedPrice: number
  priceHistory: PriceHistoryPoint[]
  sectionAverage: number
  trend: Trend
  section: number
}
