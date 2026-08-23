import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import '../globals.css';
import SiteMasthead from '@/components/SiteMasthead';
import Footer from '@/components/Footer';
import { ROUTES, ARRIVAL_NOTES } from '@/content/journey';

/* How to get here, and what arriving is actually like. Server component.

   Distances are ranges on purpose and no fares are quoted — see the note at the
   top of content/journey.ts for why. */

const CANONICAL = 'https://www.pyari-kunj.in/getting-to-vrindavan';
const TITLE = 'Getting to Vrindavan | Trains, Roads & the Last Mile';
const DESCRIPTION =
  'Mathura Junction is 12–15 km away; Delhi is about 180 km on the Yamuna Expressway. How to reach Vrindavan by train, road and air, plus what arriving at Pyari Kunj is like — parking, check-in, and the walk in.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  openGraph: {
    type: 'article',
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: 'Pyari Kunj Vrindavan',
    locale: 'en_IN',
    images: [{ url: 'https://www.pyari-kunj.in/img/og-share.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://www.pyari-kunj.in/img/og-share.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#341320',
};

const breadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Pyari Kunj Vrindavan', item: 'https://www.pyari-kunj.in/' },
    { '@type': 'ListItem', position: 2, name: 'Getting to Vrindavan', item: CANONICAL },
  ],
};

export default function GettingHerePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <SiteMasthead />

      <main className="content-page">
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <h1 className="h-display">Getting to Vrindavan</h1>
              <p className="lede">
                Most guests arrive through Mathura Junction or drive down the Yamuna Expressway
                from Delhi. Neither is complicated — the only part worth planning is the last
                stretch into the old town, where the lanes get narrow and the address stops being
                obvious.
              </p>
            </div>

            <div className="journey-list">
              {ROUTES.map((r) => (
                <article className="journey-item" key={r.mode}>
                  <h2 className="ji-mode">{r.mode}</h2>
                  <p className="ji-summary">{r.summary}</p>
                  <p className="ji-detail">{r.detail}</p>
                </article>
              ))}
            </div>

            <p className="loc-note">
              Distances and times above are approximate — they move with the route and the
              traffic. Fares for autos, e-rickshaws and taxis are usually negotiated and change
              often, so we would rather you asked us than trusted a number printed here.
            </p>
          </div>
        </section>

        <section className="section on-deep">
          <div className="shell">
            <div className="section-head">
              <h2 className="h-display">Arriving at the house</h2>
              <p className="lede">
                The exact address and door directions go out on WhatsApp as soon as your booking
                is confirmed. Here is what to expect before that.
              </p>
            </div>
            <div className="rules-grid">
              {ARRIVAL_NOTES.map((n) => (
                <div className="rule-item" key={n.title}>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="section-head">
              <h2 className="h-display">Where you land up</h2>
              <p className="lede">
                6, Malti Kunj, Rattan Chatri, Vrindavan &mdash; 281121. On the temple side of old
                Vrindavan, 650 m from Shri Banke Bihari Ji. Rattan Chatri is the landmark every
                local driver knows, so it is the name to give.
              </p>
            </div>
            <p className="loc-note">
              Stuck on the way, or arriving at an odd hour? Call{' '}
              <a href="tel:+918791567123">+91 8791567123</a> — the host answers, usually within the
              hour.
            </p>
          </div>
        </section>

        <section className="section on-deep">
          <div className="shell page-cta">
            <h2 className="h-display">Book the stay first</h2>
            <p className="lede">
              Entire 1BHK, sleeps four, ₹2,499 a night all-in. Free parking on the premises,
              instant confirmation, free cancellation until 24 hours before check-in.
            </p>
            <Link className="btn-cta" href="/#book">
              Check dates &amp; book
            </Link>
            <p className="loc-note">
              Also useful:{' '}
              <Link href="/temples-near-pyari-kunj">which temples you can walk to from the door</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
