// Shared booking logic: dates, server-authoritative pricing, and a
// FAIL-CLOSED availability check (instant booking must never sell a date
// we cannot prove is free). Used by api/create-order.js.
var availability = require('../api/availability.js');

var CONFIG = {
  basePrice: 2499,       // ₹ per night, pre-discount (mirror of js/app.js CONFIG)
  discountPct: 0.10,
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

function quote(n) {
  var gross = CONFIG.basePrice * n;
  var total = Math.round(gross * (1 - CONFIG.discountPct));
  return { nights: n, gross: gross, total: total, amountPaise: total * 100 };
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
// 'unverified' (missing env / upstream down / bad response) must be REJECTED
// by the caller — we never take money for a date we cannot confirm is open.
async function checkAvailability(ci, co) {
  if (!process.env.AIRBNB_ICAL_URL) return 'unverified';
  try {
    var r = await fetch(process.env.AIRBNB_ICAL_URL, { headers: { 'User-Agent': 'PyariKunj-Site/1.0' } });
    if (!r.ok) return 'unverified';
    var text = await r.text();
    if (!/BEGIN:VCALENDAR/.test(text)) return 'unverified';
    var blocked = availability.parseIcs(text);
    var set = {};
    blocked.forEach(function (range) { for (var d = range.start; d < range.end; d = nextDay(d)) set[d] = true; });
    for (var d = ci; d < co; d = nextDay(d)) if (set[d]) return 'blocked';
    return 'ok';
  } catch (e) { return 'unverified'; }
}

module.exports = {
  CONFIG: CONFIG, todayISO: todayISO, nights: nights, isISO: isISO, nextDay: nextDay,
  horizonEnd: horizonEnd, quote: quote, validateDates: validateDates, checkAvailability: checkAvailability
};
