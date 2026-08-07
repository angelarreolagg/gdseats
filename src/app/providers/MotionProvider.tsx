import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/**
 * `reducedMotion="user"` makes every animation in the tree respect the OS
 * setting without each component checking for it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
