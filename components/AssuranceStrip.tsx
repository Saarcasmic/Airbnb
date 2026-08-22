export default function AssuranceStrip() {
  return (
    <section className="assure" aria-label="Direct booking benefits">
      <div className="shell">
        <ul className="assure-row">
          <li>
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84z"/><circle cx="7" cy="7" r="1.5"/></svg>
            <span><strong>The price you see is the price you pay.</strong> No taxes, cleaning, or service fees — and offer codes apply right at checkout.</span>
          </li>
          <li>
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
            <span><strong>Confirmed instantly.</strong> Your reservation is in the moment payment completes; check-in details arrive on WhatsApp.</span>
          </li>
          <li>
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
            <span><strong>Pay your way.</strong> UPI, card, or netbanking through Razorpay's encrypted checkout.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
