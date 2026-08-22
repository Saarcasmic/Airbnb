import FadeUp from '@/components/FadeUp';

export default function Host() {
  return (
    <section className="section on-deep" id="host">
      <div className="shell host-grid">
        <FadeUp>
          <h2 className="h-display">Looked after, personally</h2>
          <div className="host-card">
            <img className="host-avatar" src="/img/host-saar.webp" alt="Saar, your host" width="64" height="64" loading="lazy" decoding="async" />
            <div>
              <div className="host-name">Hosted by Saar</div>
              <div className="host-meta">100% response rate · replies within an hour<br />Caretaker Dinesh Ji welcomes you on site</div>
            </div>
          </div>
        </FadeUp>
        <FadeUp as="ul" className="trust-list">
          <li>
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <span><strong>Full refund if unavailable.</strong> In the rare case your dates aren't free after booking, you're refunded in full — no questions asked.</span>
          </li>
          <li>
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
            <span><strong>Secure payments by Razorpay.</strong> UPI, cards, and netbanking are processed by Razorpay; this site never stores your payment details.</span>
          </li>
        </FadeUp>
      </div>
    </section>
  );
}
