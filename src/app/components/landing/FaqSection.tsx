import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/shared/components/Reveal";
import { SELL_EMAIL, TICKETS_EMAIL } from "@/shared/config/contact";

/**
 * The categories, in the order the chips present them.
 *
 * Ordered as a visitor arrives rather than alphabetically: understand what the
 * thing is, then how to get one, then how to get rid of one. The first entry is
 * also the mobile default, so it has to be the one that answers a stranger.
 *
 * These are ids now rather than the words themselves — the labels live in
 * `faq.json` — but the array still owns the order, because the order is an
 * editorial decision and not something a translator should be able to change.
 *
 * A plain union rather than an enum — `erasableSyntaxOnly` is on.
 */
const FAQ_CATEGORIES = ["basics", "buying", "selling"] as const;

type FaqCategory = (typeof FAQ_CATEGORIES)[number];

interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

/**
 * The structure of the FAQ: which questions exist, in what order, in which
 * category, and which of them interpolate an address.
 *
 * The words moved to `faq.json`; this is what is left, and it is deliberately
 * still one array — the accordion and the `FAQPage` payload are both built from
 * it, which is the entire reason the JSON-LD is derived rather than written out.
 *
 * The email addresses are passed as values rather than living in the copy, so a
 * translator cannot accidentally alter an inbox that has to match
 * `shared/config/contact.ts`. `linkifyEmails` then turns them into anchors at
 * render, which is what lets `answer` stay a plain string for schema.org.
 */
const FAQ_STRUCTURE: Array<{
  id: string;
  category: FaqCategory;
  values?: Record<string, string>;
}> = [
  { id: "whatIsAPsl", category: "basics" },
  { id: "howItWorks", category: "basics" },
  { id: "isItSafe", category: "basics" },
  { id: "howToBuy", category: "buying" },
  { id: "howToSell", category: "selling", values: { sellEmail: SELL_EMAIL } },
  { id: "worth", category: "selling" },
  { id: "transfer", category: "selling" },
  {
    id: "seasonTickets",
    category: "buying",
    values: { ticketsEmail: TICKETS_EMAIL },
  },
];

/**
 * Splits on an email address, capturing it, so `String.split` returns the parts
 * alternating: even indices are plain text, odd indices are the addresses.
 *
 * The trailing group is `(?:\.[\w-]+)+` rather than anything ending in `[\w.]+`
 * on purpose. One answer ends "…email us at tickets@gdseats.com." and a
 * character class that admits dots swallows the full stop into the address,
 * producing a `mailto:` that bounces. Requiring word characters after every dot
 * stops the match at `.com` and leaves the sentence its punctuation.
 */
const EMAIL_SPLIT = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g

