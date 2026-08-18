import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/test/utils'
import { LanguageSwitch } from '../components/LanguageSwitch'
import i18n from '../i18n'
import { LOCALE_STORAGE_KEY, LOCALES } from '../i18n/locales'

/**
 * **This environment has no `localStorage`, so the persistence test brings its
 * own.**
 *
 * Node 22 defines `globalThis.localStorage` as `undefined` unless started with
 * `--localstorage-file`, and that shadows the one jsdom would otherwise put on
 * `window` — so `window.localStorage` is undefined for the whole suite. Every
 * read in the app is already inside a `try/catch` (Safari private mode throws
 * for the same shape of reason), which means the app degrades correctly here and
 * a test asserting on real storage would silently assert on nothing.
 *
 * Installing a minimal `Storage` for this one file is what turns "persistence is
 * untested" into "persistence is tested" — and it stays scoped to this file
 * rather than going into `setup.ts`, because everything else in the suite is
 * correct to run without storage.
 */
function installStorage() {
  const entries = new Map<string, string>()
  const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'> = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, String(value)),
    removeItem: (key) => void entries.delete(key),
    clear: () => entries.clear(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

beforeEach(installStorage)
afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'localStorage')
})

/**
 * Found by its `aria-haspopup`, not by its accessible name.
 *
 * The name is itself translated, so the moment a test switches to Spanish the
 * trigger stops answering to /change language/i — which is the control working,
 * not failing. Querying the role relationship keeps the helper usable on both
 * sides of a switch.
 */
const trigger = () =>
  screen.getByRole('button', {
    name: (_name, element) => element.getAttribute('aria-haspopup') === 'listbox',
  })

describe('LanguageSwitch', () => {
  it('lists every locale under its own name', async () => {
    render(<LanguageSwitch />)
    await userEvent.click(trigger())

    for (const locale of LOCALES) {
      expect(screen.getByRole('option', { name: new RegExp(locale.endonym) })).toBeInTheDocument()
    }
  })

  it('shows the two-letter code on the trigger, not the endonym', async () => {
    render(<LanguageSwitch />)

    expect(trigger()).toHaveTextContent('EN')
    expect(trigger()).not.toHaveTextContent('English')
  })

  it('switches, persists, and relabels the document', async () => {
    render(<LanguageSwitch />)
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('option', { name: /Español/ }))

    await waitFor(() => expect(i18n.language).toBe('es'))
    // `window.localStorage`, not the bare global: Node 22 defines its own
    // `globalThis.localStorage` as undefined without `--localstorage-file`, and
    // that shadows jsdom's. `useTheme.ts` reaches for it the same way.
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    expect(trigger()).toHaveTextContent('ES')
  })

  it('does not let the option unmount under the click that selects it', async () => {
    render(<LanguageSwitch />)
    await userEvent.click(trigger())

    const option = screen.getByRole('option', { name: /日本語/ })
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    option.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('moves with the arrows, selects with Enter, and closes with Escape', async () => {
    render(<LanguageSwitch />)

    await userEvent.click(trigger())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // en → es → pt-BR
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    await waitFor(() => expect(i18n.language).toBe('pt-BR'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })

  /**
   * Validates: every option renders its flag alongside the endonym.
   * Why it matters: four rows that only differ by the label itself are slower
   * to scan than four with a distinct glyph, especially in a script the
   * reader doesn't associate with a two-letter code at a glance.
   */
  it('renders a flag next to every option', async () => {
    render(<LanguageSwitch />)
    await userEvent.click(trigger())

    for (const locale of LOCALES) {
      const option = screen.getByRole('option', { name: new RegExp(locale.endonym) })
      // Decorative and aria-hidden, so there is no accessible query to reach it by —
      // the same exception the lucide icon in AIInsightPanel.test.tsx relies on.
      expect(option.querySelector('svg')).toBeInTheDocument()
    }
  })

  it('marks the active locale in the list', async () => {
    render(<LanguageSwitch />)
    await userEvent.click(trigger())

    expect(screen.getByRole('option', { name: /English/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('option', { name: /日本語/ })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })
})
