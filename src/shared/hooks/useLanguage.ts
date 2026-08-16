import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/shared/i18n'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/shared/i18n/locales'

/**
 * The write side of the language, and the exact counterpart of `useTheme`.
 *
 * `useTheme` *sets* the theme and is safe with exactly one consumer; everything
 * that only *reads* it goes through `useIsDarkTheme`. The same split applies
 * here, for the same reason:
 *
 *  - **This hook has exactly one consumer, `LanguageSwitch`.** It owns the
 *    change.
 *  - **Everything else reads through `useTranslation()`**, whose re-render is
 *    driven by i18next's own emitter. A list item calling this would be one more
 *    writer of a global that has one legitimate one.
 *
 * Anything needing the *Intl* locale rather than the UI one — the formatters —
 * reads `getIntlLocale()` off the singleton instead, so it works in services
 * that must not hold a React hook.
 *
 * Persistence is deliberately NOT here. It hangs off the `languageChanged`
 * event in `shared/i18n/index.ts`, so a change made anywhere — including a
 * console — is written down and reflected on `<html lang>`.
 */
export function useLanguage() {
  // Subscribing to any namespace is enough: `useTranslation` re-renders its
  // consumer on `languageChanged`, which is the whole point of reading it here.
  const { i18n: instance } = useTranslation()
  const locale: Locale = isLocale(instance.language) ? instance.language : DEFAULT_LOCALE

  const setLocale = useCallback((next: Locale) => {
    void i18n.changeLanguage(next)
  }, [])

  return { locale, setLocale }
}
