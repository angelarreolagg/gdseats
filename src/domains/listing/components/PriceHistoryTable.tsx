import { TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatListingDate, formatPercent } from '@/shared/utils/formatters'
import type { PriceHistoryEntry } from '../types/listing.types'

interface PriceHistoryTableProps {
  history: PriceHistoryEntry[]
}

/**
 * DIRECTION convention, not verdict convention: red means the number fell, green
 * means it rose — the financial reading, matching the reference site.
 *
 * This is the opposite of the AI panel's badge, where green means "good buy". The
 * two coexist because they answer different questions: this column reports what
 * happened, the badge advises what to do. The insight bullets between them carry
 * no colour at all, which is what keeps the boundary legible.
 *
 * Direction never rides on colour alone — the arrow icon plus an sr-only word
 * carry it, which matters most here: red vs green is the app's CVD-worst pair
 * (ΔE 1.2 under deuteranopia in light mode).
 */
function ChangeBadge({ change }: { change: number }) {
  const { t } = useTranslation('listing')
  const fell = change < 0
  const Icon = fell ? TrendingDown : TrendingUp

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${
        fell
          ? 'border-over/40 bg-over/10 text-over'
          : 'border-good/40 bg-good/10 text-good'
      }`}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      <span className="sr-only">{fell ? t('history.fell') : t('history.rose')} </span>
      {/* The arrow carries the sign, so the figure stays unsigned. */}
      {formatPercent(change)}
    </span>
  )
}

export function PriceHistoryTable({ history }: PriceHistoryTableProps) {
  const { t } = useTranslation('listing')
  // Newest first, the way a listing page reads.
  const rows = [...history].reverse()

  return (
    <div>
      <table className="w-full text-sm">
        <caption className="sr-only">{t('history.caption')}</caption>
        <thead>
          <tr className="border-b border-border-hairline text-xs text-muted">
            <th scope="col" className="py-2.5 text-left font-medium">
              {t('history.date')}
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              {t('history.totalPrice')}
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              {t('history.pricePerSeat')}
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              {t('history.change')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => (
            <tr
              key={`${entry.dateMs}-${index}`}
              className="border-b border-border-hairline/60 last:border-0"
            >
              <td className="py-2.5 text-ink">{formatListingDate(entry.dateMs)}</td>
              <td className="py-2.5 text-right text-ink tabular-nums">
                {formatCurrency(entry.totalPrice)}
              </td>
              <td className="py-2.5 text-right text-ink tabular-nums">
                {formatCurrency(entry.pricePerSeat)}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {entry.changePercent === null ? (
                  <span className="text-muted">--</span>
                ) : (
                  <ChangeBadge change={entry.changePercent} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-muted">{t('history.footnote')}</p>
    </div>
  )
}
