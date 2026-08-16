import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * The house scroll reveal: content rises in the first time it enters the
 * viewport, and stays put afterwards.
 *
 * THIS IS THE ONLY VIEWPORT-TRIGGERED ANIMATION IN THE APP. Everything else
 * animates on mount (`AIInsightPanel`), on a remount key (`TeamsScreen`'s grid)
 * or on a timer (`TeamsHero`'s copy beats). Keeping all of it behind one
 * component is deliberate: the mechanism has a test-environment cost (below)
 * that has to be paid exactly once, and a dozen hand-written `whileInView`
 * props would each be a place to forget `once: true`.
 *
 * The curve, the offset and the 0.14s stagger are lifted from `TeamsHero`'s
 * copy so the lower page reads as the same product as the band above it.
 *
 * **`once: true` is not a preference.** Without it the reveal re-fires every
 * time the element crosses the viewport edge, so a visitor scrolling back up
 * the page watches the whole thing dismantle and rebuild itself.
 *
 * **`amount: 0.2`, not the more usual 0.3.** The threshold is a fraction of the
 * *element*, and the concierge card is taller than a short laptop viewport — at
 * 0.3 a tall element can never have enough of itself on screen at once, so it
 * would never trip and would stay invisible forever.
 *
 * Under reduced motion `MotionConfig reducedMotion="user"` drops the `y`
 * transform on its own; the fade still runs, which is the intent — the point of
 * the setting is to stop movement, not to stop everything.
 *
 * jsdom has no `IntersectionObserver`, so `src/test/setup.ts` stubs one that
 * reports intersection immediately. Without it every revealed element sits at
 * `opacity: 0` under test and the sections read as broken.
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
