import { motion } from 'motion/react'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-hairline bg-surface text-ink transition-colors hover:bg-track"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4.5 w-4.5">
        {isDark ? (
          <path
            d="M16 11.4A6.2 6.2 0 1 1 8.6 4a5.2 5.2 0 0 0 7.4 7.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.4" />
            <path d="M10 2.4v1.8M10 15.8v1.8M17.6 10h-1.8M4.2 10H2.4M15.4 4.6l-1.3 1.3M5.9 14.1l-1.3 1.3M15.4 15.4l-1.3-1.3M5.9 5.9 4.6 4.6" />
          </g>
        )}
      </svg>
    </motion.button>
  )
}
