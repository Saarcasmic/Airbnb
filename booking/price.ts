/* ================= PRICE ================= */
import { CONFIG } from '@/booking/config';
import type { Coupon, Quote } from '@/booking/types';

const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export function rupees(n: number): string { return '₹' + inrFmt.format(n); }

/* Whole-percentage discount of the coupon currently applied (0 when none).
   Only ever one coupon at a time — applying a new code replaces the old.
   In js/app.js this read the `booking` global; the coupon is now React state,
   so it is passed in. */
export function appliedPct(coupon: Coupon | null): number { return coupon ? coupon.percent_off : 0; }

/* MUST stay arithmetically identical to quote() in lib/booking.js — that one
   is authoritative and prices the Razorpay order. couponPct is explicit here
   (js/app.js defaulted it to the applied coupon via a global); pass
   appliedPct(coupon) for "price with whatever coupon is applied". */
export function quote(nights: number, couponPct: number): Quote {
  const raw = couponPct;
  const pct = (typeof raw === 'number' && raw > 0 && raw <= 100) ? Math.floor(raw) : 0;
  const gross = CONFIG.basePrice * nights;
  const discount = Math.round(gross * pct / 100);
  const total = gross - discount;
  return { nights: nights, gross: gross, discount: discount, couponPct: pct, total: total };
}

/* Nightly headline only — deliberately NOT clamped/floored like quote(), so it
   keeps matching js/app.js. Never use it to price an order. */
export function nightlyWithCoupon(couponPct: number): number {
  return Math.round(CONFIG.basePrice * (1 - couponPct / 100));
}
