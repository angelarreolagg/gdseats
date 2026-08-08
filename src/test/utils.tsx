import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { AppProviders } from '@/app/providers/AppProviders'
import { stubMatchMedia } from './setup'

/**
 * Choose which side of a `min-width` breakpoint the test runs on.
 *
 * **Call it before `render`, never after.** The stubbed `MediaQueryList` has a
 * no-op `addEventListener`, so nothing that already subscribed through
 * `useMediaQuery` will hear about the change — a component rendered first stays
 * on the branch it started with, and the test fails describing a component that
 * is behaving correctly. Setting it first sidesteps the whole question, which is
 * why there is no `resizeTo` helper here.
 *
 * `src/test/setup.ts` restores 'desktop' after every test.
 */
export function setViewport(size: 'mobile' | 'desktop') {
  stubMatchMedia(size === 'desktop')
}

/**
 * Render inside the app's providers.
 *
 * Radix Tooltip throws without a `TooltipProvider` ancestor, so any component
 * carrying a chip needs this rather than the bare RTL render. Using it everywhere
 * also means tests exercise the same MotionConfig the app runs with.
 */
export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AppProviders, ...options })
}

export { screen, within, fireEvent, waitFor, cleanup } from '@testing-library/react'
