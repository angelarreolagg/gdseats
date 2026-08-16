import { useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { getTeamById } from '@/domains/teams/data/teams'
import { TeamsScreen } from '@/domains/teams/components/TeamsScreen'
import { SearchScreen } from '@/domains/search/components/SearchScreen'
import { ListingDetailOverlay } from '@/domains/listing/components/ListingDetailOverlay'
import { generateListingsForTeam } from '@/domains/listing/services/listingGenerator.service'
import { useDocumentMeta } from '@/shared/hooks/useDocumentMeta'
import { AppFooter } from './components/AppFooter'
import { AppHeader } from './components/AppHeader'
import { LandingSections } from './components/landing/LandingSections'
import { getDocumentMeta } from './documentMeta'
import { useAppNavigation } from './useAppNavigation'

export function App() {
  // Subscribed for the re-render: `getDocumentMeta` reads the singleton directly,
  // so without a listener the tab title would keep the first language.
  useTranslation('meta')
  const nav = useAppNavigation()
  const team = nav.screen.name === 'search' ? getTeamById(nav.screen.teamId) : undefined

  // Generated at the shell so the list and the overlay resolve the same set.
  const listings = useMemo(() => (team ? generateListingsForTeam(team) : []), [team])

  const openListing = nav.openListingId
    ? listings.find((listing) => listing.id === nav.openListingId)
    : undefined

  const sectionListings = openListing
    ? listings.filter((listing) => listing.section === openListing.section)
    : []

  // Screens swap in place, so without this every tab reads the same title.
  useDocumentMeta(getDocumentMeta(team, openListing))

  return (
    <div className="min-h-dvh bg-page">
      <AppHeader onHome={nav.backToTeams} />

      {nav.screen.name === 'teams' || !team ? (
        // Inside this branch, not beside the pair: an FAQ under a franchise's listings
        // would push the pagination off the page.
        <>
          <TeamsScreen onSelectTeam={nav.openTeam} />
          <LandingSections />
        </>
      ) : (
        <SearchScreen team={team} listings={listings} onOpenListing={nav.openListing} />
      )}

      <AppFooter />

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
