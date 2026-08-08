import { useId, useMemo, useState } from 'react'
import { ChevronsUpDown, Search } from 'lucide-react'
import type { Team } from '../types/team.types'
import { TeamLogo } from './TeamLogo'

interface TeamSearchComboboxProps {
  teams: Team[]
  onSelectTeam: (teamId: string) => void
  /** MLB carries no inventory, so the field has nothing to search. */
  disabled?: boolean
  className?: string
}

function matchesQuery(team: Team, query: string) {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return (
    team.name.toLowerCase().includes(needle) || team.venue.toLowerCase().includes(needle)
  )
}

/**
 * "Select a team" — a filterable jump straight to a franchise's listings.
 *
 * The grid below is paginated eight at a time, so reaching the Jaguars costs
 * three clicks and a scan of 24 cards. This is the shortcut, and it deliberately
 * does NOT filter the grid: picking a team opens it, the same as clicking a card.
 *
 * Hand-rolled rather than pulled from a library — the only Radix package here is
 * the tooltip, and a listbox is the one widget whose semantics are short enough
 * to own. Venue is searchable alongside the name because a seat licence is
 * bought for a building as much as for a team.
 */
export function TeamSearchCombobox({
  teams,
  onSelectTeam,
  disabled = false,
  className = '',
}: TeamSearchComboboxProps) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => teams.filter((team) => matchesQuery(team, query)), [teams, query])
  const active = matches[activeIndex]

  const select = (team: Team) => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
    onSelectTeam(team.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      if (matches.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (index + step + matches.length) % matches.length)
      return
    }

    if (event.key === 'Enter' && open && active) {
      event.preventDefault()
      select(active)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(0)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        role="combobox"
        aria-label="Select a team"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && active ? `${listboxId}-${active.id}` : undefined}
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={disabled ? 'MLB coming soon' : 'Select a team'}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="h-full w-full rounded-full border border-border-hairline bg-surface py-2.5 pr-9 pl-10 text-sm font-medium text-ink transition-colors placeholder:font-normal placeholder:text-muted hover:border-accent-ink/40 focus:border-accent-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-80"
      />
      <ChevronsUpDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted"
      />

      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Teams"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border-hairline bg-surface py-1 shadow-lg sm:w-80"
        >
          {matches.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-muted">No teams match “{query.trim()}”</li>
          ) : (
            matches.map((team, index) => (
              <li
                key={team.id}
                id={`${listboxId}-${team.id}`}
                role="option"
                aria-selected={index === activeIndex}
                /*
                 * The listbox closes on blur, and a click blurs before it fires.
                 * Suppressing mousedown's default keeps focus on the input, so
                 * the option is still mounted when the click lands.
                 */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(team)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm ${
                  index === activeIndex ? 'bg-track text-ink' : 'text-ink'
                }`}
              >
                <TeamLogo team={team} size={20} className="h-5 w-5 shrink-0" />
                <span className="font-medium">{team.name}</span>
                <span className="ml-auto truncate text-xs text-muted">{team.venue}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
