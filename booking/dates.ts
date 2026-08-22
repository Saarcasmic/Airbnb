/* ================= DATE HELPERS =================
   All dates are 'YYYY-MM-DD' strings; math via Date.UTC (no TZ drift). */
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function pad2(n: number): string { return n < 10 ? '0' + n : '' + n; }
export function toISO(y: number, m: number, d: number): string { return y + '-' + pad2(m) + '-' + pad2(d); }
export function parseISO(s: string): { y: number; m: number; d: number } {
  const p = s.split('-');
  return { y: +p[0], m: +p[1], d: +p[2] };
}
export function isoUTC(s: string): number { const p = parseISO(s); return Date.UTC(p.y, p.m - 1, p.d); }
export function nightsBetween(a: string, b: string): number { return Math.round((isoUTC(b) - isoUTC(a)) / 86400000); }
export function todayISO(): string {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

/* Lived in the availability section of js/app.js (~line 276); it is plain date
   math, so it belongs here. Still UTC-based — a local-time +1 day would skip or
   repeat a night across a DST boundary. */
export function nextDay(iso: string): string {
  const d = new Date(isoUTC(iso) + 86400000);
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function fmtShort(s: string): string { // "Fri 18 Jul"
  const p = parseISO(s);
  const d = new Date(p.y, p.m - 1, p.d);
  return DAY_SHORT[d.getDay()] + ' ' + p.d + ' ' + MON_SHORT[p.m - 1];
}
export function fmtLong(s: string): string { // "Fri 18 Jul 2026"
  return fmtShort(s) + ' ' + parseISO(s).y;
}
export function fmtRange(ci: string, co: string): string { // "18–20 Jul" or "31 Jul – 2 Aug"
  const a = parseISO(ci), b = parseISO(co);
  if (a.m === b.m && a.y === b.y) return a.d + '–' + b.d + ' ' + MON_SHORT[a.m - 1];
  return a.d + ' ' + MON_SHORT[a.m - 1] + ' – ' + b.d + ' ' + MON_SHORT[b.m - 1];
}
