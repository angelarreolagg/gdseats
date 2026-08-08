import { motion } from 'motion/react'

export type League = 'nfl' | 'mlb'

interface LeagueSwitchProps {
  value: League
  onChange: (league: League) => void
}

const LEAGUES: Array<{ value: League; label: string; hint?: string }> = [
  { value: 'nfl', label: 'NFL Teams' },
  { value: 'mlb', label: 'MLB Teams', hint: 'Soon' },
]

/**
 * Two options don't belong in a dropdown — half the choice ends up behind a click.
 *
 * The selected fill is the brand accent at 20% over the surface with accent ink on
 * top: measured 4.57:1 in light and 6.75:1 in dark, so it clears the text floor in
 * both modes without needing a stepped colour.
 */
export function LeagueSwitch({ value, onChange }: LeagueSwitchProps) {
  return (
    <div
      role="group"
      aria-label="League"
      className="inline-flex items-center gap-2 rounded-full border border-border-hairline bg-surface p-1.5"
    >
      {LEAGUES.map((league) => {
        const selected = league.value === value
        return (
          <motion.button
            key={league.value}
            type="button"
            onClick={() => onChange(league.value)}
            aria-pressed={selected}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              selected
                ? 'border border-accent/35 bg-gradient-to-b from-accent/15 to-accent/5 text-accent-ink shadow-[0_2px_12px_-8px_var(--psl-accent)]'
                : 'border border-transparent text-muted hover:bg-track hover:text-ink'
            }`}
          >
            {league.label}
            {league.hint ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                  selected ? 'bg-accent-ink/15' : 'bg-ink/8'
                }`}
              >
                {league.hint}
              </span>
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}
