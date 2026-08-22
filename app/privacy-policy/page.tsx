import type { Metadata, Viewport } from 'next';

import './privacy-policy.css';

/* Static legal copy — no 'use client', no JavaScript shipped. The route is
   /privacy-policy now (it was /privacy-policy.html), so the canonical and the
   breadcrumb below point at the extension-less URL. */

const CANONICAL = 'https://www.pyari-kunj.in/privacy-policy';
const DESCRIPTION = 'Privacy policy for the Pyari Kunj Vrindavan landing page and lead form.';

export const metadata: Metadata = {
  // absolute so a title template in app/layout.tsx cannot append to it.
  title: { absolute: 'Privacy Policy | Pyari Kunj Vrindavan' },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    title: 'Privacy Policy | Pyari Kunj Vrindavan',
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: 'Pyari Kunj Vrindavan',
    images: [{ url: 'https://www.pyari-kunj.in/img/og-share.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Pyari Kunj Vrindavan',
    description: DESCRIPTION,
    images: ['https://www.pyari-kunj.in/img/og-share.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

const breadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Pyari Kunj Vrindavan', item: 'https://www.pyari-kunj.in/' },
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: CANONICAL },
  ],
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <main className="shell">
        <a className="crumb" href="/">
          Back to Pyari Kunj Vrindavan
        </a>
        <h1>Privacy Policy</h1>
        <div className="card">
          <p>
            This privacy policy explains what information the Pyari Kunj Vrindavan website handles
            when you browse and book.
          </p>
          <p>Last updated: 7 August 2026.</p>
        </div>

        <h2>Booking drafts stay in your browser</h2>
        <p>
          When you select dates and guests, your booking draft (dates, guest count, and total) is
          saved only in your own browser's local storage so you can pick up where you left off. It
          expires automatically after 48 hours, never leaves your device through this website, and
          you can remove it anytime by clearing your browser data.
        </p>

        <h2>Payments via Razorpay</h2>
        <p>
          Payments are processed by Razorpay Software Pvt. Ltd. When you pay, the name, email, phone
          number, and payment instrument you enter go directly into Razorpay's secure,
          PCI-DSS-compliant checkout — this website never stores your card or bank details. Razorpay
          shares a payment confirmation and your contact details with us so the host can confirm and
          service your booking. Razorpay's handling of your data is governed by its own privacy
          policy.
        </p>

        <h2>WhatsApp communication</h2>
        <p>
          After booking, exact location and check-in details are shared on WhatsApp between you and
          the host. That conversation is governed by WhatsApp's own privacy policy.
        </p>

        <h2>Analytics and advertising measurement</h2>
        <p>
          This site uses Meta Pixel together with the Meta Conversions API (a server-side companion
          that reports the same events, such as page views, checkout starts, and completed bookings,
          from our server), PostHog (including session recording, with form inputs masked), Vercel
          Analytics, and Speed Insights. These help us understand visits, improve the booking
          experience, and measure which ad campaigns bring guests. For completed bookings, a hashed
          (irreversibly encrypted) form of your email and phone may be sent to Meta to match the
          conversion to an ad — Meta never receives these in readable form. Campaign tags (such as
          UTM parameters and click identifiers like <code>fbclid</code>) from the link you arrived
          through may be stored in your browser for attribution.
        </p>

        <h2>Data sharing</h2>
        <p>
          Data is processed by the providers named above (Razorpay, Meta, PostHog, Vercel). We do not
          sell personal information gathered through this website.
        </p>

        <h2>Contact</h2>
        <p>
          For any privacy or booking questions, message the host on WhatsApp via the buttons on the
          homepage, or reach us directly:
        </p>
        <p>
          Pyari Kunj Vrindavan
          <br />
          6, Malti Kunj, Rattan Chatri, Vrindavan - 281121, Uttar Pradesh, India
          <br />
          Phone: <a href="tel:+918791567123">+91 8791567123</a>
        </p>
      </main>
    </>
  );
}
