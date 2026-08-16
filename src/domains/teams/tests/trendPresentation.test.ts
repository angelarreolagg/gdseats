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
  it('states the direction for every trend', () => {
    expect(explain(trendFor('cooling')).forecast).toMatch(/projected to fall/i)
    expect(explain(trendFor('heating')).forecast).toMatch(/projected to rise/i)
    expect(explain(trendFor('steady')).forecast).toMatch(/projected to hold/i)
  })

  it('separates the observation from what it implies', () => {
    const trend = trendFor('cooling')
    const { forecastKey, implicationKey } = getTrendExplanation(trend)
    expect(forecastKey).not.toBe(implicationKey)

    const { forecast, implication } = explain(trend)
    expect(forecast).not.toContain(implication)
    expect(forecast.endsWith('.')).toBe(true)
    expect(implication.length).toBeGreaterThan(10)
  })

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

  it('never tells the buyer what to do', () => {
    const banned = /\b(wait|buy now|don't|do not|avoid|should)\b/i

    for (const direction of ['cooling', 'heating', 'steady'] as const) {
      const { forecast, implication } = explain(trendFor(direction))
      expect(forecast).not.toMatch(banned)
      expect(implication).not.toMatch(banned)
    }
  })

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
