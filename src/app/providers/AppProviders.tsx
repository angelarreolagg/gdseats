import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'

/**
 * `reducedMotion="user"` makes every animation in the tree respect the OS setting
 * without each component checking for it. The tooltip provider shares one delay
 * group, so moving between chips doesn't re-wait each time.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250} skipDelayDuration={400}>
        {children}
      </TooltipProvider>
    </MotionConfig>
  )
}
