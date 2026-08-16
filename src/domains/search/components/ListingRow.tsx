import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
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
import { TAG_PRESENTATION } from '@/domains/listing/components/tagPresentation'

interface ListingRowProps {
  listing: Listing
  onOpen: (listingId: string) => void
}

export function ListingRow({ listing, onOpen }: ListingRowProps) {
  const { t } = useTranslation(['search', 'listing'])
  // Same service the detail panel calls, so the verdict cannot drift.
  const verdict = evaluateDeal(getTotalPrice(listing), getEstimatedTotal(listing))

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(listing.id)}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      // Lets the browser skip rendering — and animating — off-screen rows; without
      // it ~170 holo chips spin at once. `contain-intrinsic-size` keeps the
      // scrollbar honest meanwhile.
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 116px' }}
      className="w-full border-b border-border-hairline px-5 py-4 text-left transition-colors hover:bg-track"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold tracking-tight text-ink">
          {t('search:row.location', {
            section: listing.section,
            row: listing.row,
            seatRange: listing.seatRange,
          })}
        </span>
        <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {t('search:row.pricePerSeat', { price: formatCurrency(listing.pricePerSeat) })}
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-4">
        <span className="text-xs text-muted">
          {t('search:row.identity', { id: listing.id, count: listing.seatCount })}
        </span>
        <span className="shrink-0 text-xs text-muted underline decoration-border-hairline underline-offset-4 tabular-nums">
          {t('search:row.totalInclFees', { total: formatCurrency(getTotalCost(listing)) })}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DealBadge
          status={verdict.status}
          formattedDiff={formatSignedPercent(verdict.percentageDiff)}
        />
        {listing.tags.map((tag) => {
          const { Icon, tooltipKey } = TAG_PRESENTATION[tag.iconName]
          return (
            <Tag key={tag.id} tone={tag.tone} icon={Icon} tooltip={t(tooltipKey)}>
              {t(tag.labelKey, tag.labelParams)}
            </Tag>
          )
        })}
      </div>
    </motion.button>
  )
}
