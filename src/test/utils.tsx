import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { AppProviders } from '@/app/providers/AppProviders'
import i18n from '@/shared/i18n'
import type { Locale } from '@/shared/i18n/locales'
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
 * Run a test in a language other than English.
 *
 * **Call it before `render`, for the same class of reason as `setViewport`.**
 * `changeLanguage` is async — it resolves immediately here because every bundle
 * is already in memory, but a component that has already rendered only picks the
 * change up on the re-render i18next's emitter schedules, which is not something
 * a synchronous assertion after this call can rely on. Setting it first
 * sidesteps the question entirely.
 *
 * `src/test/setup.ts` restores `en` after every test.
 */
export function setLocale(locale: Locale) {
  void i18n.changeLanguage(locale)
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
