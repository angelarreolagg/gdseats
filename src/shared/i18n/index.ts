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
 * i18next rather than FormatJS or Lingui: both want a Babel/SWC extraction step,
 * and this repo builds with `tsc -b` plus Vite and no custom transform. Its core
 * is also plain JS, so `demoNotice.tsx` and `documentMeta.ts` can reach `t()`
 * without a React hook. Services still emit keys.
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
 * Persistence hangs off the event, so `i18n.changeLanguage('ja')` from a console
 * persists and relabels `<html lang>` exactly as a click does.
 */
i18n.on('languageChanged', (next) => {
  if (isLocale(next)) persistLocale(next)
})

/** The active UI locale, narrowed. Falls back rather than trusting `language`. */
export function getLocale(): Locale {
  return isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE
}

/**
 * The Intl locale, which is **not** the UI code. Read here rather than passed,
 * so `formatters.ts` works in services that hold no React hook.
 */
export function getIntlLocale(): string {
  return intlLocaleFor(getLocale())
}

export default i18n
