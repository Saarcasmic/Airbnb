import FadeUp from '@/components/FadeUp';

export default function FollowAlong() {
  return (
    <section className="section on-deep" id="instagram">
      <div className="shell follow-grid">
        <FadeUp className="follow-copy">
          <h2 className="h-display">Pyari Kunj, in motion</h2>
          <p className="lede">The house, the lanes, and the little rituals of hosting — we keep a small journal of it all on Instagram.</p>
          <a className="btn-outline-ink follow-btn" href="https://www.instagram.com/pyari_kunj" target="_blank" rel="noopener">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            Follow @pyari_kunj
          </a>
        </FadeUp>
        <FadeUp className="ig-moment">
          <div className="ig-frame">
            <iframe src="https://www.instagram.com/reel/DZpqs34CB1F/embed/" title="Instagram reel: a tour of Pyari Kunj Vrindavan" loading="lazy" allowFullScreen scrolling="no"></iframe>
          </div>
          <div className="ig-bar">
            <svg className="ig-glyph" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            <span className="ig-text">The home, in 30 seconds</span>
            <a className="ig-open" href="https://www.instagram.com/reel/DZpqs34CB1F/" target="_blank" rel="noopener">Watch on Instagram</a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
