import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
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
  /** Key for what the data says is coming. Carries `count` and `magnitude`. */
  forecastKey: string
  /** Key for what that tends to mean for someone buying. */
  implicationKey: string
  /**
   * Forecast horizon in months, COUNTED from the series rather than typed into
   * a string. If the forecast window ever changes the copy changes with it,
   * instead of quietly claiming three months forever — and it is passed as
   * i18next's `count`, so the plural form is the language's problem rather than
   * a `months === 1 ? '' : 's'` that only works in English.
   */
  months: number
  /** Signed fraction; the component formats it. */
  momentum: number
}

/**
 * The reasoning behind the chip, split into its two ideas.
 *
 * The label alone ("Cooling off") states a conclusion without saying what it
 * rests on. Returning two keys rather than one paragraph lets the tooltip lay
 * them out as separate lines — the observation, then what it implies — instead
 * of running them together into a sentence that reads as a wall.
 *
 * Suggestive, never directive — "waiting may improve your entry price", not
 * "wait". The analyzer panel two screens later follows the same rule, and the
 * same buyer reads both; both sets of copy are pinned by tests against a
 * banned-words list.
 */
export function getTrendExplanation(trend: MarketTrend): TrendExplanation {
  return {
    forecastKey: `teams:trend.forecast.${trend.direction}`,
    implicationKey: `teams:trend.implication.${trend.direction}`,
    months: trend.series.filter((point) => point.projected).length,
    momentum: trend.momentum,
  }
}
