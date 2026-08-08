import type { Insight, ListingSignals, PriceHistoryPoint } from '../types/deal.types'
import { formatCurrency, formatPercent } from '@/shared/utils/formatters'

/** The panel has room for three bullets and no more. */
const MAX_INSIGHTS = 3
/** Below this, a movement is noise and not worth a line of the buyer's attention. */
const MATERIAL_CHANGE = 0.02

function relativeChange(from: number, to: number): number {
  if (from <= 0) return 0
  return (to - from) / from
}

/** Most recent movement in the asking price. */
function recentMovement(history: PriceHistoryPoint[]): Insight | null {
  if (history.length < 2) return null

  const latest = history[history.length - 1]
  const previous = history[history.length - 2]
  const change = relativeChange(previous.price, latest.price)
  if (Math.abs(change) < MATERIAL_CHANGE) return null

  const dropped = change < 0
  return {
    id: 'recent-movement',
    // A falling ask is leverage for the buyer; a rising one is pressure.
    tone: dropped ? 'positive' : 'caution',
    // Observational, not evaluative: "adjusted" reports, "dropped/rose" judges.
    text: `Price adjusted ${dropped ? 'down' : 'up'} ${formatPercent(change)} since ${previous.date}`,
    weight: Math.abs(change),
  }
}

/** How the ask compares to comparable seats in the same section. */
function versusSectionAverage(signals: ListingSignals): Insight | null {
  const change = relativeChange(signals.sectionAverage, signals.listingPrice)
  if (Math.abs(change) < MATERIAL_CHANGE) {
    return {
      id: 'section-average',
      tone: 'neutral',
      text: `Comparable seats in section ${signals.section} sit at a similar level`,
      weight: 0,
    }
  }

  const above = change > 0
  return {
    id: 'section-average',
    tone: above ? 'caution' : 'positive',
    // The listing stays the subject on purpose. Phrasing it as "comparables trend
    // x% lower" would attach a figure measured against the section average to a
    // sentence about the comparables — off by the ratio between the two. "Sits"
    // keeps it observational without moving the reference point.
    text: `Sits ${formatPercent(change)} ${above ? 'above' : 'below'} the section ${signals.section} average`,
    weight: Math.abs(change),
  }
}

/** The shape of the whole history, not just the last step. */
function trendDirection(signals: ListingSignals): Insight | null {
  const { priceHistory, trend } = signals
  if (priceHistory.length < 2) return null

  const first = priceHistory[0]
  const cuts = priceHistory.filter(
    (point, index) => index > 0 && point.price < priceHistory[index - 1].price,
  ).length

  if (trend === 'down') {
    return {
      id: 'trend',
      tone: 'positive',
      // "revisions" rather than "cuts" — the same fact without the pressure.
      text: `Adjusted from ${formatCurrency(first.price)} since ${first.date} across ${cuts} revisions`,
      weight: Math.abs(relativeChange(first.price, priceHistory[priceHistory.length - 1].price)),
    }
  }

  if (trend === 'up') {
    return {
      id: 'trend',
      tone: 'caution',
      text: `Gradual increases observed since ${first.date}`,
      weight: Math.abs(relativeChange(first.price, priceHistory[priceHistory.length - 1].price)),
    }
  }

  return {
    id: 'trend',
    tone: 'neutral',
    text: `Pricing has held steady since ${first.date}`,
    weight: 0,
  }
}

/**
 * The two or three signals most worth the buyer's attention, strongest first.
 *
 * Ranking by magnitude rather than showing every generator's output is what keeps
 * the panel useful: three bullets that all matter beat five that mostly don't.
 */
export function generateInsights(signals: ListingSignals): Insight[] {
  const candidates = [
    recentMovement(signals.priceHistory),
    versusSectionAverage(signals),
    trendDirection(signals),
  ].filter((insight): insight is Insight => insight !== null)

  return candidates.sort((a, b) => b.weight - a.weight).slice(0, MAX_INSIGHTS)
}
