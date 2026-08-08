import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '../config/site'

// jsdom serves a bare document — it never loads `index.html` — so the tags the
// hook is supposed to *find* have to be planted first. That is the point: the
// hook must edit what is already there, and a test starting from an empty head
// would let a `createElement` implementation pass.
function plantHeadTags() {
  document.head.innerHTML = `
    <meta name="description" content="${DEFAULT_DESCRIPTION}" />
    <meta property="og:title" content="${DEFAULT_TITLE}" />
    <meta property="og:description" content="${DEFAULT_DESCRIPTION}" />
  `
  document.title = DEFAULT_TITLE
}

const descriptions = () => document.querySelectorAll('meta[name="description"]')
const descriptionContent = () =>
  document.querySelector('meta[name="description"]')?.getAttribute('content')

beforeEach(plantHeadTags)
afterEach(() => {
  document.head.innerHTML = ''
})

describe('useDocumentMeta', () => {
  /**
   * Validates: the tab title follows the screen.
   * Why it matters: three screens shared one static title before this hook
   * existed. A visitor with the grid and two franchises open in tabs had no way
   * to tell them apart, and any bookmark or history entry they made was labelled
   * with the product name and nothing else.
   */
  it('writes the supplied title to the document', () => {
    renderHook(() =>
      useDocumentMeta({ title: 'Las Vegas Raiders PSLs', description: 'Seats at Allegiant.' }),
    )

    expect(document.title).toBe('Las Vegas Raiders PSLs')
  })

  /**
   * Validates: the description tag is REWRITTEN, never duplicated.
   * Why it matters: two `<meta name="description">` tags in one document is a
   * real SEO fault, and it is completely invisible on screen — nothing in the UI
   * changes, no test fails, no error is logged. An implementation that reached
   * for `createElement` would look correct in the browser and quietly cost the
   * snippet. This assertion is the only thing standing in front of that.
   */
  it('updates the existing description tag instead of appending another', () => {
    const { rerender } = renderHook(
      ({ description }: { description: string }) =>
        useDocumentMeta({ title: 'Any title', description }),
      { initialProps: { description: 'First description.' } },
    )

    expect(descriptions()).toHaveLength(1)
    expect(descriptionContent()).toBe('First description.')

    rerender({ description: 'Second description.' })

    expect(descriptions()).toHaveLength(1)
    expect(descriptionContent()).toBe('Second description.')
  })

  /**
   * Validates: og:title and og:description track the page too.
   * Why it matters: they are the same claim about the same page. Letting them
   * drift from the title means anyone inspecting the live DOM reads two
   * different answers to what this screen is.
   */
  it('keeps the Open Graph title and description in step', () => {
    renderHook(() =>
      useDocumentMeta({ title: 'Section 106, Row 39', description: 'Two seats at Allegiant.' }),
    )

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Section 106, Row 39',
    )
    expect(
      document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    ).toBe('Two seats at Allegiant.')
  })

  /**
   * Validates: canonical is left alone.
   * Why it matters: every screen lives at the same URL — the screen is React
   * state, not an address. A hook that rewrote canonical per screen would tell a
   * crawler that one document has three canonical addresses, which is a worse
   * signal than the single honest one it already ships with.
   */
  it('does not touch the canonical link', () => {
    document.head.innerHTML += '<link rel="canonical" href="https://gdseats.vercel.app/" />'

    renderHook(() => useDocumentMeta({ title: 'Anything', description: 'Anything.' }))

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://gdseats.vercel.app/',
    )
  })

  /**
   * Validates: unmounting restores the defaults.
   * Why it matters: mostly hygiene in the app, where this fires only when the
   * whole tree goes. In the suite it is what stops one test's title leaking into
   * the next and turning an unrelated failure into a mystery.
   */
  it('restores the default title and description on unmount', () => {
    const { unmount } = renderHook(() =>
      useDocumentMeta({ title: 'Temporary', description: 'Temporary.' }),
    )

    unmount()

    expect(document.title).toBe(DEFAULT_TITLE)
    expect(descriptionContent()).toBe(DEFAULT_DESCRIPTION)
  })

  /**
   * Validates: a missing tag is skipped, not fatal.
   * Why it matters: the hook runs on every screen change. If someone edits
   * `index.html` and drops a tag, the right outcome is a weaker head — not a
   * crash that takes the whole app down on navigation.
   */
  it('survives a head with none of the expected tags', () => {
    document.head.innerHTML = ''

    expect(() =>
      renderHook(() => useDocumentMeta({ title: 'Still fine', description: 'Still fine.' })),
    ).not.toThrow()
    expect(document.title).toBe('Still fine')
  })
})
