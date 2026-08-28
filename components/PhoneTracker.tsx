'use client';

/* Reports taps on `tel:` links.

   Delegated from the document rather than wired into each anchor on purpose: the
   four phone links live in the footer and the three legal/guide pages, all of
   which are server components. An onClick would have forced each of them — the
   footer above all, which renders on every route — across the client boundary
   for one analytics call. A single listener costs nothing, keeps those files
   untouched, and picks up any phone link added later for free. */

import { useEffect } from 'react';

import { safeTrack } from '@/booking/tracking';

export default function PhoneTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (!link) return;
      safeTrack('phone_tapped', {
        /* Which surface produced the tap — the footer converts very differently
           from an in-body link on /getting-to-vrindavan. */
        location: window.location.pathname,
        placement: link.closest('.footer') ? 'footer' : 'body',
      });
    }

    /* Capture phase: the tap hands off to the dialer immediately, and a listener
       on the bubble can be beaten by that navigation. */
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
