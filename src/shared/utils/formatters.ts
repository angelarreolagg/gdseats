import { getIntlLocale } from '@/shared/i18n'

/**
 * Every formatter here reads the active locale from the i18n singleton rather
 * than taking it as a parameter.
 *
 * That is the whole reason ~30 call sites still say `formatCurrency(value)` with
 * no second argument, and the reason services can call these without holding a
 * React hook — i18next's core is not React. The optional `locale` parameter is
 * for tests that need to pin one explicitly.
 *
 * **The formatting locale is not the UI locale.** `es` formats as `es-MX`
 * (`1,234.56`), because `es-ES` would print `1.234,56` and every price on the
 * page would change meaning without changing a digit. See `i18n/locales.ts`.
 *
 * Instances are memoised per locale — constructing an `Intl.NumberFormat` is
 * comparatively expensive, and `ListingRow` renders ~170 of them per screen.
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

/**
 * **The currency is always USD, in every locale.** Only the formatting changes.
 *
 * These are US dollars for a US product, so a Brazilian visitor sees `US$ 23.550`
 * and a Japanese one `$23,550` — the same money, written the way each reader
 * expects to see a foreign currency. There is deliberately no conversion and no
 * currency picker; either would invent an exchange rate for a demo whose prices
 * are already invented.
 */
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
 * Plain counts — listing totals, mostly.
 *
 * Exists so nobody reaches for a bare `toLocaleString()`. With no argument that
 * reads the *browser's* locale rather than the app's, so a Spanish UI in a US
 * browser would group its numbers one way in the toolbar and another in a price
 * three lines below, with nothing to explain the difference.
 */
export function formatCount(value: number, locale: string = getIntlLocale()): string {
  return numberFormat('count', locale, {}).format(value)
}

/**
 * "$23,550" → 23550. Strips everything that isn't a digit, so a pasted
 * "$23,550.00", a typed "23 550" and a Brazilian "US$ 23.550" all land on the
 * same number.
 *
 * **NFKC first, and that is not cosmetic.** A Japanese IME in full-width mode
 * produces `２３５５０`, which `\D` classifies as non-digits and strips
 * entirely — the offer field would silently clear itself as the user typed, on
 * the one locale where it is hardest for us to notice. Normalising folds the
 * full-width forms back to ASCII before anything is removed.
 *
 * **This only holds while `maximumFractionDigits` is 0.** If cents are ever
 * introduced, "$23,550.75" becomes 2355075 — a silent ×100 — and this function
 * needs to learn about the decimal separator, which is itself locale-dependent.
 */
export function parseCurrencyInput(raw: string): number {
  const digits = raw.normalize('NFKC').replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/**
 * 0.087 → "9%". Unsigned; use formatSignedPercent when direction matters.
 *
 * Deliberately not `Intl.NumberFormat`'s percent style. All four locales write
 * the sign as `%` against a Latin numeral, so `Intl` would buy nothing here and
 * would introduce a locale-dependent space before the symbol that the chips —
 * which are `whitespace-nowrap` inside a fixed row — have no room for.
 */
export function formatPercent(fraction: number): string {
  return `${Math.round(Math.abs(fraction) * 100)}%`
}

/**
 * -0.124 → "−12%", 0.124 → "+12%".
 *
 * The sign is built by hand rather than with `signDisplay: 'always'`, and stays
 * that way: `Intl` emits a locale-specific minus, so the rendered glyph would
 * change between locales for a figure that sits in a `tabular-nums` column
 * beside figures that do not.
 */
export function formatSignedPercent(fraction: number): string {
  const rounded = Math.round(fraction * 100)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded)}%`
}

/**
 * A publication or price-history date, with the year: "Mar 14, 2026" /
 * "14 mar 2026" / "2026/03/14".
 *
 * `timeZone: 'UTC'` because the generator builds these with `Date.UTC` and they
 * are calendar dates, not instants — without it a reader west of Greenwich sees
 * every listing published a day earlier than the row above says it was.
 */
export function formatListingDate(ms: number, locale: string = getIntlLocale()): string {
  return dateFormat('listingDate', locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms)
}

/**
 * The same date without the year, for insight bullets — "Jul 22, 2026" reads
 * long inside a line that already carries a figure.
 *
 * This replaced a `date.split(',')[0]`, which was an assumption about US comma
 * placement and produced nonsense in three of the four locales: `es` and `pt-BR`
 * have no comma to split on, and `ja` writes the year first, so the "short" form
 * would have been the year alone.
 */
export function formatShortDate(ms: number, locale: string = getIntlLocale()): string {
  return dateFormat('shortDate', locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(ms)
}
