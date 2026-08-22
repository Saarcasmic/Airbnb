'use client';

/* The auto-advancing hero, plus the tap-through to the gallery.

   Crossfade rather than a horizontal slide, because the hero copy is fixed on
   top of it. Slide 1 keeps the responsive sources and the LCP priority; slide 2
   loads lazily at low priority so it never competes for bandwidth with the image
   that decides the LCP score. */

import { useEffect, useRef, useState } from 'react';

import { safeTrack } from '@/booking/tracking';
import { useLightbox } from '@/components/Lightbox';

const SLIDE_MS = 3000;

export default function HeroMedia() {
  const { open } = useLightbox();
  const [active, setActive] = useState(0);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | null = null;
    const start = () => {
      if (timer === null) {
        timer = window.setInterval(() => setActive((i) => (i + 1) % 2), SLIDE_MS);
      }
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    // Don't burn cycles crossfading a hero nobody is looking at.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    const observer = mediaRef.current
      ? new IntersectionObserver(
          (entries) => (entries[0].isIntersecting ? start() : stop()),
          { threshold: 0 },
        )
      : null;
    if (observer && mediaRef.current) observer.observe(mediaRef.current);

    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <div className="hero-media" ref={mediaRef}>
        <picture className={'hero-slide' + (active === 0 ? ' is-active' : '')}>
          <source type="image/webp" media="(min-width:768px)" srcSet="/img/hero-2000.webp" />
          <source type="image/webp" srcSet="/img/hero-1200.webp" />
          <img
            src="/img/herooo.jpeg"
            width={2400}
            height={1792}
            alt="Through the rosewood door — the bedroom at Pyari Kunj Vrindavan, velvet cushions on a floral-print bed"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <picture className={'hero-slide' + (active === 1 ? ' is-active' : '')}>
          <img
            src="/img/hero-tile-2.webp"
            width={1792}
            height={2400}
            alt="Morning light in the hall at Pyari Kunj Vrindavan"
            loading="lazy"
            fetchPriority="low"
            decoding="async"
          />
        </picture>
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      {/* Catches taps on the exposed photo only: the top bar and .hero-content sit
          above it, so their buttons and copy keep their own clicks. aria-hidden and
          no tab stop because "View all 21 photos" is the accessible route in. */}
      <div
        className="hero-tap"
        aria-hidden="true"
        onClick={() => {
          safeTrack('hero_image_clicked', {});
          open(0);
        }}
      />
    </>
  );
}
