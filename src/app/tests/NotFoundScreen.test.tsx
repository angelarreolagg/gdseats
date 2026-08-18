import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotFoundScreen } from '../components/NotFoundScreen'

describe('NotFoundScreen', () => {
  it('names the dead end and offers the one way out', () => {
    render(<NotFoundScreen onBackToTeams={() => {}} />)

    expect(screen.getByRole('heading', { name: /team not found/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to teams/i })).toBeInTheDocument()
  })

  /**
   * Validates: the CTA calls the handler that returns the buyer to the teams screen.
   * Why it matters: a stale team id (a bad link, or a franchise removed from the
   * catalogue) is otherwise a dead page with no way back to the marketplace.
   */
  it('returns the buyer to the teams screen', async () => {
    const onBackToTeams = vi.fn()
    render(<NotFoundScreen onBackToTeams={onBackToTeams} />)

    await userEvent.click(screen.getByRole('button', { name: /back to teams/i }))

    expect(onBackToTeams).toHaveBeenCalledOnce()
  })
})
