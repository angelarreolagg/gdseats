import { Button } from '@/shared/components/Button'
import { ThemeToggle } from '@/shared/components/ThemeToggle'

interface AppHeaderProps {
  onHome: () => void
}

/** Nav chrome. Only the logo navigates; the rest sets the scene. */
function NavItem({ label }: { label: string }) {
  return (
    <span className="hidden items-center gap-1 text-sm text-muted lg:inline-flex">
      {label}
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M6 8l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function AppHeader({ onHome }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-hairline bg-page/90 backdrop-blur">
      <div className="flex items-center gap-6 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex shrink-0 items-center gap-2"
          aria-label="PSL Scout home"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-accent-ink">
            <path
              d="M4 17.5 11 4l2.2 4.4L6.2 21 4 17.5ZM12.5 17.5 19.5 4l2.2 4.4L14.7 21l-2.2-3.5Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-sm leading-none font-semibold tracking-tight text-ink">
            psl
            <br />
            scout
          </span>
        </button>

        <nav className="flex items-center gap-5">
          <NavItem label="NFL Teams" />
          <NavItem label="MLB Teams" />
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NavItem label="Buy" />
          <NavItem label="Sell" />
          <ThemeToggle />
          <button
            type="button"
            className="hidden rounded-xl border border-border-hairline px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-track sm:inline-flex"
          >
            Sign in
          </button>
          <Button type="button" className="px-4 py-2.5">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  )
}
