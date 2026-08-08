import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { Tooltip } from '@/shared/components/Tooltip'

interface AppHeaderProps {
  onHome: () => void
}

/**
 * Rendered as a static marker, not a `<button>`.
 *
 * It wears the primary button's treatment because that is the visual weight it
 * needs, but a button that does nothing when clicked is a small lie — and this is
 * the one element on screen whose entire job is being honest about what the app
 * is. The tooltip carries the detail; `tabIndex` keeps it keyboard-reachable.
 */
function DemoMarker() {
  return (
    <Tooltip content="All data is mocked — no real listings or transactions" side="bottom">
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center rounded-xl bg-accent px-3 py-2 text-xs font-semibold tracking-tight text-on-accent shadow-raised sm:px-4 sm:py-2.5 sm:text-sm"
      >
        Demo version
      </span>
    </Tooltip>
  )
}

/**
 * The header keeps the DARK palette in both themes.
 *
 * The brand mark is a fixed bright-green seat: `#a0f700` measures 1.33:1 on
 * white, so on a light header the logo would all but disappear. Rather than ship
 * a second artwork, the bar holds the dark ground the mark was drawn for.
 *
 * The `dark` class is the whole mechanism — the theme is nothing but CSS custom
 * properties scoped to `.dark`, so every token inside this subtree resolves to
 * its dark value and the children need no special-casing. In dark mode it is a
 * no-op.
 */
export function AppHeader({ onHome }: AppHeaderProps) {
  return (
    <header className="dark sticky top-0 z-30 border-b border-border-hairline bg-page/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
        <Tooltip content="Gridiron &amp; Diamond Seats" side="bottom">
          <button
            type="button"
            onClick={onHome}
            className="flex shrink-0 items-center gap-2.5 rounded-lg"
            aria-label="G&D Seats home"
          >
            <img src="/logo-mark.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="text-base font-semibold tracking-tight text-ink">G&amp;D Seats</span>
          </button>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <DemoMarker />
        </div>
      </div>
    </header>
  )
}
