import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

type IconButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode
  label: string
  size?: 'sm' | 'md'
}

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
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
