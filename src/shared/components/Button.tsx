import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

// Extends the motion props rather than React's: motion.button redefines the drag
// handlers with its own pan-gesture signatures, so the two are not compatible.
type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
}

const VARIANTS = {
  // The brand green is a fill only — it carries dark ink at 14.33:1. It is never
  // used as text on a light surface, where it measures 1.33:1.
  primary: 'bg-accent text-on-accent shadow-raised hover:brightness-105',
  ghost: 'bg-transparent text-ink border border-border-hairline hover:bg-track',
} as const

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        VARIANTS[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
