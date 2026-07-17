/* Pyari Kunj Vrindavan — direct booking funnel (no backend). */
'use strict';

/* =====================================================================
   CONFIG — every business number lives here.
   !! LAUNCH GATE: replace upiId + payeeName with real values.
   ===================================================================== */
var CONFIG = {
  currency: 'INR',
  basePrice: 2499,          // ₹ per night before discount
  discountPct: 0.10,        // flat direct-booking discount, always applied
  minNights: 1,
  maxGuests: 4,
  maxAdvanceMonths: 6,      // booking horizon for the calendar
  upiId: 'vrand0939@okicici',
  payeeName: 'Pyari Kunj Vrindavan',
  whatsapp: '918791567123',
  airbnbUrl: 'https://www.airbnb.co.in/h/pyari-kunj',
  propertyName: 'Pyari Kunj Vrindavan',
  draftTtlHours: 48,
  storageKey: 'pk_booking_draft'
};

/* ================= TRACKING ================= */
window.__phQueue = window.__phQueue || [];

function safeTrack(eventName, properties) {
  properties = properties || {};
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(eventName, properties);
    return;
  }
  window.__phQueue.push([eventName, properties]);
}

function flushQueuedTracks() {
  if (!window.posthog || typeof window.posthog.capture !== 'function' || !Array.isArray(window.__phQueue)) return;
  while (window.__phQueue.length) {
    var nextEvent = window.__phQueue.shift();
    if (nextEvent) window.posthog.capture(nextEvent[0], nextEvent[1] || {});
  }
}
window.flushQueuedTracks = flushQueuedTracks;

/* Meta dual-send: Pixel (browser) + CAPI (server) share ONE eventID so Meta
   deduplicates the two copies. Purchase is NEVER sent from here — it is fired
   server-side only, from a verified & captured Razorpay payment. */
