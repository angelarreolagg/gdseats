import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppNavigation } from '../useAppNavigation'

describe('useAppNavigation', () => {
  beforeEach(() => {
    vi.mocked(window.scrollTo).mockClear()
  })

  it('scrolls to the top when the screen changes', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.openTeam('dal'))
    expect(result.current.screen).toEqual({ name: 'search', teamId: 'dal' })
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)

    vi.mocked(window.scrollTo).mockClear()
    act(() => result.current.backToTeams())
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

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
