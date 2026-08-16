import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from '../components/AppHeader'

describe('AppHeader', () => {
  it('carries no marketplace chrome', () => {
    render(<AppHeader onHome={vi.fn()} />)

    for (const gone of [/sign in/i, /sign up/i, /^buy$/i, /^sell$/i, /nfl teams/i]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument()
    }
  })

  it('shows the demo marker as a non-interactive element', () => {
    render(<AppHeader onHome={vi.fn()} />)

    const marker = screen.getByText(/demo version/i)
    expect(marker).toBeInTheDocument()
    expect(marker.tagName).not.toBe('BUTTON')
    expect(screen.queryByRole('button', { name: /demo version/i })).not.toBeInTheDocument()
  })

  // jsdom has no layout, so the declaration is all a test can hold here.
  it('lets the row own the height of all three controls', () => {
    const { container } = render(<AppHeader onHome={vi.fn()} />)

    const language = screen.getByRole('button', { name: /change language/i })
    const toggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i })
    const marker = screen.getByText(/demo version/i)
    const row = container.querySelector('.items-stretch')

    for (const control of [language, toggle, marker]) {
      expect(row).toContainElement(control)
      expect(control.className).not.toMatch(/(^|\s)(sm:)?h-\d/)
      expect(control.className).not.toMatch(/(^|\s)(sm:)?py-/)
    }
  })

  it('carries a working language switch', async () => {
    render(<AppHeader onHome={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: /change language/i })
    expect(trigger).toHaveTextContent('EN')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
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

  it('shows the short name and expands it on hover', async () => {
    render(<AppHeader onHome={vi.fn()} />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
    expect(screen.queryByText(/gridiron & diamond/i)).not.toBeInTheDocument()

    await userEvent.hover(screen.getByRole('button', { name: /g&d seats home/i }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Gridiron & Diamond Seats')
  })

  it('pins the header to the dark palette', () => {
    const { container } = render(<AppHeader onHome={vi.fn()} />)
    expect(container.querySelector('header')).toHaveClass('dark')
  })

  it('spans the viewport rather than the shell column', () => {
    const { container } = render(<AppHeader onHome={vi.fn()} />)

    const row = container.querySelector('header > div')
    expect(row).not.toHaveClass('max-w-7xl')
    // The padding is what keeps the phone rendering identical — see the header.
    expect(row).toHaveClass('px-7')
  })

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
