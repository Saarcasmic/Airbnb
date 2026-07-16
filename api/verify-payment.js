// Vercel serverless — verifies a Razorpay payment signature for the INSTANT UI
// path. On a genuine, captured payment it fulfils (server-side CAPI Purchase +
// host notify). The webhook (api/razorpay-webhook.js) is the guaranteed backup.
// A Purchase is NEVER reported from the browser.
var crypto = require('crypto');
var meta = require('../lib/meta.js');
var fulfill = require('../lib/fulfill.js');

var KEY_ID = process.env.RAZORPAY_KEY_ID;
var KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function safeEqualHex(a, b) {
  try {
    var ba = Buffer.from(a, 'hex'), bb = Buffer.from(b, 'hex');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch (e) { return false; }
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
  if (!KEY_SECRET) { res.status(500).json({ error: 'razorpay_not_configured' }); return; }

  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  var orderId = body.razorpay_order_id, paymentId = body.razorpay_payment_id, sig = body.razorpay_signature;
  if (!orderId || !paymentId || !sig) { res.status(400).json({ error: 'missing_fields' }); return; }

  // --- signature: HMAC-SHA256(order_id|payment_id, secret) ---
  var expected = crypto.createHmac('sha256', KEY_SECRET).update(orderId + '|' + paymentId).digest('hex');
  if (!safeEqualHex(expected, sig)) { res.status(400).json({ error: 'signature_mismatch', verified: false }); return; }

  // Authoritative data from Razorpay (never trust the client for amount/status).
  var order = await rzpGet('/orders/' + encodeURIComponent(orderId));
  var payment = await rzpGet('/payments/' + encodeURIComponent(paymentId));
  var notes = (order && order.notes) || {};
  var amountPaise = (payment && payment.amount) || (order && order.amount) || 0;
  var value = Math.round(amountPaise) / 100;
  var captured = payment && (payment.status === 'captured' || payment.status === 'authorized');

  // Fulfil only when the payment is actually captured/authorized.
  if (captured) {
    await fulfill.fulfill({
      orderId: orderId, paymentId: paymentId, notes: notes, value: value,
      email: payment && payment.email, phone: payment && payment.contact,
      fbp: body.fbp, fbc: body.fbc,
      ip: meta.clientIp(req), ua: req.headers['user-agent'],
      sourceUrl: (req.headers.origin || 'https://pyari-kunj.vercel.app') + '/'
    });
  }

  res.status(200).json({
    verified: true,
    captured: !!captured,
    reservation_ref: notes.ref || orderId,
    checkin: notes.checkin || null,
    checkout: notes.checkout || null,
    guests: notes.guests ? parseInt(notes.guests, 10) : null,
    amount: value,
    payment_id: paymentId
  });
};
