import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { TEAMS, TEAMS_PER_PAGE } from '../data/teams'
import { TeamCard } from './TeamCard'
import { TeamsPagination } from './TeamsPagination'
import { LeagueSwitch, type League } from './LeagueSwitch'
import { TeamSearchCombobox } from './TeamSearchCombobox'
import { TeamsHero } from './TeamsHero'

interface TeamsScreenProps {
  onSelectTeam: (teamId: string) => void
}

export function TeamsScreen({ onSelectTeam }: TeamsScreenProps) {
  const { t } = useTranslation('teams')
  const [page, setPage] = useState(0)
  const [league, setLeague] = useState<League>('nfl')

  const pageCount = Math.ceil(TEAMS.length / TEAMS_PER_PAGE)

  // Clamped, so a flick at either end is a no-op. Spread on both the grid and the
  // dot indicator: the cards are where a thumb lands, the dots look draggable.
  const swipe = useSwipe({
    onSwipeLeft: () => setPage((current) => Math.min(current + 1, pageCount - 1)),
    onSwipeRight: () => setPage((current) => Math.max(current - 1, 0)),
  })
  // MLB is chrome only — the demo carries one league's worth of mock data.
  const visible = league === 'nfl' ? TEAMS.slice(page * TEAMS_PER_PAGE, (page + 1) * TEAMS_PER_PAGE) : []

  return (
    <div>
      <TeamsHero />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        {/* `items-stretch`: LeagueSwitch is the taller control, and matching the field
            to it by hand would mean a height that drifts on the next restyle. */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
          {/* Mobile row 1: the league, full width — it decides what the grid contains. */}
          <div className="order-1 sm:order-1">
            <LeagueSwitch
              value={league}
              onChange={(value) => {
                setLeague(value)
                setPage(0)
              }}
            />
          </div>

          {/* Mobile row 2: search and pagination side by side. `sm:contents` dissolves
              this wrapper at the breakpoint so both become items of the row above —
              regrouping across a breakpoint without rendering either control twice. */}
          <div className="order-2 flex items-stretch gap-3 sm:contents">
            <TeamSearchCombobox
              teams={TEAMS}
              onSelectTeam={onSelectTeam}
              disabled={league === 'mlb'}
              className="min-w-0 flex-1 sm:order-2 sm:flex-initial"
            />
            {league === 'nfl' ? (
              <div className="flex shrink-0 sm:order-3 sm:ml-auto">
                <TeamsPagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Two columns from the smallest screen: one put half a card in the fold and
            made the catalogue read as a list of two teams. */}
        {visible.length > 0 ? (
          <motion.div
            key={`${league}-${page}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            {...swipe}
          >
            {visible.map((team) => (
              <TeamCard key={team.id} team={team} onSelect={onSelectTeam} />
            ))}
          </motion.div>
        ) : (
          <p className="rounded-xl border border-border-hairline bg-surface px-5 py-12 text-center text-sm text-muted">
            {t('grid.mlbEmpty')}
          </p>
        )}

        {/* The bar is 6px, nowhere near a thumb target, so the button is sized for the
            finger and the bar is its child: `h-11` is the 44px target and `-my-[19px]`
            takes it back out of the flow. Spacing lives on the button's `px` so the hit
            areas tile edge to edge instead of leaving dead strips.

            Plain buttons, not `role="slider"`: the swipe is an enhancement over controls
            that already work with a keyboard. */}
        {league === 'nfl' ? (
          <div className="mt-6 flex justify-center" {...swipe}>
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={t('pagination.goToPage', { page: index + 1 })}
                aria-current={index === page ? 'true' : undefined}
                onClick={() => setPage(index)}
                className="group -my-[19px] flex h-11 items-center px-1.5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    index === page ? 'w-6 bg-accent' : 'w-3 bg-track group-hover:bg-muted'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
