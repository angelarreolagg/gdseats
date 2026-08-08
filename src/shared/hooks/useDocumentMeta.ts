import { useEffect } from 'react'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@/shared/config/site'

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
 */
export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)

    return () => {
      document.title = DEFAULT_TITLE
      setMetaContent('meta[name="description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[property="og:title"]', DEFAULT_TITLE)
      setMetaContent('meta[property="og:description"]', DEFAULT_DESCRIPTION)
    }
  }, [title, description])
}
