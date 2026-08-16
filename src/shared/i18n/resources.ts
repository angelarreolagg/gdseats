import enAnalyzer from './locales/en/analyzer.json'
import enCommon from './locales/en/common.json'
import enFaq from './locales/en/faq.json'
import enFooter from './locales/en/footer.json'
import enHeader from './locales/en/header.json'
import enHero from './locales/en/hero.json'
import enLanding from './locales/en/landing.json'
import enListing from './locales/en/listing.json'
import enMeta from './locales/en/meta.json'
import enSearch from './locales/en/search.json'
import enTeams from './locales/en/teams.json'

import esAnalyzer from './locales/es/analyzer.json'
import esCommon from './locales/es/common.json'
import esFaq from './locales/es/faq.json'
import esFooter from './locales/es/footer.json'
import esHeader from './locales/es/header.json'
import esHero from './locales/es/hero.json'
import esLanding from './locales/es/landing.json'
import esListing from './locales/es/listing.json'
import esMeta from './locales/es/meta.json'
import esSearch from './locales/es/search.json'
import esTeams from './locales/es/teams.json'

import ptAnalyzer from './locales/pt-BR/analyzer.json'
import ptCommon from './locales/pt-BR/common.json'
import ptFaq from './locales/pt-BR/faq.json'
import ptFooter from './locales/pt-BR/footer.json'
import ptHeader from './locales/pt-BR/header.json'
import ptHero from './locales/pt-BR/hero.json'
import ptLanding from './locales/pt-BR/landing.json'
import ptListing from './locales/pt-BR/listing.json'
import ptMeta from './locales/pt-BR/meta.json'
import ptSearch from './locales/pt-BR/search.json'
import ptTeams from './locales/pt-BR/teams.json'

import jaAnalyzer from './locales/ja/analyzer.json'
import jaCommon from './locales/ja/common.json'
import jaFaq from './locales/ja/faq.json'
import jaFooter from './locales/ja/footer.json'
import jaHeader from './locales/ja/header.json'
import jaHero from './locales/ja/hero.json'
import jaLanding from './locales/ja/landing.json'
import jaListing from './locales/ja/listing.json'
import jaMeta from './locales/ja/meta.json'
import jaSearch from './locales/ja/search.json'
import jaTeams from './locales/ja/teams.json'

/**
 * The namespaces, in one place, so `i18n.locales.test.ts` can walk them without
 * a second list to keep in step.
 *
 * They carry the domain structure the folder layout deliberately does not: the
 * locale files are centralised (one folder a translator can be handed) rather
 * than co-located under `src/domains/*`, and JSON creates no import edges, so
 * nothing about the dependency DAG cares either way.
 */
export const NAMESPACES = [
  'common',
  'header',
  'footer',
  'hero',
  'teams',
  'search',
  'listing',
  'analyzer',
  'landing',
  'faq',
  'meta',
] as const

export type Namespace = (typeof NAMESPACES)[number]

/**
 * All four locales, bundled statically — no `import()`, no `useSuspense`.
 *
 * Roughly 8–12 KB gzipped in total, against a 6.2 MB hero video and 57 KB gz of
 * GSAP for one headline. Lazy-loading would buy nothing measurable here and cost
 * a whole class of bugs: a flash of English before the Spanish chunk resolves, a
 * Suspense boundary above the shell, and async setup in every test file.
 *
 * Revisit past ~6 locales or ~50 KB gz, at which point the move is `import()`
 * per locale plus `i18n.addResourceBundle`.
 */
export const resources = {
  en: {
    common: enCommon,
    header: enHeader,
    footer: enFooter,
    hero: enHero,
    teams: enTeams,
    search: enSearch,
    listing: enListing,
    analyzer: enAnalyzer,
    landing: enLanding,
    faq: enFaq,
    meta: enMeta,
  },
  es: {
    common: esCommon,
    header: esHeader,
    footer: esFooter,
    hero: esHero,
    teams: esTeams,
    search: esSearch,
    listing: esListing,
    analyzer: esAnalyzer,
    landing: esLanding,
    faq: esFaq,
    meta: esMeta,
  },
  'pt-BR': {
    common: ptCommon,
    header: ptHeader,
    footer: ptFooter,
    hero: ptHero,
    teams: ptTeams,
    search: ptSearch,
    listing: ptListing,
    analyzer: ptAnalyzer,
    landing: ptLanding,
    faq: ptFaq,
    meta: ptMeta,
  },
  ja: {
    common: jaCommon,
    header: jaHeader,
    footer: jaFooter,
    hero: jaHero,
    teams: jaTeams,
    search: jaSearch,
    listing: jaListing,
    analyzer: jaAnalyzer,
    landing: jaLanding,
    faq: jaFaq,
    meta: jaMeta,
  },
} as const
