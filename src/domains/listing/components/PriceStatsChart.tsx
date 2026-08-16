import { Trans, useTranslation } from 'react-i18next'
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/formatters'
import type { Listing } from '../types/listing.types'

interface PriceStatsChartProps {
  /** Every listing in the same section, this one included. */
  sectionListings: Listing[]
  listing: Listing
}

const CHART = { width: 520, height: 150, padTop: 22, padBottom: 26 }
const MAX_BAR_WIDTH = 24
const GAP = 2

/**
 * Where this listing sits among its section. An EMPHASIS chart: the listing
 * takes the accent and every peer recedes, because the question is "where does
 * mine land". The history table above is the table-view twin.
 */
export function PriceStatsChart({ sectionListings, listing }: PriceStatsChartProps) {
  const { t } = useTranslation('listing')
  const sorted = [...sectionListings].sort((a, b) => a.pricePerSeat - b.pricePerSeat)
  if (sorted.length === 0) return null

  const prices = sorted.map((item) => item.pricePerSeat)
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const plotHeight = CHART.height - CHART.padTop - CHART.padBottom
  const baseline = CHART.height - CHART.padBottom

  const slot = CHART.width / sorted.length
  const barWidth = Math.min(MAX_BAR_WIDTH, Math.max(4, slot - GAP))

  // Anchored below the cheapest rather than at zero, or a section whose prices
  // cluster would flatten.
  const floor = Math.max(0, min - (max - min) * 0.35 - 1)
  const scale = (value: number) =>
    max === floor ? plotHeight : ((value - floor) / (max - floor)) * plotHeight

  const highlightIndex = sorted.findIndex((item) => item.id === listing.id)
  const cheaperCount = highlightIndex

  return (
    <div>
      <p className="text-sm text-muted">{t('stats.intro')}</p>

      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="mt-4 h-40 w-full"
        role="img"
        aria-label={t('stats.chartLabel', {
          cheaperThan: sorted.length - cheaperCount - 1,
          peers: sorted.length - 1,
          section: listing.section,
        })}
      >
        {sorted.map((item, index) => {
          const isHighlight = index === highlightIndex
          const barHeight = Math.max(2, scale(item.pricePerSeat))
          const x = index * slot + (slot - barWidth) / 2

          return (
            <rect
              key={item.id}
              x={x}
              y={baseline - barHeight}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill={isHighlight ? 'var(--psl-accent-mark)' : 'var(--psl-seat)'}
            />
          )
        })}

        {/* Direct-label the one bar that matters; the rest are context. */}
        {highlightIndex >= 0 ? (
          <text
            x={Math.min(
              CHART.width - 40,
              Math.max(28, highlightIndex * slot + slot / 2),
            )}
            y={baseline - scale(sorted[highlightIndex].pricePerSeat) - 8}
            textAnchor="middle"
            fill="var(--psl-ink)"
            fontSize="12"
            fontWeight="600"
          >
            {formatCompactCurrency(sorted[highlightIndex].pricePerSeat)}
          </text>
        ) : null}

        {/* Solid hairline baseline. */}
        <line
          x1="0"
          y1={baseline}
          x2={CHART.width}
          y2={baseline}
          stroke="var(--psl-grid)"
          strokeWidth="1"
        />

        <text x="0" y={CHART.height - 8} fill="var(--psl-muted)" fontSize="11">
          {formatCompactCurrency(min)}
        </text>
        <text
          x={CHART.width}
          y={CHART.height - 8}
          textAnchor="end"
          fill="var(--psl-muted)"
          fontSize="11"
        >
          {formatCompactCurrency(max)}
        </text>
      </svg>

      <p className="mt-1 text-xs text-muted">
        {sorted.length === 1 ? (
          t('stats.onlyListing', { section: listing.section })
        ) : (
          /* `<Trans>` with NAMED components: the emphasised runs sit in different places
                       in different languages, and indexed tags would reorder the markup. */
          <Trans
            i18nKey="listing:stats.comparison"
            values={{
              cheaperThan: sorted.length - cheaperCount - 1,
              peers: sorted.length - 1,
              section: listing.section,
              average: formatCurrency(listing.sectionAveragePerSeat),
            }}
            components={{
              rank: <span className="font-medium text-ink" />,
              average: <span className="font-medium text-ink tabular-nums" />,
            }}
          />
        )}
      </p>
    </div>
  )
}
