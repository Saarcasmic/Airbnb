import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import GoogleTag from '@/components/GoogleTag';

/* globals.css is deliberately NOT imported here. It is the marketing site's
   stylesheet, and its universal `*{margin:0;padding:0}` reset would leak onto
   /privacy-policy, /terms-and-booking, /coupon and /block — collapsing the legal
   pages' paragraphs into a wall of text, since those pages rely on the UA's
   default margins. It is imported by the routes that own it (/ and /confirmed)
   instead, which also keeps 54KB of CSS off the four routes that never use it. */

/* Third-party script budget, in priority order:

   - Meta Pixel stays `beforeInteractive`, i.e. inline in the document. It has to
     fire PageView even for a visitor who bounces in under a second, and it seeds
     window.__pkPV so the server-side CAPI copy can deduplicate against it. This
     is the one third party we pay for up front, deliberately.
   - Razorpay's checkout.js is NOT here any more. It used to load on every page
     view; it is now fetched on first booking intent (see booking/razorpay.ts), so
     readers never download a payment SDK they will not use.
   - PostHog and Speed Insights stay behind the load event, as before.
   - preconnect for Supabase (availability is fetched on mount) and Meta. */

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pyari-kunj.in'),
  title: 'Pyari Kunj Vrindavan | Homestay Near Banke Bihari Temple',
  description:
    'Book Pyari Kunj Vrindavan direct — a 1BHK heritage homestay 5 minutes from Banke Bihari Temple, with ISKCON & Prem Mandir an easy e-rickshaw ride away. ₹2,499 a night all-in, instant confirmation. AC, kitchen, free parking.',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  /* No `alternates.canonical` here on purpose: layout metadata is inherited, so a
     canonical set at this level would have every route claiming to be the home
     page. Each route declares its own. The home page also emits its canonical and
     og:url by hand, because Next strips the trailing slash from a resolved URL
     and the live site has always published the slashed form. */
  openGraph: {
    title: 'Pyari Kunj Vrindavan | Homestay Near Banke Bihari Temple',
    description:
      'A peaceful 1BHK heritage homestay in Vrindavan near Banke Bihari Temple, with ISKCON & Prem Mandir an easy e-rickshaw ride away. Book direct at ₹2,499 a night, all-in — AC, kitchen, free parking, self check-in.',
    type: 'website',
    siteName: 'Pyari Kunj Vrindavan',
    locale: 'en_IN',
    images: [
      {
        url: 'https://www.pyari-kunj.in/img/og-share.jpg',
        width: 1200,
        height: 630,
        alt: 'Pyari Kunj Vrindavan homestay near Banke Bihari Temple',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pyari Kunj Vrindavan | Homestay Near Banke Bihari Temple',
    description:
      'Peaceful Vrindavan homestay near Banke Bihari Temple, with ISKCON & Prem Mandir an easy e-rickshaw ride away. Book direct at ₹2,499 a night, all-in — AC, kitchen, self check-in.',
    images: ['https://www.pyari-kunj.in/img/og-share.jpg'],
  },
  manifest: '/site.webmanifest',
  /* The paisley mark. favicon.ico carries 16/32/48 for browsers and for Google's
     favicon crawler, which is what shows beside the result in search. */
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/img/icon-96.png', type: 'image/png', sizes: '96x96' },
      { url: '/img/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/img/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/img/apple-touch-icon.png',
  },
  other: {
    'google-site-verification': '_SIUk714djU8vs06Thk1k74yZNj9W1RJ7XpBRk8j5gw',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#341320',
};

const META_PIXEL_ID = '1513936693537964';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        {/* Both fonts are used by the hero, so they must not wait for the CSS to
            be parsed before being discovered. */}
        <link rel="preload" as="font" href="/fonts/marcellus-latin.woff2" type="font/woff2" crossOrigin="" />
        <link
          rel="preload"
          as="font"
          href="/fonts/hanken-grotesk-latin.woff2"
          type="font/woff2"
          crossOrigin=""
        />
        {/* The LCP image, art-directed by viewport. Kept as a raw preload +
            <picture> rather than next/image: the files are already optimised and
            the optimiser would add a hop on exactly the request that matters. */}
        <link
          rel="preload"
          as="image"
          href="/img/hero-1200.webp"
          media="(max-width:767px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/img/hero-2000.webp"
          media="(min-width:768px)"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://uljcbbzmvqzrtonjantn.supabase.co" crossOrigin="" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="" />
      </head>
      <body>
        {/* Meta Pixel — init immediately so PageView fires even for quick bounces.
            A shared eventID lets the CAPI PageView (sent from the client) dedupe. */}
        <Script id="meta-pixel" strategy="beforeInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
window.__pkPV=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():'pv-'+Date.now()+'-'+Math.random().toString(36).slice(2);
fbq('track','PageView',{},{eventID:window.__pkPV});
        `}</Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        {children}

        {/* GA4 base tag. The booking conversion is reported from /confirmed. */}
        <GoogleTag />

        {/* PostHog + Vercel Speed Insights, held until the page is interactive. */}
        <Script id="analytics-deferred" strategy="lazyOnload">{`
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Ai Ri init Vi Yi Rr zi Gi Zi capture calculateEventProperties en register register_once register_for_session unregister unregister_for_session sn getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync an identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty rn Ki createPersonProfile setInternalOrTestUser nn $i hn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Xi debug Mr tn getPageViewId captureTraceFeedback captureTraceMetric Di".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_9ZhWhlT5mwHuusPgzjmNf133RcTa11WqXarKD1FAA4k',{api_host:'https://us.i.posthog.com',defaults:'2026-01-30',person_profiles:'identified_only',session_recording:{maskAllInputs:true}});
var uid=localStorage.getItem('ph_user_id');if(!uid){uid='anon_'+Math.random().toString(36).slice(2);localStorage.setItem('ph_user_id',uid);}posthog.identify(uid);
if (window.flushQueuedTracks) window.flushQueuedTracks();
import('https://esm.sh/@vercel/speed-insights').then(function(m){m.injectSpeedInsights()}).catch(function(){});
        `}</Script>
        <Script src="/_vercel/insights/script.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
