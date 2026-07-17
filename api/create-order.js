// Vercel serverless — creates a Razorpay order for a direct booking.
// No SDK: plain REST + Basic auth. Secret stays server-side (env).
// PRICE IS COMPUTED HERE from the dates — the client total is never trusted.
// Availability FAILS CLOSED: an unverifiable calendar rejects the order.
var booking = require('../lib/booking.js');

var KEY_ID = process.env.RAZORPAY_KEY_ID;
var KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  if (!KEY_ID || !KEY_SECRET) { res.status(500).json({ error: 'razorpay_not_configured' }); return; }

  try {
    var body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    var checkin = body.checkin, checkout = body.checkout;
    var guests = Math.min(Math.max(1, parseInt(body.guests, 10) || 1), booking.CONFIG.maxGuests);

    var v = booking.validateDates(checkin, checkout);
    if (v.error) { res.status(400).json({ error: v.error }); return; }

    // Hard availability guard (client checks are bypassable). Fail closed.
    var avail = await booking.checkAvailability(checkin, checkout);
    if (avail === 'blocked') { res.status(409).json({ error: 'dates_unavailable' }); return; }
    if (avail !== 'ok') { res.status(503).json({ error: 'availability_unverified' }); return; }

    var n = booking.nights(checkin, checkout);
    var q = booking.quote(n);
    if (q.amountPaise < 100) { res.status(400).json({ error: 'amount_too_low' }); return; }

    var ref = 'PK-' + checkin.replace(/-/g, '').slice(2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    var notes = { checkin: checkin, checkout: checkout, guests: String(guests), nights: String(n), ref: ref };
    // Persist Meta attribution into the order so the webhook Purchase keeps
    // fbp/fbc even when the browser closes right after payment.
    if (typeof body.fbp === 'string' && body.fbp) notes.fbp = body.fbp.slice(0, 250);
    if (typeof body.fbc === 'string' && body.fbc) notes.fbc = body.fbc.slice(0, 250);

    var order = {
      amount: q.amountPaise,
      currency: 'INR',
      receipt: ref.slice(0, 40),
      notes: notes
    };

    var auth = Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64');
    var rr = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + auth },
      body: JSON.stringify(order)
    });
    var data = await rr.json();
    if (!rr.ok || !data.id) {
      res.status(502).json({ error: 'razorpay_order_failed', detail: (data.error && data.error.description) || null });
      return;
    }

    res.status(200).json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: KEY_ID,
      reservation_ref: ref,
      nights: n,
      guests: guests,
      checkin: checkin,
      checkout: checkout,
      total: q.total
    });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
};
