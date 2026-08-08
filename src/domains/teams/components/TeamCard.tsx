import { useMemo } from 'react'
import { motion } from 'motion/react'
import { getListingCountForTeam } from '../data/teams'
import { getMarketTrend } from '../services/marketTrend.service'
import type { Team } from '../types/team.types'
import { TeamBanner } from './TeamBanner'
import { TeamLogo } from './TeamLogo'
import { TrendChip } from './TrendChip'

interface TeamCardProps {
  team: Team
  onSelect: (teamId: string) => void
}

export function TeamCard({ team, onSelect }: TeamCardProps) {
  const trend = useMemo(() => getMarketTrend(team), [team])

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(team.id)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-hairline bg-surface text-left shadow-card transition-colors hover:border-accent-ink/40"
    >
      {/* Shared stadium plate, stained in the franchise's colours; the real mark
          sits on top of it, outside the blend so it keeps its own hues.

          Shorter on mobile: at two columns a card is ~165px wide, and a 112px
          plate over a name that wraps to two lines pushes the second row of the
          grid out of the fold. */}
      <span className="relative block h-24 sm:h-28">
        <TeamBanner team={team} className="h-full w-full" />
        <span className="absolute inset-0 flex items-center justify-center">
          <TeamLogo team={team} size={72} className="h-14 w-14 drop-shadow-lg sm:h-16 sm:w-16" />
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <span className="text-sm font-semibold tracking-tight text-ink">{team.name}</span>
        <span className="text-xs text-muted">{team.venue}</span>

        <span className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3">
          <span className="inline-flex rounded-full bg-info/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-info uppercase tabular-nums">
            {getListingCountForTeam(team).toLocaleString('en-US')} listings
          </span>
          {/* Hover-only here: the card is a button, so the chip must not take a
              tab stop of its own. SearchToolbar renders the focusable variant. */}
          <TrendChip trend={trend} />
        </span>

        <span className="mt-1.5 text-[11px] text-muted">{trend.buyerImplication}</span>
      </span>
    </motion.button>
  )
}
