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

function metaTrack(eventName, properties) {
  try { window.fbq('track', eventName, properties || {}); } catch (e) {}
}

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
var FUNNEL_STATES = ['idle', 'review', 'awaiting_confirmation', 'payment', 'payment_claimed'];

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
function waConfirmUrl() {
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  return waUrl(
    'Hi Saar! I’d like to book ' + CONFIG.propertyName + '.\n' +
    'Check-in: ' + fmtLong(booking.checkin) + '\n' +
    'Check-out: ' + fmtLong(booking.checkout) + ' (' + q.nights + ' night' + (q.nights > 1 ? 's' : '') + ')\n' +
    'Guests: ' + booking.guests + '\n' +
    'Total with 10% direct discount: ' + rupees(q.total) + '\n' +
    'Are these dates available?'
  );
}
function waPaidUrl() {
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  return waUrl(
    'Hi Saar! I’ve paid ' + rupees(q.total) + ' via UPI for ' +
    fmtRange(booking.checkin, booking.checkout) + ' (' + booking.guests + ' guest' + (booking.guests > 1 ? 's' : '') + '). ' +
    'Sending the payment screenshot now.'
  );
}
function upiUrl() {
  var q = quote(nightsBetween(booking.checkin, booking.checkout));
  var note = (CONFIG.propertyName + ' ' + fmtRange(booking.checkin, booking.checkout)).slice(0, 48);
  return 'upi://pay?pa=' + encodeURIComponent(CONFIG.upiId) +
    '&pn=' + encodeURIComponent(CONFIG.payeeName) +
    '&am=' + q.total.toFixed(2) +
    '&cu=INR&tn=' + encodeURIComponent(note);
}

/* ================= DOM ================= */
function $(id) { return document.getElementById(id); }

var el = {}; // populated in init()

/* ================= AVAILABILITY (Airbnb iCal via /api/availability) ================= */
var blockedNights = {}; // 'YYYY-MM-DD' -> true (nights that are booked/blocked on Airbnb)

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
  }).catch(function () {});
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
      : 'Minimum stay: 1 night';
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
  var ids = ['awaitDates', 'payDates', 'doneDates'];
  for (var i = 0; i < ids.length; i++) if (el[ids[i]]) el[ids[i]].textContent = dates;
  var gids = ['awaitGuests', 'payGuests', 'doneGuests'];
  for (var j = 0; j < gids.length; j++) if (el[gids[j]]) el[gids[j]].textContent = guests;
  var tids = ['awaitTotal', 'doneTotal'];
  for (var k = 0; k < tids.length; k++) if (el[tids[k]]) el[tids[k]].textContent = rupees(q.total);
  el.payAmount.textContent = rupees(q.total);
  el.payAmountSub.textContent = q.nights + ' night' + (q.nights > 1 ? 's' : '') + ' · ' + guests + ' · ' + dates;
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
    el.waConfirmBtn.classList.remove('is-disabled');
    if (q.total !== lastTrackedTotal) {
      lastTrackedTotal = q.total;
      safeTrack('price_viewed', { nights: q.nights, guests: booking.guests, total: q.total });
      metaTrack('InitiateCheckout', { value: q.total, currency: 'INR', content_name: 'Direct Booking' });
    }
  } else {
    el.datesValue.textContent = 'Add dates';
    el.datesValue.classList.add('placeholder');
    el.breakdown.classList.remove('show');
    el.waConfirmBtn.classList.add('is-disabled');
    el.waConfirmBtn.removeAttribute('href');
  }
  el.guestCount.textContent = booking.guests;
  el.guestMinus.disabled = booking.guests <= 1;
  el.guestPlus.disabled = booking.guests >= CONFIG.maxGuests;

  // --- step visibility ---
  var step = booking.state === 'idle' ? 'review' : booking.state;
  showStep(step);
  if (hasDates && stateRank(booking.state) >= stateRank('awaiting_confirmation')) fillSummaries();

  // --- payment link (rebuilt each render so amount stays correct) ---
  if (hasDates) {
    el.upiPayBtn.setAttribute('href', upiUrl());
    el.waPaidBtn.setAttribute('href', waPaidUrl());
    el.waConfirmBtn.setAttribute('href', waConfirmUrl());
    el.waAgainBtn.setAttribute('href', waConfirmUrl());
  }
  el.upiIdText.textContent = CONFIG.upiId;
  el.upiNameText.textContent = 'Paying ' + CONFIG.payeeName;

  renderBar();
  renderResume();
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
    case 'awaiting_confirmation':
      main = fmtRange(booking.checkin, booking.checkout) + ' · ' + rupees(q.total);
      sub = 'Waiting for Saar to confirm on WhatsApp';
      cta = 'Got confirmation?';
      break;
    case 'payment':
      main = rupees(q.total) + ' <span class="bb-unit">to pay</span>';
      sub = fmtRange(booking.checkin, booking.checkout) + ' · ' + booking.guests + ' guests';
      cta = 'Pay via UPI';
      break;
    case 'payment_claimed':
      hidden = true;
      break;
  }
  el.barMain.innerHTML = main;
  el.barSub.textContent = sub;
  el.barCta.textContent = cta;
  el.bookBar.classList.toggle('hidden', hidden);
}

