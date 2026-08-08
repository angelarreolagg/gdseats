import type { Recommendation as RecommendationValue } from '../types/deal.types'
import { RECOMMENDATION_COPY } from './statusPresentation'

interface RecommendationProps {
  value: RecommendationValue
}

/**
 * One sentence, neutral tone, in body ink rather than a status colour.
 *
 * Previously a coloured verb ("Buy" / "Wait") plus a rationale. A single
 * observation reads as guidance from a knowledgeable party; a coloured imperative
 * reads as a gate.
 */
export function Recommendation({ value }: RecommendationProps) {
  return <p className="text-sm leading-snug text-ink">{RECOMMENDATION_COPY[value]}</p>
}
