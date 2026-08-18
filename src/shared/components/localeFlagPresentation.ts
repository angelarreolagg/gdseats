import BR from 'country-flag-icons/react/3x2/BR'
import JP from 'country-flag-icons/react/3x2/JP'
import MX from 'country-flag-icons/react/3x2/MX'
import US from 'country-flag-icons/react/3x2/US'
import { LOCALES, type Locale } from '../i18n/locales'

// The library types each flag's props as `HTMLAttributes<HTMLElement & SVGElement>`,
// not React's own `SVGProps<SVGSVGElement>` — borrowing `typeof US` instead of
// redeclaring that shape is what keeps `className`/`aria-hidden` assignable below.
type FlagComponent = typeof US

/**
 * ISO 3166-1 flags, one React component per country — imported from
 * `country-flag-icons`'s per-country subpaths (each its own `sideEffects: false`
 * module) rather than its barrel export, so only these four small SVGs, not
 * the ~250-flag index, ever reach the bundle.
 */
const FLAG_BY_COUNTRY: Record<string, FlagComponent> = { US, MX, BR, JP }

/**
 * Derived from `LOCALES`' `country` field rather than a second hard-coded
 * `Locale → Flag` list, so the two can't drift the way `getListingCountForTeam`
 * exists to stop team counts drifting. Lives in `components/` — not in
 * `locales.ts`, which today has no React dependency and is read by the
 * i18n singleton and `detect.ts` — for the same reason `trendPresentation.ts`
 * keeps an icon out of its service.
 */
export const LOCALE_FLAG: Record<Locale, FlagComponent> = Object.fromEntries(
  LOCALES.map((entry) => [entry.code, FLAG_BY_COUNTRY[entry.country]]),
) as Record<Locale, FlagComponent>
