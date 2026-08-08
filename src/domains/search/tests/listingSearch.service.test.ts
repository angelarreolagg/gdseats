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
  /**
   * Validates: selecting a section on the map narrows the list to exactly that
   * section.
   * Why it matters: the map and the list are the same query shown two ways. A
   * leaky filter would show a buyer seats they did not ask for while the map
   * claims otherwise.
   */
  it('returns only listings in the chosen section', () => {
    const section = LISTINGS[0].section
    const filtered = filterBySection(LISTINGS, section)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((listing) => listing.section === section)).toBe(true)
  })

  /**
   * Validates: clearing the filter restores the full set.
   * Why it matters: "Clear all" that silently drops inventory would hide sellable
   * listings with no visible error.
   */
  it('returns everything when no section is selected', () => {
    expect(filterBySection(LISTINGS, null)).toHaveLength(LISTINGS.length)
  })

  it('returns an empty list for a section with no inventory', () => {
    expect(filterBySection(LISTINGS, 99_999)).toHaveLength(0)
  })
})

describe('sortListings', () => {
  /**
   * Validates: "Best deal" orders by how far under fair value each listing sits.
   * Why it matters: this is the one sort that only exists because the verdict is
   * computed for every row. If it were not strictly ascending by difference, the
   * headline feature of the search page would be quietly lying.
   */
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

  /**
   * Validates: sorting never adds, drops, or mutates the input.
   * Why it matters: an in-place sort would reorder the array the seat map counts
   * were derived from, and React would not re-render to match.
   */
  it('does not mutate the input array', () => {
    const before = LISTINGS.map((l) => l.id)
    sortListings(LISTINGS, 'price-desc')

    expect(LISTINGS.map((l) => l.id)).toEqual(before)
    expect(sortListings(LISTINGS, 'section')).toHaveLength(LISTINGS.length)
  })
})

describe('countBySection', () => {
  /**
   * Validates: the map's per-section badge equals the number of rows the filter
   * will actually produce.
   * Why it matters: a section labelled "12 listings" that opens to 9 destroys
   * trust in the map, which is the primary navigation of the search page.
   */
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
