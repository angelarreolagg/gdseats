import { Moon, Sun } from 'lucide-react'
import { IconButton } from './IconButton'
import { useTheme } from '../hooks/useTheme'

interface ThemeToggleProps {
  /** Forwarded to the button. Pair with `size="none"` to own the box yourself. */
  className?: string
  size?: 'sm' | 'md' | 'none'
}

export function ThemeToggle({ className = 'rounded-xl', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <IconButton
      label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      size={size}
      className={className}
    >
      {isDark ? (
        <Moon aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Sun aria-hidden="true" className="h-4 w-4" />
      )}
    </IconButton>
  )
}
