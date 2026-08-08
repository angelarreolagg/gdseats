import { showDemoNotice } from '@/shared/utils/demoNotice'

/** Invented, like every figure in this demo — no real number to misdial. */
const CONTACT = [
  { label: '+1 (512) 555-0142', href: 'tel:+15125550142' },
  { label: 'help@gdseats.com', href: 'mailto:help@gdseats.com' },
]

const COMPANY = ['Terms of service', 'Privacy policy', 'Sitemap']

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
  return (
    <footer className="mt-16 border-t border-border-hairline bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="text-base font-semibold tracking-tight text-ink">G&amp;D Seats</span>
          </div>
          <p className="mt-4 text-sm text-muted">
            Your trusted marketplace for premium NFL personal seat licenses and season
            tickets.
          </p>
          <address className="mt-5 text-sm text-muted not-italic">
            1200 Gridiron Way, Suite 480
            <br />
            Austin, TX 78701, US
          </address>
        </div>

        <div className="lg:min-w-44">
          <FooterHeading>Contact us</FooterHeading>
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
          <FooterHeading>Company</FooterHeading>
          <ul className="mt-4 space-y-2.5">
            {COMPANY.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={showDemoNotice}
                  className="rounded text-left text-sm text-muted transition-colors hover:text-ink"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-hairline">
        <div className="mx-auto max-w-7xl px-5 py-5 text-sm text-muted sm:px-8">
          © 2026 G&amp;D Seats. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
