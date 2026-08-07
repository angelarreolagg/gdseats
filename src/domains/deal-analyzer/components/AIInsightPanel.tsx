import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { formatCurrency, formatSignedPercent } from '@/shared/utils/formatters'
import type { ListingSignals } from '../types/deal.types'
import { evaluateDeal } from '../services/pricing.service'
import { generateInsights } from '../services/insights.service'
import { STATUS_PRESENTATION } from './statusPresentation'
import { StatusBadge } from './StatusBadge'
import { KeyMetrics } from './KeyMetrics'
import { Recommendation } from './Recommendation'
import { InsightsList } from './InsightsList'

interface AIInsightPanelProps {
  signals: ListingSignals
  className?: string
}

/**
 * The verdict block, sitting directly under the seat map in the listing detail.
 *
 * It used to live in the right-hand column between the summary and "Make an
 * offer", which put analysis in the middle of the offer flow it was meant to
 * support. Under the map it reads as part of understanding the seat, and the
 * right column runs summary → offer uninterrupted.
 *
 * (An earlier version was budgeted to ~274px so it would not outgrow the offer
 * card beside it. That constraint died with the move — this is now a full-width
 * block and spacing is free to breathe.)
 *
 * All arithmetic lives in the services; this component only formats and arranges.
 */
export function AIInsightPanel({ signals, className = '' }: AIInsightPanelProps) {
  const { listingPrice, estimatedPrice } = signals

  const verdict = useMemo(
    () => evaluateDeal(listingPrice, estimatedPrice),
    [listingPrice, estimatedPrice],
  )
  const insights = useMemo(() => generateInsights(signals), [signals])
  const presentation = STATUS_PRESENTATION[verdict.status]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="ai-insight-heading"
      className={`holo-ring rounded-xl border border-border-hairline bg-surface p-4 shadow-card ${className}`}
    >
      <header className="mb-3 flex items-center gap-2">
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-accent-ink" strokeWidth={2.5} />
        <h2
          id="ai-insight-heading"
          className="text-xs font-semibold tracking-wide text-ink uppercase"
        >
          AI Insight
        </h2>
        <span className="ml-auto text-[10px] font-medium tracking-wide text-muted uppercase">
          Beta
        </span>
      </header>

      <div className="flex flex-col gap-3">
        <StatusBadge
          status={verdict.status}
          formattedDiff={formatSignedPercent(verdict.percentageDiff)}
        />

        <KeyMetrics
          estimatedPrice={formatCurrency(estimatedPrice)}
          listingPrice={formatCurrency(listingPrice)}
          difference={formatSignedPercent(verdict.percentageDiff)}
          differenceInk={presentation.ink}
        />

        <div className="border-t border-border-hairline pt-3">
          <Recommendation value={verdict.recommendation} status={verdict.status} />
        </div>

        <InsightsList insights={insights} />
      </div>
    </motion.section>
  )
}
