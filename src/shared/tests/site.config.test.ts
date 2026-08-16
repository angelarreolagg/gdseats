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
  /**
   * Validates: the title in the markup is the one the app restores.
   * Why it matters: `useDocumentMeta` rewrites the title per screen and puts
   * `DEFAULT_TITLE` back on the way home. Let the two drift and the tab silently
   * changes wording the moment a visitor navigates — the same page, two names.
   */
  it('ships the same title the app falls back to', () => {
    expect(decode(INDEX.match(/<title>([^<]+)<\/title>/)![1])).toBe(DEFAULT_TITLE)
    expect(metaContent('property', 'og:title')).toBe(DEFAULT_TITLE)
    expect(metaContent('name', 'twitter:title')).toBe(DEFAULT_TITLE)
  })

  /**
   * Validates: one description, stated identically in all three places.
   * Why it matters: `description`, `og:description` and `twitter:description` are
   * three answers to one question. A visitor never sees them, so a stale one can
   * sit in the markup for months and only show up in a search result or a shared
   * link — the two places that matter most and are checked least.
   */
  it('ships one description everywhere it appears', () => {
    for (const [attribute, name] of [
      ['name', 'description'],
      ['property', 'og:description'],
      ['name', 'twitter:description'],
    ] as const) {
      expect(metaContent(attribute, name)).toBe(DEFAULT_DESCRIPTION)
    }
  })

  /**
   * Validates: the description survives a search snippet whole.
   * Why it matters: Google truncates around 160 characters. Past that it is cut
   * mid-clause, which reads as a broken page rather than a long one.
   */
  it('keeps the description within snippet length', () => {
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  /**
   * Validates: every absolute URL in the markup is built on SITE_URL, and the
   * social image is absolute.
   * Why it matters: moving to a custom domain means editing six places. Miss one
   * and the failure is invisible locally — a canonical pointing at the old host
   * tells Google the live page is a duplicate of a domain nobody is on. And Open
   * Graph requires an absolute `og:image`: a relative one yields no preview card
   * at all on most scrapers, which is the entire point of the link.
   */
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

  /**
   * Validates: robots.txt and sitemap.xml name the same host.
   * Why it matters: they are the two files a crawler reads before anything else.
   * A sitemap on the wrong origin is not merely ignored — it is a set of URLs the
   * crawler cannot verify we own.
   */
  it('points robots.txt and the sitemap at the same host', () => {
    expect(ROBOTS_TXT).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(SITEMAP_XML).toContain(`<loc>${SITE_URL}/</loc>`)
  })

  /**
   * Validates: the locale list in the pre-paint script is the app's locale list.
   * Why it matters: that script is what puts the right `lang` on `<html>` before
   * React mounts, and it cannot import `locales.ts` — static markup never can. A
   * fifth locale added in TypeScript and not here would load its bundle
   * correctly and still label the document `en`, so screen readers would read
   * the page aloud in the wrong voice with nothing on screen looking wrong.
   */
  it('lists the same locales in the pre-paint script as the app supports', () => {
    const declared = INDEX.match(/var supported = (\[[^\]]+\])/)![1]
    expect(JSON.parse(declared.replace(/'/g, '"'))).toEqual([...LOCALE_CODES])
  })

  /**
   * Validates: English `meta.json` says exactly what `site.ts` and the markup do.
   * Why it matters: this is the THIRD copy of the title and description, and it
   * exists because `useDocumentMeta` restores translated defaults — an English
   * reader navigating home must land back on the string the scraper already
   * cached, not on a paraphrase of it. The other two copies are kept honest by
   * the cases above; without this one the new copy is the only unguarded one.
   */
  it('states the same default title and description in the en bundle', () => {
    expect(EN_META.default.title).toBe(DEFAULT_TITLE)
    expect(EN_META.default.description).toBe(DEFAULT_DESCRIPTION)
  })
})
