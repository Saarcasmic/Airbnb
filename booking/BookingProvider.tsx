'use client';

/* The booking funnel, ported from the globals + render() loop in js/app.js.

   One reducer owns everything the old file kept in module-level `var`s, so the
   pieces that used to be re-synced by hand on every render() call (the desk, the
   sticky bar, the resume banner, the offer strip, the FAB) now just read state.

   Two things deliberately did NOT change:
   - the v:1 localStorage draft format, so a draft written by the currently-live
     site still restores after this deploys;
   - every PostHog / Meta event name, payload and firing point.

   The one behaviour change: reaching 'confirmed' now navigates to /confirmed
   instead of flipping a step inside the booking desk. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import { CONFIG } from '@/booking/config';
import { fmtRange, nightsBetween, todayISO } from '@/booking/dates';
import { appliedPct, quote } from '@/booking/price';
import { clearDraft, loadDraft, saveDraft, stateRank } from '@/booking/draft';
import { fetchBlockedNights, rangeHasBlockedNight } from '@/booking/availability';
import { checkCoupon, fetchFeaturedOffer, normalizeCouponCode } from '@/booking/coupons';
import { metaTrack, metaUserData, safeTrack } from '@/booking/tracking';
import { ensureRazorpay, preconnectRazorpay } from '@/booking/razorpay';
import { consumeCalendarRequest } from '@/booking/session';
import type { WaContext } from '@/booking/wa';
import type {
  BlockedNights,
  BookingCore,
  Coupon,
  CreatedOrder,
  FeaturedOffer,
  Quote,
  VerifyResult,
} from '@/booking/types';

const RESERVE_IDLE_LABEL = 'Reserve & pay';

/** Deep-linked dates are untrusted input off the URL — shape-check before use. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type CouponMsg = { text: string; ok: boolean };
type PayError = { msg: string; waReason?: string; asNote?: boolean };

type State = {
  core: BookingCore;
  lastRef: string | null;
  featuredOffer: FeaturedOffer | null;
  blockedNights: BlockedNights;
  /** true when the live calendar couldn't load — surfaced honestly to the guest */
  availabilityDegraded: boolean;
  couponBusy: boolean;
  couponEntryOpen: boolean;
  couponMsg: CouponMsg | null;
  payError: PayError | null;
  reserving: boolean;
  reserveLabel: string;
  calOpen: boolean;
  /** the draft restore has run; before this we must render the SSR default */
  hydrated: boolean;
};

const INITIAL: State = {
  core: { state: 'idle', checkin: null, checkout: null, guests: 2, coupon: null },
  lastRef: null,
  featuredOffer: null,
  blockedNights: {},
  availabilityDegraded: false,
  couponBusy: false,
  couponEntryOpen: false,
  couponMsg: null,
  payError: null,
  reserving: false,
  reserveLabel: RESERVE_IDLE_LABEL,
  calOpen: false,
  hydrated: false,
};

type Action =
  | { type: 'hydrate'; core: BookingCore; ref: string | null }
  | { type: 'hydrated' }
  | { type: 'dates'; checkin: string; checkout: string }
  | { type: 'guests'; guests: number }
  | { type: 'coupon'; coupon: Coupon }
  | { type: 'couponPct'; percent_off: number }
  | { type: 'couponCleared' }
  | { type: 'couponBusy'; busy: boolean }
  | { type: 'couponEntryOpen'; open: boolean }
  | { type: 'couponMsg'; msg: CouponMsg | null }
  | { type: 'featuredOffer'; offer: FeaturedOffer | null }
  | { type: 'availability'; blockedNights: BlockedNights | null }
  | { type: 'datesUnavailable' }
  | { type: 'payError'; error: PayError | null }
  | { type: 'reserving'; reserving: boolean; label?: string }
  | { type: 'calOpen'; open: boolean }
  | { type: 'confirmed'; ref: string }
  | { type: 'reset' };

/* Any edit after the funnel has been confirmed drops it back to review —
   changed dates or guests mean this is a different booking. */
