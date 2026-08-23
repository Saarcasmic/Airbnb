import Script from 'next/script';

import { GA_ID } from '@/booking/gtag';

/* The Google tag, held until after hydration.

   Deliberately not `beforeInteractive`: gtag.js is a heavy third party and the
   hero image is what decides this page's LCP. Nothing is lost by waiting —
   booking/gtag.ts writes straight to dataLayer, so any event fired before the
   script lands is queued and replayed once it does. */

export default function GoogleTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
      `}</Script>
    </>
  );
}
