import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Animations can keep content out of the accessibility tree mid-flight. Reporting
// reduced motion makes Motion settle immediately, so assertions see final state.
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

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

afterEach(cleanup)
