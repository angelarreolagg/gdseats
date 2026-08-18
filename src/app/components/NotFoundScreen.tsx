import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'

interface NotFoundScreenProps {
  onBackToTeams: () => void
}

/**
 * Reached when `screen.name === 'search'` resolves to no team — a stale or
 * hand-typed team id. There is no URL router in this app (see
 * `useAppNavigation.ts`), so this is the closest thing to a 404: an explicit
 * dead end instead of `App` silently falling back to the teams screen.
 */
export function NotFoundScreen({ onBackToTeams }: NotFoundScreenProps) {
  const { t } = useTranslation('common')

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-8">
      <SearchX className="h-10 w-10 text-muted" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
        {t('notFound.heading')}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted">{t('notFound.body')}</p>
      <Button onClick={onBackToTeams} className="mt-6">
        {t('notFound.cta')}
      </Button>
    </div>
  )
}
