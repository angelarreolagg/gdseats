import { fireEvent, render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamsScreen } from '../components/TeamsScreen'
import { TEAMS, TEAMS_PER_PAGE } from '../data/teams'

describe('TeamsScreen league switch', () => {
  it('marks the active league as pressed', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    const nfl = screen.getByRole('button', { name: /nfl teams/i })
    const mlb = screen.getByRole('button', { name: /mlb teams/i })

    expect(nfl).toHaveAttribute('aria-pressed', 'true')
    expect(mlb).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(mlb)

    expect(nfl).toHaveAttribute('aria-pressed', 'false')
    expect(mlb).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders exactly one travelling fill, under the active league', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    // The fill is purely decorative — `aria-hidden`, no role, no accessible name
    // — so no RTL query can reach it and a raw selector is the only handle. It is
    // scoped to the group because the hero video, its scrims and every team
    // banner are `aria-hidden` too, and an unscoped query collects all 34.
    const group = screen.getByRole('group', { name: /league/i })
    const fills = () => group.querySelectorAll('[aria-hidden="true"]')

    expect(fills()).toHaveLength(1)
    expect(screen.getByRole('button', { name: /nfl teams/i })).toContainElement(
      fills()[0] as HTMLElement,
    )

    await userEvent.click(screen.getByRole('button', { name: /mlb teams/i }))

    expect(fills()).toHaveLength(1)
    expect(screen.getByRole('button', { name: /mlb teams/i })).toContainElement(
      fills()[0] as HTMLElement,
    )
  })

  it('shows the empty state for the league with no inventory', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /mlb teams/i }))
    expect(screen.getByText(/aren't part of this demo yet/i)).toBeInTheDocument()
  })

  it('renders a page of teams and reports the selected one', async () => {
    const onSelectTeam = vi.fn()
    render(<TeamsScreen onSelectTeam={onSelectTeam} />)

    expect(screen.getByText('Dallas Cowboys')).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Dallas Cowboys'))
    expect(onSelectTeam).toHaveBeenCalledWith('dal')
  })

  it('paginates to the next set of franchises', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /next page/i }))

    expect(screen.getByText('2 of 3')).toBeInTheDocument()
    expect(screen.queryByText('Dallas Cowboys')).not.toBeInTheDocument()
    expect(screen.getByText('Los Angeles Rams')).toBeInTheDocument()
  })

  it('shows a full page worth of cards', () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    for (const team of TEAMS.slice(0, TEAMS_PER_PAGE)) {
      expect(screen.getByText(team.name)).toBeInTheDocument()
    }
    expect(screen.queryByText(TEAMS[TEAMS_PER_PAGE].name)).not.toBeInTheDocument()
  })

  it('gives the page indicators a touch-sized target', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    const indicator = screen.getByRole('button', { name: /go to page 2/i })

    // The target lives on the button; the 6px bar it contains is decoration.
    expect(indicator).toHaveClass('h-11', 'px-1.5')
    expect(indicator.querySelector('span')).toHaveClass('h-1.5')

    await userEvent.click(indicator)

    expect(screen.getByText('2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to page 2/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('pages on a horizontal swipe and clamps at the ends', () => {
    const { container } = render(<TeamsScreen onSelectTeam={vi.fn()} />)

    // Re-queried every time: the grid carries `key={league-page}`, so each page
    // change remounts it and a held reference goes stale and silently inert.
    const grid = () => container.querySelector('.grid') as HTMLElement

    swipe(grid(), { from: 300, to: 200 })
    expect(screen.getByText('2 of 3')).toBeInTheDocument()

    swipe(grid(), { from: 200, to: 300 })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()

    // Already on the first page — the gesture has nowhere to go.
    swipe(grid(), { from: 200, to: 300 })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('ignores a drag that is mostly vertical', () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    const grid = screen.getByText('Dallas Cowboys').closest('.grid') as HTMLElement

    // 60px sideways clears the distance threshold on its own, but 200px of
    // vertical travel means this was a scroll.
    fireEvent.pointerDown(grid, { pointerType: 'touch', clientX: 300, clientY: 100 })
    fireEvent.pointerUp(grid, { pointerType: 'touch', clientX: 240, clientY: 300 })

    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('does not open the card a swipe started on', () => {
    const onSelectTeam = vi.fn()
    render(<TeamsScreen onSelectTeam={onSelectTeam} />)

    const card = screen.getByText('Dallas Cowboys').closest('button') as HTMLElement

    // Swiped RIGHT from the first page on purpose: the clamp makes this a no-op,
    // so the card stays mounted and its click is genuinely dispatched at it. A
    // swipe that changed the page would unmount the card and the assertion below
    // would pass for the wrong reason.
    fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerUp(card, { pointerType: 'touch', clientX: 300, clientY: 104 })
    fireEvent.click(card)

    expect(onSelectTeam).not.toHaveBeenCalled()

    // ...and the suppressor disarms itself, so the next real tap still works.
    fireEvent.click(card)
    expect(onSelectTeam).toHaveBeenCalledWith('dal')
  })

  it('leaves mouse drags alone', () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    const grid = screen.getByText('Dallas Cowboys').closest('.grid') as HTMLElement

    fireEvent.pointerDown(grid, { pointerType: 'mouse', clientX: 300, clientY: 100 })
    fireEvent.pointerUp(grid, { pointerType: 'mouse', clientX: 200, clientY: 100 })

    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })
})

/** One touch drag, horizontal, from `from` to `to`. */
function swipe(target: HTMLElement, { from, to }: { from: number; to: number }) {
  fireEvent.pointerDown(target, { pointerType: 'touch', clientX: from, clientY: 100 })
  fireEvent.pointerUp(target, { pointerType: 'touch', clientX: to, clientY: 100 })
}