function getCookie(name) {
  var m = document.cookie.match('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
  return m ? decodeURIComponent(m[1]) : null;
}
function uuid() {
  return (self.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'e-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
function metaUserData() {
  var fbp = getCookie('_fbp');
  var fbc = getCookie('_fbc');
  if (!fbc) {
    try {
      var cid = new URLSearchParams(location.search).get('fbclid');
      if (cid) fbc = 'fb.1.' + Date.now() + '.' + cid;
    } catch (e) {}
  }
  return { fbp: fbp, fbc: fbc };
}
function sendCapi(eventName, id, customData, userData) {
  var ud = metaUserData();
  var payload = {
    event_name: eventName, event_id: id, event_source_url: location.href,
    custom_data: customData || {}, fbp: ud.fbp, fbc: ud.fbc
  };
  if (userData && userData.em) payload.em = userData.em;
  if (userData && userData.ph) payload.ph = userData.ph;
  try {
    fetch('/api/meta-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), keepalive: true
    }).catch(function () {});
  } catch (e) {}
}
function metaTrack(eventName, customData, userData) {
  var id = uuid();
  try { window.fbq && window.fbq('track', eventName, customData || {}, { eventID: id }); } catch (e) {}
  sendCapi(eventName, id, customData || {}, userData);
}
// Browser PageView already fired inline (window.__pkPV); mirror it to CAPI once.
function sendPageViewCapi() { if (window.__pkPV) sendCapi('PageView', window.__pkPV, {}, null); }

/* ================= DATE HELPERS =================
   All dates are 'YYYY-MM-DD' strings; math via Date.UTC (no TZ drift). */
var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function toISO(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }
function parseISO(s) {
  var p = s.split('-');
  return { y: +p[0], m: +p[1], d: +p[2] };
}
function isoUTC(s) { var p = parseISO(s); return Date.UTC(p.y, p.m - 1, p.d); }
function nightsBetween(a, b) { return Math.round((isoUTC(b) - isoUTC(a)) / 86400000); }
function todayISO() {
  var n = new Date();
  return toISO(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
function fmtShort(s) { // "Fri 18 Jul"
  var p = parseISO(s);
  var d = new Date(p.y, p.m - 1, p.d);
  return DAY_SHORT[d.getDay()] + ' ' + p.d + ' ' + MON_SHORT[p.m - 1];
}
function fmtLong(s) { // "Fri 18 Jul 2026"
  return fmtShort(s) + ' ' + parseISO(s).y;
}
function fmtRange(ci, co) { // "18–20 Jul" or "31 Jul – 2 Aug"
  var a = parseISO(ci), b = parseISO(co);
  if (a.m === b.m && a.y === b.y) return a.d + '–' + b.d + ' ' + MON_SHORT[a.m - 1];
  return a.d + ' ' + MON_SHORT[a.m - 1] + ' – ' + b.d + ' ' + MON_SHORT[b.m - 1];
}

/* ================= PRICE ================= */
var inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
function rupees(n) { return '₹' + inrFmt.format(n); }
function quote(nights) {
  var gross = CONFIG.basePrice * nights;
  var total = Math.round(gross * (1 - CONFIG.discountPct));
  return { nights: nights, gross: gross, discount: gross - total, total: total };
}
var NIGHTLY_OFF = Math.round(CONFIG.basePrice * (1 - CONFIG.discountPct));

/* ================= DRAFT STORE (localStorage + TTL) ================= */
var FUNNEL_STATES = ['idle', 'review', 'confirmed'];

function stateRank(s) { return FUNNEL_STATES.indexOf(s); }

function loadDraft() {
  try {
    var raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    var d = JSON.parse(raw);
    if (!d || d.v !== 1) return null;
    if (typeof d.savedAt !== 'number' || Date.now() - d.savedAt > CONFIG.draftTtlHours * 3600000) return null;
    if (stateRank(d.state) < 0) return null;
    if (!d.checkin || !d.checkout || nightsBetween(d.checkin, d.checkout) < CONFIG.minNights) return null;
    if (d.checkin < todayISO()) return null; // stay already started/past — discard
    d.guests = Math.min(Math.max(1, d.guests | 0), CONFIG.maxGuests);
    return d;
  } catch (e) { return null; }
}

function saveDraft() {
  if (!booking.checkin || !booking.checkout) return;
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({
      v: 1,
      state: booking.state,
      checkin: booking.checkin,
      checkout: booking.checkout,
      guests: booking.guests,
      ref: lastRef,
      savedAt: Date.now()
    }));
  } catch (e) {}
}

function clearDraft() {
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
}

/* ================= BOOKING STATE ================= */
var booking = { state: 'idle', checkin: null, checkout: null, guests: 2 };
var lastTrackedTotal = null;
var lastRef = null;      // reservation ref of the confirmed booking
var reserving = false;   // guards against double checkout starts

function setState(next) {
  booking.state = next;
  if (booking.checkin && booking.checkout) saveDraft(); else clearDraft();
  render();
}

/* Any edit after the WhatsApp gate drops the funnel back to review —
   changed dates/guests mean the host must re-confirm. */
function downgradeIfNeeded() {
  if (stateRank(booking.state) > stateRank('review')) {
    safeTrack('funnel_downgraded_to_review', { from: booking.state });
    booking.state = 'review';
  }
}

/* ================= URL BUILDERS ================= */
function waUrl(message) {
  return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);
}
/* Recovery/assistance WhatsApp link, prefilled with the guest's selection and
   attribution so the host can pick the thread up with full context. */
function lastAttribution() {
  try { return JSON.parse(localStorage.getItem('attribution_last')) || {}; } catch (e) { return {}; }
}
function waContextLines() {
  var lines = [];
  if (booking.checkin && booking.checkout) {
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    lines.push('Check-in: ' + fmtLong(booking.checkin));
    lines.push('Check-out: ' + fmtLong(booking.checkout) + ' (' + q.nights + ' night' + (q.nights > 1 ? 's' : '') + ')');
    lines.push('Guests: ' + booking.guests);
    lines.push('Estimated total: ' + rupees(q.total));
  }
  var a = lastAttribution();
  if (a.utm_source || a.utm_campaign) {
    lines.push('Source: ' + [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / '));
  }
  return lines;
}
function waFallbackUrl(reason) {
  var lines = ["Hi Saar! I was booking Pyari Kunj on the website but " + reason + '.']
    .concat(waContextLines());
  lines.push('Can you help me complete the booking?');
  return waUrl(lines.join('\n'));
}
/* FAB message — the guest has picked dates but hasn't paid yet */
function waInterestUrl() {
  var lines = ["Hi Saar! I'm interested in booking Pyari Kunj for these dates:"]
    .concat(waContextLines());
  lines.push('I have a few questions before I book.');
  return waUrl(lines.join('\n'));
}
function hostBookingUrl(ref) {
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  return waUrl(
    'Hi Saar! My Pyari Kunj booking is confirmed and paid.\n' +
    'Ref: ' + (ref || '—') + '\n' +
    'Check-in: ' + fmtLong(booking.checkin) + '\n' +
    'Check-out: ' + fmtLong(booking.checkout) + ' (' + q.nights + ' night' + (q.nights > 1 ? 's' : '') + ')\n' +
    'Guests: ' + booking.guests + '\n' +
    'Paid: ' + rupees(q.total) + ' via Razorpay.\n' +
    'Please share the exact location and check-in details.'
  );
}

/* ================= DOM ================= */
function $(id) { return document.getElementById(id); }

var el = {}; // populated in init()

/* ================= AVAILABILITY (Airbnb iCal via /api/availability) ================= */
var blockedNights = {}; // 'YYYY-MM-DD' -> true (nights that are booked/blocked on Airbnb)
var availabilityDegraded = false; // true when the live calendar couldn't be loaded

function nextDay(iso) {
  var d = new Date(isoUTC(iso) + 86400000);
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function rangeHasBlockedNight(ci, co) {
  for (var d = ci; d < co; d = nextDay(d)) {
    if (blockedNights[d]) return true;
  }
  return false;
}

function fetchAvailability() {
  if (typeof fetch !== 'function') return;
  fetch('/api/availability').then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (data) {
    // Be honest when the live calendar couldn't load: don't present every date
    // as apparently free without saying so (the server still fails closed).
    availabilityDegraded = !data || !!data.degraded;
    if (availabilityDegraded && calOpen) paintCalendar();
    if (!data || !Array.isArray(data.blocked) || !data.blocked.length) return;
    blockedNights = {};
    data.blocked.forEach(function (range) {
      if (!range || !range.start || !range.end) return;
      for (var d = range.start; d < range.end; d = nextDay(d)) blockedNights[d] = true;
    });
    buildCalendar();
    if (calOpen) paintCalendar();
    // If a pre-confirmation draft now collides with an Airbnb booking, reset it.
    // Never touch awaiting/payment states — that block may be the host holding
    // these very dates for this guest.
    if (booking.checkin && booking.checkout &&
        stateRank(booking.state) <= stateRank('review') &&
        rangeHasBlockedNight(booking.checkin, booking.checkout)) {
      booking.checkin = null;
      booking.checkout = null;
      booking.state = 'idle';
      clearDraft();
      render();
      safeTrack('draft_dates_unavailable', {});
    }
    safeTrack('availability_loaded', { blocked_nights: Object.keys(blockedNights).length });
  }).catch(function () {
    availabilityDegraded = true;
    if (calOpen) paintCalendar();
  });
}

/* ================= CALENDAR ================= */
var calOpen = false;
var calSel = { checkin: null, checkout: null }; // working selection inside the sheet
var calPushed = false;

function calHorizonEnd() {
  var n = new Date();
  var end = new Date(n.getFullYear(), n.getMonth() + CONFIG.maxAdvanceMonths + 1, 0); // last day of horizon month
  return toISO(end.getFullYear(), end.getMonth() + 1, end.getDate());
}

function buildCalendar() {
  var frag = document.createDocumentFragment();
  var now = new Date();
  var today = todayISO();
  var horizon = calHorizonEnd();
  for (var i = 0; i <= CONFIG.maxAdvanceMonths; i++) {
    var y = now.getFullYear(), m = now.getMonth() + i; // 0-based month, may overflow
    var first = new Date(y, m, 1);
    y = first.getFullYear(); m = first.getMonth();
    var monthEl = document.createElement('div');
    monthEl.className = 'cal-month';
    var name = document.createElement('div');
    name.className = 'cal-month-name';
    name.textContent = MON_LONG[m] + ' ' + y;
    monthEl.appendChild(name);
    var grid = document.createElement('div');
    grid.className = 'cal-grid';
    var lead = first.getDay(); // Sunday-first
    for (var b = 0; b < lead; b++) {
      var blank = document.createElement('span');
      blank.className = 'cal-day empty';
      grid.appendChild(blank);
    }
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    for (var d = 1; d <= daysInMonth; d++) {
      var iso = toISO(y, m + 1, d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      btn.dataset.date = iso;
      if (iso < today || iso > horizon) btn.disabled = true;
      else if (blockedNights[iso]) {
        btn.disabled = true;
        btn.classList.add('blocked');
        btn.setAttribute('aria-label', 'Booked');
      }
      grid.appendChild(btn);
    }
    monthEl.appendChild(grid);
    frag.appendChild(monthEl);
  }
  el.calMonths.textContent = '';
  el.calMonths.appendChild(frag);
}

function onDayTap(iso) {
  if (!calSel.checkin || (calSel.checkin && calSel.checkout)) {
    // fresh start (also covers restart after a complete range)
    calSel.checkin = iso;
    calSel.checkout = null;
  } else if (iso <= calSel.checkin) {
    // tapping on/before check-in restarts the range → min 1 night guaranteed
    calSel.checkin = iso;
    calSel.checkout = null;
  } else if (rangeHasBlockedNight(calSel.checkin, iso)) {
    // the span would cross an Airbnb booking — restart from the tapped date
    calSel.checkin = iso;
    calSel.checkout = null;
  } else {
    calSel.checkout = iso;
    safeTrack('dates_selected', {
      checkin: calSel.checkin,
      checkout: calSel.checkout,
      nights: nightsBetween(calSel.checkin, calSel.checkout)
    });
  }
  paintCalendar();
}

function paintCalendar() {
  var days = el.calMonths.querySelectorAll('.cal-day[data-date]');
  for (var i = 0; i < days.length; i++) {
    var b = days[i];
    var iso = b.dataset.date;
    b.classList.remove('anchor', 'in-range');
    if (iso === calSel.checkin || iso === calSel.checkout) b.classList.add('anchor');
    else if (calSel.checkin && calSel.checkout && iso > calSel.checkin && iso < calSel.checkout) b.classList.add('in-range');
  }
  // footer summary
  if (calSel.checkin && calSel.checkout) {
    var n = nightsBetween(calSel.checkin, calSel.checkout);
    el.calMain.textContent = n + ' night' + (n > 1 ? 's' : '') + ' · ' + rupees(quote(n).total) + ' total';
    el.calSub.textContent = fmtShort(calSel.checkin) + ' → ' + fmtShort(calSel.checkout);
    el.calSave.disabled = false;
  } else if (calSel.checkin) {
    el.calMain.textContent = 'Select check-out';
    el.calSub.textContent = 'Check-in ' + fmtShort(calSel.checkin);
    el.calSave.disabled = true;
  } else {
    el.calMain.textContent = 'Select check-in';
    el.calSub.textContent = Object.keys(blockedNights).length
      ? 'Struck-out dates are already booked'
      : (availabilityDegraded
        ? 'Live availability is briefly unavailable; dates are re-verified before payment'
        : 'Minimum stay: 1 night');
    el.calSave.disabled = true;
  }
}

function openCalendar(source) {
  if (calOpen) return;
  calOpen = true;
  calSel.checkin = booking.checkin;
  calSel.checkout = booking.checkout;
  paintCalendar();
  el.calSheet.classList.add('open');
  el.calBackdrop.classList.add('show');
  document.body.classList.add('sheet-open');
  document.body.style.overflow = 'hidden';
  try { history.pushState({ pkCal: true }, ''); calPushed = true; } catch (e) { calPushed = false; }
  safeTrack('funnel_opened', { source: source });
}

function closeCalendar(fromPop) {
  if (!calOpen) return;
  calOpen = false;
  el.calSheet.classList.remove('open');
  el.calBackdrop.classList.remove('show');
  document.body.classList.remove('sheet-open');
  document.body.style.overflow = '';
  if (!fromPop && calPushed) { calPushed = false; try { history.back(); } catch (e) {} }
  else calPushed = false;
}

function saveCalendar() {
  if (!calSel.checkin || !calSel.checkout) return;
  booking.checkin = calSel.checkin;
  booking.checkout = calSel.checkout;
  downgradeIfNeeded();
  if (booking.state === 'idle') booking.state = 'review';
  saveDraft();
  closeCalendar(false);
  render();
  var bookEl = $('book');
  if (bookEl) bookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ================= RENDER ================= */
function showStep(step) {
  var steps = document.querySelectorAll('.funnel-step');
  for (var i = 0; i < steps.length; i++) {
    steps[i].classList.toggle('active', steps[i].dataset.step === step);
  }
}

function fillSummaries() {
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  var dates = fmtShort(booking.checkin) + ' → ' + fmtShort(booking.checkout);
  var guests = booking.guests + ' guest' + (booking.guests > 1 ? 's' : '');
  if (el.doneDates) el.doneDates.textContent = dates;
  if (el.doneGuests) el.doneGuests.textContent = guests;
  if (el.doneTotal) el.doneTotal.textContent = rupees(q.total);
  if (el.confRef) el.confRef.textContent = lastRef || '—';
  if (el.msgHostBtn) el.msgHostBtn.setAttribute('href', hostBookingUrl(lastRef));
}

function render() {
  var hasDates = !!(booking.checkin && booking.checkout);

  // --- review step widgets ---
  if (hasDates) {
    el.datesValue.textContent = fmtShort(booking.checkin) + ' → ' + fmtShort(booking.checkout);
    el.datesValue.classList.remove('placeholder');
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    el.bdNights.textContent = rupees(CONFIG.basePrice) + ' × ' + q.nights + ' night' + (q.nights > 1 ? 's' : '');
    el.bdGross.textContent = rupees(q.gross);
    el.bdDiscount.textContent = '−' + rupees(q.discount);
    el.bdTotal.textContent = rupees(q.total);
    el.breakdown.classList.add('show');
    if (el.reserveBtn) el.reserveBtn.classList.remove('is-disabled');
    if (q.total !== lastTrackedTotal) {
      lastTrackedTotal = q.total;
      safeTrack('price_viewed', { nights: q.nights, guests: booking.guests, total: q.total });
      metaTrack('InitiateCheckout', { value: q.total, currency: 'INR', content_name: 'Direct Booking' });
    }
  } else {
    el.datesValue.textContent = 'Add dates';
    el.datesValue.classList.add('placeholder');
    el.breakdown.classList.remove('show');
    if (el.reserveBtn) el.reserveBtn.classList.add('is-disabled');
  }
  el.guestCount.textContent = booking.guests;
  el.guestMinus.disabled = booking.guests <= 1;
  el.guestPlus.disabled = booking.guests >= CONFIG.maxGuests;

  // --- step visibility ---
  var step = booking.state === 'idle' ? 'review' : booking.state;
  showStep(step);
  if (booking.state === 'confirmed' && hasDates) fillSummaries();

  renderBar();
  renderResume();
  if (window.__pkSyncFab) window.__pkSyncFab();
}

function renderBar() {
  var main = '', sub = '', cta = '', hidden = false;
  var hasDates = !!(booking.checkin && booking.checkout);
  var q = hasDates ? quote(nightsBetween(booking.checkin, booking.checkout)) : null;
  switch (booking.state) {
    case 'idle':
      main = '<span class="bb-was">' + rupees(CONFIG.basePrice) + '</span>' + rupees(NIGHTLY_OFF) + ' <span class="bb-unit">/ night</span>';
      sub = '10% off · applied automatically';
      cta = 'Check dates';
      break;
    case 'review':
      if (hasDates) {
        main = rupees(q.total) + ' <span class="bb-unit">total</span>';
        sub = q.nights + ' night' + (q.nights > 1 ? 's' : '') + ' · ' + fmtRange(booking.checkin, booking.checkout) + ' · 10% off applied';
        cta = 'Reserve';
      } else {
        main = '<span class="bb-was">' + rupees(CONFIG.basePrice) + '</span>' + rupees(NIGHTLY_OFF) + ' <span class="bb-unit">/ night</span>';
        sub = '10% off · applied automatically';
        cta = 'Check dates';
      }
      break;
    case 'confirmed':
      hidden = true;
      break;
  }
  el.barMain.innerHTML = main;
  el.barSub.textContent = sub;
  el.barCta.textContent = cta;
  el.bookBar.classList.toggle('hidden', hidden);
}

function renderResume() {
  var show = booking.state === 'confirmed' && booking.checkin;
  el.resumeBanner.classList.toggle('show', !!show);
  if (show) {
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    el.resumeSub.textContent = fmtRange(booking.checkin, booking.checkout) + ' · ' +
      booking.guests + ' guest' + (booking.guests > 1 ? 's' : '') + ' · ' + rupees(q.total) + ' · confirmed';
  }
}

/* ================= RAZORPAY CHECKOUT FLOW =================
   Reserve → create order (server prices it) → Razorpay modal → verify signature
   (server) → confirmed. Purchase is reported server-side, never here. */
function setReserveLabel(txt) {
  if (el.reserveLabel) el.reserveLabel.textContent = txt;
  // visual-only busy state (spinner) while checkout/verification is in flight
  if (el.reserveBtn) el.reserveBtn.classList.toggle('is-busy', txt !== 'Reserve & pay');
}
/* msg: visible text · waReason: when set, appends a prefilled WhatsApp recovery
   link · asNote: neutral (non-error) styling for recoverable states. */
function showPayError(msg, waReason, asNote) {
  if (!el.payError) return;
  el.payError.textContent = msg;
  el.payError.classList.toggle('is-note', !!asNote);
  if (waReason) {
    el.payError.appendChild(document.createTextNode(' '));
    var a = document.createElement('a');
    a.href = waFallbackUrl(waReason);
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'pay-error-wa';
    a.textContent = 'Message Saar on WhatsApp';
    a.addEventListener('click', function () {
      safeTrack('whatsapp_fallback_clicked', { context: waReason });
      metaTrack('Contact', { content_name: 'WhatsApp Fallback' });
    });
    el.payError.appendChild(a);
  }
  el.payError.hidden = false;
}
function hidePayError() {
  if (el.payError) {
    el.payError.hidden = true;
    el.payError.textContent = '';
    el.payError.classList.remove('is-note');
  }
}
function resetReserve() { reserving = false; setReserveLabel('Reserve & pay'); }

function startReserve() {
  if (reserving || !booking.checkin || !booking.checkout) return;
  if (rangeHasBlockedNight(booking.checkin, booking.checkout)) {
    showPayError('Those dates are no longer available — please pick different dates.');
    return;
  }
  reserving = true; hidePayError(); setReserveLabel('Starting secure checkout…');
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  safeTrack('reserve_clicked', { total: q.total, nights: q.nights, guests: booking.guests });
  metaTrack('Lead', { content_name: 'Direct Booking', value: q.total, currency: 'INR' });

  // fbp/fbc ride along so the server can pin attribution into the Razorpay
  // order notes — the webhook Purchase keeps it even if the tab closes.
  var ud = metaUserData();
  fetch('/api/create-order', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkin: booking.checkin, checkout: booking.checkout, guests: booking.guests, fbp: ud.fbp, fbc: ud.fbc })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok || !res.d || !res.d.order_id) { orderError(res.d); resetReserve(); return; }
      openRazorpay(res.d);
    })
    .catch(function () { showPayError('Could not start checkout. Please try again.', 'checkout would not start'); resetReserve(); });
}

function orderError(d) {
  var e = d && d.error;
  if (e === 'dates_unavailable') showPayError('Those dates were just taken — please choose different dates.');
  else if (e === 'availability_unverified') showPayError('We can’t confirm availability right now. Please try again shortly, or message us on WhatsApp.', 'the site could not verify availability for my dates');
  else if (e === 'razorpay_not_configured') showPayError('Online booking isn’t live yet. Please message us on WhatsApp to book.', 'online booking is not live yet');
  else showPayError('Could not start checkout. Please try again.', 'checkout would not start');
}

function openRazorpay(order) {
  if (typeof Razorpay === 'undefined') { showPayError('Payment is still loading — please try again in a moment.'); resetReserve(); return; }
  setReserveLabel('Opening payment…');
  metaTrack('AddPaymentInfo', { value: order.total, currency: 'INR', content_name: 'Direct Booking' });
  var rzp = new Razorpay({
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
    name: CONFIG.propertyName,
    description: fmtRange(booking.checkin, booking.checkout) + ' · ' + booking.guests + ' guest' + (booking.guests > 1 ? 's' : ''),
    theme: { color: '#A61E4D' },
    notes: { ref: order.reservation_ref },
    handler: function (resp) { verifyPayment(resp, order); },
    modal: { ondismiss: function () {
      safeTrack('checkout_dismissed', {});
      resetReserve();
      // abandoned-booking recovery: dates stay selected; retry or hand off to WhatsApp
      showPayError('Payment not completed. Your dates are saved, so you can retry whenever you’re ready.', 'I did not finish the payment', true);
    } }
  });
  rzp.on('payment.failed', function (resp) {
    showPayError('Payment failed: ' + ((resp.error && resp.error.description) || 'please try again.'), 'my payment failed');
    safeTrack('payment_failed', { reason: (resp.error && resp.error.code) || 'unknown' });
    resetReserve();
  });
  rzp.open();
}

function verifyPayment(resp, order) {
  setReserveLabel('Confirming payment…');
  var ud = metaUserData();
  fetch('/api/verify-payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: resp.razorpay_order_id,
      razorpay_payment_id: resp.razorpay_payment_id,
      razorpay_signature: resp.razorpay_signature,
      fbp: ud.fbp, fbc: ud.fbc
    })
  }).then(function (r) { return r.json(); }).then(function (d) {
    resetReserve();
    if (d && d.verified) {
      lastRef = d.reservation_ref || order.reservation_ref;
      safeTrack('booking_confirmed', { ref: lastRef, amount: d.amount });
      setState('confirmed');
      var bookEl = $('book'); if (bookEl) bookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showPayError('Payment received but we couldn’t auto-confirm. Please message us on WhatsApp with your payment id.', 'my payment went through but was not auto-confirmed (payment id: ' + resp.razorpay_payment_id + ')');
    }
  }).catch(function () {
    resetReserve();
    showPayError('Payment received but we couldn’t auto-confirm. Please message us on WhatsApp.', 'my payment went through but was not auto-confirmed (payment id: ' + resp.razorpay_payment_id + ')');
  });
}

