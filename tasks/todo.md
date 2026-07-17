# Rewrite 4 (2026-07-17): From-scratch product redesign (prompt.md brief)

## Meta weekend campaign — implemented 2026-07-17 (code side)

### Funnel and messaging

- [x] Keep the primary booking flow simple: choose dates → review all-in price → Razorpay → verified booking confirmation. (Already the flow; unchanged.)
- [x] Remove conflicting copy about WhatsApp price/availability confirmation — fixed meta description, JSON-LD FAQ ("confirmed instantly"), terms Pricing ("total you pay at checkout applies") and Contact sections. Visible FAQ was already aligned.
- [x] Contextual WhatsApp fallback links: availability_unverified, razorpay_not_configured, network/create-order failure, payment.failed, verify-payment failure (includes payment id), and checkout dismiss. `.pay-error-wa` link inside #payError.
- [x] Prefilled fallback messages: check-in/out, nights, guests, estimated total, and utm_source/medium/campaign from `attribution_last`. New PostHog event `whatsapp_fallback_clicked` {context} on click (addition; existing names untouched).
- [x] Abandoned-booking recovery: on Razorpay dismiss a neutral note (`.pay-error.is-note`) says dates are saved → retry or WhatsApp. Dates/draft already persisted.
- [x] WhatsApp stays recovery/assistance only.

### Booking reliability

- [x] Airbnb iCal live in production — verified 2026-07-17: `/api/availability` returns real blocked ranges (synced same-day). ⚠️ Razorpay webhook events (`payment.captured`, `order.paid`) can only be confirmed in the Razorpay Dashboard — Saar to verify.
- [x] Host notification on paid booking exists (Telegram/webhook via lib/fulfill, both verify + webhook paths). ⚠️ Airbnb calendar block remains MANUAL — the notify message instructs it; needs Saar each booking.
- [ ] ⚠️ DECISION NEEDED: reservation lock/datastore (double-booking guard). Options: (a) MongoDB Atlas + `mongodb` driver — adds package.json dependency + `MONGODB_URI` env; (b) Upstash Redis REST (fetch-only, no dependency) — needs Upstash account + env vars. Say the word and I'll build either.
- [x] Degraded availability now honest: calendar sub-line says "Live availability is briefly unavailable; dates are re-verified before payment" when the feed is down (server still fails closed at order time).

### Meta Pixel + CAPI

- [x] `_fbp`/`_fbc` persist into Razorpay order notes (client → create-order → notes, ≤250 chars); webhook Purchase now sends them; verify-payment falls back to notes.
- [x] Dedup unchanged: browser+CAPI share event_id; Purchase stays `Purchase:{order_id}`.
- [x] Meta `Contact` on WhatsApp FAB + fallback-link clicks (fbq + CAPI, allowlisted in api/meta-event.js). `Lead` remains Reserve-only.
- [ ] Saar: in Meta Events Manager verify dedup, Purchase value/INR, Event Match Quality, webhook Purchase recovery (pay → close tab → wait for webhook).
- [x] Graph API bumped v20.0 → v23.0 (v20 past EOL; v23 probed live 2026-07-17).
- [ ] Saar: production envs — ⚠️ `/api/config` shows `rzp_test_…` keys in prod (live keys required before spend); confirm `META_CAPI_TOKEN`, `RAZORPAY_WEBHOOK_SECRET`. `AIRBNB_ICAL_URL` confirmed working.

### Campaign setup (Saar, in Meta Ads Manager)

- [ ] Sales objective, Website conversion location, optimize for verified `Purchase`.
- [ ] One focused campaign, Advantage+ placements, broad-enough audience to learn.
- [ ] All ads → direct booking page (never Airbnb) with UTMs on every ad (the site captures utm_* into attribution and now threads it into WhatsApp fallbacks).
- [ ] Creatives: 650 m from Banke Bihari Ji, family convenience, ₹2,249/night direct, 5.0-rated trust.
- [ ] Vertical Reels/Stories + one 4:5 feed creative from real property/temple-route/bedroom/kitchen/price visuals.
- [ ] Retargeting: 1–3 day and 7-day audiences for visitors, checkout starters, Reserve clickers, non-purchasers.

