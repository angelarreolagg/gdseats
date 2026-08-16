import { describe, expect, it } from 'vitest'
import INDEX_HTML from '../../../index.html?raw'
import ROBOTS_TXT from '../../../public/robots.txt?raw'
import SITEMAP_XML from '../../../public/sitemap.xml?raw'
import EN_META from '../i18n/locales/en/meta.json'
import { LOCALE_CODES } from '../i18n/locales'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE_PATH,
  SITE_URL,
} from '../config/site'

/**
 * The SEO strings live in two places on purpose — `index.html` is what a scraper
 * fetches and it cannot import TypeScript — and nothing but this file keeps them
 * in step.
 *
 * That duplication was harmless while the host was a placeholder. It is not now:
 * the site is live, `useDocumentMeta` restores `DEFAULT_TITLE` and
 * `DEFAULT_DESCRIPTION` on every navigation back to the grid, and if those drift
 * from the markup the page tells Google one thing and every social scraper
 * another — with nothing on screen looking wrong.
 */
/**
 * Read through Vite's `?raw` rather than `node:fs`.
 *
 * `tsconfig.app.json` deliberately omits the `node` types, so `readFileSync` and
 * `process` do not typecheck under `src/` — and adding them to get this one test
 * compiling would hand `process.env` to every component in the app. `?raw` is
 * typed by `vite/client`, which is already in that list, and the import is
 * resolved by the same pipeline the build uses.
 */
const INDEX = INDEX_HTML

/** `index.html` writes `&amp;` where the constants hold a literal `&`. */
const decode = (value: string) => value.replace(/&amp;/g, '&')

/** Attributes are split across lines by the formatter, so this spans newlines. */
function metaContent(attribute: string, name: string): string {
  const match = INDEX.match(
    new RegExp(`${attribute}="${name}"[\\s\\S]{0,40}?content="([^"]+)"`),
  )
  if (!match) throw new Error(`No <meta ${attribute}="${name}"> in index.html`)
  return decode(match[1])
}

describe('site config against index.html', () => {
  it('ships the same title the app falls back to', () => {
    expect(decode(INDEX.match(/<title>([^<]+)<\/title>/)![1])).toBe(DEFAULT_TITLE)
    expect(metaContent('property', 'og:title')).toBe(DEFAULT_TITLE)
    expect(metaContent('name', 'twitter:title')).toBe(DEFAULT_TITLE)
  })

  it('ships one description everywhere it appears', () => {
    for (const [attribute, name] of [
      ['name', 'description'],
      ['property', 'og:description'],
      ['name', 'twitter:description'],
    ] as const) {
      expect(metaContent(attribute, name)).toBe(DEFAULT_DESCRIPTION)
    }
  })

  it('keeps the description within snippet length', () => {
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  it('builds every absolute URL on SITE_URL', () => {
    expect(INDEX.match(/rel="canonical"[\s\S]{0,40}?href="([^"]+)"/)![1]).toBe(`${SITE_URL}/`)
    expect(metaContent('property', 'og:url')).toBe(`${SITE_URL}/`)

    for (const [attribute, name] of [
      ['property', 'og:image'],
      ['name', 'twitter:image'],
    ] as const) {
      expect(metaContent(attribute, name)).toBe(`${SITE_URL}${OG_IMAGE_PATH}`)
    }

    // Anything that looks like an origin in the markup must be ours — an old host
    // left behind in one JSON-LD `@id` is exactly the kind of thing that survives
    // a careful find-and-replace.
    const origins = new Set(INDEX.match(/https?:\/\/[^"/\s]+/g) ?? [])
    origins.delete('https://schema.org')
    expect([...origins]).toEqual([SITE_URL])
  })

  it('points robots.txt and the sitemap at the same host', () => {
    expect(ROBOTS_TXT).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(SITEMAP_XML).toContain(`<loc>${SITE_URL}/</loc>`)
  })

  it('lists the same locales in the pre-paint script as the app supports', () => {
    const declared = INDEX.match(/var supported = (\[[^\]]+\])/)![1]
    expect(JSON.parse(declared.replace(/'/g, '"'))).toEqual([...LOCALE_CODES])
  })

  it('states the same default title and description in the en bundle', () => {
    expect(EN_META.default.title).toBe(DEFAULT_TITLE)
    expect(EN_META.default.description).toBe(DEFAULT_DESCRIPTION)
  })
})
