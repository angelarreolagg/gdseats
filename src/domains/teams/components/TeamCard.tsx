import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { formatCount } from '@/shared/utils/formatters'
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
  const { t } = useTranslation('teams')
  const trend = useMemo(() => getMarketTrend(team), [team])
  const listingCount = getListingCountForTeam(team)
  // Drives the helmet tilt and the logo's step-back together. `onHoverStart`/
  // `onHoverEnd` are Motion's own gesture handlers — mouse-only like the
  // existing `whileHover` lift, so a tap on touch never fires this either.
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(team.id)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
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
        <TeamBanner team={team} isHovered={isHovered} className="h-full w-full" />
        {/* Steps back on hover so the tilting helmet behind it reads as the
            thing that moved, rather than the logo simply covering it. Tilts
            the same direction and by the same degree as the helmet's own
            `rotate` in `TeamBanner`, so the two read as one coordinated
            gesture rather than two unrelated hover effects. */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: isHovered ? -6 : 0, scale: isHovered ? 0.8 : 1, rotate: isHovered ? -8 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <TeamLogo team={team} size={72} className="h-14 w-14 drop-shadow-lg sm:h-16 sm:w-16" />
        </motion.span>
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <span className="text-sm font-semibold tracking-tight text-ink">{team.name}</span>
        <span className="text-xs text-muted">{team.venue}</span>

        <span className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3">
          <span className="inline-flex rounded-full bg-info/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-info uppercase tabular-nums">
            {/*
             * `count` selects the plural form, `formatted` is what is rendered.
             * Two params for one number because the two jobs are different: the
             * grouping separator is the app's locale (never a bare
             * `toLocaleString()`, which reads the browser's), while the plural
             * category is the language's grammar — and ja has only one.
             */}
            {t('card.listingCount', {
              count: listingCount,
              formatted: formatCount(listingCount),
            })}
          </span>
          {/* Hover-only here: the card is a button, so the chip must not take a
              tab stop of its own. SearchToolbar renders the focusable variant. */}
          <TrendChip trend={trend} />
        </span>

        <span className="mt-1.5 text-[11px] text-muted">{t(trend.buyerImplicationKey)}</span>
      </span>
    </motion.button>
  )
}
