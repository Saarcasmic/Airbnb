// Shared Meta Conversions API (CAPI) helper. Best-effort: never throws.
// Token + pixel id come from env; nothing here is exposed to the client.
var crypto = require('crypto');

var PIXEL_ID = process.env.META_PIXEL_ID || '1513936693537964';
var CAPI_TOKEN = process.env.META_CAPI_TOKEN;
var API_VERSION = 'v23.0'; // Graph versions retire ~2 years after release; v20.0 (May 2024) is past end-of-life

function sha256(v) { return crypto.createHash('sha256').update(v).digest('hex'); }

function hashEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return sha256(email.trim().toLowerCase());
}

// Meta wants phone as digits only, country code included, no '+'.
function hashPhone(phone) {
  if (!phone) return null;
  var d = String(phone).replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.length === 10) d = '91' + d;            // bare Indian number → add country code
  return sha256(d);
}

// events: array of { eventName, eventId, eventSourceUrl, actionSource, customData, em, ph, fbp, fbc, clientIp, clientUa }
async function sendCapi(events) {
  if (!CAPI_TOKEN) return { ok: false, skipped: 'no_token' };
  var now = Math.floor(Date.now() / 1000);
  var data = (Array.isArray(events) ? events : [events]).map(function (e) {
    var user = {};
    if (e.em) user.em = [hashEmail(e.em)].filter(Boolean);
    if (e.ph) { var p = hashPhone(e.ph); if (p) user.ph = [p]; }
    if (e.fbp) user.fbp = e.fbp;
    if (e.fbc) user.fbc = e.fbc;
    if (e.clientIp) user.client_ip_address = e.clientIp;
    if (e.clientUa) user.client_user_agent = e.clientUa;
    return {
      event_name: e.eventName,
      event_time: e.eventTime || now,
      event_id: e.eventId,
      action_source: e.actionSource || 'website',
      event_source_url: e.eventSourceUrl,
      user_data: user,
      custom_data: e.customData || {}
    };
  });

  try {
    var url = 'https://graph.facebook.com/' + API_VERSION + '/' + PIXEL_ID + '/events?access_token=' + encodeURIComponent(CAPI_TOKEN);
    var payload = { data: data };
    // While testing: set META_TEST_EVENT_CODE (from Events Manager → Test Events)
    // so server events appear live in the Test Events tab. Unset it before ads.
    if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;
    var r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var body = await r.json().catch(function () { return null; });
    if (!r.ok) console.error('CAPI rejected', r.status, JSON.stringify(body).slice(0, 500));
    return { ok: r.ok, status: r.status, body: body };
  } catch (err) {
    console.error('CAPI fetch failed', err && err.message);
    return { ok: false, error: 'capi_fetch_failed' };
  }
}

function clientIp(req) {
  var xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress;
}

module.exports = { sha256: sha256, hashEmail: hashEmail, hashPhone: hashPhone, sendCapi: sendCapi, clientIp: clientIp, PIXEL_ID: PIXEL_ID };
