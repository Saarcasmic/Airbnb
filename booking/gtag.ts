/* Google tag — GA4 today, Google Ads conversions the moment an AW id exists.

   What Google handed over is a GA4 Measurement ID (G-…), which measures traffic
   but is NOT by itself Google Ads conversion tracking. There are two ways to get
   bookings into Ads, and this file supports both:

     1. Link GA4 to Google Ads and import the `purchase` event below as a
        conversion. Nothing more to change here.
     2. Create a conversion action in Google Ads, which gives an `AW-XXXXXXXXX`
        id and a label like `AbC-D_efGh`. Fill in ADS_CONVERSION below and the
        dedicated conversion hit starts firing alongside the GA4 one.

   The purchase is reported from /confirmed, which is only reachable after
   /api/verify-payment has confirmed a real Razorpay payment — so it cannot fire
   on an abandoned checkout. */

const GA4_MEASUREMENT_ID = 'G-HE29YL301G';

/* Fill both in from Google Ads → Goals → Conversions → your booking action.
   `send_to` becomes `${id}/${label}`. Leave empty and no Ads hit is sent. */
const ADS_CONVERSION = {
  id: 'AW-3195973531',
  label: '', // e.g. 'AbC-D_efGh' — from the "Booking – Purchase" action
};

/* The Ads account id, also needed as its own `gtag('config', …)` in the base tag.
   Without that config line Google silently drops every `send_to` hit below, which
   is the usual reason Ads conversion tracking "does not work". */
export const ADS_ID = ADS_CONVERSION.id;

/* Enquiry conversions: safeTrack event name → Google Ads conversion label.

   A WhatsApp message or a phone tap is *intent*, not revenue. Each of these is
   created in Ads with Count = "One" and value ₹0 on purpose — Ads dedupes per ad
   click server-side, so nothing here needs its own guard, and a bid strategy can
   never mistake an enquiry for a booking. Purchases keep the separate, valued
   action above.

   An entry with an empty label is inert: the GA4 mirror still fires, no Ads hit
   does. That is what lets this file be filled in one action at a time. */
const ADS_EVENT_CONVERSIONS: Record<string, string> = {
  whatsapp_fab_clicked: '', // "WhatsApp Enquiry" — primary
  whatsapp_fallback_clicked: '', // "WhatsApp Enquiry" — same label as above
  phone_tapped: '', // "Phone Tap" — primary
  reserve_clicked: '', // "Reserve Started" — secondary, observation only
};

/** Refs already reported, so a refresh or a later visit cannot double-count. */
const FIRED_KEY = 'pk_gads_fired';
const FIRED_CAP = 20;

declare global {
  interface Window {
    dataLayer?: IArguments[];
  }
}

export const GA_ID = GA4_MEASUREMENT_ID;

/* gtag.js reads the `arguments` object itself — pushing a plain array is not
   understood. Writing straight to dataLayer means calls made before the async
   script has loaded are queued rather than lost, so callers never have to care
   about load order. */
export function gtag(..._args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments as IArguments);
}

function alreadyFired(ref: string): boolean {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(ref);
  } catch {
    // Storage unavailable (private mode). Better to risk a duplicate than to
    // lose the conversion entirely — Google also dedupes on transaction_id.
    return false;
  }
}

function markFired(ref: string): void {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    list.push(ref);
    localStorage.setItem(FIRED_KEY, JSON.stringify(list.slice(-FIRED_CAP)));
  } catch {
    /* nothing we can do, and not worth failing the page over */
  }
}

/** Reports one confirmed booking, at most once per reservation ref.
    `value` is in rupees. */
export function trackPurchaseOnce(ref: string, value: number, nights: number): void {
  if (!ref || alreadyFired(ref)) return;
  markFired(ref);

  // GA4 ecommerce. transaction_id is what lets Google dedupe server-side too,
  // and what makes the event importable into Ads as a conversion.
  gtag('event', 'purchase', {
    transaction_id: ref,
    value,
    currency: 'INR',
    items: [
      {
        item_id: 'direct-booking',
        item_name: 'Pyari Kunj Vrindavan — direct booking',
        price: value,
        quantity: nights,
      },
    ],
  });

  // The dedicated Google Ads hit, once a conversion action exists.
  if (ADS_CONVERSION.id && ADS_CONVERSION.label) {
    gtag('event', 'conversion', {
      send_to: `${ADS_CONVERSION.id}/${ADS_CONVERSION.label}`,
      transaction_id: ref,
      value,
      currency: 'INR',
    });
  }
}

/** True when an Ads conversion action has been configured above. */
export const adsConversionConfigured = !!(ADS_CONVERSION.id && ADS_CONVERSION.label);

/* Mirrors one product event to Google.

   Called from safeTrack() for every event the site already reports to PostHog,
   so the funnel that PostHog sees is the funnel GA4 sees — without a gtag() call
   having to be threaded through thirty call sites. Only the handful of names in
   ADS_EVENT_CONVERSIONS additionally reach Google Ads.

   Deliberately silent when nothing is configured: no Ads id, no Ads hit. */
export function reportEventToGoogle(name: string, props: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !name) return;

  // GA4 accepts arbitrary event names, so the PostHog taxonomy carries over as is.
  gtag('event', name, props);

  const label = ADS_EVENT_CONVERSIONS[name];
  if (ADS_CONVERSION.id && label) {
    // No value and no transaction_id: these are enquiries, counted once per click.
    gtag('event', 'conversion', { send_to: `${ADS_CONVERSION.id}/${label}` });
  }
}
