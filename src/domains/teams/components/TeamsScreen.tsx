import { useState } from 'react'
import { motion } from 'motion/react'
import { TEAMS, TEAMS_PER_PAGE } from '../data/teams'
import { TeamCard } from './TeamCard'
import { TeamsPagination } from './TeamsPagination'
import { LeagueSwitch, type League } from './LeagueSwitch'

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
      {/* Hero band. A gradient rather than a photo — no image assets here. */}
      <div className="relative h-44 overflow-hidden border-b border-border-hairline sm:h-56">
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_-20%,color-mix(in_oklab,var(--psl-accent)_22%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-8 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Personal seat licenses, priced by AI
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Pick a franchise to browse live listings with an instant read on which ones are
            actually worth it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <LeagueSwitch
            value={league}
            onChange={(value) => {
              setLeague(value)
              setPage(0)
            }}
          />
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
