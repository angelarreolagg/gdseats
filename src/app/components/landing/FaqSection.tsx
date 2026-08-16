import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { Reveal } from '@/shared/components/Reveal'

interface FaqItem {
  id: string
  question: string
  answer: string
}

/**
 * The single source for both the accordion and the structured data below it.
 *
 * Anything added here appears in the UI and in the `FAQPage` payload at once —
 * which is the entire reason the JSON-LD is derived rather than written out.
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-a-psl',
    question: 'What is a Personal Seat License (PSL)?',
    answer:
      'A PSL is the right to buy season tickets for one specific seat, for as long as you hold it. You own the seat; the tickets themselves are bought separately each season. It is an asset — you can sell it, and its value moves with the team.',
  },
  {
    id: 'how-it-works',
    question: 'How does G&D Seats work?',
    answer:
      'Pick a franchise, browse the licenses on sale across the venue map, and open one to see how its asking price compares with what the seat is worth. When a listing looks right, make an offer through the platform and we handle the transfer with the club.',
  },
  {
    id: 'is-it-safe',
    question: 'Is G&D Seats safe?',
    answer:
      'Every license and seller is verified before it reaches the board, and funds are held in escrow until the club confirms the transfer into your name. If the transfer does not complete, the money goes back.',
  },
  {
    id: 'how-to-buy',
    question: 'How do I buy a seat license?',
    answer:
      'Open the listing, review the price history and the section comparables, then submit an offer at the total you are willing to pay. The seller responds, and once you agree we take the transfer from there.',
  },
  {
    id: 'how-to-sell',
    question: 'How do I sell my seat license?',
    answer:
      'Tell us the section, row and seat, and we price it against everything else on the market before it goes live. Listing is free — a commission comes out only when the sale completes.',
  },
  {
    id: 'worth',
    question: 'How much is my PSL worth?',
    answer:
      'It depends on the venue, the section, how the team is performing and how much inventory is already listed near your seat. The valuation on every listing is the same model we would run on yours.',
  },
  {
    id: 'transfer',
    question: 'Can I transfer my PSL to someone else?',
    answer:
      'Yes. A seat license is transferable, which is what makes a market for it possible in the first place. Each club sets its own rules on timing and fees, and we handle that paperwork as part of the sale.',
  },
  {
    id: 'season-tickets',
    question: 'Do I still need to buy season tickets after purchasing a PSL?',
    answer:
      'Yes. The license secures your right to that seat; the tickets for each season are a separate purchase from the club. Without the license, the seat is not offered to you at all.',
  },
]

/**
 * One row of the accordion.
 *
 * The panel is **always mounted** and animates its height, rather than being
 * conditionally rendered inside `AnimatePresence`. Two reasons, and both matter:
 * `AnimatePresence`'s exit callback does not fire in jsdom (the hazard already
 * documented on `AIInsightPanel`), and a mounted panel keeps the answers in the
 * document for in-page search and for anything reading the page without running
 * the open handler.
 *
 * `inert` is what makes that safe. A collapsed panel is clipped to zero height
 * but its text is still laid out inside, so without `inert` a keyboard user
 * would tab into invisible content and a screen reader would read answers to
 * questions nobody expanded. React 19 reflects it as a real attribute.
 */
function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem
  open: boolean
  onToggle: () => void
}) {
  const baseId = useId()
  const buttonId = `${baseId}-question`
  const panelId = `${baseId}-answer`

  return (
    <li
      className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
        open ? 'border-accent-ink/40' : 'border-border-hairline hover:border-accent-ink/40'
      }`}
    >
      {/* The heading wraps the button rather than sitting beside it, so the
          question is one node in the document outline and one stop for a screen
          reader's heading navigation — not a heading and a separate control
          saying the same words. */}
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-ink sm:px-5"
        >
          {item.question}
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 text-muted"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </motion.span>
        </button>
      </h3>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-4 pb-4 text-sm text-pretty text-muted sm:px-5">{item.answer}</p>
      </motion.div>
    </li>
  )
}

/**
 * The FAQ band: a sticky heading on the left, the accordion on the right.
 *
 * **One row open at a time.** State is the open row's id rather than a set, so
 * the constraint is structural instead of enforced. Eight expanded answers would
 * run past three screens and bury the footer; keeping the column short is what
 * makes the section scannable rather than a wall to scroll through.
 *
 * The heading sticks at `top-24` to clear the sticky `AppHeader` above it, and
 * only from `lg` — below that it sits above the list in normal flow, because a
 * sticky element in a single column just eats the viewport.
 *
 * The accordion is hand-rolled. The only Radix package here is the tooltip, and
 * the combobox, dialog, sheet and switch are all hand-built for the same
 * reason — a disclosure is a button, an `aria-expanded` and an `aria-controls`,
 * which is not worth a dependency.
 */
export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-pretty text-muted">
            Everything you need to know about buying and selling Personal Seat Licenses
            in G&amp;D Seats.
          </p>
        </Reveal>

        <Reveal>
          <ul className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqRow
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
              />
            ))}
          </ul>
        </Reveal>
      </div>

      <FaqStructuredData />
    </section>
  )
}

/**
 * `FAQPage` structured data, built from the same array the accordion renders.
 *
 * **This departs from how the rest of the SEO strings are handled, on purpose.**
 * `site.ts` and `index.html` state the title and description twice because a
 * scraper reads static markup and static HTML cannot import TypeScript, and
 * `site.config.test.ts` keeps the copies honest. That trade is worth it for
 * three short strings. It is not worth it for eight paragraph-length answers:
 * the duplication would be the largest block of copy in the repo, and the
 * failure mode — an answer edited in the UI and not in the markup, publishing
 * structured data that misquotes the page — is exactly what rich-result
 * penalties are for. Deriving both from one array makes that impossible.
 *
 * The cost is that the payload only exists after React renders. Google executes
 * JavaScript, so it is indexed; a crawler that does not will miss it and read
 * the page's visible text instead, which is the same content.
 */
function FaqStructuredData() {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // The payload is built from a module constant, not from anything a user
      // can reach — there is no injection surface here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