function renderResume() {
  var show = stateRank(booking.state) >= stateRank('awaiting_confirmation') && booking.checkin;
  el.resumeBanner.classList.toggle('show', !!show);
  if (show) {
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    el.resumeSub.textContent = fmtRange(booking.checkin, booking.checkout) + ' · ' +
      booking.guests + ' guest' + (booking.guests > 1 ? 's' : '') + ' · ' + rupees(q.total) +
      (booking.state === 'payment_claimed' ? ' · request sent' : '');
  }
}

/* ================= CLIPBOARD ================= */
function copyUpiId() {
  var done = function () {
    el.copyBtn.textContent = 'Copied ✓';
    el.copyBtn.classList.add('copied');
    setTimeout(function () {
      el.copyBtn.textContent = 'Copy';
      el.copyBtn.classList.remove('copied');
    }, 2000);
    safeTrack('upi_id_copied', {});
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(CONFIG.upiId).then(done).catch(function () { legacyCopy(done); });
  } else {
    legacyCopy(done);
  }
}
function legacyCopy(done) {
  try {
    var ta = document.createElement('textarea');
    ta.value = CONFIG.upiId;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  } catch (e) {}
}

/* ================= INIT ================= */
function initFunnel() {
  var ids = ['bookBar', 'barMain', 'barSub', 'barCta', 'resumeBanner', 'resumeSub', 'resumeCta',
    'calSheet', 'calBackdrop', 'calMonths', 'calMain', 'calSub', 'calSave', 'calClear', 'calClose',
    'datesField', 'datesValue', 'guestMinus', 'guestPlus', 'guestCount',
    'breakdown', 'bdNights', 'bdGross', 'bdDiscount', 'bdTotal',
    'waConfirmBtn', 'gotConfirmBtn', 'waAgainBtn', 'editBookingBtn', 'backToAwaitBtn',
    'payAmount', 'payAmountSub', 'upiIdText', 'upiNameText', 'copyBtn', 'upiPayBtn', 'upiFallback',
    'waPaidBtn', 'awaitDates', 'awaitGuests', 'awaitTotal', 'payDates', 'payGuests',
    'doneDates', 'doneGuests', 'doneTotal', 'newBookingBtn', 'msgHostBtn'];
  for (var i = 0; i < ids.length; i++) el[ids[i]] = $(ids[i]);

  // restore draft
  var draft = loadDraft();
  if (draft) {
    booking.state = draft.state;
    booking.checkin = draft.checkin;
    booking.checkout = draft.checkout;
    booking.guests = draft.guests;
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

  // --- review → awaiting (WhatsApp availability gate) ---
  el.waConfirmBtn.addEventListener('click', function () {
    if (!el.waConfirmBtn.getAttribute('href')) return;
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    safeTrack('wa_confirm_clicked', { total: q.total, nights: q.nights, guests: booking.guests });
    metaTrack('Lead', { content_name: 'Direct Booking', value: q.total, currency: 'INR' });
    setState('awaiting_confirmation');
    // anchor href opens WhatsApp; state is already saved before navigation
  });

  // --- awaiting step ---
  el.gotConfirmBtn.addEventListener('click', function () {
    safeTrack('confirmation_claimed', {});
    setState('payment');
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    safeTrack('payment_step_viewed', { total: q.total });
    metaTrack('AddPaymentInfo', { value: q.total, currency: 'INR' });
  });
  el.waAgainBtn.addEventListener('click', function () {
    safeTrack('wa_confirm_reopened', {});
  });
  el.editBookingBtn.addEventListener('click', function () {
    setState('review');
    openCalendar('edit-booking');
  });

  // --- payment step ---
  el.copyBtn.addEventListener('click', copyUpiId);
  var upiTimer = null;
  el.upiPayBtn.addEventListener('click', function () {
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    safeTrack('upi_link_clicked', { total: q.total });
    clearTimeout(upiTimer);
    // if no UPI handler takes over (~desktop), reveal the manual-pay hint
    upiTimer = setTimeout(function () { el.upiFallback.classList.add('show'); }, 1600);
    var cancel = function () { clearTimeout(upiTimer); };
    document.addEventListener('visibilitychange', cancel, { once: true });
    window.addEventListener('pagehide', cancel, { once: true });
  });
  el.waPaidBtn.addEventListener('click', function () {
    var q = quote(nightsBetween(booking.checkin, booking.checkout));
    safeTrack('payment_claimed', { total: q.total });
    metaTrack('Purchase', { value: q.total, currency: 'INR' }); // self-reported, unverified
    setState('payment_claimed');
  });
  el.backToAwaitBtn.addEventListener('click', function () {
    setState('awaiting_confirmation');
  });

  // --- done step ---
  el.newBookingBtn.addEventListener('click', function () {
    clearDraft();
    booking.state = 'idle';
    booking.checkin = null;
    booking.checkout = null;
    booking.guests = 2;
    lastTrackedTotal = null;
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
      waFab.classList.toggle('show', !heroVisible && !bookVisible);
    };
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
});
