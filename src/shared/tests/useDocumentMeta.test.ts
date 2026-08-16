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
  it('writes the supplied title to the document', () => {
    renderHook(() =>
      useDocumentMeta({ title: 'Las Vegas Raiders PSLs', description: 'Seats at Allegiant.' }),
    )

    expect(document.title).toBe('Las Vegas Raiders PSLs')
  })

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

  it('does not touch the canonical link', () => {
    document.head.innerHTML += '<link rel="canonical" href="https://gdseats.vercel.app/" />'

    renderHook(() => useDocumentMeta({ title: 'Anything', description: 'Anything.' }))

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://gdseats.vercel.app/',
    )
  })

  it('restores the default title and description on unmount', () => {
    const { unmount } = renderHook(() =>
      useDocumentMeta({ title: 'Temporary', description: 'Temporary.' }),
    )

    unmount()

    expect(document.title).toBe(DEFAULT_TITLE)
    expect(descriptionContent()).toBe(DEFAULT_DESCRIPTION)
  })

  it('survives a head with none of the expected tags', () => {
    document.head.innerHTML = ''

    expect(() =>
      renderHook(() => useDocumentMeta({ title: 'Still fine', description: 'Still fine.' })),
    ).not.toThrow()
    expect(document.title).toBe('Still fine')
  })
})
