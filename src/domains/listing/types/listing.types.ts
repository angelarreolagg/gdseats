import type { TagTone } from '@/shared/components/Tag'

export interface ListingTag {
  id: string
  label: string
  tone: TagTone
  icon: string
}

/** Richer than the analyzer's signal shape — this is what the detail table shows. */
export interface PriceHistoryEntry {
  date: string
  totalPrice: number
  pricePerSeat: number
  /** Signed fraction vs the previous entry; null for the oldest row. */
  changePercent: number | null
}

export interface Listing {
  id: string
  teamId: string
  section: number
  /** Rows are not always numeric — "37A" appears in real inventory. */
  row: string
  seatRange: string
  seatCount: number
  pricePerSeat: number
  transferFee: number
  platformFee: number
  publicationDate: string
  /**
   * Fair value per seat, as the host platform would supply it. The deal-analyzer
   * evaluates this; it never produces it.
   */
  estimatedPricePerSeat: number
  /** Mean price per seat across every listing in the same section. */
  sectionAveragePerSeat: number
  priceHistory: PriceHistoryEntry[]
  tags: ListingTag[]
}

export function getTotalPrice(listing: Listing): number {
  return listing.pricePerSeat * listing.seatCount
}

export function getTotalCost(listing: Listing): number {
  return getTotalPrice(listing) + listing.transferFee + listing.platformFee
}

export function getEstimatedTotal(listing: Listing): number {
  return listing.estimatedPricePerSeat * listing.seatCount
}

/**
 * Section average scaled to this listing's seat count.
 *
 * Comparison happens per seat — that is the only unit comparable across listings
 * of different sizes — but every number the panel shows is a total, because the
 * total is what the buyer actually offers. Scaling here keeps both true at once.
 */
export function getSectionAverageTotal(listing: Listing): number {
  return listing.sectionAveragePerSeat * listing.seatCount
}
