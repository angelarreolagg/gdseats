import { describe, expect, it } from 'vitest'
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

describe('getTrendExplanation', () => {
  /**
   * Validates: the forecast names which way demand is heading.
   * Why it matters: the chip states a conclusion ("Cooling off") without saying
   * what it rests on. This sentence IS the feature now that the chart is gone —
   * if it stopped naming a direction it would be decoration.
   */
  it('states the direction for every trend', () => {
    expect(getTrendExplanation(trendFor('cooling')).forecast).toMatch(/projected to fall/i)
    expect(getTrendExplanation(trendFor('heating')).forecast).toMatch(/projected to rise/i)
    expect(getTrendExplanation(trendFor('steady')).forecast).toMatch(/projected to hold/i)
  })

  /**
   * Validates: forecast and implication are separate strings.
   * Why it matters: the tooltip lays them out as distinct lines. Merged into one
   * paragraph they render as the wall of text this replaced — a single ~750px
   * line that spanned three cards.
   */
  it('separates the observation from what it implies', () => {
    const { forecast, implication } = getTrendExplanation(trendFor('cooling'))

    expect(forecast).not.toContain(implication)
    expect(forecast.endsWith('.')).toBe(true)
    expect(implication.length).toBeGreaterThan(10)
  })

  /**
   * Validates: the horizon is counted from the series, not typed into the string.
   * Why it matters: the copy claims "over the next N months". If that N were
   * hardcoded and the forecast window ever changed, it would keep asserting the
   * old number — a lie the tests would never catch.
   */
  it('derives the horizon from the projected points', () => {
    const trend = trendFor('cooling')
    const projected = trend.series.filter((point) => point.projected).length

    expect(getTrendExplanation(trend).forecast).toContain(`over the next ${projected} months`)
  })

  it('carries the momentum magnitude', () => {
    const trend = trendFor('heating')
    const magnitude = `${Math.round(Math.abs(trend.momentum) * 100)}%`

    expect(getTrendExplanation(trend).forecast).toContain(magnitude)
  })

  /**
   * Validates: the wording stays suggestive, never directive.
   * Why it matters: the analyzer panel two screens later was deliberately
   * softened away from "Wait" and "Buy now" because directives frame a
   * five-figure purchase as a gate. The same buyer reads this chip; one voice.
   */
  it('never tells the buyer what to do', () => {
    const banned = /\b(wait|buy now|don't|do not|avoid|should)\b/i

    for (const direction of ['cooling', 'heating', 'steady'] as const) {
      const { forecast, implication } = getTrendExplanation(trendFor(direction))
      expect(forecast).not.toMatch(banned)
      expect(implication).not.toMatch(banned)
    }
  })

  it('produces both sentences for every team in the catalogue', () => {
    for (const team of TEAMS) {
      const { forecast, implication } = getTrendExplanation(getMarketTrend(team, NOW))

      for (const line of [forecast, implication]) {
        expect(line.length).toBeGreaterThan(10)
        expect(line).not.toContain('undefined')
        expect(line).not.toContain('NaN')
      }
    }
  })

  it('has an icon for every direction', () => {
    for (const direction of ['cooling', 'heating', 'steady'] as const) {
      expect(TREND_ICON[direction]).toBeDefined()
    }
  })
})
