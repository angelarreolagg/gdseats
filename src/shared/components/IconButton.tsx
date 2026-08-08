import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

type IconButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode
  label: string
  size?: 'sm' | 'md' | 'none'
}

/**
 * `none` hands the box to the caller, and exists so nobody has to fight the
 * component for it.
 *
 * Passing `h-9` through `className` while `SIZES` still emits `h-10` leaves two
 * declarations of one property on one element, and CSS resolves that by source
 * order in the generated stylesheet — not by the order they appear in the class
 * attribute. It works or it doesn't depending on how Tailwind happened to sort
 * that build. `AppHeader` uses this to let one row own the height of every
 * control in it.
 */
const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  none: '',
} as const

export function IconButton({
  children,
  label,
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-border-hairline bg-surface text-ink transition-colors hover:bg-track disabled:pointer-events-none disabled:opacity-40 ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
