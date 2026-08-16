import { getIntlLocale } from '@/shared/i18n'

/**
 * Formatters read the active locale from the i18n singleton rather than taking
 * it as a parameter, so call sites stay `formatCurrency(value)` and services can
 * use them without a React hook. The optional `locale` argument is for tests.
 *
 * The formatting locale is not the UI locale: `es` formats as `es-MX`, because
 * `es-ES` would print `1.234,56`. Instances are memoised — `ListingRow` renders
 * ~170 per screen.
 */
const numberFormats = new Map<string, Intl.NumberFormat>()
const dateFormats = new Map<string, Intl.DateTimeFormat>()

function numberFormat(
  key: string,
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const cacheKey = `${key}:${locale}`
  let format = numberFormats.get(cacheKey)
  if (!format) {
    format = new Intl.NumberFormat(locale, options)
    numberFormats.set(cacheKey, format)
  }
  return format
}

function dateFormat(
  key: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const cacheKey = `${key}:${locale}`
  let format = dateFormats.get(cacheKey)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dateFormats.set(cacheKey, format)
  }
  return format
}

/** USD in every locale; only the formatting changes. No conversion, no picker. */
export function formatCurrency(value: number, locale: string = getIntlLocale()): string {
  return numberFormat('currency', locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

/** For axis ticks, where $12.5K beats $12,500. */
export function formatCompactCurrency(
  value: number,
  locale: string = getIntlLocale(),
): string {
  return numberFormat('compactCurrency', locale, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Plain counts. Exists so nobody reaches for a bare `toLocaleString()`, which
 * reads the browser's locale rather than the app's.
 */
export function formatCount(value: number, locale: string = getIntlLocale()): string {
  return numberFormat('count', locale, {}).format(value)
}

/**
 * "$23,550" → 23550. NFKC first: a Japanese IME produces full-width digits,
 * which `\D` would strip entirely and clear the field as the user typed.
 *
 * Only holds while `maximumFractionDigits` is 0 — with cents this multiplies
 * by 100.
 */
export function parseCurrencyInput(raw: string): number {
  const digits = raw.normalize('NFKC').replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/**
 * 0.087 → "9%". Not `Intl` percent style: all four locales write `%` against a
 * Latin numeral, and `Intl` adds a locale-dependent space the chips have no
 * room for.
 */
export function formatPercent(fraction: number): string {
  return `${Math.round(Math.abs(fraction) * 100)}%`
}

/**
 * -0.124 → "−12%". The sign is hand-built: `signDisplay` emits a locale-specific
 * minus, so the glyph would change between locales inside a `tabular-nums` column.
 */
export function formatSignedPercent(fraction: number): string {
  const rounded = Math.round(fraction * 100)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded)}%`
}

/**
 * "Mar 14, 2026" / "14 mar 2026" / "2026/03/14". `timeZone: UTC` because these
 * are calendar dates built with `Date.UTC`, not instants.
 */
export function formatListingDate(ms: number, locale: string = getIntlLocale()): string {
  return dateFormat('listingDate', locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms)
}

/**
 * The same date without the year, for insight bullets. Replaced a
 * `date.split(',')[0]`, which assumed US comma placement.
 */
export function formatShortDate(ms: number, locale: string = getIntlLocale()): string {
  return dateFormat('shortDate', locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(ms)
}
