import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { AppProviders } from '@/app/providers/AppProviders'
import i18n from '@/shared/i18n'
import type { Locale } from '@/shared/i18n/locales'
import { stubMatchMedia } from './setup'

/**
 * Which side of a `min-width` breakpoint the test runs on.
 *
 * **Call it before `render`.** The stubbed `MediaQueryList` has a no-op
 * `addEventListener`, so anything already subscribed will not hear the change.
 */
export function setViewport(size: 'mobile' | 'desktop') {
  stubMatchMedia(size === 'desktop')
}

/**
 * **Call it before `render`**, same reason as `setViewport`: a mounted component
 * only picks the change up on the re-render i18next schedules.
 */
export function setLocale(locale: Locale) {
  void i18n.changeLanguage(locale)
}

/** Radix Tooltip throws without its provider, so component tests need this. */
export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AppProviders, ...options })
}

export { screen, within, fireEvent, waitFor, cleanup } from '@testing-library/react'
