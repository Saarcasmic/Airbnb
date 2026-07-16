// Vercel serverless — CAPI proxy for BROWSER-originated events (non-Purchase).
// The client sends {event_name, event_id, ...} and the same event_id is also
// passed to fbq(...,{eventID}) so Meta deduplicates the browser + server copies.
// Purchase is refused here — it is only ever sent server-side from a verified,
// captured payment (verify-payment / webhook).
var meta = require('../lib/meta.js');

var ALLOWED = { PageView: 1, ViewContent: 1, InitiateCheckout: 1, Lead: 1, AddPaymentInfo: 1, Search: 1 };

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  // Same-origin guard: reject cross-site posts.
  var origin = req.headers.origin || '';
  var host = req.headers.host || '';
  if (origin && host && origin.indexOf(host) === -1) { res.status(403).json({ error: 'bad_origin' }); return; }

  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var name = body.event_name;
  if (!name || !ALLOWED[name]) { res.status(400).json({ error: 'event_not_allowed' }); return; }
  if (!body.event_id) { res.status(400).json({ error: 'missing_event_id' }); return; }

  var out = await meta.sendCapi({
    eventName: name,
    eventId: body.event_id,
    eventSourceUrl: body.event_source_url || (origin + '/'),
    actionSource: 'website',
    customData: body.custom_data || {},
    em: body.em, ph: body.ph,       // only if the client actually collected them
    fbp: body.fbp, fbc: body.fbc,
    clientIp: meta.clientIp(req), clientUa: req.headers['user-agent']
  });

  res.status(200).json({ ok: out.ok !== false, skipped: out.skipped || null });
};
