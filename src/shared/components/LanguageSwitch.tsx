import { useEffect, useId, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
import { LOCALES, type Locale } from '../i18n/locales'

interface LanguageSwitchProps {
  className?: string
}

/**
 * The language picker, hand-rolled on the model of `TeamSearchCombobox`.
 *
 * The only Radix package in this repo is the tooltip; the combobox, the dialog,
 * the sheet, the accordion and the league switch are all hand-built, and a
 * listbox is four ARIA attributes and an arrow-key loop. Adding a dependency for
 * this one would be the odd choice, not the safe one.
 *
 * **The trigger declares no height, and must not.** `AppHeader`'s right-hand
 * group is `flex h-9 items-stretch sm:h-10` and owns the height of everything in
 * it — that is why `ThemeToggle` takes `size="none"`. Three controls with three
 * independent heights is exactly the bug that row was built to make impossible,
 * and `AppHeader.test.tsx` pins it.
 *
 * **The trigger shows the two-letter code, never the endonym.** "Português" in a
 * bar that already carries a wordmark, a theme toggle and a demo pill is what
 * pushes the row past what the wordmark's `truncate` can absorb at 350px. The
 * full names live in the open panel, where there is room for them — and they are
 * never translated, so someone who landed on Japanese by accident can still find
 * "English".
 *
 * **The panel resolves DARK tokens in both themes, and that is intentional.**
 * `AppHeader` carries a `dark` class to keep its bright-green mark legible, the
 * theme is nothing but custom properties scoped to `.dark`, and this popover
 * renders inside that subtree — so it inherits the dark palette even on a light
 * page. A dark menu hanging off a dark bar is how navigation menus normally
 * behave. It uses the same `bg-surface` / `border-border-hairline` / `text-ink`
 * tokens as the team combobox's listbox, so it needs no `dark:` utility (there
 * are deliberately none in components) and looks deliberate either way.
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

  // A pointerdown anywhere outside closes the panel. This is a document listener
  // rather than an `onBlur` on the trigger because focus moves *into* the list on
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
    // Focus goes back where the user left it. Without this it lands on <body>
    // and the next Tab restarts from the top of the page.
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
      {/* No `h-*` and no `py-*`: the header row owns the box. `whitespace-nowrap`
          for the same reason `DemoMarker` has it — a two-line label inside a
          row-sized control mangles the bar. */}
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
        <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
        {current.short}
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('language.listLabel')}
          className="absolute right-0 z-40 mt-2 min-w-40 rounded-xl border border-border-hairline bg-surface py-1 shadow-lg"
        >
          {LOCALES.map((entry, index) => (
            <li
              key={entry.code}
              role="option"
              aria-selected={entry.code === locale}
              /*
               * The classic hand-built-listbox bug, already documented on
               * `TeamSearchCombobox`: the panel closes on an outside pointerdown,
               * and a click fires pointerdown first. Suppressing the default here
               * is not what saves it — the outside check is — but it keeps focus
               * off the `<li>` so the trigger still holds it when `choose` runs.
               */
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(entry.code)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                index === activeIndex ? 'bg-track text-ink' : 'text-ink'
              }`}
            >
              {/* The check occupies its slot either way, so the endonyms stay on
                  one left edge instead of shifting as the selection moves. */}
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {entry.code === locale ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                ) : null}
              </span>
              {/* Endonyms, never translated — see the note on LOCALES. */}
              <span className="font-medium">{entry.endonym}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
