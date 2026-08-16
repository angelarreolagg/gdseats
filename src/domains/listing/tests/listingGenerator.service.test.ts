import { describe, expect, it } from 'vitest'
import { generateListingsForTeam } from '../services/listingGenerator.service'
import { getRingForSection } from '../data/venueLayout'
import { TEAMS, getTeamById } from '@/domains/teams/data/teams'

const TEAM = getTeamById('lv')!

describe('generateListingsForTeam', () => {
  it('is deterministic for a given team', () => {
    expect(generateListingsForTeam(TEAM)).toEqual(generateListingsForTeam(TEAM))
  })

  it('produces distinct inventory per team', () => {
    const raiders = generateListingsForTeam(TEAM)
    const cowboys = generateListingsForTeam(getTeamById('dal')!)
    expect(raiders.map((l) => l.id)).not.toEqual(cowboys.map((l) => l.id))
  })

  it('computes section average from the generated set', () => {
    const listings = generateListingsForTeam(TEAM)
    const sample = listings[0]
    const peers = listings.filter((l) => l.section === sample.section)
    const mean = peers.reduce((sum, l) => sum + l.pricePerSeat, 0) / peers.length

    expect(sample.sectionAveragePerSeat).toBe(Math.round(mean))
  })

  it('produces positive prices and estimates throughout', () => {
    for (const listing of generateListingsForTeam(TEAM)) {
      expect(listing.pricePerSeat).toBeGreaterThan(0)
      expect(listing.estimatedPricePerSeat).toBeGreaterThan(0)
      expect(listing.seatCount).toBeGreaterThan(0)
      expect(getRingForSection(listing.section)).toBeDefined()
    }
  })

  it('yields a mix of undervalued, fair, and overpriced listings', () => {
    const listings = generateListingsForTeam(TEAM)
    const diffs = listings.map(
      (l) => (l.pricePerSeat - l.estimatedPricePerSeat) / l.estimatedPricePerSeat,
    )

    expect(diffs.some((d) => d < -0.1)).toBe(true)
    expect(diffs.some((d) => d >= -0.1 && d <= 0.1)).toBe(true)
    expect(diffs.some((d) => d > 0.1)).toBe(true)
  })

  it('covers every team in the catalogue without throwing', () => {
    for (const team of TEAMS) {
      expect(generateListingsForTeam(team).length).toBeGreaterThan(0)
    }
  })
})
