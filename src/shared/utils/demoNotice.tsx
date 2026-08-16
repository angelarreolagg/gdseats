import { Trans } from 'react-i18next'
import { toast } from 'react-toastify'
import i18n from '@/shared/i18n'

const LINKEDIN_URL = 'https://www.linkedin.com/in/angelarreola'

/**
 * The one answer for every control that is chrome but leads nowhere. `toastId`
 * collapses repeats.
 *
 * `.tsx` for the link below — this is the component layer, which is also why it
 * may reach `i18n.t()` directly rather than emitting a key.
 */
export function showDemoNotice() {
  toast.info(i18n.t('common:demo.notAvailable'), { toastId: 'demo-only' })
}

/**
 * The offer button is the one dead control a visitor reaches on purpose, at the
 * end of the whole flow — so it answers with an invitation, not an apology.
 *
 * `closeOnClick` off and a long `autoClose`, or the container dismisses the
 * toast out from under the pointer before the link resolves.
 */
export function showOfferNotice() {
  toast.info(
    <span>
      {/* `<Trans>` rather than two `t()` calls around the `<strong>`: the
          emphasis falls on different words in different languages, and splitting
          the sentence would force every translator to keep our clause order. */}
      <Trans
        i18nKey="common:demo.offerInvitation"
        components={{ strong: <strong className="font-semibold" /> }}
      />
      <br />
      <a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-accent-ink underline underline-offset-2"
      >
        linkedin.com/in/angelarreola
      </a>
    </span>,
    { toastId: 'offer-demo', autoClose: 9000, closeOnClick: false },
  )
}
