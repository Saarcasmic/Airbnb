/* Shapes shared across the booking funnel. Ported from the shapes js/app.js
   carried implicitly, so the localStorage draft format (v:1) is unchanged and a
   draft written by the old site still restores in the new one. */

/** A coupon the guest has applied. `percent_off` here is COSMETIC — the server
    re-reads the code from Supabase and prices the Razorpay order from that. */
export type Coupon = {
  code: string;
  percent_off: number;
  label?: string;
};

/** The code the host has featured on /coupon, advertised in the hero strip. */
export type FeaturedOffer = {
  code: string;
  percent_off: number;
  label: string;
};

/** Funnel position. Ordered — see stateRank(). 'confirmed' now lives on the
    /confirmed route rather than as a step inside the booking desk. */
export type FunnelState = 'idle' | 'review' | 'confirmed';

export type Quote = {
  nights: number;
  gross: number;
  discount: number;
  couponPct: number;
  total: number;
};

/** The persisted part of the funnel: what loadDraft/saveDraft round-trip. */
export type BookingCore = {
  state: FunnelState;
  /** 'YYYY-MM-DD' */
  checkin: string | null;
  /** 'YYYY-MM-DD' */
  checkout: string | null;
  guests: number;
  coupon: Coupon | null;
};

/** The v:1 localStorage record. Field names are load-bearing — an old draft in a
    returning guest's browser must still parse. */
export type Draft = BookingCore & {
  v: 1;
  /** reservation ref of a confirmed booking */
  ref: string | null;
  savedAt: number;
};

/** 'YYYY-MM-DD' -> true for nights already booked. */
export type BlockedNights = Record<string, true>;

/** POST /api/coupon — validates one code. Never lists. */
export type CouponCheck = {
  valid: boolean;
  reason?: 'not_found';
  code?: string;
  percent_off?: number;
  label?: string;
};

/** GET /api/coupon — the featured code, or {} when none is running. */
export type FeaturedOfferResponse = Partial<FeaturedOffer>;

/** POST /api/create-order. `amount` is paise (Razorpay), `total` is rupees. */
export type CreatedOrder = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  reservation_ref: string;
  nights: number;
  guests: number;
  checkin: string;
  checkout: string;
  total: number;
  coupon: string | null;
  coupon_pct: number;
};

/** POST /api/verify-payment. */
export type VerifyResult = {
  verified: boolean;
  captured: boolean;
  reservation_ref: string;
  checkin: string | null;
  checkout: string | null;
  guests: number | null;
  amount: number;
  payment_id: string;
};

/** The error codes create-order can return, each with its own guest-facing copy. */
export type OrderError =
  | 'dates_unavailable'
  | 'availability_unverified'
  | 'coupon_invalid'
  | 'coupon_unverified'
  | 'razorpay_not_configured'
  | 'razorpay_order_failed'
  | 'method_not_allowed'
  | 'server_error';
