import FadeUp from '@/components/FadeUp';
import { REVIEWS, REVIEW_CATEGORIES } from '@/content/reviews';

/* The rail is a horizontal scroller of the actual review screenshots — the
   proof is that they are unretouched, so they stay images rather than text.
   role="region" + tabindex makes it keyboard-scrollable. */

export default function Reviews() {
  return (
    <section className="section on-velvet" id="reviews">
      <div className="toran" aria-hidden="true"></div>
      <div className="shell">
        <FadeUp className="section-head">
          <h2 className="h-display">Five stars. Every stay so far.</h2>
          <p className="reviews-sub">Every guest so far has left five stars. Straight from real stays:</p>
        </FadeUp>
        <FadeUp className="shot-rail" role="region" aria-label="Guest review screenshots" tabIndex={0}>
          {REVIEWS.map((review) => (
            <figure className="shot-card" key={review.screenshot}>
              <img src={review.screenshot} width={review.width} height={review.height} alt={review.alt} loading="lazy" decoding="async" />
            </figure>
          ))}
        </FadeUp>
        <FadeUp as="dl" className="cat-row">
          {REVIEW_CATEGORIES.map((category) => (
            <div className="cat-cell" key={category.label}><dt>{category.label}</dt><dd>{category.score}</dd></div>
          ))}
        </FadeUp>
        <FadeUp className="ig-moment">
          <div className="ig-frame">
            <iframe src="https://www.instagram.com/reel/DZFPb9auIH7/embed/" title="Instagram reel: a guest's review of their stay at Pyari Kunj" loading="lazy" allowFullScreen scrolling="no"></iframe>
          </div>
          <div className="ig-bar">
            <svg className="ig-glyph" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            <span className="ig-text">A guest filmed their stay</span>
            <a className="ig-open" href="https://www.instagram.com/reel/DZFPb9auIH7/" target="_blank" rel="noopener">Watch on Instagram</a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
