// Vercel serverless — the public (guest-facing) coupon endpoint.
//
//   GET  /api/coupon          → the one coupon the host is advertising, for
//                               the festive banner. {} when none is featured.
//   POST /api/coupon {code}   → validate a code the guest typed in.
//
// This is deliberately the ONLY public read path into the coupons table: it
// answers about one code at a time and never lists, so an unpublished code
// cannot be discovered by reading the page or the anon key. The percentage
// returned here is for DISPLAY ONLY — api/create-order.js re-validates the
// code server-side and prices from that, so a tampered response cannot buy a
// cheaper stay.
import coupons from '../../lib/coupons.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      var f = await coupons.featured();
      res.status(200).json(f || {});
      return;
    }

    if (req.method === 'POST') {
      var body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};

      var code = coupons.normalizeCode(body.code);
      if (!coupons.isValidCode(code)) {
        res.status(200).json({ valid: false, reason: 'not_found' });
        return;
      }

      var hit = await coupons.lookup(code);
      if (hit === 'unverified') { res.status(503).json({ error: 'coupon_unverified' }); return; }
      if (!hit) { res.status(200).json({ valid: false, reason: 'not_found' }); return; }

      res.status(200).json({ valid: true, code: hit.code, percent_off: hit.percent_off, label: hit.label });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
