/* ================= AVAILABILITY =================
   Reads directly from the Supabase blocked_dates table (no backend hop —
   the anon key is safe client-side, see lib/supabase.js for why). This is
   the cosmetic calendar view only; api/create-order.js re-checks the same
   table server-side as the real fail-closed gate before taking payment. */
import { CONFIG } from '@/booking/config';
import { nextDay } from '@/booking/dates';
import type { BlockedNights } from '@/booking/types';

export function rangeHasBlockedNight(blocked: BlockedNights, ci: string, co: string): boolean {
  for (let d = ci; d < co; d = nextDay(d)) {
    if (blocked[d]) return true;
  }
  return false;
}

/* Resolves to the expanded night map, or null when the live calendar could not
   be loaded — the caller must render that honestly (degraded) rather than show
   every date as apparently free. Checkout dates are exclusive, the same
   convention as the rest of the codebase. */
export async function fetchBlockedNights(): Promise<BlockedNights | null> {
  if (typeof fetch !== 'function') return null;
  const url = CONFIG.supabaseUrl + '/rest/v1/blocked_dates?select=start_date,end_date';
  try {
    const r = await fetch(url, {
      headers: { apikey: CONFIG.supabaseAnonKey, Authorization: 'Bearer ' + CONFIG.supabaseAnonKey }
    });
    if (!r.ok) return null;
    const data: unknown = await r.json();
    if (!Array.isArray(data)) return null;
    const blocked: BlockedNights = {};
    data.forEach(function (row: unknown) {
      if (!row || typeof row !== 'object') return;
      const range = row as Record<string, unknown>;
      if (typeof range.start_date !== 'string' || typeof range.end_date !== 'string') return;
      if (!range.start_date || !range.end_date) return;
      for (let d = range.start_date; d < range.end_date; d = nextDay(d)) blocked[d] = true;
    });
    return blocked;
  } catch (e) { return null; }
}
