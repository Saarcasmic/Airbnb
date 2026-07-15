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

- Verified: 37 Node unit tests (price math incl. rounding, month/year-boundary nights, wa.me/upi:// URL encoding, draft TTL/corruption/past-date guards, calendar selection rules) + 32 headless-Chrome walkthrough checks (full funnel idle→done on 390×844, draft restore after reload, guest stepper clamps, copy button, Escape/back closes sheet, sticky-bar state labels) — all passing.
- Known env-only 404s locally: `/_vercel/insights` + `/_vercel/speed-insights` (exist only on Vercel).
- **Before launch:** (1) swap `upiId`/`payeeName` in `js/app.js` CONFIG (`grep -rn REPLACE js/`); (2) fill the cancellation-policy placeholder in `terms-and-booking.html`; (3) test wa.me + upi:// hops on a real Android phone — those can't be simulated on desktop.
