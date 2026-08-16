import { evaluateDeal } from '@/domains/deal-analyzer/services/pricing.service'
import type { Listing } from '@/domains/listing/types/listing.types'
import { getEstimatedTotal, getTotalPrice } from '@/domains/listing/types/listing.types'

export type SortKey = 'best-deal' | 'price-asc' | 'price-desc' | 'section'

/** Owns the values and their order; only the words moved to the bundle. */
export const SORT_OPTIONS: Array<{ value: SortKey; labelKey: string }> = [
  { value: 'best-deal', labelKey: 'search:sort.bestDeal' },
  { value: 'price-asc', labelKey: 'search:sort.priceAsc' },
  { value: 'price-desc', labelKey: 'search:sort.priceDesc' },
  { value: 'section', labelKey: 'search:sort.section' },
]

/** How far under fair value a listing sits. Negative is a bargain. */
export function getListingDiff(listing: Listing): number {
  return evaluateDeal(getTotalPrice(listing), getEstimatedTotal(listing)).percentageDiff
}

export function filterBySection(listings: Listing[], section: number | null): Listing[] {
  if (section === null) return listings
  return listings.filter((listing) => listing.section === section)
}

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const sorted = [...listings]

  switch (sort) {
    case 'best-deal':
      // Ascending, so the most undervalued listing leads — the payoff of computing
      // the verdict for every row.
      return sorted.sort((a, b) => getListingDiff(a) - getListingDiff(b))
    case 'price-asc':
      return sorted.sort((a, b) => a.pricePerSeat - b.pricePerSeat)
    case 'price-desc':
      return sorted.sort((a, b) => b.pricePerSeat - a.pricePerSeat)
    case 'section':
      return sorted.sort((a, b) => a.section - b.section)
  }
}

export function countBySection(listings: Listing[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const listing of listings) {
    counts.set(listing.section, (counts.get(listing.section) ?? 0) + 1)
  }
  return counts
}
