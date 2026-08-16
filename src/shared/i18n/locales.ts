/**
 * The four locales and their two identifiers.
 *
 * `code` resolves bundles, fills `<html lang>` and is stored; `intlLocale`
 * constructs `Intl` formatters. `es` formats as `es-MX` — `es-ES` would print
 * `1.234,56` and every price would change meaning without changing a digit.
 *
 * **Endonyms are never translated**: someone who landed on Japanese by accident
 * still has to find "English" in the list.
 *
 * `as const` plus an indexed type, not an enum — `erasableSyntaxOnly` is on.
 */
export const LOCALES = [
  { code: 'en', intlLocale: 'en-US', endonym: 'English', short: 'EN' },
  { code: 'es', intlLocale: 'es-MX', endonym: 'Español', short: 'ES' },
  { code: 'pt-BR', intlLocale: 'pt-BR', endonym: 'Português', short: 'PT' },
  { code: 'ja', intlLocale: 'ja-JP', endonym: '日本語', short: 'JA' },
] as const

export type Locale = (typeof LOCALES)[number]['code']

export const LOCALE_CODES: readonly Locale[] = LOCALES.map((locale) => locale.code)

export const DEFAULT_LOCALE: Locale = 'en'

/** Mirrors `psl-theme`; both are read by the pre-paint script in index.html. */
export const LOCALE_STORAGE_KEY = 'psl-lang'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value)
}

/** The Intl locale for a UI code. Never inline this mapping at a call site. */
export function intlLocaleFor(code: Locale): string {
  return LOCALES.find((locale) => locale.code === code)?.intlLocale ?? 'en-US'
}
