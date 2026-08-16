import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { intlLocaleFor, isLocale } from '@/shared/i18n/locales'

export type DocumentMeta = {
  title: string
  description: string
}

/**
 * Writes into the tags `index.html` already declared — never `createElement`.
 * Two `<meta name="description">` in one document is a real SEO fault and is
 * invisible in the UI. Missing nodes are skipped; the fix belongs in the markup.
 */
function setMetaContent(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content)
}

/**
 * Keeps the tab title and description in step with the screen.
 *
 * **Only reaches Google and the browser tab.** Social scrapers never run the
 * bundle, so they see whatever `index.html` shipped with. `canonical` and
 * `og:url` are deliberately untouched: every screen lives at the same URL.
 *
 * Still takes plain strings — the caller resolves the copy. It restores the
 * *translated* defaults, so a switch does not flash English.
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
    // `i18n.language` is a dependency because the cleanup and `og:locale` read the
    // live language, not because the resolved copy above does.
  }, [title, description, t, i18n.language])
}
