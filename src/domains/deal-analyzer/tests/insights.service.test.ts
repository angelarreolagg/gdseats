import { describe, expect, it } from 'vitest'
import { generateInsights } from '../services/insights.service'
import type { ListingSignals } from '../types/deal.types'

const SIGNALS: ListingSignals = {
  listingPrice: 40_000,
  estimatedPrice: 36_000,
  sectionAverage: 35_000,
  section: 143,
  trend: 'down',
  priceHistory: [
    { date: 'Mar 25', price: 75_000 },
    { date: 'May 28', price: 50_000 },
    { date: 'Jul 22', price: 44_000 },
    { date: 'Jul 27', price: 40_000 },
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
    expect(recent?.text).toMatch(/adjusted down/i)
  })

  /**
   * Validates: the direction word matches which side of the average the listing
   * is on, and the listing stays the sentence's subject.
   * Why it matters: the percentage is measured against the section average, so a
   * sentence about the *comparables* would attach it to the wrong reference point
   * — and flipping "above"/"below" would state the exact opposite of the truth
   * while still looking plausible.
   */
  it('places the listing on the correct side of the section average', () => {
    const above = generateInsights(SIGNALS).find((i) => i.id === 'section-average')
    expect(above?.tone).toBe('caution')
    expect(above?.text).toMatch(/^Sits \d+% above the section 143 average$/)

    const below = generateInsights({ ...SIGNALS, listingPrice: 28_000 }).find(
      (i) => i.id === 'section-average',
    )
    expect(below?.tone).toBe('positive')
    expect(below?.text).toMatch(/^Sits \d+% below the section 143 average$/)
  })

  /**
   * Validates: bullets stay observational.
   * Why it matters: the tone of these three lines is the difference between the
   * panel reading as market context and reading as a warning. Judgmental wording
   * here undercuts the softened badge sitting directly above it.
   */
  it('never uses judgmental wording', () => {
    const banned = /too expensive|bad deal|overpriced|avoid|don't|do not/i

    for (const trend of ['down', 'up', 'flat'] as const) {
      for (const insight of generateInsights({ ...SIGNALS, trend })) {
        expect(insight.text).not.toMatch(banned)
      }
    }
  })

  /**
   * Validates: sparse history degrades instead of crashing.
   * Why it matters: a newly published listing has one price point. The panel
   * still has to render something rather than throw inside the host page.
   */
  it('survives a listing with a single price point', () => {
    const insights = generateInsights({ ...SIGNALS, priceHistory: [{ date: 'Jul 27', price: 40_000 }] })
    expect(insights.length).toBeGreaterThan(0)
    expect(insights.every((insight) => insight.text.length > 0)).toBe(true)
  })
})
