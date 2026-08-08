// Supabase project config — shared by server-side lib/booking.js and
// lib/fulfill.js. The anon key is NOT a secret (Supabase's anon key is
// designed to be public; access is enforced by the RLS policies on the
// blocked_dates table, not by hiding this key) — safe to hardcode, and
// avoids needing a new Vercel env var while dashboard access is unavailable.
var SUPABASE_URL = 'https://uljcbbzmvqzrtonjantn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsamNiYnptdnF6cnRvbmphbnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzAyODgsImV4cCI6MjEwMTc0NjI4OH0.MAOHcosqYdljuG5UIXNlxBU_4TIUR3hqp7UO9bAjBt8';

function headers() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
}

module.exports = { SUPABASE_URL: SUPABASE_URL, SUPABASE_ANON_KEY: SUPABASE_ANON_KEY, headers: headers };
