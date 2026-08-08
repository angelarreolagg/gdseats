import { useState } from 'react'
import { motion } from 'motion/react'
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
  const [page, setPage] = useState(0)
  const [league, setLeague] = useState<League>('nfl')

  const pageCount = Math.ceil(TEAMS.length / TEAMS_PER_PAGE)
  // MLB is chrome only — the demo carries one league's worth of mock data.
  const visible = league === 'nfl' ? TEAMS.slice(page * TEAMS_PER_PAGE, (page + 1) * TEAMS_PER_PAGE) : []

  return (
    <div>
      <TeamsHero />

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <LeagueSwitch
              value={league}
              onChange={(value) => {
                setLeague(value)
                setPage(0)
              }}
            />
            <TeamSearchCombobox
              teams={TEAMS}
              onSelectTeam={onSelectTeam}
              disabled={league === 'mlb'}
            />
          </div>
          {league === 'nfl' ? (
            <TeamsPagination page={page} pageCount={pageCount} onChange={setPage} />
          ) : null}
        </div>

        {visible.length > 0 ? (
          <motion.div
            key={`${league}-${page}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {visible.map((team) => (
              <TeamCard key={team.id} team={team} onSelect={onSelectTeam} />
            ))}
          </motion.div>
        ) : (
          <p className="rounded-xl border border-border-hairline bg-surface px-5 py-12 text-center text-sm text-muted">
            MLB listings aren't part of this demo yet.
          </p>
        )}

        {league === 'nfl' ? (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to page ${index + 1}`}
                aria-current={index === page ? 'true' : undefined}
                onClick={() => setPage(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === page ? 'w-6 bg-accent' : 'w-3 bg-track hover:bg-muted'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
