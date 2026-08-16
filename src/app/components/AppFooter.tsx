import { useTranslation } from 'react-i18next'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
} from '@/shared/config/contact'
import { SITE_NAME } from '@/shared/config/site'
import { showDemoNotice } from '@/shared/utils/demoNotice'

/**
 * The details themselves moved to `shared/config/contact` once the concierge
 * card and the sell CTA started quoting them too — a marketplace that lists
 * itself under two different phone numbers reads as a scam.
 */
const CONTACT = [
  { label: CONTACT_PHONE, href: CONTACT_PHONE_HREF },
  { label: CONTACT_EMAIL, href: CONTACT_EMAIL_HREF },
]

const COMPANY_KEYS = ['links.terms', 'links.privacy', 'links.sitemap'] as const

/**
 * Fixed, not `new Date().getFullYear()`.
 *
 * The demo's data is dated 2026 throughout — the generator publishes into that
 * season — so a copyright line that silently rolls forward would be the one
 * thing on the page claiming a different year than everything above it. It is a
 * parameter rather than part of the sentence so no translator has to carry a
 * number they cannot verify.
 */
const COPYRIGHT_YEAR = 2026

function FooterHeading({ children }: { children: string }) {
  return <h2 className="text-base font-semibold tracking-tight text-ink">{children}</h2>
}

/**
 * The trust bar. A marketplace asking for five figures needs an address, a
 * phone number and a policy shelf visible before the offer form, so this is
 * chrome that does real conversion work even with invented data behind it.
 *
 * The Company links are `<button>`, not `<a href="#">`. They navigate nowhere —
 * they explain that they can't — and a link that doesn't link lies to a screen
 * reader about what Enter will do. Contact details are genuine `tel:`/`mailto:`
 * anchors because those protocols work without a backend.
 */
export function AppFooter() {
  const { t } = useTranslation('footer')

  return (
    <footer className="mt-16 border-t border-border-hairline bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="text-base font-semibold tracking-tight text-ink">{SITE_NAME}</span>
          </div>
          <p className="mt-4 text-sm text-muted">{t('trust')}</p>
          {/* The address is invented but it is still a street address, and those
              are not translated — a localised one would name a place that does
              not exist in a format that does not match the country. */}
          <address className="mt-5 text-sm text-muted not-italic">
            1200 Gridiron Way, Suite 480
            <br />
            Austin, TX 78701, US
          </address>
        </div>

        <div className="lg:min-w-44">
          <FooterHeading>{t('contactUs')}</FooterHeading>
          <ul className="mt-4 space-y-2.5">
            {CONTACT.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded text-sm text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:min-w-44">
          <FooterHeading>{t('company')}</FooterHeading>
          <ul className="mt-4 space-y-2.5">
            {COMPANY_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={showDemoNotice}
                  className="rounded text-left text-sm text-muted transition-colors hover:text-ink"
                >
                  {t(key)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-hairline">
        <div className="mx-auto max-w-7xl px-5 py-5 text-sm text-muted sm:px-8">
          {t('copyright', { year: COPYRIGHT_YEAR, brand: SITE_NAME })}
        </div>
      </div>
    </footer>
  )
}
