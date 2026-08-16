import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from './locales'

/**
 * Detection and persistence, hand-rolled rather than pulled from
 * `i18next-browser-languagedetector`.
 *
 * That plugin is ~4 KB to read `localStorage` and `navigator.language`, and this
 * repo already hand-rolls exactly that logic for the theme (`psl-theme`, in
 * `index.html` and `useTheme.ts`). Fifteen lines matching a pattern already in
 * the codebase beat a dependency that does the same thing differently.
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

/**
 * Matched by prefix, not by equality: a browser reporting `es-419`, `pt-PT` or
 * `ja-JP` should land somewhere sensible rather than falling through to English.
 * `pt` of any flavour resolves to `pt-BR`, since that is the only Portuguese
 * bundle here — a pt-PT reader gets Brazilian copy, which is far better than
 * getting none.
 */
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
 * Write the choice down and tell the document about it.
 *
 * `<html lang>` is not decoration: `:lang()` rules, screen-reader pronunciation
 * and CJK font fallback all key off it, and a Japanese page announcing itself as
 * English is read aloud in an English voice.
 *
 * Called from the `languageChanged` listener in `./index.ts` rather than from
 * the switcher, so `i18n.changeLanguage('ja')` typed into a console persists and
 * relabels the document exactly like a click does.
 */
export function persistLocale(code: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code)
  } catch {
    // Persistence is a nicety; the switch still works for this session.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
