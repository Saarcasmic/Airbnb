/* Server component: the hero copy — including the h1 — is in the initial HTML.
   Only the three genuinely interactive pieces inside it are client islands. */

import HeroMedia from '@/components/HeroMedia';
import OfferStrip from '@/components/OfferStrip';
import ShareButton from '@/components/ShareButton';
import { PhotoTrigger } from '@/components/Lightbox';

export default function Hero() {
  return (
    <header className="hero" id="hero">
      <HeroMedia />

      <div className="top-bar">
        <div className="wordmark">
          <span className="wm-name">Pyari Kunj</span>
          <span className="wm-hindi" lang="hi">
            प्यारी कुंज
          </span>
        </div>
        <nav className="hero-links" aria-label="Section navigation">
          <a href="#home-story">The home</a>
          <a href="#spaces">Spaces</a>
          <a href="#reviews">Reviews</a>
          <a href="#location">Location</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="top-actions">
          <a
            className="ghost-btn icon-only"
            href="https://www.instagram.com/pyari_kunj"
            target="_blank"
            rel="noopener"
            aria-label="Pyari Kunj on Instagram"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          <ShareButton />
        </div>
      </div>

      <div className="hero-content">
        {/* Filled from /api/coupon with whichever code the host has featured on
            /coupon, and hidden entirely when nothing is running. */}
        <OfferStrip />

        <p className="hero-overline">Vrindavan · 650 m from Shri Banke Bihari Ji</p>
        <h1 className="hero-title">
          A heritage homestay near Banke Bihari Temple, Vrindavan
        </h1>
        <p className="hero-meta">
          Entire 1BHK{' '}
          <span className="hm-dot" aria-hidden="true">
            ·
          </span>{' '}
          Sleeps 4{' '}
          <span className="hm-dot" aria-hidden="true">
            ·
          </span>{' '}
          Air-conditioned{' '}
          <span className="hm-dot" aria-hidden="true">
            ·
          </span>{' '}
          Free parking
        </p>
        <div className="hero-chip-row">
          <span className="hero-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            5.0 · Guest Favourite
          </span>
          <PhotoTrigger photoIndex={0} className="ghost-btn js-photo">
            View all 21 photos
          </PhotoTrigger>
        </div>
      </div>
    </header>
  );
}
