import { useEffect, useId, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
import { LOCALES, type Locale } from '../i18n/locales'
import { LOCALE_FLAG } from './localeFlagPresentation'

interface LanguageSwitchProps {
  className?: string
}

/**
 * The language picker, hand-rolled on the model of `TeamSearchCombobox` — the
 * only Radix package here is the tooltip.
 *
 * Declares no height: `AppHeader`'s row owns it, as it does for every control
 * there. The trigger shows a flag plus the two-letter code, never the endonym —
 * the full names would spend the slack the wordmark's `truncate` needs at 350px.
 * The flag mirrors `ThemeToggle`'s pattern of the glyph reflecting current state,
 * rather than a generic globe that says nothing about which language is active.
 *
 * The panel renders inside the header's `dark` subtree, so it resolves dark
 * tokens on a light page. That is intentional, and it uses the same tokens as
 * the team combobox's listbox so it needs no `dark:` variant.
 */
export function LanguageSwitch({ className = '' }: LanguageSwitchProps) {
  const { t } = useTranslation('common')
  const { locale, setLocale } = useLanguage()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      LOCALES.findIndex((entry) => entry.code === locale),
    ),
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = LOCALES[activeIndex]
  const current = LOCALES.find((entry) => entry.code === locale) ?? LOCALES[0]
  const CurrentFlag = LOCALE_FLAG[current.code]

  // A document listener rather than `onBlur`: focus moves into the list on
  // keyboard use, and a blur handler would close it the moment it was navigated.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function choose(next: Locale) {
    setLocale(next)
    setOpen(false)
    // Focus returns to the trigger, or the next Tab restarts from the top of the page.
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (index + step + LOCALES.length) % LOCALES.length)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (!open) return // Let the button's own click handler open it.
      event.preventDefault()
      choose(active.code)
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* No height and `whitespace-nowrap`, both for the same reason as `DemoMarker`. */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={t('language.change')}
        onClick={() => {
          setOpen((current) => !current)
          setActiveIndex(Math.max(0, LOCALES.findIndex((entry) => entry.code === locale)))
        }}
        className="inline-flex h-full shrink-0 items-center gap-1.5 rounded-xl border border-border-hairline bg-surface px-2.5 text-xs font-semibold whitespace-nowrap text-ink transition-colors hover:bg-track sm:text-sm"
      >
        <CurrentFlag
          aria-hidden="true"
          className="h-3 w-4 shrink-0 rounded-[2px] border border-border-hairline/60"
        />
        {current.short}
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('language.listLabel')}
          className="absolute right-0 z-40 mt-2 min-w-40 rounded-xl border border-border-hairline bg-surface py-1 shadow-lg"
        >
          {LOCALES.map((entry, index) => {
            const Flag = LOCALE_FLAG[entry.code]
            return (
              <li
                key={entry.code}
                role="option"
                aria-selected={entry.code === locale}
                /* The classic hand-built-listbox bug: the panel closes on an outside
                   pointerdown and a click fires pointerdown first. Suppressing the default
                   keeps focus off the `<li>` so the trigger still holds it when `choose` runs. */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(entry.code)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  index === activeIndex ? 'bg-track text-ink' : 'text-ink'
                }`}
              >
                {/* The check holds its slot either way, so the flags keep one left edge. */}
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {entry.code === locale ? (
                    <Check aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                  ) : null}
                </span>

                <Flag
                  aria-hidden="true"
                  className="h-3 w-4 shrink-0 rounded-[2px] border border-border-hairline/60"
                />

                <span className="font-medium">{entry.endonym}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
