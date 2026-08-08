import { Tooltip } from '@/shared/components/Tooltip'
import { formatSignedPercent } from '@/shared/utils/formatters'
import type { MarketTrend, TrendTone } from '../types/team.types'
import { TREND_ICON, getTrendExplanation } from './trendPresentation'

interface TrendChipProps {
  trend: MarketTrend
  /**
   * Give the chip its own tab stop.
   *
   * Off inside `TeamCard` — the card is itself a `<button>`, and a focusable
   * element nested in a button is invalid markup and would add a second tab stop
   * to every card in the grid. `SearchToolbar` turns it on, so the explanation is
   * keyboard-reachable somewhere. Same split `Tag` uses between `ListingRow` and
   * `ListingSummaryCard`.
   */
  focusable?: boolean
}

const TONE_CHIP: Record<TrendTone, string> = {
  good: 'bg-good/12 text-good',
  fair: 'bg-fair/12 text-fair',
  neutral: 'bg-ink/8 text-muted',
}

const TONE_INK: Record<TrendTone, string> = {
  good: 'text-good',
  fair: 'text-fair',
  neutral: 'text-muted',
}

/**
 * Direction, magnitude and — on hover — the reasoning.
 *
 * The icon and label are the visible signal, so nothing depends on the tooltip:
 * hover never fires on touch, and the card carries the buyer implication as text
 * regardless.
 */
export function TrendChip({ trend, focusable = false }: TrendChipProps) {
  const Icon = TREND_ICON[trend.iconName]

  const chip = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${TONE_CHIP[trend.tone]}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {trend.label}
      {/* A steady market rounds to "0%", which reads as missing data rather than
          as a measurement — and the label already says the number isn't moving.
          The tooltip still carries the figure for anyone who wants it. */}
      {trend.direction === 'steady' ? null : (
        <span className="tabular-nums opacity-80">{formatSignedPercent(trend.momentum)}</span>
      )}
    </span>
  )

  const { forecast, implication } = getTrendExplanation(trend)
  const momentum = formatSignedPercent(trend.momentum)

  /*
   * A titled panel rather than a run of text. As one string this ran to a single
   * ~750px line that spanned three cards; split into a header, the observation
   * and what it implies, it is scannable at a glance.
   *
   * The header repeats the chip's own icon and label on purpose — the tooltip can
   * open some distance from its trigger, and it should say what it is about.
   */
  const panel = (
    <div className="w-60">
      <div className="mb-2 flex items-center gap-1.5 border-b border-border-hairline pb-2">
        <Icon
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 ${TONE_INK[trend.tone]}`}
          strokeWidth={2.5}
        />
        <span className="text-xs font-semibold text-ink">{trend.label}</span>
        {trend.direction === 'steady' ? null : (
          <span className={`ml-auto text-xs font-semibold tabular-nums ${TONE_INK[trend.tone]}`}>
            {momentum}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink">{forecast}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{implication}</p>
    </div>
  )

  return (
    <Tooltip content={panel} variant="panel">
      <span
        tabIndex={focusable ? 0 : undefined}
        className="inline-flex cursor-default rounded-full focus-visible:outline-2"
      >
        {chip}
      </span>
    </Tooltip>
  )
}