/**
 * Turns the email addresses inside an answer into real `mailto:` anchors.
 *
 * **This exists so `answer` can stay a plain string.** The same array feeds the
 * accordion and the `FAQPage` structured data, and schema.org wants text, not
 * markup — so the answers cannot become `ReactNode`s without either breaking the
 * payload or duplicating every answer into a second, drifting copy. Linkifying
 * at render time keeps one source and gives the UI the anchors anyway.
 *
 * Alternating `split` output rather than a `.test()` loop: `EMAIL_SPLIT` carries
 * the `g` flag, and `RegExp.test` on a global regex advances `lastIndex` between
 * calls, so the same string would match and then not match. Indexing by parity
 * has no state to get wrong.
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
  filteredOut,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  /** Outside the chosen category. Hides the row below `sm` only. */
  filteredOut: boolean;
  onToggle: () => void;
}) {
  const baseId = useId();
  const buttonId = `${baseId}-question`;
  const panelId = `${baseId}-answer`;

  return (
    <li
      // `hidden sm:list-item` is the entire mobile/desktop split, and it is CSS
      // rather than a render branch on purpose — every row stays mounted, so the
      // desktop list is untouched, browser find-in-page still reaches every
      // answer, and no second JS breakpoint joins the one in the listing
      // overlay. `display: none` also takes a filtered row out of the
      // accessibility tree and the tab order outright, which is exactly right.
      className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
        filteredOut ? "hidden sm:list-item " : ""
      }${
        open
          ? "border-accent-ink/40"
          : "border-border-hairline hover:border-accent-ink/40"
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
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-4 pb-4 text-sm text-pretty text-muted sm:px-5">
          {linkifyEmails(item.answer)}
        </p>
      </motion.div>
    </li>
  );
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
 * **Below `sm` the list is filtered to one category; from `sm` up it is the full
 * eight, exactly as before.** Eight rows plus eight answers is a long scroll on a
 * phone, where the same list on a desktop column is barely a screen — so the
 * filter earns its place on one and would be clutter on the other.
 *
 * **The split is CSS, not a JS breakpoint**, which matters architecturally:
 * `useMediaQuery` is a last resort here and the app has exactly one such
 * breakpoint (the listing overlay's aside, which needs one because two copies of
 * a form would collide on `id`). Nothing collides here. Every row stays mounted
 * and non-matching ones take `hidden sm:list-item`, so the desktop DOM is
 * unchanged, find-in-page still reaches every answer, and the structured data
 * below keeps describing all eight questions no matter what is on screen.
 *
 * The accordion is hand-rolled. The only Radix package here is the tooltip, and
 * the combobox, dialog, sheet and switch are all hand-built for the same
 * reason — a disclosure is a button, an `aria-expanded` and an `aria-controls`,
 * which is not worth a dependency.
 */
export function FaqSection() {
  const { t } = useTranslation("faq");
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState<FaqCategory>(FAQ_CATEGORIES[0]);

  /**
   * The resolved items — still one array, still feeding both the accordion and
   * the structured data, now in whatever language is active.
   *
   * That the payload follows the locale is the point rather than a side effect:
   * publishing English `FAQPage` data over a Spanish page would be structured
   * data that misquotes what a visitor can see, which is exactly what rich-result
   * penalties are for. `FaqSection.test.tsx` asserts the structured questions
   * equal the rendered button labels, under `en` and under `es`.
   */
  const items: FaqItem[] = useMemo(
    () =>
      FAQ_STRUCTURE.map((entry) => ({
        id: entry.id,
        category: entry.category,
        question: t(`items.${entry.id}.question`),
        answer: t(`items.${entry.id}.answer`, entry.values ?? {}),
      })),
    [t],
  );

  /** Switching category collapses whatever was open. The point of the filter is
   *  a short list, and arriving at a new one already a screen tall defeats it. */
  const chooseCategory = (next: FaqCategory) => {
    setCategory(next);
    setOpenId(null);
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
            {t("heading")}
          </h2>
          <p className="mt-3 text-sm text-pretty text-muted">{t("subheading")}</p>
        </Reveal>

        <Reveal>
          {/*
           * Phone-only, via `sm:hidden` rather than a render branch.
           *
           * `display: none` removes these from the tab order and the
           * accessibility tree completely, so a desktop visitor cannot reach an
           * inert control — which is the only thing that would have justified
           * paying for a second `useMediaQuery` breakpoint. Desktop therefore
           * renders exactly what it rendered before: no chips, all eight rows.
           *
           * `aria-pressed` on plain buttons inside a labelled `role="group"`,
           * matching `LeagueSwitch`. These are toggles, not tabs — a tablist
           * would promise arrow-key navigation between panels that do not exist.
           */}
          <div
            role="group"
            aria-label={t("filterLabel")}
            className="mb-4 flex flex-wrap gap-2 sm:hidden"
          >
            {FAQ_CATEGORIES.map((option) => {
              const selected = option === category;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseCategory(option)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors ${
                    selected
                      ? "bg-accent/15 text-accent-ink ring-1 ring-accent-ink/30"
                      : "bg-surface text-muted ring-1 ring-border-hairline"
                  }`}
                >
                  {t(`categories.${option}`)}
                </button>
              );
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
  );
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
function FaqStructuredData({ items }: { items: FaqItem[] }) {
  const { i18n } = useTranslation();

  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    // Declared, because the answers below are translated and a crawler reading
    // Spanish prose labelled `en-US` is worse than no label at all. The `@graph`
    // in index.html keeps `en-US`: that markup is static and never translated.
    inLanguage: i18n.language,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // The payload is built from module constants and bundled locale files, not
      // from anything a user can reach — there is no injection surface here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
