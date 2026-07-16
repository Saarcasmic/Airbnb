// Shared fulfilment used by BOTH api/verify-payment.js (instant UI path) and
// api/razorpay-webhook.js (guaranteed server path). Fires the server-side
// Meta CAPI Purchase and notifies the host with the booked dates.
//
// Idempotency: Purchase event_id is deterministic ("Purchase:" + order_id), so
// if both paths run for one payment Meta deduplicates them. Host notify may
// fire twice in that rare overlap (both paths within seconds) — acceptable
// without a durable store; the message is clearly the same reservation ref.
var meta = require('./meta.js');

var HOST_NOTIFY_WEBHOOK = process.env.HOST_NOTIFY_WEBHOOK; // ntfy.sh / Zapier / generic (POSTs plain text)
var TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;            // Telegram bot token from @BotFather
var TG_CHAT = process.env.TELEGRAM_CHAT_ID;               // your Telegram chat id

// Sends to whichever channels are configured (Telegram and/or a generic webhook).
async function notifyHost(text) {
  var sent = false;
  if (TG_TOKEN && TG_CHAT) {
    try {
      await fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text: text, disable_web_page_preview: true })
      });
      sent = true;
    } catch (e) {}
  }
  if (HOST_NOTIFY_WEBHOOK) {
    try {
      await fetch(HOST_NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8', Title: 'Pyari Kunj booking', Priority: 'high' },
        body: text
      });
      sent = true;
    } catch (e) {}
  }
  return sent ? { ok: true } : { skipped: 'no_channel' };
}

// fields: { orderId, paymentId, notes, value, email, phone, fbp, fbc, ip, ua, sourceUrl }
async function fulfill(f) {
  var notes = f.notes || {};
  var ref = notes.ref || f.orderId;

  await meta.sendCapi({
    eventName: 'Purchase',
    eventId: 'Purchase:' + f.orderId,       // deterministic → dedups verify + webhook
    eventSourceUrl: f.sourceUrl || 'https://pyari-kunj.vercel.app/',
    actionSource: 'website',
    customData: { currency: 'INR', value: f.value, content_name: 'Direct Booking', order_id: f.orderId, num_items: 1 },
    em: f.email, ph: f.phone, fbp: f.fbp, fbc: f.fbc,
    clientIp: f.ip, clientUa: f.ua
  });

  var msg = 'NEW BOOKING ' + ref + '\n' +
    'Dates: ' + (notes.checkin || '?') + ' to ' + (notes.checkout || '?') + ' (' + (notes.nights || '?') + ' nights)\n' +
    'Guests: ' + (notes.guests || '?') + '\n' +
    'Paid: Rs ' + f.value + '\n' +
    'Guest: ' + (f.phone || '?') + (f.email ? ' / ' + f.email : '') + '\n' +
    'Payment: ' + f.paymentId + '\n' +
    '>> Block these dates on your Airbnb calendar now.';
  await notifyHost(msg);

  return { ref: ref };
}

module.exports = { fulfill: fulfill, notifyHost: notifyHost };
