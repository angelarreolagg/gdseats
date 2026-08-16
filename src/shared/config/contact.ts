/**
 * The one set of contact details: a marketplace listing two different phone
 * numbers for itself reads as a scam. Every value is invented, in the 555 range.
 */
export const CONTACT_PHONE = '+1 (512) 555-0142'
export const CONTACT_PHONE_HREF = 'tel:+15125550142'

export const CONTACT_EMAIL = 'help@gdseats.com'
export const CONTACT_EMAIL_HREF = 'mailto:help@gdseats.com'

/** Separate inbox: a seller has a different question than a support case. */
export const SELL_EMAIL = 'sell@gdseats.com'
export const SELL_EMAIL_HREF = 'mailto:sell@gdseats.com'

/** Season-ticket help, quoted in the FAQ. Third inbox, same reasoning as above. */
export const TICKETS_EMAIL = 'tickets@gdseats.com'

/**
 * Deliberately NOT the number above: this one reaches an AI that does not exist,
 * so its control is a `<button>`; the other is a genuine `tel:` anchor.
 */
export const CONCIERGE_PHONE = '+1 (512) 555-0199'