/* ================= INIT ================= */
function initFunnel() {
  var ids = ['bookBar', 'barMain', 'barSub', 'barCta', 'resumeBanner', 'resumeSub', 'resumeCta',
    'calSheet', 'calBackdrop', 'calMonths', 'calMain', 'calSub', 'calSave', 'calClear', 'calClose',
    'datesField', 'datesValue', 'guestMinus', 'guestPlus', 'guestCount',
    'breakdown', 'bdNights', 'bdGross', 'bdDiscount', 'bdTotal',
    'reserveBtn', 'reserveLabel', 'payError', 'confRef',
    'doneDates', 'doneGuests', 'doneTotal', 'newBookingBtn', 'msgHostBtn'];
  for (var i = 0; i < ids.length; i++) el[ids[i]] = $(ids[i]);

  // restore draft
  var draft = loadDraft();
  if (draft) {
    booking.state = draft.state;
    booking.checkin = draft.checkin;
    booking.checkout = draft.checkout;
    booking.guests = draft.guests;
    lastRef = draft.ref || null;
    safeTrack('draft_restored', {
      state: draft.state,
      age_hours: Math.round((Date.now() - draft.savedAt) / 3600000 * 10) / 10
    });
  }

  buildCalendar();
  render();

  // --- calendar wiring ---
  el.calMonths.addEventListener('click', function (e) {
    var b = e.target.closest('.cal-day[data-date]');
    if (b && !b.disabled) onDayTap(b.dataset.date);
  });
  el.calSave.addEventListener('click', saveCalendar);
  el.calClear.addEventListener('click', function () {
    calSel.checkin = null;
    calSel.checkout = null;
    paintCalendar();
  });
  el.calClose.addEventListener('click', function () { closeCalendar(false); });
  el.calBackdrop.addEventListener('click', function () { closeCalendar(false); });
  window.addEventListener('popstate', function () { if (calOpen) closeCalendar(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && calOpen) closeCalendar(false);
  });

  el.datesField.addEventListener('click', function () { openCalendar('widget'); });

  // --- guest stepper ---
  el.guestMinus.addEventListener('click', function () { changeGuests(-1); });
  el.guestPlus.addEventListener('click', function () { changeGuests(1); });
  function changeGuests(delta) {
    var g = Math.min(Math.max(1, booking.guests + delta), CONFIG.maxGuests);
    if (g === booking.guests) return;
    booking.guests = g;
    downgradeIfNeeded();
    saveDraft();
    safeTrack('guests_selected', { guests: g });
    render();
  }

  // --- review → Razorpay checkout ---
  if (el.reserveBtn) {
    el.reserveBtn.addEventListener('click', function () {
      if (el.reserveBtn.classList.contains('is-disabled')) return;
      startReserve();
    });
  }

  // --- confirmed step: start a new booking ---
  el.newBookingBtn.addEventListener('click', function () {
    clearDraft();
    booking.state = 'idle';
    booking.checkin = null;
    booking.checkout = null;
    booking.guests = 2;
    lastTrackedTotal = null;
    lastRef = null;
    hidePayError();
    resetReserve();
    render();
    openCalendar('new-booking');
  });

  // --- sticky bar ---
  el.barCta.addEventListener('click', function () {
    var bookEl = $('book');
    switch (booking.state) {
      case 'idle':
        openCalendar('sticky-bar');
        break;
      case 'review':
        if (booking.checkin) bookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else openCalendar('sticky-bar');
        break;
      default:
        bookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    safeTrack('sticky_bar_clicked', { state: booking.state });
  });

  // --- resume banner ---
  el.resumeCta.addEventListener('click', function () {
    $('book').scrollIntoView({ behavior: 'smooth', block: 'center' });
    safeTrack('resume_banner_clicked', { state: booking.state });
  });

  // --- live availability from the Airbnb calendar (non-blocking) ---
  fetchAvailability();
}

/* ================= KEPT PAGE UI ================= */
function initPageUi() {
  // Attribution capture (first/last touch)
  try {
    var params = new URLSearchParams(window.location.search);
    var fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'msclkid'];
    var current = {};
    fields.forEach(function (k) { var v = params.get(k); if (v) current[k] = v; });
    if (Object.keys(current).length) {
      current.captured_at = new Date().toISOString();
      current.landing_url = window.location.href;
      localStorage.setItem('attribution_last', JSON.stringify(current));
      if (!localStorage.getItem('attribution_first')) {
        localStorage.setItem('attribution_first', JSON.stringify(current));
      }
    }
  } catch (e) {}

  // Lightbox
  var lightbox = $('mosaicLightbox');
  var lbTrack = $('lbTrack');
  var lbCounterEl = $('lbCounter');
  var LB_TOTAL = lbTrack ? lbTrack.children.length : 0;
  var lbCurrentIndex = 0;

  function scrollLbTo(index, behavior) {
    var slide = lbTrack.children[index];
    if (slide) slide.scrollIntoView({ behavior: behavior || 'smooth', block: 'nearest', inline: 'start' });
    lbCurrentIndex = index;
    lbCounterEl.textContent = (index + 1) + ' / ' + LB_TOTAL;
  }
  function openLightbox(index) {
    lbCurrentIndex = index;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    scrollLbTo(index, 'instant');
    safeTrack('lightbox_opened', { photo_index: index });
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    safeTrack('lightbox_closed', { last_index: lbCurrentIndex });
  }

  document.querySelectorAll('.js-photo').forEach(function (trigger, i) {
    trigger.addEventListener('click', function () {
      var photoIndex = parseInt(trigger.dataset.photoIndex || '0', 10);
      safeTrack('photo_trigger_clicked', { trigger_index: i, photo_index: photoIndex });
      openLightbox(photoIndex);
    });
  });
  $('lbClose').addEventListener('click', closeLightbox);
  $('lbPrev').addEventListener('click', function () { if (lbCurrentIndex > 0) scrollLbTo(lbCurrentIndex - 1); });
  $('lbNext').addEventListener('click', function () { if (lbCurrentIndex < LB_TOTAL - 1) scrollLbTo(lbCurrentIndex + 1); });
  lbTrack.addEventListener('scroll', function () {
    var idx = Math.round(lbTrack.scrollLeft / lbTrack.offsetWidth);
    if (idx !== lbCurrentIndex && idx >= 0 && idx < LB_TOTAL) {
      lbCurrentIndex = idx;
      lbCounterEl.textContent = (idx + 1) + ' / ' + LB_TOTAL;
    }
  }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && lbCurrentIndex > 0) scrollLbTo(lbCurrentIndex - 1);
    if (e.key === 'ArrowRight' && lbCurrentIndex < LB_TOTAL - 1) scrollLbTo(lbCurrentIndex + 1);
  });

  // WhatsApp FAB — appears once the hero is scrolled past, but stays out of
  // the way while the booking widget (which has its own WhatsApp CTA) is on screen
  var waFab = $('waFab');
  var heroSec = $('hero');
  var bookSec = $('book');
  if (waFab && heroSec && bookSec) {
    var heroVisible = true, bookVisible = false;
    var syncFab = function () {
      // Only invite WhatsApp chats from guests who have committed to dates —
      // pre-selection questions are handled by the page itself.
      var hasDates = !!(booking.checkin && booking.checkout);
      if (hasDates) waFab.setAttribute('href', waInterestUrl()); // prefill the selection
      waFab.classList.toggle('show', hasDates && !heroVisible && !bookVisible);
    };
    window.__pkSyncFab = syncFab; // re-evaluated from render() when dates change
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      syncFab();
    }, { threshold: 0 }).observe(heroSec);
    new IntersectionObserver(function (entries) {
      bookVisible = entries[0].isIntersecting;
      syncFab();
    }, { threshold: 0.15 }).observe(bookSec);
    // desktop-only CSS uses .past-book to reveal the bottom bar once the
    // booking card has been scrolled past (bar is hidden in idle up there)
    var bookBar = $('bookBar');
    if (bookBar) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        bookBar.classList.toggle('past-book', !e.isIntersecting && e.boundingClientRect.bottom < 0);
      }, { threshold: 0 }).observe(bookSec);
    }
    waFab.addEventListener('click', function () {
      safeTrack('whatsapp_fab_clicked', {});
      // Meta Contact = assistance intent; Lead stays reserved for Reserve clicks.
      metaTrack('Contact', { content_name: 'WhatsApp FAB' });
    });
  }

  // Airbnb secondary links
  document.querySelectorAll('.js-airbnb-link').forEach(function (link) {
    link.addEventListener('click', function () {
      safeTrack('airbnb_cta_clicked', { source: link.dataset.source || 'airbnb' });
    });
  });

  // Share
  $('shareBtn').addEventListener('click', function () {
    safeTrack('share_clicked', {});
    if (navigator.share) {
      navigator.share({ title: CONFIG.propertyName + ' – Homestay', url: window.location.href }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(function () {});
    }
  });

  // Amenities expander
  var amenityToggle = $('amenityToggle');
  if (amenityToggle) {
    amenityToggle.addEventListener('click', function () {
      var more = $('amenityMore');
      var open = more.classList.toggle('show');
      amenityToggle.textContent = open ? 'Show fewer amenities' : 'Show all amenities';
      if (open) safeTrack('amenities_expanded', {});
    });
  }

  // About read-more
  var readMore = $('readMoreBtn');
  if (readMore) {
    readMore.addEventListener('click', function () {
      var copy = $('aboutCopy');
      var collapsed = copy.classList.toggle('collapsed');
      readMore.textContent = collapsed ? 'Read more' : 'Read less';
    });
  }

  // Fade-up sections
  var fadeObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(function (n) { fadeObs.observe(n); });
}

document.addEventListener('DOMContentLoaded', function () {
  initFunnel();
  initPageUi();
  // Mirror the inline browser PageView to CAPI once _fbp/_fbc cookies are set.
  setTimeout(sendPageViewCapi, 1500);
});
