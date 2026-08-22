/* ================= TRACKING ================= */

type TrackProps = Record<string, unknown>;
type QueuedTrack = [string, TrackProps];
type MetaUserData = { em?: string; ph?: string };

declare global {
  interface Window {
    posthog?: { capture?: (eventName: string, properties?: TrackProps) => void };
    fbq?: (...args: unknown[]) => void;
    /* Events captured before the PostHog snippet finished loading. */
    __phQueue?: QueuedTrack[];
    /* eventID of the browser PageView, minted inline in the document head. */
    __pkPV?: string;
    flushQueuedTracks?: () => void;
  }
}

/* js/app.js seeded this at load; the seeding is lazy now so the module can be
   evaluated during SSR without touching `window`. An existing queue (the inline
   head snippet may have started one) is always kept. */
function phQueue(): QueuedTrack[] {
  const existing = window.__phQueue;
  if (existing) return existing;
  const created: QueuedTrack[] = [];
  window.__phQueue = created;
  return created;
}

export function safeTrack(eventName: string, properties?: TrackProps): void {
  if (typeof window === 'undefined') return;
  const props = properties || {};
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(eventName, props);
    return;
  }
  phQueue().push([eventName, props]);
}

export function flushQueuedTracks(): void {
  if (typeof window === 'undefined') return;
  const ph = window.posthog;
  if (!ph || typeof ph.capture !== 'function' || !Array.isArray(window.__phQueue)) return;
  while (window.__phQueue.length) {
    const nextEvent = window.__phQueue.shift();
    if (nextEvent) ph.capture(nextEvent[0], nextEvent[1] || {});
  }
}
/* The PostHog init snippet in the document calls window.flushQueuedTracks() if
   it is there, so it still has to be published on window. */
if (typeof window !== 'undefined') window.flushQueuedTracks = flushQueuedTracks;

/* Meta dual-send: Pixel (browser) + CAPI (server) share ONE eventID so Meta
   deduplicates the two copies. Purchase is NEVER sent from here — it is fired
   server-side only, from a verified & captured Razorpay payment. */
export function getCookie(name: string): string | null {
  const m = document.cookie.match('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
  return m ? decodeURIComponent(m[1]) : null;
}
export function uuid(): string {
  return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : 'e-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
export function metaUserData(): { fbp: string | null; fbc: string | null } {
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');
  if (!fbc) {
    try {
      const cid = new URLSearchParams(location.search).get('fbclid');
      if (cid) fbc = 'fb.1.' + Date.now() + '.' + cid;
    } catch (e) {}
  }
  return { fbp: fbp, fbc: fbc };
}
export function sendCapi(eventName: string, id: string, customData?: TrackProps, userData?: MetaUserData | null): void {
  const ud = metaUserData();
  const payload: {
    event_name: string; event_id: string; event_source_url: string;
    custom_data: TrackProps; fbp: string | null; fbc: string | null;
    em?: string; ph?: string;
  } = {
    event_name: eventName, event_id: id, event_source_url: location.href,
    custom_data: customData || {}, fbp: ud.fbp, fbc: ud.fbc
  };
  if (userData && userData.em) payload.em = userData.em;
  if (userData && userData.ph) payload.ph = userData.ph;
  try {
    // keepalive: the tab may be navigating away (WhatsApp hand-off, Razorpay).
    fetch('/api/meta-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), keepalive: true
    }).catch(function () {});
  } catch (e) {}
}
export function metaTrack(eventName: string, customData?: TrackProps, userData?: MetaUserData | null): void {
  const id = uuid();
  try { if (window.fbq) window.fbq('track', eventName, customData || {}, { eventID: id }); } catch (e) {}
  sendCapi(eventName, id, customData || {}, userData);
}
// Browser PageView already fired inline (window.__pkPV); mirror it to CAPI once.
export function sendPageViewCapi(): void { if (window.__pkPV) sendCapi('PageView', window.__pkPV, {}, null); }
