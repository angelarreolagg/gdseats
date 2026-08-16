import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

// Extends the motion props rather than React's: motion.button redefines the drag
// handlers with its own pan-gesture signatures, so the two are not compatible.
type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  fullWidth?: boolean
}

const VARIANTS = {
  // The brand green is a fill only — it carries dark ink at 14.33:1. It is never
  // used as text on a light surface, where it measures 1.33:1.
  primary: 'bg-accent text-on-accent shadow-raised hover:brightness-105',
  ghost: 'bg-transparent text-ink border border-border-hairline hover:bg-track',
} as const

/**
 * Sizes are a prop, not something a caller passes through `className`.
 *
 * Padding and font size arrive from this component, so a `px-8` handed in
 * alongside would be a second declaration of the same property — and two
 * declarations resolve by **CSS source order, not class-attribute order**. It
 * would appear to work, until Tailwind reordered its output. `IconButton`
 * already takes `size` for the same reason.
 */
const SIZES = {
  md: 'px-5 py-3 text-sm',
  /** The page's one climax CTA. Only the sell band should need this. */
  lg: 'px-8 py-4 text-base',
} as const

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        SIZES[size]
      } ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
