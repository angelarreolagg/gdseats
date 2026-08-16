import { useTranslation } from 'react-i18next'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
} from '@/shared/config/contact'
import { SITE_NAME } from '@/shared/config/site'
import { showDemoNotice } from '@/shared/utils/demoNotice'

/** Shared with the concierge card and the sell CTA — one owner, one number. */
const CONTACT = [
  { label: CONTACT_PHONE, href: CONTACT_PHONE_HREF },
  { label: CONTACT_EMAIL, href: CONTACT_EMAIL_HREF },
]

const COMPANY_KEYS = ['links.terms', 'links.privacy', 'links.sitemap'] as const

/** Fixed: the demo's data is dated 2026 throughout. */
const COPYRIGHT_YEAR = 2026

function FooterHeading({ children }: { children: string }) {
  return <h2 className="text-base font-semibold tracking-tight text-ink">{children}</h2>
}

/**
 * The trust bar. Company links are `<button>`, not `<a href="#">` — a link that
 * does not link lies to a screen reader about what Enter will do. Contact
 * details are genuine anchors, since `tel:`/`mailto:` work without a backend.
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
          {/* Street addresses are not translated. */}
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
