import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { AppProviders } from '@/app/providers/AppProviders'

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
