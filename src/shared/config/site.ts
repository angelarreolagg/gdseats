/**
 * Everything a crawler, a scraper or the browser tab reads.
 *
 * Stated **twice** — here and literally in `index.html` — because a social
 * scraper never runs the bundle and static markup cannot import TypeScript.
 * Change one, change the other; `site.config.test.ts` enforces it.
 */

/**
 * Absolute origin, no trailing slash. Open Graph requires absolute URLs.
 *
 * Moving to a custom domain touches **six** places: here, `index.html`,
 * `robots.txt`, `sitemap.xml`, and the two JSON-LD `@id`s. A GitHub Pages
 * subpath would also need a matching `base` in `vite.config.ts`.
 */
export const SITE_URL = 'https://gdseats.vercel.app'

export const SITE_NAME = 'G&D Seats'

/** Expanded once, in the header tooltip. Used here for structured data. */
export const SITE_LEGAL_NAME = 'Gridiron & Diamond Seats'

/** Front-loaded with the brand; deeper screens invert it. */
export const DEFAULT_TITLE = 'G&D Seats — AI-priced NFL personal seat licenses'

/** 145 chars: Google truncates the snippet around 155–160. */
export const DEFAULT_DESCRIPTION =
  'Browse NFL personal seat licenses on an interactive seat map and see an AI valuation on every listing before you offer. Frontend demo, mock data.'

/** 1200×630 — the size both Open Graph and X render without re-cropping. */
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_ALT =
  'G&D Seats — some seats mean more. A demo marketplace for NFL personal seat licenses.'