function downgraded(core: BookingCore): BookingCore {
  if (stateRank(core.state) > stateRank('review')) {
    safeTrack('funnel_downgraded_to_review', { from: core.state });
    return { ...core, state: 'review' };
  }
  return core;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, core: action.core, lastRef: action.ref, hydrated: true };
    case 'hydrated':
      return { ...state, hydrated: true };

    case 'dates': {
      const core = downgraded({
        ...state.core,
        checkin: action.checkin,
        checkout: action.checkout,
      });
      return {
        ...state,
        core: { ...core, state: core.state === 'idle' ? 'review' : core.state },
      };
    }

    case 'guests':
      return { ...state, core: downgraded({ ...state.core, guests: action.guests }) };

    case 'coupon':
      return {
        ...state,
        core: downgraded({ ...state.core, coupon: action.coupon }),
        couponEntryOpen: false,
        couponMsg: null,
      };

    // A restored coupon whose percentage moved server-side while the draft sat.
    case 'couponPct':
      return state.core.coupon
        ? {
            ...state,
            core: {
              ...state.core,
              coupon: { ...state.core.coupon, percent_off: action.percent_off },
            },
          }
        : state;

    case 'couponCleared':
      return {
        ...state,
        core: { ...state.core, coupon: null },
        couponEntryOpen: false,
        couponMsg: null,
      };

    case 'couponBusy':
      return { ...state, couponBusy: action.busy };
    case 'couponEntryOpen':
      return { ...state, couponEntryOpen: action.open };
    case 'couponMsg':
      return { ...state, couponMsg: action.msg };
    case 'featuredOffer':
      return { ...state, featuredOffer: action.offer };

    case 'availability':
      return action.blockedNights === null
        ? { ...state, availabilityDegraded: true }
        : { ...state, blockedNights: action.blockedNights, availabilityDegraded: false };

    // A pre-confirmation draft now collides with a just-confirmed booking.
    case 'datesUnavailable':
      return {
        ...state,
        core: { ...state.core, state: 'idle', checkin: null, checkout: null },
      };

    case 'payError':
      return { ...state, payError: action.error };

    case 'reserving':
      return {
        ...state,
        reserving: action.reserving,
        reserveLabel: action.label ?? RESERVE_IDLE_LABEL,
      };

    case 'calOpen':
      return { ...state, calOpen: action.open };

    case 'confirmed':
      return { ...state, core: { ...state.core, state: 'confirmed' }, lastRef: action.ref };

    case 'reset':
      return {
        ...INITIAL,
        hydrated: true,
        // Availability and the featured offer are page-level facts, not booking
        // ones — refetching them on "start a new booking" would be wasteful.
        blockedNights: state.blockedNights,
        availabilityDegraded: state.availabilityDegraded,
        featuredOffer: state.featuredOffer,
      };
  }
}

