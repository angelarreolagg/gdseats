import type { ReactNode } from 'react'
import { Tag } from '@/shared/components/Tag'
import { Tooltip } from '@/shared/components/Tooltip'
import { formatCurrency } from '@/shared/utils/formatters'
import { TeamLogo } from '@/domains/teams/components/TeamLogo'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '../types/listing.types'
import { getTotalCost, getTotalPrice } from '../types/listing.types'
import { TAG_PRESENTATION } from './tagPresentation'

interface ListingSummaryCardProps {
  listing: Listing
  team: Team
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-hairline px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function BreakdownRow({ label, value, total = false }: {
  label: string
  value: number
  total?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-6 py-1.5 text-xs ${
        total ? 'mt-1 border-t border-border-hairline pt-2 font-semibold text-ink' : 'text-muted'
      }`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${total ? 'text-ink' : 'text-ink'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

/**
 * The cost breakdown is a hover/focus tooltip, so it never fires on touch. That is
 * acceptable only because every figure in it also appears as a visible row in
 * MakeAnOfferCard directly below — the tooltip is a shortcut, not the sole path.
 */
function TotalCostValue({ listing }: { listing: Listing }) {
  return (
    <Tooltip
      side="bottom"
      variant="panel"
      content={
        <div className="w-52">
          <p className="mb-1.5 text-center text-xs font-semibold text-ink">Price breakdown</p>
          <BreakdownRow label="License price" value={getTotalPrice(listing)} />
          <BreakdownRow label="Transfer fee" value={listing.transferFee} />
          <BreakdownRow label="Platform fee" value={listing.platformFee} />
          <BreakdownRow label="Total" value={getTotalCost(listing)} total />
        </div>
      }
    >
      <button
        type="button"
        className="rounded underline decoration-border-hairline underline-offset-4 transition-colors hover:decoration-accent-ink"
      >
        {formatCurrency(getTotalCost(listing))} incl. fees
      </button>
    </Tooltip>
  )
}

export function ListingSummaryCard({ listing, team }: ListingSummaryCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-hairline bg-surface shadow-card">
      <header className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-track">
          <TeamLogo team={team} size={40} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{team.name}</h2>
          <p className="truncate text-xs text-muted">{team.venue}</p>
        </div>
      </header>

      <dl>
        <Row label="ID" value={listing.id} />
        <Row label="Section" value={listing.section} />
        <Row label="Row" value={listing.row} />
        <Row label={`${listing.seatCount} seats`} value={listing.seatRange} />
        <Row label="Publication date" value={listing.publicationDate} />
        <Row label="Total cost" value={<TotalCostValue listing={listing} />} />
      </dl>

      {listing.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border-hairline px-4 py-3">
          {listing.tags.map((tag) => {
            const { Icon, tooltip } = TAG_PRESENTATION[tag.iconName]
            return (
              <Tag key={tag.id} tone={tag.tone} icon={Icon} tooltip={tooltip} focusable>
                {tag.label}
              </Tag>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
