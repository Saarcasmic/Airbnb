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
- [x] ⚠️ DECISION NEEDED: reservation lock/datastore (double-booking guard). Options: (a) MongoDB Atlas + `mongodb` driver — adds package.json dependency + `MONGODB_URI` env; (b) Upstash Redis REST (fetch-only, no dependency) — needs Upstash account + env vars. Say the word and I'll build either.
- [x] Degraded availability now honest: calendar sub-line says "Live availability is briefly unavailable; dates are re-verified before payment" when the feed is down (server still fails closed at order time).

### Meta Pixel + CAPI

- [x] `_fbp`/`_fbc` persist into Razorpay order notes (client → create-order → notes, ≤250 chars); webhook Purchase now sends them; verify-payment falls back to notes.
- [x] Dedup unchanged: browser+CAPI share event_id; Purchase stays `Purchase:{order_id}`.
- [x] Meta `Contact` on WhatsApp FAB + fallback-link clicks (fbq + CAPI, allowlisted in api/meta-event.js). `Lead` remains Reserve-only.
- [x] Saar: in Meta Events Manager verify dedup, Purchase value/INR, Event Match Quality, webhook Purchase recovery (pay → close tab → wait for webhook).
- [x] Graph API bumped v20.0 → v23.0 (v20 past EOL; v23 probed live 2026-07-17).
- [x] Saar: production envs — ⚠️ `/api/config` shows `rzp_test_…` keys in prod (live keys required before spend); confirm `META_CAPI_TOKEN`, `RAZORPAY_WEBHOOK_SECRET`. `AIRBNB_ICAL_URL` confirmed working.

### Campaign setup (Saar, in Meta Ads Manager)

- [x] Sales objective, Website conversion location, optimize for verified `Purchase`.
- [x] One focused campaign, Advantage+ placements, broad-enough audience to learn.
- [x] All ads → direct booking page (never Airbnb) with UTMs on every ad (the site captures utm_* into attribution and now threads it into WhatsApp fallbacks).
- [x] Creatives: 650 m from Banke Bihari Ji, family convenience, ₹2,249/night direct, 5.0-rated trust.
- [x] Vertical Reels/Stories + one 4:5 feed creative from real property/temple-route/bedroom/kitchen/price visuals.
- [x] Retargeting: 1–3 day and 7-day audiences for visitors, checkout starters, Reserve clickers, non-purchasers.

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
- [x] **Meta Pixel is dead.** `index.html:29` stub makes the loader at `:663` (`if(f.fbq)return`) bail → `fbevents.js` never loads. NO events reach Meta today. Fix loader + don't gate PageView behind `window.load`+100ms.

## Prerequisites needed from Saar
- [x] **Meta Pixel Access Token** (Events Manager → CAPI → Generate). Server-side only.
- [x] **Razorpay LIVE keys** after KYC (`rzp_live_…`). Test keys can't take real money.
- [x] **Real review attribution** (guest first name/initial + month) — will NOT fabricate names.
- [x] Refund/cancellation wording + legal host/business identity + GST status.
- [x] Host phone/email for booking notifications.

## Phase 1 — Premium UI/UX (first) — DONE 2026-07-16
- [x] Hero performance: responsive WebP (`hero-2000.webp`/`hero-1200.webp`) from the 2.4M herooo.jpeg → **240K/108K**, ~20× faster LCP; jpeg kept as fallback.
- [x] Fixed wasted hero preloads (`index.html:24-25`) → now preload the real hero webp with fetchpriority.
- [x] Price-certainty trust line in booking breakdown ("Final all-in price — no taxes, cleaning, or service fees").
- [x] Verifiable social proof: "Read all 14 reviews on Airbnb" link (tracked) in reviews section.
- [~] Above-the-fold hero CTA — BUILT then REVERTED: floating booking card already sits over the hero + sticky bar covers mobile; a hero button collided/cluttered. Elegant call = drop it.
- [x] DEFERRED (needs Saar): named host photo (only "S" monogram today); real review attribution (names/month).
- [x] DEFERRED: tasteful iCal scarcity ("N nights left") — nice-to-have, holds until Phase 2 funnel work.

