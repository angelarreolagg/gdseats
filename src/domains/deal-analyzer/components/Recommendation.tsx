import type { DealStatus, Recommendation as RecommendationValue } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface RecommendationProps {
  value: RecommendationValue
  status: DealStatus
}

/**
 * One line of plain guidance under each verdict. Kept true for *any* listing in
 * that band — the listing-specific evidence is the job of the insight bullets,
 * which are generated from the data rather than hardcoded here.
 */
const RATIONALE: Record<RecommendationValue, string> = {
  Buy: 'Priced below comparable seats',
  Neutral: 'Priced about right for this section',
  Wait: 'Above comparable seats — hold for a better ask',
}

export function Recommendation({ value, status }: RecommendationProps) {
  const { ink } = STATUS_PRESENTATION[status]

  return (
    <div className="flex items-center gap-2.5">
      <span className={`text-sm font-semibold ${ink}`}>{value}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted">{RATIONALE[value]}</span>
    </div>
  )
}
