import { Flame, Minus, Scale, TrendingDown, TrendingUp, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { DealStatus, InsightTone } from '../types/deal.types'

interface StatusPresentation {
  Icon: LucideIcon
  label: string
  /** Tinted pill — deliberately NOT a solid fill. See note below. */
  pill: string
  /** Ink colour for text set on a plain surface. */
  ink: string
}

/**
 * VERDICT colours — buyer-relative. Green means "good buy", not "the number went
 * up". This is one of two conventions in the app; the other is direction (red =
 * fell), used by the price-history Change column and the discount chips. They do
 * not conflict because they own different regions: verdicts advise, direction
 * badges report.
 *
 * Every status carries an icon AND a text label, not just a colour: the brand
 * green and the amber measure CVD ΔE 7.0 under deuteranopia, inside the band that
 * is only legal with secondary encoding. Centralising it here means no caller can
 * accidentally ship colour alone.
 *
 * All three use a *tinted* pill rather than a solid fill — including undervalued.
 * Inside the listing page the host's "Submit offer" button already owns the one
 * solid green block; a second one makes the widget compete with the page's primary
 * action instead of informing it.
 */
export const STATUS_PRESENTATION: Record<DealStatus, StatusPresentation> = {
  undervalued: {
    Icon: Flame,
    label: 'Undervalued',
    pill: 'bg-good/12 text-good',
    ink: 'text-good',
  },
  fair: {
    Icon: Scale,
    label: 'Fair Price',
    pill: 'bg-fair/12 text-fair',
    ink: 'text-fair',
  },
  overpriced: {
    Icon: TriangleAlert,
    label: 'Overpriced',
    pill: 'bg-over/12 text-over',
    ink: 'text-over',
  },
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
