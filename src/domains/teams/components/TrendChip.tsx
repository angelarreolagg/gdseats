import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/shared/components/Tooltip'
import { formatPercent, formatSignedPercent } from '@/shared/utils/formatters'
import type { MarketTrend, TrendTone } from '../types/team.types'
import { TREND_ICON, getTrendExplanation } from './trendPresentation'

interface TrendChipProps {
  trend: MarketTrend
  /**
   * Off inside `TeamCard` — the card is a `<button>`, and a focusable element
   * nested in one is invalid. `SearchToolbar` turns it on.
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

/** Icon and label are the visible signal; nothing depends on the tooltip. */
export function TrendChip({ trend, focusable = false }: TrendChipProps) {
  const { t } = useTranslation('teams')
  const Icon = TREND_ICON[trend.iconName]
  const label = t(trend.labelKey)

  /* `holo-chip`: the same iridescence DealBadge wears, on the border only so the
       tone fill still carries the direction. Cheap here — eight cards a page,
       against ~170 listing rows. */
  const chip = (
    <span
      className={`holo-chip inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${TONE_CHIP[trend.tone]}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label}
      {/* A steady market rounds to "0%", which reads as missing data rather than
          as a measurement — and the label already says the number isn't moving.
          The tooltip still carries the figure for anyone who wants it. */}
      {trend.direction === 'steady' ? null : (
        <span className="tabular-nums opacity-80">{formatSignedPercent(trend.momentum)}</span>
      )}
    </span>
  )

  // The service hands back keys and a counted horizon; formatting and plural
  // selection happen here, where the locale is.
  const explanation = getTrendExplanation(trend)
  const forecast = t(explanation.forecastKey, {
    count: explanation.months,
    magnitude: formatPercent(explanation.momentum),
  })
  const implication = t(explanation.implicationKey)
  const momentum = formatSignedPercent(trend.momentum)

  /* A titled panel: as one string this ran to a ~750px line spanning three cards.
       The header repeats the chip's icon and label, since the tooltip can open
       some distance from its trigger. */
  const panel = (
    <div className="w-60">
      <div className="mb-2 flex items-center gap-1.5 border-b border-border-hairline pb-2">
        <Icon
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 ${TONE_INK[trend.tone]}`}
          strokeWidth={2.5}
        />
        <span className="text-xs font-semibold text-ink">{label}</span>
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
    <Tooltip content={panel} variant="panel" openOnTap>
      <span
        tabIndex={focusable ? 0 : undefined}
        className="inline-flex cursor-default rounded-full focus-visible:outline-2"
      >
        {chip}
      </span>
    </Tooltip>
  )
}
