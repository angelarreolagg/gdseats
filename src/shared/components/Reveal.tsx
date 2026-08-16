import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * The house scroll reveal, and **the only viewport-triggered animation in the
 * app**. One component because the mechanism has a test-environment cost that
 * should be paid once, and because a dozen hand-written `whileInView` props are
 * a dozen chances to forget `once: true`.
 *
 * `amount: 0.2`, not 0.3: the threshold is a fraction of *the element*, and the
 * concierge card is taller than a short laptop viewport.
 */
interface RevealProps {
  children: ReactNode
  /** Seconds. Stagger siblings with `index * 0.14` to match the hero's beats. */
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
