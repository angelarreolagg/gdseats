import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/shared/components/LanguageSwitch'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { Tooltip } from '@/shared/components/Tooltip'
import { SITE_NAME } from '@/shared/config/site'

interface AppHeaderProps {
  onHome: () => void
}

/**
 * A static marker, not a `<button>`: it wears the primary button's weight but a
 * button that does nothing is a lie, on the one element whose job is honesty
 * about what this app is. No `py-*`/`h-*` — the row owns the height.
 */
function DemoMarker() {
  const { t } = useTranslation('header')

  return (
    <Tooltip content={t('demoTooltip')} side="bottom">
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center whitespace-nowrap rounded-xl bg-accent px-3 text-xs font-semibold tracking-tight text-on-accent shadow-raised sm:px-4 sm:text-sm"
      >
        {/* Kept short in every locale: the pill is `whitespace-nowrap` and sized by the
            row, so a long translation pushes the row past what the wordmark can absorb. */}
        {t('demoMarker')}
      </span>
    </Tooltip>
  )
}

/**
 * Keeps the DARK palette in both themes: the brand mark is a fixed bright-green
 * seat at 1.33:1 on white, so a light bar would swallow it. The `dark` class is
 * the whole mechanism, since the theme is only custom properties.
 */
export function AppHeader({ onHome }: AppHeaderProps) {
  const { t } = useTranslation('header')

  return (
    <header className="dark sticky top-0 z-30 border-b border-border-hairline bg-page/90 backdrop-blur">
      {/* FULL-BLEED — the one band in the shell that is. A nav bar is the frame of
          the page, so it belongs to the window, not the centred text column; at
          1920px an 80rem container left ~320px dead at each end. Padding is
          unchanged, which is what keeps phones identical — below 80rem the container
          never bit. */}
      <div className="flex items-center justify-between gap-3 px-7 py-2.5 sm:gap-6 sm:px-8 sm:py-3">
        {/* Brand name and expansion are proper nouns; only the words around them. */}
        <Tooltip content={t('brandExpanded')} side="bottom">
          <button
            type="button"
            onClick={onHome}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label={t('home')}
          >
            <img src="/logo-mark.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            {/* The one item allowed to give way: `DemoMarker` must not wrap and the group
                is `shrink-0`, so the brand absorbs the shortfall. `min-w-0` is what lets
                `truncate` engage — a flex item will not shrink below its content without
                it, and the overflow lands on the page instead. */}
            <span className="truncate text-base font-semibold tracking-tight text-ink">
              {SITE_NAME}
            </span>
          </button>
        </Tooltip>

        {/* The ROW owns the height; no control declares one. Two independent sources
            disagreed by 8px on mobile. `items-stretch` plus a height here means they
            cannot differ at any width. `DemoMarker` stays last — it is the accent
            pill and the terminus of the bar. */}
        <div className="flex h-9 shrink-0 items-stretch gap-2 sm:h-10 sm:gap-3">
          <LanguageSwitch />
          <ThemeToggle size="none" className="aspect-square rounded-xl" />
          <DemoMarker />
        </div>
      </div>
    </header>
  )
}
