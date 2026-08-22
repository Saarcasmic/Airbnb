/* The landing page. A Server Component: every section below is static HTML in the
   initial response, which is what keeps the JSON-LD, the h1 and the whole body of
   copy visible to crawlers without waiting on JavaScript.

   The client islands are only the ones that genuinely need state: the booking
   funnel (desk, calendar, sticky bar, resume banner, WhatsApp FAB, offer strip),
   the hero carousel, the gallery, and the two scroll-driven bits of chrome. */

import './globals.css';

import Hero from '@/components/Hero';
import BookingDesk from '@/components/BookingDesk';
import ResumeBanner from '@/components/ResumeBanner';
import CalendarSheet from '@/components/CalendarSheet';
import StickyBookBar from '@/components/StickyBookBar';
import WhatsAppFab from '@/components/WhatsAppFab';
import AssuranceStrip from '@/components/AssuranceStrip';
import HomeStory from '@/components/HomeStory';
import Spaces from '@/components/Spaces';
import Reviews from '@/components/Reviews';
import Location from '@/components/Location';
import Host from '@/components/Host';
import HouseRules from '@/components/HouseRules';
import Faq from '@/components/Faq';
import FollowAlong from '@/components/FollowAlong';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Attribution from '@/components/Attribution';
import PageViewCapi from '@/components/PageViewCapi';
import { BookingProvider } from '@/booking/BookingProvider';
import { LightboxProvider, PhotoTrigger } from '@/components/Lightbox';

export default function HomePage() {
  return (
    <>
      {/* Emitted by hand rather than through `metadata`: Next normalises a
          resolved URL and drops the trailing slash, and the slashed form is what
          the live site has always published. React hoists both into <head>. */}
      <link rel="canonical" href="https://www.pyari-kunj.in/" />
      <meta property="og:url" content="https://www.pyari-kunj.in/" />
      <JsonLd />
      <LightboxProvider>
        <BookingProvider>
          <Attribution />
          <PageViewCapi />

          <Hero />

          {/* Overlaps the hero base — see .book-section's negative top margin. */}
          <section className="book-section" id="book" aria-label="Book your stay">
            <ResumeBanner />
            <BookingDesk />
          </section>

          <AssuranceStrip />

          <main>
            <HomeStory PhotoTrigger={PhotoTrigger} />
            <Spaces PhotoTrigger={PhotoTrigger} />
            <Reviews />
            <Location />
            <Host />
            <HouseRules />
            <Faq />
            <FollowAlong />
          </main>

          <Footer />

          <StickyBookBar />
          <WhatsAppFab />
          <CalendarSheet />
        </BookingProvider>
      </LightboxProvider>
    </>
  );
}
