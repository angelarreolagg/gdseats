import { useTranslation } from 'react-i18next'
import { GridDots } from '@/shared/components/GridDots'

/**
 * Occupies the narrative slot while the insight is being produced.
 *
 * `min-h` reserves roughly what the resolved content takes — one sentence plus
 * three bullets — so the panel does not grow when the text lands and shove the
 * price history down the page.
 *
 * One `role="status"` with real text. The dots themselves are aria-hidden: a
 * screen reader should hear that work is happening, not nine bullet characters.
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
