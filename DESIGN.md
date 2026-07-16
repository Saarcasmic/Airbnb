# Pyari Kunj — Design System ("Marble & Rani Velvet")

The visual system is drawn from the house itself, not from a "heritage homestay" kit: grey-veined marble floors, rani-pink velvet cushions, the deep maroon rug, Pichwai lotus panels, brass lamps, rosewood doors. It replaced the earlier Airbnb-derived and ivory/saffron systems (see git history for those).

## 1. Visual Theme & Atmosphere

A calm, photography-first booking product. The marble off-white field lets the property photos carry all the color; the single dark surface is a deep rani velvet (not ink, not navy) used for the reviews interlude, footer, sticky bar, and calendar anchors. One saturated action color — rani pink — marks everything bookable. Brass appears only as fine hairlines and small ornaments (laurels, list markers, dotted leaders).

**Signature elements**
- **The toran/valance scallop** where surfaces meet: a slim rani scallop across the top of the booking desk (the mandir's valance marking the money moment), and marble scallops hanging over the velvet reviews section and footer. Implemented as `radial-gradient` repeat-x strips (`.toran`, `.desk-valance`).
- **Devanagari wordmark accent**: "प्यारी कुंज" in Tiro Devanagari (4.6 KB subset) under the Marcellus wordmark and in the footer, always in pink on dark.
- **One arch moment**: only the living-room mandir photo gets the niche-arch crop (`.c-arch`, radius `999px 999px 14px 14px`). Every other image is a plain 14px-radius rectangle.
- **Ledger rows with dotted leaders**: the price breakdown and the temple-distance list share the same bahi-khata grammar (`.bd-dots`, `.d-dots`).

## 2. Color Tokens (css/style.css `:root`)

| Token | Value | Role |
|---|---|---|
| `--marble` | `#F5F3F1` | body field (cool off-white, chroma ≈ 0 — deliberately NOT cream) |
| `--marble-deep` | `#EBE7E3` | alternate sections (`.on-deep`) |
| `--card` | `#FFFDFE` | booking desk, raised panels |
| `--velvet` | `#341320` | dark anchor: reviews section, footer, sticky bar, calendar anchors, done icon |
| `--velvet-soft` | `#471B2E` | raised dark surface (hovers on velvet) |
| `--ink` / `--ink-soft` / `--mut` | `#271821` / `#503B47` / `#6E5A64` | text ramp (all ≥ 4.5:1 on marble) |
| `--rani` | `#A61E4D` | THE action color — CTAs, discount rows, active marks (white on rani ≈ 7.2:1) |
| `--rani-deep` | `#87173D` | hover/pressed |
| `--rani-tint` | `#F6E2EA` | selection ranges, tags, confirmed summary card |
| `--rani-glow` | `#E9A9C3` | pink accents on velvet (links, hindi wordmark, hero overline) |
| `--pichwai` | `#3D5CA8` | reserved quiet secondary (rarely used; the photos carry the blue) |
| `--brass` / `--brass-line` | `#7E6534` / `#C2A878` | text-safe brass / decorative hairlines only |
| `--leaf` | `#0E7C43` | WhatsApp + success semantics |
| `--error` | `#B3261E` | payment errors on `#F9E7E5` tint |

Rules: rani is scarce outside the booking surfaces; never place `--rani` text on velvet (use `--rani-glow`); brass never below 18px unless decorative.

## 3. Typography

- **Display**: `Marcellus` (400 only; `fonts/marcellus-latin.woff2`, 14 KB). Inscriptional Roman serif — temple-stone calm. Used for H1/H2 (`.h-display`, clamp 29→44px, lh 1.12), prices (`.dp-now`, `.bd-total-value`), big numerals (5.0, category scores), room names.
- **UI/body**: `Hanken Grotesk` variable 400–700 (`fonts/hanken-grotesk-latin.woff2` + `-ext` for ₹, ~54 KB total). 16px/1.65 body; 600–700 for labels/CTAs.
- **Hindi accent**: `Tiro Devanagari Hindi` subset containing only "प्यारी कुंज" glyphs (`--hindi`).
- Hero H1 clamp(34px, 5.4vw, 64px), lh 1.06, `text-wrap: balance`. Field labels are the only tracked uppercase (11px/700/0.09em) plus the single hero kicker — no per-section eyebrows.
- Fraunces and Inter woff2 files remain on disk but are no longer referenced.

## 4. Components

- **Booking desk** (`.book-desk`): white card, 20px radius, rani scallop valance, floats over the hero base (negative margin). Desktop ≥1024px: 3-column grid — price block (hairline right border) | dates+guests field group | Reserve CTA + proof line. Breakdown opens below as a centered 600px ledger. Mobile: stacked.
- **Buttons**: primary `.btn-cta` solid rani, 10px radius, 54px min-height, hover darkens + lifts 1px, active scales 0.985, disabled `#E7DFE3`/`#8D7A84` (state driven by `.is-disabled`). WhatsApp variant solid leaf green. Ghost buttons on photos: glass pill with 1px light border + blur. Text buttons underline.
- **Field group** (`.desk-fields`): bordered white group, rows split by soft hairlines, rani-tint hover on the tappable dates row, circular 36px steppers.
- **Calendar sheet**: full-screen sheet on mobile (slides up), 432px centered modal ≥744px. Day cells 50% radius; anchors = velvet circles with ivory numerals; in-range = rani-tint squares; blocked = strikethrough; save = rani pill. Closed state uses `visibility:hidden` (not just opacity) so it is unfocusable when closed.
- **Sticky bar**: velvet, price + state-aware sub-line left, rani pill CTA right. Mobile: always on. Desktop: only after scrolling past the desk (`.past-book`). Hidden when confirmed or when the sheet is open (visibility + transform).
- **Mosaic** (spaces): asymmetric grid-areas — wide living shot + tall bedroom spanning two rows + kitchen/bath, captions on bottom scrims (Marcellus names), "21 · View all photos" marble pill floating top-right (becomes a full-width outline button < 720px).
- **Quotes**: hairline-divided serif pull-quotes on velvet, pink quote marks, no cards.
- **Amenities**: two-column hairline list with brass ring markers; `#amenityToggle` reveals `#amenityMore.show`.
- **Lightbox**: near-black plum overlay, scroll-snap track, glass circular controls, tabular-nums counter.

## 5. Layout & Spacing

- Shell max-width 1160px, gutter clamp(20px, 4.5vw, 48px).
- Sections clamp(60px, 8.5vw, 108px) vertical; surface rhythm: marble → deep → velvet → marble → deep → marble.
- Radius scale: 10px (buttons/inputs) · 14px (cards/images) · 20px (desk/sheets) · 999px (pills/steppers). Nothing above 20px.
- Z-scale tokens: nav 20 · fab 46 · bar 50 · backdrop 998 · sheet 1000 · lightbox 1001.

## 6. Motion & Accessibility

- One orchestrated hero rise (overline → title → meta → chips, 0.65s expo-out staggers).
- Scroll reveals are **transform-only** (`.fade-up` settles 16px; content is never opacity-hidden, so sections can't ship blank if the observer never fires).
- Photo hovers: 1.03 scale, 0.5s expo-out. All transitions/animations zeroed under `prefers-reduced-motion`.
- Focus: 2px rani outline (pink `--rani-glow` on dark surfaces). Overlays use the visibility pattern so closed dialogs/FAB/bar are not keyboard-focusable. Touch targets ≥ 40px. Dialogs close via Escape, backdrop, and browser back.

## 7. Don'ts

- No cream/ivory/saffron "heritage kit"; warmth comes from the photography.
- No Airbnb grammar: no coral, no category tabs, no listing-card grid.
- No eyebrow kickers above sections (the hero kicker is the single exception).
- No gradients on buttons or text; no glassmorphism outside on-photo chips; no borders + big soft shadow on the same element.
- Arch crops only for the mandir. Scallops only at the three sanctioned edges (desk valance, reviews top, footer top).