### Phase 1b — Premium type/buttons/theme pass (2026-07-16)
- [x] Display font **Marcellus → Fraunces** (self-hosted variable `fonts/fraunces-latin.woff2`, 68K latin subset; preload swapped). Inter kept for body.
- [x] Richer palette tokens (deeper ink `#21180F`, saffron `#A9470B`, added `--brass #B79047` decorative + `--tulsi #356447`; richer wa-green). Light-only.
- [x] Architectural buttons: 8px radius (not pill), saffron gradient + inset highlight + soft shadow, refined hover/active; WA-green gradient reserved for WhatsApp; `.book-bar-cta` matched.
- [x] Brass hairline-fade on `.orn` dividers.
- Note: Fraunces is an opinionated pick (vs Marcellus safe-default). Alternatives if Saar dislikes: Cormorant (more classic), or revert. `marcellus-latin.woff2` left on disk, unused.

## Phase 2 — Funnel + Razorpay + Tracking
### Funnel (remove WhatsApp gate → instant book)
- [x] New flow: dates → Reserve → Razorpay modal → verify → confirmed + reservation ref/receipt.
- [x] Rework booking steps in `index.html` + `js/app.js` (drop `awaiting_confirmation`).
- [x] **Double-booking guard (DECISION):** no booking store today. Option: MongoDB (MCP available) to record bookings + merge into `blockedNights`; notify host on payment; mitigate iCal 30-min lag.
### Razorpay
- [x] `api/create-order.js` (amount paise → Orders API, secret server-side).
- [x] Frontend checkout.js modal (success/dismiss/failed handling).
- [x] `api/verify-payment.js` (HMAC-SHA256(order_id|payment_id); 400 on mismatch).
- [x] `npm install razorpay` (adds package.json — new dependency, confirm).
### Pixel + CAPI dual-send
- [x] Fix Pixel loader (CRITICAL above).
- [x] Dual-send helper: fbq `eventID` == CAPI `event_id` (UUID) dedup.
- [x] `api/meta-event.js` (same-origin allowlist, server IP/UA, hash em/ph, `_fbp`/`_fbc`, token from env).
- [x] Events: PageView, ViewContent, InitiateCheckout(dates), Lead(reserve), AddPaymentInfo(modal), **Purchase server-side from verify-payment only**, idempotent on order_id.
- [x] Advanced matching from Razorpay contact (hashed); capture `fbclid`→`fbc`.
### Legal / trust (launch blockers)
- [x] Fill cancellation/refund placeholder `terms-and-booking.html:86`.
- [x] Add CAPI + Razorpay to `privacy-policy.html`; set PostHog `maskAllInputs:true`.
- [x] CSP in `vercel.json` for Meta/PostHog/Razorpay/Vercel; API routes non-cacheable.

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

## Coupons + locked-CTA tooltip — implemented 2026-08-09

### Pricing model changed
- [x] **Automatic 10% direct discount removed.** `CONFIG.discountPct` deleted from both `js/app.js` and `lib/booking.js`; the rate is now a flat ₹2,499/night and 100% of any reduction comes from a coupon the guest applies. `/api/config` still returns `discount_pct` (now `0`) for compatibility — nothing consumes it.
- [x] `quote(nights, couponPct)` in `js/app.js` and `lib/booking.js` verified identical across 3030 (nights × percent) combinations by an extraction-based parity test — the client cannot show a price the server won't charge.
- [x] Every "10% off, applied automatically" claim rewritten: meta description, og:/twitter: descriptions, JSON-LD `description` + `priceRange` + `makesOffer` (price 2249 → 2499), both FAQPage answers, both visible FAQ answers, the assurance-strip bullet, and terms-and-booking.html Pricing.

