import type { Insight } from '../types/deal.types'
import { TONE_GLYPH, TONE_INK } from './statusPresentation'

interface InsightsListProps {
  insights: Insight[]
}

export function InsightsList({ insights }: InsightsListProps) {
  if (insights.length === 0) return null

  return (
    <ul className="flex flex-col gap-1.5">
      {insights.map((insight) => (
        <li key={insight.id} className="flex items-start gap-2 text-xs leading-snug">
          {/* The glyph carries the tone alongside the colour, never instead of it. */}
          <span aria-hidden="true" className={`mt-px text-[10px] ${TONE_INK[insight.tone]}`}>
            {TONE_GLYPH[insight.tone]}
          </span>
          <span className="text-muted">{insight.text}</span>
        </li>
      ))}
    </ul>
  )
}
