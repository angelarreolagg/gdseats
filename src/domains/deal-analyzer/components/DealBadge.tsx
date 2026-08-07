import type { DealStatus } from '../types/deal.types'
import { STATUS_PRESENTATION } from './statusPresentation'

interface DealBadgeProps {
  status: DealStatus
  /** Optional signed delta, e.g. "-14%". */
  formattedDiff?: string
}

/**
 * The verdict, compressed to a tag so it can ride a list row.
 *
 * Same emoji + label pairing as the full StatusBadge — the shrink is in size, not
 * in the accessibility contract, since colour alone still isn't a safe channel.
 */
export function DealBadge({ status, formattedDiff }: DealBadgeProps) {
  const { emoji, label, pill } = STATUS_PRESENTATION[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${pill}`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {emoji}
      </span>
      {label}
      {formattedDiff ? <span className="tabular-nums opacity-80">{formattedDiff}</span> : null}
    </span>
  )
}
