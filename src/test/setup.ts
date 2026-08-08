import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

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

afterEach(() => {
  cleanup()
  // Restore the default, or one mobile test silently rewrites the viewport for
  // every test that runs after it in the same file.
  stubMatchMedia(DESKTOP_WIDTH_MATCHES)
})
