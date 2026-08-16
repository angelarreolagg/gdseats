import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import { TREND_ICON, getTrendExplanation } from '../components/trendPresentation'
import { getMarketTrend } from '../services/marketTrend.service'
import { TEAMS } from '../data/teams'
import type { MarketTrend } from '../types/team.types'

const NOW = new Date('2026-08-07')

function trendFor(direction: MarketTrend['direction']): MarketTrend {
  const match = TEAMS.map((team) => getMarketTrend(team, NOW)).find(
    (trend) => trend.direction === direction,
  )
  if (!match) throw new Error(`no ${direction} team in the catalogue`)
  return match
}

/**
 * Resolve an explanation the way `TrendChip` does.
 *
 * The presentation layer returns keys plus a counted horizon now, so half of
 * these tests check the mapping (which key, what horizon) and half check the
 * copy those keys land on. Rendering through `t()` here is what keeps the second
 * half meaningful: a key that exists and a key that resolves to a sentence are
 * different things, and only one of them reaches a buyer.
 */
function explain(trend: MarketTrend) {
  const { forecastKey, implicationKey, months, momentum } = getTrendExplanation(trend)
  return {
    months,
    forecast: i18n.t(forecastKey, {
      count: months,
      magnitude: `${Math.round(Math.abs(momentum) * 100)}%`,
    }),
    implication: i18n.t(implicationKey),
  }
}

describe('getTrendExplanation', () => {
  /**
   * Validates: the forecast names which way demand is heading.
   * Why it matters: the chip states a conclusion ("Cooling off") without saying
   * what it rests on. This sentence IS the feature now that the chart is gone —
   * if it stopped naming a direction it would be decoration.
   */
  it('states the direction for every trend', () => {
    expect(explain(trendFor('cooling')).forecast).toMatch(/projected to fall/i)
    expect(explain(trendFor('heating')).forecast).toMatch(/projected to rise/i)
    expect(explain(trendFor('steady')).forecast).toMatch(/projected to hold/i)
  })

  /**
   * Validates: the two ideas are addressed by two different keys.
   * Why it matters: the tooltip lays them out as distinct lines. Collapsed into
   * one key they render as the wall of text this replaced — a single ~750px line
   * that spanned three cards.
   */
  it('separates the observation from what it implies', () => {
    const trend = trendFor('cooling')
    const { forecastKey, implicationKey } = getTrendExplanation(trend)
    expect(forecastKey).not.toBe(implicationKey)

    const { forecast, implication } = explain(trend)
    expect(forecast).not.toContain(implication)
    expect(forecast.endsWith('.')).toBe(true)
    expect(implication.length).toBeGreaterThan(10)
  })

  /**
   * Validates: the horizon is counted from the series, not typed into the string.
   * Why it matters: the copy claims "over the next N months". If that N were
   * hardcoded and the forecast window ever changed, it would keep asserting the
   * old number — a lie the tests would never catch. It travels as `count`, which
   * is also what selects the plural form, so one value serves both.
   */
  it('derives the horizon from the projected points', () => {
    const trend = trendFor('cooling')
    const projected = trend.series.filter((point) => point.projected).length

    expect(getTrendExplanation(trend).months).toBe(projected)
    expect(explain(trend).forecast).toContain(`over the next ${projected} months`)
  })

  it('carries the momentum magnitude', () => {
    const trend = trendFor('heating')
    const magnitude = `${Math.round(Math.abs(trend.momentum) * 100)}%`

    expect(getTrendExplanation(trend).momentum).toBe(trend.momentum)
    expect(explain(trend).forecast).toContain(magnitude)
  })

  /**
   * Validates: the wording stays suggestive, never directive.
   * Why it matters: the analyzer panel two screens later was deliberately
   * softened away from "Wait" and "Buy now" because directives frame a
   * five-figure purchase as a gate. The same buyer reads this chip; one voice.
   *
   * Scoped to `en`, and deliberately so — the list is English words, and
   * inventing equivalents for three other languages with no native reviewer
   * would be theatre. `locales/TRANSLATORS.md` carries the rule for the rest.
   */
  it('never tells the buyer what to do', () => {
    const banned = /\b(wait|buy now|don't|do not|avoid|should)\b/i

    for (const direction of ['cooling', 'heating', 'steady'] as const) {
      const { forecast, implication } = explain(trendFor(direction))
      expect(forecast).not.toMatch(banned)
      expect(implication).not.toMatch(banned)
    }
  })

  /**
   * Validates: every team resolves to real sentences, with nothing missing.
   * Why it matters: a key that has no entry renders as the raw dotted path, and
   * a param the copy forgot renders as a hole where a number should be. Both
   * look like a broken product to a visitor and like nothing at all to a
   * developer reading the service.
   */
  it('produces both sentences for every team in the catalogue', () => {
    for (const team of TEAMS) {
      const { forecast, implication } = explain(getMarketTrend(team, NOW))

      for (const line of [forecast, implication]) {
        expect(line.length).toBeGreaterThan(10)
        expect(line).not.toContain('undefined')
        expect(line).not.toContain('NaN')
        expect(line).not.toContain('{{')
        expect(line).not.toContain('teams:trend')
      }
    }
  })

  it('has an icon for every direction', () => {
    for (const direction of ['cooling', 'heating', 'steady'] as const) {
      expect(TREND_ICON[direction]).toBeDefined()
    }
  })
})
