import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import i18n from '@/shared/i18n'
import { DEFAULT_LOCALE } from '@/shared/i18n/locales'

/**
 * The suite runs in English: every assertion on copy is asserting on the `en`
 * bundle, which is byte-identical to the literals it replaced. Pinned rather
 * than resolved, since `resolveInitialLocale()` reads `navigator.language`.
 */
void i18n.changeLanguage(DEFAULT_LOCALE)

/**
 * jsdom has no layout, so the suite picks a viewport. Desktop renders the most
 * complete DOM. Flip one test with `setViewport('mobile')` BEFORE rendering —
 * see the note in `@/test/utils`.
 */
export const DESKTOP_WIDTH_MATCHES = true

export function stubMatchMedia(widthQueriesMatch: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      // Reduced motion is always on: animations can hold content out of the
      // accessibility tree mid-flight.
      matches: query.includes('prefers-reduced-motion')
        ? true
        : /min-width/.test(query)
          ? widthQueriesMatch
          : // `(hover: none)` tracks the width, so 'mobile' means narrow AND touch.
            /hover:\s*none/.test(query)
            ? !widthQueriesMatch
            : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

stubMatchMedia(DESKTOP_WIDTH_MATCHES)

// `useAppNavigation` calls it on every screen change; unstubbed, jsdom logs
// "not implemented" for each one.
vi.stubGlobal('scrollTo', vi.fn())

// Recharts' ResponsiveContainer measures its parent, which jsdom reports as 0.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * jsdom has no `IntersectionObserver`, and a no-op stub is worse than none:
 * nothing reports as intersecting, so every `Reveal` holds `opacity: 0` and the
 * landing sections render blank while content assertions still pass. This one
 * reports intersection synchronously.
 */
globalThis.IntersectionObserver = class {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  // A plain field, not a parameter property: `erasableSyntaxOnly` is on.
  callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
} as unknown as typeof IntersectionObserver

afterEach(() => {
  cleanup()
  // Restore the defaults, or one test silently rewrites them for the rest.
  stubMatchMedia(DESKTOP_WIDTH_MATCHES)
  void i18n.changeLanguage(DEFAULT_LOCALE)
})
