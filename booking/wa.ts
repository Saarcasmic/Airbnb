/* ================= WHATSAPP URL BUILDERS =================
   Message text is guest-facing and is deliberately unchanged from js/app.js. */
import { CONFIG } from '@/booking/config';
import { fmtLong, nightsBetween } from '@/booking/dates';
import { appliedPct, quote, rupees } from '@/booking/price';
import type { Coupon } from '@/booking/types';

/* These read the `booking` global in js/app.js; the selection is React state
   now, so it is passed in. */
export type WaContext = {
  checkin: string | null;
  checkout: string | null;
  guests: number;
  coupon: Coupon | null;
};

/* hostBookingUrl only ever runs for a paid booking, which always has dates. */
export type ConfirmedWaContext = WaContext & { checkin: string; checkout: string };

type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string };

export function waUrl(message: string): string {
  return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);
}

/* Recovery/assistance WhatsApp link, prefilled with the guest's selection and
   attribution so the host can pick the thread up with full context. */
export function lastAttribution(): Attribution {
  try {
    // getItem may be null; JSON.parse(null) === JSON.parse('null') === null.
    const parsed: unknown = JSON.parse(localStorage.getItem('attribution_last') ?? 'null');
    if (!parsed || typeof parsed !== 'object') return {};
    const a = parsed as Record<string, unknown>;
    return {
      utm_source: typeof a.utm_source === 'string' ? a.utm_source : undefined,
      utm_medium: typeof a.utm_medium === 'string' ? a.utm_medium : undefined,
      utm_campaign: typeof a.utm_campaign === 'string' ? a.utm_campaign : undefined
    };
  } catch (e) { return {}; }
}

export function waContextLines(ctx: WaContext): string[] {
  const lines: string[] = [];
  if (ctx.checkin && ctx.checkout) {
    const q = quote(nightsBetween(ctx.checkin, ctx.checkout), appliedPct(ctx.coupon));
    lines.push('Check-in: ' + fmtLong(ctx.checkin));
    lines.push('Check-out: ' + fmtLong(ctx.checkout) + ' (' + q.nights + ' night' + (q.nights > 1 ? 's' : '') + ')');
    lines.push('Guests: ' + ctx.guests);
    lines.push('Estimated total: ' + rupees(q.total));
  }
  const a = lastAttribution();
  if (a.utm_source || a.utm_campaign) {
    lines.push('Source: ' + [a.utm_source, a.utm_medium, a.utm_campaign]
      .filter(function (v): v is string { return !!v; }).join(' / '));
  }
  return lines;
}

export function waFallbackUrl(reason: string, ctx: WaContext): string {
  const lines = ["Hi Saar! I was booking Pyari Kunj on the website but " + reason + '.']
    .concat(waContextLines(ctx));
  lines.push('Can you help me complete the booking?');
  return waUrl(lines.join('\n'));
}

/* FAB message — the guest has picked dates but hasn't paid yet */
export function waInterestUrl(ctx: WaContext): string {
  const lines = ["Hi Saar! I'm interested in booking Pyari Kunj for these dates:"]
    .concat(waContextLines(ctx));
  lines.push('I have a few questions before I book.');
  return waUrl(lines.join('\n'));
}

export function hostBookingUrl(ref: string | null, ctx: ConfirmedWaContext): string {
  const q = quote(nightsBetween(ctx.checkin, ctx.checkout), appliedPct(ctx.coupon));
  return waUrl(
    'Hi Saar! My Pyari Kunj booking is confirmed and paid.\n' +
    'Ref: ' + (ref || '—') + '\n' +
    'Check-in: ' + fmtLong(ctx.checkin) + '\n' +
    'Check-out: ' + fmtLong(ctx.checkout) + ' (' + q.nights + ' night' + (q.nights > 1 ? 's' : '') + ')\n' +
    'Guests: ' + ctx.guests + '\n' +
    'Paid: ' + rupees(q.total) + ' via Razorpay.\n' +
    'Please share the exact location and check-in details.'
  );
}
