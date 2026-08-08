import { useCallback, useState } from 'react'

export type Screen = { name: 'teams' } | { name: 'search'; teamId: string }

/**
 * The one thing a router would have done for free.
 *
 * Screens swap in place, so the document keeps whatever scroll offset the last
 * one was left at — pick a team from halfway down the grid and the seat map
 * opens with its top half already scrolled past. Instant, not smooth: this is a
 * page change, and animating it would read as the old screen sliding away.
 *
 * Overlays are excluded on purpose. Closing a listing returns you to the list
 * you opened it from, and that position is worth keeping.
 */
function resetScroll() {
  window.scrollTo(0, 0)
}

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
    resetScroll()
  }, [])

  const backToTeams = useCallback(() => {
    setScreen({ name: 'teams' })
    setOpenListingId(null)
    resetScroll()
  }, [])

  const openListing = useCallback((listingId: string) => setOpenListingId(listingId), [])
  const closeListing = useCallback(() => setOpenListingId(null), [])

  return { screen, openTeam, backToTeams, openListingId, openListing, closeListing }
}
