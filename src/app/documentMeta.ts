import i18n from '@/shared/i18n'
import { SITE_NAME } from '@/shared/config/site'
import type { DocumentMeta } from '@/shared/hooks/useDocumentMeta'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '@/domains/listing/types/listing.types'

/**
 * Tab title and description for the current screen.
 *
 * Lives in `app/` because it reads `Team` and `Listing`; a `shared → domains`
 * edge would invert the graph. Resolves copy through the singleton rather than
 * returning keys, so `useDocumentMeta` keeps its plain-string contract — the
 * same escape hatch `demoNotice.tsx` uses, and legitimate for the same reason.
 *
 * `App` subscribes via `useTranslation` so a switch re-runs this.
 */
export function getDocumentMeta(team?: Team, listing?: Listing): DocumentMeta {
  const t = i18n.getFixedT(null, 'meta')

  if (team && listing) {
    return {
      // Detail first, brand last: by the third screen the visitor knows the site.
      title: t('listing.title', {
        section: listing.section,
        row: listing.row,
        team: team.name,
        site: SITE_NAME,
      }),
      description: t('listing.description', {
        seatCount: listing.seatCount,
        section: listing.section,
        row: listing.row,
        venue: team.venue,
      }),
    }
  }

  if (team) {
    return {
      title: t('team.title', { team: team.name, venue: team.venue, site: SITE_NAME }),
      description: t('team.description', { venue: team.venue, team: team.name }),
    }
  }

  return { title: t('default.title'), description: t('default.description') }
}
