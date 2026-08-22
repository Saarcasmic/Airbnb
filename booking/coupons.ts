/* Coupon checks against /api/coupon.

   One coupon at a time — applying a new code replaces the old. The percentage
   these calls return is COSMETIC: only the code travels to /api/create-order,
   which re-reads it from Supabase and prices the Razorpay order from that. A
   tampered response here cannot buy a cheaper stay. */

import type { CouponCheck, FeaturedOffer } from '@/booking/types';

export function normalizeCouponCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/\s+/g, '').toUpperCase() : '';
}

/** null means "we couldn't check" — distinct from a definitive {valid:false}.
    The caller keeps the coupon in that case and lets order time decide. */
export async function checkCoupon(code: string): Promise<CouponCheck | null> {
  try {
    const r = await fetch('/api/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!r.ok) return null;
    return (await r.json()) as CouponCheck;
  } catch {
    return null;
  }
}

/** The code the host has featured on /coupon, or null when nothing is running.
    A missing banner is purely cosmetic, so failures here are silent. */
export async function fetchFeaturedOffer(): Promise<FeaturedOffer | null> {
  try {
    const r = await fetch('/api/coupon');
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<FeaturedOffer>;
    if (!d || !d.code || !(typeof d.percent_off === 'number' && d.percent_off > 0)) return null;
    return { code: d.code, percent_off: d.percent_off, label: d.label || 'Festive offer' };
  } catch {
    return null;
  }
}
