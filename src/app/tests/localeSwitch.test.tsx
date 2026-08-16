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
  /**
   * Validates: choosing a language re-renders the app in it, including the tab
   * title.
   * Why it matters: this is the feature. Everything upstream of it is machinery,
   * and all of the machinery can be individually correct while the visitor still
   * sees English — a provider mounted below the shell, a component reading a
   * second i18next instance, or a screen that resolved its copy once at module
   * scope would each produce exactly that.
   *
   * The title is asserted alongside the body because it travels a different
   * path: `getDocumentMeta` reads the singleton directly rather than through a
   * hook, so it only updates because `App` subscribes to the language for the
   * re-render. That subscription looks unused and is the thing most likely to be
   * removed by someone tidying imports.
   */
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

  /**
   * Validates: the drawn wordmark translates too, and its draw is replayed
   * rather than left showing a finished animation of the previous language.
   * Why it matters: the wordmark is the largest thing on the landing page, and
   * `StrokeText` animates on **mount** — so a re-render alone would swap the
   * glyphs in with no draw at all, which reads as a rendering glitch rather than
   * as the headline arriving. The keyed Fragment in `TeamsHero` is what forces
   * the remount; comparing node identity is the only way to observe it, since
   * jsdom runs the animation itself as a no-op.
   *
   * It also protects a subtler thing: `StrokeText` measures `getBBox()` once and
   * caches the viewBox. Without a remount the new copy would be drawn into the
   * previous language's box and clipped.
   */
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

  /**
   * Validates: the accessible name of the wordmark carries a separator even
   * where the language writes none.
   * Why it matters: the `<h1>` is the only one on the page and its name is
   * assembled from two halves. Japanese puts no space between them, so relying on
   * the two `role="img"` children to concatenate would announce the two clauses
   * run together as a single word.
   */
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
