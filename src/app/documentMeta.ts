import i18n from '@/shared/i18n'
import { SITE_NAME } from '@/shared/config/site'
import type { DocumentMeta } from '@/shared/hooks/useDocumentMeta'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '@/domains/listing/types/listing.types'

/**
 * The tab title and page description for whatever is currently on screen.
 *
 * Lives in `app/` rather than in `shared/` because it reads `Team` and `Listing`.
 * `shared` is imported by every domain, so a `shared → domains` edge would invert
 * the dependency graph and could close a cycle. The composition root already
 * depends on both domains, which makes this the one place the two can meet.
 *
 * `useDocumentMeta` therefore takes plain strings and knows nothing about seats
 * — a boundary this refactor deliberately kept. Resolving the copy here rather
 * than handing the hook a key and a bag of params is the same escape hatch
 * `demoNotice.tsx` uses, and it is legitimate for the same reason: this is the
 * composition root, not a domain service, so the keys-not-sentences rule that
 * governs `insights.service.ts` does not apply. Reaching the singleton directly
 * also means no React hook is needed in a plain function.
 *
 * **What does have to happen upstream:** `App` subscribes to the language via
 * `useTranslation`, so a switch re-renders it, this recomputes, and the effect in
 * `useDocumentMeta` re-runs. Without that subscription the tab title would keep
 * whatever language the visitor first arrived in.
 *
 * Team and venue names are never translated — they are franchise proper nouns,
 * and they interpolate into the sentence rather than being part of it.
 */
export function getDocumentMeta(team?: Team, listing?: Listing): DocumentMeta {
  const t = i18n.getFixedT(null, 'meta')

  if (team && listing) {
    return {
      // Detail first, brand last. By the third screen the visitor knows what site
      // they are on, and a tab that opens with "G&D Seats —" on all three is
      // unreadable the moment two of them are open at once.
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
