import type { DealStatus, InsightTone } from '../types/deal.types'

interface StatusPresentation {
  emoji: string
  label: string
  /** Tinted pill — deliberately NOT a solid fill. See note below. */
  pill: string
  /** Ink colour for text set on a plain surface. */
  ink: string
}

/**
 * Every status carries an emoji AND a text label, not just a colour. This is not
 * decoration: the brand green and the amber measure CVD ΔE 7.0 under
 * deuteranopia, inside the band that is only legal with secondary encoding.
 *
 * All three statuses use a *tinted* pill rather than a solid fill — including
 * undervalued, which the old standalone dashboard rendered as a solid brand-green
 * hero. Inside the listing page the host's "Submit offer" button already owns the
 * one solid green block; a second one makes the widget compete with the page's
 * primary action instead of informing it.
 */
export const STATUS_PRESENTATION: Record<DealStatus, StatusPresentation> = {
  undervalued: {
    emoji: '🔥',
    label: 'Undervalued',
    pill: 'bg-good/12 text-good',
    ink: 'text-good',
  },
  fair: {
    emoji: '⚖️',
    label: 'Fair Price',
    pill: 'bg-fair/12 text-fair',
    ink: 'text-fair',
  },
  overpriced: {
    emoji: '🚨',
    label: 'Overpriced',
    pill: 'bg-over/12 text-over',
    ink: 'text-over',
  },
}

/** Glyphs so an insight's tone is never carried by colour alone. */
export const TONE_GLYPH: Record<InsightTone, string> = {
  positive: '▾',
  neutral: '•',
  caution: '▴',
}

export const TONE_INK: Record<InsightTone, string> = {
  positive: 'text-good',
  neutral: 'text-muted',
  caution: 'text-over',
}
