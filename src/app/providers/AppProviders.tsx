import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { ToastContainer } from 'react-toastify'
import { useIsDarkTheme } from '@/shared/hooks/useIsDarkTheme'
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
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const isDark = useIsDarkTheme()

  return (
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  )
}
