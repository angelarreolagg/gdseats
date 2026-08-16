import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { FaqSection } from '../components/landing/FaqSection'

/** Re-query rather than holding nodes: React replaces them across a re-render. */
const question = (pattern: RegExp) => screen.getByRole('button', { name: pattern })

describe('FaqSection', () => {
  it('renders every question as a disclosure button', () => {
    render(<FaqSection />)

    expect(screen.getAllByRole('button')).toHaveLength(8)
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * Validates: opening a second question closes the first.
   * Why it matters: eight expanded answers run past three screens and bury both
   * the footer and everything a visitor was scrolling toward. The single-open rule
   * is what keeps the column short enough to scan, and it is the kind of behaviour
   * that silently becomes multi-open the moment someone swaps the state for a Set.
   */
  it('keeps one answer open at a time', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/what is a personal seat license/i))
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(question(/how does g&d seats work/i))

    expect(question(/how does g&d seats work/i)).toHaveAttribute('aria-expanded', 'true')
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * Validates: clicking the open question closes it again.
   * Why it matters: an accordion where the only way to close a row is to open a
   * different one traps a visitor into always having something expanded, and the
   * chevron pointing up becomes a lie about what the control does.
   */
  it('collapses a question when it is pressed again', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/is it safe to buy here/i))
    await userEvent.click(question(/is it safe to buy here/i))

    expect(question(/is it safe to buy here/i)).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * Validates: a collapsed answer is inert, and an expanded one is not.
   * Why it matters: the panels are never unmounted, only clipped to zero height —
   * so without `inert` the text is still laid out, still focusable and still read
   * aloud. A keyboard user would tab into an invisible paragraph and a screen
   * reader would recite all eight answers to questions nobody opened, which is
   * strictly worse than having no accordion at all.
   */
  it('holds collapsed answers out of the tab order', async () => {
    render(<FaqSection />)

    const panelFor = (pattern: RegExp) =>
      document.getElementById(question(pattern).getAttribute('aria-controls') ?? '')

    expect(panelFor(/how much is my psl worth/i)).toHaveAttribute('inert')

    await userEvent.click(question(/how much is my psl worth/i))

    expect(panelFor(/how much is my psl worth/i)).not.toHaveAttribute('inert')
  })

  /**
   * Validates: each question's `aria-controls` resolves to a region labelled back
   * by that same question.
   * Why it matters: the ids come from `useId()` per row, so a copy-paste that
   * shared one id between rows would wire every button to the same panel — and
   * nothing visual would change, because the open state is tracked separately. A
   * screen reader user would be the only one to discover it.
   */
  it('wires each question to its own answer', () => {
    render(<FaqSection />)

    const button = question(/can i still buy season tickets|do i still buy season tickets/i)
    const panelId = button.getAttribute('aria-controls')
    const panel = document.getElementById(panelId ?? '')

    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('aria-labelledby', button.id)
    expect(panel?.textContent).toMatch(/the license secures your right to that seat/i)
  })

  /**
   * Validates: the FAQPage structured data quotes exactly the questions on screen.
   * Why it matters: this is the whole justification for deriving the JSON-LD from
   * the same array the UI renders instead of duplicating it into `index.html` the
   * way the title and description are. Structured data that promises Google an
   * answer the page does not contain is what rich-result penalties are for — and a
   * hand-maintained copy of eight paragraphs would drift on the first edit. If this
   * passes, the two cannot disagree.
   */
  it('derives its structured data from the questions it renders', () => {
    const { container } = render(<FaqSection />)

    // A <script> has no role and no accessible name — the documented exception.
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()

    const payload = JSON.parse(script?.textContent ?? '{}')
    expect(payload['@type']).toBe('FAQPage')

    const structured = payload.mainEntity.map((entry: { name: string }) => entry.name)
    const rendered = screen.getAllByRole('button').map((button) => button.textContent?.trim())

    expect(structured).toEqual(rendered)
  })
})
