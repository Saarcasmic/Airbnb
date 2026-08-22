import type { Metadata, Viewport } from 'next';

import './terms-and-booking.css';

/* Static legal copy — no 'use client', no JavaScript shipped. The route is
   /terms-and-booking now (it was /terms-and-booking.html), so the canonical and
   the breadcrumb below point at the extension-less URL. */

const CANONICAL = 'https://www.pyari-kunj.in/terms-and-booking';
const DESCRIPTION = 'Terms and booking information for Pyari Kunj Vrindavan.';

export const metadata: Metadata = {
  // absolute so a title template in app/layout.tsx cannot append to it.
  title: { absolute: 'Terms and Booking | Pyari Kunj Vrindavan' },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    title: 'Terms and Booking | Pyari Kunj Vrindavan',
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: 'Pyari Kunj Vrindavan',
    images: [{ url: 'https://www.pyari-kunj.in/img/og-share.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms and Booking | Pyari Kunj Vrindavan',
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
    { '@type': 'ListItem', position: 2, name: 'Terms and Booking', item: CANONICAL },
  ],
};

export default function TermsAndBookingPage() {
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
        <h1>Terms and Booking</h1>
        <div className="card">
          <p>
            This page explains how direct bookings for Pyari Kunj Vrindavan work — pricing, payment,
            cancellation, and house rules.
          </p>
          <p>Last updated: 7 August 2026.</p>
        </div>

        <h2>Who you're booking with</h2>
        <p>
          When you book on this website, you book directly with the host of Pyari Kunj Vrindavan
          (Saar).
        </p>

        <h2>Booking process</h2>
        <ul>
          <li>
            Select your dates and guests on this website to see the total price, and apply an offer
            code if you have one.
          </li>
          <li>
            Pay securely through Razorpay (UPI, card, or netbanking) to book instantly. The calendar
            may lag behind very recent bookings; in the rare event your dates turn out to be
            unavailable after payment, you receive a full refund.
          </li>
          <li>
            Your booking is confirmed as soon as your payment succeeds — you'll receive a reservation
            reference on screen, and the host sends exact location and check-in details on WhatsApp
            shortly after.
          </li>
        </ul>

        <h2>Pricing</h2>
        <p>
          The rate is ₹2,499 per night. The total shown at checkout (nightly rate × nights, minus any
          offer code you apply) is the final price in Indian Rupees — there are no additional taxes,
          cleaning, or service fees. Offer codes are optional, only one may be used per booking, and
          each may be withdrawn or changed at any time. Rates may change for future bookings; the
          total you pay at checkout is the one that applies to your stay.
        </p>

        <h2>Payment</h2>
        <p>
          Payments are processed securely by Razorpay, which supports UPI, credit/debit cards, and
          netbanking. Payment details are entered inside Razorpay's PCI-DSS-compliant checkout and
          are never stored on this website — we receive only a payment confirmation and the contact
          details you provide for the booking.
        </p>

        <h2>Cancellation and refunds</h2>
        <p>
          <strong>Full refund</strong> if you cancel at least <strong>24 hours before</strong> your
          check-in date. Cancellations made <strong>within 24 hours</strong> of check-in, and
          no-shows, receive a <strong>50% refund</strong>.
        </p>
        <p>
          To cancel, message the host on WhatsApp with your reservation reference. Refunds are issued
          to your original payment method through Razorpay, typically within 5–7 working days.
        </p>
        <p>
          If the host cancels your confirmed booking for any reason — including if your dates turn
          out to be unavailable — you receive a <strong>100% refund</strong>.
        </p>

        <h2>House rules</h2>
        <ul>
          <li>
            Check-in 12:00–6:00 pm; check-out before 10:00 am (flexible timing subject to
            adjacent-day bookings; late check-out on a pay basis).
          </li>
          <li>
            Strictly vegetarian household — no meat, eggs, onion, or garlic brought into or cooked in
            the space.
          </li>
          <li>No alcohol and no smoking.</li>
          <li>
            Maximum 4 guests. The building is family-oriented — please keep music and noise low.
          </li>
          <li>The apartment is on the 1st floor and requires climbing stairs.</li>
          <li>
            Free on-premises parking is offered, but local monkeys are active — parking is at your own
            risk; keep glasses and bags close.
          </li>
        </ul>

        <h2>Property information</h2>
        <p>
          We aim to keep property information accurate, but amenities, check-in details, and stay
          conditions can change over time. Please confirm anything important with the host on
          WhatsApp before making travel plans.
        </p>

        <h2>Contact and support</h2>
        <p>
          Bookings are made directly on this website. After payment, the host shares the exact
          location and check-in details on WhatsApp, and WhatsApp remains the fastest way to reach the
          host for any help before, during, or after your stay.
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
