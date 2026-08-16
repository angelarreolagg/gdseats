import type { Insight, ListingSignals, PriceHistoryPoint } from '../types/deal.types'

/** The panel has room for three bullets and no more. */
const MAX_INSIGHTS = 3
/** Below this, a movement is noise and not worth a line of the buyer's attention. */
const MATERIAL_CHANGE = 0.02

/**
 * This service names its bullets; `InsightsList` turns them into sentences.
 *
 * It used to build the strings itself, which meant importing `formatCurrency`
 * and `formatPercent` and holding conversion-sensitive product copy in a file
 * whose job is arithmetic. What is left is arithmetic: every `params` value
 * below is a raw number or epoch ms, so the same insight reads correctly in
 * whatever language happens to be active when it is rendered.
 *
 * The tone rules the copy has to keep are in the locale files and in
 * `locales/TRANSLATORS.md`, and `AIInsightPanel.test.tsx` still asserts a
 * banned-words list through the UI — which is now the right level for it, since
 * that is where the words actually are.
 */

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
    // "adjusted" reports, "dropped"/"rose" judges — see the copy, not here.
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
    // The listing stays the subject of this sentence, in every locale. Phrasing
    // it as "comparables trend x% lower" would attach a figure measured against
    // the section average to a sentence about the comparables — off by the ratio
    // between the two. The constraint is restated in TRANSLATORS.md, because it
    // is invisible in the string.
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