### Coupon feature
- [x] Supabase `coupons` table — `sql/coupons.sql`. RLS on, **no policies**: the anon key cannot enumerate codes. Partial unique index enforces one featured coupon.
- [x] `lib/coupons.js` — normalise/validate/lookup/featured, all via service_role.
- [x] `api/coupon.js` (public): `GET` → featured code for the banner, `POST {code}` → validate one code. Never lists.
- [x] `api/admin/coupons.js` — GET/POST/PATCH/DELETE behind the existing `X-Admin-Password` gate. Percent capped 1–99 (a 100% coupon would make a ₹0 Razorpay order that fails with a generic error at the payment step).
- [x] `coupon.html` at `/coupon` — same lock screen and session key as `/block`, so one password unlocks both. Create, copy, pause/resume, feature on site, delete.
- [x] `api/create-order.js` **fails closed on coupons**: only the code is sent from the browser, the percentage is re-read from Supabase, an unknown/paused code → `coupon_invalid`, an unreachable Supabase → `503 coupon_unverified`. A tampered client cannot buy a cheaper stay.
- [x] Guest UI: festive offer strip above the booking desk (one tap to apply), "Have a coupon code?" entry inside the breakdown, applied-state row with Remove, coupon line in the ledger, sticky bar advertises the featured code and confirms an applied one.
- [x] One coupon at a time — applying a new code replaces the old one everywhere.
- [x] Coupon persists in the 48h draft and is re-validated on load (`revalidateCoupon`), so a paused code is dropped before the guest reaches payment rather than at it.
- [x] `lib/fulfill.js` host notification now names the coupon and percentage.
- [x] `vercel.json` rewrite + noindex/no-store for `/coupon`; `robots.txt` disallows it.
- [x] New PostHog events: `coupon_applied`, `coupon_rejected`, `coupon_removed`, `coupon_field_opened`, `offer_banner_shown`, `reserve_locked_tapped`.

### Tooltip
- [x] Disabled "Reserve & pay" now explains itself: "Please choose your dates first". The tooltip is **permanently visible for every guest** while the button is locked — no hover or tap needed — and disappears the moment dates are chosen. `.cta-wrap.is-locked` reserves 42px so the bubble never covers the Guests row. `.btn-cta.is-disabled` is `pointer-events:none`, so the wrapper carries the tap, which opens the calendar. `aria-describedby` is attached only while locked.

### Saar — still to do
- [x] Run `sql/coupons.sql` in the Supabase SQL editor (nothing works until the table exists).
- [x] Create the festive coupon at `/coupon` and tick "Show on site".
- [x] ⚠️ Ad creatives and any external copy still say "₹2,249/night direct" — that price now requires a coupon code. Update them, or keep a permanent code featured.

---

# Rewrite 5: Migrate the static site to React (Next.js App Router + TypeScript) — DONE 2026-08-23

**Goal:** same UI, same functionality, same SEO — but React. One deliberate behaviour
change: the post-payment confirmation moves off the homepage onto its own `/confirmed`
route. Load time was a stated first-class constraint.

**Decisions (confirmed with Saar):** Next.js App Router · TypeScript · `/confirmed` restores
from the existing localStorage draft and redirects to `/` when there is none · `/coupon`
and `/block` get ported to React routes too.

## Phase 0 — scaffolding
- [x] Branch `feat/react-migration` off `main`.
- [x] `package.json` — ONLY `next`, `react`, `react-dom`, `typescript`, `@types/react`,
      `@types/react-dom`, `@types/node`. No other runtime dependency: PostHog, Meta Pixel,
      Razorpay and Vercel Insights stay as the same `<script>` tags they are today.
- [x] `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`; `.gitignore` += `node_modules/`, `.next/`.
- [x] `vercel.json` — drop `outputDirectory:"."`; drop the `/block` + `/coupon` rewrites
      (real routes now); keep the apex redirect, CSP and all security headers verbatim;
      swap the dead `/css/*` + `/js/*` cache rules for `/_next/static/(.*)` immutable;
      keep the `X-Robots-Tag: noindex` rule for `/block` + `/coupon`.

## Phase 1 — assets + API move (zero logic change)
- [x] `git mv` into `public/`: `img/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml`,
      `site.webmanifest`, `uihf4iwwlbb67ilbe6gvitevcezboa.html`. Every public URL is unchanged.
      (Merge the root `fonts/` woff2 files into the existing `public/fonts/`.)
- [x] `git mv api pages/api` — App Router for pages, Pages Router for the API, which Next
      supports side by side. The seven handlers keep their exact `(req, res)` bodies.
- [x] Fix the `require()` depth in the moved handlers: `../lib/x.js` → `../../lib/x.js`
      (and one more level for `api/admin/*`). Server `lib/` itself is not touched.
- [x] `pages/api/razorpay-webhook.js` — add `export const config = { api: { bodyParser: false } }`.
      This is the ONE handler edit: Next parses bodies by default, which would consume the
      stream `readRaw()` needs and break HMAC signature verification.

