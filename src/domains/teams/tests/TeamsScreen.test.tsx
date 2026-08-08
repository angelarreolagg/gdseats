import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamsScreen } from '../components/TeamsScreen'
import { TEAMS, TEAMS_PER_PAGE } from '../data/teams'

describe('TeamsScreen league switch', () => {
  /**
   * Validates: the segmented control reports which half is active.
   * Why it matters: the dropdown this replaced got selection semantics for free.
   * Hand-built toggle buttons have to declare their own — without `aria-pressed`
   * a screen-reader user has no way to know which league is showing, and the
   * control becomes unusable without sight.
   */
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

  /**
   * Validates: the selected fill exists once and travels, rather than one fill
   * per option toggling on and off.
   * Why it matters: the slide between the two halves is the only feedback that
   * the change came from the user — the grid below re-renders too fast to read as
   * a response. Motion can only animate the fill from one pill to the other while
   * it is a single element carrying a `layoutId`. Rendering a background under
   * both options and switching their opacity looks identical in a static
   * screenshot, passes every other test here, and silently deletes the animation.
   */
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

  /**
   * Validates: MLB is honest about being empty.
   * Why it matters: promoting the league picker from a dropdown to two prominent
   * buttons makes MLB much easier to land on. Without the empty state the user
   * would read a blank grid as a broken page.
   */
  it('shows the empty state for the league with no inventory', async () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /mlb teams/i }))
    expect(screen.getByText(/aren't part of this demo yet/i)).toBeInTheDocument()
  })

  /**
   * Validates: a full page of franchises renders and selecting one reports its id.
   * Why it matters: this grid is the entry point of the whole flow — every other
   * screen is reached through it.
   */
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

  /**
   * Validates: a full page of franchises renders.
   * Why it matters: this used to count sparklines, which was an indirect proxy —
   * it broke the moment the chart was removed even though nothing about the grid
   * had changed. Asserting the franchises themselves says what the test means.
   */
  it('shows a full page worth of cards', () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    for (const team of TEAMS.slice(0, TEAMS_PER_PAGE)) {
      expect(screen.getByText(team.name)).toBeInTheDocument()
    }
    expect(screen.queryByText(TEAMS[TEAMS_PER_PAGE].name)).not.toBeInTheDocument()
  })
})
