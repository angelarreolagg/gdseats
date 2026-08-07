import { useMemo } from 'react'
import { motion } from 'motion/react'
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
 * Embeddable verdict widget for a listing detail page.
 *
 * HEIGHT BUDGET — this must not outgrow the host's "Make an offer" card (~330px
 * at ~350px wide). Current spend, at 16px padding:
 *
 *   header 20 · status 32 · metrics 44 · recommendation 32 · insights 54
 *   + 5 gaps @ 12px + 32px padding  ≈  274px
 *
 * That leaves ~55px of headroom. Anything added here spends against it — if a new
 * band is needed, something else has to give.
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
      className={`rounded-xl border border-border-hairline bg-surface p-4 shadow-card ${className}`}
    >
      <header className="mb-3 flex items-center gap-2">
        {/* The brand green appears only as a thin accent here — the host page's
            Submit button owns the one solid green block. */}
        <span aria-hidden="true" className="text-accent-ink">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M8 0.5l1.6 4.3 4.4 1.6-4.4 1.6L8 12.3 6.4 8 2 6.4l4.4-1.6L8 .5ZM13 10.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
          </svg>
        </span>
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