Register: brand (conversion). Rule: js/app.js untouched; every DOM/analytics/API hook preserved.

## Plan

- [x] Read repo end-to-end (index.html, css/style.css, js/app.js, api/, lib/, DESIGN.md, fonts, imagery)
- [x] PRODUCT.md via impeccable init flow
- [x] Behavior inventory (below)
- [x] Design direction locked (scene sentence, palette, type, tokens, primary action per viewport)
- [x] Fonts: Hanken Grotesk latin+latin-ext (body/UI, ₹ covered), Tiro Devanagari subset ("प्यारी कुंज")
- [x] index.html rewritten (head kept; body markup new; every hook preserved)
- [x] css/style.css rewritten from scratch (token layer, components, motion, a11y)
- [x] Browser verification (1440 / 768 / 390): console, flows, keyboard, overflow
- [x] git diff --check clean
- [x] DESIGN.md regenerated; review section added here

## Design direction

- Scene: a family on a phone at night, deciding this weekend's Banke Bihari darshan stay — they need the calm of the painted house and a two-minute path to a paid booking.
- Palette (from the house itself, not the category): cool marble off-white field (the grey-veined floors), deep rani-velvet dark surface (the cushions/rug), rani pink as the single action color, pichwai ultramarine as a quiet secondary accent, brass hairlines. No cream/saffron kit, no navy blocks, nothing Airbnb-coral.
- Type: Marcellus (inscriptional display — temple-stone calm) + Hanken Grotesk (humanist UI/body). Fraunces/Inter retired.
- Signature: the toran/mandir scallop edge where dark meets light, plus the Devanagari wordmark accent. One arch-framed photo moment (the mandir), not arch-everything.
- Booking module: full-width "booking desk" panel overlapping the hero base; horizontal on desktop, stacked on mobile; state-aware sticky bar stays the persistent CTA.

## Behavior inventory (regression checklist)

### Funnel state machine (js/app.js)
- States: idle → review → confirmed. Steps via `.funnel-step[data-step]` + `.active`; idle renders the `review` step.
- booking = { state, checkin, checkout, guests:2 }; guests 1..4; minNights 1; horizon 6 months.
- Draft: localStorage `pk_booking_draft`, v:1, TTL 48h, discarded if past/invalid/blocked (pre-confirm only). Edits after confirm → review (`funnel_downgraded_to_review`).
- Pricing: ₹2,499/night, −10%; server-authoritative via /api/create-order.

### Required element IDs (unguarded in initFunnel/initPageUi — must exist)
book, hero, bookBar, barMain, barSub, barCta, resumeBanner, resumeSub, resumeCta,
calSheet, calBackdrop, calMonths, calMain, calSub, calSave, calClear, calClose,
datesField, datesValue, guestMinus, guestPlus, guestCount,
breakdown, bdNights, bdGross, bdDiscount, bdTotal,
reserveBtn, reserveLabel, payError, confRef, doneDates, doneGuests, doneTotal,
newBookingBtn, msgHostBtn, mosaicLightbox, lbTrack (21 slides), lbCounter, lbClose, lbPrev, lbNext,
waFab, shareBtn. Guarded/optional: amenityToggle, amenityMore, readMoreBtn, aboutCopy.

### Class/data hooks
.js-photo + data-photo-index, .js-airbnb-link + data-source, .funnel-step[data-step],
state classes .active .open .show .hidden .past-book .is-disabled .collapsed .visible,
.fade-up (observer adds .visible), body.sheet-open, .cal-day(.empty/.blocked/.anchor/.in-range),
.placeholder on #datesValue, .bb-was/.bb-unit injected into #barMain via innerHTML.

