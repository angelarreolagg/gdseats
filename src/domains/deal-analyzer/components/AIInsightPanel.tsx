import { motion } from 'motion/react'
import { BrainCircuit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatSignedPercent } from '@/shared/utils/formatters'
import type { ListingSignals } from '../types/deal.types'
import { useDealAnalysis } from '../hooks/useDealAnalysis'
import { STATUS_PRESENTATION } from './statusPresentation'
import { StatusBadge } from './StatusBadge'
import { KeyMetrics } from './KeyMetrics'
import { Recommendation } from './Recommendation'
import { InsightsList } from './InsightsList'
import { AnalysisPending } from './AnalysisPending'

interface AIInsightPanelProps {
  signals: ListingSignals
  /** Override the simulated analysis latency. Tests pass 0. */
  analysisDelayMs?: number
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
export function AIInsightPanel({
  signals,
  analysisDelayMs,
  className = '',
}: AIInsightPanelProps) {
  const { t } = useTranslation('analyzer')
  const { listingPrice, estimatedPrice } = signals
  const { isAnalyzing, verdict, insights } = useDealAnalysis(signals, analysisDelayMs)
  const presentation = STATUS_PRESENTATION[verdict.status]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="ai-insight-heading"
      className={`holo-ring rounded-xl border border-border-hairline bg-surface p-4 shadow-card ${className}`}
    >
      {/* Gradient the AI mark strokes with. Zero-size and aria-hidden — it exists
          only to give `.holo-icon` something to point `stroke: url(#…)` at. */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <linearGradient id="psl-holo-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="holo-stop-a" stopColor="#a0f700" />
            <stop offset="100%" className="holo-stop-b" stopColor="#7b8cff" />
          </linearGradient>
        </defs>
      </svg>

      <header className="mb-3 flex items-center gap-2">
        <BrainCircuit
          aria-hidden="true"
          className="holo-icon h-4 w-4 text-accent-ink"
          strokeWidth={2}
        />
        <h2
          id="ai-insight-heading"
          className="text-xs font-semibold tracking-wide text-ink uppercase"
        >
          {t('panel.heading')}
        </h2>
        <span className="ml-auto text-[10px] font-medium tracking-wide text-muted uppercase">
          {t('panel.beta')}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {/* Rendered from the first frame, never gated.
            `evaluateDeal` is a pure function over data the listing row already
            had — the row behind this modal was showing this exact verdict and
            percentage before the user clicked. Staging a wait over a number that
            was just on screen reads as theatre and costs the panel its
            credibility, which is the only thing it trades on. */}
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

        {/* The narrative — the part an AI would genuinely take time to produce,
            and the only part that waits.
            A plain conditional rather than AnimatePresence: `mode="wait"` holds
            the incoming child until the outgoing one finishes exiting, and that
            exit callback never fires in jsdom, so the insight would never mount
            under test. */}
        <div className="border-t border-border-hairline pt-3">
          {isAnalyzing ? (
            <AnalysisPending />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-3"
            >
              <Recommendation value={verdict.recommendation} />
              <InsightsList insights={insights} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
