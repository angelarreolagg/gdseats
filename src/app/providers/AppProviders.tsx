import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { I18nextProvider } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import { useIsDarkTheme } from '@/shared/hooks/useIsDarkTheme'
import i18n from '@/shared/i18n'
import 'react-toastify/dist/ReactToastify.css'

/**
 * `reducedMotion="user"` makes every animation respect the OS setting without
 * each component checking. The toast host and `I18nextProvider` live here, not
 * in `App`, so tests rendering through these providers get both for free.
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
