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

/** The verdict block. All arithmetic lives in the services; this arranges. */
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
      {/* Zero-size and aria-hidden: it exists only to give `.holo-icon` something to
          point `stroke: url(#…)` at. */}
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
        {/* Never gated: `evaluateDeal` is pure over data the row already showed, so
            staging a wait over a number that was just on screen reads as theatre. */}
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

        {/* The only part that waits. A plain conditional rather than AnimatePresence,
            whose exit callback never fires in jsdom. */}
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
