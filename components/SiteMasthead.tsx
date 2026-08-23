/* The slim velvet header the non-home routes use in place of the hero.
   Server component — it is a wordmark and two links, nothing to hydrate. */

import Link from 'next/link';

export default function SiteMasthead({ cta = true }: { cta?: boolean }) {
  return (
    <header className="site-masthead">
      <Link href="/" className="wordmark" aria-label="Pyari Kunj — back to the homepage">
        <span className="wm-name">Pyari Kunj</span>
        <span className="wm-hindi" lang="hi">
          प्यारी कुंज
        </span>
      </Link>
      {cta && (
        <Link href="/#book" className="ghost-btn">
          Check dates
        </Link>
      )}
    </header>
  );
}
