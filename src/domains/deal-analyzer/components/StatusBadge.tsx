import { useTranslation } from 'react-i18next'
import type { DealStatus } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface StatusBadgeProps {
  status: DealStatus
  /** Pre-formatted, e.g. "+11%". Formatting stays out of the component. */
  formattedDiff: string
}

/**
 * Reads as a tag, not an alert: fully rounded, soft tint, medium weight. The
 * earlier version was a heavy semibold block in status colours, which framed the
 * verdict as a verdict rather than as context.
 */
export function StatusBadge({ status, formattedDiff }: StatusBadgeProps) {
  const { t } = useTranslation('analyzer')
  const { Icon, labelKey, pill } = STATUS_PRESENTATION[status]

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill}`}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {t(labelKey)}
      </span>
      <span className="text-xs font-medium text-muted tabular-nums">
        {t('badge.vsMarket', { diff: formattedDiff })}
      </span>
    </div>
  )
}