### Flows to re-verify
1. Fresh load: no console errors, calendar built, `availability_loaded`.
2. Dates: open from #datesField and #barCta; blocked/past/horizon disabled; save/clear/backdrop/Escape/browser-back; pushState on open.
3. Guests: bounds 1–4, disabled states, re-render, `guests_selected`.
4. Price: breakdown .show, totals, `price_viewed` + InitiateCheckout on total change.
5. Reserve: `reserve_clicked` + Lead → POST /api/create-order → Razorpay (AddPaymentInfo) → POST /api/verify-payment → confirmed + `booking_confirmed`; errors: dates_unavailable, availability_unverified, razorpay_not_configured, network, dismiss, payment.failed.
6. Confirmed: summary rows, ref, #msgHostBtn wa.me link, new-booking reset → opens calendar; resume banner after reload; sticky bar hidden.
7. Lightbox: triggers, n/21 counter, prev/next, scroll sync, Escape + arrows.
8. Page UI: share, WhatsApp FAB visibility + tracking, airbnb links, attribution capture, .past-book desktop bar.

### Analytics (names + payloads frozen)
PostHog: airbnb_cta_clicked, availability_loaded, amenities_expanded, booking_confirmed, checkout_dismissed, dates_selected, draft_dates_unavailable, draft_restored, funnel_downgraded_to_review, funnel_opened, guests_selected, lightbox_closed, lightbox_opened, payment_failed, photo_trigger_clicked, price_viewed, reserve_clicked, resume_banner_clicked, share_clicked, sticky_bar_clicked, whatsapp_fab_clicked.
Meta browser: PageView (inline head), InitiateCheckout, Lead, AddPaymentInfo. Purchase = server-side only.

### Server contracts (unchanged)
GET /api/availability → { blocked:[{start,end}] }; POST /api/create-order → order payload or error; POST /api/verify-payment → { verified, reservation_ref, amount }.

## Review (Rewrite 4) — done 2026-07-17

**Changed:** index.html (body markup + og:image → img/og-image.webp; head/pixel/JSON-LD otherwise intact), css/style.css (full rewrite, "marble & rani velvet" system), fonts/ (+hanken-grotesk-latin[-ext].woff2, +tiro-devanagari-wordmark.woff2), PRODUCT.md (new), DESIGN.md (regenerated). js/app.js, api/, lib/, vercel.json untouched. herooo.jpeg untouched (kept as hero fallback).

**Verified (Playwright vs python http.server, Chromium 1440/768/390):**
- 30-check interactive suite all passing: hook IDs present, 21 lightbox slides, calendar open/select/save/clear/Escape/backdrop/browser-back, stepper clamps 1–4, breakdown totals (₹4,998 −₹500 → ₹4,498), reserve → /api/create-order wiring + visible error + label reset, draft restore after reload, confirmed-state simulation (resume banner, ref, wa.me link, bar hidden), new-booking reset reopens calendar, amenities toggle, desktop .past-book bar, FAB visibility, keyboard focus visible, reduced-motion honored, zero unexpected console errors, no horizontal overflow at any width.
- Analytics with third parties blocked: PostHog capture names verbatim (funnel_opened, sticky_bar_clicked, dates_selected, price_viewed, guests_selected, reserve_clicked, photo_trigger_clicked, lightbox_opened/closed, share_clicked, draft_restored); CAPI POSTs PageView/InitiateCheckout/Lead; Purchase stays server-side.
- Fixes made during verification: transform-only scroll reveals (no opacity gating), visibility pattern on closed calendar/lightbox/FAB/bar (keyboard + paint safety), desktop FAB above sticky bar, hero alt matches the regenerated bedroom hero, exterior caption corrected, mobile mosaic captions name-only on small tiles.

**Not exercised locally (environment boundary):** real Razorpay modal + /api/verify-payment against live keys, /api/availability blocked-date rendering (function needs Vercel + AIRBNB_ICAL_URL), CSP behavior (Vercel-only headers). Request/response wiring and every error path verified against stubs. Note: Razorpay modal theme in js/app.js is still saffron `#A9470B` — a one-line brand alignment to `#A61E4D` is available if desired (left untouched per "no app.js changes").

---

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
