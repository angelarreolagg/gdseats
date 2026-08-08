import { describe, expect, it } from 'vitest'
import { getDocumentMeta } from '../documentMeta'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@/shared/config/site'
import { getTeamById } from '@/domains/teams/data/teams'
import type { Listing } from '@/domains/listing/types/listing.types'

const TEAM = getTeamById('lv')!

const LISTING: Listing = {
  id: 'HUUS06',
  teamId: 'lv',
  section: 106,
  row: '39',
  seatRange: '14-15',
  seatCount: 2,
  pricePerSeat: 11_775,
  transferFee: 225,
  platformFee: 2_350,
  publicationDate: 'Aug 3, 2026',
  estimatedPricePerSeat: 14_500,
  sectionAveragePerSeat: 13_000,
  priceHistory: [],
  tags: [],
}

describe('getDocumentMeta', () => {
  it('falls back to the site defaults on the teams grid', () => {
    expect(getDocumentMeta()).toEqual({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    })
  })

  /**
   * Validates: a selected franchise names both the team and the building.
   * Why it matters: a seat licence is bought for a venue as much as for a team —
   * the same reason venue is searchable in `TeamSearchCombobox`. Two franchises
   * share MetLife and two share SoFi, so the venue is what makes the title
   * useful rather than decorative.
   */
  it('names the team and the venue once a franchise is selected', () => {
    const { title } = getDocumentMeta(TEAM)

    expect(title).toContain('Las Vegas Raiders')
    expect(title).toContain('Allegiant Stadium')
  })

  /**
   * Validates: the open listing identifies the actual seats.
   * Why it matters: this is the deepest screen and the one worth bookmarking.
   * "Section 106, Row 39" is what a buyer comparing three tabs reads to tell them
   * apart; the franchise name alone would make all three identical.
   */
  it('identifies the seats when a listing is open', () => {
    const { title, description } = getDocumentMeta(TEAM, LISTING)

    expect(title).toContain('Section 106')
    expect(title).toContain('Row 39')
    expect(description).toContain('Allegiant Stadium')
  })

  /**
   * Validates: the brand trails on the deeper screens and leads on the entry one.
   * Why it matters: a tab strip truncates from the right. Leading every title
   * with "G&D Seats" would render three open tabs as three identical stubs, which
   * is the exact problem this function exists to fix.
   */
  it('leads with the brand only on the default screen', () => {
    expect(getDocumentMeta().title.startsWith('G&D Seats')).toBe(true)
    expect(getDocumentMeta(TEAM).title.startsWith('G&D Seats')).toBe(false)
    expect(getDocumentMeta(TEAM).title.endsWith('G&D Seats')).toBe(true)
    expect(getDocumentMeta(TEAM, LISTING).title.endsWith('G&D Seats')).toBe(true)
  })

  /**
   * Validates: a description never runs past what a search snippet shows.
   * Why it matters: Google cuts the snippet near 160 characters. A description
   * built from a long franchise and venue name that overruns gets truncated
   * mid-clause, which reads as a broken page rather than a long one.
   */
  it('keeps every generated description within snippet length', () => {
    for (const team of [TEAM, getTeamById('lac')!, getTeamById('ne')!]) {
      expect(getDocumentMeta(team).description.length).toBeLessThanOrEqual(200)
      expect(getDocumentMeta(team, LISTING).description.length).toBeLessThanOrEqual(200)
    }
  })

  /**
   * Validates: a listing with no team falls back rather than half-rendering.
   * Why it matters: `App` derives `team` and `openListing` independently. During
   * a transition it is briefly possible to hold one without the other, and a
   * title reading "Section 106, Row 39 — undefined PSL" would ship straight to
   * the tab.
   */
  it('ignores a listing that arrives without its team', () => {
    expect(getDocumentMeta(undefined, LISTING).title).toBe(DEFAULT_TITLE)
  })
})
