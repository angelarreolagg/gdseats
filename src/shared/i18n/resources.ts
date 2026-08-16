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

/** The namespaces, in one place, so the parity test needs no second list. */
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
 * All four bundled statically — ~15 KB gz against a 6.2 MB hero video. Lazy
 * loading would buy nothing and cost a flash of English plus async test setup.
 * Revisit past ~6 locales.
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
