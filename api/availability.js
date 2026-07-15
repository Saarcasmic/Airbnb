// Vercel serverless function — proxies the Airbnb iCal availability feed.
// The feed URL (with its private token) lives in the AIRBNB_ICAL_URL env var,
// never in this public repo; the client only ever sees blocked date ranges.
// Cached at the edge for 30 min (stale-while-revalidate 24 h).
var ICAL_URL = process.env.AIRBNB_ICAL_URL;

// Airbnb events use all-day dates: DTSTART;VALUE=DATE:YYYYMMDD with an
// EXCLUSIVE DTEND (the checkout morning). We pass ranges through as-is.
function parseIcs(text) {
  var blocked = [];
  var events = text.split('BEGIN:VEVENT').slice(1);
  for (var i = 0; i < events.length; i++) {
    var s = /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/.exec(events[i]);
    var e = /DTEND;VALUE=DATE:(\d{4})(\d{2})(\d{2})/.exec(events[i]);
    if (!s || !e) continue;
    blocked.push({
      start: s[1] + '-' + s[2] + '-' + s[3],
      end: e[1] + '-' + e[2] + '-' + e[3]
    });
  }
  return blocked;
}

module.exports = async function handler(req, res) {
  try {
    if (!ICAL_URL) throw new Error('missing_AIRBNB_ICAL_URL');
    var r = await fetch(ICAL_URL, { headers: { 'User-Agent': 'PyariKunj-Site/1.0' } });
    if (!r.ok) throw new Error('upstream_' + r.status);
    var text = await r.text();
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ blocked: parseIcs(text), syncedAt: new Date().toISOString() });
  } catch (err) {
    // Degrade gracefully: empty list keeps the funnel working — the WhatsApp
    // confirmation step remains the real availability gate.
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json({ blocked: [], degraded: true });
  }
};
module.exports.parseIcs = parseIcs;
