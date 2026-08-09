// Shared booking logic: dates, server-authoritative pricing, and a
// FAIL-CLOSED availability check (instant booking must never sell a date
// we cannot prove is free). Used by api/create-order.js.
var supabase = require('./supabase.js');

var CONFIG = {
  basePrice: 2499,       // ₹ per night (mirror of js/app.js CONFIG)
  minNights: 1,
  maxGuests: 4,
  maxAdvanceMonths: 6
};

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function todayISO() { var n = new Date(); return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate()); }
function isoUTC(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
function nights(a, b) { return Math.round((isoUTC(b) - isoUTC(a)) / 86400000); }
function isISO(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function nextDay(iso) { var d = new Date(isoUTC(iso) + 86400000); return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()); }

function horizonEnd() {
  var n = new Date();
  var end = new Date(n.getFullYear(), n.getMonth() + CONFIG.maxAdvanceMonths + 1, 0);
  return end.getFullYear() + '-' + pad2(end.getMonth() + 1) + '-' + pad2(end.getDate());
}

// couponPct is a whole percentage (e.g. 10 for 10% off) or 0/undefined for
// none. It is the ONLY source of discount — there is no automatic reduction.
// js/app.js quote() must stay byte-for-byte equivalent to this, or the guest
// sees one price and Razorpay charges another.
function quote(n, couponPct) {
  var pct = (typeof couponPct === 'number' && couponPct > 0 && couponPct <= 100) ? Math.floor(couponPct) : 0;
  var gross = CONFIG.basePrice * n;
  var discount = Math.round(gross * pct / 100);
  var total = gross - discount;
  return { nights: n, gross: gross, discount: discount, couponPct: pct, total: total, amountPaise: total * 100 };
}

// Returns { ok:true } | { error:'bad_dates'|'past_dates'|'beyond_horizon'|'min_nights' }
function validateDates(checkin, checkout) {
  if (!isISO(checkin) || !isISO(checkout)) return { error: 'bad_dates' };
  if (checkin < todayISO()) return { error: 'past_dates' };
  if (checkout > nextDay(horizonEnd())) return { error: 'beyond_horizon' };
  if (!(nights(checkin, checkout) >= CONFIG.minNights)) return { error: 'min_nights' };
  return { ok: true };
}

// FAIL-CLOSED availability. Returns 'ok' | 'blocked' | 'unverified'.
// 'unverified' (network error / bad response) must be REJECTED by the
// caller — we never take money for a date we cannot confirm is open.
// Source of truth is the Supabase `blocked_dates` table (checkout dates are
// exclusive, same convention used throughout this codebase). Overlap test:
// an existing row blocks [ci, co) iff existing.start_date < co AND
// existing.end_date > ci.
async function checkAvailability(ci, co) {
  try {
    var url = supabase.SUPABASE_URL + '/rest/v1/blocked_dates' +
      '?select=start_date,end_date' +
      '&start_date=lt.' + co +
      '&end_date=gt.' + ci;
    var r = await fetch(url, { headers: supabase.headers() });
    if (!r.ok) return 'unverified';
    var rows = await r.json();
    if (!Array.isArray(rows)) return 'unverified';
    return rows.length ? 'blocked' : 'ok';
  } catch (e) { return 'unverified'; }
}

module.exports = {
  CONFIG: CONFIG, todayISO: todayISO, nights: nights, isISO: isISO, nextDay: nextDay,
  horizonEnd: horizonEnd, quote: quote, validateDates: validateDates, checkAvailability: checkAvailability
};
