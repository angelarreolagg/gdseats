import { Equal, Gem, Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { DealStatus, InsightTone, Recommendation } from '../types/deal.types'

interface StatusPresentation {
  Icon: LucideIcon
  /** A key: this file chooses icon and tint, the locale bundle owns the words. */
  labelKey: string
  /** Soft tinted pill — a tag, not an alert. */
  pill: string
  /** Ink colour for text set on a plain surface. */
  ink: string
}

/**
 * MARKET CONTEXT, not a warning system. Framed as pass/warn/fail this panel
 * becomes an obstacle beside a five-figure decision, so the palette is
 * deliberately not the good/amber/critical ramp used elsewhere.
 *
 * Every status pairs an icon with a label — amber↔teal is CVD ΔE 10.8 — and teal
 * is held away from the brand green so "attractive value" never reads as the CTA.
 */
export const STATUS_PRESENTATION: Record<DealStatus, StatusPresentation> = {
  undervalued: {
    Icon: Gem,
    labelKey: 'status.undervalued',
    pill: 'bg-attractive/12 text-attractive',
    ink: 'text-attractive',
  },
  fair: {
    Icon: Equal,
    labelKey: 'status.fair',
    pill: 'bg-aligned/12 text-aligned',
    ink: 'text-aligned',
  },
  overpriced: {
    Icon: TrendingUp,
    labelKey: 'status.overpriced',
    pill: 'bg-above/12 text-above',
    ink: 'text-above',
  },
}

/** Suggestive, never directive: "Wait" and "Buy now" tell the buyer what to do. */
export const RECOMMENDATION_KEY: Record<Recommendation, string> = {
  opportunity: 'recommendation.opportunity',
  aligned: 'recommendation.aligned',
  patience: 'recommendation.patience',
}

/**
 * Bullets carry a directional icon but NO colour: green for "price dropped" put
 * the same fact in green here and in red in the history table nearby.
 */
export const TONE_ICON: Record<InsightTone, LucideIcon> = {
  positive: TrendingDown,
  neutral: Minus,
  caution: TrendingUp,
}
