/**
 * The four locales, and the two different identifiers each one carries.
 *
 * **`code` and `intlLocale` are not the same thing, and conflating them is the
 * quietest bug available here.** `code` is what i18next resolves bundles with,
 * what `localStorage` holds and what `<html lang>` advertises. `intlLocale` is
 * what `Intl.NumberFormat` and `Intl.DateTimeFormat` are constructed with, and
 * it is qualified even where the UI code is not:
 *
 *  - `es` is unqualified because the copy targets US/LatAm Spanish generally,
 *    but it formats as `es-MX` — `1,234.56` grouping, which is what that
 *    audience reads. Falling back to `es-ES` would print `1.234,56` and every
 *    price on the page would change meaning without changing a digit.
 *  - `pt-BR` is qualified in both, because pt-PT and pt-BR diverge in vocabulary
 *    far enough to read as wrong to a speaker of the other.
 *
 * **The endonyms are never translated.** Someone who landed on Japanese by
 * accident and cannot read Japanese still has to be able to find "English" in
 * the list — a language picker written in the language you cannot read is a
 * trap, not a control.
 *
 * `as const` plus an indexed access type rather than an enum: `erasableSyntaxOnly`
 * is on in `tsconfig.app.json`, and an enum emits real code. Same shape
 * `FAQ_CATEGORIES` and `SortKey` already use.
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