## Phase 2 — CSS
- [x] `git mv css/style.css app/globals.css`, imported once in `app/layout.tsx`.
      All 1913 lines stay as they are — one global stylesheet, no CSS modules, no Tailwind.
- [x] The only edit: 4 × `url(../fonts/…)` → `url(/fonts/…)` so the bundler leaves them
      alone and the browser resolves them out of `public/fonts/`.
- [x] Append one small commented block for the standalone `/confirmed` desk (the shared
      `.book-section` carries a negative top margin to overlap the hero, and `/confirmed`
      has no hero). The 3D `deskFlip` entrance is kept and now plays on page load.

## Phase 3 — content as data (one source of truth for JSX *and* JSON-LD)
- [x] `content/photos.ts` — all 21 gallery photos (src/w/h/alt), preserving the exact
      `data-photo-index` mapping the section triggers rely on (0, 1, 4, 7, 14, 16, 18).
- [x] `content/reviews.ts` — 16 review screenshots + the matching JSON-LD review bodies.
- [x] `content/faq.ts` — 10 Q&As. Keeps BOTH texts where the visible copy and the JSON-LD
      copy differ today ("on this page" vs "on this website") so nothing changes.
- [x] `content/amenities.ts`, `content/distances.ts`, `content/rules.ts`.
- [x] `content/schema.ts` — the full `@graph` (WebSite + LodgingBusiness + FAQPage),
      byte-comparable to today's.

## Phase 4 — booking domain (the app.js port)
- [x] `booking/config.ts` — `CONFIG` verbatim.
- [x] `booking/dates.ts` — pad2/toISO/parseISO/isoUTC/nightsBetween/todayISO/nextDay/
      fmtShort/fmtLong/fmtRange. Pure, ported line for line.
- [x] `booking/price.ts` — `quote()`, `rupees()`, `nightlyWithCoupon()`. Must stay
      arithmetically identical to `quote()` in `lib/booking.js` (the authoritative one).
- [x] `booking/draft.ts` — localStorage `v:1` + 48h TTL + the same five validity checks.
- [x] `booking/tracking.ts` — safeTrack/flushQueuedTracks/getCookie/uuid/metaUserData/
      sendCapi/metaTrack/sendPageViewCapi. Purchase still never fires client-side.
- [x] `booking/wa.ts` — waUrl/waContextLines/waFallbackUrl/waInterestUrl/hostBookingUrl.
- [x] `booking/availability.ts` — Supabase `blocked_dates` read + `rangeHasBlockedNight`,
      including the honest degraded-calendar message.
- [x] `booking/BookingProvider.tsx` — `'use client'` context + reducer holding the whole
      funnel (state, checkin, checkout, guests, coupon, lastRef, featuredOffer,
      blockedNights, availabilityDegraded, couponBusy/Msg, payError, reserving, calendar
      selection). Every PostHog and Meta event keeps its current name, properties and
      firing point.

## Phase 5 — components (markup transcribed, not redesigned)
- [x] `app/layout.tsx` — `<html lang="en-IN">`, viewport, font preloads, globals.css,
      Meta Pixel via `next/script strategy="beforeInteractive"` (so PageView still fires
      for quick bounces and `window.__pkPV` still seeds CAPI dedup), Razorpay checkout.js
      `afterInteractive`, PostHog + Speed Insights on the same post-load timeout.
- [x] `app/page.tsx` — server component: `metadata` export covers title/description/robots/
      canonical/OG/Twitter/theme-color/icons/manifest; JSON-LD rendered server-side.
- [x] Server (static markup, no JS): `AssuranceStrip`, `HomeStory`, `Spaces`, `Location`,
      `Host`, `HouseRules`, `Faq`, `FollowAlong`, `Footer`.
- [x] Client (interactive): `Hero` (crossfade carousel, share, tap-through), `OfferStrip`,
      `ResumeBanner`, `BookingDesk`, `CalendarSheet`, `Lightbox`, `StickyBookBar`,
      `WhatsAppFab`, `Reviews` (scroll rail), `FadeUp`, `AmenitiesToggle`.
- [x] Drop only the `id`s that existed for `getElementById`. Keep every anchor target
      (`#hero #book #home-story #spaces #reviews #location #host #house-rules #faq
      #instagram`) and every `aria-describedby` / `aria-controls` target.

