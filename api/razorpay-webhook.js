// Vercel serverless — Razorpay webhook (payment.captured / order.paid).
// GUARANTEED fulfilment path: fires even if the guest closes the tab after
// paying, so the Meta Purchase signal is never lost. Verifies the webhook
// signature over the RAW body, then fulfils (CAPI Purchase + host notify).
//
// Setup: Razorpay Dashboard → Webhooks → add {SITE}/api/razorpay-webhook,
// secret = RAZORPAY_WEBHOOK_SECRET, events: payment.captured, order.paid.
var crypto = require('crypto');
var meta = require('../lib/meta.js');
var fulfill = require('../lib/fulfill.js');

var KEY_ID = process.env.RAZORPAY_KEY_ID;
var KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
var WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Read the raw request body (do NOT touch req.body, so the stream stays intact
// and the signature is computed over exactly what Razorpay sent).
function readRaw(req) {
  return new Promise(function (resolve) {
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', function () { resolve(''); });
  });
}
async function rzpGet(path) {
  try {
    var auth = Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64');
    var r = await fetch('https://api.razorpay.com/v1' + path, { headers: { Authorization: 'Basic ' + auth } });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  if (!WEBHOOK_SECRET) { res.status(500).json({ error: 'webhook_not_configured' }); return; }

  var raw = await readRaw(req);
  var sig = req.headers['x-razorpay-signature'];
  var expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  var ok = false;
  try { ok = sig && crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(String(sig), 'hex')); } catch (e) { ok = false; }
  if (!ok) { res.status(400).json({ error: 'bad_signature' }); return; }

  var evt;
  try { evt = JSON.parse(raw); } catch (e) { res.status(400).json({ error: 'bad_json' }); return; }

  var event = evt.event;
  if (event !== 'payment.captured' && event !== 'order.paid') { res.status(200).json({ ignored: event }); return; }

  var payment = evt.payload && evt.payload.payment && evt.payload.payment.entity;
  if (!payment) { res.status(200).json({ ignored: 'no_payment_entity' }); return; }

  var orderId = payment.order_id;
  var order = orderId ? await rzpGet('/orders/' + encodeURIComponent(orderId)) : null;
  var notes = (order && order.notes) || payment.notes || {};

  await fulfill.fulfill({
    orderId: orderId, paymentId: payment.id, notes: notes,
    value: Math.round(payment.amount || 0) / 100,
    email: payment.email, phone: payment.contact,
    ip: meta.clientIp(req), ua: 'razorpay-webhook',
    sourceUrl: 'https://pyari-kunj.vercel.app/'
  });

  res.status(200).json({ ok: true });
};
