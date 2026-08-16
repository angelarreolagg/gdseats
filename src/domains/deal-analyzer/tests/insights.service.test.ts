import { describe, expect, it } from 'vitest'
import { generateInsights } from '../services/insights.service'
import type { ListingSignals } from '../types/deal.types'

/**
 * These assertions moved from prose to `{ key, params }` when the service
 * stopped building sentences.
 *
 * That is a strict improvement rather than a loss of coverage: what these tests
 * were ever really checking is the *decision* — which bullet, which tone, which
 * side of the average — and matching on a key states that directly instead of
 * inferring it from an English word that a copy edit could change.
 *
 * The one thing that genuinely moved out is the banned-words guard. Words live
 * in the locale bundles now, so `AIInsightPanel.test.tsx` — which renders — is
 * where the tone is checked, and it is the right level: it tests the words a
 * buyer actually reads rather than the ones a service happens to hold.
 */
const SIGNALS: ListingSignals = {
  listingPrice: 40_000,
  estimatedPrice: 36_000,
  sectionAverage: 35_000,
  section: 143,
  trend: 'down',
  priceHistory: [
    { dateMs: Date.UTC(2026, 2, 25), price: 75_000 },
    { dateMs: Date.UTC(2026, 4, 28), price: 50_000 },
    { dateMs: Date.UTC(2026, 6, 22), price: 44_000 },
    { dateMs: Date.UTC(2026, 6, 27), price: 40_000 },
  ],
}

describe('generateInsights', () => {
  /**
   * Validates: the panel never receives more bullets than it has room for.
   * Why it matters: the widget lives in a fixed ~330px slot beside the host's
   * offer box. An unbounded list would push past its neighbour and break the
   * embed, which is the one hard layout constraint of this feature.
   */
  it('returns at most three insights', () => {
    expect(generateInsights(SIGNALS).length).toBeLessThanOrEqual(3)
    expect(generateInsights(SIGNALS).length).toBeGreaterThanOrEqual(2)
  })

  /**
   * Validates: the strongest signal is shown first.
   * Why it matters: with room for three bullets out of everything we could say,
   * ordering *is* the editorial decision. Burying a 47% price collapse under a
   * 2% note would waste the panel's only chance to be useful.
   */
  it('ranks insights by magnitude, strongest first', () => {
    const weights = generateInsights(SIGNALS).map((insight) => insight.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
  })

  /**
   * Validates: tone matches the buyer's interest, not the price direction.
   * Why it matters: a falling ask is good news for a buyer. Marking it as a
   * caution would contradict the recommendation shown directly above it.
   */
  it('reads a falling price as positive for the buyer', () => {
    const recent = generateInsights(SIGNALS).find((i) => i.id === 'recent-movement')
    expect(recent?.tone).toBe('positive')
    expect(recent?.key).toBe('analyzer:insights.recentMovement.down')
  })

  /**
   * Validates: the direction matches which side of the average the listing is on.
   * Why it matters: the percentage is measured against the section average, so
   * picking the wrong key states the exact opposite of the truth while still
   * looking plausible on screen. The sentence's *subject* — the listing, never
   * the comparables — is a copy constraint and is guarded in the locale files
   * and in TRANSLATORS.md; this guards the choice between them.
   */
  it('places the listing on the correct side of the section average', () => {
    const above = generateInsights(SIGNALS).find((i) => i.id === 'section-average')
    expect(above?.tone).toBe('caution')
    expect(above?.key).toBe('analyzer:insights.sectionAverage.above')
    expect(above?.params.section).toBe(143)

    const below = generateInsights({ ...SIGNALS, listingPrice: 28_000 }).find(
      (i) => i.id === 'section-average',
    )
    expect(below?.tone).toBe('positive')
    expect(below?.key).toBe('analyzer:insights.sectionAverage.below')
  })

  /**
   * Validates: params carry raw values, never pre-formatted strings.
   * Why it matters: this is what makes an insight locale-independent. If the
   * service formatted `$40,000` or "Jul 27" here, an insight computed before a
   * language switch would keep rendering the old locale's punctuation inside a
   * translated sentence — and the service would be back to importing the
   * formatters it was separated from.
   */
  it('emits raw numbers and epoch ms rather than formatted text', () => {
    for (const insight of generateInsights(SIGNALS)) {
      for (const value of Object.values(insight.params)) {
        expect(typeof value).toBe('number')
      }
    }

    const trend = generateInsights(SIGNALS).find((i) => i.id === 'trend')
    expect(trend?.params.dateMs).toBe(Date.UTC(2026, 2, 25))
    expect(trend?.params.price).toBe(75_000)
  })

  /**
   * Validates: the revision count crosses over as `count`.
   * Why it matters: `count` is what i18next selects a plural form with. Passed
   * under any other name the sentence still renders — with the wrong grammar in
   * English and Spanish, and with a missing number everywhere.
   */
  it('passes the revision count as `count` so plurals can resolve', () => {
    const trend = generateInsights(SIGNALS).find((i) => i.id === 'trend')
    expect(trend?.key).toBe('analyzer:insights.trend.down')
    expect(trend?.params.count).toBe(3)
  })

  /**
   * Validates: sparse history degrades instead of crashing.
   * Why it matters: a newly published listing has one price point. The panel
   * still has to render something rather than throw inside the host page.
   */
  it('survives a listing with a single price point', () => {
    const insights = generateInsights({
      ...SIGNALS,
      priceHistory: [{ dateMs: Date.UTC(2026, 6, 27), price: 40_000 }],
    })
    expect(insights.length).toBeGreaterThan(0)
    expect(insights.every((insight) => insight.key.length > 0)).toBe(true)
  })
})
