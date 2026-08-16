import { useCallback, useState } from 'react'

export type Screen = { name: 'teams' } | { name: 'search'; teamId: string }

/**
 * `scrollTo(0, 0)` on every screen change — screens swap in place, so the
 * document would otherwise inherit the previous one's offset. Overlays are
 * excluded: closing a listing must return the buyer to the row they opened.
 */
function resetScroll() {
  window.scrollTo(0, 0)
}

/** Three screens, one an overlay — so state, not a route. */
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
