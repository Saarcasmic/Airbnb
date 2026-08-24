export default function Footer() {
  return (
    <footer className="footer">
      <div className="toran" aria-hidden="true"></div>
      <div className="shell">
        <div>
          <div className="f-wordmark">Pyari Kunj <span className="f-hindi" lang="hi">प्यारी कुंज</span></div>
          <p className="f-tag">A 1BHK heritage homestay near Shri Banke Bihari Temple, Vrindavan, Uttar Pradesh.</p>
          <address className="f-contact">
            <span className="f-contact-row">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              6, Malti Kunj, Rattan Chatri, Vrindavan - 281121
            </span>
            <a className="f-contact-row f-phone" href="tel:+918791567123">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
              +91 8791567123
            </a>
          </address>
        </div>
        <nav className="f-links" aria-label="Footer">
          <a href="/vrindavan-festival-calendar">Festival calendar</a>
          <a href="/temples-near-pyari-kunj">Temples nearby</a>
          <a href="/getting-to-vrindavan">Getting here</a>
          <a href="/privacy-policy">Privacy policy</a>
          <a href="/terms-and-booking">Terms and booking</a>
          <a href="https://www.instagram.com/pyari_kunj" target="_blank" rel="noopener">Instagram</a>
        </nav>
        <p className="f-legal">© Pyari Kunj Vrindavan · Homestay in Vrindavan, Uttar Pradesh</p>
      </div>
    </footer>
  );
}
