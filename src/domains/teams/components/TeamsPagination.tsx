import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/shared/components/IconButton'

interface TeamsPaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
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
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
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
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </IconButton>
    </div>
  )
}
