import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean
  rounded?: 'lg' | 'full'
  className?: string
  onChange: (value: string) => void
}

export function Select({
  label,
  value,
  options,
  hideLabel = false,
  rounded = 'lg',
  className = '',
  onChange,
}: SelectProps) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className={hideLabel ? 'sr-only' : 'mr-2 text-sm text-muted'}>{label}</span>
      <span className="relative inline-flex">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`cursor-pointer appearance-none border border-border-hairline bg-surface py-2.5 pr-9 pl-3.5 text-sm font-medium text-ink transition-colors hover:border-accent-ink/40 focus:border-accent-ink focus:outline-none ${
            rounded === 'full' ? 'rounded-full' : 'rounded-lg'
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </span>
    </label>
  )
}
