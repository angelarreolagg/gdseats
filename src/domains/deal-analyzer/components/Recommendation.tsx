import { useTranslation } from 'react-i18next'
import type { Recommendation as RecommendationValue } from '../types/deal.types'
import { RECOMMENDATION_KEY } from './statusPresentation'

interface RecommendationProps {
  value: RecommendationValue
}

/** One observation reads as guidance; a coloured imperative reads as a gate. */
export function Recommendation({ value }: RecommendationProps) {
  const { t } = useTranslation('analyzer')
  return <p className="text-sm leading-snug text-ink">{t(RECOMMENDATION_KEY[value])}</p>
}
