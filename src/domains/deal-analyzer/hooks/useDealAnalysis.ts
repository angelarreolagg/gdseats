import { useEffect, useMemo, useState } from 'react'
import type { ListingSignals } from '../types/deal.types'
import { evaluateDeal } from '../services/pricing.service'
import { generateInsights } from '../services/insights.service'

/** Deliberate theatre: an instant verdict reads as a static label. */
export const ANALYSIS_DURATION_MS = 1400

/**
 * Everything is computed synchronously; only the *reveal* of the narrative waits.
 *
 * `isAnalyzing` gates the recommendation and bullets ONLY — the verdict is a pure
 * function over data the row already rendered, so it must show in the first
 * frame. Do not simplify this into one flag around the whole body.
 */
export function useDealAnalysis(
  signals: ListingSignals,
  durationMs: number = ANALYSIS_DURATION_MS,
) {
  const { listingPrice, estimatedPrice, section } = signals

  // Keyed on the analysis's identity, not the object's. Callers build `signals`
  // inline, so a new reference arrives on every render — keying the timer on it
  // would restart the wait forever and the panel would never resolve.
  const analysisKey = `${listingPrice}:${estimatedPrice}:${section}`

  // Which analysis has finished, rather than a boolean flag. Deriving the loading
  // state means switching listings resets it during render — no setState in the
  // effect body, and no cascading extra render on every open.
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const isAnalyzing = resolvedKey !== analysisKey

  useEffect(() => {
    const timer = setTimeout(() => setResolvedKey(analysisKey), durationMs)
    return () => clearTimeout(timer)
  }, [analysisKey, durationMs])

  const verdict = useMemo(
    () => evaluateDeal(listingPrice, estimatedPrice),
    [listingPrice, estimatedPrice],
  )
  const insights = useMemo(() => generateInsights(signals), [signals])

  return { isAnalyzing, verdict, insights }
}
