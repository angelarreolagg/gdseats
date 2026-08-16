import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/shared/components/IconButton'

interface TeamsPaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function TeamsPagination({ page, pageCount, onChange }: TeamsPaginationProps) {
  const { t } = useTranslation('teams')

  return (
    // `h-full` so the row it shares with the search field settles both controls
    // to one height. Without it this box is 46px against the field's 42 and the
    // two sit on different baselines.
    <div className="flex h-full items-center gap-2 rounded-full border border-border-hairline bg-surface p-1.5">
      <IconButton
        label={t('pagination.previous')}
        size="sm"
        className="rounded-full border-0 bg-transparent"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </IconButton>

      {/* `whitespace-nowrap`, or a narrow row breaks "1 of 3" over three lines
          and the control grows taller than the field beside it. It is also why
          every locale keeps this string to roughly its English length — ja uses
          "1 / 3" rather than a spelled-out form for the same reason. */}
      <span className="px-1 text-sm font-medium whitespace-nowrap text-ink tabular-nums">
        {t('pagination.position', { page: page + 1, pageCount })}
      </span>

      <IconButton
        label={t('pagination.next')}
        size="sm"
        className="rounded-full border-0 bg-transparent"
        disabled={page >= pageCount - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </IconButton>
    </div>
  )
}
