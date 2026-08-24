import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import '../globals.css';
import SiteMasthead from '@/components/SiteMasthead';
import Footer from '@/components/Footer';
import FestivalCalendar from '@/components/FestivalCalendar';
import { FESTIVALS, DATED_FESTIVALS, CALENDAR_VERIFIED } from '@/content/festivals';

/* The Braj festival calendar. Server component — twelve month grids, zero JS.

   INDEXING IS GATED. The page stays noindex until every festival in
   content/festivals.ts has a panchang-checked date and `confirmed: true`. Half a
   calendar of guessed dates would be worse than no calendar: people plan travel
   around this. CALENDAR_VERIFIED flips it, nothing else needs editing. */

const CANONICAL = 'https://www.pyari-kunj.in/vrindavan-festival-calendar';
const TITLE = 'Vrindavan & Braj Festival Calendar | Dates, Tithis and Where to Stay';
const DESCRIPTION =
  'When Janmashtami, Radha Ashtami, Kartik, Barsana Lathmar Holi and Phoolon wali Holi fall in Vrindavan and Braj — with the tithi for each, what actually happens in the lanes, and a room five minutes from Banke Bihari Ji.';

/** Rolling window starts at the 1st of the current month. */
function startOfThisMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
}

/* Enough months to reach the last dated festival, never fewer than 12. A fixed
   12 would have left Jhulan Yatra (Aug 2027) emitting Event structured data with
   nothing on the page to match it — which is exactly what Google's rich-results
   policy forbids. */
function monthsToCover(startISO: string): number {
  const last = DATED_FESTIVALS[DATED_FESTIVALS.length - 1];
  if (!last) return 12;
  const [sy, sm] = startISO.split('-').map(Number);
  const end = last.endDate || last.date;
  const [ey, em] = end.split('-').map(Number);
  return Math.max(12, (ey - sy) * 12 + (em - sm) + 1);
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: CALENDAR_VERIFIED
    ? { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' }
    : { index: false, follow: false },
  openGraph: {
    type: 'article',
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: 'Pyari Kunj Vrindavan',
    locale: 'en_IN',
    images: [{ url: 'https://www.pyari-kunj.in/img/og-share.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
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
    { '@type': 'ListItem', position: 2, name: 'Vrindavan Festival Calendar', item: CANONICAL },
  ],
};

/* Event structured data, but only for dates a human has confirmed — publishing
   an unverified Event to Google would be worse than publishing none. */
const events = DATED_FESTIVALS.filter((f) => f.confirmed).map((f) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: f.name,
  startDate: f.date,
  ...(f.endDate ? { endDate: f.endDate } : {}),
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  description: f.note,
  location: {
    '@type': 'Place',
    name: 'Vrindavan, Braj',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Vrindavan',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
  },
}));

export default function FestivalCalendarPage() {
  const pending = FESTIVALS.filter((f) => !f.date || !f.confirmed);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {events.map((e) => (
        <script
          key={String(e.name)}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(e) }}
        />
      ))}

      <SiteMasthead />

      <main className="content-page">
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <h1 className="h-display">Vrindavan &amp; Braj festival calendar</h1>
              <p className="lede">
                Braj keeps its own calendar. Barsana&rsquo;s Lathmar Holi falls days before the Holi
                the rest of India plays; the colour season here opens forty days early at Vasant
                Panchami; and Kartik matters more in Vrindavan than almost anywhere. Every date
                below is given with its tithi, and with a room five minutes from Shri Banke Bihari
                Ji.
              </p>
            </div>

            {pending.length > 0 && (
              /* Visible only while dates are outstanding. Renders nothing once the
                 file is complete, and the route is noindex until then. */
              <div className="fc-draft" role="status">
                <strong>Draft — {pending.length} of {FESTIVALS.length} dates still to confirm.</strong>
                <span>
                  This page is noindex and is not linked from the site. Fill in{' '}
                  <code>content/festivals.ts</code> from a Braj panchang, set{' '}
                  <code>confirmed: true</code>, and it publishes itself.
                </span>
                <ul>
                  {pending.map((f) => (
                    <li key={f.slug}>
                      {f.name} <em>— {f.tithi}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="section on-deep">
          <div className="shell">
            <FestivalCalendar
              festivals={DATED_FESTIVALS}
              startISO={startOfThisMonth()}
              months={monthsToCover(startOfThisMonth())}
            />
          </div>
        </section>

        <section className="section">
          <div className="shell page-cta">
            <h2 className="h-display">These are the dates that fill first</h2>
            <p className="lede">
              Weekends and temple-season dates go months ahead. The entire 1BHK, sleeps four,
              &#8377;2,499 a night all-in &mdash; instant confirmation, free cancellation until 24
              hours before check-in.
            </p>
            <Link className="btn-cta" href="/#book">
              Check dates &amp; book
            </Link>
            <p className="loc-note">
              Also useful:{' '}
              <Link href="/temples-near-pyari-kunj">which temples you can walk to</Link> and{' '}
              <Link href="/getting-to-vrindavan">how to reach Vrindavan</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
