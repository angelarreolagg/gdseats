import userEvent from '@testing-library/user-event'
import { render, screen, setLocale, within } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { FaqSection } from '../components/landing/FaqSection'

/**
 * Queries are scoped to the accordion, not the document: the category chips are
 * buttons too, so an unscoped `getAllByRole('button')` counts eleven.
 *
 * Re-queried each time rather than held, since React replaces nodes on render.
 */
const accordion = () => screen.getByRole('list')
const question = (pattern: RegExp) =>
  within(accordion()).getByRole('button', { name: pattern })
const chip = (name: string) => screen.getByRole('button', { name })

/** The `<li>` a question sits in — where the mobile filter's class lands. */
const rowOf = (pattern: RegExp) => question(pattern).closest('li')

describe('FaqSection', () => {
  it('renders every question as a disclosure button', () => {
    render(<FaqSection />)

    expect(within(accordion()).getAllByRole('button')).toHaveLength(8)
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps all eight questions mounted for the desktop list', async () => {
    render(<FaqSection />)

    await userEvent.click(chip('Selling'))

    expect(within(accordion()).getAllByRole('button')).toHaveLength(8)
  })

  it('hides other categories on mobile while restoring them at sm', async () => {
    render(<FaqSection />)

    await userEvent.click(chip('Selling'))

    expect(rowOf(/how do i sell my seat license/i)).not.toHaveClass('hidden')

    const otherCategory = rowOf(/what is a personal seat license/i)
    expect(otherCategory).toHaveClass('hidden')
    expect(otherCategory).toHaveClass('sm:list-item')
  })

  it('marks the chosen category as pressed', async () => {
    render(<FaqSection />)

    expect(chip('Basics')).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(chip('Buying'))

    expect(chip('Buying')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Basics')).toHaveAttribute('aria-pressed', 'false')
  })

  it('drops the filter out of the desktop document', () => {
    render(<FaqSection />)

    expect(screen.getByRole('group', { name: /filter questions by category/i })).toHaveClass(
      'sm:hidden',
    )
  })

  it('collapses the open answer when the category changes', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/what is a personal seat license/i))
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(chip('Buying'))

    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps one answer open at a time', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/what is a personal seat license/i))
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(question(/how does g&d seats work/i))

    expect(question(/how does g&d seats work/i)).toHaveAttribute('aria-expanded', 'true')
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'false')
  })

  it('collapses a question when it is pressed again', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/is g&d seats safe/i))
    await userEvent.click(question(/is g&d seats safe/i))

    expect(question(/is g&d seats safe/i)).toHaveAttribute('aria-expanded', 'false')
  })

  it('holds collapsed answers out of the tab order', async () => {
    render(<FaqSection />)

    const panelFor = (pattern: RegExp) =>
      document.getElementById(question(pattern).getAttribute('aria-controls') ?? '')

    expect(panelFor(/how much is my psl worth/i)).toHaveAttribute('inert')

    await userEvent.click(question(/how much is my psl worth/i))

    expect(panelFor(/how much is my psl worth/i)).not.toHaveAttribute('inert')
  })

  it('wires each question to its own answer', () => {
    render(<FaqSection />)

    const button = question(/do i still need to buy season tickets/i)
    const panelId = button.getAttribute('aria-controls')
    const panel = document.getElementById(panelId ?? '')

    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('aria-labelledby', button.id)
    expect(panel?.textContent).toMatch(/season tickets themselves are a separate cost/i)
  })

  it('turns emails in an answer into mailto links', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/how do i sell my seat license/i))

    expect(screen.getByRole('link', { name: 'sell@gdseats.com' })).toHaveAttribute(
      'href',
      'mailto:sell@gdseats.com',
    )
  })

  it('stops the address at the domain, not the full stop', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/do i still need to buy season tickets/i))

    const link = screen.getByRole('link', { name: 'tickets@gdseats.com' })
    expect(link).toHaveAttribute('href', 'mailto:tickets@gdseats.com')
    // The sentence keeps its punctuation, outside the anchor.
    expect(link.parentElement?.textContent).toMatch(/tickets@gdseats\.com\.$/)
  })

  it('keeps the structured answers free of markup', () => {
    const { container } = render(<FaqSection />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const payload = JSON.parse(script?.textContent ?? '{}')
    const answers: string[] = payload.mainEntity.map(
      (entry: { acceptedAnswer: { text: string } }) => entry.acceptedAnswer.text,
    )

    expect(answers).toHaveLength(8)
    answers.forEach((answer) => {
      expect(answer).not.toMatch(/</)
      expect(answer).not.toMatch(/mailto:/)
    })
    // The address itself is still stated, just as text.
    expect(answers.join(' ')).toContain('sell@gdseats.com')
  })

  it('quotes no brand or inbox but ours', () => {
    const { container } = render(<FaqSection />)

    expect(container.textContent).not.toMatch(/psl ?scout/i)
    // The structured data carries the same strings, so check the payload too.
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.textContent).not.toMatch(/pslscout/i)
    expect(script?.textContent).toMatch(/@gdseats\.com/)
  })

  it('derives its structured data from the questions it renders', () => {
    const { container } = render(<FaqSection />)

    // A <script> has no role and no accessible name — the documented exception.
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()

    const payload = JSON.parse(script?.textContent ?? '{}')
    expect(payload['@type']).toBe('FAQPage')

    const structured = payload.mainEntity.map((entry: { name: string }) => entry.name)
    const rendered = within(accordion())
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())

    expect(structured).toEqual(rendered)
  })

  it('keeps the structured data in the language the page renders', () => {
    setLocale('es')
    const { container } = render(<FaqSection />)

    const script = container.querySelector('script[type="application/ld+json"]')
    const payload = JSON.parse(script?.textContent ?? '{}')

    expect(payload.inLanguage).toBe('es')

    const structured = payload.mainEntity.map((entry: { name: string }) => entry.name)
    const rendered = within(accordion())
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())

    expect(structured).toEqual(rendered)
    // Not merely equal to each other — actually Spanish, so a bundle that
    // silently fell back to `en` on both sides cannot pass this.
    expect(structured[0]).toMatch(/licencia de asiento personal/i)
  })
})
