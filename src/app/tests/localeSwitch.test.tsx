import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/test/utils'
import { App } from '../App'

/**
 * One end-to-end switch, deliberately not repeated per screen.
 *
 * Everything else about i18n is covered at the level it lives: key parity in
 * `i18n.locales.test.ts`, the control in `LanguageSwitch.test.tsx`, formatting in
 * the component tests. What none of those can show is that the pieces are
 * actually wired to each other — that the provider is above the tree, that the
 * singleton the switch writes to is the one the screens read from, and that a
 * change propagates without a reload. That is one test, and duplicating it per
 * screen would buy nothing but runtime.
 */
describe('switching language', () => {
  it('renders the whole shell in the chosen language', async () => {
    render(<App />)

    expect(screen.getByText("Find your team's PSL & Tickets")).toBeInTheDocument()
    expect(document.title).toMatch(/AI-priced NFL personal seat licenses/)

    await userEvent.click(screen.getByRole('button', { name: /change language/i }))
    await userEvent.click(screen.getByRole('option', { name: /日本語/ }))

    await waitFor(() =>
      expect(screen.getByText('お気に入りチームの PSL とチケットを探す')).toBeInTheDocument(),
    )
    expect(screen.queryByText("Find your team's PSL & Tickets")).not.toBeInTheDocument()

    // Beyond the hero: the landing sections and the footer are separate subtrees
    // and would not follow if the provider sat too low.
    expect(screen.getByRole('heading', { name: /よくあるご質問/ })).toBeInTheDocument()
    expect(screen.getByText(/お問い合わせ/)).toBeInTheDocument()

    await waitFor(() => expect(document.title).toMatch(/AI が価格を読む/))
    expect(document.documentElement.lang).toBe('ja')
  })

  // Node identity is the only observable: jsdom runs the draw as a no-op, and
  // StrokeText caches its measured viewBox until remounted.
  it('translates and replays the drawn wordmark', async () => {
    const { container } = render(<App />)

    const before = container.querySelector('h1')
    expect(before).toHaveAccessibleName('SOME SEATS MEAN MORE')

    await userEvent.click(screen.getByRole('button', { name: /change language/i }))
    await userEvent.click(screen.getByRole('option', { name: /日本語/ }))

    await waitFor(() =>
      expect(container.querySelector('h1')).toHaveAccessibleName('その席には 意味がある'),
    )

    // A different node, not the same one re-rendered — that is the remount.
    expect(container.querySelector('h1')).not.toBe(before)
  })

  it('keeps the two halves separated in the accessible name', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /change language/i }))
    await userEvent.click(screen.getByRole('option', { name: /日本語/ }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
        'その席には 意味がある',
      ),
    )
  })
})
