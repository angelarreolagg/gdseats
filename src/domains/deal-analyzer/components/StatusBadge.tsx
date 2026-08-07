import type { DealStatus } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface StatusBadgeProps {
  status: DealStatus
  /** Pre-formatted, e.g. "+11%". Formatting stays out of the component. */
  formattedDiff: string
}

export function StatusBadge({ status, formattedDiff }: StatusBadgeProps) {
  const { Icon, label, pill } = STATUS_PRESENTATION[status]

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${pill}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <span className="text-sm font-semibold tracking-tight">{label}</span>
      <span className="ml-auto text-sm font-semibold tabular-nums">{formattedDiff}</span>
    </div>
  )
}
