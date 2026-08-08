/**
 * Everything about the site that a crawler, a scraper, or the browser tab reads.
 *
 * These values are stated **twice**: here, and literally in `index.html`. That is
 * not an oversight. `index.html` is a static file served before any JavaScript
 * runs, and it is the only version a social scraper (LinkedIn, Slack, X) ever
 * sees — none of them execute the bundle. So the tags have to be in the markup,
 * and the markup cannot import TypeScript. If you change a string here, change
 * the matching tag in `index.html`; the comment there points back at this file.
 *
 * `useDocumentMeta` then overwrites the same tags at runtime as the user moves
 * between screens, which is what Google (which does execute JS) and the tab title
 * pick up.
 */

/**
 * Absolute origin, no trailing slash.
 *
 * TODO(deploy): replace with the real host before publishing. Every canonical
 * link, `og:url`, `og:image`, sitemap entry, and JSON-LD `@id` is built from it,
 * and Open Graph requires absolute URLs — a relative `og:image` silently yields
 * no preview card on most scrapers.
 *
 * If this ever ships to a GitHub Pages *subpath* (`…github.io/gdseats/`) rather
 * than its own domain, this is not the only change: `vite.config.ts` needs a
 * matching `base`, and the absolute `/…` paths in `index.html` and
 * `site.webmanifest` all need the prefix too.
 */
export const SITE_URL = 'https://gdseats.vercel.app'

export const SITE_NAME = 'G&D Seats'

/** Expanded once, in the header tooltip. Used here for structured data. */
export const SITE_LEGAL_NAME = 'Gridiron & Diamond Seats'

/**
 * The tab title when nothing more specific applies.
 *
 * Front-loaded with the brand because the teams grid is the entry point and the
 * shareable URL; the deeper screens invert it (detail first, brand last) since by
 * then the user knows what site they are on.
 */
export const DEFAULT_TITLE = 'G&D Seats — AI-priced NFL personal seat licenses'

/**
 * 145 characters. Google truncates the snippet around 155–160, so this is sized
 * to survive whole rather than to be cut mid-clause. It names the thing being
 * sold, the differentiator, and that it is a demo — a portfolio link that
 * oversells itself as a live marketplace costs more trust than it buys.
 */
export const DEFAULT_DESCRIPTION =
  'Browse NFL personal seat licenses on an interactive seat map and see an AI valuation on every listing before you offer. Frontend demo, mock data.'

/** 1200×630 — the size both Open Graph and X render without re-cropping. */
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_ALT =
  'G&D Seats — some seats mean more. A demo marketplace for NFL personal seat licenses.'
