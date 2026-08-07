import { motion } from 'motion/react'
import { getListingCountForTeam } from '@/domains/listing/services/listingGenerator.service'
import type { Team } from '../types/team.types'
import { TeamCrest } from './TeamCrest'

interface TeamCardProps {
  team: Team
  onSelect: (teamId: string) => void
}

export function TeamCard({ team, onSelect }: TeamCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(team.id)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-hairline bg-surface text-left shadow-card transition-colors hover:border-accent-ink/40"
    >
      <span className="relative block h-28 overflow-hidden">
        <TeamCrest
          primary={team.primary}
          secondary={team.secondary}
          seed={team.id}
          className="h-full w-full"
        />
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="text-sm font-semibold tracking-tight text-ink">{team.name}</span>
        <span className="text-xs text-muted">{team.venue}</span>
        <span className="mt-2 inline-flex w-fit rounded-full bg-info/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-info uppercase tabular-nums">
          {getListingCountForTeam(team).toLocaleString('en-US')} listings
        </span>
      </span>
    </motion.button>
  )
}
