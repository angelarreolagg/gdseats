import { describe, expect, it } from 'vitest'
import { generateListingsForTeam } from '../services/listingGenerator.service'
import { getRingForSection } from '../data/venueLayout'
import { TEAMS, getTeamById } from '@/domains/teams/data/teams'

const TEAM = getTeamById('lv')!

describe('generateListingsForTeam', () => {
  /**
   * Validates: the same team always yields byte-identical inventory.
   * Why it matters: the seat map prints a per-section listing count beside the
   * list it describes. Unseeded generation would re-roll on every render and make
   * that count contradict the rows next to it — a bug that looks like a data
   * problem rather than a rendering one.
   */
  it('is deterministic for a given team', () => {
    expect(generateListingsForTeam(TEAM)).toEqual(generateListingsForTeam(TEAM))
  })

  /**
   * Validates: different teams get different inventory.
   * Why it matters: a seed collision would show every franchise the same seats.
   */
  it('produces distinct inventory per team', () => {
    const raiders = generateListingsForTeam(TEAM)
    const cowboys = generateListingsForTeam(getTeamById('dal')!)
    expect(raiders.map((l) => l.id)).not.toEqual(cowboys.map((l) => l.id))
  })

  /**
   * Validates: sectionAveragePerSeat is the real mean of that section's listings.
   * Why it matters: the panel tells buyers they are "14% above the section
   * average" and the price-stats chart plots the same set. If the average were
   * invented rather than measured, those two would disagree on screen and the
   * insight would be unfalsifiable.
   */
  it('computes section average from the generated set', () => {
    const listings = generateListingsForTeam(TEAM)
    const sample = listings[0]
    const peers = listings.filter((l) => l.section === sample.section)
    const mean = peers.reduce((sum, l) => sum + l.pricePerSeat, 0) / peers.length

    expect(sample.sectionAveragePerSeat).toBe(Math.round(mean))
  })

  /**
   * Validates: no listing can produce a nonsensical price or a divide-by-zero.
   * Why it matters: every price feeds `calculatePercentageDiff`, whose guard
   * assumes a positive estimate.
   */
  it('produces positive prices and estimates throughout', () => {
    for (const listing of generateListingsForTeam(TEAM)) {
      expect(listing.pricePerSeat).toBeGreaterThan(0)
      expect(listing.estimatedPricePerSeat).toBeGreaterThan(0)
      expect(listing.seatCount).toBeGreaterThan(0)
      expect(getRingForSection(listing.section)).toBeDefined()
    }
  })

  /**
   * Validates: the ask spread actually spans all three verdict bands.
   * Why it matters: a demo where every row reads "Fair" would make the whole AI
   * layer look broken. This pins the generator's spread to the product's purpose.
   */
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
