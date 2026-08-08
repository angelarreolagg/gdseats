import type { DealStatus, DealVerdict, Recommendation } from '../types/deal.types'

/** At or below this, the listing is undervalued. Strict — exactly -10% is fair. */
export const UNDERVALUED_THRESHOLD = -0.1
/** At or above this, the listing is overpriced. Strict — exactly +10% is fair. */
export const OVERPRICED_THRESHOLD = 0.1

const RECOMMENDATION_BY_STATUS: Record<DealStatus, Recommendation> = {
  undervalued: 'opportunity',
  fair: 'aligned',
  overpriced: 'patience',
}

/**
 * Signed difference between the asking price and fair value.
 *
 * Negative means the listing sits BELOW the estimate, which is the good case for
 * a buyer. The sign convention is load-bearing — every status and recommendation
 * downstream reads it.
 */
export function calculatePercentageDiff(listingPrice: number, estimatedPrice: number): number {
  // An estimate of zero would make the ratio meaningless rather than merely large,
  // so clamp the divisor instead of returning Infinity.
  const safeEstimate = Math.max(estimatedPrice, 1)
  return (listingPrice - safeEstimate) / safeEstimate
}

/**
 * Bucket the difference into a verdict. Both boundaries land in `fair`: only a
 * listing strictly beyond ±10% is called out.
 */
export function getDealStatus(percentageDiff: number): DealStatus {
  if (percentageDiff < UNDERVALUED_THRESHOLD) return 'undervalued'
  if (percentageDiff > OVERPRICED_THRESHOLD) return 'overpriced'
  return 'fair'
}

/**
 * The stance we put in front of the buyer, one per status.
 *
 * Returns a key rather than a phrase: this is a marketplace, and the wording is a
 * conversion-sensitive product decision that belongs in the presentation layer,
 * not baked into pricing logic.
 */
export function getRecommendation(status: DealStatus): Recommendation {
  return RECOMMENDATION_BY_STATUS[status]
}

/** Composed verdict — what the panel actually calls. */
export function evaluateDeal(listingPrice: number, estimatedPrice: number): DealVerdict {
  const percentageDiff = calculatePercentageDiff(listingPrice, estimatedPrice)
  const status = getDealStatus(percentageDiff)
  return { status, percentageDiff, recommendation: getRecommendation(status) }
}
