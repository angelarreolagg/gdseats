import { useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { getTeamById } from '@/domains/teams/data/teams'
import { TeamsScreen } from '@/domains/teams/components/TeamsScreen'
import { SearchScreen } from '@/domains/search/components/SearchScreen'
import { ListingDetailOverlay } from '@/domains/listing/components/ListingDetailOverlay'
import { generateListingsForTeam } from '@/domains/listing/services/listingGenerator.service'
import { AppHeader } from './components/AppHeader'
import { useAppNavigation } from './useAppNavigation'

export function App() {
  const nav = useAppNavigation()
  const team = nav.screen.name === 'search' ? getTeamById(nav.screen.teamId) : undefined

  // Generated at the shell so the search list and the detail overlay resolve
  // against exactly the same set — the seat map's counts would otherwise be
  // describing a different inventory than the one the overlay opens.
  const listings = useMemo(() => (team ? generateListingsForTeam(team) : []), [team])

  const openListing = nav.openListingId
    ? listings.find((listing) => listing.id === nav.openListingId)
    : undefined

  const sectionListings = openListing
    ? listings.filter((listing) => listing.section === openListing.section)
    : []

  return (
    <div className="min-h-dvh bg-page">
      <AppHeader onHome={nav.backToTeams} />

      {nav.screen.name === 'teams' || !team ? (
        <TeamsScreen onSelectTeam={nav.openTeam} />
      ) : (
        <SearchScreen team={team} listings={listings} onOpenListing={nav.openListing} />
      )}

      <AnimatePresence>
        {openListing && team ? (
          <ListingDetailOverlay
            key={openListing.id}
            listing={openListing}
            team={team}
            sectionListings={sectionListings}
            onClose={nav.closeListing}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
