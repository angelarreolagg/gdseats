import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from '../components/AppHeader'

describe('AppHeader', () => {
  /**
   * Validates: the header carries only what a demo needs.
   * Why it matters: marketplace chrome (Buy / Sell / Sign in / Sign up) invites
   * clicks that go nowhere. Every one of those is a dead end that makes the demo
   * feel broken rather than focused.
   */
  it('carries no marketplace chrome', () => {
    render(<AppHeader onHome={vi.fn()} />)

    for (const gone of [/sign in/i, /sign up/i, /^buy$/i, /^sell$/i, /nfl teams/i]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument()
    }
  })

  /**
   * Validates: the demo marker is present and is NOT a button.
   * Why it matters: it wears the primary button's styling, so it looks clickable.
   * Making it an actual button would promise an action that does not exist — on
   * the one element whose whole job is being honest about what this app is.
   */
  it('shows the demo marker as a non-interactive element', () => {
    render(<AppHeader onHome={vi.fn()} />)

    const marker = screen.getByText(/demo version/i)
    expect(marker).toBeInTheDocument()
    expect(marker.tagName).not.toBe('BUTTON')
    expect(screen.queryByRole('button', { name: /demo version/i })).not.toBeInTheDocument()
  })

  /**
   * Validates: neither of the two controls in the right-hand group declares its
   * own height — the row does.
   * Why it matters: they sit side by side, so a height mismatch is visible on
   * every page load, and it shipped exactly that way: the toggle took a fixed
   * `h-10` from IconButton while the marker was sized by its own padding and font,
   * landing ~8px shorter on mobile. Keeping them equal by picking matching values
   * is the version that drifts again on the next restyle; having one owner is the
   * version that cannot. jsdom has no layout to measure, so the declaration is the
   * only thing a test can hold.
   */
  it('lets the row own the height of both controls', () => {
    const { container } = render(<AppHeader onHome={vi.fn()} />)

    const toggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i })
    const marker = screen.getByText(/demo version/i)
    const row = container.querySelector('.items-stretch')

    expect(row).toContainElement(toggle)
    expect(row).toContainElement(marker)

    for (const control of [toggle, marker]) {
      expect(control.className).not.toMatch(/(^|\s)(sm:)?h-\d/)
      expect(control.className).not.toMatch(/(^|\s)(sm:)?py-/)
    }
  })

  it('navigates home from the logo', async () => {
    const onHome = vi.fn()
    render(<AppHeader onHome={onHome} />)

    await userEvent.click(screen.getByRole('button', { name: /g&d seats home/i }))
    expect(onHome).toHaveBeenCalled()
  })

  it('keeps the theme toggle', () => {
    render(<AppHeader onHome={vi.fn()} />)
    expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeInTheDocument()
  })

  /**
   * Validates: the short name is what shows, with the full one behind the logo.
   * Why it matters: "G&D Seats" is the name everywhere in the product; the
   * expansion exists only as a hover affordance. Rendering the long form inline
   * would push the nav around and break the one place the brand is fixed.
   */
  it('shows the short name and expands it on hover', async () => {
    render(<AppHeader onHome={vi.fn()} />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
    expect(screen.queryByText(/gridiron & diamond/i)).not.toBeInTheDocument()

    await userEvent.hover(screen.getByRole('button', { name: /g&d seats home/i }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Gridiron & Diamond Seats')
  })

  /**
   * Validates: the bar keeps the dark palette regardless of theme.
   * Why it matters: the brand mark is a fixed bright-green seat at 1.33:1 on
   * white. On a light header it would vanish — the `dark` scope is the only
   * reason the logo stays visible in light mode.
   */
  it('pins the header to the dark palette', () => {
    const { container } = render(<AppHeader onHome={vi.fn()} />)
    expect(container.querySelector('header')).toHaveClass('dark')
  })

  /**
   * Validates: the demo marker stays on one line, and the brand is what gives way
   * when the bar runs out of room.
   * Why it matters: on a phone "Demo version" was breaking over two lines inside a
   * pill whose height is set by the row, which mangles the whole header. Keeping
   * it to one line only works while something else can absorb the shortfall — so
   * `whitespace-nowrap` on the marker, `shrink-0` on the control group and
   * `truncate` + `min-w-0` on the wordmark are one mechanism, not four cosmetic
   * classes. Drop any of them and the marker wraps again, or the overflow moves
   * onto the page as a horizontal scrollbar.
   */
  it('keeps the demo marker on one line and lets the brand truncate', () => {
    render(<AppHeader onHome={vi.fn()} />)

    expect(screen.getByText('Demo version')).toHaveClass('whitespace-nowrap')

    const wordmark = screen.getByText('G&D Seats')
    expect(wordmark).toHaveClass('truncate')
    // `min-width: auto` on a flex item refuses to shrink below its content, so
    // without this the ellipsis can never engage and the overflow escapes.
    expect(wordmark.closest('button')).toHaveClass('min-w-0')
  })
})
