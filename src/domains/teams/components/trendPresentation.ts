import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { formatPercent } from '@/shared/utils/formatters'
import type { MarketTrend, TrendDirection } from '../types/team.types'

/**
 * Resolves a trend direction into its icon. Lives here rather than in the service
 * so `marketTrend.service.ts` stays free of React.
 */
export const TREND_ICON: Record<TrendDirection, LucideIcon> = {
  heating: TrendingUp,
  steady: Minus,
  cooling: TrendingDown,
}

export interface TrendExplanation {
  /** What the data says is coming. */
  forecast: string
  /** What that tends to mean for someone buying. */
  implication: string
}

/**
 * The reasoning behind the chip, split into its two ideas.
 *
 * The label alone ("Cooling off") states a conclusion without saying what it
 * rests on. Returning two strings rather than one paragraph lets the tooltip lay
 * them out as separate lines — the observation, then what it implies — instead of
 * running them together into a sentence that reads as a wall.
 *
 * Suggestive, never directive — "waiting may improve your entry price", not
 * "wait". The analyzer panel two screens later follows the same rule, and the
 * same buyer reads both.
 *
 * The horizon is COUNTED from the series rather than typed into the string. If
 * the forecast window ever changes, the copy changes with it instead of quietly
 * claiming three months forever.
 */
export function getTrendExplanation(trend: MarketTrend): TrendExplanation {
  const months = trend.series.filter((point) => point.projected).length
  const horizon = `over the next ${months} month${months === 1 ? '' : 's'}`
  const magnitude = formatPercent(trend.momentum)

  switch (trend.direction) {
    case 'cooling':
      return {
        forecast: `Demand is projected to fall ${magnitude} ${horizon}.`,
        implication: 'Cooling markets tend to soften, so waiting may improve your entry price.',
      }
    case 'heating':
      return {
        forecast: `Demand is projected to rise ${magnitude} ${horizon}.`,
        implication: 'Entry costs in heating markets tend to follow.',
      }
    case 'steady':
      return {
        forecast: `Demand is projected to hold ${horizon}.`,
        implication: 'Pricing here has been stable.',
      }
  }
}
