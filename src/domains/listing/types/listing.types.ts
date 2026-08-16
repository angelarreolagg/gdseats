import type { TagTone } from '@/shared/components/Tag'

/** A plain union, so the generator stays pure; the component resolves the icon. */
export type TagIconName =
  | 'featured'
  | 'this-week'
  | 'parking'
  | 'aisle'
  | 'covered'
  | 'accessible'
  | 'financing'
  | 'price-drop'

export interface ListingTag {
  id: string
  /** A key, never a phrase — same rule as `iconName`. */
  labelKey: string
  /** Interpolation for the one tag that carries a figure ("12% off"). */
  labelParams?: Record<string, string | number>
  tone: TagTone
  iconName: TagIconName
}

/** Richer than the analyzer's signal shape — this is what the detail table shows. */
export interface PriceHistoryEntry {
  /**
   * Epoch ms, not a display string: generated English was untranslatable where it
   * sat. A number rather than ISO because the seeded generator produces it
   * arithmetically; the formatters pin UTC so it never drifts a day.
   */
  dateMs: number
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
  /** Epoch ms — see the note on `PriceHistoryEntry.dateMs`. */
  publicationDateMs: number
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
 * Section average scaled to this listing's seat count. Comparison is per seat —
 * the only unit comparable across sizes — but the buyer offers a total.
 */
export function getSectionAverageTotal(listing: Listing): number {
  return listing.sectionAveragePerSeat * listing.seatCount
}
