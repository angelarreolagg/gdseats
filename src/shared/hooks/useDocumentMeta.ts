import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { intlLocaleFor, isLocale } from '@/shared/i18n/locales'

export type DocumentMeta = {
  title: string
  description: string
}

/**
 * Writes into the tags `index.html` already declared.
 *
 * `document.querySelector` and then set `content` — never `createElement`. Two
 * `<meta name="description">` tags in one document is a genuine SEO fault, and it
 * is completely invisible in the UI, so the only thing that would ever catch it
 * is the fact that this function cannot produce one.
 *
 * Missing nodes are skipped rather than created. If a tag is gone from
 * `index.html`, the fix belongs there, where the crawlers that matter will
 * actually see it.
 */
function setMetaContent(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content)
}

/**
 * Keeps the tab title and the page description in step with what is on screen.
 *
 * Scope, honestly stated: **this only reaches Google and the browser tab.**
 * Social scrapers (LinkedIn, Slack, X) fetch the HTML and never run the bundle,
 * so what they render is whatever `index.html` shipped with — the static tags,
 * always the default. That is why the defaults there are written to stand alone
 * rather than as placeholders.
 *
 * `og:title` and `og:description` are updated anyway so the live DOM does not
 * contradict the title beside it when someone inspects the page. `canonical` and
 * `og:url` are deliberately NOT touched: every screen lives at the same URL
 * (`useAppNavigation` holds the screen in React state, not in the address bar),
 * so rewriting them per screen would claim several canonical addresses for one
 * document, which is worse than leaving them alone.
 *
 * The cleanup restores the defaults. In the app that only fires when the whole
 * tree unmounts; its real job is keeping one test from leaking a title into the
 * next.
 *
 * **It still takes plain strings and still knows nothing about seats** — the
 * caller resolves the copy. What it gained is the *defaults*: it restores the
 * translated ones rather than `site.ts`'s English constants, so a visitor
 * reading in Spanish who navigates home does not watch the tab flip to English.
 * Under `en` those two are the same string by construction, and
 * `site.config.test.ts` is what keeps them that way.
 *
 * `og:locale` is updated alongside the rest so the live DOM does not advertise
 * `en_US` over a Japanese page. It reaches nobody who matters — a scraper never
 * runs this — but a page that contradicts itself under inspection is a page
 * nobody trusts.
 */
export function useDocumentMeta({ title, description }: DocumentMeta) {
  const { t, i18n } = useTranslation('meta')

  useEffect(() => {
    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent(
      'meta[property="og:locale"]',
      // Open Graph wants `xx_YY`, not a BCP 47 tag.
      (isLocale(i18n.language) ? intlLocaleFor(i18n.language) : 'en-US').replace('-', '_'),
    )

    return () => {
      document.title = t('default.title')
      setMetaContent('meta[name="description"]', t('default.description'))
      setMetaContent('meta[property="og:title"]', t('default.title'))
      setMetaContent('meta[property="og:description"]', t('default.description'))
    }
    // `i18n.language` is in the list on purpose: the copy above is already
    // resolved by the caller, but the cleanup and `og:locale` read the live
    // language, so a switch has to re-run this rather than leave the previous
    // one's defaults armed.
  }, [title, description, t, i18n.language])
}
