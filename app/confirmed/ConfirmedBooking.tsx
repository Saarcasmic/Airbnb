'use client';

/* The post-payment confirmation, previously the reverse face of the booking desk.

   It reads the 48h draft rather than a URL parameter, so the reservation ref never
   lands in the address bar or in analytics referrers, and a refresh or a later
   visit still shows the booking. No confirmed draft (direct hit, cleared storage,
   expired) means there is nothing to confirm, so we send them home.

   Deliberately does NOT mount BookingProvider: this route needs none of the
   calendar, desk or Razorpay code, and leaving it out keeps the bundle here to
   just this component. */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { clearDraft, loadDraft } from '@/booking/draft';
import { fmtShort } from '@/booking/dates';
import { appliedPct, quote, rupees } from '@/booking/price';
import { nightsBetween } from '@/booking/dates';
import { hostBookingUrl } from '@/booking/wa';
import { REQUEST_CALENDAR_KEY } from '@/booking/session';
import type { Draft } from '@/booking/types';

export default function ConfirmedBooking() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d && d.state === 'confirmed' && d.checkin && d.checkout) {
      setDraft(d);
      return;
    }
    router.replace('/');
  }, [router]);

  // Nothing is rendered until the draft has been read: localStorage does not
  // exist during SSR, so anything else would be a hydration mismatch and a flash
  // of the wrong content.
  if (!draft || !draft.checkin || !draft.checkout) return null;

  const nights = nightsBetween(draft.checkin, draft.checkout);
  const total = quote(nights, appliedPct(draft.coupon)).total;
  const waContext = {
    checkin: draft.checkin,
    checkout: draft.checkout,
    guests: draft.guests,
    coupon: draft.coupon,
  };

  return (
    <div className="confirmed-page">
      <header className="confirmed-masthead">
        <Link href="/" className="wordmark" aria-label="Pyari Kunj — back to the homepage">
          <span className="wm-name">Pyari Kunj</span>
          <span className="wm-hindi" lang="hi">
            प्यारी कुंज
          </span>
        </Link>
      </header>

      <section className="book-section" aria-label="Your booking">
        <div className="book-desk">
          <div className="desk-valance" aria-hidden="true" />
          <div className="funnel-step active" data-step="confirmed">
            <div className="step-col">
              <div className="done-icon" aria-hidden="true">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="step-title">Booking confirmed</h1>
              <p className="step-desc">
                Payment received. Your reservation <strong>{draft.ref || '—'}</strong> is in, and
                Saar will send the exact location and check-in details on WhatsApp shortly.
              </p>
              <div className="booking-summary">
                <div className="bs-row">
                  <span className="bs-label">Dates</span>
                  <span className="bs-value">
                    {fmtShort(draft.checkin)} → {fmtShort(draft.checkout)}
                  </span>
                </div>
                <div className="bs-row">
                  <span className="bs-label">Guests</span>
                  <span className="bs-value">
                    {draft.guests} guest{draft.guests > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="bs-row">
                  <span className="bs-label">Paid</span>
                  <span className="bs-value">{rupees(total)}</span>
                </div>
              </div>
              <ol className="next-steps">
                <li>
                  You&apos;ll get the exact location and check-in details on WhatsApp (check-in
                  12–6 pm).
                </li>
                <li>Caretaker Dinesh Ji welcomes you at the homestay.</li>
              </ol>
              <a
                className="btn-cta btn-wa"
                href={hostBookingUrl(draft.ref, waContext)}
                target="_blank"
                rel="noopener"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Send booking details to Saar
              </a>
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  clearDraft();
                  // The old flow reopened the calendar straight after resetting.
                  // A session flag carries that across the navigation without
                  // putting anything in the URL.
                  try {
                    sessionStorage.setItem(REQUEST_CALENDAR_KEY, '1');
                  } catch {
                    /* private mode — the guest just taps the date field */
                  }
                  router.push('/');
                }}
              >
                Start a new booking
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
