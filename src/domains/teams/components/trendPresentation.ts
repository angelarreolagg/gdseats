import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { TrendDirection } from '../types/team.types'

/**
 * Resolves a trend direction into its icon. Lives here rather than in the service
 * so `marketTrend.service.ts` stays free of React.
 */
export const TREND_ICON: Record<TrendDirection, LucideIcon> = {
  heating: TrendingUp,
  steady: Minus,
  cooling: TrendingDown,
}
