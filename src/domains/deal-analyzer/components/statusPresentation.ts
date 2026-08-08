import { Equal, Gem, Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { DealStatus, InsightTone, Recommendation } from '../types/deal.types'

interface StatusPresentation {
  Icon: LucideIcon
  label: string
  /** Soft tinted pill — a tag, not an alert. */
  pill: string
  /** Ink colour for text set on a plain surface. */
  ink: string
}

/**
 * MARKET CONTEXT, not a warning system.
 *
 * This panel sits beside a five-figure purchase decision. Framed as pass/warn/fail
 * it stops being useful and starts being an obstacle — a buyer who reads
 * "Overpriced" in red walks away from a listing that may still be right for them.
 * So the wording is observational and the palette is deliberately NOT the
 * good/amber/critical status ramp used elsewhere in the app.
 *
 * Two constraints still hold and are measured, not assumed:
 *  - Every status pairs an icon with a text label. Colour alone is never the
 *    signal (amber↔teal sit at CVD ΔE 10.8 under protanopia).
 *  - Teal is held away from the brand green — ΔE 16.6 in light, 26.4 in dark — so
 *    "attractive value" never reads as the green CTA it sits near.
 */
export const STATUS_PRESENTATION: Record<DealStatus, StatusPresentation> = {
  undervalued: {
    Icon: Gem,
    label: 'Attractive value',
    pill: 'bg-attractive/12 text-attractive',
    ink: 'text-attractive',
  },
  fair: {
    Icon: Equal,
    label: 'In line with market',
    pill: 'bg-aligned/12 text-aligned',
    ink: 'text-aligned',
  },
  overpriced: {
    Icon: TrendingUp,
    label: 'Above market range',
    pill: 'bg-above/12 text-above',
    ink: 'text-above',
  },
}

/**
 * Suggestive, never directive. "Wait" and "Buy now" tell the buyer what to do with
 * their money; these offer a reading and leave the decision with them.
 */
export const RECOMMENDATION_COPY: Record<Recommendation, string> = {
  opportunity: 'This could be a strong opportunity based on recent trends',
  aligned: 'This listing is aligned with recent market activity',
  patience: 'You may find better value by waiting',
}

/**
 * Insight bullets carry a directional icon but NO colour.
 *
 * They used to be green for "price dropped" — which put the same fact in green
 * here and in red in the price-history table two hundred pixels away. Dropping the
 * colour is what lets the two conventions coexist: the bullets are prose, so the
 * sentence carries the meaning and the icon carries the direction.
 */
export const TONE_ICON: Record<InsightTone, LucideIcon> = {
  positive: TrendingDown,
  neutral: Minus,
  caution: TrendingUp,
}
