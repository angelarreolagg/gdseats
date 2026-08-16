import { TEAM_LOGOS } from '../data/teamLogos'

const COMBINER = 'https://a.espncdn.com/combiner/i'

export interface EspnLogo {
  href: string
  /** An unordered SET of tags — "full", "default", "dark", "scoreboard". */
  rel?: string[]
}

/**
 * `rel` is an unordered SET: match with `includes`, never by index, and never
 * assume `logos[0]` is the default. `["full","dark"]` means "for dark grounds" —
 * it carries a light keyline so black marks survive #040811.
 */
export function selectLogoHref(logos: EspnLogo[], variant: 'light' | 'dark'): string | null {
  const wanted = variant === 'dark' ? 'dark' : 'default'
  const has = (logo: EspnLogo, ...tags: string[]) =>
    tags.every((tag) => logo.rel?.includes(tag))

  return (
    logos.find((logo) => logo.href && has(logo, 'full', wanted))?.href ??
    logos.find((logo) => logo.href && has(logo, 'full', 'default'))?.href ??
    logos.find((logo) => logo.href)?.href ??
    null
  )
}

interface LogoUrlOptions {
  /** Which variant to serve. Dark marks carry a keyline for dark grounds. */
  dark: boolean
  /** CSS pixels the image renders at; the request is made at 2× for retina. */
  size: number
}

/**
 * The URL to put in `src`, or `null` for a team we have no mark for — callers
 * fall back to `TeamCrest`.
 *
 * Always routed through ESPN's combiner. The stored assets are inconsistent to
 * the point of being unusable raw (491 KB / 4096² in the worst case); asking the
 * combiner for the rendered size brings that same mark down to about 5 KB.
 */
export function getTeamLogoUrl(teamId: string, { dark, size }: LogoUrlOptions): string | null {
  const paths = TEAM_LOGOS[teamId]
  if (!paths) return null

  const path = dark ? paths.dark : paths.light
  if (!path) return null

  const pixels = Math.round(size * 2)
  return `${COMBINER}?img=${encodeURIComponent(path)}&w=${pixels}&h=${pixels}`
}

/** Every team we model should have a mark; used by the guard test. */
export function hasTeamLogo(teamId: string): boolean {
  return Boolean(TEAM_LOGOS[teamId])
}
