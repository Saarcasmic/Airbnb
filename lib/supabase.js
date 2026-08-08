// Supabase project config — shared by server-side lib/booking.js and
// lib/fulfill.js. The anon key is NOT a secret (Supabase's anon key is
// designed to be public; read access is enforced by RLS, not by hiding this
// key) — safe to hardcode. It can no longer write: the public insert policy
// on blocked_dates has been dropped. Writes now require the service_role
// key, which IS a secret and lives only in the SUPABASE_SERVICE_ROLE_KEY
// Vercel env var — never hardcoded, never logged.
var SUPABASE_URL = 'https://uljcbbzmvqzrtonjantn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsamNiYnptdnF6cnRvbmphbnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzAyODgsImV4cCI6MjEwMTc0NjI4OH0.MAOHcosqYdljuG5UIXNlxBU_4TIUR3hqp7UO9bAjBt8';

// Read-only. Used for checkAvailability() and the client-side calendar.
function headers() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
}

// Privileged — bypasses RLS. Used ONLY server-side, ONLY to insert a
// blocked-date row right after a payment is captured (lib/fulfill.js).
function serviceHeaders() {
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: 'Bearer ' + key };
}

module.exports = {
  SUPABASE_URL: SUPABASE_URL,
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  headers: headers,
  serviceHeaders: serviceHeaders
};
