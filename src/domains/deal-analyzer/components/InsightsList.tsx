import type { Insight } from '../types/deal.types'
import { TONE_ICON } from './statusPresentation'

interface InsightsListProps {
  insights: Insight[]
}

export function InsightsList({ insights }: InsightsListProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {insights.map((insight) => {
        const Icon = TONE_ICON[insight.tone]
        return (
          <li key={insight.id} className="flex items-start gap-2 text-xs leading-snug">
            {/* Direction only. These bullets are prose — the sentence carries the
                meaning, so colour here would compete with the verdict above and
                with the price-history table below. */}
            <Icon aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
            <span className="text-muted">{insight.text}</span>
          </li>
        )
      })}
    </ul>
  )
}
