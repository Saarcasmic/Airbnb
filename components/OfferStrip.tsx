'use client';

/* The hero offer pill. Shows the live percentage and code, flips to an applied
   state once the guest taps Apply, and stays hidden when no offer is running.

   It used to sit inside the review step, which hid it for free once a booking was
   confirmed; in the hero that has to be explicit. */

import { useBooking } from '@/booking/BookingProvider';

export default function OfferStrip() {
  const { featuredOffer, core, applyCoupon } = useBooking();

  // No offer running, or the guest has already paid — nothing to advertise.
  if (!featuredOffer || core.state === 'confirmed') return null;

  const isOn = core.coupon?.code === featuredOffer.code;

  return (
    <div className={'offer-strip' + (isOn ? ' is-applied' : '')}>
      <span className="os-flame" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2s1.5 3.2 1.5 5.2c0 1.3-.9 2.3-2 2.3s-2-1-2-2.3c0-.6.1-1.1.2-1.6C8 7.1 6 9.9 6 13a6 6 0 0012 0c0-4.4-3.4-8-6-11z" />
        </svg>
      </span>
      <span className="os-copy">
        <strong>{featuredOffer.label || 'Festive offer'}</strong>
        <span className="os-text">
          Use code <b>{featuredOffer.code}</b> for <span>{featuredOffer.percent_off}</span>% off
        </span>
      </span>
      <button
        type="button"
        className="os-apply"
        disabled={isOn}
        onClick={() => applyCoupon(featuredOffer.code, 'hero_banner')}
      >
        {isOn ? 'Applied' : 'Apply'}
      </button>
    </div>
  );
}
