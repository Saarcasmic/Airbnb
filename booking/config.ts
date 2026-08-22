/* =====================================================================
   CONFIG — every business number lives here.
   !! LAUNCH GATE: replace upiId + payeeName with real values.
   Ported verbatim from js/app.js — the values are mirrored by lib/booking.js
   (basePrice/minNights/maxGuests/maxAdvanceMonths); changing one side only
   means the guest sees one price and Razorpay charges another.
   ===================================================================== */
export const CONFIG = {
  currency: 'INR',
  basePrice: 2499,          // ₹ per night — the only rate. There is no
                            // automatic discount: every reduction now comes
                            // from a coupon the guest applies (see /coupon).
  minNights: 1,
  maxGuests: 4,
  maxAdvanceMonths: 6,      // booking horizon for the calendar
  upiId: 'vrand0939@okicici',
  payeeName: 'Pyari Kunj Vrindavan',
  whatsapp: '918791567123',
  propertyName: 'Pyari Kunj Vrindavan',
  draftTtlHours: 48,
  storageKey: 'pk_booking_draft',
  // Supabase anon key — not a secret, safe in client code (see lib/supabase.js).
  supabaseUrl: 'https://uljcbbzmvqzrtonjantn.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsamNiYnptdnF6cnRvbmphbnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzAyODgsImV4cCI6MjEwMTc0NjI4OH0.MAOHcosqYdljuG5UIXNlxBU_4TIUR3hqp7UO9bAjBt8'
} as const;
