import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { I18nextProvider } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import { useIsDarkTheme } from '@/shared/hooks/useIsDarkTheme'
import i18n from '@/shared/i18n'
import 'react-toastify/dist/ReactToastify.css'

/**
 * `reducedMotion="user"` makes every animation in the tree respect the OS setting
 * without each component checking for it. The tooltip provider shares one delay
 * group, so moving between chips doesn't re-wait each time.
 *
 * The toast host lives here rather than in `App` so tests — which render through
 * these providers — can assert on toasts without mounting the whole shell.
 * `theme` reads the palette through `useIsDarkTheme`, never `useTheme`: this
 * only needs to know the mode, not own it. The colours themselves are remapped
 * onto our tokens in `globals.css`.
 *
 * `I18nextProvider` sits here for the same reason as the toast host: every
 * component test renders through these providers (`src/test/utils.tsx`), so the
 * whole suite gets i18n without a line changing in any test file. It goes
 * *inside* `MotionConfig` and *outside* `TooltipProvider` — nothing depends on
 * that order, but a tooltip's content is translated and the language should
 * already be resolved by the time the tooltip tree is built.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const isDark = useIsDarkTheme()

  return (
    <MotionConfig reducedMotion="user">
      <I18nextProvider i18n={i18n}>
        <TooltipProvider delayDuration={250} skipDelayDuration={400}>
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={3200}
            hideProgressBar
            newestOnTop
            closeOnClick
            theme={isDark ? 'dark' : 'light'}
          />
        </TooltipProvider>
      </I18nextProvider>
    </MotionConfig>
  )
}
