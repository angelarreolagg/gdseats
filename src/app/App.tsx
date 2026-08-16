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
  // Subscribed purely for the re-render: `getDocumentMeta` reads the i18n
  // singleton directly, so without something here listening for
  // `languageChanged` the tab title would keep whatever language the visitor
  // first arrived in, however many times they used the switcher.
  useTranslation('meta')
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

  // The one thing a router would have given us for free, again: screens swap in
  // place, so without this every tab reads "G&D Seats — Deal Analyzer" whether the
  // visitor is on the grid, a franchise, or one listing.
  useDocumentMeta(getDocumentMeta(team, openListing))

  return (
    <div className="min-h-dvh bg-page">
      <AppHeader onHome={nav.backToTeams} />

      {nav.screen.name === 'teams' || !team ? (
        // The landing sections sit INSIDE this branch, not beside the pair. A
        // visitor deep in one franchise's listings is past being sold to, and
        // an FAQ under the results would push the pagination off the page.
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
