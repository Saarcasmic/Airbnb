'use client';

/* First/last-touch attribution capture. The stored `attribution_last` is what the
   WhatsApp fallback messages quote back to the host, so a guest arriving from an
   ad is recognisable in the thread. */

import { useEffect } from 'react';

const FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'msclkid',
] as const;

export default function Attribution() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const current: Record<string, string> = {};
      FIELDS.forEach((k) => {
        const v = params.get(k);
        if (v) current[k] = v;
      });
      if (!Object.keys(current).length) return;
      current.captured_at = new Date().toISOString();
      current.landing_url = window.location.href;
      localStorage.setItem('attribution_last', JSON.stringify(current));
      if (!localStorage.getItem('attribution_first')) {
        localStorage.setItem('attribution_first', JSON.stringify(current));
      }
    } catch {
      /* private mode — attribution is best-effort */
    }
  }, []);
  return null;
}
