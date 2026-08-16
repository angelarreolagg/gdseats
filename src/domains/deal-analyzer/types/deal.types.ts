export type DealStatus = 'undervalued' | 'fair' | 'overpriced'

/**
 * Semantic keys, never displayed. The user-facing sentence lives in
 * `components/statusPresentation.ts` — this layer must not hold copy, and the
 * keys stay non-directive so nobody is tempted to render them raw.
 */
export type Recommendation = 'opportunity' | 'aligned' | 'patience'

export type Trend = 'up' | 'down' | 'flat'

/** How an insight reads for the buyer — rendered with a glyph, never colour alone. */
export type InsightTone = 'positive' | 'neutral' | 'caution'

export interface PriceHistoryPoint {
  /** Epoch ms. The component formats it; the analyzer only orders by it. */
  dateMs: number
  price: number
}

export interface DealVerdict {
  status: DealStatus
  /** Signed fraction: (listing - estimate) / estimate. -0.12 means 12% under. */
  percentageDiff: number
  recommendation: Recommendation
}

/**
 * A bullet the panel can render, expressed as a key rather than a sentence.
 *
 * Same rule the icons already follow: the service names the thing, the component
 * layer resolves it. Three specific gains over letting `insights.service.ts`
 * call `t()` itself — the service stays a pure function rather than depending on
 * i18n init order, its unit tests assert logic instead of English prose, and the
 * "why it matters commercially" comments keep describing behaviour.
 *
 * **`params` carries raw numbers and epoch ms, never pre-formatted strings.**
 * The component formats at render, so an insight computed under one language and
 * read under another is still correct — and the service stops importing the
 * formatters entirely, which leaves it as arithmetic over signals.
 */
export interface Insight {
  id: string
  /** e.g. `analyzer:insights.sectionAverage.above`. */
  key: string
  params: Record<string, string | number>
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
