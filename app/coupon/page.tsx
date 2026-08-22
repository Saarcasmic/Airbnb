import type { Metadata, Viewport } from 'next';

import CouponAdmin from './CouponAdmin';
import './coupon.css';

/* The tool itself is a Client Component (password gate, live list, clipboard),
   and Next forbids a metadata export from a 'use client' file — so this stays a
   thin Server Component that owns the head tags and the route-scoped stylesheet. */

export const metadata: Metadata = {
  // absolute so a title template in app/layout.tsx cannot append to it: the
  // host bookmarks these pages and the old titles were standalone.
  title: { absolute: 'Coupons | Pyari Kunj Vrindavan' },
  // Private host tooling. robots.txt and a vercel.json header say the same
  // thing; this is the third lock on the same door.
  robots: { index: false, follow: false },
};

// maximum-scale=1 (unlike the public pages) — the admin forms are already
// full-width at 520px and pinch-zoom only fights the date/number keyboards.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#341320',
};

export default function CouponPage() {
  return <CouponAdmin />;
}
