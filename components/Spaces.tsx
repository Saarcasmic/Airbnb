import type { ComponentType } from 'react';
import FadeUp from '@/components/FadeUp';
import AmenitiesToggle from '@/components/AmenitiesToggle';
import type { PhotoTriggerProps } from '@/components/HomeStory';
import { AMENITIES, AMENITIES_MORE } from '@/content/amenities';

/* The five mosaic tiles are hand-written rather than mapped: each one has its
   own span in the grid, its own caption, and its own gallery index. The lightbox
   trigger is injected from the client boundary — see HomeStory. */

export default function Spaces({ PhotoTrigger }: { PhotoTrigger: ComponentType<PhotoTriggerProps> }) {
  return (
    <section className="section on-deep" id="spaces">
      <div className="shell">
        <FadeUp className="section-head">
          <h2 className="h-display">One floor, wholly yours</h2>
          <p className="lede">The whole first-floor apartment is yours for the stay — no shared rooms, no other guests.</p>
        </FadeUp>
        <FadeUp className="mosaic">
          <PhotoTrigger photoIndex={16} className="mosaic-item m-wide js-photo" ariaLabel="View photos of the living and prayer room">
            <img src="/img/lr-wide1.webp" width="1856" height="2304" alt="Living room with floor seating and prayer nook" loading="lazy" decoding="async" />
            <span className="m-caption"><span className="m-name">Living & Prayer Room</span><span className="m-desc">Floor seating, a painted mandir, sleeps one more.</span></span>
          </PhotoTrigger>
          <PhotoTrigger photoIndex={14} className="mosaic-item m-tall js-photo" ariaLabel="View photos of the bedroom">
            <img src="/img/bedroom-front.webp" width="1536" height="2752" alt="The bedroom with double bed" loading="lazy" decoding="async" />
            <span className="m-caption"><span className="m-name">The Bedroom</span><span className="m-desc">Double bed, split AC, hand-blocked florals.</span></span>
          </PhotoTrigger>
          <PhotoTrigger photoIndex={18} className="mosaic-item js-photo" ariaLabel="View photos of the kitchen">
            <img src="/img/kitchen-wide.webp" width="2048" height="1143" alt="Fully equipped induction kitchen" loading="lazy" decoding="async" />
            <span className="m-caption"><span className="m-name">The Kitchen</span><span className="m-desc">Induction kitchen with clay kulhads, fully equipped.</span></span>
          </PhotoTrigger>
          <PhotoTrigger photoIndex={7} className="mosaic-item js-photo" ariaLabel="View photos of the bathroom">
            <img src="/img/bath-wide.webp" width="2048" height="1529" alt="Full bathroom with hot water" loading="lazy" decoding="async" />
            <span className="m-caption"><span className="m-name">The Bath</span><span className="m-desc">Full bathroom, hot water, essentials provided.</span></span>
          </PhotoTrigger>
          <PhotoTrigger photoIndex={0} className="mosaic-item m-more js-photo">
            <span className="m-more-count">21</span>
            <span className="m-more-label">View all photos</span>
          </PhotoTrigger>
        </FadeUp>

        <FadeUp className="amenities">
          <h3 className="amen-title">What the home provides</h3>
          <ul className="amen-list">
            {AMENITIES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <AmenitiesToggle items={AMENITIES_MORE} />
        </FadeUp>
      </div>
    </section>
  );
}
