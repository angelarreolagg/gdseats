import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from './locales'

/**
 * Detection and persistence, hand-rolled rather than pulling in
 * `i18next-browser-languagedetector` — the theme already does exactly this.
 */

/** Every `localStorage` read is guarded — Safari private mode throws outright. */
export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

/** Prefix-matched: `pt` of any flavour lands on the only Portuguese bundle. */
function matchNavigatorLanguage(): Locale | null {
  const candidates =
    typeof navigator === 'undefined'
      ? []
      : [...(navigator.languages ?? []), navigator.language].filter(Boolean)

  for (const raw of candidates) {
    const tag = raw.toLowerCase()
    if (tag.startsWith('pt')) return 'pt-BR'
    if (tag.startsWith('es')) return 'es'
    if (tag.startsWith('ja')) return 'ja'
    if (tag.startsWith('en')) return 'en'
  }
  return null
}

/** Stored choice wins over the browser's, which wins over English. */
export function resolveInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return readStoredLocale() ?? matchNavigatorLanguage() ?? DEFAULT_LOCALE
}

/**
 * `<html lang>` drives `:lang()`, screen-reader pronunciation and CJK font
 * fallback. Called from the `languageChanged` listener, not the switcher.
 */
export function persistLocale(code: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code)
  } catch {
    // Persistence is a nicety; the switch still works for this session.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
