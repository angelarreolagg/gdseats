import { describe, expect, it } from 'vitest'
import {
  countBySection,
  filterBySection,
  getListingDiff,
  sortListings,
} from '../services/listingSearch.service'
import { generateListingsForTeam } from '@/domains/listing/services/listingGenerator.service'
import { getTeamById } from '@/domains/teams/data/teams'

const LISTINGS = generateListingsForTeam(getTeamById('lv')!)

describe('filterBySection', () => {
  it('returns only listings in the chosen section', () => {
    const section = LISTINGS[0].section
    const filtered = filterBySection(LISTINGS, section)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((listing) => listing.section === section)).toBe(true)
  })

  it('returns everything when no section is selected', () => {
    expect(filterBySection(LISTINGS, null)).toHaveLength(LISTINGS.length)
  })

  it('returns an empty list for a section with no inventory', () => {
    expect(filterBySection(LISTINGS, 99_999)).toHaveLength(0)
  })
})

describe('sortListings', () => {
  it('sorts Best deal ascending by percentage difference', () => {
    const diffs = sortListings(LISTINGS, 'best-deal').map(getListingDiff)
    expect(diffs).toEqual([...diffs].sort((a, b) => a - b))
  })

  it('sorts by price in both directions', () => {
    const asc = sortListings(LISTINGS, 'price-asc').map((l) => l.pricePerSeat)
    const desc = sortListings(LISTINGS, 'price-desc').map((l) => l.pricePerSeat)

    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
  })

  it('does not mutate the input array', () => {
    const before = LISTINGS.map((l) => l.id)
    sortListings(LISTINGS, 'price-desc')

    expect(LISTINGS.map((l) => l.id)).toEqual(before)
    expect(sortListings(LISTINGS, 'section')).toHaveLength(LISTINGS.length)
  })
})

describe('countBySection', () => {
  it('counts match what the filter returns', () => {
    const counts = countBySection(LISTINGS)

    for (const [section, count] of counts) {
      expect(filterBySection(LISTINGS, section)).toHaveLength(count)
    }
  })

  it('totals to the full inventory', () => {
    const total = [...countBySection(LISTINGS).values()].reduce((sum, n) => sum + n, 0)
    expect(total).toBe(LISTINGS.length)
  })
})
