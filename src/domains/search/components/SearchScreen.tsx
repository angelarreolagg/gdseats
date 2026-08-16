import { useTranslation } from 'react-i18next'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '@/domains/listing/types/listing.types'
import { SeatMap } from '@/domains/listing/components/SeatMap'
import { useListingSearch } from '../hooks/useListingSearch'
import { SearchToolbar } from './SearchToolbar'
import { ListingRow } from './ListingRow'

interface SearchScreenProps {
  team: Team
  /** Generated once by the app shell, so the overlay can resolve the same set. */
  listings: Listing[]
  onOpenListing: (listingId: string) => void
}

export function SearchScreen({ team, listings, onOpenListing }: SearchScreenProps) {
  const { t } = useTranslation('search')
  const search = useListingSearch(listings)

  return (
    <div>
      <SearchToolbar
        team={team}
        listingCount={search.visible.length}
        selectedSection={search.selectedSection}
        hasFilters={search.hasFilters}
        sort={search.sort}
        onSortChange={search.setSort}
        onClearAll={search.clearAll}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="border-b border-border-hairline p-4 lg:sticky lg:top-0 lg:h-[calc(100dvh-8rem)] lg:border-r lg:border-b-0">
          <SeatMap
            className="h-64 w-full lg:h-full"
            sectionCounts={search.sectionCounts}
            selectedSection={search.selectedSection}
            onSelectSection={search.toggleSection}
          />
        </div>

        <div className="lg:h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          {search.visible.length > 0 ? (
            search.visible.map((listing) => (
              <ListingRow key={listing.id} listing={listing} onOpen={onOpenListing} />
            ))
          ) : (
            <p className="px-5 py-16 text-center text-sm text-muted">
              {t('empty.noListings', { section: search.selectedSection })}{' '}
              <button
                type="button"
                onClick={search.clearAll}
                className="font-medium text-accent-ink underline underline-offset-4"
              >
                {t('empty.clearFilter')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
