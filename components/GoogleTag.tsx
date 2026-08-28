import Script from 'next/script';

import { ADS_ID, GA_ID } from '@/booking/gtag';

/* The Google tag, inline at the top of the document — the same shape as the Meta
   Pixel next to it, and for the same reason.

   It used to sit at `afterInteractive` on the reasoning that booking/gtag.ts
   writes straight to dataLayer, so nothing was lost by waiting. That reasoning
   was wrong: dataLayer is only a queue, and gtag.js is the thing that actually
   sends the request. A visitor who leaves before the script lands leaves with
   their page_view still sitting in memory, unsent.

   That is not hypothetical here. Google Ads billed 73 clicks over Aug 23-28 and
   GA4 recorded 5 sessions from `google / cpc`, while the Meta Pixel — which has
   loaded up front all along — kept seeing its PageViews. Paid traffic is 100%
   mobile and bounces fast, so the tag has to be there before it does.

   What `beforeInteractive` buys in the App Router is worth being precise about,
   because it is not "synchronous, inline, in the head". Next collects these — the
   Pixel included — onto its own `self.__next_s` queue and drains them from the
   runtime bootstrap. So this does not outrun the Pixel; it draws level with it,
   one slot earlier in the same queue. Level with the tag that has been catching
   these bounces all along is exactly the bar to clear.

   `<Script src>` rather than a hand-rolled loader because it also emits a
   `<link rel="preload">` into the head, so the fetch starts during head parse
   instead of when the queue drains. preconnect is in app/layout.tsx.

   If mobile LCP regresses by more than ~150ms in Speed Insights, move both
   scripts back to `afterInteractive`; the AW config and the event mirror are
   independent of the load tier and should stay either way. */

export default function GoogleTag() {
  return (
    <>
      {/* Init first: gtag.js replays whatever is already on dataLayer when it lands. */}
      <Script id="gtag-init" strategy="beforeInteractive">{`
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_ID}');
${ADS_ID ? `gtag('config','${ADS_ID}');` : ''}
      `}</Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
