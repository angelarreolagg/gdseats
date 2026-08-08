import { motion } from 'motion/react'

interface GridDotsProps {
  /** Tailwind colour utility for the dots. Defaults to the accent ink. */
  className?: string
  /** Dot size utility pair, e.g. "h-2 w-2". */
  dotClassName?: string
}

const DOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

/**
 * A 3×3 grid of dots pulsing on a diagonal stagger.
 *
 * Purely decorative — callers own the `role="status"` and the text that says what
 * is loading, since a spinner with no label announces nothing.
 *
 * `MotionConfig reducedMotion="user"` in AppProviders neutralises the animation
 * when the OS asks for it, so there is no per-component check here.
 */
export function GridDots({
  className = 'text-accent-ink',
  dotClassName = 'h-2 w-2',
}: GridDotsProps) {
  return (
    <div aria-hidden="true" className={`grid w-fit grid-cols-3 gap-1.5 ${className}`}>
      {DOTS.map((index) => (
        <motion.span
          key={index}
          className={`block rounded-full bg-current ${dotClassName}`}
          animate={{ scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            // Column offset plus row offset — the pulse travels diagonally.
            delay: (index % 3) * 0.2 + Math.floor(index / 3) * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
