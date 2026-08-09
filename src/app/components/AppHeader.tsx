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
 *
 * Note the absence of any `py-*` or `h-*`: the row below owns the height. See the
 * comment there.
 */
function DemoMarker() {
  return (
    <Tooltip content="All data is mocked — no real listings or transactions" side="bottom">
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center whitespace-nowrap rounded-xl bg-accent px-3 text-xs font-semibold tracking-tight text-on-accent shadow-raised sm:px-4 sm:text-sm"
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
      {/*
       * Same container as every other band in the shell — `mx-auto max-w-7xl`
       * with `px-5 sm:px-8`, matching `AppFooter` and `TeamsHero`. The bar used
       * to be full-bleed on its own `px-4 sm:px-6`, which read as cramped against
       * the screen edge on a phone and, on a wide window, drifted out of line
       * with the content below it: the page settles into a centred 80rem column
       * and the header did not, so the logo and the controls hugged the viewport
       * while everything under them stopped short.
       *
       * `justify-between` states the two-end layout outright. It replaced an
       * `ml-auto` on the control group, which achieved the same thing as a side
       * effect of a margin and left the row's intent readable only from a child.
       */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-7 py-2.5 sm:gap-6 sm:px-8 sm:py-3">
        <Tooltip content="Gridiron &amp; Diamond Seats" side="bottom">
          <button
            type="button"
            onClick={onHome}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label="G&D Seats home"
          >
            <img src="/logo-mark.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            {/*
             * The wordmark is the ONE thing in this bar allowed to give way.
             *
             * `DemoMarker` must never wrap — two lines of text inside a pill sized
             * by the row breaks the header outright — so it is `whitespace-nowrap`
             * and the group below is `shrink-0`. That makes the brand the only
             * flexible item left, which is the right priority: the mark beside it
             * still identifies the product, and an ellipsis only ever appears on a
             * width where something had to. `min-w-0` on the button is what lets
             * `truncate` engage at all — a flex item's default `min-width: auto`
             * refuses to shrink below its content and the overflow would land on
             * the page instead.
             */}
            <span className="truncate text-base font-semibold tracking-tight text-ink">
              G&amp;D Seats
            </span>
          </button>
        </Tooltip>

        {/*
         * The ROW owns the height, and neither control declares one.
         *
         * They used to: the toggle took `h-10` from IconButton's `md` size and the
         * marker was sized by its own `py-*` and font, which came out ~32px on
         * mobile and 40px at `sm`. Two independent sources for one shared height,
         * so they disagreed at one breakpoint and would have drifted again at the
         * next restyle.
         *
         * `items-stretch` plus a height here means they cannot disagree at any
         * width — which is what "the same size no matter the size" actually
         * requires. The toggle stays square with `aspect-square` rather than a
         * matching `w-*`, so it tracks the row automatically too.
         */}
        {/* `shrink-0`: these two are fixed and the brand absorbs any shortfall —
            see the wordmark above. The row's `justify-between` is what puts this
            group at the far end. */}
        <div className="flex h-9 shrink-0 items-stretch gap-2 sm:h-10 sm:gap-3">
          <ThemeToggle size="none" className="aspect-square rounded-xl" />
          <DemoMarker />
        </div>
      </div>
    </header>
  )
}
