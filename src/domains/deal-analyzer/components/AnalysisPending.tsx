import { useTranslation } from 'react-i18next'
import { GridDots } from '@/shared/components/GridDots'

/**
 * `min-h` reserves what the resolved content takes, so the panel does not grow
 * and shove the price history down. One `role="status"`; the dots are hidden.
 */
export function AnalysisPending() {
  const { t } = useTranslation('analyzer')

  return (
    <div
      role="status"
      className="flex min-h-24 flex-col items-center justify-center gap-3 py-2"
    >
      <GridDots />
      <p className="text-xs text-muted">{t('panel.analyzing')}</p>
    </div>
  )
}
