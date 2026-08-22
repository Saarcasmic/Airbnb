'use client';

/* Shown when a returning guest already has a confirmed booking in their 48h
   draft. "View" used to scroll down to the confirmed face of the booking desk;
   the confirmation now lives on its own route, so it navigates there instead. */

import Link from 'next/link';

import { useBooking } from '@/booking/BookingProvider';
import { fmtRange } from '@/booking/dates';
import { rupees } from '@/booking/price';
import { safeTrack } from '@/booking/tracking';

export default function ResumeBanner() {
  const { core, priceQuote } = useBooking();

  const show = core.state === 'confirmed' && !!core.checkin && !!core.checkout && !!priceQuote;

  return (
    <div className={'resume-banner' + (show ? ' show' : '')}>
      <div className="rb-copy">
        <span className="rb-title">Your booking</span>
        <span className="rb-sub">
          {show
            ? fmtRange(core.checkin!, core.checkout!) +
              ' · ' +
              core.guests +
              ' guest' +
              (core.guests > 1 ? 's' : '') +
              ' · ' +
              rupees(priceQuote!.total) +
              ' · confirmed'
            : ''}
        </span>
      </div>
      <Link
        href="/confirmed"
        className="rb-cta"
        onClick={() => safeTrack('resume_banner_clicked', { state: core.state })}
      >
        View
      </Link>
    </div>
  );
}
