/**
 * The four locales and their identifiers.
 *
 * `code` resolves bundles, fills `<html lang>` and is stored; `intlLocale`
 * constructs `Intl` formatters. `es` formats as `es-MX` — `es-ES` would print
 * `1.234,56` and every price would change meaning without changing a digit.
 *
 * **Endonyms are never translated**: someone who landed on Japanese by accident
 * still has to find "English" in the list.
 *
 * `country` is an ISO 3166-1 alpha-2 code, read only by
 * `components/localeFlagPresentation.ts` to pick a flag glyph for the picker.
 * A flag marks a country, not a language — a real mismatch for `es`, which is
 * spoken well beyond Mexico — but this file already made that exact judgment
 * call once for number formatting (`es-MX`), so the flag reuses it rather than
 * disagreeing with itself.
 *
 * `as const` plus an indexed type, not an enum — `erasableSyntaxOnly` is on.
 */
export const LOCALES = [
  { code: 'en', intlLocale: 'en-US', endonym: 'English', short: 'EN', country: 'US' },
  { code: 'es', intlLocale: 'es-MX', endonym: 'Español', short: 'ES', country: 'MX' },
  { code: 'pt-BR', intlLocale: 'pt-BR', endonym: 'Português', short: 'PT', country: 'BR' },
  { code: 'ja', intlLocale: 'ja-JP', endonym: '日本語', short: 'JA', country: 'JP' },
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
