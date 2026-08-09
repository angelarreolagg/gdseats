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

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        {/*
         * `sm:items-stretch`, not `items-center`: LeagueSwitch is the taller
         * control (its pill sits inside a padded track), and matching the search
         * field to it by hand would mean a hardcoded height that drifts the
         * moment either one is restyled. Stretching lets the row settle it.
         */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
          {/*
           * Mobile row 1: the league, full width. It decides what the grid
           * contains, so it reads before the two controls that only narrow or
           * page through what it chose.
           */}
          <div className="order-1 sm:order-1">
            <LeagueSwitch
              value={league}
              onChange={(value) => {
                setLeague(value)
                setPage(0)
              }}
            />
          </div>

          {/*
           * Mobile row 2: search and pagination side by side.
           *
           * `items-stretch` is what settles them to one height — the pagination
           * box is 46px and the field 42, and left alone they sit on different
           * baselines with the shorter one floating. Stretching lets the taller
           * one set the row and the field fill it (`h-full` on its input).
           *
           * `sm:contents` dissolves this wrapper at the breakpoint so both become
           * direct items of the row above, where the field returns to its natural
           * width beside the league switch and `sm:ml-auto` pushes pagination to
           * the far right. It regroups elements across a breakpoint without
           * rendering either control twice.
           */}
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

        {/*
         * Two columns from the smallest screen up. One column put half a card in
         * the fold and made the catalogue read as a list of two teams; two puts
         * four franchises in view, which is what makes the grid legible as a
         * catalogue at all.
         */}
        {visible.length > 0 ? (
          <motion.div
            key={`${league}-${page}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
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

        {/*
         * The bar you see is 6px tall, which is nowhere near something a thumb
         * can hit — as plain buttons these were 12×6px targets and simply did not
         * respond on a phone. So the button is sized for the finger and the bar
         * became a child of it:
         *
         * - `h-11` is the 44px touch target; `-my-[19px]` takes all but the bar's
         *   own 6px back out of the flow, so the row still measures as the
         *   hairline it looks like and nothing below it moves.
         * - The spacing moved from the container's `gap` onto the button's `px`,
         *   which is what makes the hit areas **tile edge to edge instead of
         *   leaving dead strips between them**. At 24px wide they clear WCAG
         *   2.5.8; a gap on the container would have left the same 12px targets
         *   with empty space around them.
         *
         * Not a drag control on purpose: `TeamsPagination` above the grid is the
         * primary way through the pages, and this stays a set of plain buttons so
         * it keeps working with a keyboard and a screen reader for free.
         */}
        {league === 'nfl' ? (
          <div className="mt-6 flex justify-center">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to page ${index + 1}`}
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
