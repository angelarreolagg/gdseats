import { useId, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/shared/components/Reveal'
import { SELL_EMAIL, TICKETS_EMAIL } from '@/shared/config/contact'

/**
 * Ids, not labels — the labels live in `faq.json`. The array owns the order,
 * which is editorial and not a translator's to change. First entry is the
 * mobile default.
 */
const FAQ_CATEGORIES = ['basics', 'buying', 'selling'] as const

type FaqCategory = (typeof FAQ_CATEGORIES)[number]

interface FaqItem {
  id: string
  category: FaqCategory
  question: string
  answer: string
}

/**
 * Which questions exist, in what order and category, and which interpolate an
 * address. One array feeds both the accordion and the `FAQPage` payload.
 *
 * Emails are values, not copy, so a translator cannot alter an inbox that has
 * to match `shared/config/contact.ts`.
 */
const FAQ_STRUCTURE: Array<{
  id: string
  category: FaqCategory
  values?: Record<string, string>
}> = [
  { id: 'whatIsAPsl', category: 'basics' },
  { id: 'howItWorks', category: 'basics' },
  { id: 'isItSafe', category: 'basics' },
  { id: 'howToBuy', category: 'buying' },
  { id: 'howToSell', category: 'selling', values: { sellEmail: SELL_EMAIL } },
  { id: 'worth', category: 'selling' },
  { id: 'transfer', category: 'selling' },
  {
    id: 'seasonTickets',
    category: 'buying',
    values: { ticketsEmail: TICKETS_EMAIL },
  },
]

/**
 * Splits on an email, capturing it: even indices are text, odd are addresses.
 * The trailing group is `(?:\.[\w-]+)+` so a sentence-final "…com." does not
 * swallow the full stop into a `mailto:` that bounces.
 */
const EMAIL_SPLIT = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g

/**
 * Emails to `mailto:` anchors at render, which is what lets `answer` stay a
 * plain string for the schema.org payload.
 *
 * Index parity rather than `.test()`: `EMAIL_SPLIT` is global, and `RegExp.test`
 * advances `lastIndex` between calls.
 */
function linkifyEmails(answer: string) {
  return answer.split(EMAIL_SPLIT).map((part, index) =>
    index % 2 === 1 ? (
      <a
        // Index in the key, not the address alone: an answer that mentioned the
        // same inbox twice would otherwise give two siblings one key.
        key={`${index}-${part}`}
        href={`mailto:${part}`}
        className="rounded font-medium text-accent-ink underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

/**
 * The panel is always mounted and clipped to zero height, not unmounted —
 * `AnimatePresence`'s exit callback does not fire in jsdom, and a mounted panel
 * stays reachable by find-in-page. `inert` is what keeps the collapsed text out
 * of the tab order and the accessibility tree.
 */
function FaqRow({
  item,
  open,
  filteredOut,
  onToggle,
}: {
  item: FaqItem
  open: boolean
  /** Outside the chosen category. Hides the row below `sm` only. */
  filteredOut: boolean
  onToggle: () => void
}) {
  const baseId = useId()
  const buttonId = `${baseId}-question`
  const panelId = `${baseId}-answer`

  return (
    <li
      // `hidden sm:list-item` is the entire mobile/desktop split, and it is CSS
      // rather than a render branch on purpose — every row stays mounted, so the
      // desktop list is untouched, browser find-in-page still reaches every
      // answer, and no second JS breakpoint joins the one in the listing
      // overlay. `display: none` also takes a filtered row out of the
      // accessibility tree and the tab order outright, which is exactly right.
      className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
        filteredOut ? 'hidden sm:list-item ' : ''
      }${
        open
          ? 'border-accent-ink/40'
          : 'border-border-hairline hover:border-accent-ink/40'
      }`}
    >
      {/* The heading wraps the button so the question is one node in the outline,
          not a heading plus a control saying the same words. */}
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
        <p className="px-4 pb-4 text-sm text-pretty text-muted sm:px-5">
          {linkifyEmails(item.answer)}
        </p>
      </motion.div>
    </li>
  )
}

/**
 * The FAQ band. One row open at a time — state is the open id, not a set.
 *
 * Below `sm` the list filters to one category; from `sm` up all eight show. The
 * split is CSS (`hidden sm:list-item`), not a JS breakpoint, so every row stays
 * mounted and the structured data still describes all eight.
 */
export function FaqSection() {
  const { t } = useTranslation('faq')
  const [openId, setOpenId] = useState<string | null>(null)
  const [category, setCategory] = useState<FaqCategory>(FAQ_CATEGORIES[0])

  /** Resolved items — one array, feeding both the accordion and the JSON-LD. */
  const items: FaqItem[] = useMemo(
    () =>
      FAQ_STRUCTURE.map((entry) => ({
        id: entry.id,
        category: entry.category,
        question: t(`items.${entry.id}.question`),
        answer: t(`items.${entry.id}.answer`, entry.values ?? {}),
      })),
    [t],
  )

  /** Switching category collapses whatever was open. The point of the filter is
   *  a short list, and arriving at a new one already a screen tall defeats it. */
  const chooseCategory = (next: FaqCategory) => {
    setCategory(next)
    setOpenId(null)
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
            {t('heading')}
          </h2>
          <p className="mt-3 text-sm text-pretty text-muted">{t('subheading')}</p>
        </Reveal>

        <Reveal>
          {/* Phone-only via `sm:hidden`, so desktop cannot reach an inert control and no
              second `useMediaQuery` breakpoint is needed. `aria-pressed` toggles, not
              tabs — a tablist would promise arrow-key navigation between panels. */}
          <div
            role="group"
            aria-label={t('filterLabel')}
            className="mb-4 flex flex-wrap gap-2 sm:hidden"
          >
            {FAQ_CATEGORIES.map((option) => {
              const selected = option === category
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseCategory(option)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors ${
                    selected
                      ? 'bg-accent/15 text-accent-ink ring-1 ring-accent-ink/30'
                      : 'bg-surface text-muted ring-1 ring-border-hairline'
                  }`}
                >
                  {t(`categories.${option}`)}
                </button>
              )
            })}
          </div>

          <ul className="space-y-3">
            {items.map((item) => (
              <FaqRow
                key={item.id}
                item={item}
                open={openId === item.id}
                filteredOut={item.category !== category}
                onToggle={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              />
            ))}
          </ul>
        </Reveal>
      </div>

      <FaqStructuredData items={items} />
    </section>
  )
}

/**
 * `FAQPage` data derived from the same array the accordion renders, rather than
 * duplicated into `index.html` the way the title and description are: eight
 * paragraph-length answers would be the largest copy block in the repo, and a
 * stale copy publishes structured data that misquotes the page.
 */
function FaqStructuredData({ items }: { items: FaqItem[] }) {
  const { i18n } = useTranslation()

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    // Declared, because the answers below are translated and a crawler reading
    // Spanish prose labelled `en-US` is worse than no label at all. The `@graph`
    // in index.html keeps `en-US`: that markup is static and never translated.
    inLanguage: i18n.language,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // The payload is built from module constants and bundled locale files, not
      // from anything a user can reach — there is no injection surface here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
