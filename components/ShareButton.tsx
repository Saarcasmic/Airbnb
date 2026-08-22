'use client';

import { CONFIG } from '@/booking/config';
import { safeTrack } from '@/booking/tracking';

export default function ShareButton() {
  return (
    <button
      type="button"
      className="ghost-btn icon-only"
      aria-label="Share this page"
      onClick={() => {
        safeTrack('share_clicked', {});
        if (navigator.share) {
          navigator
            .share({ title: CONFIG.propertyName + ' – Homestay', url: window.location.href })
            .catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).catch(() => {});
        }
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
    </button>
  );
}
