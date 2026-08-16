import { useTranslation } from 'react-i18next'
import type { DealStatus } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface DealBadgeProps {
  status: DealStatus
  /** Optional signed delta, e.g. "-14%". */
  formattedDiff?: string
}

/**
 * The verdict as a chip. `holo-chip` on the border only, so the fill keeps the
 * verdict tint and the rainbow never competes with the hue that carries meaning.
 */
export function DealBadge({ status, formattedDiff }: DealBadgeProps) {
  const { t } = useTranslation('analyzer')
  const { Icon, labelKey, pill } = STATUS_PRESENTATION[status]

  return (
    <span
      className={`holo-chip inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${pill}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {t(labelKey)}
      {formattedDiff ? <span className="tabular-nums opacity-80">{formattedDiff}</span> : null}
    </span>
  )
}
