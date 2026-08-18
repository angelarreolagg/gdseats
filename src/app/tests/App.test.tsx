import { render, screen } from '@/test/utils'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../App'

// The catalogue has no way to reach a `search` screen with an unresolvable
// team id through the UI — every caller passes a known team's own id. This
// mocks the navigation state directly to exercise App's fallback branch for
// a stale link or a franchise removed from the catalogue.
vi.mock('../useAppNavigation', () => ({
  useAppNavigation: () => ({
    screen: { name: 'search', teamId: 'not-a-real-team' },
    openTeam: vi.fn(),
    backToTeams: vi.fn(),
    openListingId: null,
    openListing: vi.fn(),
    closeListing: vi.fn(),
  }),
}))

describe('App', () => {
  /**
   * Validates: a `search` screen whose team id has no match in the catalogue
   * renders the not-found screen instead of silently reverting to teams.
   * Why it matters: a stale link would otherwise drop the buyer back on the
   * team grid with no explanation, which reads as the click having done
   * nothing rather than as a real dead end.
   */
  it('shows the not-found screen for an unresolvable team id', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /team not found/i })).toBeInTheDocument()
    expect(screen.queryByText(/easy, transparent, and secure way/i)).not.toBeInTheDocument()
  })
})
