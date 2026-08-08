import { describe, expect, it } from 'vitest'
import {
  getTeamLogoUrl,
  hasTeamLogo,
  selectLogoHref,
  type EspnLogo,
} from '../services/teamLogo.service'
import { TEAMS } from '../data/teams'
import { TEAM_LOGOS } from '../data/teamLogos'

const LOGOS: EspnLogo[] = [
  { href: 'https://a.espncdn.com/i/teamlogos/nfl/500-scoreboard/ari.png', rel: ['full', 'scoreboard'] },
  { href: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png', rel: ['full', 'default'] },
  { href: 'https://a.espncdn.com/i/teamlogos/nfl/500-dark/ari.png', rel: ['full', 'dark'] },
]

describe('selectLogoHref', () => {
  /**
   * Validates: the dark variant is chosen for dark surfaces.
   * Why it matters: ESPN's dark mark carries a light keyline — it is the only
   * reason a black logo like the Raiders' survives our #040811 ground. Picking
   * the default there leaves an invisible shield.
   */
  it('picks the variant matching the surface', () => {
    expect(selectLogoHref(LOGOS, 'dark')).toContain('500-dark/')
    expect(selectLogoHref(LOGOS, 'light')).toContain('/500/')
  })

  /**
   * Validates: `rel` is treated as an unordered set.
   * Why it matters: ESPN gives no ordering guarantee, and neither the tag order
   * within an entry nor the entry order within the array is stable. Matching by
   * index would work until the day the payload shifts and every logo silently
   * becomes the scoreboard crop.
   */
  it('matches rel by membership, not position', () => {
    const shuffled: EspnLogo[] = [
      { href: 'scoreboard.png', rel: ['scoreboard', 'full'] },
      { href: 'dark.png', rel: ['dark', 'full'] },
      { href: 'default.png', rel: ['default', 'full'] },
    ]

    expect(selectLogoHref(shuffled, 'dark')).toBe('dark.png')
    expect(selectLogoHref(shuffled, 'light')).toBe('default.png')
  })

  /**
   * Validates: the fallback chain degrades instead of returning nothing.
   * Why it matters: not every franchise publishes every variant. A missing dark
   * mark should show the default, not a hole.
   */
  it('falls back to default, then to any usable entry, then to null', () => {
    const noDark: EspnLogo[] = [{ href: 'default.png', rel: ['full', 'default'] }]
    expect(selectLogoHref(noDark, 'dark')).toBe('default.png')

    const untagged: EspnLogo[] = [{ href: 'mystery.png' }]
    expect(selectLogoHref(untagged, 'light')).toBe('mystery.png')

    expect(selectLogoHref([], 'light')).toBeNull()
  })
})

describe('getTeamLogoUrl', () => {
  /**
   * Validates: requests always go through the combiner at the rendered size.
   * Why it matters: the raw assets are unusable — the Raiders' dark mark is
   * 491 KB at 4096². A grid of 24 raw logos is roughly 12 MB; through the
   * combiner the same mark is about 5 KB.
   */
  it('routes through the combiner at twice the rendered size', () => {
    const url = getTeamLogoUrl('dal', { dark: true, size: 40 })

    expect(url).toContain('a.espncdn.com/combiner/i')
    expect(url).toContain('w=80')
    expect(url).toContain('h=80')
    expect(url).not.toMatch(/^https:\/\/a\.espncdn\.com\/i\//)
  })

  it('encodes the path so the query cannot be broken by it', () => {
    expect(getTeamLogoUrl('dal', { dark: false, size: 36 })).toContain(
      encodeURIComponent('/i/teamlogos/nfl/500/dal.png'),
    )
  })

  it('serves a different path per variant', () => {
    const dark = getTeamLogoUrl('lv', { dark: true, size: 40 })
    const light = getTeamLogoUrl('lv', { dark: false, size: 40 })
    expect(dark).not.toBe(light)
  })

  /**
   * Validates: an unknown team yields null rather than a broken URL.
   * Why it matters: null is the signal TeamLogo uses to render TeamCrest. A
   * fabricated URL would 404 and show a broken image instead.
   */
  it('returns null for a team it has no mark for', () => {
    expect(getTeamLogoUrl('nope', { dark: true, size: 40 })).toBeNull()
    expect(hasTeamLogo('nope')).toBe(false)
  })
})

describe('TEAM_LOGOS coverage', () => {
  /**
   * Validates: every franchise in the catalogue has a mark.
   * Why it matters: the generated map and the team list are edited at different
   * times by different means — one by hand, one by `pnpm logos:sync`. Adding a
   * team without re-syncing would silently fall back to the placeholder crest
   * for that one card, which is exactly the kind of gap nobody notices in a demo
   * until it is on a screen in front of someone.
   */
  it('covers every team in the catalogue', () => {
    const uncovered = TEAMS.filter((team) => !hasTeamLogo(team.id)).map((team) => team.id)
    expect(uncovered).toEqual([])
  })

  it('stores paths rather than absolute URLs', () => {
    for (const [id, paths] of Object.entries(TEAM_LOGOS)) {
      expect(paths.light.startsWith('/'), `${id} light`).toBe(true)
      expect(paths.dark.startsWith('/'), `${id} dark`).toBe(true)
    }
  })
})
