import { fireEvent, render, screen } from '@/test/utils'
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

  /**
   * Validates: each page indicator is a finger-sized button wrapping the hairline
   * bar, rather than being the bar.
   * Why it matters: styled as the bar itself these were 12×6px targets and did not
   * respond to a thumb at all — the control was visible and inert on every phone.
   * The height and padding are what make it hittable, and they look like cosmetic
   * classes on a decorative element, so they are exactly what gets "cleaned up"
   * back into the bar. The bar has to stay a child for the target to survive.
   */
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

  /**
   * Validates: a horizontal swipe pages the grid in the direction of the gesture,
   * and stops at both ends.
   * Why it matters: swiping is the gesture a phone user tries first, and before
   * this the only way through 24 franchises on a touch screen was hitting a 6px
   * indicator. Clamping is the part worth pinning — a flick past the last page
   * wrapping around to the first would read as the grid resetting itself.
   */
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

  /**
   * Validates: a mostly-vertical drag is left to the browser.
   * Why it matters: scrolling is what a finger does on this screen nearly every
   * time, and a scroll is rarely perfectly straight. Without the direction test a
   * slightly slanted scroll would page the catalogue out from under the reader —
   * the kind of bug that feels like the app is possessed rather than broken.
   */
  it('ignores a drag that is mostly vertical', () => {
    render(<TeamsScreen onSelectTeam={vi.fn()} />)

    const grid = screen.getByText('Dallas Cowboys').closest('.grid') as HTMLElement

    // 60px sideways clears the distance threshold on its own, but 200px of
    // vertical travel means this was a scroll.
    fireEvent.pointerDown(grid, { pointerType: 'touch', clientX: 300, clientY: 100 })
    fireEvent.pointerUp(grid, { pointerType: 'touch', clientX: 240, clientY: 300 })

    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  /**
   * Validates: a swipe that begins on a team card does not also open that team.
   * Why it matters: the pointer sequence still ends in a `click` on whatever card
   * the finger came down on, so without suppression every swipe would navigate
   * into a franchise the buyer was only sliding past — turning the new gesture
   * into a worse bug than the one it fixed.
   */
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

  /**
   * Validates: a mouse drag is not a page turn.
   * Why it matters: on a desktop the same movement is a text selection or an
   * aimless nudge. Claiming it would make the catalogue jump under the cursor for
   * every user who never asked for a gesture in the first place.
   */
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
