import type { DealStatus } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface StatusBadgeProps {
  status: DealStatus
  /** Pre-formatted, e.g. "+11%". Formatting stays out of the component. */
  formattedDiff: string
}

export function StatusBadge({ status, formattedDiff }: StatusBadgeProps) {
  const { emoji, label, pill } = STATUS_PRESENTATION[status]

  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${pill}`}>
      <span aria-hidden="true" className="text-sm leading-none">
        {emoji}
      </span>
      <span className="text-sm font-semibold tracking-tight">{label}</span>
      <span className="ml-auto text-sm font-semibold tabular-nums">{formattedDiff}</span>
    </div>
  )
}
