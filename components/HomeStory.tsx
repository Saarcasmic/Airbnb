import type { ComponentType, ReactNode } from 'react';
import FadeUp from '@/components/FadeUp';

/* The lightbox and its state live at the client boundary, so the two collage
   tiles that open it are injected rather than built here. That keeps this
   section — all copy and two images — a zero-JS Server Component. */
export type PhotoTriggerProps = {
  photoIndex: number;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
};

export default function HomeStory({ PhotoTrigger }: { PhotoTrigger: ComponentType<PhotoTriggerProps> }) {
  return (
    <section className="section" id="home-story">
      <div className="shell home-grid">
        <FadeUp className="home-copy">
          <h2 className="h-display">Rooted in generations of Shringaar Seva</h2>
          <p className="lede">Pyari Kunj is a private 1BHK homestay in old Vrindavan, a five-minute walk from Shri Banke Bihari Ji. The walls are hand-painted, a small mandir presides over the living room, and mornings arrive as raking light across marble floors.</p>
          <p className="lede">It is a homestay rather than a hotel: a full apartment with air conditioning, a working kitchen, self check-in, and free parking. Families and temple pilgrims who want quiet, privacy, and a home-like atmosphere tend to settle in quickly.</p>
          <div className="laurel">
            <svg width="26" height="40" viewBox="0 0 36 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M30 4C18 12 12 24 12 36c0 6 2 10 6 14"/><path d="M23 10c-4 0-8-2-9-6 5-1 8 2 9 6z"/><path d="M17 18c-4 1-8 0-10-4 4-2 8 0 10 4z"/><path d="M13 27c-4 2-8 1-11-2 4-3 8-2 11 2z"/><path d="M12 37c-4 2-9 2-12-1 3-4 8-3 12 1z"/><path d="M14 45c-3 3-8 4-11 2 2-4 7-5 11-2z"/></svg>
            <span className="laurel-score">5.0</span>
            <svg width="26" height="40" viewBox="0 0 36 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ transform: 'scaleX(-1)' }}><path d="M30 4C18 12 12 24 12 36c0 6 2 10 6 14"/><path d="M23 10c-4 0-8-2-9-6 5-1 8 2 9 6z"/><path d="M17 18c-4 1-8 0-10-4 4-2 8 0 10 4z"/><path d="M13 27c-4 2-8 1-11-2 4-3 8-2 11 2z"/><path d="M12 37c-4 2-9 2-12-1 3-4 8-3 12 1z"/><path d="M14 45c-3 3-8 4-11 2 2-4 7-5 11-2z"/></svg>
            <span className="laurel-text">
              <span className="laurel-label">Guest Favourite</span>
              <span className="laurel-sub">Top-rated homestay in Vrindavan · every review five stars</span>
            </span>
          </div>
        </FadeUp>
        <FadeUp className="collage">
          <PhotoTrigger photoIndex={4} className="collage-item c-arch js-photo" ariaLabel="View photo: the hand-painted mandir">
            <img src="/img/mandir-900.webp" width="1200" height="1607" alt="Hand-painted mandir in the living room" loading="lazy" decoding="async" />
          </PhotoTrigger>
          <PhotoTrigger photoIndex={1} className="collage-item c-plain js-photo" ariaLabel="View photo: morning light in the hall">
            <img src="/img/hero-tile-2.webp" width="1792" height="2400" alt="Morning light in the hall" loading="lazy" decoding="async" />
          </PhotoTrigger>
          <span className="collage-caption">The living-room mandir · morning light in the hall</span>
        </FadeUp>
      </div>
    </section>
  );
}