type BookingContextValue = {
  core: BookingCore;
  lastRef: string | null;
  featuredOffer: FeaturedOffer | null;
  blockedNights: BlockedNights;
  availabilityDegraded: boolean;
  couponBusy: boolean;
  couponEntryOpen: boolean;
  couponMsg: CouponMsg | null;
  payError: PayError | null;
  reserving: boolean;
  reserveLabel: string;
  calOpen: boolean;
  hydrated: boolean;
  /* derived */
  hasDates: boolean;
  nights: number;
  pct: number;
  priceQuote: Quote | null;
  waContext: WaContext;
  /* actions */
  openCalendar: (source: string) => void;
  closeCalendar: (fromPop?: boolean) => void;
  commitDates: (checkin: string, checkout: string) => void;
  changeGuests: (delta: number) => void;
  openCouponEntry: () => void;
  applyCoupon: (rawCode: string, source: string) => void;
  removeCoupon: (reason: string) => void;
  clearCouponMsg: () => void;
  startReserve: () => void;
  resetBooking: () => void;
  scrollToBook: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const router = useRouter();

  const { core, lastRef, blockedNights, hydrated } = state;
  const hasDates = !!(core.checkin && core.checkout);
  const nights = hasDates ? nightsBetween(core.checkin!, core.checkout!) : 0;
  const pct = appliedPct(core.coupon);
  const priceQuote = hasDates ? quote(nights, pct) : null;

  const waContext = useMemo<WaContext>(
    () => ({
      checkin: core.checkin,
      checkout: core.checkout,
      guests: core.guests,
      coupon: core.coupon,
    }),
    [core.checkin, core.checkout, core.guests, core.coupon],
  );

  /* ---------- draft restore (client only, so SSR stays deterministic) ---------- */
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) {
      dispatch({ type: 'hydrated' });
      return;
    }
    dispatch({
      type: 'hydrate',
      core: {
        state: draft.state,
        checkin: draft.checkin,
        checkout: draft.checkout,
        guests: draft.guests,
        coupon: draft.coupon,
      },
      ref: draft.ref,
    });
    safeTrack('draft_restored', {
      state: draft.state,
      age_hours: Math.round(((Date.now() - draft.savedAt) / 3600000) * 10) / 10,
    });
  }, []);

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!hydrated) return;
    if (core.checkin && core.checkout) saveDraft(core, lastRef);
    else clearDraft();
  }, [hydrated, core, lastRef]);

  /* ---------- availability + featured offer (both non-blocking) ---------- */
  useEffect(() => {
    let alive = true;
    fetchBlockedNights().then((blocked) => {
      if (!alive) return;
      dispatch({ type: 'availability', blockedNights: blocked });
      if (blocked) {
        safeTrack('availability_loaded', { blocked_nights: Object.keys(blocked).length });
      }
    });
    fetchFeaturedOffer().then((offer) => {
      if (!alive || !offer) return;
      dispatch({ type: 'featuredOffer', offer });
      safeTrack('offer_banner_shown', {
        code: offer.code,
        percent_off: offer.percent_off,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  /* A draft that now collides with a just-confirmed booking is dropped. Never
     touches a confirmed booking — that block may be the host holding these very
     dates for this guest. */
  useEffect(() => {
    if (!hydrated || !core.checkin || !core.checkout) return;
    if (stateRank(core.state) > stateRank('review')) return;
    if (!rangeHasBlockedNight(blockedNights, core.checkin, core.checkout)) return;
    dispatch({ type: 'datesUnavailable' });
    clearDraft();
    safeTrack('draft_dates_unavailable', {});
  }, [hydrated, blockedNights, core.checkin, core.checkout, core.state]);

  /* A coupon restored from a 48h-old draft may have been paused or deleted since.
     Re-check once on load so the guest never stares at a price we won't honour. */
  const revalidated = useRef(false);
  useEffect(() => {
    if (!hydrated || revalidated.current) return;
    const code = core.coupon?.code;
    if (!code) return;
    revalidated.current = true;
    checkCoupon(code).then((d) => {
      if (!d) return; // couldn't check — leave it, order time decides
      if (!d.valid) {
        dispatch({ type: 'couponCleared' });
        safeTrack('coupon_removed', { code, reason: 'expired' });
        return;
      }
      if (typeof d.percent_off === 'number' && d.percent_off !== core.coupon?.percent_off) {
        dispatch({ type: 'couponPct', percent_off: d.percent_off });
      }
    });
  }, [hydrated, core.coupon]);

  /* price_viewed / InitiateCheckout fire once per distinct total, exactly as the
     old render() did via lastTrackedTotal. */
  const lastTrackedTotal = useRef<number | null>(null);
  useEffect(() => {
    if (!priceQuote) return;
    if (priceQuote.total === lastTrackedTotal.current) return;
    lastTrackedTotal.current = priceQuote.total;
    safeTrack('price_viewed', {
      nights: priceQuote.nights,
      guests: core.guests,
      total: priceQuote.total,
    });
    metaTrack('InitiateCheckout', {
      value: priceQuote.total,
      currency: 'INR',
      content_name: 'Direct Booking',
    });
  }, [priceQuote, core.guests]);

  /* ---------- calendar ---------- */
  const calPushed = useRef(false);

  const openCalendar = useCallback((source: string) => {
    dispatch({ type: 'calOpen', open: true });
    // First real booking intent: warm up the payment script so Reserve is instant
    // without every reader paying for checkout.js on load.
    preconnectRazorpay();
    void ensureRazorpay();
    try {
      history.pushState({ pkCal: true }, '');
      calPushed.current = true;
    } catch {
      calPushed.current = false;
    }
    safeTrack('funnel_opened', { source });
  }, []);

  const closeCalendar = useCallback((fromPop = false) => {
    dispatch({ type: 'calOpen', open: false });
    if (!fromPop && calPushed.current) {
      calPushed.current = false;
      try {
        history.back();
      } catch {
        /* no history to pop */
      }
    } else {
      calPushed.current = false;
    }
  }, []);

  /* "Start a new booking" on /confirmed asks for the calendar to be open once the
     guest lands back here. Waits for hydration so it can't race the draft restore. */
  useEffect(() => {
    if (!hydrated) return;
    if (consumeCalendarRequest()) openCalendar('new-booking');
  }, [hydrated, openCalendar]);

  /* Arriving from the festival calendar with dates already chosen, e.g.
     /?checkin=2027-09-03&checkout=2027-09-05#book. Applied once, after hydration,
     and only over an unconfirmed booking — someone returning to a paid booking
     must not have it silently rewritten by a stale link. Blocked nights are
     rejected here too; the server re-checks at order time regardless. */
  const deepLinked = useRef(false);
  useEffect(() => {
    if (!hydrated || deepLinked.current) return;
    deepLinked.current = true;
    let checkin: string | null = null;
    let checkout: string | null = null;
    try {
      const q = new URLSearchParams(window.location.search);
      checkin = q.get('checkin');
      checkout = q.get('checkout');
    } catch {
      return;
    }
    if (!checkin || !checkout) return;
    if (!ISO_DATE.test(checkin) || !ISO_DATE.test(checkout)) return;
    if (checkin < todayISO()) return;
    if (nightsBetween(checkin, checkout) < CONFIG.minNights) return;
    if (stateRank(core.state) > stateRank('review')) return;
    if (rangeHasBlockedNight(blockedNights, checkin, checkout)) return;
    dispatch({ type: 'dates', checkin, checkout });
    safeTrack('dates_deep_linked', { checkin, checkout });
  }, [hydrated, core.state, blockedNights]);

  // The Android back gesture closes the sheet rather than leaving the page.
  useEffect(() => {
    const onPop = () => {
      if (state.calOpen) closeCalendar(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [state.calOpen, closeCalendar]);

  // Body scroll lock lives here rather than in the sheet, so it can never be
  // left on by an unmount racing the close.
  useEffect(() => {
    if (!state.calOpen) return;
    document.body.classList.add('sheet-open');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('sheet-open');
      document.body.style.overflow = '';
    };
  }, [state.calOpen]);

  const scrollToBook = useCallback(() => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const commitDates = useCallback(
    (checkin: string, checkout: string) => {
      dispatch({ type: 'dates', checkin, checkout });
      closeCalendar(false);
      scrollToBook();
    },
    [closeCalendar, scrollToBook],
  );

  const changeGuests = useCallback(
    (delta: number) => {
      const g = Math.min(Math.max(1, core.guests + delta), CONFIG.maxGuests);
      if (g === core.guests) return;
      dispatch({ type: 'guests', guests: g });
      safeTrack('guests_selected', { guests: g });
    },
    [core.guests],
  );

  /* ---------- coupons ---------- */
  const openCouponEntry = useCallback(() => {
    dispatch({ type: 'couponEntryOpen', open: true });
    safeTrack('coupon_field_opened', {});
  }, []);

  const clearCouponMsg = useCallback(() => {
    dispatch({ type: 'couponMsg', msg: null });
  }, []);

  const applyCoupon = useCallback(
    (rawCode: string, source: string) => {
      const code = normalizeCouponCode(rawCode);
      if (!code) {
        dispatch({ type: 'couponMsg', msg: { text: 'Enter a coupon code first.', ok: false } });
        return;
      }
      if (state.couponBusy) return;
      if (core.coupon && core.coupon.code === code) {
        dispatch({ type: 'couponMsg', msg: null });
        return;
      }
      dispatch({ type: 'couponMsg', msg: null });
      dispatch({ type: 'couponBusy', busy: true });

      checkCoupon(code).then((d) => {
        dispatch({ type: 'couponBusy', busy: false });
        if (!d) {
          dispatch({
            type: 'couponMsg',
            msg: {
              text: 'We couldn’t check that code just now — please try again in a moment.',
              ok: false,
            },
          });
          return;
        }
        if (!d.valid || !d.code || typeof d.percent_off !== 'number') {
          dispatch({
            type: 'couponMsg',
            msg: {
              text: 'That code isn’t valid. Check the spelling — or the offer may have ended.',
              ok: false,
            },
          });
          safeTrack('coupon_rejected', { code, source });
          return;
        }
        dispatch({
          type: 'coupon',
          coupon: { code: d.code, percent_off: d.percent_off, label: d.label || '' },
        });
        safeTrack('coupon_applied', {
          code: d.code,
          percent_off: d.percent_off,
          source,
        });
      });
    },
    [state.couponBusy, core.coupon],
  );

  const removeCoupon = useCallback(
    (reason: string) => {
      const was = core.coupon?.code;
      if (!was) return;
      dispatch({ type: 'couponCleared' });
      safeTrack('coupon_removed', { code: was, reason: reason || 'guest' });
    },
    [core.coupon],
  );

  /* ---------- Razorpay checkout ----------
     Reserve → create order (the SERVER prices it) → Razorpay modal → verify
     signature (server) → /confirmed. Purchase is reported server-side, never here. */
  const showPayError = useCallback((msg: string, waReason?: string, asNote?: boolean) => {
    dispatch({ type: 'payError', error: { msg, waReason, asNote } });
  }, []);

  const resetReserve = useCallback(() => {
    dispatch({ type: 'reserving', reserving: false });
  }, []);

  const orderError = useCallback(
    (d: { error?: string } | null) => {
      const e = d?.error;
      if (e === 'dates_unavailable') {
        showPayError('Those dates were just taken — please choose different dates.');
      } else if (e === 'availability_unverified') {
        showPayError(
          'We can’t confirm availability right now. Please try again shortly, or message us on WhatsApp.',
          'the site could not verify availability for my dates',
        );
      } else if (e === 'coupon_invalid') {
        // The code died between being applied and being used (paused/deleted).
        // Drop it so the guest sees the real total before retrying.
        removeCoupon('rejected_at_checkout');
        showPayError(
          'That coupon is no longer available, so we’ve removed it. Please check the updated total and try again.',
        );
      } else if (e === 'coupon_unverified') {
        showPayError(
          'We couldn’t check your coupon just now. Please try again in a moment, or remove it to continue.',
          'the site could not verify my coupon code',
        );
      } else if (e === 'razorpay_not_configured') {
        showPayError(
          'Online booking isn’t live yet. Please message us on WhatsApp to book.',
          'online booking is not live yet',
        );
      } else {
        showPayError('Could not start checkout. Please try again.', 'checkout would not start');
      }
    },
    [removeCoupon, showPayError],
  );

  const verifyPayment = useCallback(
    (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, order: CreatedOrder) => {
      dispatch({ type: 'reserving', reserving: true, label: 'Confirming payment…' });
      const ud = metaUserData();
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
          fbp: ud.fbp,
          fbc: ud.fbc,
        }),
      })
        .then((r) => r.json() as Promise<VerifyResult>)
        .then((d) => {
          resetReserve();
          if (d && d.verified) {
            const ref = d.reservation_ref || order.reservation_ref;
            safeTrack('booking_confirmed', { ref, amount: d.amount });
            dispatch({ type: 'confirmed', ref });
            // Written synchronously so /confirmed can read it on arrival — the
            // persistence effect would not have run before the navigation.
            saveDraft({ ...core, state: 'confirmed' }, ref);
            router.push('/confirmed');
          } else {
            showPayError(
              'Payment received but we couldn’t auto-confirm. Please message us on WhatsApp with your payment id.',
              'my payment went through but was not auto-confirmed (payment id: ' +
                resp.razorpay_payment_id +
                ')',
            );
          }
        })
        .catch(() => {
          resetReserve();
          showPayError(
            'Payment received but we couldn’t auto-confirm. Please message us on WhatsApp.',
            'my payment went through but was not auto-confirmed (payment id: ' +
              resp.razorpay_payment_id +
              ')',
          );
        });
    },
    [core, resetReserve, router, showPayError],
  );

  const openRazorpay = useCallback(
    async (order: CreatedOrder) => {
      const Ctor = await ensureRazorpay();
      if (!Ctor) {
        showPayError('Payment is still loading — please try again in a moment.');
        resetReserve();
        return;
      }
      dispatch({ type: 'reserving', reserving: true, label: 'Opening payment…' });
      metaTrack('AddPaymentInfo', {
        value: order.total,
        currency: 'INR',
        content_name: 'Direct Booking',
      });
      const rzp = new Ctor({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: CONFIG.propertyName,
        description:
          fmtRange(order.checkin, order.checkout) +
          ' · ' +
          order.guests +
          ' guest' +
          (order.guests > 1 ? 's' : ''),
        theme: { color: '#A61E4D' },
        notes: { ref: order.reservation_ref },
        handler: (r) => verifyPayment(r, order),
        modal: {
          ondismiss: () => {
            safeTrack('checkout_dismissed', {});
            resetReserve();
            // Abandoned-booking recovery: dates stay selected, so the guest can
            // retry or hand off to WhatsApp.
            showPayError(
              'Payment not completed. Your dates are saved, so you can retry whenever you’re ready.',
              'I did not finish the payment',
              true,
            );
          },
        },
      });
      rzp.on('payment.failed', (r) => {
        showPayError(
          'Payment failed: ' + (r.error?.description || 'please try again.'),
          'my payment failed',
        );
        safeTrack('payment_failed', { reason: r.error?.code || 'unknown' });
        resetReserve();
      });
      rzp.open();
    },
    [resetReserve, showPayError, verifyPayment],
  );

  const startReserve = useCallback(() => {
    if (state.reserving || !core.checkin || !core.checkout || !priceQuote) return;
    if (rangeHasBlockedNight(blockedNights, core.checkin, core.checkout)) {
      showPayError('Those dates are no longer available — please pick different dates.');
      return;
    }
    dispatch({ type: 'payError', error: null });
    dispatch({ type: 'reserving', reserving: true, label: 'Starting secure checkout…' });
    safeTrack('reserve_clicked', {
      total: priceQuote.total,
      nights: priceQuote.nights,
      guests: core.guests,
    });
    metaTrack('Lead', {
      content_name: 'Direct Booking',
      value: priceQuote.total,
      currency: 'INR',
    });

    // fbp/fbc ride along so the server can pin attribution into the Razorpay
    // order notes — the webhook Purchase keeps it even if the tab closes.
    const ud = metaUserData();
    fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only the code goes over the wire — the server decides what it's worth.
      body: JSON.stringify({
        checkin: core.checkin,
        checkout: core.checkout,
        guests: core.guests,
        coupon: core.coupon ? core.coupon.code : null,
        fbp: ud.fbp,
        fbc: ud.fbc,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then((res) => {
        const order = res.d as CreatedOrder & { error?: string };
        if (!res.ok || !order || !order.order_id) {
          orderError(order);
          resetReserve();
          return;
        }
        void openRazorpay(order);
      })
      .catch(() => {
        showPayError('Could not start checkout. Please try again.', 'checkout would not start');
        resetReserve();
      });
  }, [
    state.reserving,
    core,
    priceQuote,
    blockedNights,
    orderError,
    openRazorpay,
    resetReserve,
    showPayError,
  ]);

  const resetBooking = useCallback(() => {
    clearDraft();
    lastTrackedTotal.current = null;
    revalidated.current = false;
    dispatch({ type: 'reset' });
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      ...state,
      hasDates,
      nights,
      pct,
      priceQuote,
      waContext,
      openCalendar,
      closeCalendar,
      commitDates,
      changeGuests,
      openCouponEntry,
      applyCoupon,
      removeCoupon,
      clearCouponMsg,
      startReserve,
      resetBooking,
      scrollToBook,
    }),
    [
      state,
      hasDates,
      nights,
      pct,
      priceQuote,
      waContext,
      openCalendar,
      closeCalendar,
      commitDates,
      changeGuests,
      openCouponEntry,
      applyCoupon,
      removeCoupon,
      clearCouponMsg,
      startReserve,
      resetBooking,
      scrollToBook,
    ],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
