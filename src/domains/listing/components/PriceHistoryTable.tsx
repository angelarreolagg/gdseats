import { formatCurrency, formatSignedPercent } from '@/shared/utils/formatters'
import type { PriceHistoryEntry } from '../types/listing.types'

interface PriceHistoryTableProps {
  history: PriceHistoryEntry[]
}

export function PriceHistoryTable({ history }: PriceHistoryTableProps) {
  // Newest first, the way a listing page reads.
  const rows = [...history].reverse()

  return (
    <div>
      <table className="w-full text-sm">
        <caption className="sr-only">Price history for this listing</caption>
        <thead>
          <tr className="border-b border-border-hairline text-xs text-muted">
            <th scope="col" className="py-2.5 text-left font-medium">
              Date
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              Total price*
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              Price per seat*
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => (
            <tr
              key={`${entry.date}-${index}`}
              className="border-b border-border-hairline/60 last:border-0"
            >
              <td className="py-2.5 text-ink">{entry.date}</td>
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
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      entry.changePercent < 0 ? 'bg-good/12 text-good' : 'bg-over/12 text-over'
                    }`}
                  >
                    {/* Arrow plus sign — direction is never colour-only. */}
                    <span aria-hidden="true">{entry.changePercent < 0 ? '▾' : '▴'}</span>
                    {formatSignedPercent(entry.changePercent)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-muted">
        *Historic prices do not include transfer or platform fees
      </p>
    </div>
  )
}
