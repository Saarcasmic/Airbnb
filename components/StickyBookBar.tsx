'use client';

/* The sticky bottom bar — the most-seen surface on the page, so its sub-line does
   double duty: it confirms an applied coupon, or advertises the featured one.

   `.past-book` is what the desktop-only CSS uses to reveal the bar once the
   booking card has been scrolled past (up there it stays hidden while idle). */

import { useEffect, useRef, useState } from 'react';

import { useBooking } from '@/booking/BookingProvider';
import { CONFIG } from '@/booking/config';
import { fmtRange } from '@/booking/dates';
import { nightlyWithCoupon, rupees } from '@/booking/price';
import { safeTrack } from '@/booking/tracking';

export default function StickyBookBar() {
  const {
    core,
    pct,
    hasDates,
    priceQuote,
    featuredOffer,
    openCalendar,
    scrollToBook,
  } = useBooking();

  const [pastBook, setPastBook] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bookSec = document.getElementById('book');
    if (!bookSec) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setPastBook(!e.isIntersecting && e.boundingClientRect.bottom < 0);
      },
      { threshold: 0 },
    );
    observer.observe(bookSec);
    return () => observer.disconnect();
  }, []);

  const nightlyMain = (
    <>
      {pct > 0 && <span className="bb-was">{rupees(CONFIG.basePrice)}</span>}
      {rupees(nightlyWithCoupon(pct))} <span className="bb-unit">/ night</span>
    </>
  );
  const nightlySub = core.coupon
    ? core.coupon.code + ' · ' + core.coupon.percent_off + '% off applied'
    : featuredOffer
      ? 'Use code ' + featuredOffer.code + ' for ' + featuredOffer.percent_off + '% off'
      : 'Final all-in price · no extra fees';

  const showTotal = core.state === 'review' && hasDates && !!priceQuote;
  // Confirmed bookings live on /confirmed now; the bar has nothing to say here.
  const hidden = core.state === 'confirmed';

  const main = showTotal ? (
    <>
      {rupees(priceQuote!.total)} <span className="bb-unit">total</span>
    </>
  ) : (
    nightlyMain
  );
  const sub = showTotal
    ? priceQuote!.nights +
      ' night' +
      (priceQuote!.nights > 1 ? 's' : '') +
      ' · ' +
      fmtRange(core.checkin!, core.checkout!) +
      (priceQuote!.couponPct
        ? ' · ' + core.coupon!.code + ' ' + priceQuote!.couponPct + '% off'
        : ' · all-in')
    : nightlySub;
  const cta = showTotal ? 'Reserve' : 'Check dates';

  return (
    <div
      className={
        'book-bar' + (hidden ? ' hidden' : '') + (pastBook ? ' past-book' : '')
      }
      ref={barRef}
      role="region"
      aria-label="Book your stay"
    >
      <div className="book-bar-left">
        <div className="book-bar-main">{main}</div>
        <div className="book-bar-sub">{sub}</div>
      </div>
      <button
        type="button"
        className="book-bar-cta"
        onClick={() => {
          if (core.state === 'idle') openCalendar('sticky-bar');
          else if (core.state === 'review') {
            if (core.checkin) scrollToBook();
            else openCalendar('sticky-bar');
          } else scrollToBook();
          safeTrack('sticky_bar_clicked', { state: core.state });
        }}
      >
        {cta}
      </button>
    </div>
  );
}
