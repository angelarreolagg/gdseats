/**
 * The one set of contact details in the demo.
 *
 * Three surfaces quote these now — `AppFooter`'s contact column, the concierge
 * card's "prefer a human" line, and the sell CTA's email — and a marketplace
 * that lists two different phone numbers for itself reads as a scam. They were
 * a private const in `AppFooter` while it was the only caller; the moment a
 * second surface needed them, one owner was the whole point.
 *
 * Every value is invented, like every figure in this demo. The numbers sit in
 * the 555 range reserved for fiction, so there is nothing real to misdial.
 */
export const CONTACT_PHONE = '+1 (512) 555-0142'
export const CONTACT_PHONE_HREF = 'tel:+15125550142'

export const CONTACT_EMAIL = 'help@gdseats.com'
export const CONTACT_EMAIL_HREF = 'mailto:help@gdseats.com'

/**
 * The sell-side address, separate from the general one above.
 *
 * A seller arriving from the CTA has a different question than someone with a
 * support problem, and routing both to one inbox is how a "we handle bulk sales"
 * promise turns into a week of silence. Only the sell CTA uses this.
 */
export const SELL_EMAIL = 'sell@gdseats.com'
export const SELL_EMAIL_HREF = 'mailto:sell@gdseats.com'

/** Season-ticket help, quoted in the FAQ. Third inbox, same reasoning as above. */
export const TICKETS_EMAIL = 'tickets@gdseats.com'

/**
 * The concierge's own line, deliberately NOT the number above.
 *
 * The two answer different things: this one reaches an AI that does not exist,
 * so the control that dials it is a `<button>` explaining the demo; the number
 * above reaches the (equally invented) humans and is a genuine `tel:` anchor
 * wherever it appears. Sharing one number between them would put the same
 * digits behind a button in one place and a link in another, which is exactly
 * the inconsistency the no-`<a href="#">` rule exists to prevent.
 */
export const CONCIERGE_PHONE = '+1 (512) 555-0199'
