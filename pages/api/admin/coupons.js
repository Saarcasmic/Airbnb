// Vercel serverless — admin endpoint behind /coupon.
// Password-gated with the same timing-safe X-Admin-Password check as
// /api/admin/blocks (lib/adminAuth.js, ADMIN_PASSWORD env var).
// All access uses the service_role key: the coupons table has RLS on with no
// public policy, so this endpoint and lib/coupons.js are the only ways in.
import supabase from '../../../lib/supabase.js';
import auth from '../../../lib/adminAuth.js';
import coupons from '../../../lib/coupons.js';

function svcHeaders(extra) {
  return Object.assign({ 'Content-Type': 'application/json' }, extra || {}, supabase.serviceHeaders());
}

// Only one coupon may be advertised on the site at a time. The DB enforces it
// too (partial unique index on featured), so clear the old one before setting
// the new one rather than relying on the insert to sort itself out.
async function clearFeatured(exceptId) {
  var url = supabase.SUPABASE_URL + '/rest/v1/coupons?featured=is.true';
  if (exceptId) url += '&id=neq.' + encodeURIComponent(exceptId);
  return fetch(url, {
    method: 'PATCH',
    headers: svcHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ featured: false })
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!auth.checkPassword(req)) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { res.status(500).json({ error: 'server_not_configured' }); return; }

  function readBody() {
    var b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    return b || {};
  }

  try {
    if (req.method === 'GET') {
      var r = await fetch(
        supabase.SUPABASE_URL + '/rest/v1/coupons?select=*&order=created_at.desc',
        { headers: supabase.serviceHeaders() }
      );
      if (!r.ok) { res.status(502).json({ error: 'supabase_read_failed' }); return; }
      res.status(200).json(await r.json());
      return;
    }

    if (req.method === 'POST') {
      var body = readBody();
      var code = coupons.normalizeCode(body.code);
      var pct = parseInt(body.percent_off, 10);
      var label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 40) : 'Festive offer';

      if (!coupons.isValidCode(code)) { res.status(400).json({ error: 'bad_code' }); return; }
      // Capped at 99: a 100% coupon makes a ₹0 order, which Razorpay cannot
      // charge — it would fail at the payment step with a generic error
      // instead of here, where the message can actually explain itself.
      if (!(pct > 0 && pct <= 99)) { res.status(400).json({ error: 'bad_percent' }); return; }

      var wantFeatured = body.featured === true;
      if (wantFeatured) await clearFeatured(null);

      var rr = await fetch(supabase.SUPABASE_URL + '/rest/v1/coupons', {
        method: 'POST',
        headers: svcHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify({
          code: code, percent_off: pct, label: label,
          active: true, featured: wantFeatured
        })
      });
      if (rr.status === 409) { res.status(409).json({ error: 'duplicate_code' }); return; }
      if (!rr.ok) { res.status(502).json({ error: 'supabase_insert_failed' }); return; }
      var created = await rr.json();
      res.status(200).json(Array.isArray(created) ? created[0] : created);
      return;
    }

    // Toggle active (pause a code) or featured (which code the banner shows).
    if (req.method === 'PATCH') {
      var pBody = readBody();
      var id = pBody.id;
      if (!id) { res.status(400).json({ error: 'missing_id' }); return; }

      var patch = {};
      if (typeof pBody.active === 'boolean') patch.active = pBody.active;
      if (typeof pBody.featured === 'boolean') patch.featured = pBody.featured;
      if (!Object.keys(patch).length) { res.status(400).json({ error: 'nothing_to_update' }); return; }

      // A paused coupon must never keep advertising itself on the site.
      if (patch.active === false) patch.featured = false;
      if (patch.featured === true) await clearFeatured(id);

      var pr = await fetch(supabase.SUPABASE_URL + '/rest/v1/coupons?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: svcHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(patch)
      });
      if (!pr.ok) { res.status(502).json({ error: 'supabase_update_failed' }); return; }
      var updated = await pr.json();
      res.status(200).json(Array.isArray(updated) ? updated[0] : updated);
      return;
    }

    if (req.method === 'DELETE') {
      var dBody = readBody();
      var delId = dBody.id;
      if (!delId) { res.status(400).json({ error: 'missing_id' }); return; }
      var dr = await fetch(supabase.SUPABASE_URL + '/rest/v1/coupons?id=eq.' + encodeURIComponent(delId), {
        method: 'DELETE',
        headers: supabase.serviceHeaders()
      });
      if (!dr.ok) { res.status(502).json({ error: 'supabase_delete_failed' }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
