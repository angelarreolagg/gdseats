import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/shared/i18n'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/shared/i18n/locales'

/**
 * The write side of the language, mirroring `useTheme` / `useIsDarkTheme`:
 * **exactly one consumer, `LanguageSwitch`**. Everything else reads through
 * `useTranslation()`. Persistence lives on the `languageChanged` event.
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
