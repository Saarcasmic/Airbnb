/* ================= DRAFT STORE (localStorage + TTL) =================
   The v:1 record format is frozen: a draft written by the currently-live static
   site must still restore after this deploy. Every localStorage access sits in a
   try/catch — Safari private mode throws on access, not just on write. */
import { CONFIG } from '@/booking/config';
import { nightsBetween, todayISO } from '@/booking/dates';
import type { BookingCore, Coupon, Draft, FunnelState } from '@/booking/types';

export const FUNNEL_STATES = ['idle', 'review', 'confirmed'] as const satisfies readonly FunnelState[];

export function stateRank(s: string): number {
  return (FUNNEL_STATES as readonly string[]).indexOf(s);
}

/* A stored coupon is only a hint: it is re-checked against the server on load
   (revalidateCoupon) and again at order time, which is what decides. */
function parseCoupon(v: unknown): Coupon | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  if (typeof c.code !== 'string') return null;
  if (typeof c.percent_off !== 'number' || !(c.percent_off > 0 && c.percent_off <= 100)) return null;
  return typeof c.label === 'string'
    ? { code: c.code, percent_off: c.percent_off, label: c.label }
    : { code: c.code, percent_off: c.percent_off };
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const d = parsed as Record<string, unknown>;
    if (d.v !== 1) return null;
    if (typeof d.savedAt !== 'number' || Date.now() - d.savedAt > CONFIG.draftTtlHours * 3600000) return null;
    if (typeof d.state !== 'string' || stateRank(d.state) < 0) return null;
    const checkin = typeof d.checkin === 'string' ? d.checkin : '';
    const checkout = typeof d.checkout === 'string' ? d.checkout : '';
    if (!checkin || !checkout || nightsBetween(checkin, checkout) < CONFIG.minNights) return null;
    if (checkin < todayISO()) return null; // stay already started/past — discard
    return {
      v: 1,
      state: FUNNEL_STATES[stateRank(d.state)],
      checkin: checkin,
      checkout: checkout,
      // `Number(x) | 0` is exactly the old `x | 0` (ToInt32 goes via ToNumber).
      guests: Math.min(Math.max(1, Number(d.guests) | 0), CONFIG.maxGuests),
      coupon: parseCoupon(d.coupon),
      ref: typeof d.ref === 'string' ? d.ref : null,
      savedAt: d.savedAt
    };
  } catch (e) { return null; }
}

/* Took the `booking` / `lastRef` globals in js/app.js; both are React state now. */
export function saveDraft(core: BookingCore, ref: string | null): void {
  if (!core.checkin || !core.checkout) return;
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({
      v: 1,
      state: core.state,
      checkin: core.checkin,
      checkout: core.checkout,
      guests: core.guests,
      coupon: core.coupon,
      ref: ref,
      savedAt: Date.now()
    }));
  } catch (e) {}
}

export function clearDraft(): void {
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
}
