import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import '../globals.css';
import SiteMasthead from '@/components/SiteMasthead';
import Footer from '@/components/Footer';
import { WALKABLE_TEMPLES, RICKSHAW_TEMPLES, PLANNING_NOTES } from '@/content/temples';

/* A walking guide to the temples around the house. Server component: static
   copy, zero JavaScript shipped.

   This exists as its own route rather than a section on the home page because
   it answers a different question — "what can I actually reach on foot from
   there?" — and because Google Ads sitelinks need destinations with genuinely
   distinct content, not anchors into the same page. */

const CANONICAL = 'https://www.pyari-kunj.in/temples-near-pyari-kunj';
const TITLE = 'Temples Near Pyari Kunj | What You Can Walk To in Vrindavan';
const DESCRIPTION =
  'Shri Banke Bihari Ji is a 5-minute walk (650 m) from Pyari Kunj. Govind Dev Ji, Radha Raman Ji, Nidhivan, Radhavallabh Ji, Shahji and Rangji are all on foot too — here is what each is like and how long it takes.';

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
    { '@type': 'ListItem', position: 2, name: 'Temples Near Pyari Kunj', item: CANONICAL },
  ],
};

export default function TemplesPage() {
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
              <h1 className="h-display">Everything holy, at a walking pace</h1>
              <p className="lede">
                Pyari Kunj sits in old Vrindavan, on the temple side of town. Shri Banke Bihari Ji
                is 650 m from the door — about five minutes on foot. Almost everything else worth
                seeing is a walk too, which matters most on the days the lanes are busiest.
              </p>
            </div>

            <ul className="distance-list">
              {WALKABLE_TEMPLES.map((t) => (
                <li key={t.name}>
                  {t.name} <span className="d-dots" aria-hidden="true" />{' '}
                  <span className="d-time">{t.walk}</span>
                </li>
              ))}
              {RICKSHAW_TEMPLES.map((t) => (
                <li key={t.name}>
                  {t.name} <span className="d-dots" aria-hidden="true" />{' '}
                  <span className="d-time">{t.walk}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section on-deep">
          <div className="shell">
            <div className="section-head">
              <h2 className="h-display">What each one is actually like</h2>
              <p className="lede">
                Distances tell you what is reachable. This tells you what is worth the walk.
              </p>
            </div>
            <div className="rules-grid">
              {WALKABLE_TEMPLES.map((t) => (
                <div className="rule-item" key={t.name}>
                  <h3>
                    {t.name} <span className="ri-walk">{t.walk}</span>
                  </h3>
                  <p>{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="section-head">
              <h2 className="h-display">One e-rickshaw ride away</h2>
              <p className="lede">
                The two big modern temples sit on the other side of town. They are close enough to
                each other that most guests cover both in a single outing.
              </p>
            </div>
            <div className="rules-grid">
              {RICKSHAW_TEMPLES.map((t) => (
                <div className="rule-item" key={t.name}>
                  <h3>{t.name}</h3>
                  <p>{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section on-deep">
          <div className="shell">
            <div className="section-head">
              <h2 className="h-display">Planning the days</h2>
            </div>
            <div className="rules-grid">
              {PLANNING_NOTES.map((n) => (
                <div className="rule-item" key={n.title}>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell page-cta">
            <h2 className="h-display">Stay where the walk is short</h2>
            <p className="lede">
              The entire 1BHK, sleeps four, ₹2,499 a night all-in — no taxes, cleaning or service
              fees. Instant confirmation, free cancellation until 24 hours before check-in.
            </p>
            <Link className="btn-cta" href="/#book">
              Check dates &amp; book
            </Link>
            <p className="loc-note">
              Also useful:{' '}
              <Link href="/getting-to-vrindavan">how to reach Vrindavan and find the house</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
