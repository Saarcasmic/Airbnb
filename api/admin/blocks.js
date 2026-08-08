// Vercel serverless — admin endpoint behind /block.html.
// Password-gated: every request must carry X-Admin-Password matching the
// ADMIN_PASSWORD env var (lib/adminAuth.js, timing-safe compare).
// All Supabase access here uses the service_role key (bypasses RLS) — this
// is the only other place besides lib/fulfill.js allowed to write to
// blocked_dates; the client-facing anon key stays read-only.
var supabase = require('../../lib/supabase.js');
var auth = require('../../lib/adminAuth.js');

function isISODate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!auth.checkPassword(req)) { res.status(401).json({ error: 'unauthorized' }); return; }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { res.status(500).json({ error: 'server_not_configured' }); return; }

  try {
    if (req.method === 'GET') {
      var today = new Date().toISOString().slice(0, 10);
      var r = await fetch(
        supabase.SUPABASE_URL + '/rest/v1/blocked_dates?select=*&end_date=gte.' + today + '&order=start_date.asc',
        { headers: supabase.serviceHeaders() }
      );
      if (!r.ok) { res.status(502).json({ error: 'supabase_read_failed' }); return; }
      res.status(200).json(await r.json());
      return;
    }

    if (req.method === 'POST') {
      var body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};
      var start = body.start_date, end = body.end_date;
      if (!isISODate(start) || !isISODate(end) || !(end > start)) {
        res.status(400).json({ error: 'bad_dates' });
        return;
      }
      var rr = await fetch(supabase.SUPABASE_URL + '/rest/v1/blocked_dates', {
        method: 'POST',
        headers: Object.assign(
          { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          supabase.serviceHeaders()
        ),
        body: JSON.stringify({ start_date: start, end_date: end, source: 'manual' })
      });
      if (!rr.ok) { res.status(502).json({ error: 'supabase_insert_failed' }); return; }
      var created = await rr.json();
      res.status(200).json(Array.isArray(created) ? created[0] : created);
      return;
    }

    if (req.method === 'DELETE') {
      var delBody = req.body;
      if (typeof delBody === 'string') { try { delBody = JSON.parse(delBody); } catch (e) { delBody = {}; } }
      var id = delBody && delBody.id;
      if (!id) { res.status(400).json({ error: 'missing_id' }); return; }
      var dr = await fetch(supabase.SUPABASE_URL + '/rest/v1/blocked_dates?id=eq.' + encodeURIComponent(id), {
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
