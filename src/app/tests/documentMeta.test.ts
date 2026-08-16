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
  publicationDateMs: Date.UTC(2026, 7, 3),
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

  it('names the team and the venue once a franchise is selected', () => {
    const { title } = getDocumentMeta(TEAM)

    expect(title).toContain('Las Vegas Raiders')
    expect(title).toContain('Allegiant Stadium')
  })

  it('identifies the seats when a listing is open', () => {
    const { title, description } = getDocumentMeta(TEAM, LISTING)

    expect(title).toContain('Section 106')
    expect(title).toContain('Row 39')
    expect(description).toContain('Allegiant Stadium')
  })

  it('leads with the brand only on the default screen', () => {
    expect(getDocumentMeta().title.startsWith('G&D Seats')).toBe(true)
    expect(getDocumentMeta(TEAM).title.startsWith('G&D Seats')).toBe(false)
    expect(getDocumentMeta(TEAM).title.endsWith('G&D Seats')).toBe(true)
    expect(getDocumentMeta(TEAM, LISTING).title.endsWith('G&D Seats')).toBe(true)
  })

  it('keeps every generated description within snippet length', () => {
    for (const team of [TEAM, getTeamById('lac')!, getTeamById('ne')!]) {
      expect(getDocumentMeta(team).description.length).toBeLessThanOrEqual(200)
      expect(getDocumentMeta(team, LISTING).description.length).toBeLessThanOrEqual(200)
    }
  })

  it('ignores a listing that arrives without its team', () => {
    expect(getDocumentMeta(undefined, LISTING).title).toBe(DEFAULT_TITLE)
  })
})
