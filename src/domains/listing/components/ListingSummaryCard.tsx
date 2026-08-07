import type { ReactNode } from 'react'
import { Tag } from '@/shared/components/Tag'
import { formatCurrency } from '@/shared/utils/formatters'
import { TeamCrest } from '@/domains/teams/components/TeamCrest'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '../types/listing.types'
import { getTotalCost } from '../types/listing.types'

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

export function ListingSummaryCard({ listing, team }: ListingSummaryCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-hairline bg-surface shadow-card">
      <header className="flex items-center gap-3 px-4 py-4">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <TeamCrest
            primary={team.primary}
            secondary={team.secondary}
            seed={`summary-${team.id}`}
            className="h-full w-full"
          />
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
        <Row
          label="Total cost"
          value={
            <span className="underline decoration-border-hairline underline-offset-4">
              {formatCurrency(getTotalCost(listing))} incl. fees
            </span>
          }
        />
      </dl>

      {listing.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border-hairline px-4 py-3">
          {listing.tags.map((tag) => (
            <Tag key={tag.id} tone={tag.tone} icon={tag.icon}>
              {tag.label}
            </Tag>
          ))}
        </div>
      ) : null}
    </section>
  )
}
