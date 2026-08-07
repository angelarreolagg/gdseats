import { motion } from 'motion/react'
import { Tag } from '@/shared/components/Tag'
import { formatCurrency, formatSignedPercent } from '@/shared/utils/formatters'
import { DealBadge } from '@/domains/deal-analyzer/components/DealBadge'
import { evaluateDeal } from '@/domains/deal-analyzer/services/pricing.service'
import type { Listing } from '@/domains/listing/types/listing.types'
import {
  getEstimatedTotal,
  getTotalCost,
  getTotalPrice,
} from '@/domains/listing/types/listing.types'

interface ListingRowProps {
  listing: Listing
  onOpen: (listingId: string) => void
}

export function ListingRow({ listing, onOpen }: ListingRowProps) {
  // Same service the detail panel calls — the verdict cannot drift between the
  // list and the page it opens.
  const verdict = evaluateDeal(getTotalPrice(listing), getEstimatedTotal(listing))

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(listing.id)}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="w-full border-b border-border-hairline px-5 py-4 text-left transition-colors hover:bg-track"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold tracking-tight text-ink">
          Section {listing.section}, Row {listing.row}, {listing.seatRange}
        </span>
        <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {formatCurrency(listing.pricePerSeat)}/seat
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-4">
        <span className="text-xs text-muted">
          ID: {listing.id} · {listing.seatCount} seats
        </span>
        <span className="shrink-0 text-xs text-muted underline decoration-border-hairline underline-offset-4 tabular-nums">
          {formatCurrency(getTotalCost(listing))} total, incl. fees
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DealBadge
          status={verdict.status}
          formattedDiff={formatSignedPercent(verdict.percentageDiff)}
        />
        {listing.tags.map((tag) => (
          <Tag key={tag.id} tone={tag.tone} icon={tag.icon}>
            {tag.label}
          </Tag>
        ))}
      </div>
    </motion.button>
  )
}
