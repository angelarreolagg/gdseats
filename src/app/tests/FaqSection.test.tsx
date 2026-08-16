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

  /**
   * Validates: every question stays mounted whatever category is chosen.
   * Why it matters: this is what keeps the desktop view identical to before the
   * filter existed, and it is the whole reason the split is CSS rather than a
   * render branch. It also means find-in-page still reaches every answer, and the
   * structured data keeps describing all eight questions regardless of what a
   * phone happens to be showing. A "simplification" to
   * `FAQ_ITEMS.filter(...)` would unmount five of them and break all three at
   * once, while looking correct on a phone.
   */
  it('keeps all eight questions mounted for the desktop list', async () => {
    render(<FaqSection />)

    await userEvent.click(chip('Selling'))

    expect(within(accordion()).getAllByRole('button')).toHaveLength(8)
  })

  /**
   * Validates: choosing a category hides the other rows below `sm` and restores
   * them from `sm` up.
   * Why it matters: `hidden sm:list-item` is the entire mobile/desktop split — one
   * class pair doing what a `useMediaQuery` branch would otherwise cost, and the
   * app deliberately has only one JS breakpoint. Dropping the `sm:list-item` half
   * would filter the desktop list too, which is the one thing the feature was not
   * supposed to touch, and nothing on a phone would look wrong.
   */
  it('hides other categories on mobile while restoring them at sm', async () => {
    render(<FaqSection />)

    await userEvent.click(chip('Selling'))

    expect(rowOf(/how do i sell my seat license/i)).not.toHaveClass('hidden')

    const otherCategory = rowOf(/what is a personal seat license/i)
    expect(otherCategory).toHaveClass('hidden')
    expect(otherCategory).toHaveClass('sm:list-item')
  })

  /**
   * Validates: the filter marks its selection with `aria-pressed`.
   * Why it matters: the active chip is otherwise distinguished only by a tinted
   * fill, and this app never lets colour be the sole carrier of state. Without the
   * pressed state a screen reader user can operate the filter but never learn
   * which category they are looking at.
   */
  it('marks the chosen category as pressed', async () => {
    render(<FaqSection />)

    expect(chip('Basics')).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(chip('Buying'))

    expect(chip('Buying')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Basics')).toHaveAttribute('aria-pressed', 'false')
  })

  /**
   * Validates: the chips are removed on desktop rather than merely styled away.
   * Why it matters: `sm:hidden` is `display: none`, which takes them out of the
   * tab order and the accessibility tree entirely — that is what makes it safe to
   * render a mobile-only control unconditionally instead of paying for a second JS
   * breakpoint. Swap it for an opacity or visibility trick and a desktop keyboard
   * user tabs through three controls that do nothing they can see.
   */
  it('drops the filter out of the desktop document', () => {
    render(<FaqSection />)

    expect(screen.getByRole('group', { name: /filter questions by category/i })).toHaveClass(
      'sm:hidden',
    )
  })

  /**
   * Validates: switching category collapses whatever was open.
   * Why it matters: the filter exists to make the phone list short. Landing on a
   * new category with an answer already expanded — one belonging to a question no
   * longer on screen — gives back the scroll the filter just saved, and leaves an
   * open panel with no visible trigger.
   */
  it('collapses the open answer when the category changes', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/what is a personal seat license/i))
    expect(question(/what is a personal seat license/i)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(chip('Buying'))

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

    await userEvent.click(question(/is g&d seats safe/i))
    await userEvent.click(question(/is g&d seats safe/i))

    expect(question(/is g&d seats safe/i)).toHaveAttribute('aria-expanded', 'false')
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

    const button = question(/do i still need to buy season tickets/i)
    const panelId = button.getAttribute('aria-controls')
    const panel = document.getElementById(panelId ?? '')

    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('aria-labelledby', button.id)
    expect(panel?.textContent).toMatch(/season tickets themselves are a separate cost/i)
  })

  /**
   * Validates: an email inside an answer renders as a real `mailto:` anchor.
   * Why it matters: the answers are plain strings so one array can feed both the
   * accordion and the structured data — which means the links have to be produced
   * at render time or not at all. "Email us at sell@gdseats.com" with no anchor
   * asks a seller to hand-copy an address out of a collapsed panel, which is the
   * step where they give up.
   */
  it('turns emails in an answer into mailto links', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/how do i sell my seat license/i))

    expect(screen.getByRole('link', { name: 'sell@gdseats.com' })).toHaveAttribute(
      'href',
      'mailto:sell@gdseats.com',
    )
  })

  /**
   * Validates: a sentence-final email keeps its full stop out of the address.
   * Why it matters: one answer ends "…email us at tickets@gdseats.com." and the
   * obvious pattern for matching an address admits dots, so it swallows the
   * punctuation and produces `mailto:tickets@gdseats.com.` — a link that looks
   * perfect, reads perfectly, and bounces. Nothing else in the suite would notice.
   */
  it('stops the address at the domain, not the full stop', async () => {
    render(<FaqSection />)

    await userEvent.click(question(/do i still need to buy season tickets/i))

    const link = screen.getByRole('link', { name: 'tickets@gdseats.com' })
    expect(link).toHaveAttribute('href', 'mailto:tickets@gdseats.com')
    // The sentence keeps its punctuation, outside the anchor.
    expect(link.parentElement?.textContent).toMatch(/tickets@gdseats\.com\.$/)
  })

  /**
   * Validates: the structured data still carries plain text, not markup.
   * Why it matters: the linkifying happens at render time precisely so the
   * JSON-LD stays a clean string — schema.org wants text for `acceptedAnswer`,
   * and an `<a>` leaking into the payload would publish markup to a search engine
   * as the literal answer. If someone ever "simplifies" this by making `answer` a
   * ReactNode, this is what fails.
   */
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

  /**
   * Validates: no answer quotes another company's brand or email domain.
   * Why it matters: this copy was transcribed from the reference site, and the
   * long-form answers are the easiest place for "PSL Scout" or an `@pslscout.com`
   * address to survive the rewrite — they sit mid-paragraph, behind a collapsed
   * panel nobody opens, and they ship straight into the FAQPage structured data
   * where a search engine reads them. Publishing a competitor's support address
   * as our own is the kind of thing that is embarrassing rather than merely wrong.
   */
  it('quotes no brand or inbox but ours', () => {
    const { container } = render(<FaqSection />)

    expect(container.textContent).not.toMatch(/psl ?scout/i)
    // The structured data carries the same strings, so check the payload too.
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.textContent).not.toMatch(/pslscout/i)
    expect(script?.textContent).toMatch(/@gdseats\.com/)
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
    const rendered = within(accordion())
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())

    expect(structured).toEqual(rendered)
  })

  /**
   * Validates: the derivation actually follows the locale.
   * Why it matters: "one array feeds both" became a much stronger claim once the
   * answers came from `t()` — and a much easier one to break, because a payload
   * built from anything but the same resolved array would still look perfect in
   * English and only diverge in the three languages nobody re-reads. Publishing
   * English `FAQPage` data over a Spanish page is structured data that misquotes
   * the page, which is precisely what rich-result penalties are for.
   *
   * One non-English run is enough: the mechanism is the same for all three.
   */
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
