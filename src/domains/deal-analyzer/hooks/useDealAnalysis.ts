import { useEffect, useMemo, useState } from 'react'
import type { ListingSignals } from '../types/deal.types'
import { evaluateDeal } from '../services/pricing.service'
import { generateInsights } from '../services/insights.service'

/**
 * How long the panel spends "analysing".
 *
 * The maths underneath is instant and synchronous. This delay is deliberate
 * product theatre: a verdict that appears the same frame as the page reads as a
 * static label, while a short wait reads as work being done — and this panel's
 * whole job is to be believed. Long enough to register, short enough not to block
 * the offer flow beside it.
 */
export const ANALYSIS_DURATION_MS = 1400

/**
 * Runs the deal analysis behind a simulated round-trip.
 *
 * Everything is computed synchronously; only the *reveal* of the narrative waits.
 * That keeps the services testable and confines the latency to one place.
 *
 * Note what `isAnalyzing` is for: it gates the recommendation and the bullets
 * ONLY. The verdict is a pure function over data the listing row already
 * rendered, so the panel must show it in the first frame — see the comment in
 * `AIInsightPanel`. Do not "simplify" this back into one flag around the whole
 * body; that regression is invisible in tests unless you look for it, which is
 * why there is one pinning it.
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
