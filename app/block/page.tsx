import type { Metadata, Viewport } from 'next';

import BlockAdmin from './BlockAdmin';
import './block.css';

/* Same split as /coupon: the tool is a Client Component (password gate, live
   list, confirm()), and Next forbids a metadata export from a 'use client'
   file — so this Server Component owns the head tags and the route stylesheet. */

export const metadata: Metadata = {
  // absolute so a title template in app/layout.tsx cannot append to it.
  title: { absolute: 'Block Dates | Pyari Kunj Vrindavan' },
  // Private host tooling — robots.txt and a vercel.json header agree.
  robots: { index: false, follow: false },
};

// maximum-scale=1, as the original: pinch-zoom only fights the date pickers.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#341320',
};

export default function BlockPage() {
  return <BlockAdmin />;
}