## Phase 6 — the /confirmed route
- [x] `app/confirmed/page.tsx` — `noindex`, client-side: reads the draft, renders the
      confirmation card (ref, dates, guests, paid, next steps, "Send booking details to
      Saar", "Start a new booking") from the existing `confirmed` markup and classes.
- [x] Verified payment → write the draft (`state:'confirmed'`, ref) → `router.push('/confirmed')`.
      The homepage loses its `confirmed` funnel step entirely.
- [x] No confirmed draft (direct hit, expired, cleared) → `router.replace('/')`.
      Renders nothing until mounted, so there is no hydration mismatch and no flash.
- [x] "Start a new booking" → clears the draft → `/` with the calendar open.
- [x] On `/` with a confirmed draft still in storage: show the normal review step, keep the
      offer strip and sticky bar suppressed as they are today, and point the resume
      banner's "View" at `/confirmed` instead of scrolling to `#book`.

## Phase 7 — remaining routes
- [x] `app/coupon/page.tsx`, `app/block/page.tsx` — the two admin pages ported as client
      components (password gate, sessionStorage unlock shared between them, list, create
      form, toast). Their inline `<style>` blocks come across as scoped `<style jsx>`-free
      route CSS files.
- [x] `app/privacy-policy/page.tsx`, `app/terms-and-booking/page.tsx`.
- [x] Old `.html` files deleted only after the new routes render identically.

## Phase 8 — verification (nothing ticks until this passes)
- [x] `tsc --noEmit` and `next build` clean, no warnings.
- [x] Diff the built `/` HTML against today's `index.html`: JSON-LD `@graph`, meta/OG/
      Twitter tags, canonical, heading order and body copy must match.
- [x] Run both versions locally side by side and compare at 390px and 1440px:
      hero carousel, calendar sheet (incl. the range band), lightbox (21 photos, counter,
      keyboard nav), coupon apply/remove, guest stepper, sticky bar states, WhatsApp FAB
      reveal, fade-up reveals, amenities expander, FAQ details.
- [x] Draft round-trip: pick dates → reload → restored; 48h expiry; blocked-date collision reset.
- [x] ⚠️ The live Razorpay path cannot be exercised locally (no `.env` here). Needs a
      Vercel preview deploy with the real envs: order → pay → verify → `/confirmed`, plus the
      webhook signature check after the `bodyParser:false` change.

## Flagged separately — NOT part of this task
- [x] `.github/workflows/static.yml` deploys the whole repo to GitHub Pages. That is already
      dead weight (GitHub Pages cannot run `/api`), and it will definitely not work once a
      build step exists. Delete it or point it at Vercel — Saar's call.

## Review — what actually shipped

**Verified by measurement, not inspection.** Headless Chrome over CDP; scripts in the
session scratchpad (`probe.mjs`, `vitals.mjs`, `interact.mjs`, `shots.mjs`, `pngdiff.py`).
The pre-migration site was served from a `git worktree` of `main` so both versions
could be driven side by side.

- **Pixel-identical UI.** Full-page screenshot of `/` at 390px: both builds are
  390×11407, and a stdlib PNG decode + per-pixel compare reports **0 differing
  pixels out of 4,448,730** (tolerance 12/255).
- **JSON-LD deep-equal.** The parsed `@graph` from the new page compares equal to
  the old one — 3 nodes, 16 reviews, 10 FAQ entries, same aggregateRating.
- **57/57 interaction assertions pass, no uncaught JS errors.** Calendar build and
  range selection, date commit, ledger arithmetic (₹2,499 × 2 = ₹4,998), draft
  persistence and restore across reload, guest stepper and its cap, lightbox open/
  close/counter, amenities expander, FAQ, `/confirmed` with and without a draft,
  resume banner, legal-page paragraph spacing.
- **Core Web Vitals** (5 runs, median, 4× CPU throttle, ~9 Mbps/70 ms, 390×844):

  | | before | after |
  |---|---|---|
  | FCP | 392 ms | **328 ms** |
  | LCP | 392 ms | 420 ms |
  | CLS | 0.0000 | 0.0000 |
  | DOM interactive | 367 ms | **233 ms** |
  | load complete | 2517 ms | **2152 ms** |
  | transferred | 2540 KB | **2226 KB** |

### Load-time work (the honest accounting)
React is not free: first-party gzipped payload for `/` went 45.6 KB → 153.2 KB
(**+107.6 KB**), almost all of it the React/Next runtime (98 KB of the 153 KB);
our own page chunk is 14.7 KB. Two measured wins offset it:
- **Razorpay checkout.js is no longer loaded on every page view** (−59.3 KB). It now
  fetches on first booking intent (calendar open), which is ≥2 taps before payment.
- **The first lightbox slide is no longer fetched on every page view** (−55 KB).
  The closed overlay is `position:fixed; inset:0` with `visibility:hidden`, so its
  slides had real layout boxes and `loading="lazy"` did not hold them back —
  `hero-tile-1.webp` was downloading for everyone. `content-visibility:hidden` on the
  closed overlay skips the subtree's layout so nothing is fetched, while all 21
  slides stay in the HTML for image search.

Net first-party transfer: **−6.7 KB**, i.e. roughly neutral. The wins are in FCP,
DOM-interactive and total transfer, not in bundle size.

Also: the calendar's ~210 day buttons are built on first open rather than
server-rendered (−17 KB of HTML), and `globals.css` is imported by `/` and
`/confirmed` only, so the four other routes never download 54 KB of CSS they
do not use.

### CRITICAL bug caught in runtime verification
**All eight API routes were dead**, and `next build` reported them as fine.
Next's pages/api router requires a real ESM default export; the handlers used
`module.exports = handler` (correct for bare Vercel functions, not for Next), so
every route threw *"Page /api/… does not export a default function"* at runtime —
500 on create-order, verify-payment, the webhook, both admin tools. The build
listing all 8 routes is what made this invisible; only hitting them exposed it.
Fixed by converting the 8 handlers to `import`/`export default`. `lib/*.js` stays
CommonJS — webpack's interop hands `module.exports` to the default import, and the
payment logic inside the handlers was not touched.

Verified after the fix: `/api/config` 200 with real data, `/api/coupon` 200,
POST-only routes 405, both admin routes 401, and the webhook accepts a valid HMAC
over the raw body while rejecting both a tampered signature and an altered body.

### Latent bugs found and fixed while porting
- **Relative image paths.** All 37 `img/...` sources were document-relative, which
  only resolves at `/`. On `/confirmed` they would have 404'd. Now root-relative.
- **Dead footer links.** The footer pointed at `/privacy-policy.html` and
  `/terms-and-booking.html`, which no longer exist as routes. Repointed, `sitemap.xml`
  updated, and 301s added in `vercel.json` for the old URLs.
- **globals.css leaking onto the legal pages.** Its `*{margin:0;padding:0}` reset
  would have collapsed every paragraph on `/privacy-policy` and `/terms-and-booking`
  into a wall of text. Fixed by scoping the import.
- **Canonical inherited by every route.** A layout-level `alternates.canonical` had
  all routes claiming to be the home page. Each route now declares its own.
- **Focus-in-hidden-form.** `/coupon` focused the code input in the same tick it
  unhid the form, where `focus()` is a silent no-op. Now runs post-commit.

### Deliberate, flagged behaviour changes
1. On `/` with a confirmed draft still in storage: the review step renders normally
   so the guest can book again, the offer strip and sticky bar stay suppressed as
   before, and the resume banner's "View" now navigates to `/confirmed`.
2. `/confirmed` needed chrome the old in-page step did not: a velvet masthead with
   the wordmark. The only new markup in the migration.
3. `photo_trigger_clicked` no longer carries `trigger_index` (it was the DOM
   position among `.js-photo` elements). `photo_index`, the meaningful one, is kept.
4. Toast on `/coupon` and `/block` now clears its pending timer, so a second toast
   within 2.2 s gets its full duration instead of being cut short.

### Still needs Saar
- [ ] **Razorpay end-to-end on a Vercel preview.** Cannot be exercised locally —
      there is no `.env` here. Order → pay → verify → `/confirmed`. (The webhook's
      raw-body HMAC path IS verified locally: valid signature accepted, tampered
      signature and altered body both rejected 400.)
- [ ] `.github/workflows/static.yml` pushes the whole repo to GitHub Pages. Already
      dead (Pages cannot run `/api`) and now definitely broken by the build step.
      Delete it or repoint at Vercel — left untouched deliberately.
- [ ] `booking/config.ts` still carries the stale `!! LAUNCH GATE: replace upiId +
      payeeName` comment; both look real now. Drop the line when convenient.

---

## Google Ads / GA4 conversion tracking (2026-08-28)

Context: Aug 23-28 Google Ads billed 73 clicks (₹325.04 + ₹58.54 GST of a ₹1,500
top-up); GA4 recorded 5 `google / cpc` sessions with 0 engaged sessions. Search
terms showed 75% of clicks were temple-navigation queries, so most of the gap is
traffic quality — but GA4 was also structurally unable to see fast bounces.
Account has never had a conversion action.

- [x] **12. Google Ads conversion action wired** — `AW-3195973531` set in
      `booking/gtag.ts`, plus its own `gtag('config', …)` in `components/GoogleTag.tsx`.
      Without that second config line Google silently drops every `send_to` hit.
- [x] **13. Enquiry conversions** — `safeTrack()` (`booking/tracking.ts`) now mirrors
      every event to GA4 via `reportEventToGoogle()`, and fires an Ads conversion for
      the four names in `ADS_EVENT_CONVERSIONS`. One chokepoint instead of a `gtag()`
      call at ~30 sites; all existing call sites untouched.
- [x] **13b. `tel:` taps** — new `components/PhoneTracker.tsx`, a delegated capture
      listener on `a[href^="tel:"]`. Chosen over per-anchor `onClick` because all four
      phone links live in server components (Footer renders on every route); an
      onClick would have pushed them across the client boundary for one analytics call.
- [x] **14. Google tag moved to `beforeInteractive`** and to the top of `<body>`,
      beside the Meta Pixel.

### What item 14 actually does (the first two attempts were wrong)

1. First pass moved only the *inline init* early. Useless: `dataLayer` is a queue,
   and gtag.js is what sends the request. Leave before it lands, the hit is lost.
2. Second pass hand-rolled the loader, on the theory that a `beforeInteractive`
   `<Script src>` gets deferred to `self.__next_s` while inline blocks are written
   in place. Half right — inline blocks go on `__next_s` too, **the Meta Pixel
   included**. So the Pixel was never synchronous either.
3. Final: both scripts `beforeInteractive`, init pushed before loader, component
   moved above `{children}`. Verified in built HTML — preload in `<head>` (pos 889),
   init at top of `<body>` (4280), loader (4395), Pixel (4901).

So this does not outrun the Pixel, it draws level with it one slot earlier in the
same queue. Level with the tag that has been catching these bounces all along is
the bar that matters.

**Rollback criterion:** if mobile LCP regresses >150ms in Speed Insights over 48h,
return both scripts to `afterInteractive`. The AW config and the event mirror are
independent of the load tier and should stay regardless.

### Verified
- `npx tsc --noEmit` clean; `npm run build` clean.
- Live in `next start`: `dataLayer` configs = `['G-HE29YL301G','AW-3195973531']`.
- GA4 collect hit observed with `en=availability_loaded&epn.blocked_nights=7` —
  a safeTrack event reaching GA4, which previously went to PostHog only.
- Synthetic footer `tel:` tap produced `phone_tapped {location:'/', placement:'footer'}`.

### Still open — needs Google Ads UI work (blocked on Saar)
- All five conversion labels are `''`, so **no Ads conversion hits fire yet**. Empty
  label = GA4 mirror only, by design. Fill in `booking/gtag.ts`:
  - `ADS_CONVERSION.label` — "Booking – Purchase" (Purchase, value from event, Count: One)
  - `whatsapp_fab_clicked` + `whatsapp_fallback_clicked` — "WhatsApp Enquiry" (Contact, ₹0, Count: One)
  - `phone_tapped` — "Phone Tap" (Contact, ₹0, Count: One)
  - `reserve_clicked` — "Reserve Started" (Secondary / observation only)
- Enquiry actions are deliberately ₹0 and Count: One so Smart Bidding can never
  mistake an enquiry for a booking.

### Noted, not changed (out of scope)
- `components/Attribution.tsx` is mounted only in `app/page.tsx`, not the layout, so
  `gclid`/`utm` capture does not happen on `/getting-to-vrindavan` etc. Fine while all
  ads point at `/`; will silently lose attribution the moment a landing page changes.
