# Rewrite 3 (2026-07-16): Premium + Razorpay + Meta Pixel/CAPI overhaul

**Goal:** Convert cold Meta ad traffic into real bookings this weekend, with flawless Pixel+CAPI data.

**Decisions locked (2026-07-16):**
- Payment: **Razorpay Standard Checkout** (test keys in `.env.local`; LIVE keys needed before spend).
- Remove the WhatsApp availability gate → **instant book** via Razorpay.
- Meta optimize on **Lead** first; switch to **Purchase** after ~50 verified/week.
- Build order: **Phase 1 Premium UI → Phase 2 Tracking + Funnel/Razorpay.**

## 🔴 CRITICAL (do regardless of phase)
- [ ] **Meta Pixel is dead.** `index.html:29` stub makes the loader at `:663` (`if(f.fbq)return`) bail → `fbevents.js` never loads. NO events reach Meta today. Fix loader + don't gate PageView behind `window.load`+100ms.

## Prerequisites needed from Saar
- [ ] **Meta Pixel Access Token** (Events Manager → CAPI → Generate). Server-side only.
- [ ] **Razorpay LIVE keys** after KYC (`rzp_live_…`). Test keys can't take real money.
- [ ] **Real review attribution** (guest first name/initial + month) — will NOT fabricate names.
- [ ] Refund/cancellation wording + legal host/business identity + GST status.
- [ ] Host phone/email for booking notifications.

## Phase 1 — Premium UI/UX (first) — DONE 2026-07-16
- [x] Hero performance: responsive WebP (`hero-2000.webp`/`hero-1200.webp`) from the 2.4M herooo.jpeg → **240K/108K**, ~20× faster LCP; jpeg kept as fallback.
- [x] Fixed wasted hero preloads (`index.html:24-25`) → now preload the real hero webp with fetchpriority.
- [x] Price-certainty trust line in booking breakdown ("Final all-in price — no taxes, cleaning, or service fees").
- [x] Verifiable social proof: "Read all 14 reviews on Airbnb" link (tracked) in reviews section.
- [~] Above-the-fold hero CTA — BUILT then REVERTED: floating booking card already sits over the hero + sticky bar covers mobile; a hero button collided/cluttered. Elegant call = drop it.
- [ ] DEFERRED (needs Saar): named host photo (only "S" monogram today); real review attribution (names/month).
- [ ] DEFERRED: tasteful iCal scarcity ("N nights left") — nice-to-have, holds until Phase 2 funnel work.

### Phase 1b — Premium type/buttons/theme pass (2026-07-16)
- [x] Display font **Marcellus → Fraunces** (self-hosted variable `fonts/fraunces-latin.woff2`, 68K latin subset; preload swapped). Inter kept for body.
- [x] Richer palette tokens (deeper ink `#21180F`, saffron `#A9470B`, added `--brass #B79047` decorative + `--tulsi #356447`; richer wa-green). Light-only.
- [x] Architectural buttons: 8px radius (not pill), saffron gradient + inset highlight + soft shadow, refined hover/active; WA-green gradient reserved for WhatsApp; `.book-bar-cta` matched.
- [x] Brass hairline-fade on `.orn` dividers.
- Note: Fraunces is an opinionated pick (vs Marcellus safe-default). Alternatives if Saar dislikes: Cormorant (more classic), or revert. `marcellus-latin.woff2` left on disk, unused.

## Phase 2 — Funnel + Razorpay + Tracking
### Funnel (remove WhatsApp gate → instant book)
- [ ] New flow: dates → Reserve → Razorpay modal → verify → confirmed + reservation ref/receipt.
- [ ] Rework booking steps in `index.html` + `js/app.js` (drop `awaiting_confirmation`).
- [ ] **Double-booking guard (DECISION):** no booking store today. Option: MongoDB (MCP available) to record bookings + merge into `blockedNights`; notify host on payment; mitigate iCal 30-min lag.
### Razorpay
- [ ] `api/create-order.js` (amount paise → Orders API, secret server-side).
- [ ] Frontend checkout.js modal (success/dismiss/failed handling).
- [ ] `api/verify-payment.js` (HMAC-SHA256(order_id|payment_id); 400 on mismatch).
- [ ] `npm install razorpay` (adds package.json — new dependency, confirm).
### Pixel + CAPI dual-send
- [ ] Fix Pixel loader (CRITICAL above).
- [ ] Dual-send helper: fbq `eventID` == CAPI `event_id` (UUID) dedup.
- [ ] `api/meta-event.js` (same-origin allowlist, server IP/UA, hash em/ph, `_fbp`/`_fbc`, token from env).
- [ ] Events: PageView, ViewContent, InitiateCheckout(dates), Lead(reserve), AddPaymentInfo(modal), **Purchase server-side from verify-payment only**, idempotent on order_id.
- [ ] Advanced matching from Razorpay contact (hashed); capture `fbclid`→`fbc`.
### Legal / trust (launch blockers)
- [ ] Fill cancellation/refund placeholder `terms-and-booking.html:86`.
- [ ] Add CAPI + Razorpay to `privacy-policy.html`; set PostHog `maskAllInputs:true`.
- [ ] CSP in `vercel.json` for Meta/PostHog/Razorpay/Vercel; API routes non-cacheable.

