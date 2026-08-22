'use client';

/* The booking desk: rate headline, dates, guests, ledger, coupon, Reserve.

   The 'confirmed' funnel step that used to live in here is gone — a verified
   payment now navigates to /confirmed. What remains is the single 'review' step,
   so the `.funnel-step` wrapper stays (the CSS and the desk valance hang off it)
   but there is only ever one. */

import { useRef } from 'react';

import { useBooking } from '@/booking/BookingProvider';
import { CONFIG } from '@/booking/config';
import { fmtShort } from '@/booking/dates';
import { nightlyWithCoupon, rupees } from '@/booking/price';
import { waFallbackUrl } from '@/booking/wa';
import { metaTrack, safeTrack } from '@/booking/tracking';

export default function BookingDesk() {
  const {
    core,
    pct,
    hasDates,
    priceQuote,
    couponBusy,
    couponEntryOpen,
    couponMsg,
    payError,
    reserving,
    reserveLabel,
    waContext,
    openCalendar,
    changeGuests,
    openCouponEntry,
    applyCoupon,
    removeCoupon,
    clearCouponMsg,
    startReserve,
  } = useBooking();

  const couponInput = useRef<HTMLInputElement>(null);
  const hasCoupon = !!core.coupon;

  return (
    <div className="book-desk">
      <div className="desk-valance" aria-hidden="true" />

      <div className="funnel-step active" data-step="review">
        <div className="desk-grid">
          <div className="desk-price">
            <span className="dp-label">Direct rate · per night</span>
            <span className="dp-line">
              {/* Struck-through base price appears only once a coupon is applied. */}
              {pct > 0 && <s className="dp-was">{rupees(CONFIG.basePrice)}</s>}
              <span className="dp-now">{rupees(nightlyWithCoupon(pct))}</span>
            </span>
            <span className="dp-tag">
              {pct > 0 && core.coupon
                ? core.coupon.code + ' · ' + pct + '% off applied'
                : 'All-inclusive · no extra fees'}
            </span>
          </div>

          <div className="desk-fields">
            <button type="button" className="field-row" onClick={() => openCalendar('widget')}>
              <span className="fr-text">
                <span className="field-label">Dates</span>
                <span className={'field-value' + (hasDates ? '' : ' placeholder')}>
                  {hasDates ? fmtShort(core.checkin!) + ' → ' + fmtShort(core.checkout!) : 'Add dates'}
                </span>
              </span>
              <svg
                className="field-chevron"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <div className="field-row">
              <span className="fr-text">
                <span className="field-label">Guests</span>
                <span className="field-value">
                  <span>{core.guests}</span> guests · max 4
                </span>
              </span>
              <span className="stepper">
                <button
                  type="button"
                  className="step-btn"
                  aria-label="Remove a guest"
                  disabled={core.guests <= 1}
                  onClick={() => changeGuests(-1)}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="step-btn"
                  aria-label="Add a guest"
                  disabled={core.guests >= CONFIG.maxGuests}
                  onClick={() => changeGuests(1)}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <div className="desk-act">
            {/* The button is pointer-events:none while disabled, so the wrapper is
                what hears the tap that both reveals the tooltip and opens the
                calendar — the thing the tooltip asks for. */}
            <span
              className={'cta-wrap' + (hasDates ? '' : ' is-locked')}
              onClick={() => {
                if (hasDates) return; // the button handles its own clicks
                safeTrack('reserve_locked_tapped', {});
                openCalendar('locked-cta');
              }}
            >
              <button
                type="button"
                className={
                  'btn-cta' +
                  (hasDates ? '' : ' is-disabled') +
                  (reserving ? ' is-busy' : '')
                }
                aria-describedby={hasDates ? undefined : 'reserveTip'}
                onClick={() => hasDates && startReserve()}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>{reserveLabel}</span>
              </button>
              <span className="cta-tip" id="reserveTip" role="tooltip" aria-hidden={hasDates}>
                Please choose your dates first
              </span>
            </span>
            <span className="desk-proof">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              5.0 rating · 100% five-star reviews
            </span>
          </div>
        </div>

        <div className={'breakdown' + (hasDates ? ' show' : '')}>
          <div className="bd-row">
            <span className="bd-label">
              {rupees(CONFIG.basePrice)} × {priceQuote?.nights ?? 0} night
              {(priceQuote?.nights ?? 0) > 1 ? 's' : ''}
            </span>
            <span className="bd-dots" aria-hidden="true" />
            <span className="bd-value">{rupees(priceQuote?.gross ?? 0)}</span>
          </div>
          {!!priceQuote && priceQuote.couponPct > 0 && !!core.coupon && (
            <div className="bd-row bd-discount">
              <span className="bd-label">
                Coupon {core.coupon.code} ({priceQuote.couponPct}%)
              </span>
              <span className="bd-dots" aria-hidden="true" />
              <span className="bd-value">−{rupees(priceQuote.discount)}</span>
            </div>
          )}
          <div className="bd-total">
            <span>Total</span>
            <span className="bd-total-value">{rupees(priceQuote?.total ?? 0)}</span>
          </div>

          {/* Coupon: one code at a time, applied only when the guest asks. The
              percentage here is cosmetic — api/create-order.js re-reads the code
              from Supabase and prices the order from that. */}
          <div className="coupon">
            {!hasCoupon && !couponEntryOpen && (
              <button
                type="button"
                className="coupon-toggle"
                aria-expanded="false"
                aria-controls="couponEntry"
                onClick={() => {
                  openCouponEntry();
                  // Focus after the entry row has been revealed.
                  requestAnimationFrame(() => couponInput.current?.focus());
                }}
              >
                Have a coupon code?
              </button>
            )}
            {!hasCoupon && couponEntryOpen && (
              <div className="coupon-entry" id="couponEntry">
                <input
                  type="text"
                  ref={couponInput}
                  placeholder="Enter code"
                  aria-label="Coupon code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={24}
                  onChange={clearCouponMsg}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon(e.currentTarget.value, 'input');
                    }
                  }}
                />
                <button
                  type="button"
                  className="coupon-apply"
                  disabled={couponBusy}
                  onClick={() => applyCoupon(couponInput.current?.value ?? '', 'input')}
                >
                  {couponBusy ? 'Checking…' : 'Apply'}
                </button>
              </div>
            )}
            {hasCoupon && (
              <div className="coupon-applied">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="ca-text">
                  <b>{core.coupon!.code}</b> applied — <span>{core.coupon!.percent_off}</span>% off
                </span>
                <button type="button" className="coupon-remove" onClick={() => removeCoupon('guest')}>
                  Remove
                </button>
              </div>
            )}
            {!!couponMsg && (
              <p className={'coupon-msg' + (couponMsg.ok ? ' is-ok' : '')} role="status">
                {couponMsg.text}
              </p>
            )}
          </div>

          <p className="bd-certainty">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Final all-in price. No taxes, cleaning, or service fees added.
          </p>
        </div>

        {!!payError && (
          <p className={'pay-error' + (payError.asNote ? ' is-note' : '')}>
            {payError.msg}
            {!!payError.waReason && (
              <>
                {' '}
                <a
                  href={waFallbackUrl(payError.waReason, waContext)}
                  target="_blank"
                  rel="noopener"
                  className="pay-error-wa"
                  onClick={() => {
                    safeTrack('whatsapp_fallback_clicked', { context: payError.waReason });
                    metaTrack('Contact', { content_name: 'WhatsApp Fallback' });
                  }}
                >
                  Message Saar on WhatsApp
                </a>
              </>
            )}
          </p>
        )}
        <p className="desk-urgency">
          Weekends and temple-season dates — Janmashtami, Radha Ashtami, Kartik month — go
          first. Worth booking a little ahead for those.
        </p>
        <p className="desk-note">
          Instant booking. Pay securely by UPI or card through Razorpay. Cancel free until 24
          hours before check-in, and full refund if your dates turn out unavailable.
        </p>
      </div>
    </div>
  );
}
