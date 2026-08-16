import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { persistLocale, resolveInitialLocale } from './detect'
import {
  DEFAULT_LOCALE,
  intlLocaleFor,
  isLocale,
  type Locale,
} from './locales'
import { resources } from './resources'

/**
 * The i18n singleton, initialised at import time.
 *
 * **`i18next` rather than `react-intl` or Lingui, and for one reason this
 * codebase already had:** domain services must stay free of React — they emit
 * semantic names (`TagIconName`, `TrendDirection`, `Recommendation`) and the
 * component layer resolves them. i18next's core is a plain JS singleton with no
 * React dependency, so a non-React module *can* reach for `t()` where it has to.
 * `demoNotice.tsx` and `documentMeta.ts` are the two places that do.
 *
 * That escape hatch is not the default. Services still emit keys; see the rule
 * in CLAUDE.md and the `insights.service` / `marketTrend.service` shapes.
 *
 * The other candidates were weighed and rejected on the same constraint the
 * build has: FormatJS and Lingui both want a Babel/SWC extraction step, and this
 * repo builds with `tsc -b` plus Vite and no custom transform.
 */
void i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'common',
  // React escapes everything it renders; escaping again turns every `&` in
  // "G&D Seats" into `&amp;` on screen.
  interpolation: { escapeValue: false },
  // Keeps `t()` typed as `string` rather than `string | null`, so no call site
  // needs a non-null assertion to satisfy the strict settings in tsconfig.
  returnNull: false,
  // Everything is bundled — see `resources.ts`. With no async load there is
  // nothing to suspend on, and a boundary above the shell would be pure cost.
  react: { useSuspense: false },
})

/**
 * Persistence hangs off the event, not off the switcher.
 *
 * Anything that changes the language — the `LanguageSwitch`, or
 * `i18n.changeLanguage('ja')` typed into a console — writes `localStorage` and
 * relabels `<html lang>` through this one listener. Putting it in the component
 * instead would make the console path silently non-persistent, which is exactly
 * the kind of gap that only shows up after a reload.
 */
i18n.on('languageChanged', (next) => {
  if (isLocale(next)) persistLocale(next)
})

/** The active UI locale, narrowed. Falls back rather than trusting `language`. */
export function getLocale(): Locale {
  return isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE
}

/**
 * The locale `Intl` should format with, which is **not** the UI code.
 *
 * `formatters.ts` reads it from here rather than taking it as a parameter, so
 * ~30 call sites keep saying `formatCurrency(value)` and services stay free of
 * React (i18next is not React). See the note on `LOCALES` for why the two
 * identifiers differ.
 */
export function getIntlLocale(): string {
  return intlLocaleFor(getLocale())
}

export default i18n
