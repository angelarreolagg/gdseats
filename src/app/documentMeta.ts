import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME } from '@/shared/config/site'
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
 * `useDocumentMeta` therefore takes plain strings and knows nothing about seats.
 */
export function getDocumentMeta(team?: Team, listing?: Listing): DocumentMeta {
  if (team && listing) {
    return {
      // Detail first, brand last. By the third screen the visitor knows what site
      // they are on, and a tab that opens with "G&D Seats —" on all three is
      // unreadable the moment two of them are open at once.
      title: `Section ${listing.section}, Row ${listing.row} — ${team.name} PSL | ${SITE_NAME}`,
      description: `${listing.seatCount} personal seat licenses in section ${listing.section}, row ${listing.row} at ${team.venue}, with an AI read on how the asking price compares to the section.`,
    }
  }

  if (team) {
    return {
      title: `${team.name} PSLs — ${team.venue} | ${SITE_NAME}`,
      description: `Personal seat licenses for sale at ${team.venue}, home of the ${team.name}. Compare every asking price against an AI valuation on an interactive seat map.`,
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
}
