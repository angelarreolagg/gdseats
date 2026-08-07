const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currency.format(value)
}

/** For axis ticks, where $12.5K beats $12,500. */
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

/** 0.087 → "9%". Unsigned; use formatSignedPercent when direction matters. */
export function formatPercent(fraction: number): string {
  return `${Math.round(Math.abs(fraction) * 100)}%`
}

/** -0.124 → "-12%", 0.124 → "+12%". */
export function formatSignedPercent(fraction: number): string {
  const rounded = Math.round(fraction * 100)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded)}%`
}
