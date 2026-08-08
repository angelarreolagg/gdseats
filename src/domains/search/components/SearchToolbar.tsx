import { Select } from '@/shared/components/Select'
import { useMemo } from 'react'
import { TeamLogo } from '@/domains/teams/components/TeamLogo'
import { TrendChip } from '@/domains/teams/components/TrendChip'
import { getMarketTrend } from '@/domains/teams/services/marketTrend.service'
import type { Team } from '@/domains/teams/types/team.types'
import { SORT_OPTIONS, type SortKey } from '../services/listingSearch.service'

interface SearchToolbarProps {
  team: Team
  listingCount: number
  selectedSection: number | null
  hasFilters: boolean
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  onClearAll: () => void
}

export function SearchToolbar({
  team,
  listingCount,
  selectedSection,
  hasFilters,
  sort,
  onSortChange,
  onClearAll,
}: SearchToolbarProps) {
  const trend = useMemo(() => getMarketTrend(team), [team])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-hairline px-5 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-track">
          <TeamLogo team={team} size={36} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{team.name}</p>
          <p className="truncate text-xs text-muted">{team.venue}</p>
        </div>

        {/* The trend used to vanish the moment a franchise was picked. Focusable
            here because, unlike on the card, this chip sits on its own. */}
        <TrendChip trend={trend} focusable />

        {selectedSection !== null ? (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent-ink transition-colors hover:bg-accent/25"
          >
            Section {selectedSection}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Clear section filter</span>
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClearAll}
          disabled={!hasFilters}
          className="text-sm text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Clear all
        </button>

        <span className="text-sm text-muted tabular-nums">
          {listingCount.toLocaleString('en-US')} listings
        </span>

        <Select
          label="Order by"
          hideLabel
          value={sort}
          options={SORT_OPTIONS}
          onChange={(value) => onSortChange(value as SortKey)}
        />
      </div>
    </div>
  )
}
