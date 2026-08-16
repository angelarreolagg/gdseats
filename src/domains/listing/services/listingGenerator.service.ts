import { createRandom } from '@/shared/utils/seededRandom'
import type { Team } from '@/domains/teams/types/team.types'
import { getListingCountForTeam } from '@/domains/teams/data/teams'
import type { Listing, ListingTag, PriceHistoryEntry } from '../types/listing.types'
import { ALL_SECTIONS, getRingForSection, getSidelineMultiplier } from '../data/venueLayout'

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'

/**
 * The window inventory is published in, as month indices — March to August 2026.
 *
 * Indices rather than the `['Mar', 'Apr', …]` array this replaced: those were
 * English display strings baked into the data, which is where a date becomes
 * untranslatable. `Date.UTC` turns an index into the epoch ms the type now
 * carries, and the formatters decide what a reader sees.
 */
const FIRST_MONTH_INDEX = 2
const LAST_MONTH_INDEX = 7
const PUBLICATION_YEAR = 2026

const AMENITY_TAGS: ListingTag[] = [
  { id: 'parking', labelKey: 'listing:tags.parking', tone: 'neutral', iconName: 'parking' },
  { id: 'aisle', labelKey: 'listing:tags.aisle', tone: 'neutral', iconName: 'aisle' },
  { id: 'covered', labelKey: 'listing:tags.covered', tone: 'neutral', iconName: 'covered' },
  {
    id: 'accessible',
    labelKey: 'listing:tags.accessible',
    tone: 'neutral',
    iconName: 'accessible',
  },
  { id: 'financing', labelKey: 'listing:tags.financing', tone: 'neutral', iconName: 'financing' },
]

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * One team's inventory, generated from a seed keyed on the team id.
 *
 * Seeded rather than random: the seat map shows a per-section count beside the
 * list, and an unseeded set would reshuffle on every render and make those counts
 * disagree with the rows they describe.
 */
export function generateListingsForTeam(team: Team): Listing[] {
  const random = createRandom(`listings:${team.id}`)
  const drafts: Array<Omit<Listing, 'sectionAveragePerSeat'>> = []
  const count = getListingCountForTeam(team)

  for (let index = 0; index < count; index += 1) {
    const section = random.pick(ALL_SECTIONS)
    const ring = getRingForSection(section)
    const seatCount = random.pick([2, 2, 2, 3, 4, 4, 5, 6])

    // Fair value: what the seat is worth on its tier and position alone.
    const fairPerSeat = roundTo(
      team.basePricePerSeat *
        (ring?.priceMultiplier ?? 1) *
        getSidelineMultiplier(section) *
        random.float(0.94, 1.06),
      25,
    )

    // What the seller is actually asking. The spread is centred on 1.0 on purpose:
    // an asymmetric range skews the whole market to one verdict, and a demo where
    // most rows read "Overpriced" undersells the thing being demoed. Uniform
    // ±22% against a ±10% fair band gives roughly 27/45/27.
    const askPerSeat = roundTo(fairPerSeat * random.float(0.78, 1.22), 25)

    const id = Array.from({ length: 6 }, () => random.pick(ID_ALPHABET.split(''))).join('')
    const rowNumber = random.int(1, 42)
    const row = random.chance(0.12) ? `${rowNumber}A` : String(rowNumber)
    const firstSeat = random.int(1, 20)

    drafts.push({
      id,
      teamId: team.id,
      section,
      row,
      seatRange: `${firstSeat}-${firstSeat + seatCount - 1}`,
      seatCount,
      pricePerSeat: askPerSeat,
      transferFee: roundTo(askPerSeat * seatCount * 0.01, 25),
      platformFee: roundTo(askPerSeat * seatCount * 0.1, 25),
      publicationDateMs: Date.UTC(
        PUBLICATION_YEAR,
        random.int(FIRST_MONTH_INDEX, LAST_MONTH_INDEX),
        random.int(1, 28),
      ),
      estimatedPricePerSeat: fairPerSeat,
      priceHistory: buildPriceHistory(random, askPerSeat, seatCount),
      tags: buildTags(random, askPerSeat, fairPerSeat),
    })
  }

  // Section average is measured across the generated set rather than invented, so
  // the insight bullet and the price-stats chart describe the same real numbers.
  const totalsBySection = new Map<number, number[]>()
  for (const draft of drafts) {
    const bucket = totalsBySection.get(draft.section) ?? []
    bucket.push(draft.pricePerSeat)
    totalsBySection.set(draft.section, bucket)
  }

  return drafts.map((draft) => {
    const prices = totalsBySection.get(draft.section) ?? [draft.pricePerSeat]
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
    return { ...draft, sectionAveragePerSeat: Math.round(mean) }
  })
}

function buildPriceHistory(
  random: ReturnType<typeof createRandom>,
  currentPerSeat: number,
  seatCount: number,
): PriceHistoryEntry[] {
  const steps = random.int(1, 5)
  const perSeat = [currentPerSeat]

  // Walk backwards from today's ask so the newest row lands on the live price.
  for (let index = 0; index < steps; index += 1) {
    const previous = perSeat[0] * random.float(1.02, 1.22)
    perSeat.unshift(roundTo(previous, 25))
  }

  return perSeat.map((price, index) => {
    const previous = index > 0 ? perSeat[index - 1] : null
    return {
      // Walks forward a month per revision and then holds at the last one, so a
      // long history stays inside the publication window rather than running off
      // the end of the season.
      dateMs: Date.UTC(
        PUBLICATION_YEAR,
        Math.min(FIRST_MONTH_INDEX + index + 1, LAST_MONTH_INDEX),
        random.int(1, 28),
      ),
      totalPrice: price * seatCount,
      pricePerSeat: price,
      changePercent: previous === null ? null : (price - previous) / previous,
    }
  })
}

function buildTags(
  random: ReturnType<typeof createRandom>,
  askPerSeat: number,
  fairPerSeat: number,
): ListingTag[] {
  const tags: ListingTag[] = []

  if (random.chance(0.55)) {
    tags.push({
      id: 'featured',
      labelKey: 'listing:tags.featured',
      tone: 'accent',
      iconName: 'featured',
    })
  }
  if (random.chance(0.25)) {
    tags.push({
      id: 'this-week',
      labelKey: 'listing:tags.thisWeek',
      tone: 'info',
      iconName: 'this-week',
    })
  }

  for (const amenity of AMENITY_TAGS) {
    if (random.chance(0.28)) tags.push(amenity)
  }

  // A visible price cut is a signal, not an amenity, so it keeps a semantic colour.
  // Direction convention: the number went DOWN, so it reads red — the same rule the
  // price-history Change column follows. The verdict badge beside it is what tells
  // the buyer whether that is good news.
  const discount = (fairPerSeat - askPerSeat) / fairPerSeat
  if (discount > 0.08) {
    tags.push({
      id: 'price-drop',
      labelKey: 'listing:tags.priceDrop',
      labelParams: { percent: Math.round(discount * 100) },
      tone: 'critical',
      iconName: 'price-drop',
    })
  }

  return tags
}