## Phase 2 — Codex-folded refinements (2026-07-16)
- Availability **fails closed** in create-order (reject if iCal unverifiable) — instant-book safety.
- Purchase **event_id = `Purchase:{order_id}`** (deterministic) so verify-payment + webhook dedup.
- Added **`api/razorpay-webhook.js`** (payment.captured) as guaranteed Purchase/notify source; verify-payment gives instant UI. Both idempotent via event_id.
- verify-payment confirms payment **status captured** before fulfilling.
- Shared **`lib/booking.js`** (dates/price/availability) + **`lib/fulfill.js`** (Purchase+notify) + **`lib/meta.js`** (CAPI).
- CSP applied to `source:"/(.*)"` (not just root); API routes `no-store`.
- Residual: no-DB → double-book still possible; copy = "payment received, host will confirm & block Airbnb"; refund fallback. (Saar accepted; declined DB.)
- Placeholder envs: RAZORPAY_KEY_ID/SECRET (current fail auth), RAZORPAY_WEBHOOK_SECRET, META_CAPI_TOKEN, HOST_NOTIFY_WEBHOOK.

## Review / Notes — Phase 2 built 2026-07-16
**Done + verified offline:**
- Endpoints: `api/create-order.js`, `api/verify-payment.js`, `api/razorpay-webhook.js`, `api/config.js`, `api/meta-event.js`; libs `lib/booking.js`, `lib/fulfill.js`, `lib/meta.js`. No SDK, no package.json.
- Funnel rewired (js/app.js + index.html): idle→review→confirmed; Razorpay checkout; dual-send tracking (event_id dedup); Purchase server-only.
- Pixel fixed (immediate init + PageView w/ shared eventID); PostHog maskAllInputs:true; CSP + API no-store in vercel.json; legal pages updated (Razorpay + CAPI disclosure; cancellation still `[placeholder]` for host).
- Unit tests PASS: price(2249/4498), date validation, HMAC accept/reject, phone/email hashing, create-order FAIL-CLOSED on unverifiable iCal, verify-payment bad-sig 400, meta-event Purchase-rejected. Client boots clean in headless (funnel renders, old steps gone).

**BLOCKED on Saar (placeholder envs) — set in Vercel + .env.local:**
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — the `rzp_test_TEEIC97YzpVbAp` pair **fails auth** (sample keys). Need real test keys, then live keys.
- `RAZORPAY_WEBHOOK_SECRET` (Dashboard→Webhooks→add {site}/api/razorpay-webhook, events payment.captured + order.paid).
- `META_CAPI_TOKEN` (Events Manager→Conversions API).
- `HOST_NOTIFY_WEBHOOK` (ntfy.sh/Telegram/Zapier URL for booking alerts).
- `AIRBNB_ICAL_URL` must be set in prod (fail-closed rejects bookings without it).
- Cancellation/refund wording + legal host identity in terms; real review names/host photo (Phase 1 deferred).

**Razorpay test instruments (for E2E once keys work):** card 4111 1111 1111 1111, CVV 123, exp 12/26 · UPI test@razorpay.

**Cannot test until keys + deploy:** live payment E2E, CSP-in-browser (only applied on Vercel), CAPI in Meta Test Events, webhook, PostHog masked replay. See Codex "Must Test Before Live Ads" list.

---

# Rewrite 2 (2026-07-15): Heritage Boutique UI + live Airbnb availability

- [x] Ground-up presentation rewrite (index.html + css/style.css): Marcellus serif + Inter, ivory/sand/ink/saffron/gold palette, cinematic full-bleed hero, floating booking card (horizontal bar ≥1024px), temple-arch image frames, editorial sections
- [x] Responsive at 390 / 768 / 1280 (phone sheet ↔ desktop modal calendar; desktop bottom bar appears only past the booking card)
- [x] Live availability: `api/availability.js` Vercel function proxies the Airbnb iCal feed (token stays server-side, 30-min edge cache); booked nights struck out + disabled; ranges can't span a booking; graceful degradation if the feed is down
- [x] Verified: 37 logic tests + 12 availability tests + 32 browser walkthrough checks + 12 blocked-UI browser checks, screenshots reviewed at all 3 viewports

**Deploy checks:** (1) `/api/availability` returns JSON on Vercel (function picked up alongside static output); (2) `/api/availability.js` must NOT be served as a raw static file (it contains the iCal token); (3) real-phone test of wa.me + upi:// hops. Launch gate unchanged: replace UPI placeholder in js/app.js CONFIG + cancellation policy in terms.

---

# Redesign: Landing page → Direct-booking funnel

Plan approved 2026-07-14. Full plan: `~/.claude/plans/rippling-launching-newell.md`

- [x] 1. Extract CSS/JS → `css/style.css` + `js/app.js`; vercel.json cache headers
- [x] 2. Remove dark patterns (friction modal, auto lead sheet, promo bubble, bloom)
- [x] 3. Booking funnel: CONFIG (₹2,499, 10% off, UPI placeholder), calendar, price breakdown, WhatsApp-confirm gate, UPI step, done state, sticky bar, localStorage draft + resume
- [x] 4. Section redesign: laurel lockup, host trust block, reviews, amenities expander, house rules, condensed SEO copy; new webp assets
- [x] 5. Analytics taxonomy + JSON-LD priceRange/makesOffer
- [x] 6. Legal pages rewrite (direct booking + UPI; cancellation placeholder)
- [x] 7. Verify end-to-end; launch gate = replace `REPLACE-BEFORE-LAUNCH@upi`

## Review (2026-07-14)

- Verified: 37 Node unit tests + 32 headless-Chrome walkthrough checks — all passing.
- Known env-only 404s locally: `/_vercel/insights` + `/_vercel/speed-insights` (exist only on Vercel).
- **Before launch:** (1) swap `upiId`/`payeeName` in `js/app.js` CONFIG; (2) fill cancellation-policy placeholder in `terms-and-booking.html`; (3) test wa.me + upi:// hops on a real Android phone.
