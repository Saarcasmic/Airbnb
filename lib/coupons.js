// Shared coupon logic. The `coupons` table has RLS enabled with NO public
// policy — the anon key cannot read it, so guests can never enumerate the
// codes you haven't advertised. Every read here goes through the service_role
// key (server-side only), exactly like the blocked_dates writes.
//
// Discount model (changed 2026-08-09): there is no automatic discount any
// more. The nightly rate is CONFIG.basePrice and 100% of any reduction comes
// from a coupon. Exactly one coupon applies to a booking — they never stack.
var supabase = require('./supabase.js');

// Codes are shared by hand (WhatsApp, ads, print) — normalise aggressively so
// "  festive10 " and "FESTIVE10" are the same coupon.
function normalizeCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, '').toUpperCase();
}
function isValidCode(code) {
  return /^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(code);
}

function rowToCoupon(row) {
  var pct = parseInt(row && row.percent_off, 10);
  if (!(pct > 0 && pct <= 100)) return null;
  return { code: row.code, percent_off: pct, label: row.label || 'Festive offer' };
}

// Returns { code, percent_off, label } | null (unknown/inactive) | 'unverified'.
// 'unverified' means we could not reach Supabase — callers that take money MUST
// treat it as a hard failure rather than silently charging the undiscounted
// price the guest never agreed to.
async function lookup(rawCode) {
  var code = normalizeCode(rawCode);
  if (!isValidCode(code)) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 'unverified';
  try {
    var url = supabase.SUPABASE_URL + '/rest/v1/coupons' +
      '?select=code,percent_off,label' +
      '&code=eq.' + encodeURIComponent(code) +
      '&active=is.true&limit=1';
    var r = await fetch(url, { headers: supabase.serviceHeaders() });
    if (!r.ok) return 'unverified';
    var rows = await r.json();
    if (!Array.isArray(rows)) return 'unverified';
    if (!rows.length) return null;
    return rowToCoupon(rows[0]);
  } catch (e) { return 'unverified'; }
}

// The one coupon the host has chosen to advertise on the site banner.
// Returns { code, percent_off, label } | null. Never 'unverified' — a missing
// banner is a cosmetic loss, not a money decision, so it just stays hidden.
async function featured() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    var url = supabase.SUPABASE_URL + '/rest/v1/coupons' +
      '?select=code,percent_off,label' +
      '&active=is.true&featured=is.true&limit=1';
    var r = await fetch(url, { headers: supabase.serviceHeaders() });
    if (!r.ok) return null;
    var rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    return rowToCoupon(rows[0]);
  } catch (e) { return null; }
}

module.exports = {
  normalizeCode: normalizeCode,
  isValidCode: isValidCode,
  lookup: lookup,
  featured: featured
};
