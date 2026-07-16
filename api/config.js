// Vercel serverless — public runtime config for the static client.
// Exposes ONLY the publishable Razorpay key id + pixel id + display pricing.
// KEY_SECRET and CAPI token never appear here.
var booking = require('../lib/booking.js');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    razorpay_key_id: process.env.RAZORPAY_KEY_ID || null,
    razorpay_ready: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    pixel_id: process.env.META_PIXEL_ID || '1513936693537964',
    base_price: booking.CONFIG.basePrice,
    discount_pct: booking.CONFIG.discountPct,
    currency: 'INR'
  });
};
