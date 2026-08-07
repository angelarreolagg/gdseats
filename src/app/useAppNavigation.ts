import { useCallback, useState } from 'react'

export type Screen = { name: 'teams' } | { name: 'search'; teamId: string }

/**
 * Three screens, one of which is an overlay rather than a page — so this is state,
 * not routing. A router would add a dependency and config to model something the
 * reference design already shows as a modal over the search results.
 */
export function useAppNavigation() {
  const [screen, setScreen] = useState<Screen>({ name: 'teams' })
  const [openListingId, setOpenListingId] = useState<string | null>(null)

  const openTeam = useCallback((teamId: string) => {
    setScreen({ name: 'search', teamId })
    setOpenListingId(null)
  }, [])

  const backToTeams = useCallback(() => {
    setScreen({ name: 'teams' })
    setOpenListingId(null)
  }, [])

  const openListing = useCallback((listingId: string) => setOpenListingId(listingId), [])
  const closeListing = useCallback(() => setOpenListingId(null), [])

  return { screen, openTeam, backToTeams, openListingId, openListing, closeListing }
}
