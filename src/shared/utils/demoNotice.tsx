import { Trans } from 'react-i18next'
import { toast } from 'react-toastify'
import i18n from '@/shared/i18n'

const LINKEDIN_URL = 'https://www.linkedin.com/in/angelarreola'

/**
 * The single answer for every control that exists as chrome but leads nowhere.
 *
 * A footer link or a Share button that silently does nothing reads as a bug; one
 * that says why reads as a demo. Routed through here so the wording — and the
 * fact that there is exactly one wording — can't drift as more dead chrome is
 * added.
 *
 * `toastId` collapses repeats: a user clicking three policy links in a row gets
 * one toast, not a stack of identical ones.
 *
 * This file is `.tsx` because the offer notice carries a link. That is a UI
 * concern, not the React-free rule domain services live under — those emit icon
 * names so the component layer can resolve them; this *is* the component layer.
 *
 * It reaches the i18n singleton directly rather than through `useTranslation`,
 * because a toast is fired from an event handler and there is no component here
 * to hold a hook. This is the escape hatch i18next's plain-JS core was chosen
 * for — and the reason it stays legitimate is that this is UI, not a domain
 * service. The §6 keys-not-sentences rule is about the layers underneath.
 */
export function showDemoNotice() {
  toast.info(i18n.t('common:demo.notAvailable'), { toastId: 'demo-only' })
}

/**
 * The offer button gets its own answer, because it is the one dead control a
 * visitor reaches on purpose.
 *
 * Every other piece of chrome here is furniture. Submitting an offer is the end
 * of the whole flow — pick a team, read the verdict, make the call — so the
 * person who presses it has understood the product and is worth talking to. The
 * demo answers with an invitation rather than an apology.
 *
 * `closeOnClick` is off and `autoClose` is long, because the container closes a
 * toast on any click: with the defaults the toast would dismiss itself out from
 * under the pointer before the link resolved.
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
