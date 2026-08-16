import { useTranslation } from 'react-i18next'
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from '@/shared/utils/formatters'
import type { Insight } from '../types/deal.types'
import { TONE_ICON } from './statusPresentation'

interface InsightsListProps {
  insights: Insight[]
}

/**
 * Formats the service's raw signal values. Mapped by *name* because each raw
 * field has one presentation: a `change` is a magnitude, a `dateMs` a short date.
 */
function formatParams(params: Insight['params']): Record<string, string | number> {
  const formatted: Record<string, string | number> = {}

  for (const [name, value] of Object.entries(params)) {
    if (name === 'change' && typeof value === 'number') {
      formatted.magnitude = formatPercent(value)
    } else if (name === 'dateMs' && typeof value === 'number') {
      formatted.date = formatShortDate(value)
    } else if (name === 'price' && typeof value === 'number') {
      formatted.price = formatCurrency(value)
    } else {
      formatted[name] = value
    }
  }

  return formatted
}

export function InsightsList({ insights }: InsightsListProps) {
  const { t } = useTranslation('analyzer')

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
            <span className="text-muted">{t(insight.key, formatParams(insight.params))}</span>
          </li>
        )
      })}
    </ul>
  )
}
