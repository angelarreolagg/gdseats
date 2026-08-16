import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/shared/components/LanguageSwitch'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { Tooltip } from '@/shared/components/Tooltip'
import { SITE_NAME } from '@/shared/config/site'

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
  const { t } = useTranslation('header')

  return (
    <Tooltip content={t('demoTooltip')} side="bottom">
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center whitespace-nowrap rounded-xl bg-accent px-3 text-xs font-semibold tracking-tight text-on-accent shadow-raised sm:px-4 sm:text-sm"
      >
        {/*
         * `demoMarker` is deliberately short in every locale — "Demo" rather
         * than "Versión de demostración". The pill is sized by the row and is
         * `whitespace-nowrap`, so a faithful long translation cannot wrap; it
         * would push the row past what the wordmark's `truncate` can absorb, and
         * the overflow would land on the page as a horizontal scrollbar. Stated
         * again in locales/TRANSLATORS.md, where a translator will see it.
         */}
        {t('demoMarker')}
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
  const { t } = useTranslation('header')

  return (
    <header className="dark sticky top-0 z-30 border-b border-border-hairline bg-page/90 backdrop-blur">
      {/*
       * FULL-BLEED, and the one band in the shell that is. Every other — the
       * hero, the landing sections, the footer — settles into a centred
       * `max-w-7xl` column; this bar spans the viewport so the brand sits against
       * the left edge and the controls against the right.
       *
       * That is a deliberate trade, not an oversight. The header held the shared
       * container for a while, and on a wide window it looked like a gap rather
       * than a bar: at 1920px an 80rem column leaves ~320px of dead space at each
       * end, so the logo floated a third of the way in and the two ends of the row
       * had nothing to push against. A navigation bar reads as the frame of the
       * page, which means it belongs to the window, not to the text column.
       *
       * The cost, worth knowing before "fixing" it: the wordmark no longer lines
       * up vertically with the hero headline or the footer's first column. That is
       * the normal arrangement for a full-bleed bar over centred content, and the
       * reference site does the same.
       *
       * **Padding is unchanged, and that is what keeps phones identical.** Below
       * 80rem the old `max-w-7xl` never constrained anything, so mobile rendered
       * full-bleed already; keeping `px-7 sm:px-8` means this change is invisible
       * there and applies only where the column used to bite. The earlier
       * full-bleed attempt failed because it *also* dropped to `px-4 sm:px-6`,
       * which read as cramped against the screen edge — that was the padding's
       * fault, not the width's.
       *
       * `justify-between` states the two-end layout outright. It replaced an
       * `ml-auto` on the control group, which achieved the same thing as a side
       * effect of a margin and left the row's intent readable only from a child.
       */}
      <div className="flex items-center justify-between gap-3 px-7 py-2.5 sm:gap-6 sm:px-8 sm:py-3">
        {/* The brand name and its expansion are proper nouns and stay English in
            every locale; only the words around them are translated. */}
        <Tooltip content={t('brandExpanded')} side="bottom">
          <button
            type="button"
            onClick={onHome}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label={t('home')}
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
              {SITE_NAME}
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
        {/* Order: the two settings controls group together, and `DemoMarker`
            stays last — it is the accent pill and the visual terminus of the
            bar, so putting a bordered control after it would read as a stray. */}
        <div className="flex h-9 shrink-0 items-stretch gap-2 sm:h-10 sm:gap-3">
          <LanguageSwitch />
          <ThemeToggle size="none" className="aspect-square rounded-xl" />
          <DemoMarker />
        </div>
      </div>
    </header>
  )
}
