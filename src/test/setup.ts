import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import i18n from '@/shared/i18n'
import { DEFAULT_LOCALE } from '@/shared/i18n/locales'

/**
 * The suite runs in English, and that is what keeps 33 existing test files
 * passing through the whole extraction: every assertion on copy is asserting on
 * the `en` bundle, which is byte-identical to the literals it replaced.
 *
 * Imported for its side effect first — the singleton initialises synchronously
 * with every locale bundled, so service tests that never render still have a
 * working `t()`. Then pinned to `en`, because `resolveInitialLocale()` reads
 * `navigator.language`, and jsdom's is whatever the machine running CI reports.
 */
void i18n.changeLanguage(DEFAULT_LOCALE)

/**
 * jsdom has no layout, so the suite has to *pick* a viewport rather than measure
 * one. Desktop is the default because it renders the most complete DOM — the
 * listing overlay keeps its offer form inline instead of moving it into a bottom
 * sheet, so every test that predates the mobile split still describes what it
 * always described.
 *
 * Flip a single test with `setViewport('mobile')` from `@/test/utils`, BEFORE
 * rendering. See the note there about why mid-test changes do not propagate.
 */
export const DESKTOP_WIDTH_MATCHES = true

export function stubMatchMedia(widthQueriesMatch: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      // Reduced motion is always on: animations can hold content out of the
      // accessibility tree mid-flight, and reporting it makes Motion settle
      // immediately so assertions see the final state.
      matches: query.includes('prefers-reduced-motion')
        ? true
        : /min-width/.test(query)
          ? widthQueriesMatch
          : // `(hover: none)` is tied to the width, so `setViewport('mobile')`
            // means a phone in full — narrow *and* touch — rather than a narrow
            // desktop window that no real user has. Tooltips behave differently
            // on the two, and testing one while claiming the other is worse than
            // not testing it.
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

// jsdom has no layout, so `scrollTo` is a stub that logs "not implemented" to the
// virtual console. `useAppNavigation` calls it on every screen change, so left
// alone every navigation test would print an error it isn't reporting.
vi.stubGlobal('scrollTo', vi.fn())

// Recharts' ResponsiveContainer measures its parent, which jsdom reports as 0.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * jsdom has no `IntersectionObserver` at all, and `Reveal` — every landing
 * section — animates on `whileInView`, which Motion implements with one.
 *
 * Left unstubbed the constructor throws. Stubbed as a no-op it is worse than
 * that: nothing ever reports as intersecting, so every revealed element holds
 * its `initial` state of `opacity: 0` forever. Content assertions still pass
 * (the nodes are in the DOM), but `toBeVisible()` fails and the sections look
 * broken for a reason no test names. So this reports intersection synchronously
 * the moment something is observed, which is the state the assertions want.
 *
 * Note the reduced-motion stub above does NOT cover this. `reducedMotion="user"`
 * suppresses transforms, not opacity, and it has no opinion about what triggers
 * an animation in the first place.
 */
globalThis.IntersectionObserver = class {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  // A plain field, not a parameter property: `erasableSyntaxOnly` is on, and a
  // parameter property emits real code rather than erasing to nothing.
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
  // Restore the defaults, or one mobile test silently rewrites the viewport —
  // and one `setLocale('ja')` the language — for every test that runs after it.
  stubMatchMedia(DESKTOP_WIDTH_MATCHES)
  void i18n.changeLanguage(DEFAULT_LOCALE)
})
