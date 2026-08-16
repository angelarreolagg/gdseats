import type { Insight, ListingSignals, PriceHistoryPoint } from '../types/deal.types'

/**
 * Names its bullets; `InsightsList` turns them into sentences. Every `params`
 * value is a raw number or epoch ms, so an insight renders correctly in whatever
 * language is active when it is read — and this file stays pure arithmetic.
 */

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

    key: dropped
      ? 'analyzer:insights.recentMovement.down'
      : 'analyzer:insights.recentMovement.up',
    params: { change, dateMs: previous.dateMs },
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
      key: 'analyzer:insights.sectionAverage.similar',
      params: { section: signals.section },
      weight: 0,
    }
  }

  const above = change > 0
  return {
    id: 'section-average',
    tone: above ? 'caution' : 'positive',
    // The listing stays the subject: phrasing it around the comparables would
    // attach a figure measured against the average to a sentence about something
    // else. Restated in TRANSLATORS.md, since it is invisible in the string.
    key: above
      ? 'analyzer:insights.sectionAverage.above'
      : 'analyzer:insights.sectionAverage.below',
    params: { change, section: signals.section },
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
  const weight = Math.abs(
    relativeChange(first.price, priceHistory[priceHistory.length - 1].price),
  )

  if (trend === 'down') {
    return {
      id: 'trend',
      tone: 'positive',
      // "revisions" rather than "cuts" — the same fact without the pressure.
      key: 'analyzer:insights.trend.down',
      params: { price: first.price, dateMs: first.dateMs, count: cuts },
      weight,
    }
  }

  if (trend === 'up') {
    return {
      id: 'trend',
      tone: 'caution',
      key: 'analyzer:insights.trend.up',
      params: { dateMs: first.dateMs },
      weight,
    }
  }

  return {
    id: 'trend',
    tone: 'neutral',
    key: 'analyzer:insights.trend.flat',
    params: { dateMs: first.dateMs },
    weight: 0,
  }
}

/** The two or three strongest signals. Ranking is the editorial decision. */
export function generateInsights(signals: ListingSignals): Insight[] {
  const candidates = [
    recentMovement(signals.priceHistory),
    versusSectionAverage(signals),
    trendDirection(signals),
  ].filter((insight): insight is Insight => insight !== null)

  return candidates.sort((a, b) => b.weight - a.weight).slice(0, MAX_INSIGHTS)
}
