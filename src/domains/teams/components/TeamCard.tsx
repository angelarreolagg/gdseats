import { useMemo } from 'react'
import { motion } from 'motion/react'
import { getListingCountForTeam } from '../data/teams'
import { getMarketTrend } from '../services/marketTrend.service'
import type { Team } from '../types/team.types'
import { TeamCrest } from './TeamCrest'
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
      {/* The generated crest stays as the banner's backdrop; the real mark sits
          on top of it, so the franchise colours still carry the card. */}
      <span className="relative block h-28 overflow-hidden">
        <TeamCrest
          primary={team.primary}
          secondary={team.secondary}
          seed={team.id}
          className="h-full w-full"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <TeamLogo team={team} size={72} className="h-16 w-16 drop-shadow-lg" />
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="text-sm font-semibold tracking-tight text-ink">{team.name}</span>
        <span className="text-xs text-muted">{team.venue}</span>

        <span className="mt-3 flex flex-wrap items-center gap-1.5">
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
