import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { MarketTrend, TrendDirection } from '../types/team.types'

/** Lives here so `marketTrend.service.ts` stays free of React. */
export const TREND_ICON: Record<TrendDirection, LucideIcon> = {
  heating: TrendingUp,
  steady: Minus,
  cooling: TrendingDown,
}

export interface TrendExplanation {
  /** Carries `count` and `magnitude`. */
  forecastKey: string
  /** Key for what that tends to mean for someone buying. */
  implicationKey: string
  /** Counted from the series, and passed as i18next's `count`. */
  months: number
  /** Signed fraction; the component formats it. */
  momentum: number
}

/**
 * The reasoning behind the chip, as two keys: the tooltip lays them out as the
 * observation and what it implies. Suggestive, never directive — the analyzer
 * two screens later follows the same rule, and both are pinned by tests.
 */
export function getTrendExplanation(trend: MarketTrend): TrendExplanation {
  return {
    forecastKey: `teams:trend.forecast.${trend.direction}`,
    implicationKey: `teams:trend.implication.${trend.direction}`,
    months: trend.series.filter((point) => point.projected).length,
    momentum: trend.momentum,
  }
}
