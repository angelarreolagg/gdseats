import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

export type League = 'nfl' | 'mlb'

interface LeagueSwitchProps {
  value: League
  onChange: (league: League) => void
}

const LEAGUES: Array<{ value: League; labelKey: string; hintKey?: string }> = [
  { value: 'nfl', labelKey: 'league.nfl' },
  { value: 'mlb', labelKey: 'league.mlb', hintKey: 'league.soon' },
]

/**
 * Two options don't belong in a dropdown — half the choice ends up behind a click.
 *
 * The selected fill is the brand accent at 20% over the surface with accent ink on
 * top: measured 4.57:1 in light and 6.75:1 in dark, so it clears the text floor in
 * both modes without needing a stepped colour.
 *
 * **The fill is one element that moves, not two that toggle.** It is rendered only
 * for the selected option and carries a `layoutId`, so Motion animates it from the
 * old pill to the new one instead of cross-fading two backgrounds. That slide is
 * what makes the control read as a switch with a position rather than as two
 * buttons that happen to light up — and it is the only thing on this screen that
 * confirms the change came from *you*, since the grid below re-renders too fast to
 * register as a response.
 *
 * `MotionConfig reducedMotion="user"` disables layout animation, so it snaps for
 * anyone who asked for that. Nothing else is needed here.
 *
 * The buttons carry no `whileHover` / `whileTap` transform on purpose: a transform
 * on the parent moves the box Motion is measuring the shared layout against, and
 * the pill lands in the wrong place. Hover is a background change instead.
 *
 * Full width on mobile so the two options split the row evenly — it is the first
 * control under the hero and the one that decides what the grid contains, which
 * makes it the wrong thing to shrink to its text.
 */
export function LeagueSwitch({ value, onChange }: LeagueSwitchProps) {
  const { t } = useTranslation('teams')

  return (
    <div
      role="group"
      aria-label={t('league.groupLabel')}
      className="flex w-full items-center gap-1.5 rounded-full border border-border-hairline bg-surface p-1.5 sm:inline-flex sm:w-auto sm:gap-2"
    >
      {LEAGUES.map((league) => {
        const selected = league.value === value
        return (
          <button
            key={league.value}
            type="button"
            onClick={() => onChange(league.value)}
            aria-pressed={selected}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors sm:flex-initial sm:px-4 ${
              selected ? '' : 'hover:bg-track'
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="league-selected"
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full border border-accent/35 bg-gradient-to-b from-accent/15 to-accent/5 shadow-[0_2px_12px_-8px_var(--psl-accent)]"
              />
            ) : null}

            {/* Above the travelling fill, or the slide passes over the label. */}
            <span className={`relative z-10 ${selected ? 'text-accent-ink' : 'text-muted'}`}>
              {t(league.labelKey)}
            </span>
            {league.hintKey ? (
              <span
                className={`relative z-10 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                  selected ? 'bg-accent-ink/15 text-accent-ink' : 'bg-ink/8 text-muted'
                }`}
              >
                {t(league.hintKey)}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
