'use client';

/* Mirrors the inline browser PageView to the Conversions API once, after a short
   delay — the _fbp/_fbc cookies the Pixel sets are what make the server-side copy
   match, and they do not exist the instant the page loads. */

import { useEffect } from 'react';

import { sendPageViewCapi } from '@/booking/tracking';

export default function PageViewCapi() {
  useEffect(() => {
    const t = setTimeout(sendPageViewCapi, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
