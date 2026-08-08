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
 * Same icon + label pairing as the full StatusBadge — the shrink is in size, not
 * in the accessibility contract, since colour alone still isn't a safe channel.
 *
 * `holo-chip` puts the panel's iridescence on the 1px border only. The fill stays
 * the verdict tint and the text the verdict ink, so the rainbow marks this as the
 * AI layer without competing with the hue that says what the verdict is.
 * Off-screen rows don't animate — see `content-visibility` on ListingRow.
 */
export function DealBadge({ status, formattedDiff }: DealBadgeProps) {
  const { Icon, label, pill } = STATUS_PRESENTATION[status]

  return (
    <span
      className={`holo-chip inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${pill}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label}
      {formattedDiff ? <span className="tabular-nums opacity-80">{formattedDiff}</span> : null}
    </span>
  )
}
