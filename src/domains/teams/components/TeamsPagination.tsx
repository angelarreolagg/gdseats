import { IconButton } from '@/shared/components/IconButton'

interface TeamsPaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d={direction === 'left' ? 'M12 5l-5 5 5 5' : 'M8 5l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TeamsPagination({ page, pageCount, onChange }: TeamsPaginationProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border-hairline bg-surface p-1.5">
      <IconButton
        label="Previous page"
        size="sm"
        className="rounded-full border-0 bg-transparent"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <Chevron direction="left" />
      </IconButton>

      <span className="px-1 text-sm font-medium text-ink tabular-nums">
        {page + 1} of {pageCount}
      </span>

      <IconButton
        label="Next page"
        size="sm"
        className="rounded-full border-0 bg-transparent"
        disabled={page >= pageCount - 1}
        onClick={() => onChange(page + 1)}
      >
        <Chevron direction="right" />
      </IconButton>
    </div>
  )
}
