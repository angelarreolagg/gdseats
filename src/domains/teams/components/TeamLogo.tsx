import { useState } from 'react'
import { useIsDarkTheme } from '@/shared/hooks/useIsDarkTheme'
import type { Team } from '../types/team.types'
import { getTeamLogoUrl } from '../services/teamLogo.service'
import { TeamCrest } from './TeamCrest'

interface TeamLogoProps {
  team: Team
  /** CSS pixels; also what the combiner is asked for, at 2×. */
  size: number
  className?: string
}

/**
 * A franchise's real mark, degrading to the generated crest.
 *
 * Two independent fallbacks, because they fail for different reasons: a team
 * missing from the generated map (`getTeamLogoUrl` returns null) and a CDN that
 * is up but not serving (`onError`). Either way the user sees the helmet this
 * app shipped with rather than a broken image.
 *
 * `alt=""` on purpose — every call site renders the team name directly beside
 * this, so announcing it again is noise.
 */
export function TeamLogo({ team, size, className = '' }: TeamLogoProps) {
  const isDark = useIsDarkTheme()
  const [failed, setFailed] = useState(false)

  const src = getTeamLogoUrl(team.id, { dark: isDark, size })

  if (!src || failed) {
    return (
      <TeamCrest
        primary={team.primary}
        secondary={team.secondary}
        seed={`crest-${team.id}`}
        className={className}
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  )
}
