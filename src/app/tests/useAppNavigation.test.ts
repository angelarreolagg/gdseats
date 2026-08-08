import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppNavigation } from '../useAppNavigation'

describe('useAppNavigation', () => {
  beforeEach(() => {
    vi.mocked(window.scrollTo).mockClear()
  })

  /**
   * Validates: changing screens returns the document to the top.
   * Why it matters: screens swap in place rather than through a router, so the
   * page keeps the offset the previous one was left at. Picking a team from the
   * bottom of the grid opened the seat map already scrolled past the stadium —
   * the buyer landed on a half-cut map and a header they never saw.
   */
  it('scrolls to the top when the screen changes', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.openTeam('dal'))
    expect(result.current.screen).toEqual({ name: 'search', teamId: 'dal' })
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)

    vi.mocked(window.scrollTo).mockClear()
    act(() => result.current.backToTeams())
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  /**
   * Validates: opening and closing a listing leaves the scroll position alone.
   * Why it matters: the detail is an overlay over the results, not a page. A
   * buyer comparing listings opens one, closes it, and must come back to the
   * row they were reading — resetting there would lose their place in a list of
   * 170 and make comparison shopping impossible.
   */
  it('leaves the scroll position alone for the listing overlay', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.openTeam('dal'))
    vi.mocked(window.scrollTo).mockClear()

    act(() => result.current.openListing('listing-1'))
    expect(result.current.openListingId).toBe('listing-1')
    act(() => result.current.closeListing())

    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
